// Written By: RachitSWE
// LICENSE: All rights reserved
// Year: 2026
package com.rednecksgaming.personnel.roles.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;

@Entity
@Table(name = "matrix_ranks")
public class MatrixRank {

    @Id
    @Column(name = "weight")
    private Integer weight;

    @Column(name = "code", nullable = false, length = 20)
    private String code;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    public MatrixRank() {}

    public MatrixRank(Integer weight, String code) {
        this.weight = weight;
        this.code = code;
    }

    public Integer getWeight() {
        return weight;
    }

    public void setWeight(Integer weight) {
        this.weight = weight;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}
