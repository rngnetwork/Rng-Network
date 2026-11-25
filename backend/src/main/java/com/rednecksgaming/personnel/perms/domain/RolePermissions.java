// Written By: RachitSWE
// LICENSE: All rights reserved
// Year: 2026
package com.rednecksgaming.personnel.perms.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.Map;
import java.util.Objects;

@Entity
@Table(name = "role_permissions")
public class RolePermissions {

    @Id
    @Column(name = "role_id", length = 260, nullable = false)
    private String roleId;

    @Column(name = "designation_id", length = 100, nullable = false)
    private String designationId;

    @Column(name = "role_name", length = 150, nullable = false)
    private String roleName;

    @Column(name = "rank_weight", nullable = false)
    private Integer rankWeight;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "permissions", columnDefinition = "jsonb", nullable = false)
    private Map<String, Object> permissions;

    @Version
    @Column(name = "version", nullable = false)
    private Long version;

    @Column(name = "updated_by", length = 100)
    private String updatedBy;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    public RolePermissions() {
    }

    @PrePersist
    protected void onPrePersist() {
        if (this.updatedAt == null) {
            this.updatedAt = Instant.now();
        }
    }

    @PreUpdate
    protected void onPreUpdate() {
        this.updatedAt = Instant.now();
    }

    public RolePermissions(
            String roleId,
            String designationId,
            String roleName,
            Integer rankWeight,
            Map<String, Object> permissions,
            String updatedBy
    ) {
        this.roleId = roleId;
        this.designationId = designationId;
        this.roleName = roleName;
        this.rankWeight = rankWeight;
        this.permissions = permissions;
        this.updatedBy = updatedBy;
        this.updatedAt = Instant.now();
    }

    public String getRoleId() {
        return roleId;
    }

    public void setRoleId(String roleId) {
        this.roleId = roleId;
    }

    public String getDesignationId() {
        return designationId;
    }

    public void setDesignationId(String designationId) {
        this.designationId = designationId;
    }

    public String getRoleName() {
        return roleName;
    }

    public void setRoleName(String roleName) {
        this.roleName = roleName;
    }

    public Integer getRankWeight() {
        return rankWeight;
    }

    public void setRankWeight(Integer rankWeight) {
        this.rankWeight = rankWeight;
    }

    public Map<String, Object> getPermissions() {
        return permissions;
    }

    public void setPermissions(Map<String, Object> permissions) {
        this.permissions = permissions;
    }

    public Long getVersion() {
        return version;
    }

    public void setVersion(Long version) {
        this.version = version;
    }

    public String getUpdatedBy() {
        return updatedBy;
    }

    public void setUpdatedBy(String updatedBy) {
        this.updatedBy = updatedBy;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof RolePermissions that)) return false;
        return Objects.equals(roleId, that.roleId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(roleId);
    }
}
