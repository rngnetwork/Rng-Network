// Written By: RachitSWE
// LICENSE: All rights reserved
// Year: 2026
package com.rednecksgaming.botmodule.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.rednecksgaming.botmodule.client.GuildApiClient;
import com.rednecksgaming.botmodule.model.BotModuleDocument;
import com.rednecksgaming.botmodule.repository.BotModuleRepository;
import com.rednecksgaming.common.exception.BadRequestException;
import com.rednecksgaming.server.domain.Server;
import com.rednecksgaming.server.repository.ServerRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import java.time.Duration;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BotModuleServiceTest {

    @Mock
    private GuildApiClient guildApiClient;

    @Mock
    private BotModuleRepository botModuleRepository;

    @Mock
    private ServerRepository serverRepository;

    @Mock
    private StringRedisTemplate redisTemplate;

    @Mock
    private ValueOperations<String, String> valueOperations;

    @Mock
    private BotModuleAuditService auditService;

    private ObjectMapper objectMapper;
    private SchemaValidatorService schemaValidatorService;
    private PayloadNormalizer payloadNormalizer;
    private BotModuleServiceImpl botModuleService;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        schemaValidatorService = new SchemaValidatorService();
        payloadNormalizer = new PayloadNormalizer(objectMapper);
        lenient().when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        lenient().when(valueOperations.get(anyString())).thenReturn(null);

        botModuleService = new BotModuleServiceImpl(
                guildApiClient,
                botModuleRepository,
                serverRepository,
                redisTemplate,
                schemaValidatorService,
                auditService,
                payloadNormalizer,
                objectMapper
        );
    }

    @Test
    @DisplayName("getNetworkDefaultModules returns cached data on Redis cache hit")
    void getNetworkDefaultModules_cacheHit() throws Exception {
        String cachedJson = "{\"modules\":{\"automod\":{\"antiSpam\":true}}}";
        when(valueOperations.get("bot:config:default")).thenReturn(cachedJson);

        Map<String, Object> result = botModuleService.getNetworkDefaultModules();

        assertThat(result).containsKey("modules");
        verify(guildApiClient, never()).getDefaultModules();
    }

    @Test
    @DisplayName("getNetworkDefaultModules fetches upstream and caches on Redis cache miss")
    void getNetworkDefaultModules_cacheMiss() {
        when(valueOperations.get("bot:config:default")).thenReturn(null);
        when(guildApiClient.getDefaultModules()).thenReturn(Map.of(
                "modules", Map.of("automod", Map.of("antiSpam", true)),
                "network", Map.of("sp_ratio", "5")
        ));
        when(guildApiClient.getGuildConfig()).thenReturn(Map.of(
                "schema", Map.of(
                        "modules", Map.of("automod", Map.of("antiSpam", Map.of("type", "BOOLEAN"))),
                        "networkKeys", Map.of("sp_ratio", Map.of("type", "STRING"))
                )
        ));

        Map<String, Object> result = botModuleService.getNetworkDefaultModules();

        assertThat(result).containsKey("modules");
        assertThat(result).containsKey("network");
        assertThat(result).containsKey("schema");
        verify(guildApiClient, times(1)).getDefaultModules();
        verify(valueOperations, times(1)).set(eq("bot:config:default"), anyString(), eq(Duration.ofMinutes(5)));
    }

    @Test
    @DisplayName("getServerEffectiveModules computes inheritance diffing between network and server")
    void getServerEffectiveModules_computesInheritance() {
        Server server = Server.builder()
                .id("123456789012345678")
                .slug("roughnuts")
                .name("Roughnuts Server")
                .build();
        when(serverRepository.findByIdOrSlug("roughnuts")).thenReturn(Optional.of(server));

        when(valueOperations.get("bot:config:default")).thenReturn(null);
        when(guildApiClient.getDefaultModules()).thenReturn(Map.of(
                "automod", Map.of("antiSpam", true),
                "economy", Map.of("startingBalance", 100)
        ));

        when(valueOperations.get("bot:guild:123456789012345678:modules")).thenReturn(null);
        when(guildApiClient.getGuildModules("123456789012345678")).thenReturn(Map.of(
                "automod", Map.of("antiSpam", false)
        ));
        when(guildApiClient.getGuildConfig()).thenReturn(Map.of("schema", Map.of("version", "1.0")));

        Map<String, Object> response = botModuleService.getServerEffectiveModules("roughnuts");

        assertThat(response.get("serverId")).isEqualTo("123456789012345678");
        assertThat(response.get("guildId")).isEqualTo("123456789012345678");
        assertThat(response.get("serverSlug")).isEqualTo("roughnuts");
        assertThat(response.get("schema")).isNotNull();

        Map<String, Object> modules = (Map<String, Object>) response.get("modules");
        assertThat(modules).containsKey("automod");
        assertThat(modules).containsKey("economy");

        Map<String, Object> automodStatus = (Map<String, Object>) modules.get("automod");
        assertThat(automodStatus.get("isOverridden")).isEqualTo(true);
        assertThat(automodStatus.get("effectiveConfig")).isEqualTo(Map.of("antiSpam", false));
        assertThat(automodStatus.get("values")).isEqualTo(Map.of("antiSpam", false));

        Map<String, Object> economyStatus = (Map<String, Object>) modules.get("economy");
        assertThat(economyStatus.get("isOverridden")).isEqualTo(false);
        assertThat(economyStatus.get("effectiveConfig")).isEqualTo(Map.of("startingBalance", 100));
        assertThat(economyStatus.get("values")).isEqualTo(Map.of("startingBalance", 100));
    }

    @Test
    @DisplayName("getServerEffectiveModules marks server-only null modules as isOverridden=false")
    @SuppressWarnings("unchecked")
    void getServerEffectiveModules_serverOnlyNullModule_isNotOverridden() {
        Server server = Server.builder()
                .id("123456789012345678")
                .slug("roughnuts")
                .name("Roughnuts Server")
                .build();
        when(serverRepository.findByIdOrSlug("roughnuts")).thenReturn(Optional.of(server));

        when(valueOperations.get("bot:config:default")).thenReturn(null);
        when(guildApiClient.getDefaultModules()).thenReturn(Map.of(
                "automod", Map.of("antiSpam", true)
        ));

        when(valueOperations.get("bot:guild:123456789012345678:modules")).thenReturn(null);
        java.util.Map<String, Object> serverModules = new java.util.HashMap<>();
        serverModules.put("vanityRoles", null);
        when(guildApiClient.getGuildModules("123456789012345678")).thenReturn(serverModules);
        when(guildApiClient.getGuildConfig()).thenReturn(Map.of("schema", Map.of("version", "1.0")));

        Map<String, Object> response = botModuleService.getServerEffectiveModules("roughnuts");
        Map<String, Object> modules = (Map<String, Object>) response.get("modules");

        assertThat(modules).containsKey("vanityRoles");
        Map<String, Object> vanityStatus = (Map<String, Object>) modules.get("vanityRoles");
        assertThat(vanityStatus.get("isOverridden")).isEqualTo(false);
        assertThat(vanityStatus.get("effectiveConfig")).isNull();
        assertThat(vanityStatus.get("values")).isNull();
    }

    @Test
    @DisplayName("updateNetworkDefaultModules validates, updates upstream, stores in mongo, and evicts dual keys")
    void updateNetworkDefaultModules_atomicDualKeyEviction() {
        Map<String, Object> patch = Map.of("automod", Map.of("antiSpam", true));
        when(guildApiClient.patchDefaultModules("usr_actor", patch)).thenReturn(Map.of("status", "ok"));

        when(botModuleRepository.findByScope("NETWORK")).thenReturn(Optional.empty());

        botModuleService.updateNetworkDefaultModules("usr_actor", "Actor Commander", patch);

        verify(guildApiClient).patchDefaultModules("usr_actor", patch);
        verify(botModuleRepository).save(any(BotModuleDocument.class));
        verify(auditService).recordAuditLog(
                eq("NETWORK"), isNull(), eq("usr_actor"), eq("Actor Commander"),
                eq("UPDATE_NETWORK"), isNull(), eq(Map.of("modules", patch))
        );
        // Dual key eviction: bot:config:tree AND bot:config:default
        verify(redisTemplate).delete("bot:config:tree");
        verify(redisTemplate).delete("bot:config:default");
    }

    @Test
    @DisplayName("updateNetworkDefaultModules with modules and network updates upstream, mongo, and evicts dual keys")
    void updateNetworkDefaultModules_withNetwork_success() {
        Map<String, Object> modulesPatch = Map.of("automod", Map.of("antiSpam", true));
        Map<String, Object> networkPatch = Map.of("sp_ratio", "10");
        when(guildApiClient.patchDefaultModules("usr_actor", modulesPatch, networkPatch)).thenReturn(Map.of("status", "ok"));
        when(botModuleRepository.findByScope("NETWORK")).thenReturn(Optional.empty());

        botModuleService.updateNetworkDefaultModules("usr_actor", "Actor Commander", modulesPatch, networkPatch);

        verify(guildApiClient).patchDefaultModules("usr_actor", modulesPatch, networkPatch);
        verify(botModuleRepository).save(any(BotModuleDocument.class));
        verify(auditService).recordAuditLog(
                eq("NETWORK"), isNull(), eq("usr_actor"), eq("Actor Commander"),
                eq("UPDATE_NETWORK"), isNull(), eq(Map.of("modules", modulesPatch, "network", networkPatch))
        );
        verify(redisTemplate).delete("bot:config:tree");
        verify(redisTemplate).delete("bot:config:default");
    }

    @Test
    @DisplayName("updateServerModules validates, updates upstream, stores in mongo, and evicts dual keys")
    void updateServerModules_atomicDualKeyEviction() {
        Server server = Server.builder()
                .id("123456789012345678")
                .slug("roughnuts")
                .name("Roughnuts Server")
                .build();
        when(serverRepository.findByIdOrSlug("roughnuts")).thenReturn(Optional.of(server));

        Map<String, Object> patch = Map.of("automod", Map.of("antiSpam", false));
        when(guildApiClient.patchGuildModules("123456789012345678", patch)).thenReturn(Map.of("status", "ok"));
        when(botModuleRepository.findByScopeAndServerId("SERVER", "123456789012345678")).thenReturn(Optional.empty());

        botModuleService.updateServerModules("roughnuts", "usr_actor", "Actor Commander", patch);

        verify(guildApiClient).patchGuildModules("123456789012345678", patch);
        verify(botModuleRepository).save(any(BotModuleDocument.class));
        verify(auditService).recordAuditLog(
                eq("SERVER"), eq("123456789012345678"), eq("usr_actor"), eq("Actor Commander"),
                eq("UPDATE_SERVER"), isNull(), eq(patch)
        );
        // Dual key eviction: bot:config:tree AND bot:guild:123456789012345678:modules
        verify(redisTemplate).delete("bot:config:tree");
        verify(redisTemplate).delete("bot:guild:123456789012345678:modules");
    }

    @Test
    @DisplayName("resetServerModule deletes module, updates mongo, records audit and evicts dual keys")
    void resetServerModule_resetsAndEvicts() {
        Server server = Server.builder()
                .id("123456789012345678")
                .slug("roughnuts")
                .name("Roughnuts Server")
                .build();
        when(serverRepository.findByIdOrSlug("roughnuts")).thenReturn(Optional.of(server));

        BotModuleDocument doc = BotModuleDocument.builder()
                .scope("SERVER")
                .serverId("123456789012345678")
                .modules(new java.util.HashMap<>(Map.of("automod", Map.of("antiSpam", false))))
                .build();
        when(botModuleRepository.findByScopeAndServerId("SERVER", "123456789012345678")).thenReturn(Optional.of(doc));

        botModuleService.resetServerModule("roughnuts", "automod", "usr_actor", "Actor Commander");

        verify(guildApiClient).deleteGuildModule("123456789012345678", "automod");
        verify(botModuleRepository).save(doc);
        verify(auditService).recordAuditLog(
                eq("SERVER"), eq("123456789012345678"), eq("usr_actor"), eq("Actor Commander"),
                eq("RESET_SERVER_MODULE"), eq("automod"), any()
        );
        verify(redisTemplate).delete("bot:config:tree");
        verify(redisTemplate).delete("bot:guild:123456789012345678:modules");
    }

    @Test
    @DisplayName("SchemaValidatorService throws BadRequestException for invalid bounds")
    void schemaValidatorService_boundsValidation() {
        // level outside 1-1000
        Map<String, Object> badLevel = Map.of("leveling", Map.of("minLevel", 1500));
        assertThatThrownBy(() -> schemaValidatorService.validateModules(badLevel))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Level must be between 1 and 1000");

        // invalid snowflake ID
        Map<String, Object> badSnowflake = Map.of("automod", Map.of("logChannelId", "not-a-snowflake"));
        assertThatThrownBy(() -> schemaValidatorService.validateModules(badSnowflake))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("snowflake");

        // list exceeding 100 items
        List<String> largeList = Collections.nCopies(105, "banned_word");
        Map<String, Object> badList = Map.of("automod", Map.of("badWords", largeList));
        assertThatThrownBy(() -> schemaValidatorService.validateModules(badList))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("limit of 100");

        // dictionary map levelRoles: level > 1000 in key
        Map<String, Object> badLevelKey = Map.of("leveling", Map.of("levelRoles", Map.of("1500", "123456789012345678")));
        assertThatThrownBy(() -> schemaValidatorService.validateModules(badLevelKey))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Level must be between 1 and 1000");

        // dictionary map levelRoles: negative level in key
        Map<String, Object> negativeLevelKey = Map.of("leveling", Map.of("levelRoles", Map.of("-5", "123456789012345678")));
        assertThatThrownBy(() -> schemaValidatorService.validateModules(negativeLevelKey))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Level must be between 1 and 1000");

        // dictionary map levelRoles: invalid snowflake in value
        Map<String, Object> badRoleSnowflake = Map.of("leveling", Map.of("levelRoles", Map.of("5", "invalid-role-id")));
        assertThatThrownBy(() -> schemaValidatorService.validateModules(badRoleSnowflake))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Invalid Discord snowflake ID");

        Map<String, Object> validLevelModule = new java.util.HashMap<>();
        Map<String, Object> levelData = new java.util.HashMap<>();
        levelData.put("enabled", true);
        levelData.put("minXp", 15);
        levelData.put("maxXp", 25);
        levelData.put("cooldown", 60);
        levelData.put("channelId", null);
        levelData.put("announceEnabled", true);
        levelData.put("message", "Nice {mention}, you just advanced to **level {level}**!");
        levelData.put("ignoredChannels", List.of("123456789012345678"));
        levelData.put("levelRoles", Map.of("5", "123456789012345678"));
        validLevelModule.put("level", levelData);

        org.junit.jupiter.api.Assertions.assertDoesNotThrow(() -> schemaValidatorService.validateModules(validLevelModule));
    }
}
