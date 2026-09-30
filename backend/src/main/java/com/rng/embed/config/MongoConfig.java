package com.rng.embed.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.mongodb.config.EnableMongoAuditing;
import org.springframework.data.mongodb.repository.config.EnableMongoRepositories;

/**
 * MongoDB repository and auditing configuration for the embed module.
 */
@Configuration
@EnableMongoRepositories(basePackages = "com.rng.embed.repository")
@EnableMongoAuditing
public class MongoConfig {
}
