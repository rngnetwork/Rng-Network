package com.rng.identity.service;

import com.rng.common.dto.DiscordUserDto;
import com.rng.common.exception.BadCredentialsException;
import com.rng.common.exception.ConflictException;
import com.rng.common.exception.ResourceNotFoundException;
import com.rng.common.exception.UnauthorizedException;
import com.rng.common.security.DiscordClient;
import com.rng.common.security.SecurityConstants;
import com.rng.common.security.TokenService;
import com.rng.identity.domain.User;
import com.rng.identity.dto.*;
import com.rng.identity.repository.UserRepository;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final TokenService tokenService;
    private final DiscordClient discordClient;

    @Transactional
    public Pre2FaResponse authenticateEmailPassword(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> {
                    log.warn("Login attempt failed: Email {} not found in whitelist", request.getEmail());
                    return new BadCredentialsException("Invalid email or password");
                });

        if (user.getPassword() == null || user.getPassword().isBlank()) {
            // First login attempt: automatically register password into PostgreSQL
            log.info("First-time login: Registering initial password for whitelisted user {}", user.getEmail());
            user.setPassword(passwordEncoder.encode(request.getPassword()));
            userRepository.save(user);
        } else {
            if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
                log.warn("Login attempt failed: Password mismatch for email {}", request.getEmail());
                throw new BadCredentialsException("Invalid email or password");
            }
        }

        String pre2FaToken = tokenService.generatePre2FaToken(user.getId(), user.getEmail());
        log.info("Email authentication successful for user {}. Issued pre-2FA token.", user.getEmail());

        return Pre2FaResponse.builder()
                .token(pre2FaToken)
                .requiresDiscord2Fa(true)
                .discordLinked(user.isDiscordLinked())
                .userEmail(user.getEmail())
                .build();
    }

    @Transactional
    public AuthResponse processDiscord2Fa(Long userId, String pre2FaJti, String discordCode, HttpServletResponse response) {
        // 1. Revoke single-use pre-2FA token
        if (pre2FaJti != null) {
            tokenService.revokeJti(pre2FaJti);
        }

        // 2. Fetch User
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // 3. Perform Discord OAuth2 exchange
        DiscordUserDto discordUser = discordClient.fetchDiscordUser(discordCode);
        String discordId = discordUser.getId();

        // 4. Verification & Linking Logic
        if (user.isDiscordLinked()) {
            if (!discordId.equals(user.getDiscordId())) {
                log.warn("Discord 2FA failure: User {} linked to Discord ID {} but provided {}",
                        user.getEmail(), user.getDiscordId(), discordId);
                throw new ConflictException("Linked Discord account mismatch. Please log in with the linked Discord account.");
            }
        } else {
            if (userRepository.existsByDiscordId(discordId)) {
                log.warn("Discord 2FA failure: Discord ID {} is already linked to another account", discordId);
                throw new ConflictException("Discord account is already linked to another registered user.");
            }
            user.setDiscordId(discordId);
            user.setDiscordLinked(true);
            log.info("Linked Discord account {} ({}) to user {}", discordUser.getUsername(), discordId, user.getEmail());
        }

        // Always sync latest Discord username and avatar on every successful 2FA verification
        user.setDiscordUsername(discordUser.getUsername());
        user.setDiscordAvatar(discordUser.getAvatar());
        userRepository.save(user);

        // 5. Issue Full Access Token & Refresh Token
        String accessToken = tokenService.generateAccessToken(user.getId(), user.getEmail(), user.getRole());
        String refreshToken = tokenService.generateRefreshToken(user.getId());

        // 6. Attach HttpOnly Refresh Cookie
        addRefreshCookie(response, refreshToken, (int) (SecurityConstants.REFRESH_TOKEN_EXPIRATION_MS / 1000));

        return AuthResponse.builder()
                .accessToken(accessToken)
                .tokenType("Bearer")
                .expiresIn(SecurityConstants.ACCESS_TOKEN_EXPIRATION_MS / 1000)
                .userEmail(user.getEmail())
                .role(user.getRole())
                .build();
    }

    @Transactional(readOnly = true)
    public AuthResponse refreshAccessToken(String refreshToken) {
        if (refreshToken == null || !tokenService.validateToken(refreshToken)) {
            throw new UnauthorizedException("Invalid or expired refresh token");
        }

        Long userId = tokenService.getUserIdFromToken(refreshToken);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UnauthorizedException("User not found"));

        String newAccessToken = tokenService.generateAccessToken(user.getId(), user.getEmail(), user.getRole());

        return AuthResponse.builder()
                .accessToken(newAccessToken)
                .tokenType("Bearer")
                .expiresIn(SecurityConstants.ACCESS_TOKEN_EXPIRATION_MS / 1000)
                .userEmail(user.getEmail())
                .role(user.getRole())
                .build();
    }

    public void logout(HttpServletResponse response) {
        addRefreshCookie(response, "", 0);
    }

    @org.springframework.beans.factory.annotation.Value("${app.security.cookie-secure:false}")
    private boolean cookieSecure;

    @Transactional(readOnly = true)
    public UserResponse getCurrentUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        return UserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .provider(user.getProvider().name())
                .discordId(user.getDiscordId())
                .discordUsername(user.getDiscordUsername())
                .discordAvatar(user.getDiscordAvatar())
                .discordLinked(user.isDiscordLinked())
                .role(user.getRole())
                .designations(user.getDesignations())
                .roles(user.getRoles())
                .designationList(user.getDesignationList())
                .roleList(user.getRoleList())
                .status(user.getStatus())
                .build();
    }

    private void addRefreshCookie(HttpServletResponse response, String value, int maxAge) {
        ResponseCookie cookie = ResponseCookie.from(SecurityConstants.REFRESH_TOKEN_COOKIE_NAME, value)
                .httpOnly(true)
                .secure(cookieSecure)
                .sameSite("Strict")
                .path("/api/v1/auth")
                .maxAge(maxAge)
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }
}
