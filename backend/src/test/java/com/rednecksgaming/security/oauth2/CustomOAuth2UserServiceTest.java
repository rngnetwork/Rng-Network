package com.rednecksgaming.security.oauth2;

import com.rednecksgaming.identity.domain.AuthProvider;
import com.rednecksgaming.identity.domain.User;
import com.rednecksgaming.identity.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.RequestEntity;
import org.springframework.http.ResponseEntity;
import org.springframework.security.oauth2.client.registration.ClientRegistration;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.AuthorizationGrantType;
import org.springframework.security.oauth2.core.ClientAuthenticationMethod;
import org.springframework.security.oauth2.core.OAuth2AccessToken;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.client.RestOperations;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CustomOAuth2UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private RestOperations restOperations;

    private CustomOAuth2UserService customOAuth2UserService;
    private OAuth2UserRequest userRequest;

    @BeforeEach
    void setUp() {
        customOAuth2UserService = new CustomOAuth2UserService(userRepository);
        customOAuth2UserService.setRestOperations(restOperations);

        ClientRegistration clientRegistration = ClientRegistration.withRegistrationId("google")
                .clientId("test-google-client-id")
                .clientSecret("test-google-client-secret")
                .clientAuthenticationMethod(ClientAuthenticationMethod.CLIENT_SECRET_BASIC)
                .authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
                .redirectUri("http://localhost:8080/login/oauth2/code/google")
                .scope("openid", "profile", "email")
                .authorizationUri("https://accounts.google.com/o/oauth2/v2/auth")
                .tokenUri("https://oauth2.googleapis.com/token")
                .userInfoUri("https://www.googleapis.com/oauth2/v3/userinfo")
                .userNameAttributeName("sub")
                .clientName("Google")
                .build();

        OAuth2AccessToken accessToken = new OAuth2AccessToken(
                OAuth2AccessToken.TokenType.BEARER,
                "test-access-token-xyz",
                Instant.now(),
                Instant.now().plusSeconds(3600),
                Set.of("openid", "profile", "email")
        );

        userRequest = new OAuth2UserRequest(clientRegistration, accessToken);
    }

    @Test
    @DisplayName("loadUser throws OAuth2AuthenticationException when email attribute is missing")
    void loadUser_whenEmailMissing_throwsException() {
        Map<String, Object> attributes = new HashMap<>();
        attributes.put("sub", "google-sub-12345");
        attributes.put("name", "Test User");

        when(restOperations.exchange(any(RequestEntity.class), any(ParameterizedTypeReference.class)))
                .thenReturn(ResponseEntity.ok(attributes));

        assertThatThrownBy(() -> customOAuth2UserService.loadUser(userRequest))
                .isInstanceOf(OAuth2AuthenticationException.class)
                .hasMessageContaining("Email not found from OAuth2 provider");
    }

    @Test
    @DisplayName("loadUser throws OAuth2AuthenticationException when user is not whitelisted in database")
    void loadUser_whenUserNotWhitelisted_throwsException() {
        Map<String, Object> attributes = new HashMap<>();
        attributes.put("sub", "google-sub-12345");
        attributes.put("email", "outsider@unknown.com");

        when(restOperations.exchange(any(RequestEntity.class), any(ParameterizedTypeReference.class)))
                .thenReturn(ResponseEntity.ok(attributes));

        when(userRepository.findByEmail("outsider@unknown.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> customOAuth2UserService.loadUser(userRequest))
                .isInstanceOf(OAuth2AuthenticationException.class)
                .hasMessageContaining("User email outsider@unknown.com is not authorized");
    }

    @Test
    @DisplayName("loadUser links Google ID when user is whitelisted and googleId is null")
    void loadUser_whenGoogleIdNull_linksAndSavesUser() {
        Map<String, Object> attributes = new HashMap<>();
        attributes.put("sub", "google-sub-99999");
        attributes.put("email", "officer@rednecksgaming.com");
        attributes.put("name", "RNG Officer");

        User existingUser = User.builder()
                .id(10L)
                .email("officer@rednecksgaming.com")
                .provider(AuthProvider.GOOGLE)
                .googleId(null)
                .role("ROLE_USER")
                .build();

        when(restOperations.exchange(any(RequestEntity.class), any(ParameterizedTypeReference.class)))
                .thenReturn(ResponseEntity.ok(attributes));
        when(userRepository.findByEmail("officer@rednecksgaming.com")).thenReturn(Optional.of(existingUser));

        OAuth2User loadedUser = customOAuth2UserService.loadUser(userRequest);

        assertThat(loadedUser).isInstanceOf(CustomOAuth2User.class);
        CustomOAuth2User customUser = (CustomOAuth2User) loadedUser;
        assertThat(customUser.getName()).isEqualTo("10");
        assertThat(customUser.getEmail()).isEqualTo("officer@rednecksgaming.com");

        verify(userRepository).save(existingUser);
    }

    @Test
    @DisplayName("loadUser does not save user when Google ID already matches")
    void loadUser_whenGoogleIdMatches_doesNotSaveAgain() {
        Map<String, Object> attributes = new HashMap<>();
        attributes.put("sub", "google-sub-already-set");
        attributes.put("email", "commander@rednecksgaming.com");

        User existingUser = User.builder()
                .id(20L)
                .email("commander@rednecksgaming.com")
                .provider(AuthProvider.GOOGLE)
                .googleId("google-sub-already-set")
                .role("ROLE_HIGH_COMMAND")
                .build();

        when(restOperations.exchange(any(RequestEntity.class), any(ParameterizedTypeReference.class)))
                .thenReturn(ResponseEntity.ok(attributes));
        when(userRepository.findByEmail("commander@rednecksgaming.com")).thenReturn(Optional.of(existingUser));

        OAuth2User loadedUser = customOAuth2UserService.loadUser(userRequest);

        assertThat(loadedUser).isNotNull();
        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("loadUser updates and saves user when Google ID differs")
    void loadUser_whenGoogleIdDiffers_updatesAndSavesUser() {
        Map<String, Object> attributes = new HashMap<>();
        attributes.put("sub", "google-sub-new");
        attributes.put("email", "commander@rednecksgaming.com");

        User existingUser = User.builder()
                .id(20L)
                .email("commander@rednecksgaming.com")
                .provider(AuthProvider.GOOGLE)
                .googleId("google-sub-old")
                .role("ROLE_HIGH_COMMAND")
                .build();

        when(restOperations.exchange(any(RequestEntity.class), any(ParameterizedTypeReference.class)))
                .thenReturn(ResponseEntity.ok(attributes));
        when(userRepository.findByEmail("commander@rednecksgaming.com")).thenReturn(Optional.of(existingUser));

        OAuth2User loadedUser = customOAuth2UserService.loadUser(userRequest);

        assertThat(loadedUser).isNotNull();
        assertThat(existingUser.getGoogleId()).isEqualTo("google-sub-new");
        verify(userRepository).save(existingUser);
    }

    @Test
    @DisplayName("loadUser does not attempt to set googleId when sub is null or blank")
    void loadUser_whenGoogleSubNullOrBlank_doesNotSaveUser() {
        Map<String, Object> attributes = new HashMap<>();
        attributes.put("sub", "   ");
        attributes.put("email", "officer@rednecksgaming.com");

        User existingUser = User.builder()
                .id(30L)
                .email("officer@rednecksgaming.com")
                .provider(AuthProvider.GOOGLE)
                .googleId(null)
                .role("ROLE_USER")
                .build();

        when(restOperations.exchange(any(RequestEntity.class), any(ParameterizedTypeReference.class)))
                .thenReturn(ResponseEntity.ok(attributes));
        when(userRepository.findByEmail("officer@rednecksgaming.com")).thenReturn(Optional.of(existingUser));

        OAuth2User loadedUser = customOAuth2UserService.loadUser(userRequest);

        assertThat(loadedUser).isNotNull();
        verify(userRepository, never()).save(any());
    }
}
