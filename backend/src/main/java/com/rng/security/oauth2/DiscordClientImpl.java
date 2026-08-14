package com.rng.security.oauth2;

import com.rng.common.dto.DiscordUserDto;
import com.rng.common.exception.UnauthorizedException;
import com.rng.common.security.DiscordClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class DiscordClientImpl implements DiscordClient {

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${spring.security.oauth2.client.registration.discord.client-id:discord-client-id-placeholder}")
    private String clientId;

    @Value("${spring.security.oauth2.client.registration.discord.client-secret:discord-client-secret-placeholder}")
    private String clientSecret;

    @Value("${app.discord.redirect-uri:${NEXT_PUBLIC_DISCORD_REDIRECT_URI:http://localhost:3000/auth/discord/callback}}")
    private String redirectUri;

    @Override
    public DiscordUserDto fetchDiscordUser(String code) {
        try {
            // 1. Exchange OAuth2 Code for Access Token
            HttpHeaders tokenHeaders = new HttpHeaders();
            tokenHeaders.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

            MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
            body.add("client_id", clientId);
            body.add("client_secret", clientSecret);
            body.add("grant_type", "authorization_code");
            body.add("code", code);
            body.add("redirect_uri", redirectUri);

            HttpEntity<MultiValueMap<String, String>> tokenRequest = new HttpEntity<>(body, tokenHeaders);
            ResponseEntity<Map> tokenResponse = restTemplate.postForEntity("https://discord.com/api/oauth2/token", tokenRequest, Map.class);

            if (!tokenResponse.getStatusCode().is2xxSuccessful() || tokenResponse.getBody() == null) {
                throw new UnauthorizedException("Failed to obtain Discord OAuth2 token");
            }

            String discordAccessToken = (String) tokenResponse.getBody().get("access_token");

            // 2. Fetch User Profile
            HttpHeaders userHeaders = new HttpHeaders();
            userHeaders.setBearerAuth(discordAccessToken);
            HttpEntity<Void> userRequest = new HttpEntity<>(userHeaders);

            ResponseEntity<Map> userResponse = restTemplate.exchange("https://discord.com/api/users/@me", HttpMethod.GET, userRequest, Map.class);
            if (!userResponse.getStatusCode().is2xxSuccessful() || userResponse.getBody() == null) {
                throw new UnauthorizedException("Failed to fetch Discord user details");
            }

            Map<String, Object> userBody = userResponse.getBody();
            String id = (String) userBody.get("id");
            String username = (String) userBody.get("username");
            String email = (String) userBody.get("email");
            String avatar = (String) userBody.get("avatar");

            log.info("Successfully fetched Discord user: {} ({})", username, id);

            return DiscordUserDto.builder()
                    .id(id)
                    .username(username)
                    .email(email)
                    .avatar(avatar)
                    .build();
        } catch (Exception e) {
            log.error("Discord OAuth2 exchange failed: {}", e.getMessage());
            throw new UnauthorizedException("Invalid or expired Discord OAuth2 code: " + e.getMessage());
        }
    }
}
