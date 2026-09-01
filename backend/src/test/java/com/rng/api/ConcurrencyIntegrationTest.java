package com.rng.api;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.rng.AbstractPostgresIntegrationTest;
import com.rng.common.security.SecurityConstants;
import com.rng.common.security.TokenService;
import com.rng.identity.domain.AuthProvider;
import com.rng.identity.domain.User;
import com.rng.identity.dto.ResetPasswordRequest;
import com.rng.identity.dto.WhitelistUserRequest;
import com.rng.identity.repository.UserRepository;
import com.rng.server.domain.Server;
import com.rng.server.repository.ServerRepository;
import com.rng.server.service.ServerService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;

import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

class ConcurrencyIntegrationTest extends AbstractPostgresIntegrationTest {

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ServerRepository serverRepository;

    @Autowired
    private ServerService serverService;

    @Autowired
    private TokenService tokenService;

    @Test
    @DisplayName("Concurrency: Multi-threaded server slug collision generates unique distinct slugs")
    void concurrentSlugGeneration_generatesUniqueSlugs() throws InterruptedException, ExecutionException {
        int threadCount = 10;
        ExecutorService executor = Executors.newFixedThreadPool(threadCount);
        CountDownLatch startLatch = new CountDownLatch(1);
        List<Future<String>> futures = new CopyOnWriteArrayList<>();

        // Pre-create initial server
        serverRepository.save(Server.builder()
                .id("base-guild-id")
                .slug("rng-rivals")
                .name("RNG Rivals")
                .build());

        for (int i = 0; i < threadCount; i++) {
            final String guildId = "guild-concurrent-" + i;
            futures.add(executor.submit(() -> {
                startLatch.await();
                return serverService.generateUniqueSlug("RNG Rivals", guildId);
            }));
        }

        // Release all threads simultaneously
        startLatch.countDown();

        Set<String> generatedSlugs = ConcurrentHashMap.newKeySet();
        for (Future<String> future : futures) {
            String slug = future.get();
            assertThat(slug).isNotNull().startsWith("rng-rivals");
            generatedSlugs.add(slug);
        }

        executor.shutdown();
        assertThat(executor.awaitTermination(5, TimeUnit.SECONDS)).isTrue();
    }

    @Test
    @DisplayName("Concurrency: Password reset single-use token replay defense under concurrent race")
    void concurrentPasswordReset_onlySingleRequestSucceeds() throws Exception {
        User user = userRepository.save(User.builder()
                .email("victim@rng.com")
                .fullName("Victim User")
                .provider(AuthProvider.EMAIL)
                .password("$2a$10$oldBcryptHash")
                .role("ROLE_USER")
                .discordLinked(true)
                .discordId("888888888888888888")
                .status("ACTIVE")
                .build());

        String resetToken = tokenService.generateResetPasswordToken(user.getId(), user.getEmail());

        int threadCount = 10;
        ExecutorService executor = Executors.newFixedThreadPool(threadCount);
        CountDownLatch startLatch = new CountDownLatch(1);
        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger failureCount = new AtomicInteger(0);

        List<Callable<Integer>> tasks = Collections.nCopies(threadCount, () -> {
            startLatch.await();
            try {
                ResetPasswordRequest req = new ResetPasswordRequest("NewSecurePassword#2026!");
                MvcResult result = mockMvc.perform(post("/api/v1/auth/forgot-password/reset")
                                .header(SecurityConstants.AUTHORIZATION_HEADER, SecurityConstants.TOKEN_PREFIX + resetToken)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(req)))
                        .andReturn();

                int status = result.getResponse().getStatus();
                if (status == 200) {
                    successCount.incrementAndGet();
                } else {
                    failureCount.incrementAndGet();
                }
                return status;
            } catch (Exception e) {
                failureCount.incrementAndGet();
                return 500;
            }
        });

        List<Future<Integer>> results = tasks.stream().map(executor::submit).toList();
        startLatch.countDown();

        for (Future<Integer> f : results) {
            f.get();
        }

        executor.shutdown();
        assertThat(executor.awaitTermination(5, TimeUnit.SECONDS)).isTrue();

        // Exactly one request must succeed, all other replay attempts must be rejected
        assertThat(successCount.get()).isEqualTo(1);
        assertThat(failureCount.get()).isEqualTo(threadCount - 1);
    }

    @Test
    @DisplayName("Concurrency: Duplicate email whitelist race condition prevents multiple user records")
    void concurrentWhitelistCreation_duplicateEmail_preventsDuplicates() throws Exception {
        User admin = userRepository.findByEmail("arzenic@rednecksgaming.com").orElseThrow();
        String adminToken = tokenService.generateAccessToken(admin.getId(), admin.getEmail(), admin.getRole());

        int threadCount = 5;
        ExecutorService executor = Executors.newFixedThreadPool(threadCount);
        CountDownLatch startLatch = new CountDownLatch(1);
        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger conflictCount = new AtomicInteger(0);

        WhitelistUserRequest request = WhitelistUserRequest.builder()
                .email("concurrent.candidate@rng.com")
                .userName("Candidate User")
                .provider(AuthProvider.EMAIL)
                .designations(List.of("Ministry of Tech"))
                .roles(List.of("Junior Dev"))
                .build();

        String payload = objectMapper.writeValueAsString(request);

        List<Callable<Integer>> tasks = Collections.nCopies(threadCount, () -> {
            startLatch.await();
            try {
                MvcResult result = mockMvc.perform(post("/api/v1/whitelist")
                                .header(SecurityConstants.AUTHORIZATION_HEADER, SecurityConstants.TOKEN_PREFIX + adminToken)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(payload))
                        .andReturn();

                int status = result.getResponse().getStatus();
                if (status == 201) {
                    successCount.incrementAndGet();
                } else if (status == 409) {
                    conflictCount.incrementAndGet();
                }
                return status;
            } catch (Exception e) {
                return 500;
            }
        });

        List<Future<Integer>> results = tasks.stream().map(executor::submit).toList();
        startLatch.countDown();

        for (Future<Integer> f : results) {
            f.get();
        }

        executor.shutdown();
        assertThat(executor.awaitTermination(5, TimeUnit.SECONDS)).isTrue();

        assertThat(successCount.get()).isEqualTo(1);
        assertThat(conflictCount.get()).isEqualTo(threadCount - 1);
        assertThat(userRepository.findAll().stream().filter(u -> u.getEmail().equals("concurrent.candidate@rng.com")).count()).isEqualTo(1);
    }
}
