package com.rng.security;

import com.rng.common.security.SecurityConstants;
import com.rng.security.jwt.JwtAuthenticationFilter;
import com.rng.security.jwt.JwtTokenProvider;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.io.IOException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class JwtAuthFilterUnitTest {

    @Mock
    private JwtTokenProvider tokenProvider;

    @Mock
    private HttpServletRequest request;

    @Mock
    private HttpServletResponse response;

    @Mock
    private FilterChain filterChain;

    @InjectMocks
    private JwtAuthenticationFilter filter;

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("Valid FULLY_AUTHENTICATED access token populates SecurityContextHolder with authorities and ROLE_USER")
    void doFilterInternal_validFullyAuthenticated_setsSecurityContext() throws ServletException, IOException {
        String token = "valid.jwt.token";
        when(request.getHeader(SecurityConstants.AUTHORIZATION_HEADER)).thenReturn("Bearer " + token);
        when(tokenProvider.validateToken(token)).thenReturn(true);
        when(tokenProvider.getUserIdFromToken(token)).thenReturn(100L);
        when(tokenProvider.getScopeFromToken(token)).thenReturn(SecurityConstants.SCOPE_FULLY_AUTHENTICATED);
        when(tokenProvider.getRoleFromToken(token)).thenReturn("ROLE_HIGH_COMMAND");

        filter.doFilter(request, response, filterChain);

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        assertThat(auth).isNotNull();
        assertThat(auth.getPrincipal()).isEqualTo(100L);
        assertThat(auth.getAuthorities().stream().map(Object::toString))
                .contains(SecurityConstants.SCOPE_FULLY_AUTHENTICATED, "ROLE_HIGH_COMMAND", "ROLE_USER");

        verify(filterChain).doFilter(request, response);
    }

    @Test
    @DisplayName("SCOPE_PRE_2FA token populates SecurityContextHolder with scope only (no ROLE_USER)")
    void doFilterInternal_pre2FaToken_setsPre2FaAuthorityOnly() throws ServletException, IOException {
        String token = "pre2fa.jwt.token";
        when(request.getHeader(SecurityConstants.AUTHORIZATION_HEADER)).thenReturn("Bearer " + token);
        when(tokenProvider.validateToken(token)).thenReturn(true);
        when(tokenProvider.getUserIdFromToken(token)).thenReturn(101L);
        when(tokenProvider.getScopeFromToken(token)).thenReturn(SecurityConstants.SCOPE_PRE_2FA);
        when(tokenProvider.getRoleFromToken(token)).thenReturn(null);

        filter.doFilter(request, response, filterChain);

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        assertThat(auth).isNotNull();
        assertThat(auth.getAuthorities().stream().map(Object::toString))
                .containsExactly(SecurityConstants.SCOPE_PRE_2FA);

        verify(filterChain).doFilter(request, response);
    }

    @Test
    @DisplayName("SCOPE_RESET_PASSWORD token populates SecurityContextHolder with SCOPE_RESET_PASSWORD")
    void doFilterInternal_resetPasswordToken_setsResetPasswordScope() throws ServletException, IOException {
        String token = "reset.jwt.token";
        when(request.getHeader(SecurityConstants.AUTHORIZATION_HEADER)).thenReturn("Bearer " + token);
        when(tokenProvider.validateToken(token)).thenReturn(true);
        when(tokenProvider.getUserIdFromToken(token)).thenReturn(102L);
        when(tokenProvider.getScopeFromToken(token)).thenReturn(SecurityConstants.SCOPE_RESET_PASSWORD);
        when(tokenProvider.getRoleFromToken(token)).thenReturn(null);

        filter.doFilter(request, response, filterChain);

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        assertThat(auth).isNotNull();
        assertThat(auth.getAuthorities().stream().map(Object::toString))
                .containsExactly(SecurityConstants.SCOPE_RESET_PASSWORD);

        verify(filterChain).doFilter(request, response);
    }

    @Test
    @DisplayName("Missing Authorization header proceeds through filterChain without setting SecurityContext")
    void doFilterInternal_missingHeader_noSecurityContext() throws ServletException, IOException {
        when(request.getHeader(SecurityConstants.AUTHORIZATION_HEADER)).thenReturn(null);

        filter.doFilter(request, response, filterChain);

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        verify(filterChain).doFilter(request, response);
    }

    @Test
    @DisplayName("Non-Bearer Authorization header proceeds without setting SecurityContext")
    void doFilterInternal_nonBearerHeader_noSecurityContext() throws ServletException, IOException {
        when(request.getHeader(SecurityConstants.AUTHORIZATION_HEADER)).thenReturn("Basic dXNlcjpwYXNz");

        filter.doFilter(request, response, filterChain);

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        verify(filterChain).doFilter(request, response);
    }

    @Test
    @DisplayName("Invalid or expired JWT token proceeds without setting SecurityContext")
    void doFilterInternal_invalidToken_noSecurityContext() throws ServletException, IOException {
        when(request.getHeader(SecurityConstants.AUTHORIZATION_HEADER)).thenReturn("Bearer invalid.token");
        when(tokenProvider.validateToken("invalid.token")).thenReturn(false);

        filter.doFilter(request, response, filterChain);

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        verify(filterChain).doFilter(request, response);
    }

    @Test
    @DisplayName("TokenProvider throwing exception during validation is caught and filter proceeds safely")
    void doFilterInternal_exceptionThrown_handledGracefully() throws ServletException, IOException {
        when(request.getHeader(SecurityConstants.AUTHORIZATION_HEADER)).thenReturn("Bearer error.token");
        when(tokenProvider.validateToken("error.token")).thenThrow(new RuntimeException("Parsing failure"));

        filter.doFilter(request, response, filterChain);

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        verify(filterChain).doFilter(request, response);
    }
}
