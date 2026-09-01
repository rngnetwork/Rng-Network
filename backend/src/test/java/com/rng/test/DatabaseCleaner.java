package com.rng.test;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DatabaseCleaner {

    private static final String PRE_ENCODED_BCRYPT_ADMIN = "$2a$10$V3RU1vl7/BcWyY.bCyOBNOS32kuZDJpNwBPe2SQ10M8hPBMQJChyi";

    private final JdbcTemplate jdbcTemplate;

    public void cleanAndReseed() {
        jdbcTemplate.execute("TRUNCATE TABLE users, servers RESTART IDENTITY CASCADE");

        jdbcTemplate.update(
                "INSERT INTO users (email, full_name, provider, password, role, designations, roles, status, discord_linked, created_at, updated_at) " +
                        "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)",
                "arzenic@rednecksgaming.com",
                "Arzenic",
                "EMAIL",
                PRE_ENCODED_BCRYPT_ADMIN,
                "ROLE_HIGH_COMMAND",
                "Supreme",
                "Chief High Command, High Command",
                "ACTIVE",
                false
        );
    }
}
