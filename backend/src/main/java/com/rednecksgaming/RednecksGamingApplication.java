package com.rednecksgaming;

import com.rednecksgaming.common.config.DotenvLoader;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.data.redis.RedisRepositoriesAutoConfiguration;
import org.springframework.boot.persistence.autoconfigure.EntityScan;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.scheduling.annotation.EnableScheduling;

@EnableCaching
@EnableScheduling
@EnableJpaAuditing
@SpringBootApplication(
        scanBasePackages = "com.rednecksgaming",
        exclude = {RedisRepositoriesAutoConfiguration.class}
)
@EntityScan(basePackages = {"com.rednecksgaming.common.domain", "com.rednecksgaming.identity.domain", "com.rednecksgaming.server.domain"})
@EnableJpaRepositories(basePackages = {"com.rednecksgaming.identity.repository", "com.rednecksgaming.server.repository"})
public class RednecksGamingApplication {

    public static void main(String[] args) {
        DotenvLoader.load();
        SpringApplication.run(RednecksGamingApplication.class, args);
    }
}
