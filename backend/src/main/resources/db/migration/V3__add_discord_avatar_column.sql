-- V3__add_discord_avatar_column.sql
-- Adds discord_avatar column to users table for storing Discord CDN avatar hashes

ALTER TABLE users ADD COLUMN IF NOT EXISTS discord_avatar VARCHAR(255);
