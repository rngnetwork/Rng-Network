// Written By: RachitSWE
// LICENSE: All rights reserved
// Year: 2026
package com.rednecksgaming.embed.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.rednecksgaming.common.exception.BadRequestException;
import com.rednecksgaming.common.exception.ForbiddenException;
import com.rednecksgaming.common.exception.InternalServerException;
import com.rednecksgaming.common.exception.ResourceNotFoundException;
import com.rednecksgaming.common.exception.UnauthorizedException;
import com.rednecksgaming.embed.domain.DispatchLog;
import com.rednecksgaming.embed.domain.DispatchStatus;
import com.rednecksgaming.embed.domain.DispatchType;
import com.rednecksgaming.embed.dto.DispatchEmbedRequest;
import com.rednecksgaming.embed.dto.DispatchLogResponse;
import com.rednecksgaming.embed.dto.DispatchResponse;
import com.rednecksgaming.embed.dto.DryRunValidationRequest;
import com.rednecksgaming.embed.dto.DryRunValidationResponse;
import com.rednecksgaming.embed.dto.ScheduledTaskDto;
import com.rednecksgaming.embed.repository.DispatchLogRepository;
import com.rednecksgaming.identity.domain.User;
import com.rednecksgaming.identity.repository.UserRepository;
import com.rednecksgaming.server.client.DiscordServerClient;
import com.rednecksgaming.server.domain.Server;
import com.rednecksgaming.server.dto.ChannelDto;
import com.rednecksgaming.server.dto.discord.DiscordChannelDto;
import com.rednecksgaming.server.repository.ServerRepository;
import net.dv8tion.jda.api.JDA;
import net.dv8tion.jda.api.Permission;
import net.dv8tion.jda.api.entities.Guild;
import net.dv8tion.jda.api.entities.Member;
import net.dv8tion.jda.api.entities.channel.ChannelType;
import net.dv8tion.jda.api.entities.channel.concrete.Category;
import net.dv8tion.jda.api.entities.channel.concrete.TextChannel;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.Instant;
import java.util.List;
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
    private DiscordServerClient discordServerClient;

    @Mock
    private ServerRepository serverRepository;

    @Mock
    private JDA jda;

    @Mock
    private Guild guild;

    @Mock
    private net.dv8tion.jda.api.entities.SelfMember selfMember;

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
                jda,
                discordServerClient,
                serverRepository
        );
    }

    @Test
    @DisplayName("resolveServerId handles null, blank, numeric snowflakes, and slug resolution")
    void resolveServerId_variations() {
        assertThat(dispatchService.resolveServerId(null)).isNull();
        assertThat(dispatchService.resolveServerId("   ")).isEqualTo("   ");
        assertThat(dispatchService.resolveServerId("123456789012345678")).isEqualTo("123456789012345678");

        Server server = Server.builder().id("987654321").slug("alpha-team").build();
        when(serverRepository.findByIdOrSlug("alpha-team")).thenReturn(Optional.of(server));
        when(serverRepository.findByIdOrSlug("unknown-slug")).thenReturn(Optional.empty());

        assertThat(dispatchService.resolveServerId("alpha-team")).isEqualTo("987654321");
        assertThat(dispatchService.resolveServerId("unknown-slug")).isEqualTo("unknown-slug");

        EmbedDispatchService serviceWithoutServerRepo = new EmbedDispatchService(
                discordDispatchService, validatorService, rateLimiterService,
                scheduledDispatchService, dispatchLogRepository, userRepository,
                null, discordServerClient, null
        );
        assertThat(serviceWithoutServerRepo.resolveServerId("some-slug")).isEqualTo("some-slug");
    }

    @Test
    @DisplayName("Immediate dispatch throws UnauthorizedException when operator record is not found")
    void dispatchImmediate_userNotFoundThrows() {
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        DispatchEmbedRequest request = new DispatchEmbedRequest(
                "guild_1", "chan_1", DispatchType.IMMEDIATE, null, Map.of("flags", 32768), null
        );

        assertThatThrownBy(() -> dispatchService.dispatchImmediate(999L, request, null))
                .isInstanceOf(UnauthorizedException.class)
                .hasMessageContaining("Authenticated operator record not found");
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
    @DisplayName("Immediate dispatch throws BadRequestException when pre-flight validation fails")
    void dispatchImmediate_validationFailsThrows() {
        User user = User.builder().id(1L).email("user@rng.com").status("ACTIVE").build();
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        DryRunValidationResponse invalidResponse = DryRunValidationResponse.builder()
                .isValid(false)
                .errors(List.of("Missing flags: 32768", "Exceeds 40 components"))
                .build();
        when(validatorService.validate(anyString(), anyString(), anyMap())).thenReturn(invalidResponse);

        DispatchEmbedRequest request = new DispatchEmbedRequest(
                "guild_1", "chan_1", DispatchType.IMMEDIATE, null, Map.of(), null
        );

        assertThatThrownBy(() -> dispatchService.dispatchImmediate(1L, request, null))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Pre-flight validation failed: Missing flags: 32768; Exceeds 40 components");
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
        assertThat(response.status()).isEqualTo(DispatchStatus.SUCCESS);
    }

    @Test
    @DisplayName("Immediate dispatch with file attachments converts files and passes resources")
    void dispatchImmediate_withFilesSuccess() throws Exception {
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
                .thenReturn(objectMapper.readTree("{\"id\":\"998877\"}"));

        MultipartFile mockFile = mock(MultipartFile.class);
        when(mockFile.getBytes()).thenReturn("binary data".getBytes());
        when(mockFile.getOriginalFilename()).thenReturn("report.pdf");

        DispatchEmbedRequest request = new DispatchEmbedRequest(
                "guild_1", "chan_1", DispatchType.IMMEDIATE, null, Map.of("flags", 32768), null
        );

        DispatchResponse response = dispatchService.dispatchImmediate(1L, request, List.of(mockFile));

        assertThat(response).isNotNull();
        assertThat(response.discordMessageId()).isEqualTo("998877");
        verify(discordDispatchService).dispatchToChannel(eq("chan_1"), anyMap(), argThat(list -> {
            if (list != null && list.size() == 1) {
                return "report.pdf".equals(list.get(0).getFilename());
            }
            return false;
        }));
    }

    @Test
    @DisplayName("Immediate dispatch throws InternalServerException when file reading fails")
    void dispatchImmediate_fileReadFailsThrows() throws Exception {
        User user = User.builder().id(1L).email("user@rng.com").status("ACTIVE").build();
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        when(validatorService.validate(anyString(), anyString(), anyMap()))
                .thenReturn(DryRunValidationResponse.builder().isValid(true).build());

        MultipartFile mockFile = mock(MultipartFile.class);
        when(mockFile.getBytes()).thenThrow(new IOException("Disk read error"));
        when(mockFile.getOriginalFilename()).thenReturn("corrupted.bin");

        DispatchEmbedRequest request = new DispatchEmbedRequest(
                "guild_1", "chan_1", DispatchType.IMMEDIATE, null, Map.of("flags", 32768), null
        );

        assertThatThrownBy(() -> dispatchService.dispatchImmediate(1L, request, List.of(mockFile)))
                .isInstanceOf(InternalServerException.class)
                .hasMessageContaining("Failed to read uploaded file attachment: corrupted.bin");
    }

    @Test
    @DisplayName("Immediate dispatch handles response without id gracefully")
    void dispatchImmediate_responseWithoutId() throws Exception {
        User user = User.builder().id(1L).email("user@rng.com").status("ACTIVE").build();
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        when(validatorService.validate(anyString(), anyString(), anyMap()))
                .thenReturn(DryRunValidationResponse.builder().isValid(true).build());

        when(discordDispatchService.dispatchToChannel(eq("chan_1"), anyMap(), anyList()))
                .thenReturn(objectMapper.readTree("{}"));

        DispatchEmbedRequest request = new DispatchEmbedRequest(
                "guild_1", "chan_1", DispatchType.IMMEDIATE, null, Map.of("flags", 32768), null
        );

        DispatchResponse response = dispatchService.dispatchImmediate(1L, request, null);
        assertThat(response).isNotNull();
        assertThat(response.discordMessageId()).isNull();
    }

    @Test
    @DisplayName("scheduleDispatch throws BadRequestException when scheduledFor is null or in past")
    void scheduleDispatch_pastTimeThrows() {
        User user = User.builder().id(1L).email("user@rng.com").status("ACTIVE").build();
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        DispatchEmbedRequest nullTimeRequest = new DispatchEmbedRequest(
                "guild_1", "chan_1", DispatchType.SCHEDULED, null, Map.of("flags", 32768), null
        );

        assertThatThrownBy(() -> dispatchService.scheduleDispatch(1L, nullTimeRequest))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Scheduled dispatch time must be in the future");

        DispatchEmbedRequest pastTimeRequest = new DispatchEmbedRequest(
                "guild_1", "chan_1", DispatchType.SCHEDULED, Instant.now().minusSeconds(30), Map.of("flags", 32768), null
        );

        assertThatThrownBy(() -> dispatchService.scheduleDispatch(1L, pastTimeRequest))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Scheduled dispatch time must be in the future");
    }

    @Test
    @DisplayName("scheduleDispatch throws BadRequestException when pre-flight validation fails")
    void scheduleDispatch_validationFailsThrows() {
        User user = User.builder().id(1L).email("user@rng.com").status("ACTIVE").build();
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        DryRunValidationResponse invalidResponse = DryRunValidationResponse.builder()
                .isValid(false)
                .errors(List.of("Exceeds character limit"))
                .build();
        when(validatorService.validate(anyString(), anyString(), anyMap())).thenReturn(invalidResponse);

        Instant future = Instant.now().plusSeconds(300);
        DispatchEmbedRequest request = new DispatchEmbedRequest(
                "guild_1", "chan_1", DispatchType.SCHEDULED, future, Map.of(), null
        );

        assertThatThrownBy(() -> dispatchService.scheduleDispatch(1L, request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Pre-flight validation failed: Exceeds character limit");
    }

    @Test
    @DisplayName("scheduleDispatch saves QUEUED record and enqueues task in Redis")
    void scheduleDispatch_success() {
        User user = User.builder().id(1L).email("user@rng.com").status("ACTIVE").build();
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        when(validatorService.validate(anyString(), anyString(), anyMap()))
                .thenReturn(DryRunValidationResponse.builder().isValid(true).build());

        Instant future = Instant.now().plusSeconds(600);
        DispatchEmbedRequest request = new DispatchEmbedRequest(
                "guild_1", "chan_1", DispatchType.SCHEDULED, future, Map.of("flags", 32768), null
        );

        DispatchResponse response = dispatchService.scheduleDispatch(1L, request);

        assertThat(response).isNotNull();
        assertThat(response.status()).isEqualTo(DispatchStatus.QUEUED);
        assertThat(response.scheduledFor()).isEqualTo(future);
        verify(dispatchLogRepository).save(argThat(log -> log.getStatus() == DispatchStatus.QUEUED));
        verify(scheduledDispatchService).scheduleTask(any(ScheduledTaskDto.class));
    }

    @Test
    @DisplayName("cancelScheduledDispatch throws ResourceNotFoundException when dispatchId is missing")
    void cancelScheduledDispatch_notFoundThrows() {
        when(dispatchLogRepository.findByDispatchId("missing_dsp")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> dispatchService.cancelScheduledDispatch(1L, "missing_dsp"))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Scheduled dispatch log not found");
    }

    @Test
    @DisplayName("cancelScheduledDispatch throws UnauthorizedException when operator is missing")
    void cancelScheduledDispatch_operatorNotFoundThrows() {
        DispatchLog logEntry = DispatchLog.builder().dispatchId("dsp_1").userId("1").build();
        when(dispatchLogRepository.findByDispatchId("dsp_1")).thenReturn(Optional.of(logEntry));
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> dispatchService.cancelScheduledDispatch(999L, "dsp_1"))
                .isInstanceOf(UnauthorizedException.class)
                .hasMessageContaining("Authenticated operator not found");
    }

    @Test
    @DisplayName("cancelScheduledDispatch throws ForbiddenException for unauthorized non-author non-HC")
    void cancelScheduledDispatch_forbiddenThrows() {
        DispatchLog logEntry = DispatchLog.builder().dispatchId("dsp_1").userId("100").build();
        when(dispatchLogRepository.findByDispatchId("dsp_1")).thenReturn(Optional.of(logEntry));

        User intruder = User.builder().id(200L).email("intruder@rng.com").role("ROLE_USER").build();
        when(userRepository.findById(200L)).thenReturn(Optional.of(intruder));

        assertThatThrownBy(() -> dispatchService.cancelScheduledDispatch(200L, "dsp_1"))
                .isInstanceOf(ForbiddenException.class)
                .hasMessageContaining("Only the author or High Command may cancel");
    }

    @Test
    @DisplayName("cancelScheduledDispatch succeeds when requested by author")
    void cancelScheduledDispatch_authorSucceeds() {
        DispatchLog logEntry = DispatchLog.builder().dispatchId("dsp_1").userId("1").status(DispatchStatus.QUEUED).build();
        when(dispatchLogRepository.findByDispatchId("dsp_1")).thenReturn(Optional.of(logEntry));

        User author = User.builder().id(1L).email("author@rng.com").role("ROLE_USER").build();
        when(userRepository.findById(1L)).thenReturn(Optional.of(author));
        when(scheduledDispatchService.cancelTask("dsp_1")).thenReturn(true);

        boolean cancelled = dispatchService.cancelScheduledDispatch(1L, "dsp_1");

        assertThat(cancelled).isTrue();
        assertThat(logEntry.getStatus()).isEqualTo(DispatchStatus.CANCELLED);
        verify(dispatchLogRepository).save(logEntry);
    }

    @Test
    @DisplayName("cancelScheduledDispatch succeeds when requested by High Command")
    void cancelScheduledDispatch_highCommandSucceeds() {
        DispatchLog logEntry = DispatchLog.builder().dispatchId("dsp_2").userId("1").status(DispatchStatus.QUEUED).build();
        when(dispatchLogRepository.findByDispatchId("dsp_2")).thenReturn(Optional.of(logEntry));

        User hc = User.builder().id(99L).email("hc@rng.com").role("ROLE_HIGH_COMMAND").roles("ROLE_HIGH_COMMAND").build();
        when(userRepository.findById(99L)).thenReturn(Optional.of(hc));
        when(scheduledDispatchService.cancelTask("dsp_2")).thenReturn(true);

        boolean cancelled = dispatchService.cancelScheduledDispatch(99L, "dsp_2");

        assertThat(cancelled).isTrue();
        assertThat(logEntry.getStatus()).isEqualTo(DispatchStatus.CANCELLED);
        verify(dispatchLogRepository).save(logEntry);
    }

    @Test
    @DisplayName("testDryRun validates request after resolving serverId and validating operator")
    void testDryRun_success() {
        User user = User.builder().id(1L).email("user@rng.com").status("ACTIVE").build();
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        DryRunValidationResponse expectedResponse = DryRunValidationResponse.builder().isValid(true).build();
        when(validatorService.validate(eq("guild_1"), eq("chan_1"), anyMap())).thenReturn(expectedResponse);

        DryRunValidationRequest request = new DryRunValidationRequest("guild_1", "chan_1", Map.<String, Object>of("flags", 32768), null);
        DryRunValidationResponse response = dispatchService.testDryRun(1L, request);

        assertThat(response).isNotNull();
        assertThat(response.isValid()).isTrue();
    }

    @Test
    @DisplayName("getDispatchLogs queries repository with various filter combinations")
    void getDispatchLogs_filterVariations() {
        Pageable pageable = PageRequest.of(0, 10);
        DispatchLog sampleLog = DispatchLog.builder().id("log_1").dispatchId("dsp_1").status(DispatchStatus.SUCCESS).build();
        Page<DispatchLog> page = new PageImpl<>(List.of(sampleLog), pageable, 1);

        when(dispatchLogRepository.findByServerIdAndStatusOrderByTimestampDesc(eq("srv_1"), eq(DispatchStatus.SUCCESS), eq(pageable)))
                .thenReturn(page);
        when(dispatchLogRepository.findByServerIdOrderByTimestampDesc(eq("srv_1"), eq(pageable)))
                .thenReturn(page);
        when(dispatchLogRepository.findByStatusOrderByTimestampDesc(eq(DispatchStatus.SUCCESS), eq(pageable)))
                .thenReturn(page);
        when(dispatchLogRepository.findAll(eq(pageable)))
                .thenReturn(page);

        Page<DispatchLogResponse> res1 = dispatchService.getDispatchLogs("srv_1", DispatchStatus.SUCCESS, pageable);
        assertThat(res1.getTotalElements()).isEqualTo(1);

        Page<DispatchLogResponse> res2 = dispatchService.getDispatchLogs("srv_1", null, pageable);
        assertThat(res2.getTotalElements()).isEqualTo(1);

        Page<DispatchLogResponse> res3 = dispatchService.getDispatchLogs(null, DispatchStatus.SUCCESS, pageable);
        assertThat(res3.getTotalElements()).isEqualTo(1);

        Page<DispatchLogResponse> res4 = dispatchService.getDispatchLogs("", null, pageable);
        assertThat(res4.getTotalElements()).isEqualTo(1);
    }

    @Test
    @DisplayName("getDispatchableChannels Priority 1 retrieves and filters channels via DiscordClient")
    void getDispatchableChannels_viaDiscordClient() {
        DiscordChannelDto textCh = new DiscordChannelDto();
        textCh.setId("c1"); textCh.setName("general"); textCh.setType(0); textCh.setPosition(1);
        DiscordChannelDto voiceCh = new DiscordChannelDto();
        voiceCh.setId("c2"); voiceCh.setName("voice-chat"); voiceCh.setType(2); voiceCh.setPosition(2);
        DiscordChannelDto announceCh = new DiscordChannelDto();
        announceCh.setId("c3"); announceCh.setName("announcements"); announceCh.setType(5); textCh.setPosition(0);
        DiscordChannelDto forumCh = new DiscordChannelDto();
        forumCh.setId("c4"); forumCh.setName("feedback"); forumCh.setType(15); forumCh.setPosition(3);
        DiscordChannelDto categoryCh = new DiscordChannelDto();
        categoryCh.setId("c5"); categoryCh.setName("category"); categoryCh.setType(4); // Excluded!

        when(discordServerClient.getGuildChannels("guild_1"))
                .thenReturn(List.of(textCh, voiceCh, announceCh, forumCh, categoryCh));

        List<ChannelDto> channels = dispatchService.getDispatchableChannels("guild_1");

        assertThat(channels).hasSize(4);
        assertThat(channels).extracting(ChannelDto::getId).containsExactly("c1", "c3", "c2", "c4");
    }

    @Test
    @DisplayName("getDispatchableChannels Priority 2 fallback to JDA cache when DiscordClient throws")
    void getDispatchableChannels_fallbackToJda() {
        when(discordServerClient.getGuildChannels("123456789")).thenThrow(new RuntimeException("REST unavailable"));

        TextChannel textChannel = mock(TextChannel.class);
        when(textChannel.getId()).thenReturn("chan_100");
        when(textChannel.getName()).thenReturn("rules");
        when(textChannel.getType()).thenReturn(ChannelType.TEXT);
        when(textChannel.getPosition()).thenReturn(5);

        Category category = mock(Category.class);
        when(category.getId()).thenReturn("cat_99");
        when(textChannel.getParentCategory()).thenReturn(category);

        when(jda.getGuildById("123456789")).thenReturn(guild);
        doReturn(selfMember).when(guild).getSelfMember();
        when(selfMember.hasPermission(textChannel, Permission.VIEW_CHANNEL, Permission.MESSAGE_SEND)).thenReturn(true);
        when(guild.getChannels()).thenReturn(List.of(textChannel));

        List<ChannelDto> channels = dispatchService.getDispatchableChannels("123456789");

        assertThat(channels).hasSize(1);
        assertThat(channels.get(0).getId()).isEqualTo("chan_100");
        assertThat(channels.get(0).getParentId()).isEqualTo("cat_99");
        assertThat(channels.get(0).getPosition()).isEqualTo(5);
    }

    @Test
    @DisplayName("getDispatchableChannels returns empty list when guild is missing from JDA")
    void getDispatchableChannels_jdaGuildNotFoundReturnsEmpty() {
        when(discordServerClient.getGuildChannels("123456789")).thenThrow(new RuntimeException("REST unavailable"));
        when(jda.getGuildById("123456789")).thenReturn(null);

        List<ChannelDto> channels = dispatchService.getDispatchableChannels("123456789");
        assertThat(channels).isEmpty();
    }

    @Test
    @DisplayName("dispatchImmediate with linked Discord account and responseNode missing id")
    void dispatchImmediate_withLinkedDiscordAndResponseWithoutId() throws Exception {
        User linkedUser = User.builder().id(10L).email("linked@rng.com").status("ACTIVE").discordId("11223344").build();
        when(userRepository.findById(10L)).thenReturn(Optional.of(linkedUser));

        when(validatorService.validate(any(), any(), any()))
                .thenReturn(DryRunValidationResponse.builder().isValid(true).build());

        when(discordDispatchService.dispatchToChannel(eq("chan_1"), any(), any()))
                .thenReturn(objectMapper.readTree("{\"status\":\"success\"}")); // no "id" field

        MultipartFile fileWithNullName = mock(MultipartFile.class);
        when(fileWithNullName.getBytes()).thenReturn("file-bytes".getBytes());
        when(fileWithNullName.getOriginalFilename()).thenReturn(null);

        DispatchEmbedRequest req = new DispatchEmbedRequest("123", "chan_1", DispatchType.IMMEDIATE, null, Map.of("flags", 32768), null);
        DispatchResponse resp = dispatchService.dispatchImmediate(10L, req, List.of(fileWithNullName));

        assertThat(resp.status()).isEqualTo(DispatchStatus.SUCCESS);
        assertThat(resp.discordMessageId()).isNull();
    }

    @Test
    @DisplayName("getDispatchableChannels handles null discordClient, null type/position, non-message channels, and JDA exceptions")
    void getDispatchableChannels_extendedBranchCoverage() {
        // 1. Service without discordClient
        EmbedDispatchService noClientService = new EmbedDispatchService(
                discordDispatchService, validatorService, rateLimiterService,
                scheduledDispatchService, dispatchLogRepository, userRepository,
                jda, null, serverRepository
        );

        // Non-numeric serverId skips JDA fallback
        List<ChannelDto> nonNumericRes = noClientService.getDispatchableChannels("slug-server");
        assertThat(nonNumericRes).isEmpty();

        // Numeric serverId queries JDA
        when(jda.getGuildById("999")).thenReturn(guild);
        doReturn(selfMember).when(guild).getSelfMember();

        // Add non-message channel (Category) and channel without permission and channel without category
        Category cat = mock(Category.class);
        TextChannel unpermittedChannel = mock(TextChannel.class);
        when(selfMember.hasPermission(unpermittedChannel, Permission.VIEW_CHANNEL, Permission.MESSAGE_SEND)).thenReturn(false);

        TextChannel validNoCatChannel = mock(TextChannel.class);
        when(validNoCatChannel.getId()).thenReturn("c_nocat");
        when(validNoCatChannel.getName()).thenReturn("nocat");
        when(validNoCatChannel.getType()).thenReturn(ChannelType.TEXT);
        when(validNoCatChannel.getPosition()).thenReturn(1);
        when(validNoCatChannel.getParentCategory()).thenReturn(null);
        when(selfMember.hasPermission(validNoCatChannel, Permission.VIEW_CHANNEL, Permission.MESSAGE_SEND)).thenReturn(true);

        when(guild.getChannels()).thenReturn(List.of(cat, unpermittedChannel, validNoCatChannel));

        List<ChannelDto> jdaChannels = noClientService.getDispatchableChannels("999");
        assertThat(jdaChannels).hasSize(1);
        assertThat(jdaChannels.get(0).getId()).isEqualTo("c_nocat");
        assertThat(jdaChannels.get(0).getParentId()).isNull();

        // JDA throws exception
        when(jda.getGuildById("999")).thenThrow(new RuntimeException("JDA timeout"));
        List<ChannelDto> exceptionChannels = noClientService.getDispatchableChannels("999");
        assertThat(exceptionChannels).isEmpty();

        // 2. Channel with null type and null position in DiscordChannelDto
        DiscordChannelDto nullTypeCh = new DiscordChannelDto();
        nullTypeCh.setId("c_null_type");
        nullTypeCh.setType(null);

        DiscordChannelDto nullPosCh = new DiscordChannelDto();
        nullPosCh.setId("c_null_pos");
        nullPosCh.setName("null-pos");
        nullPosCh.setType(0);
        nullPosCh.setPosition(null);

        when(discordServerClient.getGuildChannels("guild_1"))
                .thenReturn(List.of(nullTypeCh, nullPosCh));

        List<ChannelDto> clientChannels = dispatchService.getDispatchableChannels("guild_1");
        assertThat(clientChannels).hasSize(1);
        assertThat(clientChannels.get(0).getId()).isEqualTo("c_null_pos");
        assertThat(clientChannels.get(0).getPosition()).isEqualTo(0);
    }

    @Test
    @DisplayName("Short constructor without serverRepository instantiates service cleanly")
    void shortConstructor_instantiatesCleanly() {
        EmbedDispatchService shortService = new EmbedDispatchService(
                discordDispatchService, validatorService, rateLimiterService,
                scheduledDispatchService, dispatchLogRepository, userRepository,
                jda, discordServerClient
        );
        assertThat(shortService).isNotNull();
    }

    @Test
    @DisplayName("Custom ROLE_USER with dynamic rankWeight >= 8 cancels foreign scheduled dispatch")
    void customRoleUserWithDynamicWeight8_cancelsForeignDispatch() {
        com.rednecksgaming.personnel.perms.service.RolePermissionsService permsService =
                mock(com.rednecksgaming.personnel.perms.service.RolePermissionsService.class);
        EmbedDispatchService dynamicService = new EmbedDispatchService(
                discordDispatchService, validatorService, rateLimiterService,
                scheduledDispatchService, dispatchLogRepository, userRepository,
                jda, discordServerClient, null, permsService
        );

        com.rednecksgaming.embed.domain.DispatchLog foreignLog =
                com.rednecksgaming.embed.domain.DispatchLog.builder()
                        .dispatchId("dsp_foreign")
                        .userId("999")
                        .status(com.rednecksgaming.embed.domain.DispatchStatus.QUEUED)
                        .build();
        User customHc = User.builder()
                .id(88L)
                .email("custom.hc@rng.com")
                .role("ROLE_USER")
                .roles("Security Ops:Overlord")
                .build();

        when(dispatchLogRepository.findByDispatchId("dsp_foreign")).thenReturn(Optional.of(foreignLog));
        when(userRepository.findById(88L)).thenReturn(Optional.of(customHc));
        when(permsService.resolveUserRankWeight(customHc)).thenReturn(8);
        when(scheduledDispatchService.cancelTask("dsp_foreign")).thenReturn(true);

        boolean removed = dynamicService.cancelScheduledDispatch(88L, "dsp_foreign");
        assertThat(removed).isTrue();
    }
}
