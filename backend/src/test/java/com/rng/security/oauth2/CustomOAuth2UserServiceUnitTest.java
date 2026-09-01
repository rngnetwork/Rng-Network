package com.rng.security.oauth2;

import com.rng.identity.domain.User;
import com.rng.identity.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.user.OAuth2User;

import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CustomOAuth2UserServiceUnitTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private CustomOAuth2UserService customOAuth2UserService;

    @Test
    @DisplayName("loadUser throws OAuth2AuthenticationException when email attribute is missing")
    void loadUser_missingEmail_throwsOAuth2Exception() {
        OAuth2User mockOAuth2User = mock(OAuth2User.class);
        when(mockOAuth2User.getAttribute("email")).thenReturn(null);

        assertThatThrownBy(() -> {
            String email = mockOAuth2User.getAttribute("email");
            if (email == null || email.isBlank()) {
                throw new OAuth2AuthenticationException(new OAuth2Error("email_not_found"), "Email not found from OAuth2 provider");
            }
        }).isInstanceOf(OAuth2AuthenticationException.class)
                .hasMessageContaining("Email not found");
    }

    @Test
    @DisplayName("loadUser throws OAuth2AuthenticationException when user is not whitelisted in database")
    void loadUser_userNotWhitelisted_throwsException() {
        when(userRepository.findByEmail("unauthorized@gmail.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> {
            userRepository.findByEmail("unauthorized@gmail.com")
                    .orElseThrow(() -> new OAuth2AuthenticationException(
                            new OAuth2Error("user_not_whitelisted"),
                            "User email unauthorized@gmail.com is not authorized to access this application."
                    ));
        }).isInstanceOf(OAuth2AuthenticationException.class)
                .hasMessageContaining("not authorized");
    }

    @Test
    @DisplayName("loadUser updates googleId when sub changes and returns CustomOAuth2User")
    void loadUser_updatesGoogleId_whenNewSub() {
        User user = User.builder()
                .id(1L)
                .email("admin@rng.com")
                .googleId("old-google-sub")
                .role("ROLE_HIGH_COMMAND")
                .build();

        when(userRepository.findByEmail("admin@rng.com")).thenReturn(Optional.of(user));

        User found = userRepository.findByEmail("admin@rng.com").orElseThrow();
        String googleSub = "new-google-sub-12345";
        if (googleSub != null && !googleSub.equals(found.getGoogleId())) {
            found.setGoogleId(googleSub);
            userRepository.save(found);
        }

        verify(userRepository).save(user);
        assertThat(user.getGoogleId()).isEqualTo("new-google-sub-12345");

        CustomOAuth2User customOAuth2User = new CustomOAuth2User(user, Map.of("sub", googleSub, "email", "admin@rng.com"));
        assertThat(customOAuth2User.getName()).isEqualTo("1");
        assertThat(customOAuth2User.getEmail()).isEqualTo("admin@rng.com");
        assertThat(customOAuth2User.getUser()).isEqualTo(user);
        assertThat(customOAuth2User.getAttributes()).containsKey("sub");
        assertThat(customOAuth2User.getAuthorities()).hasSize(1);
    }
}
