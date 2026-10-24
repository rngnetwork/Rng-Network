package com.rednecksgaming.botmodule;

import com.rednecksgaming.botmodule.model.BotModuleAuditLogDocument;
import com.rednecksgaming.botmodule.model.BotModuleDocument;
import com.rednecksgaming.botmodule.repository.BotModuleAuditLogRepository;
import com.rednecksgaming.botmodule.repository.BotModuleRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BotModuleRepositoryTest {

    @Mock
    private BotModuleRepository botModuleRepository;

    @Mock
    private BotModuleAuditLogRepository botModuleAuditLogRepository;

    @Test
    @DisplayName("BotModuleRepository findByScope returns network document")
    void botModuleRepository_findByScope() {
        BotModuleDocument doc = BotModuleDocument.builder()
                .id("bm_net_1")
                .scope("NETWORK")
                .serverId(null)
                .modules(Map.of("automod", Map.of("antiSpam", true)))
                .version(1L)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .lastModifiedBy("usr_commander")
                .build();

        when(botModuleRepository.findByScope("NETWORK")).thenReturn(Optional.of(doc));
        when(botModuleRepository.findByScope("UNKNOWN")).thenReturn(Optional.empty());

        Optional<BotModuleDocument> result = botModuleRepository.findByScope("NETWORK");
        assertThat(result).isPresent();
        assertThat(result.get().getScope()).isEqualTo("NETWORK");
        assertThat(result.get().getServerId()).isNull();
        assertThat(result.get().getModules()).containsKey("automod");
        assertThat(result.get().getVersion()).isEqualTo(1L);

        Optional<BotModuleDocument> emptyResult = botModuleRepository.findByScope("UNKNOWN");
        assertThat(emptyResult).isEmpty();
    }

    @Test
    @DisplayName("BotModuleRepository findByScopeAndServerId handles server specific modules")
    void botModuleRepository_findByScopeAndServerId() {
        BotModuleDocument doc = BotModuleDocument.builder()
                .id("bm_srv_1")
                .scope("SERVER")
                .serverId("guild_12345")
                .modules(Map.of("leveling", Map.of("enabled", true)))
                .version(2L)
                .build();

        when(botModuleRepository.findByScopeAndServerId("SERVER", "guild_12345")).thenReturn(Optional.of(doc));
        when(botModuleRepository.existsByScopeAndServerId("SERVER", "guild_12345")).thenReturn(true);
        when(botModuleRepository.existsByScopeAndServerId("SERVER", "guild_99999")).thenReturn(false);

        Optional<BotModuleDocument> result = botModuleRepository.findByScopeAndServerId("SERVER", "guild_12345");
        assertThat(result).isPresent();
        assertThat(result.get().getServerId()).isEqualTo("guild_12345");
        assertThat(botModuleRepository.existsByScopeAndServerId("SERVER", "guild_12345")).isTrue();
        assertThat(botModuleRepository.existsByScopeAndServerId("SERVER", "guild_99999")).isFalse();

        botModuleRepository.deleteByScopeAndServerId("SERVER", "guild_12345");
        verify(botModuleRepository, times(1)).deleteByScopeAndServerId("SERVER", "guild_12345");
    }

    @Test
    @DisplayName("BotModuleAuditLogRepository paginates logs by scope, serverId, and actorId")
    void botModuleAuditLogRepository_paginationQueries() {
        BotModuleAuditLogDocument logDoc = BotModuleAuditLogDocument.builder()
                .id("audit_1")
                .scope("SERVER")
                .serverId("guild_12345")
                .actorId("actor_777")
                .actorName("AdminUser")
                .action("UPDATE_SERVER")
                .moduleName("automod")
                .payloadDiff(Map.of("antiSpam", true))
                .timestamp(Instant.now())
                .build();

        Pageable pageable = PageRequest.of(0, 10);
        Page<BotModuleAuditLogDocument> page = new PageImpl<>(List.of(logDoc), pageable, 1);

        when(botModuleAuditLogRepository.findByScopeAndServerId("SERVER", "guild_12345", pageable)).thenReturn(page);
        when(botModuleAuditLogRepository.findByScope("NETWORK", pageable)).thenReturn(page);
        when(botModuleAuditLogRepository.findByActorId("actor_777", pageable)).thenReturn(page);

        assertThat(botModuleAuditLogRepository.findByScopeAndServerId("SERVER", "guild_12345", pageable).getContent()).hasSize(1);
        assertThat(botModuleAuditLogRepository.findByScope("NETWORK", pageable).getContent()).hasSize(1);
        assertThat(botModuleAuditLogRepository.findByActorId("actor_777", pageable).getContent()).hasSize(1);
    }
}
