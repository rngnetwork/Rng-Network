package com.rednecksgaming.security.jwt;

import com.rednecksgaming.common.security.SecurityConstants;
import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class JwtAuthenticationFilterTest {

    @Mock
    private JwtTokenProvider tokenProvider;

    @Mock
    private FilterChain filterChain;

    @InjectMocks
    private JwtAuthenticationFilter filter;

    private MockHttpServletRequest request;
    private MockHttpServletResponse response;

    @BeforeEach
    void setUp() {
        SecurityContextHolder.clearContext();
        request = new MockHttpServletRequest();
        response = new MockHttpServletResponse();
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("doFilterInternal without Authorization header proceeds without setting authentication")
    void doFilterInternal_withoutAuthHeader_proceeds() throws Exception {
        filter.doFilter(request, response, filterChain);

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        verify(filterChain).doFilter(request, response);
        verifyNoInteractions(tokenProvider);
    }

    @Test
    @DisplayName("doFilterInternal with non-Bearer Authorization header proceeds without setting authentication")
    void doFilterInternal_withNonBearerHeader_proceeds() throws Exception {
        request.addHeader(SecurityConstants.AUTHORIZATION_HEADER, "Basic dXNlcjpwYXNz");

        filter.doFilter(request, response, filterChain);

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        verify(filterChain).doFilter(request, response);
        verifyNoInteractions(tokenProvider);
    }

    @Test
    @DisplayName("doFilterInternal with invalid Bearer token proceeds without setting authentication")
    void doFilterInternal_withInvalidToken_proceeds() throws Exception {
        request.addHeader(SecurityConstants.AUTHORIZATION_HEADER, "Bearer invalid-jwt-token");
        when(tokenProvider.validateToken("invalid-jwt-token")).thenReturn(false);

        filter.doFilter(request, response, filterChain);

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        verify(filterChain).doFilter(request, response);
    }

    @Test
    @DisplayName("doFilterInternal with fully authenticated token sets userId, scope, role, and ROLE_USER")
    void doFilterInternal_withFullyAuthenticatedToken_setsContext() throws Exception {
        request.addHeader(SecurityConstants.AUTHORIZATION_HEADER, "Bearer valid-jwt-token");
        when(tokenProvider.validateToken("valid-jwt-token")).thenReturn(true);
        when(tokenProvider.getUserIdFromToken("valid-jwt-token")).thenReturn(42L);
        when(tokenProvider.getScopeFromToken("valid-jwt-token")).thenReturn(SecurityConstants.SCOPE_FULLY_AUTHENTICATED);
        when(tokenProvider.getRoleFromToken("valid-jwt-token")).thenReturn("ROLE_HIGH_COMMAND");

        filter.doFilter(request, response, filterChain);

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        assertThat(auth).isNotNull();
        assertThat(auth.getPrincipal()).isEqualTo(42L);
        assertThat(auth.getAuthorities().stream().map(GrantedAuthority::getAuthority))
                .containsExactlyInAnyOrder(
                        SecurityConstants.SCOPE_FULLY_AUTHENTICATED,
                        "ROLE_HIGH_COMMAND",
                        "ROLE_USER"
                );

        verify(filterChain).doFilter(request, response);
    }

    @Test
    @DisplayName("doFilterInternal with pre-2FA token does not add ROLE_USER")
    void doFilterInternal_withPre2FaToken_doesNotAddRoleUser() throws Exception {
        request.addHeader(SecurityConstants.AUTHORIZATION_HEADER, "Bearer pre2fa-token");
        when(tokenProvider.validateToken("pre2fa-token")).thenReturn(true);
        when(tokenProvider.getUserIdFromToken("pre2fa-token")).thenReturn(10L);
        when(tokenProvider.getScopeFromToken("pre2fa-token")).thenReturn(SecurityConstants.SCOPE_PRE_2FA);
        when(tokenProvider.getRoleFromToken("pre2fa-token")).thenReturn(null);

        filter.doFilter(request, response, filterChain);

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        assertThat(auth).isNotNull();
        assertThat(auth.getPrincipal()).isEqualTo(10L);
        assertThat(auth.getAuthorities().stream().map(GrantedAuthority::getAuthority))
                .containsExactly(SecurityConstants.SCOPE_PRE_2FA);

        verify(filterChain).doFilter(request, response);
    }

    @Test
    @DisplayName("doFilterInternal when token extraction throws exception catches and proceeds")
    void doFilterInternal_whenExceptionThrown_catchesAndProceeds() throws Exception {
        request.addHeader(SecurityConstants.AUTHORIZATION_HEADER, "Bearer error-throwing-token");
        when(tokenProvider.validateToken("error-throwing-token")).thenReturn(true);
        when(tokenProvider.getUserIdFromToken("error-throwing-token")).thenThrow(new RuntimeException("Malformed claims"));

        filter.doFilter(request, response, filterChain);

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        verify(filterChain).doFilter(request, response);
    }

    @Test
    @DisplayName("doFilterInternal with empty Bearer token string proceeds without setting authentication")
    void doFilterInternal_withEmptyBearerString_proceeds() throws Exception {
        request.addHeader(SecurityConstants.AUTHORIZATION_HEADER, "Bearer ");

        filter.doFilter(request, response, filterChain);

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        verify(filterChain).doFilter(request, response);
    }

    @Test
    @DisplayName("doFilterInternal with valid token having null scope and null role sets empty authorities")
    void doFilterInternal_withNullScopeAndRole_setsEmptyAuthorities() throws Exception {
        request.addHeader(SecurityConstants.AUTHORIZATION_HEADER, "Bearer bare-token");
        when(tokenProvider.validateToken("bare-token")).thenReturn(true);
        when(tokenProvider.getUserIdFromToken("bare-token")).thenReturn(77L);
        when(tokenProvider.getScopeFromToken("bare-token")).thenReturn(null);
        when(tokenProvider.getRoleFromToken("bare-token")).thenReturn(null);

        filter.doFilter(request, response, filterChain);

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        assertThat(auth).isNotNull();
        assertThat(auth.getPrincipal()).isEqualTo(77L);
        assertThat(auth.getAuthorities()).isEmpty();
        verify(filterChain).doFilter(request, response);
    }
}
