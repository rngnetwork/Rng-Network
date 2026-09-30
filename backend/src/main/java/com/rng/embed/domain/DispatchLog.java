package com.rng.embed.domain;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import java.time.Instant;
import java.util.Map;

/**
 * MongoDB Document representing chronological dispatch telemetry and audit logs.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "dispatch_logs")
@CompoundIndexes({
    @CompoundIndex(name = "idx_server_timestamp", def = "{'serverId': 1, 'timestamp': -1}"),
    @CompoundIndex(name = "idx_user_timestamp", def = "{'userId': 1, 'timestamp': -1}"),
    @CompoundIndex(name = "idx_channel_timestamp", def = "{'channelId': 1, 'timestamp': -1}"),
    @CompoundIndex(name = "idx_status_type_timestamp", def = "{'status': 1, 'dispatchType': 1, 'timestamp': -1}")
})
public class DispatchLog {

    @Id
    private String id;

    @Indexed(unique = true)
    @NotBlank(message = "dispatchId is required")
    private String dispatchId;

    @NotBlank(message = "userId is required")
    @Indexed
    private String userId;

    private String userEmail;

    @NotBlank(message = "serverId is required")
    @Indexed
    private String serverId;

    private String serverName;

    @NotBlank(message = "channelId is required")
    @Indexed
    private String channelId;

    private String channelName;

    @NotNull(message = "dispatchType is required")
    @Indexed
    private DispatchType dispatchType;

    @NotNull(message = "status is required")
    @Indexed
    private DispatchStatus status;

    @Indexed(sparse = true)
    private String discordMessageId;

    private String errorMessage;

    private Long latencyMs;

    @NotNull(message = "payloadSnapshot cannot be null")
    @Field("payloadSnapshot")
    private Map<String, Object> payloadSnapshot;

    private Instant scheduledFor;

    @CreatedDate
    @Indexed(expireAfterSeconds = 7776000) // 90-day automatic data retention TTL
    private Instant timestamp;
}
