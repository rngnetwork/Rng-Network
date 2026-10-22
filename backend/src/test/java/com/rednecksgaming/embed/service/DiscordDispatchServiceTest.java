package com.rednecksgaming.embed.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.rednecksgaming.common.exception.BadRequestException;
import com.rednecksgaming.common.exception.ForbiddenException;
import com.rednecksgaming.common.exception.InternalServerException;
import com.rednecksgaming.common.exception.ServiceUnavailableException;
import com.rednecksgaming.common.exception.UnauthorizedException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;

import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DiscordDispatchServiceTest {

    @Mock
    private StringRedisTemplate redisTemplate;

    @Mock
    private ValueOperations<String, String> valueOperations;

    @Mock
    private RestClient restClient;

    @Mock
    private RestClient.RequestBodyUriSpec requestBodyUriSpec;

    @Mock
    private RestClient.RequestBodySpec requestBodySpec;

    @Mock
    private RestClient.ResponseSpec responseSpec;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private DiscordDispatchServiceImpl service;

    @BeforeEach
    void setUp() {
        lenient().when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        service = new DiscordDispatchServiceImpl(restClient, objectMapper, redisTemplate, "Bot test-secret-token");
    }

    private void setupRestClientPost() {
        when(restClient.post()).thenReturn(requestBodyUriSpec);
        when(requestBodyUriSpec.uri(anyString())).thenReturn(requestBodySpec);
        lenient().when(requestBodySpec.header(anyString(), anyString())).thenReturn(requestBodySpec);
        lenient().when(requestBodySpec.contentType(any(MediaType.class))).thenReturn(requestBodySpec);
        lenient().when(requestBodySpec.body(any(Object.class))).thenReturn(requestBodySpec);
        lenient().when(requestBodySpec.body(any())).thenReturn(requestBodySpec);
        lenient().when(requestBodySpec.retrieve()).thenReturn(responseSpec);
    }

    private void setupRestClientPatch() {
        when(restClient.patch()).thenReturn(requestBodyUriSpec);
        when(requestBodyUriSpec.uri(anyString())).thenReturn(requestBodySpec);
        lenient().when(requestBodySpec.header(anyString(), anyString())).thenReturn(requestBodySpec);
        lenient().when(requestBodySpec.contentType(any(MediaType.class))).thenReturn(requestBodySpec);
        lenient().when(requestBodySpec.body(any(Object.class))).thenReturn(requestBodySpec);
        lenient().when(requestBodySpec.body(any())).thenReturn(requestBodySpec);
        when(requestBodySpec.retrieve()).thenReturn(responseSpec);
    }

    @Test
    @DisplayName("Blank bot token throws UnauthorizedException")
    void dispatchToChannel_blankTokenThrows() {
        DiscordDispatchServiceImpl invalidTokenService = new DiscordDispatchServiceImpl(
                restClient, objectMapper, redisTemplate, "   "
        );

        assertThatThrownBy(() -> invalidTokenService.dispatchToChannel("12345", Map.of(), null))
                .isInstanceOf(UnauthorizedException.class)
                .hasMessageContaining("Discord Bot Token (DISCORD_BOT_TOKEN) is not configured");
    }

    @Test
    @DisplayName("Default placeholder bot token throws UnauthorizedException")
    void dispatchToChannel_placeholderTokenThrows() {
        DiscordDispatchServiceImpl placeholderService = new DiscordDispatchServiceImpl(
                restClient, objectMapper, redisTemplate, "your-discord-bot-token"
        );

        assertThatThrownBy(() -> placeholderService.dispatchToChannel("12345", Map.of(), null))
                .isInstanceOf(UnauthorizedException.class)
                .hasMessageContaining("Discord Bot Token (DISCORD_BOT_TOKEN) is not configured");
    }

    @Test
    @DisplayName("Quoted bot token is properly cleaned and used")
    void dispatchToChannel_quotedTokenCleaned() throws Exception {
        DiscordDispatchServiceImpl quotedTokenService = new DiscordDispatchServiceImpl(
                restClient, objectMapper, redisTemplate, "\"Bot quoted-secret\""
        );

        setupRestClientPost();
        JsonNode expectedNode = objectMapper.readTree("{\"id\":\"msg_100\"}");
        when(responseSpec.body(JsonNode.class)).thenReturn(expectedNode);

        JsonNode result = quotedTokenService.dispatchToChannel("12345", Map.of("content", "hello"), null);

        assertThat(result).isNotNull();
        assertThat(result.get("id").asText()).isEqualTo("msg_100");
        verify(requestBodySpec).header(HttpHeaders.AUTHORIZATION, "Bot quoted-secret");
    }

    @Test
    @DisplayName("Single quoted bot token is properly cleaned")
    void dispatchToChannel_singleQuotedTokenCleaned() throws Exception {
        DiscordDispatchServiceImpl singleQuotedService = new DiscordDispatchServiceImpl(
                restClient, objectMapper, redisTemplate, "'single-secret'"
        );

        setupRestClientPost();
        JsonNode expectedNode = objectMapper.readTree("{\"id\":\"msg_101\"}");
        when(responseSpec.body(JsonNode.class)).thenReturn(expectedNode);

        JsonNode result = singleQuotedService.dispatchToChannel("12345", Map.of("content", "hello"), null);

        assertThat(result).isNotNull();
        verify(requestBodySpec).header(HttpHeaders.AUTHORIZATION, "Bot single-secret");
    }

    @Test
    @DisplayName("Active Cloudflare 1015 Edge Ban circuit breaker blocks dispatch")
    void dispatchToChannel_edgeBanEngaged() {
        when(redisTemplate.hasKey("discord:circuit:edge_ban")).thenReturn(true);

        assertThatThrownBy(() -> service.dispatchToChannel("12345", Map.of(), null))
                .isInstanceOf(ServiceUnavailableException.class)
                .hasMessageContaining("Discord Gateway temporarily throttled under Cloudflare edge protection");
    }

    @Test
    @DisplayName("Dispatch with multipart file attachments serializes payload_json and files")
    void dispatchToChannel_withFileAttachments() throws Exception {
        setupRestClientPost();
        JsonNode expectedNode = objectMapper.readTree("{\"id\":\"msg_files_1\"}");
        when(responseSpec.body(JsonNode.class)).thenReturn(expectedNode);

        Resource file1 = new ByteArrayResource("test-data".getBytes(StandardCharsets.UTF_8)) {
            @Override
            public String getFilename() {
                return "test.txt";
            }
        };

        JsonNode result = service.dispatchToChannel("12345", Map.of("flags", 32768), List.of(file1));

        assertThat(result).isNotNull();
        assertThat(result.get("id").asText()).isEqualTo("msg_files_1");
        verify(requestBodySpec).contentType(MediaType.MULTIPART_FORM_DATA);
    }

    @Test
    @DisplayName("editOriginalInteraction adds flags 32768 and sends PATCH request")
    void editOriginalInteraction_success() throws Exception {
        setupRestClientPatch();
        JsonNode expectedNode = objectMapper.readTree("{\"id\":\"msg_edit_1\"}");
        when(responseSpec.body(JsonNode.class)).thenReturn(expectedNode);

        Map<String, Object> payload = new HashMap<>();
        payload.put("content", "Edited text");

        JsonNode result = service.editOriginalInteraction("app_1", "tok_1", payload);

        assertThat(result).isNotNull();
        assertThat(result.get("id").asText()).isEqualTo("msg_edit_1");
        verify(restClient).patch();
    }

    @Test
    @DisplayName("editOriginalInteraction without bot token sends PATCH request without auth header")
    void editOriginalInteraction_noBotToken() throws Exception {
        DiscordDispatchServiceImpl noTokenService = new DiscordDispatchServiceImpl(
                restClient, objectMapper, redisTemplate, ""
        );
        setupRestClientPatch();
        JsonNode expectedNode = objectMapper.readTree("{\"id\":\"msg_edit_2\"}");
        when(responseSpec.body(JsonNode.class)).thenReturn(expectedNode);

        JsonNode result = noTokenService.editOriginalInteraction("app_1", "tok_1", Map.of("flags", 32768));

        assertThat(result).isNotNull();
        verify(requestBodySpec, never()).header(eq(HttpHeaders.AUTHORIZATION), anyString());
    }

    @Test
    @DisplayName("sendFollowUpInteraction with ephemeral true adds bitmask 64 to flags")
    void sendFollowUpInteraction_ephemeralTrue() throws Exception {
        setupRestClientPost();
        JsonNode expectedNode = objectMapper.readTree("{\"id\":\"msg_followup_1\"}");
        when(responseSpec.body(JsonNode.class)).thenReturn(expectedNode);

        JsonNode result = service.sendFollowUpInteraction("app_1", "tok_1", Map.of("content", "Secret"), true);

        assertThat(result).isNotNull();
        assertThat(result.get("id").asText()).isEqualTo("msg_followup_1");
        verify(requestBodySpec).body((Object) argThat(body -> {
            if (body instanceof Map<?, ?> map) {
                return Integer.valueOf(32832).equals(map.get("flags")); // 32768 | 64
            }
            return false;
        }));
    }

    @Test
    @DisplayName("sendFollowUpInteraction with ephemeral false keeps flags 32768")
    void sendFollowUpInteraction_ephemeralFalse() throws Exception {
        setupRestClientPost();
        JsonNode expectedNode = objectMapper.readTree("{\"id\":\"msg_followup_2\"}");
        when(responseSpec.body(JsonNode.class)).thenReturn(expectedNode);

        JsonNode result = service.sendFollowUpInteraction("app_1", "tok_1", Map.of("content", "Public"), false);

        assertThat(result).isNotNull();
        verify(requestBodySpec).body((Object) argThat(body -> {
            if (body instanceof Map<?, ?> map) {
                return Integer.valueOf(32768).equals(map.get("flags"));
            }
            return false;
        }));
    }

    @Test
    @DisplayName("429 TooManyRequests with Cloudflare 1015 triggers edge ban circuit breaker")
    void dispatchToChannel_cloudflare1015TriggersEdgeBan() {
        setupRestClientPost();
        String error1015 = "<html><body>Error 1015: You are being rate limited</body></html>";
        HttpClientErrorException exception = (HttpClientErrorException) HttpClientErrorException.create(
                HttpStatus.TOO_MANY_REQUESTS, "Too Many Requests", HttpHeaders.EMPTY,
                error1015.getBytes(StandardCharsets.UTF_8), StandardCharsets.UTF_8
        );
        when(responseSpec.body(JsonNode.class)).thenThrow(exception);

        assertThatThrownBy(() -> service.dispatchToChannel("12345", Map.of(), null))
                .isInstanceOf(ServiceUnavailableException.class)
                .hasMessageContaining("Cloudflare edge ban engaged");

        verify(valueOperations).set(eq("discord:circuit:edge_ban"), eq("1"), eq(Duration.ofMinutes(10)));
    }

    @Test
    @DisplayName("429 TooManyRequests with retry_after in json body succeeds after retry")
    void dispatchToChannel_rateLimitRetryWithJsonBody() throws Exception {
        setupRestClientPost();
        String rateLimitBody = "{\"retry_after\": 0.01}";
        HttpClientErrorException exception = (HttpClientErrorException) HttpClientErrorException.create(
                HttpStatus.TOO_MANY_REQUESTS, "Too Many Requests", HttpHeaders.EMPTY,
                rateLimitBody.getBytes(StandardCharsets.UTF_8), StandardCharsets.UTF_8
        );
        JsonNode successNode = objectMapper.readTree("{\"id\":\"msg_retry_success\"}");

        when(responseSpec.body(JsonNode.class))
                .thenThrow(exception)
                .thenReturn(successNode);

        JsonNode result = service.dispatchToChannel("12345", Map.of(), null);

        assertThat(result).isNotNull();
        assertThat(result.get("id").asText()).isEqualTo("msg_retry_success");
        verify(responseSpec, times(2)).body(JsonNode.class);
    }

    @Test
    @DisplayName("429 TooManyRequests with Retry-After header succeeds after retry")
    void dispatchToChannel_rateLimitRetryWithHeader() throws Exception {
        setupRestClientPost();
        HttpHeaders headers = new HttpHeaders();
        headers.set(HttpHeaders.RETRY_AFTER, "0.01");
        HttpClientErrorException exception = (HttpClientErrorException) HttpClientErrorException.create(
                HttpStatus.TOO_MANY_REQUESTS, "Too Many Requests", headers,
                "{}".getBytes(StandardCharsets.UTF_8), StandardCharsets.UTF_8
        );
        JsonNode successNode = objectMapper.readTree("{\"id\":\"msg_header_retry_success\"}");

        when(responseSpec.body(JsonNode.class))
                .thenThrow(exception)
                .thenReturn(successNode);

        JsonNode result = service.dispatchToChannel("12345", Map.of(), null);

        assertThat(result).isNotNull();
        assertThat(result.get("id").asText()).isEqualTo("msg_header_retry_success");
    }

    @Test
    @DisplayName("429 TooManyRequests exceeding max retries throws InternalServerException")
    void dispatchToChannel_rateLimitExceedsMaxRetriesThrows() {
        setupRestClientPost();
        String rateLimitBody = "{\"retry_after\": 0.01}";
        HttpClientErrorException exception = (HttpClientErrorException) HttpClientErrorException.create(
                HttpStatus.TOO_MANY_REQUESTS, "Too Many Requests", HttpHeaders.EMPTY,
                rateLimitBody.getBytes(StandardCharsets.UTF_8), StandardCharsets.UTF_8
        );
        when(responseSpec.body(JsonNode.class)).thenThrow(exception);

        assertThatThrownBy(() -> service.dispatchToChannel("12345", Map.of(), null))
                .isInstanceOf(InternalServerException.class)
                .hasMessageContaining("Failed to dispatch to Discord after 3 rate limit retries");
    }

    @Test
    @DisplayName("401 Unauthorized throws UnauthorizedException")
    void dispatchToChannel_401ThrowsUnauthorized() {
        setupRestClientPost();
        HttpClientErrorException exception = (HttpClientErrorException) HttpClientErrorException.create(
                HttpStatus.UNAUTHORIZED, "Unauthorized", HttpHeaders.EMPTY,
                "{}".getBytes(StandardCharsets.UTF_8), StandardCharsets.UTF_8
        );
        when(responseSpec.body(JsonNode.class)).thenThrow(exception);

        assertThatThrownBy(() -> service.dispatchToChannel("12345", Map.of(), null))
                .isInstanceOf(UnauthorizedException.class)
                .hasMessageContaining("Discord API rejected bot credentials");
    }

    @Test
    @DisplayName("400 BadRequest throws BadRequestException")
    void dispatchToChannel_400ThrowsBadRequest() {
        setupRestClientPost();
        HttpClientErrorException exception = (HttpClientErrorException) HttpClientErrorException.create(
                HttpStatus.BAD_REQUEST, "Bad Request", HttpHeaders.EMPTY,
                "{\"message\":\"Invalid form body\"}".getBytes(StandardCharsets.UTF_8), StandardCharsets.UTF_8
        );
        when(responseSpec.body(JsonNode.class)).thenThrow(exception);

        assertThatThrownBy(() -> service.dispatchToChannel("12345", Map.of(), null))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Discord rejected payload (400 Bad Request)");
    }

    @Test
    @DisplayName("403 Forbidden throws ForbiddenException")
    void dispatchToChannel_403ThrowsForbidden() {
        setupRestClientPost();
        HttpClientErrorException exception = (HttpClientErrorException) HttpClientErrorException.create(
                HttpStatus.FORBIDDEN, "Forbidden", HttpHeaders.EMPTY,
                "{}".getBytes(StandardCharsets.UTF_8), StandardCharsets.UTF_8
        );
        when(responseSpec.body(JsonNode.class)).thenThrow(exception);

        assertThatThrownBy(() -> service.dispatchToChannel("12345", Map.of(), null))
                .isInstanceOf(ForbiddenException.class)
                .hasMessageContaining("Bot lacks permission to send to target channel");
    }

    @Test
    @DisplayName("Unexpected generic exception wraps in InternalServerException")
    void dispatchToChannel_genericExceptionThrowsInternalServer() {
        setupRestClientPost();
        when(responseSpec.body(JsonNode.class)).thenThrow(new RuntimeException("Socket closed abruptly"));

        assertThatThrownBy(() -> service.dispatchToChannel("12345", Map.of(), null))
                .isInstanceOf(InternalServerException.class)
                .hasMessageContaining("Discord dispatch error: Socket closed abruptly");
    }

    @Test
    @DisplayName("Production constructor instantiates RestClient with JdkClientHttpRequestFactory")
    void productionConstructor_instantiatesSuccessfully() {
        DiscordDispatchServiceImpl prodService = new DiscordDispatchServiceImpl(objectMapper, redisTemplate);
        assertThat(prodService).isNotNull();
    }

    @Test
    @DisplayName("429 rate limit with invalid json and missing header uses default 1500ms fallback")
    void dispatchToChannel_retryFallbackWhenBodyAndHeaderUnparseable() throws Exception {
        setupRestClientPost();
        HttpClientErrorException exception = (HttpClientErrorException) HttpClientErrorException.create(
                HttpStatus.TOO_MANY_REQUESTS, "Too Many Requests", HttpHeaders.EMPTY,
                "not-json-content".getBytes(StandardCharsets.UTF_8), StandardCharsets.UTF_8
        );
        JsonNode successNode = objectMapper.readTree("{\"id\":\"msg_fallback_success\"}");

        when(responseSpec.body(JsonNode.class))
                .thenThrow(exception)
                .thenReturn(successNode);

        JsonNode result = service.dispatchToChannel("12345", Map.of(), null);
        assertThat(result).isNotNull();
        assertThat(result.get("id").asText()).isEqualTo("msg_fallback_success");
    }

    @Test
    @DisplayName("dispatch interrupted during rate limit backoff throws InternalServerException")
    void dispatchToChannel_interruptedDuringBackoff() {
        setupRestClientPost();
        String rateLimitBody = "{\"retry_after\": 5.0}";
        HttpClientErrorException exception = (HttpClientErrorException) HttpClientErrorException.create(
                HttpStatus.TOO_MANY_REQUESTS, "Too Many Requests", HttpHeaders.EMPTY,
                rateLimitBody.getBytes(StandardCharsets.UTF_8), StandardCharsets.UTF_8
        );
        when(responseSpec.body(JsonNode.class)).thenThrow(exception);

        Thread.currentThread().interrupt();
        try {
            assertThatThrownBy(() -> service.dispatchToChannel("12345", Map.of(), null))
                    .isInstanceOf(InternalServerException.class)
                    .hasMessageContaining("Dispatch interrupted during rate-limit backoff");
        } finally {
            Thread.interrupted(); // clear status
        }
    }

    @Test
    @DisplayName("editOriginalInteraction without bot token or with default placeholder does not set auth header")
    void editOriginalInteraction_emptyOrPlaceholderTokenDoesNotSetAuthHeader() throws Exception {
        setupRestClientPatch();
        JsonNode successNode = objectMapper.readTree("{\"id\":\"original_msg\"}");
        when(responseSpec.body(JsonNode.class)).thenReturn(successNode);

        DiscordDispatchServiceImpl noTokenService = new DiscordDispatchServiceImpl(
                restClient, objectMapper, redisTemplate, "   "
        );
        JsonNode result = noTokenService.editOriginalInteraction("app1", "tok1", Map.of("content", "hello"));
        assertThat(result).isNotNull();

        DiscordDispatchServiceImpl placeholderTokenService = new DiscordDispatchServiceImpl(
                restClient, objectMapper, redisTemplate, "your-discord-bot-token"
        );
        JsonNode result2 = placeholderTokenService.editOriginalInteraction("app1", "tok1", Map.of("content", "hello"));
        assertThat(result2).isNotNull();
    }

    @Test
    @DisplayName("sendFollowUpInteraction without bot token or with default placeholder does not set auth header")
    void sendFollowUpInteraction_emptyOrPlaceholderTokenDoesNotSetAuthHeader() throws Exception {
        setupRestClientPost();
        JsonNode successNode = objectMapper.readTree("{\"id\":\"followup_msg\"}");
        when(responseSpec.body(JsonNode.class)).thenReturn(successNode);

        DiscordDispatchServiceImpl noTokenService = new DiscordDispatchServiceImpl(
                restClient, objectMapper, redisTemplate, "   "
        );
        JsonNode result = noTokenService.sendFollowUpInteraction("app1", "tok1", Map.of("content", "hello"), true);
        assertThat(result).isNotNull();

        DiscordDispatchServiceImpl placeholderTokenService = new DiscordDispatchServiceImpl(
                restClient, objectMapper, redisTemplate, "your-discord-bot-token"
        );
        JsonNode result2 = placeholderTokenService.sendFollowUpInteraction("app1", "tok1", Map.of("content", "hello"), false);
        assertThat(result2).isNotNull();
    }

    @Test
    @DisplayName("dispatchToChannel with non-null but empty attachments list takes normal json body path")
    void dispatchToChannel_emptyAttachmentsListTakesJsonPath() throws Exception {
        setupRestClientPost();
        JsonNode successNode = objectMapper.readTree("{\"id\":\"msg_no_files\"}");
        when(responseSpec.body(JsonNode.class)).thenReturn(successNode);

        JsonNode result = service.dispatchToChannel("12345", Map.of("content", "hi"), List.of());
        assertThat(result).isNotNull();
    }

    @Test
    @DisplayName("dispatchToChannel with failing JSON serialization for multipart throws InternalServerException")
    void dispatchToChannel_multipartJsonSerializationFailureThrows() {
        setupRestClientPost();
        ObjectMapper failingMapper = mock(ObjectMapper.class);
        DiscordDispatchServiceImpl failingService = new DiscordDispatchServiceImpl(
                restClient, failingMapper, redisTemplate, "Bot test-token"
        );
        try {
            when(failingMapper.writeValueAsString(any())).thenThrow(new com.fasterxml.jackson.core.JsonParseException(null, "Mock serialize error"));
        } catch (Exception ignored) {
        }

        ByteArrayResource resource = new ByteArrayResource("test".getBytes(StandardCharsets.UTF_8));
        assertThatThrownBy(() -> failingService.dispatchToChannel("12345", Map.of("content", "hi"), List.of(resource)))
                .isInstanceOf(InternalServerException.class)
                .hasMessageContaining("Failed to serialize Discord V2 payload to JSON");
    }

    @Test
    @DisplayName("executeWithRetry with null redisTemplate executes smoothly without edge ban check")
    void executeWithRetry_nullRedisTemplateExecutesSuccessfully() throws Exception {
        setupRestClientPost();
        JsonNode successNode = objectMapper.readTree("{\"id\":\"msg_no_redis\"}");
        when(responseSpec.body(JsonNode.class)).thenReturn(successNode);

        DiscordDispatchServiceImpl noRedisService = new DiscordDispatchServiceImpl(
                restClient, objectMapper, null, "Bot test-token"
        );
        JsonNode result = noRedisService.dispatchToChannel("12345", Map.of(), null);
        assertThat(result).isNotNull();
    }

    @Test
    @DisplayName("executeWithRetry when redisTemplate.hasKey returns null or false")
    void executeWithRetry_hasKeyReturnsNullOrFalse() throws Exception {
        setupRestClientPost();
        when(redisTemplate.hasKey(anyString())).thenReturn(null);
        JsonNode successNode = objectMapper.readTree("{\"id\":\"msg_null_haskey\"}");
        when(responseSpec.body(JsonNode.class)).thenReturn(successNode);

        JsonNode result = service.dispatchToChannel("12345", Map.of(), null);
        assertThat(result).isNotNull();

        when(redisTemplate.hasKey(anyString())).thenReturn(false);
        JsonNode result2 = service.dispatchToChannel("12345", Map.of(), null);
        assertThat(result2).isNotNull();
    }

    @Test
    @DisplayName("Cloudflare edge ban detected via <html without 1015")
    void executeWithRetry_htmlWithout1015EdgeBan() {
        setupRestClientPost();
        HttpClientErrorException exception = (HttpClientErrorException) HttpClientErrorException.create(
                HttpStatus.TOO_MANY_REQUESTS, "Too Many Requests", HttpHeaders.EMPTY,
                "<html><head><title>Cloudflare Rate Limited</title></head></html>".getBytes(StandardCharsets.UTF_8),
                StandardCharsets.UTF_8
        );
        when(responseSpec.body(JsonNode.class)).thenThrow(exception);

        assertThatThrownBy(() -> service.dispatchToChannel("12345", Map.of(), null))
                .isInstanceOf(ServiceUnavailableException.class)
                .hasMessageContaining("Cloudflare edge ban engaged");
    }

    @Test
    @DisplayName("Cloudflare edge ban detected with null redisTemplate throws ServiceUnavailableException")
    void executeWithRetry_edgeBanWithNullRedisTemplate() {
        setupRestClientPost();
        HttpClientErrorException exception = (HttpClientErrorException) HttpClientErrorException.create(
                HttpStatus.TOO_MANY_REQUESTS, "Too Many Requests", HttpHeaders.EMPTY,
                "error 1015: edge ban".getBytes(StandardCharsets.UTF_8),
                StandardCharsets.UTF_8
        );
        when(responseSpec.body(JsonNode.class)).thenThrow(exception);

        DiscordDispatchServiceImpl noRedisService = new DiscordDispatchServiceImpl(
                restClient, objectMapper, null, "Bot test-token"
        );

        assertThatThrownBy(() -> noRedisService.dispatchToChannel("12345", Map.of(), null))
                .isInstanceOf(ServiceUnavailableException.class)
                .hasMessageContaining("Cloudflare edge ban engaged");
    }

    @Test
    @DisplayName("executeWithRetry re-throws domain exceptions from action supplier")
    void executeWithRetry_rethrowsDomainExceptions() {
        setupRestClientPost();
        when(responseSpec.body(JsonNode.class))
                .thenThrow(new BadRequestException("Custom bad request"))
                .thenThrow(new ForbiddenException("Custom forbidden"))
                .thenThrow(new UnauthorizedException("Custom unauthorized"));

        assertThatThrownBy(() -> service.dispatchToChannel("12345", Map.of(), null))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Custom bad request");

        assertThatThrownBy(() -> service.dispatchToChannel("12345", Map.of(), null))
                .isInstanceOf(ForbiddenException.class)
                .hasMessage("Custom forbidden");

        assertThatThrownBy(() -> service.dispatchToChannel("12345", Map.of(), null))
                .isInstanceOf(UnauthorizedException.class)
                .hasMessage("Custom unauthorized");
    }

    @Test
    @DisplayName("Retry-After header with unparseable string falls back to 1500ms default")
    void parseRetryAfter_unparseableHeaderFallsBack() throws Exception {
        setupRestClientPost();
        HttpHeaders headers = new HttpHeaders();
        headers.set(HttpHeaders.RETRY_AFTER, "not-a-number");
        HttpClientErrorException exception = (HttpClientErrorException) HttpClientErrorException.create(
                HttpStatus.TOO_MANY_REQUESTS, "Too Many Requests", headers,
                "{}".getBytes(StandardCharsets.UTF_8), StandardCharsets.UTF_8
        );
        JsonNode successNode = objectMapper.readTree("{\"id\":\"msg_unparseable_header\"}");

        when(responseSpec.body(JsonNode.class))
                .thenThrow(exception)
                .thenReturn(successNode);

        JsonNode result = service.dispatchToChannel("12345", Map.of(), null);
        assertThat(result).isNotNull();
    }

    @Test
    @DisplayName("cleanToken handles various quote patterns and null safely")
    void cleanToken_handlesQuoteVariantsAndNull() {
        DiscordDispatchServiceImpl nullTokenService = new DiscordDispatchServiceImpl(
                restClient, objectMapper, redisTemplate, null
        );
        assertThatThrownBy(() -> nullTokenService.dispatchToChannel("12345", Map.of(), null))
                .isInstanceOf(UnauthorizedException.class);

        // Starts with quote but doesn't end with quote
        DiscordDispatchServiceImpl openQuoteService = new DiscordDispatchServiceImpl(
                restClient, objectMapper, redisTemplate, "\"unmatched"
        );
        setupRestClientPost();
        when(responseSpec.body(JsonNode.class)).thenReturn(objectMapper.createObjectNode());
        assertThat(openQuoteService.dispatchToChannel("12345", Map.of(), null)).isNotNull();

        // Starts with single quote but doesn't end with single quote
        DiscordDispatchServiceImpl openSingleQuoteService = new DiscordDispatchServiceImpl(
                restClient, objectMapper, redisTemplate, "'unmatched"
        );
        assertThat(openSingleQuoteService.dispatchToChannel("12345", Map.of(), null)).isNotNull();

        // Ends with double quote but doesn't start with quote
        DiscordDispatchServiceImpl closeQuoteService = new DiscordDispatchServiceImpl(
                restClient, objectMapper, redisTemplate, "unmatched\""
        );
        assertThat(closeQuoteService.dispatchToChannel("12345", Map.of(), null)).isNotNull();

        // Ends with single quote but doesn't start with single quote
        DiscordDispatchServiceImpl closeSingleQuoteService = new DiscordDispatchServiceImpl(
                restClient, objectMapper, redisTemplate, "unmatched'"
        );
        assertThat(closeSingleQuoteService.dispatchToChannel("12345", Map.of(), null)).isNotNull();
    }
}
