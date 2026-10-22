package com.rednecksgaming.security.oauth2;

import com.rednecksgaming.common.security.TokenService;
import com.rednecksgaming.identity.domain.User;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;

@Slf4j
@Component
@RequiredArgsConstructor
public class OAuth2AuthenticationSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final TokenService tokenService;

    @Value("${app.frontend.2fa-redirect-url:http://localhost:3000/auth/2fa}")
    private String redirectUrl;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication) throws IOException, ServletException {
        if (response.isCommitted()) {
            log.debug("Response has already been committed. Unable to redirect.");
            return;
        }

        CustomOAuth2User oAuth2User = (CustomOAuth2User) authentication.getPrincipal();
        User user = oAuth2User.getUser();

        String pre2FaToken = tokenService.generatePre2FaToken(user.getId(), user.getEmail());
        log.info("Google OAuth2 authentication successful for user {}. Issued pre-2FA token.", user.getEmail());

        String targetUrl = UriComponentsBuilder.fromUriString(redirectUrl)
                .queryParam("token", pre2FaToken)
                .queryParam("email", user.getEmail())
                .queryParam("discordLinked", user.isDiscordLinked())
                .build()
                .toUriString();

        clearAuthenticationAttributes(request);
        getRedirectStrategy().sendRedirect(request, response, targetUrl);
    }
}
