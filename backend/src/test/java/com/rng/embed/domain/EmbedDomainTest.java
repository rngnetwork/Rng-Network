package com.rng.embed.domain;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.lang.reflect.Field;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

class EmbedDomainTest {

    private Validator validator;

    @BeforeEach
    void setUp() {
        ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
        this.validator = factory.getValidator();
    }

    @Test
    @DisplayName("EmbedTemplate builder initializes defaults and validates properly")
    void embedTemplate_validDocument() {
        EmbedTemplate template = EmbedTemplate.builder()
                .templateId("tmpl_12345")
                .name("Welcome Announcement")
                .description("Standard welcoming message for new members")
                .authorId("usr_999")
                .authorName("Operator 1")
                .serverId("guild_123")
                .payload(Map.of("flags", 32768, "components", List.of()))
                .build();

        Set<ConstraintViolation<EmbedTemplate>> violations = validator.validate(template);
        assertThat(violations).isEmpty();
        assertThat(template.getCategory()).isEqualTo("GENERAL");
        assertThat(template.getTags()).isEmpty();
        assertThat(template.isPublic()).isFalse();
    }

    @Test
    @DisplayName("EmbedTemplate catches blank templateId, name, author, and null payload")
    void embedTemplate_validationViolations() {
        EmbedTemplate template = EmbedTemplate.builder()
                .templateId("")
                .name("")
                .authorId("")
                .authorName("")
                .payload(null)
                .build();

        Set<ConstraintViolation<EmbedTemplate>> violations = validator.validate(template);
        assertThat(violations).hasSize(5);
        assertThat(violations).extracting(ConstraintViolation::getPropertyPath)
                .map(Object::toString)
                .containsExactlyInAnyOrder("templateId", "name", "authorId", "authorName", "payload");
    }

    @Test
    @DisplayName("EmbedTemplate document metadata and compound indexes are configured")
    void embedTemplate_documentMetadata() {
        Document docAnnotation = EmbedTemplate.class.getAnnotation(Document.class);
        assertThat(docAnnotation).isNotNull();
        assertThat(docAnnotation.collection()).isEqualTo("embed_templates");

        CompoundIndexes compoundIndexes = EmbedTemplate.class.getAnnotation(CompoundIndexes.class);
        assertThat(compoundIndexes).isNotNull();
        assertThat(compoundIndexes.value()).hasSize(3);

        List<String> indexNames = List.of(
                compoundIndexes.value()[0].name(),
                compoundIndexes.value()[1].name(),
                compoundIndexes.value()[2].name()
        );
        assertThat(indexNames).containsExactlyInAnyOrder(
                "idx_server_public_category",
                "idx_author_updated",
                "idx_category_tags"
        );
    }

    @Test
    @DisplayName("DispatchLog builder initializes fields and passes validation")
    void dispatchLog_validDocument() {
        DispatchLog log = DispatchLog.builder()
                .dispatchId("dsp_555")
                .userId("usr_999")
                .serverId("guild_123")
                .channelId("chan_456")
                .dispatchType(DispatchType.IMMEDIATE)
                .status(DispatchStatus.SUCCESS)
                .payloadSnapshot(Map.of("flags", 32768))
                .timestamp(Instant.now())
                .latencyMs(142L)
                .build();

        Set<ConstraintViolation<DispatchLog>> violations = validator.validate(log);
        assertThat(violations).isEmpty();
        assertThat(log.getDispatchType()).isEqualTo(DispatchType.IMMEDIATE);
        assertThat(log.getStatus()).isEqualTo(DispatchStatus.SUCCESS);
    }

    @Test
    @DisplayName("DispatchLog catches missing mandatory fields")
    void dispatchLog_validationViolations() {
        DispatchLog log = DispatchLog.builder().build();

        Set<ConstraintViolation<DispatchLog>> violations = validator.validate(log);
        assertThat(violations).hasSize(7);
        assertThat(violations).extracting(ConstraintViolation::getPropertyPath)
                .map(Object::toString)
                .containsExactlyInAnyOrder("dispatchId", "userId", "serverId", "channelId", "dispatchType", "status", "payloadSnapshot");
    }

    @Test
    @DisplayName("DispatchLog document metadata, compound indexes, and 90-day TTL are configured")
    void dispatchLog_documentMetadataAndTTL() throws NoSuchFieldException {
        Document docAnnotation = DispatchLog.class.getAnnotation(Document.class);
        assertThat(docAnnotation).isNotNull();
        assertThat(docAnnotation.collection()).isEqualTo("dispatch_logs");

        CompoundIndexes compoundIndexes = DispatchLog.class.getAnnotation(CompoundIndexes.class);
        assertThat(compoundIndexes).isNotNull();
        assertThat(compoundIndexes.value()).hasSize(4);

        List<String> indexNames = List.of(
                compoundIndexes.value()[0].name(),
                compoundIndexes.value()[1].name(),
                compoundIndexes.value()[2].name(),
                compoundIndexes.value()[3].name()
        );
        assertThat(indexNames).containsExactlyInAnyOrder(
                "idx_server_timestamp",
                "idx_user_timestamp",
                "idx_channel_timestamp",
                "idx_status_type_timestamp"
        );

        Field timestampField = DispatchLog.class.getDeclaredField("timestamp");
        Indexed indexedAnnotation = timestampField.getAnnotation(Indexed.class);
        assertThat(indexedAnnotation).isNotNull();
        assertThat(indexedAnnotation.expireAfterSeconds()).isEqualTo(7776000); // 90 days TTL
    }

    @Test
    @DisplayName("DispatchType and DispatchStatus enum values adhere to specification")
    void enums_adhereToSpec() {
        assertThat(DispatchType.values()).containsExactly(
                DispatchType.IMMEDIATE,
                DispatchType.SCHEDULED,
                DispatchType.WEBHOOK
        );

        assertThat(DispatchStatus.values()).containsExactly(
                DispatchStatus.QUEUED,
                DispatchStatus.PROCESSING,
                DispatchStatus.RETRYING,
                DispatchStatus.SUCCESS,
                DispatchStatus.FAILED,
                DispatchStatus.CANCELLED
        );
    }
}
