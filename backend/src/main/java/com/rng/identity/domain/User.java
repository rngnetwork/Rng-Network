package com.rng.identity.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

@Entity
@Table(name = "users", indexes = {
        @Index(name = "idx_users_email", columnList = "email", unique = true),
        @Index(name = "idx_users_discord_id", columnList = "discord_id")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 150)
    private String email;

    @Column(length = 255)
    private String password;

    @Column(name = "full_name", length = 100)
    private String fullName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private AuthProvider provider;

    @Column(name = "google_id", length = 100)
    private String googleId;

    @Column(name = "discord_id", length = 100)
    private String discordId;

    @Column(name = "discord_username", length = 100)
    private String discordUsername;

    @Column(name = "discord_avatar", length = 255)
    private String discordAvatar;

    @Column(name = "discord_linked", nullable = false)
    @Builder.Default
    private boolean discordLinked = false;

    @Column(nullable = false, length = 50)
    @Builder.Default
    private String role = "ROLE_USER";

    @Column(columnDefinition = "TEXT")
    private String designations;

    @Column(columnDefinition = "TEXT")
    private String roles;

    @Column(nullable = false, length = 30)
    @Builder.Default
    private String status = "ACTIVE";

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public java.util.List<String> getDesignationList() {
        if (designations == null || designations.isBlank()) return java.util.List.of();
        return java.util.Arrays.stream(designations.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toList();
    }

    public java.util.List<String> getRoleList() {
        if (roles == null || roles.isBlank()) return java.util.List.of();
        return java.util.Arrays.stream(roles.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toList();
    }

    public boolean isActive() {
        return "ACTIVE".equalsIgnoreCase(this.status);
    }
}
