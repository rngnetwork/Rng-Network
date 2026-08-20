package com.rng.api;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.rng.common.security.SecurityConstants;
import com.rng.common.security.TokenService;
import com.rng.identity.domain.AuthProvider;
import com.rng.identity.domain.User;
import com.rng.identity.dto.UpdateWhitelistedUserRequest;
import com.rng.identity.dto.WhitelistUserRequest;
import com.rng.identity.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class WhitelistIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TokenService tokenService;

    private User highCommand;
    private User ministerTech;
    private User regularDev;
    private User internalAgent;

    private String highCommandToken;
    private String ministerTechToken;
    private String regularDevToken;

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();

        highCommand = userRepository.save(User.builder()
                .email("arzenic@rednecksgaming.com")
                .fullName("Arzenic")
                .provider(AuthProvider.EMAIL)
                .role("ROLE_HIGH_COMMAND")
                .designations("Supreme")
                .roles("High Command")
                .status("ACTIVE")
                .build());

        ministerTech = userRepository.save(User.builder()
                .email("minister.tech@rng.com")
                .fullName("Tech Minister")
                .provider(AuthProvider.EMAIL)
                .role("ROLE_MINISTER")
                .designations("Ministry of Tech")
                .roles("Minister")
                .status("ACTIVE")
                .build());

        regularDev = userRepository.save(User.builder()
                .email("dev@rng.com")
                .fullName("Junior Dev")
                .provider(AuthProvider.EMAIL)
                .role("ROLE_USER")
                .designations("Ministry of Tech")
                .roles("Junior Dev")
                .status("ACTIVE")
                .build());

        internalAgent = userRepository.save(User.builder()
                .email("agent@rng.com")
                .fullName("Agent 007")
                .provider(AuthProvider.EMAIL)
                .role("ROLE_USER")
                .designations("Ministry of Internal affairs")
                .roles("agent")
                .status("ACTIVE")
                .build());

        highCommandToken = tokenService.generateAccessToken(highCommand.getId(), highCommand.getEmail(), highCommand.getRole());
        ministerTechToken = tokenService.generateAccessToken(ministerTech.getId(), ministerTech.getEmail(), ministerTech.getRole());
        regularDevToken = tokenService.generateAccessToken(regularDev.getId(), regularDev.getEmail(), regularDev.getRole());
    }

    @Test
    @DisplayName("GET /api/v1/whitelist - High Command views all whitelisted users")
    void testHighCommandViewsAllWhitelistedUsers() throws Exception {
        mockMvc.perform(get("/api/v1/whitelist")
                        .header(SecurityConstants.AUTHORIZATION_HEADER, "Bearer " + highCommandToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data", hasSize(4)))
                .andExpect(jsonPath("$.data[*].email", hasItems(
                        "arzenic@rednecksgaming.com",
                        "minister.tech@rng.com",
                        "dev@rng.com",
                        "agent@rng.com"
                )));
    }

    @Test
    @DisplayName("GET /api/v1/whitelist - Minister views only users in their Ministry")
    void testMinisterViewsOnlyOwnMinistry() throws Exception {
        mockMvc.perform(get("/api/v1/whitelist")
                        .header(SecurityConstants.AUTHORIZATION_HEADER, "Bearer " + ministerTechToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data", hasSize(2)))
                .andExpect(jsonPath("$.data[*].email", containsInAnyOrder("minister.tech@rng.com", "dev@rng.com")));
    }

    @Test
    @DisplayName("GET /api/v1/whitelist - Regular user is forbidden")
    void testRegularUserForbidden() throws Exception {
        mockMvc.perform(get("/api/v1/whitelist")
                        .header(SecurityConstants.AUTHORIZATION_HEADER, "Bearer " + regularDevToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("POST /api/v1/whitelist - High Command creates multi-designation user")
    void testHighCommandCreatesUser() throws Exception {
        WhitelistUserRequest request = WhitelistUserRequest.builder()
                .email("chancellor@rng.com")
                .userName("Chancellor of Rivals")
                .provider(AuthProvider.EMAIL)
                .designations(List.of("Chancellory", "Ministry of Tech"))
                .roles(List.of("Chancellor of Rivals", "Senior Dev"))
                .build();

        mockMvc.perform(post("/api/v1/whitelist")
                        .header(SecurityConstants.AUTHORIZATION_HEADER, "Bearer " + highCommandToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.email", is("chancellor@rng.com")))
                .andExpect(jsonPath("$.data.designations", hasItems("Chancellory", "Ministry of Tech")))
                .andExpect(jsonPath("$.data.roles", hasItems("Chancellor of Rivals", "Senior Dev")));
    }

    @Test
    @DisplayName("POST /api/v1/whitelist - Minister cannot assign other Ministries")
    void testMinisterCannotAssignOtherMinistries() throws Exception {
        WhitelistUserRequest request = WhitelistUserRequest.builder()
                .email("imposter@rng.com")
                .userName("Imposter")
                .provider(AuthProvider.EMAIL)
                .designations(List.of("Ministry of Internal affairs"))
                .roles(List.of("agent"))
                .build();

        mockMvc.perform(post("/api/v1/whitelist")
                        .header(SecurityConstants.AUTHORIZATION_HEADER, "Bearer " + ministerTechToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message", containsString("Ministers may only assign their own Ministry")));
    }

    @Test
    @DisplayName("PUT /api/v1/whitelist/{id} - Minister cannot edit users from other Ministries")
    void testMinisterCannotEditOtherMinistryUsers() throws Exception {
        UpdateWhitelistedUserRequest request = UpdateWhitelistedUserRequest.builder()
                .userName("Tampered Agent")
                .designations(List.of("Ministry of Tech"))
                .roles(List.of("Junior Dev"))
                .build();

        mockMvc.perform(put("/api/v1/whitelist/" + internalAgent.getId())
                        .header(SecurityConstants.AUTHORIZATION_HEADER, "Bearer " + ministerTechToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message", containsString("Ministers can only edit users within their own Ministry")));
    }

    @Test
    @DisplayName("DELETE /api/v1/whitelist/{id} - Cannot delete High Command")
    void testCannotDeleteHighCommand() throws Exception {
        mockMvc.perform(delete("/api/v1/whitelist/" + highCommand.getId())
                        .header(SecurityConstants.AUTHORIZATION_HEADER, "Bearer " + highCommandToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message", containsString("High Command administrator accounts cannot be deleted")));
    }

    @Test
    @DisplayName("GET /api/v1/whitelist/hierarchy - Returns canonical hierarchy map")
    void testGetPersonnelHierarchy() throws Exception {
        mockMvc.perform(get("/api/v1/whitelist/hierarchy")
                        .header(SecurityConstants.AUTHORIZATION_HEADER, "Bearer " + highCommandToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.Supreme", hasItem("High Command")))
                .andExpect(jsonPath("$.data['Ministry of Tech']", hasItems("Minister", "Secretary", "Tech Specialist", "Senior Dev", "Junior Dev")));
    }
}
