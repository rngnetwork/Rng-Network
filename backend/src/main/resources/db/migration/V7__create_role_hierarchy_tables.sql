-- V7__create_role_hierarchy_tables.sql
-- Establishes authoritative PostgreSQL persistence for Role Hierarchy Matrix and Designation Roles

-- 1. Table 1A: Matrix Ranks (Weight Tiers R0 - R9)
CREATE TABLE IF NOT EXISTS matrix_ranks (
    weight INT PRIMARY KEY,
    code VARCHAR(20) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. Table 1B: Matrix Designations (Columns)
CREATE TABLE IF NOT EXISTS matrix_designations (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    position INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_matrix_designations_position ON matrix_designations(position ASC);

-- 3. Table 1C: Matrix Cells (Role mappings at specific rank_weight x designation_id)
CREATE TABLE IF NOT EXISTS matrix_cells (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    rank_weight INT NOT NULL REFERENCES matrix_ranks(weight) ON DELETE CASCADE,
    designation_id VARCHAR(100) NOT NULL REFERENCES matrix_designations(id) ON DELETE CASCADE,
    role_name VARCHAR(150) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_matrix_cells_coord_role UNIQUE (rank_weight, designation_id, role_name)
);

CREATE INDEX IF NOT EXISTS idx_matrix_cells_coord ON matrix_cells(rank_weight, designation_id);
CREATE INDEX IF NOT EXISTS idx_matrix_cells_role ON matrix_cells(role_name);

-- 4. Table 2: Normalized Designation-to-Roles (Decoupled from rank weights, for Whitelist & RBAC)
CREATE TABLE IF NOT EXISTS designation_roles (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    designation_id VARCHAR(100) NOT NULL,
    designation_name VARCHAR(150) NOT NULL,
    role_name VARCHAR(150) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_designation_roles_pair UNIQUE (designation_id, role_name)
);

CREATE INDEX IF NOT EXISTS idx_designation_roles_des_id_role ON designation_roles(designation_id, role_name ASC);
CREATE INDEX IF NOT EXISTS idx_designation_roles_role_name ON designation_roles(role_name);

-- 5. Canonical Seed Data: Ranks R9 to R0
INSERT INTO matrix_ranks (weight, code) VALUES
    (9, 'R9'), (8, 'R8'), (7, 'R7'), (6, 'R6'), (5, 'R5'),
    (4, 'R4'), (3, 'R3'), (2, 'R2'), (1, 'R1'), (0, 'R0');

-- 6. Canonical Seed Data: Designations (Matching existing RNG ministries verbatim)
INSERT INTO matrix_designations (id, name, position) VALUES
    ('des_supreme', 'Supreme', 1),
    ('des_chancellory', 'Chancellory', 2),
    ('des_growth_gfx', 'Ministry of Growth, GFX and External Relations', 3),
    ('des_personell', 'Ministry of Personell', 4),
    ('des_tech', 'Ministry of Tech', 5),
    ('des_finances', 'Ministry of Finances', 6),
    ('des_culture', 'Ministry of Culture', 7),
    ('des_external', 'Ministry of External affairs', 8);

-- 7. Canonical Seed Data: Matrix Cells
INSERT INTO matrix_cells (rank_weight, designation_id, role_name) VALUES
    (9, 'des_supreme', 'Chief High Command'),
    (8, 'des_supreme', 'High Command'),
    (5, 'des_chancellory', 'Chancellor of Roughnuts'),
    (5, 'des_chancellory', 'Chancellor of Rednecks Gaming'),
    (5, 'des_chancellory', 'Chancellor of Rivals'),
    (5, 'des_growth_gfx', 'Minister'),
    (4, 'des_growth_gfx', 'Secretary'),
    (3, 'des_growth_gfx', 'Senior Agent'),
    (2, 'des_growth_gfx', 'Agent'),
    (5, 'des_personell', 'Minister'),
    (4, 'des_personell', 'Secretary'),
    (3, 'des_personell', 'Magister Officiorum'),
    (2, 'des_personell', 'Tribunus'),
    (1, 'des_personell', 'Legatus'),
    (5, 'des_tech', 'Minister'),
    (4, 'des_tech', 'Secretary'),
    (3, 'des_tech', 'Tech Specialist'),
    (2, 'des_tech', 'Senior Dev'),
    (1, 'des_tech', 'Junior Dev'),
    (5, 'des_finances', 'Minister'),
    (4, 'des_finances', 'Secretary'),
    (3, 'des_finances', 'Digital assets officer'),
    (2, 'des_finances', 'Regional treasurer'),
    (1, 'des_finances', 'PayPal treasurer'),
    (5, 'des_culture', 'Minister'),
    (4, 'des_culture', 'Secretary'),
    (5, 'des_external', 'Minister'),
    (4, 'des_external', 'Secretary');

-- 8. Canonical Seed Data: Table 2 (designation_roles)
INSERT INTO designation_roles (designation_id, designation_name, role_name) VALUES
    ('des_supreme', 'Supreme', 'Chief High Command'),
    ('des_supreme', 'Supreme', 'High Command'),
    ('des_chancellory', 'Chancellory', 'Chancellor of Roughnuts'),
    ('des_chancellory', 'Chancellory', 'Chancellor of Rednecks Gaming'),
    ('des_chancellory', 'Chancellory', 'Chancellor of Rivals'),
    ('des_growth_gfx', 'Ministry of Growth, GFX and External Relations', 'Minister'),
    ('des_growth_gfx', 'Ministry of Growth, GFX and External Relations', 'Secretary'),
    ('des_growth_gfx', 'Ministry of Growth, GFX and External Relations', 'Senior Agent'),
    ('des_growth_gfx', 'Ministry of Growth, GFX and External Relations', 'Agent'),
    ('des_personell', 'Ministry of Personell', 'Minister'),
    ('des_personell', 'Ministry of Personell', 'Secretary'),
    ('des_personell', 'Ministry of Personell', 'Magister Officiorum'),
    ('des_personell', 'Ministry of Personell', 'Tribunus'),
    ('des_personell', 'Ministry of Personell', 'Legatus'),
    ('des_tech', 'Ministry of Tech', 'Minister'),
    ('des_tech', 'Ministry of Tech', 'Secretary'),
    ('des_tech', 'Ministry of Tech', 'Tech Specialist'),
    ('des_tech', 'Ministry of Tech', 'Senior Dev'),
    ('des_tech', 'Ministry of Tech', 'Junior Dev'),
    ('des_finances', 'Ministry of Finances', 'Minister'),
    ('des_finances', 'Ministry of Finances', 'Secretary'),
    ('des_finances', 'Ministry of Finances', 'Digital assets officer'),
    ('des_finances', 'Ministry of Finances', 'Regional treasurer'),
    ('des_finances', 'Ministry of Finances', 'PayPal treasurer'),
    ('des_culture', 'Ministry of Culture', 'Minister'),
    ('des_culture', 'Ministry of Culture', 'Secretary'),
    ('des_external', 'Ministry of External affairs', 'Minister'),
    ('des_external', 'Ministry of External affairs', 'Secretary');
