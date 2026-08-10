package com.rng;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@SpringBootApplication(scanBasePackages = "com.rng")
@EntityScan(basePackages = "com.rng.identity.domain")
@EnableJpaRepositories(basePackages = "com.rng.identity.repository")
public class RngApplication {

    public static void main(String[] args) {
        SpringApplication.run(RngApplication.class, args);
    }
}
