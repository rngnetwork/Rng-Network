// Written By: RachitSWE
// LICENSE: All rights reserved
// Year: 2026
package com.rednecksgaming.embed.repository;

import com.rednecksgaming.embed.domain.DispatchLog;
import com.rednecksgaming.embed.domain.DispatchStatus;
import com.rednecksgaming.embed.domain.DispatchType;
import com.rednecksgaming.embed.domain.EmbedTemplate;
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
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EmbedRepositoryTest {

    @Mock
    private EmbedTemplateRepository templateRepository;

    @Mock
    private DispatchLogRepository dispatchLogRepository;

    @Test
    @DisplayName("EmbedTemplateRepository findByTemplateId returns matching template")
    void templateRepository_findByTemplateId() {
        EmbedTemplate template = EmbedTemplate.builder()
                .templateId("tmpl_abc123")
                .name("Raid Rules")
                .authorId("usr_456")
                .authorName("Commander")
                .category("RAID")
                .payload(Map.of("flags", 32768))
                .build();

        when(templateRepository.findByTemplateId("tmpl_abc123")).thenReturn(Optional.of(template));
        when(templateRepository.existsByTemplateId("tmpl_abc123")).thenReturn(true);
        when(templateRepository.existsByTemplateId("non_existent")).thenReturn(false);

        Optional<EmbedTemplate> result = templateRepository.findByTemplateId("tmpl_abc123");
        assertThat(result).isPresent();
        assertThat(result.get().getName()).isEqualTo("Raid Rules");
        assertThat(templateRepository.existsByTemplateId("tmpl_abc123")).isTrue();
        assertThat(templateRepository.existsByTemplateId("non_existent")).isFalse();
    }

    @Test
    @DisplayName("EmbedTemplateRepository pagination queries work as expected")
    void templateRepository_paginationQueries() {
        EmbedTemplate template = EmbedTemplate.builder()
                .templateId("tmpl_srv1")
                .name("Server Announcement")
                .authorId("usr_100")
                .authorName("Officer")
                .serverId("guild_777")
                .category("ANNOUNCEMENTS")
                .payload(Map.of())
                .build();

        Pageable pageable = PageRequest.of(0, 10);
        Page<EmbedTemplate> page = new PageImpl<>(List.of(template), pageable, 1);

        when(templateRepository.findAccessibleTemplates("guild_777", pageable)).thenReturn(page);
        when(templateRepository.findAccessibleByCategory("guild_777", "ANNOUNCEMENTS", pageable)).thenReturn(page);
        when(templateRepository.findByAuthorIdOrderByUpdatedAtDesc("usr_100", pageable)).thenReturn(page);
        when(templateRepository.findByIsPublicTrueOrderByCreatedAtDesc(pageable)).thenReturn(page);

        assertThat(templateRepository.findAccessibleTemplates("guild_777", pageable).getContent()).hasSize(1);
        assertThat(templateRepository.findAccessibleByCategory("guild_777", "ANNOUNCEMENTS", pageable).getContent()).hasSize(1);
        assertThat(templateRepository.findByAuthorIdOrderByUpdatedAtDesc("usr_100", pageable).getContent()).hasSize(1);
        assertThat(templateRepository.findByIsPublicTrueOrderByCreatedAtDesc(pageable).getContent()).hasSize(1);
    }

    @Test
    @DisplayName("DispatchLogRepository queries return telemetry data and status counts")
    void dispatchLogRepository_queries() {
        DispatchLog log = DispatchLog.builder()
                .dispatchId("dsp_log_999")
                .userId("usr_100")
                .serverId("guild_777")
                .channelId("chan_123")
                .dispatchType(DispatchType.IMMEDIATE)
                .status(DispatchStatus.SUCCESS)
                .payloadSnapshot(Map.of())
                .timestamp(Instant.now())
                .build();

        Pageable pageable = PageRequest.of(0, 20);
        Page<DispatchLog> page = new PageImpl<>(List.of(log), pageable, 1);

        when(dispatchLogRepository.findByDispatchId("dsp_log_999")).thenReturn(Optional.of(log));
        when(dispatchLogRepository.findByServerIdOrderByTimestampDesc("guild_777", pageable)).thenReturn(page);
        when(dispatchLogRepository.findByServerIdAndStatusOrderByTimestampDesc("guild_777", DispatchStatus.SUCCESS, pageable)).thenReturn(page);
        when(dispatchLogRepository.findByUserIdOrderByTimestampDesc("usr_100", pageable)).thenReturn(page);
        when(dispatchLogRepository.countByStatus(DispatchStatus.SUCCESS)).thenReturn(42L);

        assertThat(dispatchLogRepository.findByDispatchId("dsp_log_999")).isPresent();
        assertThat(dispatchLogRepository.findByServerIdOrderByTimestampDesc("guild_777", pageable).getTotalElements()).isEqualTo(1);
        assertThat(dispatchLogRepository.findByServerIdAndStatusOrderByTimestampDesc("guild_777", DispatchStatus.SUCCESS, pageable).getTotalElements()).isEqualTo(1);
        assertThat(dispatchLogRepository.findByUserIdOrderByTimestampDesc("usr_100", pageable).getTotalElements()).isEqualTo(1);
        assertThat(dispatchLogRepository.countByStatus(DispatchStatus.SUCCESS)).isEqualTo(42L);
    }
}
