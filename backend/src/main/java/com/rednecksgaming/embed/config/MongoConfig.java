package com.rednecksgaming.embed.config;

import org.springframework.beans.BeansException;
import org.springframework.beans.factory.config.BeanPostProcessor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.mongodb.config.EnableMongoAuditing;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.repository.config.EnableMongoRepositories;

/**
 * MongoDB repository and auditing configuration for the embed module.
 */
@Configuration
@EnableMongoRepositories(basePackages = "com.rednecksgaming.embed.repository")
@EnableMongoAuditing
public class MongoConfig {

    @Bean
    @ConditionalOnProperty(name = "spring.data.mongodb.auto-index-creation", havingValue = "true", matchIfMissing = true)
    public static BeanPostProcessor mongoTemplateIndexReconcilingPostProcessor() {
        return new BeanPostProcessor() {
            @Override
            public Object postProcessAfterInitialization(Object bean, String beanName) throws BeansException {
                if (bean instanceof MongoTemplate mongoTemplate) {
                    MongoIndexReconciliationConfig.reconcileAll(mongoTemplate);
                }
                return bean;
            }
        };
    }
}
