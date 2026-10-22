package com.rednecksgaming.embed.domain;

import com.rednecksgaming.embed.dto.ActionExecutionResult;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.data.annotation.Version;
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
        assertThat(template.getCategory()).isEqualTo("general");
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
        assertThat(compoundIndexes.value()).hasSize(4);

        List<String> indexNames = List.of(
                compoundIndexes.value()[0].name(),
                compoundIndexes.value()[1].name(),
                compoundIndexes.value()[2].name(),
                compoundIndexes.value()[3].name()
        );
        assertThat(indexNames).containsExactlyInAnyOrder(
                "idx_server_public_category",
                "idx_server_ids_public",
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
    @DisplayName("DispatchLog document metadata, compound indexes, and 30-day TTL are configured")
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
        assertThat(indexedAnnotation.expireAfter()).isEqualTo("30d"); // 30 days TTL
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

    @Test
    @DisplayName("EmbedAction builder validates properly and asserts collection metadata")
    void embedAction_validationAndMetadata() throws NoSuchFieldException {
        EmbedAction action = EmbedAction.builder()
                .actionId("rng_act_7b9e10a45d628f2c")
                .name("VIP Role Assignment")
                .actionType(ActionType.ROLE)
                .roleSubtype(RoleSubtype.TOGGLE)
                .roleId("104899988877766655")
                .serverId("guild_123")
                .isGlobal(false)
                .build();

        Set<ConstraintViolation<EmbedAction>> violations = validator.validate(action);
        assertThat(violations).isEmpty();
        assertThat(action.isEphemeral()).isTrue();
        assertThat(action.isRequiredUser()).isFalse();
        assertThat(action.isRequiredRole()).isFalse();

        Document docAnnotation = EmbedAction.class.getAnnotation(Document.class);
        assertThat(docAnnotation).isNotNull();
        assertThat(docAnnotation.collection()).isEqualTo("embed_actions");

        Field actionIdField = EmbedAction.class.getDeclaredField("actionId");
        Indexed indexedAnnotation = actionIdField.getAnnotation(Indexed.class);
        assertThat(indexedAnnotation).isNotNull();
        assertThat(indexedAnnotation.unique()).isTrue();
    }

    @Test
    @DisplayName("InteractionLog document asserts collection and 30-day TTL index")
    void interactionLog_ttlAndMetadata() throws NoSuchFieldException {
        InteractionLog log = InteractionLog.builder()
                .actionId("rng_act_7b9e10a45d628f2c")
                .actionType(ActionType.ROLE)
                .guildId("guild_123")
                .channelId("channel_456")
                .messageId("msg_789")
                .userId("user_111")
                .username("johndoe")
                .status("SUCCESS")
                .details("Assigned VIP role")
                .createdAt(Instant.now())
                .build();

        Set<ConstraintViolation<InteractionLog>> violations = validator.validate(log);
        assertThat(violations).isEmpty();

        Document docAnnotation = InteractionLog.class.getAnnotation(Document.class);
        assertThat(docAnnotation).isNotNull();
        assertThat(docAnnotation.collection()).isEqualTo("interaction_logs");

        Field createdAtField = InteractionLog.class.getDeclaredField("createdAt");
        Indexed indexedAnnotation = createdAtField.getAnnotation(Indexed.class);
        assertThat(indexedAnnotation).isNotNull();
        assertThat(indexedAnnotation.expireAfter()).isEqualTo("30d"); // 30 days TTL
    }

    @Test
    @DisplayName("ActionType and RoleSubtype enum values adhere to specification")
    void actionEnums_adhereToSpec() {
        assertThat(ActionType.values()).containsExactly(
                ActionType.ROLE,
                ActionType.REPLY,
                ActionType.TICKET,
                ActionType.DM
        );

        assertThat(RoleSubtype.values()).containsExactly(
                RoleSubtype.ADD,
                RoleSubtype.REMOVE,
                RoleSubtype.TOGGLE
        );
    }

    @Test
    @DisplayName("Should verify EmbedAction domain model extensions, optimistic locking and compound operations")
    void should_support_response_template_and_server_ids_and_version() throws NoSuchFieldException {
        EmbedAction action = EmbedAction.builder()
                .actionId("rng_act_1234567812345678")
                .name("Test Pipeline")
                .actionType(ActionType.ROLE)
                .roleSubtype(RoleSubtype.ADD)
                .isGlobal(false)
                .serverIds(List.of("guild-123"))
                .responseType(ResponseType.PUBLIC_EMBED)
                .responseEmbedTemplateId("tpl-999")
                .compoundOperations(List.of(
                        CompoundOperation.builder()
                                .operationType(CompoundOperation.OperationType.CREATE_TICKET)
                                .channelPrefix("ticket-")
                                .membersToAdd(List.of("CALLER", "TARGET_USER"))
                                .build()
                ))
                .version(1L)
                .build();

        assertThat(action.getServerIds()).contains("guild-123");
        assertThat(action.getResponseType()).isEqualTo(ResponseType.PUBLIC_EMBED);
        assertThat(action.getVersion()).isEqualTo(1L);
        assertThat(action.getCompoundOperations()).hasSize(1);

        Field versionField = EmbedAction.class.getDeclaredField("version");
        assertThat(versionField.getAnnotation(Version.class)).isNotNull();
    }

    @Test
    @DisplayName("Should build ActionExecutionResult DTO with proper states")
    void should_build_action_execution_result() {
        ActionExecutionResult result = ActionExecutionResult.builder()
                .success(true)
                .ticketId("a7f3c1")
                .channelId("chan-100")
                .isTerminal(false)
                .newGeneratedMessageId("msg-200")
                .build();

        assertThat(result.isSuccess()).isTrue();
        assertThat(result.getTicketId()).isEqualTo("a7f3c1");
        assertThat(result.isTerminal()).isFalse();
        assertThat(result.getNewGeneratedMessageId()).isEqualTo("msg-200");
    }

    @Test
    @DisplayName("ResponseType enum values adhere to Action-Templates-V2 specification")
    void responseType_adhereToSpec() {
        assertThat(ResponseType.values()).containsExactly(
                ResponseType.EPHEMERAL_TEXT,
                ResponseType.PUBLIC_TEXT,
                ResponseType.EPHEMERAL_EMBED,
                ResponseType.PUBLIC_EMBED,
                ResponseType.DM_EMBED
        );
    }
}
