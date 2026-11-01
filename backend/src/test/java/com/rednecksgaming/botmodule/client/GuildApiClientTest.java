package com.rednecksgaming.botmodule.client;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.rednecksgaming.botmodule.service.PayloadNormalizer;
import com.rednecksgaming.common.exception.UpstreamServiceException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class GuildApiClientTest {

    @Mock
    private RestTemplate restTemplate;

    private ObjectMapper objectMapper;
    private PayloadNormalizer payloadNormalizer;
    private GuildApiClientImpl guildApiClient;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        payloadNormalizer = new PayloadNormalizer(objectMapper);
        guildApiClient = new GuildApiClientImpl(
                restTemplate,
                payloadNormalizer,
                objectMapper,
                "http://mock-guild-api:8790/v1",
                "mock-token-xyz",
                3000,
                8000
        );
    }

    @Test
    @DisplayName("getDefaultModules successfully unwraps authentic {'ok': true, 'data': {...}} envelope and normalizes")
    void getDefaultModules_unwrapsEnvelopeAndNormalizes() {
        String jsonResponse = """
            {
                "ok": true,
                "data": {
                    "modules": {
                        "automod": {
                            "antiSpam": true,
                            "badWords": "[]"
                        }
                    }
                }
            }
            """;

        when(restTemplate.exchange(
                eq("http://mock-guild-api:8790/v1/default"),
                eq(HttpMethod.GET),
                any(HttpEntity.class),
                eq(String.class)
        )).thenReturn(new ResponseEntity<>(jsonResponse, HttpStatus.OK));

        Map<String, Object> result = guildApiClient.getDefaultModules();

        assertThat(result).containsKey("automod");
        Map<String, Object> automod = (Map<String, Object>) result.get("automod");
        assertThat(automod.get("antiSpam")).isEqualTo(true);
        // Stringified "[]" should be normalized to real empty List
        assertThat(automod.get("badWords")).isInstanceOf(List.class);
    }

    @Test
    @DisplayName("getDefaultModules also handles flat {'modules': {...}} response")
    void getDefaultModules_handlesFlatResponse() {
        String jsonResponse = """
            {
                "modules": {
                    "automod": {
                        "antiSpam": true,
                        "badWords": "[]"
                    }
                }
            }
            """;

        when(restTemplate.exchange(
                eq("http://mock-guild-api:8790/v1/default"),
                eq(HttpMethod.GET),
                any(HttpEntity.class),
                eq(String.class)
        )).thenReturn(new ResponseEntity<>(jsonResponse, HttpStatus.OK));

        Map<String, Object> result = guildApiClient.getDefaultModules();

        assertThat(result).containsKey("automod");
        Map<String, Object> automod = (Map<String, Object>) result.get("automod");
        assertThat(automod.get("badWords")).isInstanceOf(List.class);
    }

    @Test
    @DisplayName("getGuildConfig successfully unwraps authentic envelope and normalizes tree")
    void getGuildConfig_unwrapsEnvelope() {
        String jsonResponse = """
            {
                "ok": true,
                "data": {
                    "guilds": {
                        "123456789": {
                            "guildId": "123456789",
                            "modules": {
                                "leveling": { "enabled": true }
                            }
                        }
                    }
                }
            }
            """;

        when(restTemplate.exchange(
                eq("http://mock-guild-api:8790/v1/guildConfig"),
                eq(HttpMethod.GET),
                any(HttpEntity.class),
                eq(String.class)
        )).thenReturn(new ResponseEntity<>(jsonResponse, HttpStatus.OK));

        Map<String, Object> result = guildApiClient.getGuildConfig();
        assertThat(result).containsKey("guilds");
        Map<String, Object> guilds = (Map<String, Object>) result.get("guilds");
        Map<String, Object> srv = (Map<String, Object>) guilds.get("123456789");
        assertThat(srv).doesNotContainKey("guildId");
        assertThat(srv).containsKey("leveling");
    }

    @Test
    @DisplayName("getGuildModules unwraps authentic envelope, strips redundant guildId, and normalizes modules")
    void getGuildModules_unwrapsEnvelopeAndStripsGuildId() {
        String jsonResponse = """
            {
                "ok": true,
                "data": {
                    "guildId": "123456789",
                    "modules": {
                        "automod": {
                            "antiSpam": false,
                            "badWords": "[\\"word1\\", \\"word2\\"]"
                        }
                    }
                }
            }
            """;

        when(restTemplate.exchange(
                eq("http://mock-guild-api:8790/v1/guild/123456789"),
                eq(HttpMethod.GET),
                any(HttpEntity.class),
                eq(String.class)
        )).thenReturn(new ResponseEntity<>(jsonResponse, HttpStatus.OK));

        Map<String, Object> result = guildApiClient.getGuildModules("123456789");

        assertThat(result).doesNotContainKey("guildId");
        assertThat(result).containsKey("automod");
        Map<String, Object> automod = (Map<String, Object>) result.get("automod");
        assertThat(automod.get("antiSpam")).isEqualTo(false);
        assertThat(automod.get("badWords")).isInstanceOf(List.class);
        List<?> words = (List<?>) automod.get("badWords");
        assertThat(words).asList().containsExactly("word1", "word2");
    }

    @Test
    @DisplayName("patchDefaultModules forwards actorId and modules payload")
    void patchDefaultModules_success() {
        String jsonResponse = "{\"ok\":true,\"data\":{\"status\":\"ok\"}}";

        when(restTemplate.exchange(
                eq("http://mock-guild-api:8790/v1/default"),
                eq(HttpMethod.PATCH),
                any(HttpEntity.class),
                eq(String.class)
        )).thenReturn(new ResponseEntity<>(jsonResponse, HttpStatus.OK));

        Map<String, Object> patch = Map.of("automod", Map.of("antiSpam", true));
        Map<String, Object> result = guildApiClient.patchDefaultModules("actor_999", patch);

        assertThat(result).isNotNull();
    }

    @Test
    @DisplayName("patchGuildModules sends server-specific patch payload")
    void patchGuildModules_success() {
        String jsonResponse = "{\"ok\":true,\"data\":{\"status\":\"ok\"}}";

        when(restTemplate.exchange(
                eq("http://mock-guild-api:8790/v1/guild/123456789"),
                eq(HttpMethod.PATCH),
                any(HttpEntity.class),
                eq(String.class)
        )).thenReturn(new ResponseEntity<>(jsonResponse, HttpStatus.OK));

        Map<String, Object> patch = Map.of("automod", Map.of("antiSpam", false));
        Map<String, Object> result = guildApiClient.patchGuildModules("123456789", patch);

        assertThat(result).isNotNull();
    }

    @Test
    @DisplayName("deleteGuildModule sends DELETE to guild module endpoint without /modules/ infix")
    void deleteGuildModule_success() {
        String jsonResponse = "{\"ok\":true,\"data\":{\"status\":\"deleted\"}}";

        when(restTemplate.exchange(
                eq("http://mock-guild-api:8790/v1/guild/123456789/automod"),
                eq(HttpMethod.DELETE),
                any(HttpEntity.class),
                eq(String.class)
        )).thenReturn(new ResponseEntity<>(jsonResponse, HttpStatus.OK));

        Map<String, Object> result = guildApiClient.deleteGuildModule("123456789", "automod");
        assertThat(result).isNotNull();
    }

    @Test
    @DisplayName("patchGuildModules serializes outbound text array fields into JSON strings")
    void patchGuildModules_serializesOutboundTextArrayFields() {
        String jsonResponse = "{\"ok\":true,\"data\":{\"status\":\"ok\"}}";

        when(restTemplate.exchange(
                eq("http://mock-guild-api:8790/v1/guild/123456789"),
                eq(HttpMethod.PATCH),
                argThat((HttpEntity<?> entity) -> {
                    Map<?, ?> body = (Map<?, ?>) entity.getBody();
                    Map<?, ?> modules = (Map<?, ?>) body.get("modules");
                    Map<?, ?> ticket = (Map<?, ?>) modules.get("ticket");
                    return "[\"1395381163585175724\"]".equals(ticket.get("additionalRoleIds"));
                }),
                eq(String.class)
        )).thenReturn(new ResponseEntity<>(jsonResponse, HttpStatus.OK));

        Map<String, Object> patch = Map.of(
                "ticket", Map.of(
                        "enabled", true,
                        "additionalRoleIds", List.of("1395381163585175724")
                )
        );
        Map<String, Object> result = guildApiClient.patchGuildModules("123456789", patch);
        assertThat(result).isNotNull();
    }

    @Test
    @DisplayName("patchGuildModules throws UpstreamServiceException when upstream returns module error in 200 OK")
    void patchGuildModules_throwsUpstreamServiceExceptionOnModuleError() {
        String jsonResponse = """
            {
                "ok": true,
                "data": {
                    "guildId": "123456789",
                    "modules": {
                        "ticket": {
                            "error": "string violation: additionalRoleIds cannot be an array or an object"
                        }
                    }
                }
            }
            """;

        when(restTemplate.exchange(
                eq("http://mock-guild-api:8790/v1/guild/123456789"),
                eq(HttpMethod.PATCH),
                any(HttpEntity.class),
                eq(String.class)
        )).thenReturn(new ResponseEntity<>(jsonResponse, HttpStatus.OK));

        Map<String, Object> patch = Map.of("ticket", Map.of("enabled", true));

        assertThatThrownBy(() -> guildApiClient.patchGuildModules("123456789", patch))
                .isInstanceOf(UpstreamServiceException.class)
                .hasMessageContaining("string violation: additionalRoleIds cannot be an array or an object");
    }

    @Test
    @DisplayName("patchGuildModules throws UpstreamServiceException when upstream returns enabledError in 200 OK")
    void patchGuildModules_throwsUpstreamServiceExceptionOnEnabledError() {
        String jsonResponse = """
            {
                "ok": true,
                "data": {
                    "guildId": "123456789",
                    "modules": {
                        "jobs": {
                            "enabledError": "jobs: going live is governed — use /jobs launch"
                        }
                    }
                }
            }
            """;

        when(restTemplate.exchange(
                eq("http://mock-guild-api:8790/v1/guild/123456789"),
                eq(HttpMethod.PATCH),
                any(HttpEntity.class),
                eq(String.class)
        )).thenReturn(new ResponseEntity<>(jsonResponse, HttpStatus.OK));

        Map<String, Object> patch = Map.of("jobs", Map.of("enabled", true));

        assertThatThrownBy(() -> guildApiClient.patchGuildModules("123456789", patch))
                .isInstanceOf(UpstreamServiceException.class)
                .hasMessageContaining("jobs: going live is governed");
    }

    @Test
    @DisplayName("Upstream timeout or 5xx throws UpstreamServiceException (mapping to 502)")
    void upstreamFailure_throwsUpstreamServiceException() {
        when(restTemplate.exchange(
                eq("http://mock-guild-api:8790/v1/default"),
                eq(HttpMethod.GET),
                any(HttpEntity.class),
                eq(String.class)
        )).thenThrow(new ResourceAccessException("Connection timed out"));

        assertThatThrownBy(() -> guildApiClient.getDefaultModules())
                .isInstanceOf(UpstreamServiceException.class)
                .hasMessageContaining("timed out");
    }

    @Test
    @DisplayName("Upstream 500 server error throws UpstreamServiceException")
    void upstreamServerError_throwsUpstreamServiceException() {
        when(restTemplate.exchange(
                eq("http://mock-guild-api:8790/v1/default"),
                eq(HttpMethod.GET),
                any(HttpEntity.class),
                eq(String.class)
        )).thenThrow(new HttpServerErrorException(HttpStatus.INTERNAL_SERVER_ERROR, "Internal Error"));

        assertThatThrownBy(() -> guildApiClient.getDefaultModules())
                .isInstanceOf(UpstreamServiceException.class)
                .hasMessageContaining("500");
    }
}
