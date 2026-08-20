-- V4__add_personnel_designations_and_roles.sql
-- Adds designations and roles support to users table for personnel whitelist system

ALTER TABLE users ADD COLUMN IF NOT EXISTS designations TEXT DEFAULT '';
ALTER TABLE users ADD COLUMN IF NOT EXISTS roles TEXT DEFAULT '';
ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE';
