package com.rng;

import com.rng.common.config.DotenvLoader;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@SpringBootApplication(scanBasePackages = "com.rng")
@EntityScan(basePackages = {"com.rng.identity.domain", "com.rng.server.domain"})
@EnableJpaRepositories(basePackages = {"com.rng.identity.repository", "com.rng.server.repository"})
public class RngApplication {

    public static void main(String[] args) {
        DotenvLoader.load();
        SpringApplication.run(RngApplication.class, args);
    }
}
