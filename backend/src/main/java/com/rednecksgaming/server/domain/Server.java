// Written By: RachitSWE
// LICENSE: All rights reserved
// Year: 2026
package com.rednecksgaming.server.domain;

import com.rednecksgaming.common.domain.BaseJpaEntity;
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

@Entity
@Table(name = "servers", indexes = {
        @Index(name = "idx_servers_slug", columnList = "slug", unique = true)
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Server extends BaseJpaEntity {

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
}
