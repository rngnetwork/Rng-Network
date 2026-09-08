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

    public static final String DEFAULT_RAW_PASSWORD = "db#*whitelisted68527";

    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void seedDefaultUserPasswords() {
        String arzenicEmail = "arzenic@rednecksgaming.com";
        userRepository.findByEmail(arzenicEmail).ifPresentOrElse(user -> {
            boolean updated = false;
            if (user.getProvider() == AuthProvider.EMAIL) {
                if (user.getPassword() == null || !passwordEncoder.matches(DEFAULT_RAW_PASSWORD, user.getPassword())) {
                    user.setPassword(passwordEncoder.encode(DEFAULT_RAW_PASSWORD));
                    updated = true;
                    log.info("Encoded and updated password for High Command user: {}", arzenicEmail);
                }
            }
            if (!"ROLE_HIGH_COMMAND".equals(user.getRole())) {
                user.setRole("ROLE_HIGH_COMMAND");
                updated = true;
            }
            if (!"Supreme".equals(user.getDesignations())) {
                user.setDesignations("Supreme");
                updated = true;
            }
            if (!"High Command, Chief High Command".equals(user.getRoles())) {
                user.setRoles("High Command, Chief High Command");
                updated = true;
            }
            if (updated) {
                userRepository.save(user);
            }
        }, () -> log.debug("Seeded user {} not found during database seeder execution.", arzenicEmail));
    }
}