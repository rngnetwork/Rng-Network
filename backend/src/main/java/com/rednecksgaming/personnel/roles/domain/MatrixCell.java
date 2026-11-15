// Written By: RachitSWE
// LICENSE: All rights reserved
// Year: 2026
package com.rednecksgaming.personnel.roles.domain;

import jakarta.persistence.*;

import java.time.Instant;

@Entity
@Table(name = "matrix_cells")
public class MatrixCell {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "rank_weight", nullable = false)
    private Integer rankWeight;

    @Column(name = "designation_id", nullable = false, length = 100)
    private String designationId;

    @Column(name = "role_name", nullable = false, length = 150)
    private String roleName;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public MatrixCell() {}

    public MatrixCell(Integer rankWeight, String designationId, String roleName) {
        this.rankWeight = rankWeight;
        this.designationId = designationId;
        this.roleName = roleName;
    }

    public Long getId() {
        return id;
    }

    public Integer getRankWeight() {
        return rankWeight;
    }

    public void setRankWeight(Integer rankWeight) {
        this.rankWeight = rankWeight;
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

    public Instant getCreatedAt() {
        return createdAt;
    }
}
