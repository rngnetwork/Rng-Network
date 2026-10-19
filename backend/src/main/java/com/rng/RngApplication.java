package com.rng;

import com.rng.common.config.DotenvLoader;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.persistence.autoconfigure.EntityScan;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.scheduling.annotation.EnableScheduling;

@EnableCaching
@EnableScheduling
@EnableJpaAuditing
@SpringBootApplication(scanBasePackages = "com.rng")
@EntityScan(basePackages = {"com.rng.common.domain", "com.rng.identity.domain", "com.rng.server.domain"})
@EnableJpaRepositories(basePackages = {"com.rng.identity.repository", "com.rng.server.repository"})
public class RngApplication {

    public static void main(String[] args) {
        DotenvLoader.load();
        SpringApplication.run(RngApplication.class, args);
    }
}
