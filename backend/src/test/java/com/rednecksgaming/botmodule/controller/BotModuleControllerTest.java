package com.rednecksgaming.botmodule.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.rednecksgaming.botmodule.dto.BotModuleConfigRequest;
import com.rednecksgaming.botmodule.service.BotModuleService;
import com.rednecksgaming.common.dto.ApiResponse;
import com.rednecksgaming.common.exception.GlobalExceptionHandler;
import com.rednecksgaming.identity.domain.User;
import com.rednecksgaming.identity.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

import static org.hamcrest.Matchers.is;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class BotModuleControllerTest {

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Mock
    private BotModuleService botModuleService;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private BotModuleController botModuleController;

    private Authentication mockAuth;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(botModuleController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();

        mockAuth = new UsernamePasswordAuthenticationToken(
                100L,
                "n/a",
                List.of(new SimpleGrantedAuthority("ROLE_HIGH_COMMAND"))
        );

        User mockUser = User.builder()
                .id(100L)
                .email("commander@rng.com")
                .fullName("High Commander")
                .role("ROLE_HIGH_COMMAND")
                .roles("ROLE_HIGH_COMMAND")
                .discordId("111222333444555666")
                .build();

        lenient().when(userRepository.findById(100L)).thenReturn(Optional.of(mockUser));
    }

    @Test
    @DisplayName("GET /api/v1/bot-modules/network returns network default configurations")
    void getNetworkDefaultModules_returns200() throws Exception {
        Map<String, Object> defaults = Map.of("automod", Map.of("antiSpam", true));
        when(botModuleService.getNetworkDefaultModules()).thenReturn(defaults);

        mockMvc.perform(get("/api/v1/bot-modules/network").principal(mockAuth))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.automod.antiSpam", is(true)));
    }

    @Test
    @DisplayName("PATCH /api/v1/bot-modules/network resolves identity server-side and updates defaults")
    void patchNetworkDefaultModules_success() throws Exception {
        Map<String, Object> patch = Map.of("automod", Map.of("antiSpam", false));
        BotModuleConfigRequest request = BotModuleConfigRequest.builder().modules(patch).build();

        when(botModuleService.updateNetworkDefaultModules(eq("111222333444555666"), eq("High Commander"), eq(patch)))
                .thenReturn(Map.of("status", "ok"));

        mockMvc.perform(patch("/api/v1/bot-modules/network")
                        .principal(mockAuth)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)));

        verify(botModuleService).updateNetworkDefaultModules("111222333444555666", "High Commander", patch);
    }

    @Test
    @DisplayName("PATCH /api/v1/bot-modules/network returns 400 when modules payload is missing")
    void patchNetworkDefaultModules_validationError() throws Exception {
        mockMvc.perform(patch("/api/v1/bot-modules/network")
                        .principal(mockAuth)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success", is(false)));
    }

    @Test
    @DisplayName("GET /api/v1/servers/{serverSlug}/bot-modules returns server effective configuration")
    void getServerEffectiveModules_returns200() throws Exception {
        Map<String, Object> effective = Map.of(
                "serverId", "123456789012345678",
                "guildId", "123456789012345678",
                "serverSlug", "roughnuts",
                "modules", Map.of("automod", Map.of("isOverridden", true))
        );
        when(botModuleService.getServerEffectiveModules("roughnuts")).thenReturn(effective);

        mockMvc.perform(get("/api/v1/servers/roughnuts/bot-modules").principal(mockAuth))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.serverSlug", is("roughnuts")))
                .andExpect(jsonPath("$.data.guildId", is("123456789012345678")));
    }

    @Test
    @DisplayName("PATCH /api/v1/servers/{serverSlug}/bot-modules applies server override patch")
    void patchServerModules_success() throws Exception {
        Map<String, Object> patch = Map.of("automod", Map.of("antiSpam", true));
        BotModuleConfigRequest request = BotModuleConfigRequest.builder().modules(patch).build();

        when(botModuleService.updateServerModules(eq("roughnuts"), eq("111222333444555666"), eq("High Commander"), eq(patch)))
                .thenReturn(Map.of("status", "ok"));

        mockMvc.perform(patch("/api/v1/servers/roughnuts/bot-modules")
                        .principal(mockAuth)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)));

        verify(botModuleService).updateServerModules("roughnuts", "111222333444555666", "High Commander", patch);
    }

    @Test
    @DisplayName("DELETE /api/v1/servers/{serverSlug}/bot-modules/{moduleName} resets module to default")
    void resetServerModule_success() throws Exception {
        when(botModuleService.resetServerModule(eq("roughnuts"), eq("automod"), eq("111222333444555666"), eq("High Commander")))
                .thenReturn(Map.of("status", "reset"));

        mockMvc.perform(delete("/api/v1/servers/roughnuts/bot-modules/automod").principal(mockAuth))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)));

        verify(botModuleService).resetServerModule("roughnuts", "automod", "111222333444555666", "High Commander");
    }
}
