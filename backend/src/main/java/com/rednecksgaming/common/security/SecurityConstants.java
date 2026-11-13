// Written By: RachitSWE
// LICENSE: All rights reserved
// Year: 2026
package com.rednecksgaming.common.security;

public final class SecurityConstants {

    private SecurityConstants() {
    }

    public static final String SCOPE_PRE_2FA = "SCOPE_PRE_2FA";
    public static final String SCOPE_FULLY_AUTHENTICATED = "SCOPE_FULLY_AUTHENTICATED";
    public static final String SCOPE_RESET_REQUEST = "SCOPE_RESET_REQUEST";
    public static final String SCOPE_RESET_PASSWORD = "SCOPE_RESET_PASSWORD";

    public static final String TOKEN_TYPE_HEADER = "Bearer ";
    public static final String AUTHORIZATION_HEADER = "Authorization";
    public static final String REFRESH_TOKEN_COOKIE_NAME = "rng_refresh_token";

    public static final long ACCESS_TOKEN_EXPIRATION_MS = 15 * 60 * 1000L; // 15 Minutes
    public static final long PRE_2FA_TOKEN_EXPIRATION_MS = 5 * 60 * 1000L; // 5 Minutes
    public static final long REFRESH_TOKEN_EXPIRATION_MS = 7 * 24 * 60 * 60 * 1000L; // 7 Days
    public static final long RESET_REQUEST_TOKEN_EXPIRATION_MS = 5 * 60 * 1000L; // 5 Minutes
    public static final long RESET_PASSWORD_TOKEN_EXPIRATION_MS = 10 * 60 * 1000L; // 10 Minutes
}
