package com.rng;

import com.rng.test.DatabaseCleaner;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Testcontainers;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.MOCK)
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Testcontainers
public abstract class AbstractPostgresIntegrationTest {

    private static final PostgreSQLContainer<?> POSTGRES_CONTAINER;

    static {
        POSTGRES_CONTAINER = new PostgreSQLContainer<>("postgres:16-alpine")
                .withDatabaseName("rng_testdb")
                .withUsername("test_user")
                .withPassword("test_pass")
                .withReuse(true);
        POSTGRES_CONTAINER.start();
    }

    @DynamicPropertySource
    static void configureDynamicProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", POSTGRES_CONTAINER::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRES_CONTAINER::getUsername);
        registry.add("spring.datasource.password", POSTGRES_CONTAINER::getPassword);
        registry.add("spring.datasource.driver-class-name", () -> "org.postgresql.Driver");
        registry.add("spring.flyway.url", POSTGRES_CONTAINER::getJdbcUrl);
        registry.add("spring.flyway.user", POSTGRES_CONTAINER::getUsername);
        registry.add("spring.flyway.password", POSTGRES_CONTAINER::getPassword);
    }

    @Autowired
    protected MockMvc mockMvc;

    @Autowired
    protected DatabaseCleaner databaseCleaner;

    @BeforeEach
    void resetDatabaseState() {
        if (databaseCleaner != null) {
            databaseCleaner.cleanAndReseed();
        }
    }
}
