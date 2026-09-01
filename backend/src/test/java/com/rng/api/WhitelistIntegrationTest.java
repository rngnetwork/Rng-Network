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

import com.rng.AbstractPostgresIntegrationTest;

class WhitelistIntegrationTest extends AbstractPostgresIntegrationTest {

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TokenService tokenService;

    private User chiefHighCommand;
    private User regularHighCommand;
    private User ministerTech;
    private User regularDev;
    private User internalAgent;

    private String chiefHighCommandToken;
    private String regularHighCommandToken;
    private String ministerTechToken;
    private String regularDevToken;

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();

        chiefHighCommand = userRepository.save(User.builder()
                .email("arzenic@rednecksgaming.com")
                .fullName("Arzenic")
                .provider(AuthProvider.EMAIL)
                .role("ROLE_HIGH_COMMAND")
                .designations("Supreme")
                .roles("High Command, Chief High Command")
                .status("ACTIVE")
                .build());

        regularHighCommand = userRepository.save(User.builder()
                .email("peer.hc@rng.com")
                .fullName("Peer HC")
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
                .roles("Agent")
                .status("ACTIVE")
                .build());

        chiefHighCommandToken = tokenService.generateAccessToken(chiefHighCommand.getId(), chiefHighCommand.getEmail(), chiefHighCommand.getRole());
        regularHighCommandToken = tokenService.generateAccessToken(regularHighCommand.getId(), regularHighCommand.getEmail(), regularHighCommand.getRole());
        ministerTechToken = tokenService.generateAccessToken(ministerTech.getId(), ministerTech.getEmail(), ministerTech.getRole());
        regularDevToken = tokenService.generateAccessToken(regularDev.getId(), regularDev.getEmail(), regularDev.getRole());
    }

    @Test
    @DisplayName("GET /api/v1/whitelist - High Command views all whitelisted users")
    void testHighCommandViewsAllWhitelistedUsers() throws Exception {
        mockMvc.perform(get("/api/v1/whitelist")
                        .header(SecurityConstants.AUTHORIZATION_HEADER, "Bearer " + chiefHighCommandToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data", hasSize(5)))
                .andExpect(jsonPath("$.data[*].email", hasItems(
                        "arzenic@rednecksgaming.com",
                        "peer.hc@rng.com",
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
                        .header(SecurityConstants.AUTHORIZATION_HEADER, "Bearer " + chiefHighCommandToken)
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
                .roles(List.of("Agent"))
                .build();

        mockMvc.perform(post("/api/v1/whitelist")
                        .header(SecurityConstants.AUTHORIZATION_HEADER, "Bearer " + ministerTechToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message", containsString("Ministers may only assign their own assigned ministries")));
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
                .andExpect(jsonPath("$.message", containsString("Ministers can only edit users within their own assigned Ministries")));
    }

    @Test
    @DisplayName("PUT /api/v1/whitelist/{id} - Chief High Command can edit regular High Command")
    void testChiefHighCommandCanEditRegularHighCommand() throws Exception {
        UpdateWhitelistedUserRequest request = UpdateWhitelistedUserRequest.builder()
                .userName("Updated Peer HC")
                .designations(List.of("Supreme", "Chancellory"))
                .roles(List.of("High Command", "Chancellor of Rivals"))
                .build();

        mockMvc.perform(put("/api/v1/whitelist/" + regularHighCommand.getId())
                        .header(SecurityConstants.AUTHORIZATION_HEADER, "Bearer " + chiefHighCommandToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.userName", is("Updated Peer HC")));
    }

    @Test
    @DisplayName("PUT /api/v1/whitelist/{id} - Regular High Command cannot edit other High Command")
    void testRegularHighCommandCannotEditOtherHighCommand() throws Exception {
        UpdateWhitelistedUserRequest request = UpdateWhitelistedUserRequest.builder()
                .userName("Tampered Chief")
                .designations(List.of("Supreme"))
                .roles(List.of("High Command"))
                .build();

        mockMvc.perform(put("/api/v1/whitelist/" + chiefHighCommand.getId())
                        .header(SecurityConstants.AUTHORIZATION_HEADER, "Bearer " + regularHighCommandToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message", containsString("High Command administrators cannot modify other High Command members")));
    }

    @Test
    @DisplayName("DELETE /api/v1/whitelist/{id} - Chief High Command can delete regular High Command")
    void testChiefHighCommandCanDeleteRegularHighCommand() throws Exception {
        mockMvc.perform(delete("/api/v1/whitelist/" + regularHighCommand.getId())
                        .header(SecurityConstants.AUTHORIZATION_HEADER, "Bearer " + chiefHighCommandToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)));
    }

    @Test
    @DisplayName("DELETE /api/v1/whitelist/{id} - Regular High Command cannot delete other High Command")
    void testRegularHighCommandCannotDeleteOtherHighCommand() throws Exception {
        mockMvc.perform(delete("/api/v1/whitelist/" + chiefHighCommand.getId())
                        .header(SecurityConstants.AUTHORIZATION_HEADER, "Bearer " + regularHighCommandToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message", containsString("Chief High Command administrator accounts cannot be deleted")));
    }

    @Test
    @DisplayName("GET /api/v1/whitelist/hierarchy - Returns canonical hierarchy map including Chief High Command")
    void testGetPersonnelHierarchy() throws Exception {
        mockMvc.perform(get("/api/v1/whitelist/hierarchy")
                        .header(SecurityConstants.AUTHORIZATION_HEADER, "Bearer " + chiefHighCommandToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.Supreme", hasItems("Chief High Command", "High Command")))
                .andExpect(jsonPath("$.data['Ministry of Tech']", hasItems("Minister", "Secretary", "Tech Specialist", "Senior Dev", "Junior Dev")));
    }
}
