// Written By: RachitSWE
// LICENSE: All rights reserved
// Year: 2026
package com.rednecksgaming.security.oauth2;

import com.rednecksgaming.common.security.TokenService;
import com.rednecksgaming.identity.domain.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.RedirectStrategy;
import org.springframework.test.util.ReflectionTestUtils;

import java.io.IOException;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OAuth2AuthenticationSuccessHandlerTest {

    @Mock
    private TokenService tokenService;

    @Mock
    private Authentication authentication;

    @Mock
    private RedirectStrategy redirectStrategy;

    @Captor
    private ArgumentCaptor<String> redirectUrlCaptor;

    private OAuth2AuthenticationSuccessHandler successHandler;
    private MockHttpServletRequest request;
    private MockHttpServletResponse response;

    private static final String REDIRECT_URL = "http://localhost:3000/auth/2fa";

    @BeforeEach
    void setUp() {
        successHandler = new OAuth2AuthenticationSuccessHandler(tokenService);
        ReflectionTestUtils.setField(successHandler, "redirectUrl", REDIRECT_URL);
        successHandler.setRedirectStrategy(redirectStrategy);

        request = new MockHttpServletRequest();
        response = new MockHttpServletResponse();
    }

    @Test
    @DisplayName("onAuthenticationSuccess when response is already committed does not perform redirect")
    void onAuthenticationSuccess_whenResponseCommitted_returnsEarly() throws Exception {
        MockHttpServletResponse committedResponse = spy(new MockHttpServletResponse());
        when(committedResponse.isCommitted()).thenReturn(true);

        successHandler.onAuthenticationSuccess(request, committedResponse, authentication);

        verifyNoInteractions(tokenService);
        verifyNoInteractions(redirectStrategy);
    }

    @Test
    @DisplayName("onAuthenticationSuccess issues pre-2FA token and redirects with discordLinked true")
    void onAuthenticationSuccess_whenDiscordLinkedTrue_redirectsWithParams() throws Exception {
        User user = User.builder()
                .id(42L)
                .email("commander@rednecksgaming.com")
                .discordLinked(true)
                .build();

        CustomOAuth2User customOAuth2User = new CustomOAuth2User(user, Map.of("email", "commander@rednecksgaming.com"));
        when(authentication.getPrincipal()).thenReturn(customOAuth2User);
        when(tokenService.generatePre2FaToken(42L, "commander@rednecksgaming.com")).thenReturn("pre-2fa-jwt-token-123");

        successHandler.onAuthenticationSuccess(request, response, authentication);

        verify(tokenService).generatePre2FaToken(42L, "commander@rednecksgaming.com");
        verify(redirectStrategy).sendRedirect(eq(request), eq(response), redirectUrlCaptor.capture());

        String targetUrl = redirectUrlCaptor.getValue();
        assertThat(targetUrl).startsWith(REDIRECT_URL);
        assertThat(targetUrl).contains("token=pre-2fa-jwt-token-123");
        assertThat(targetUrl).contains("email=commander@rednecksgaming.com");
        assertThat(targetUrl).contains("discordLinked=true");
    }

    @Test
    @DisplayName("onAuthenticationSuccess issues pre-2FA token and redirects with discordLinked false")
    void onAuthenticationSuccess_whenDiscordLinkedFalse_redirectsWithParams() throws Exception {
        User user = User.builder()
                .id(99L)
                .email("newrecruit@rednecksgaming.com")
                .discordLinked(false)
                .build();

        CustomOAuth2User customOAuth2User = new CustomOAuth2User(user, Map.of("email", "newrecruit@rednecksgaming.com"));
        when(authentication.getPrincipal()).thenReturn(customOAuth2User);
        when(tokenService.generatePre2FaToken(99L, "newrecruit@rednecksgaming.com")).thenReturn("pre-2fa-jwt-token-456");

        successHandler.onAuthenticationSuccess(request, response, authentication);

        verify(tokenService).generatePre2FaToken(99L, "newrecruit@rednecksgaming.com");
        verify(redirectStrategy).sendRedirect(eq(request), eq(response), redirectUrlCaptor.capture());

        String targetUrl = redirectUrlCaptor.getValue();
        assertThat(targetUrl).startsWith(REDIRECT_URL);
        assertThat(targetUrl).contains("token=pre-2fa-jwt-token-456");
        assertThat(targetUrl).contains("email=newrecruit@rednecksgaming.com");
        assertThat(targetUrl).contains("discordLinked=false");
    }
}
