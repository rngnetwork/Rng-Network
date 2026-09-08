package com.rng.identity.config;

import com.rng.identity.domain.AuthProvider;
import com.rng.identity.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Startup seeder component that ensures seeded users always have valid BCrypt passwords
 * encoded programmatically using the active PasswordEncoder bean upon application readiness.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DatabaseSeeder {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public static final String DEFAULT_RAW_PASSWORD = "password123";

    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void seedDefaultUserPasswords() {
        List<String> defaultEmails = List.of("testuser@rng.com", "test@rng.com", "admin@rng.com", "arzenic@rednecksgaming.com");

        for (String email : defaultEmails) {
            userRepository.findByEmail(email).ifPresentOrElse(user -> {
                if (user.getProvider() == AuthProvider.EMAIL) {
                    if (user.getPassword() == null || !passwordEncoder.matches(DEFAULT_RAW_PASSWORD, user.getPassword())) {
                        user.setPassword(passwordEncoder.encode(DEFAULT_RAW_PASSWORD));
                        userRepository.save(user);
                        log.info("Encoded and updated password for seeded user: {}", email);
                    } else {
                        log.debug("Seeded user {} already has a valid encoded password.", email);
                    }
                }
            }, () -> log.debug("Seeded user {} not found during database seeder execution.", email));
        }
    }
}