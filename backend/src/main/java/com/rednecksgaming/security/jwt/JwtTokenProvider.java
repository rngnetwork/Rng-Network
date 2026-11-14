// Written By: RachitSWE
// LICENSE: All rights reserved
// Year: 2026
package com.rednecksgaming.security.jwt;

import com.rednecksgaming.common.security.SecurityConstants;
import com.rednecksgaming.common.security.TokenService;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Component
public class JwtTokenProvider implements TokenService {

    private final SecretKey key;
    private final Set<String> revokedJtis = ConcurrentHashMap.newKeySet();
    private final Optional<RedisTokenStore> redisTokenStore;

    @Autowired
    public JwtTokenProvider(
            @Value("${jwt.secret:rngSecretKeyForJwtSigningMustBeAtLeast32BytesLongForHmacSha256!}") String secret,
            @Autowired(required = false) RedisTokenStore redisTokenStore
    ) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.redisTokenStore = Optional.ofNullable(redisTokenStore);
    }

    public JwtTokenProvider(String secret) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.redisTokenStore = Optional.empty();
    }

    @Override
    public String generatePre2FaToken(Long userId, String email) {
        String jti = UUID.randomUUID().toString();
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + SecurityConstants.PRE_2FA_TOKEN_EXPIRATION_MS);

        return Jwts.builder()
                .subject(String.valueOf(userId))
                .claim("email", email)
                .claim("scope", SecurityConstants.SCOPE_PRE_2FA)
                .id(jti)
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(key)
                .compact();
    }

    @Override
    public String generateAccessToken(Long userId, String email, String role) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + SecurityConstants.ACCESS_TOKEN_EXPIRATION_MS);

        return Jwts.builder()
                .subject(String.valueOf(userId))
                .claim("email", email)
                .claim("role", role)
                .claim("scope", SecurityConstants.SCOPE_FULLY_AUTHENTICATED)
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(key)
                .compact();
    }

    @Override
    public String generateRefreshToken(Long userId) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + SecurityConstants.REFRESH_TOKEN_EXPIRATION_MS);

        return Jwts.builder()
                .subject(String.valueOf(userId))
                .claim("type", "refresh")
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(key)
                .compact();
    }

    @Override
    public String generateResetRequestToken(Long userId, String email) {
        String jti = UUID.randomUUID().toString();
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + SecurityConstants.RESET_REQUEST_TOKEN_EXPIRATION_MS);

        return Jwts.builder()
                .subject(String.valueOf(userId))
                .claim("email", email)
                .claim("scope", SecurityConstants.SCOPE_RESET_REQUEST)
                .id(jti)
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(key)
                .compact();
    }

    @Override
    public String generateResetPasswordToken(Long userId, String email) {
        String jti = UUID.randomUUID().toString();
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + SecurityConstants.RESET_PASSWORD_TOKEN_EXPIRATION_MS);

        return Jwts.builder()
                .subject(String.valueOf(userId))
                .claim("email", email)
                .claim("scope", SecurityConstants.SCOPE_RESET_PASSWORD)
                .id(jti)
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(key)
                .compact();
    }

    @Override
    public boolean validateToken(String token) {
        try {
            Claims claims = getClaims(token);
            String jti = claims.getId();
            if (jti != null) {
                if (revokedJtis.contains(jti)) {
                    log.warn("JWT validation failed: jti {} is revoked in local store", jti);
                    return false;
                }
                if (redisTokenStore.isPresent() && redisTokenStore.get().isJtiRevoked(jti)) {
                    log.warn("JWT validation failed: jti {} is revoked in Redis store", jti);
                    return false;
                }
            }
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            log.warn("Invalid JWT token: {}", e.getMessage());
            return false;
        }
    }

    @Override
    public void revokeJti(String jti) {
        if (jti != null) {
            revokedJtis.add(jti);
            redisTokenStore.ifPresent(store -> store.revokeJti(jti, SecurityConstants.RESET_PASSWORD_TOKEN_EXPIRATION_MS));
            log.info("Revoked single-use JWT jti: {}", jti);
        }
    }

    @Override
    public Long getUserIdFromToken(String token) {
        Claims claims = getClaims(token);
        return Long.parseLong(claims.getSubject());
    }

    @Override
    public String getScopeFromToken(String token) {
        Claims claims = getClaims(token);
        return claims.get("scope", String.class);
    }

    @Override
    public String getRoleFromToken(String token) {
        Claims claims = getClaims(token);
        return claims.get("role", String.class);
    }

    @Override
    public String getJtiFromToken(String token) {
        Claims claims = getClaims(token);
        return claims.getId();
    }

    @Override
    public String getEmailFromToken(String token) {
        Claims claims = getClaims(token);
        return claims.get("email", String.class);
    }

    private Claims getClaims(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
