package com.rng.security.oauth2;

import com.rng.common.security.TokenService;
import com.rng.identity.domain.User;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;
import org.springframework.test.util.ReflectionTestUtils;

import java.io.IOException;
import java.util.Map;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OAuth2AuthenticationSuccessHandlerUnitTest {

    @Mock
    private TokenService tokenService;

    @Mock
    private HttpServletRequest request;

    @Mock
    private HttpServletResponse response;

    @Mock
    private Authentication authentication;

    @InjectMocks
    private OAuth2AuthenticationSuccessHandler successHandler;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(successHandler, "redirectUrl", "http://localhost:3000/auth/2fa");
    }

    @Test
    @DisplayName("onAuthenticationSuccess returns early if response is already committed")
    void onAuthenticationSuccess_responseCommitted_returnsEarly() throws IOException, ServletException {
        when(response.isCommitted()).thenReturn(true);

        successHandler.onAuthenticationSuccess(request, response, authentication);

        verifyNoInteractions(tokenService);
        verify(response, never()).sendRedirect(any());
    }

    @Test
    @DisplayName("onAuthenticationSuccess issues Pre-2FA token and redirects to frontend with query parameters")
    void onAuthenticationSuccess_uncommitted_redirectsWithParams() throws IOException, ServletException {
        User user = User.builder()
                .id(42L)
                .email("google.user@rng.com")
                .discordLinked(true)
                .build();

        CustomOAuth2User customOAuth2User = new CustomOAuth2User(user, Map.of("sub", "sub-123", "email", "google.user@rng.com"));
        when(response.isCommitted()).thenReturn(false);
        when(response.encodeRedirectURL(anyString())).thenAnswer(invocation -> invocation.getArgument(0));
        when(authentication.getPrincipal()).thenReturn(customOAuth2User);
        when(tokenService.generatePre2FaToken(42L, "google.user@rng.com")).thenReturn("pre-2fa-token-xyz");

        successHandler.onAuthenticationSuccess(request, response, authentication);

        verify(tokenService).generatePre2FaToken(42L, "google.user@rng.com");
        verify(response).sendRedirect(contains("http://localhost:3000/auth/2fa?token=pre-2fa-token-xyz&email=google.user@rng.com&discordLinked=true"));
    }
}
