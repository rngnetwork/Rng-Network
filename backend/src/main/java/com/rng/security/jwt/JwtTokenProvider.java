package com.rng.security.jwt;

import com.rng.common.security.SecurityConstants;
import com.rng.common.security.TokenService;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Component
public class JwtTokenProvider implements TokenService {

    private final SecretKey key;
    private final Set<String> revokedJtis = ConcurrentHashMap.newKeySet();

    public JwtTokenProvider(@Value("${jwt.secret:rngSecretKeyForJwtSigningMustBeAtLeast32BytesLongForHmacSha256!}") String secret) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
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
    public boolean validateToken(String token) {
        try {
            Claims claims = getClaims(token);
            String jti = claims.getId();
            if (jti != null && revokedJtis.contains(jti)) {
                log.warn("JWT validation failed: jti {} is revoked", jti);
                return false;
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
            log.info("Revoked pre-2FA JWT jti: {}", jti);
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
    public String getJtiFromToken(String token) {
        Claims claims = getClaims(token);
        return claims.getId();
    }

    private Claims getClaims(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
