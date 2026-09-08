package com.rng.server.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

@Entity
@Table(name = "servers", indexes = {
        @Index(name = "idx_servers_slug", columnList = "slug", unique = true)
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Server {

    @Id
    @Column(length = 64, nullable = false)
    private String id;

    @Column(nullable = false, unique = true, length = 64)
    private String slug;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(name = "icon_hash", length = 128)
    private String iconHash;

    @Column(name = "banner_hash", length = 128)
    private String bannerHash;

    @Column(name = "premium_tier", nullable = false)
    @Builder.Default
    private Integer premiumTier = 0;

    @Column(name = "premium_subscription_count", nullable = false)
    @Builder.Default
    private Integer premiumSubscriptionCount = 0;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
