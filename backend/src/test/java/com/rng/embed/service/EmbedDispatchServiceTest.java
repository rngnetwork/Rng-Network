package com.rng.embed.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.rng.common.exception.ForbiddenException;
import com.rng.embed.domain.DispatchLog;
import com.rng.embed.domain.DispatchType;
import com.rng.embed.dto.DispatchEmbedRequest;
import com.rng.embed.dto.DispatchResponse;
import com.rng.embed.dto.DryRunValidationResponse;
import com.rng.embed.repository.DispatchLogRepository;
import com.rng.identity.domain.User;
import com.rng.identity.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EmbedDispatchServiceTest {

    @Mock
    private DiscordDispatchService discordDispatchService;

    @Mock
    private PreFlightValidatorService validatorService;

    @Mock
    private RedisRateLimiterService rateLimiterService;

    @Mock
    private RedisScheduledDispatchService scheduledDispatchService;

    @Mock
    private DispatchLogRepository dispatchLogRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private com.rng.server.client.DiscordServerClient discordServerClient;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private EmbedDispatchService dispatchService;

    @BeforeEach
    void setUp() {
        dispatchService = new EmbedDispatchService(
                discordDispatchService,
                validatorService,
                rateLimiterService,
                scheduledDispatchService,
                dispatchLogRepository,
                userRepository,
                null,
                discordServerClient
        );
    }

    @Test
    @DisplayName("Immediate dispatch throws ForbiddenException when operator account is deactivated")
    void dispatchImmediate_deactivatedThrows() {
        User deactivatedUser = User.builder()
                .id(1L)
                .email("deactivated@rng.com")
                .status("INACTIVE")
                .build();
        when(userRepository.findById(1L)).thenReturn(Optional.of(deactivatedUser));

        DispatchEmbedRequest request = new DispatchEmbedRequest(
                "guild_1", "chan_1", DispatchType.IMMEDIATE, null, Map.of("flags", 32768), null
        );

        assertThatThrownBy(() -> dispatchService.dispatchImmediate(1L, request, null))
                .isInstanceOf(ForbiddenException.class)
                .hasMessageContaining("Operator account is deactivated");
    }

    @Test
    @DisplayName("Immediate dispatch succeeds for active operator even without linked personal Discord")
    void dispatchImmediate_unlinkedDiscordAllowed() throws Exception {
        User unlinkedUser = User.builder()
                .id(1L)
                .email("unlinked@rng.com")
                .status("ACTIVE")
                .discordLinked(false)
                .discordId(null)
                .build();
        when(userRepository.findById(1L)).thenReturn(Optional.of(unlinkedUser));

        when(validatorService.validate(anyString(), anyString(), anyMap()))
                .thenReturn(DryRunValidationResponse.builder().isValid(true).build());

        when(discordDispatchService.dispatchToChannel(eq("chan_1"), anyMap(), anyList()))
                .thenReturn(objectMapper.readTree("{\"id\":\"1122334455\"}"));

        DispatchEmbedRequest request = new DispatchEmbedRequest(
                "guild_1", "chan_1", DispatchType.IMMEDIATE, null, Map.of("flags", 32768), null
        );

        DispatchResponse response = dispatchService.dispatchImmediate(1L, request, null);
        assertThat(response).isNotNull();
        assertThat(response.discordMessageId()).isEqualTo("1122334455");
    }

    @Test
    @DisplayName("Immediate dispatch executes and persists log when operator is authorized and verified")
    void dispatchImmediate_success() throws Exception {
        User linkedUser = User.builder()
                .id(1L)
                .email("operator@rng.com")
                .status("ACTIVE")
                .discordLinked(true)
                .discordId("discord_123456789")
                .build();
        when(userRepository.findById(1L)).thenReturn(Optional.of(linkedUser));

        when(validatorService.validate(anyString(), anyString(), anyMap()))
                .thenReturn(DryRunValidationResponse.builder().isValid(true).build());

        when(discordDispatchService.dispatchToChannel(eq("chan_1"), anyMap(), anyList()))
                .thenReturn(objectMapper.readTree("{\"id\":\"1122334455\"}"));

        DispatchEmbedRequest request = new DispatchEmbedRequest(
                "guild_1", "chan_1", DispatchType.IMMEDIATE, null, Map.of("flags", 32768), null
        );

        DispatchResponse response = dispatchService.dispatchImmediate(1L, request, null);

        assertThat(response).isNotNull();
        assertThat(response.discordMessageId()).isEqualTo("1122334455");
        verify(dispatchLogRepository).save(any(DispatchLog.class));
        verify(rateLimiterService).checkRateLimits(eq("guild_1"), eq("chan_1"), eq("1"));
    }
}
