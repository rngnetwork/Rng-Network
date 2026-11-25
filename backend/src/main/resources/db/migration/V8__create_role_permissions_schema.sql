-- V8__create_role_permissions_schema.sql
-- Establishes relational schema for granular Role Permissions (R9 - R0)

CREATE TABLE IF NOT EXISTS role_permissions (
    role_id VARCHAR(260) PRIMARY KEY,
    designation_id VARCHAR(100) NOT NULL,
    role_name VARCHAR(150) NOT NULL,
    rank_weight INT NOT NULL DEFAULT 0,
    permissions JSONB NOT NULL,
    version BIGINT NOT NULL DEFAULT 0,
    updated_by VARCHAR(100),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_role_permissions_des_role UNIQUE (designation_id, role_name)
);

CREATE INDEX IF NOT EXISTS idx_role_permissions_designation ON role_permissions (designation_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_updated_at ON role_permissions (updated_at DESC);
