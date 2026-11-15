// Written By: RachitSWE
// LICENSE: All rights reserved
// Year: 2026
package com.rednecksgaming.personnel.roles.domain;

import jakarta.persistence.*;

import java.time.Instant;

@Entity
@Table(name = "designation_roles")
public class DesignationRole {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "designation_id", nullable = false, length = 100)
    private String designationId;

    @Column(name = "designation_name", nullable = false, length = 150)
    private String designationName;

    @Column(name = "role_name", nullable = false, length = 150)
    private String roleName;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public DesignationRole() {}

    public DesignationRole(String designationId, String designationName, String roleName) {
        this.designationId = designationId;
        this.designationName = designationName;
        this.roleName = roleName;
    }

    public Long getId() {
        return id;
    }

    public String getDesignationId() {
        return designationId;
    }

    public void setDesignationId(String designationId) {
        this.designationId = designationId;
    }

    public String getDesignationName() {
        return designationName;
    }

    public void setDesignationName(String designationName) {
        this.designationName = designationName;
    }

    public String getRoleName() {
        return roleName;
    }

    public void setRoleName(String roleName) {
        this.roleName = roleName;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
