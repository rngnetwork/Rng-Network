package com.rng.security.oauth2;

import com.rng.identity.domain.User;
import com.rng.identity.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.oauth2.client.registration.ClientRegistration;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.AuthorizationGrantType;
import org.springframework.security.oauth2.core.OAuth2AccessToken;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.client.RestOperations;

import java.time.Instant;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CustomOAuth2UserServiceUnitTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private RestOperations restOperations;

    @InjectMocks
    private CustomOAuth2UserService customOAuth2UserService;

    private OAuth2UserRequest userRequest;

    @BeforeEach
    void setUp() {
        customOAuth2UserService.setRestOperations(restOperations);

        ClientRegistration clientRegistration = ClientRegistration.withRegistrationId("google")
                .clientId("google-client-id")
                .clientSecret("google-secret")
                .authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
                .redirectUri("http://localhost:3000/auth/callback")
                .authorizationUri("https://accounts.google.com/o/oauth2/v2/auth")
                .tokenUri("https://oauth2.googleapis.com/token")
                .userInfoUri("https://www.googleapis.com/oauth2/v3/userinfo")
                .userNameAttributeName("sub")
                .build();

        userRequest = new OAuth2UserRequest(
                clientRegistration,
                new OAuth2AccessToken(OAuth2AccessToken.TokenType.BEARER, "token-value", Instant.now(), Instant.now().plusSeconds(3600))
        );
    }

    @Test
    @DisplayName("loadUser throws OAuth2AuthenticationException when email attribute is missing")
    void loadUser_missingEmail_throwsOAuth2Exception() {
        Map<String, Object> attributes = Map.of("sub", "sub-12345");
        when(restOperations.exchange(anyString(), eq(HttpMethod.GET), any(HttpEntity.class), any(ParameterizedTypeReference.class)))
                .thenReturn(new ResponseEntity<>(attributes, HttpStatus.OK));

        assertThatThrownBy(() -> customOAuth2UserService.loadUser(userRequest))
                .isInstanceOf(OAuth2AuthenticationException.class)
                .hasMessageContaining("Email not found");
    }

    @Test
    @DisplayName("loadUser throws OAuth2AuthenticationException when user is not whitelisted in database")
    void loadUser_userNotWhitelisted_throwsException() {
        Map<String, Object> attributes = Map.of("sub", "sub-12345", "email", "unauthorized@rng.com");
        when(restOperations.exchange(anyString(), eq(HttpMethod.GET), any(HttpEntity.class), any(ParameterizedTypeReference.class)))
                .thenReturn(new ResponseEntity<>(attributes, HttpStatus.OK));
        when(userRepository.findByEmail("unauthorized@rng.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> customOAuth2UserService.loadUser(userRequest))
                .isInstanceOf(OAuth2AuthenticationException.class)
                .hasMessageContaining("not authorized");
    }

    @Test
    @DisplayName("loadUser updates googleId when sub changes and returns CustomOAuth2User")
    void loadUser_updatesGoogleId_whenNewSub() {
        Map<String, Object> attributes = Map.of("sub", "new-google-sub", "email", "admin@rng.com");
        when(restOperations.exchange(anyString(), eq(HttpMethod.GET), any(HttpEntity.class), any(ParameterizedTypeReference.class)))
                .thenReturn(new ResponseEntity<>(attributes, HttpStatus.OK));

        User user = User.builder()
                .id(1L)
                .email("admin@rng.com")
                .googleId("old-google-sub")
                .role("ROLE_HIGH_COMMAND")
                .build();

        when(userRepository.findByEmail("admin@rng.com")).thenReturn(Optional.of(user));

        OAuth2User loaded = customOAuth2UserService.loadUser(userRequest);

        assertThat(loaded).isNotNull();
        assertThat(loaded.getName()).isEqualTo("1");
        assertThat(user.getGoogleId()).isEqualTo("new-google-sub");
        verify(userRepository).save(user);
    }
}
