-- V2__seed_users.sql
-- Seed single High Command administrator into users table

INSERT INTO users (email, password, full_name, provider, role, discord_linked)
SELECT 'arzenic@rednecksgaming.com', '$2a$10$V3RU1vl7/BcWyY.bCyOBNOS32kuZDJpNwBPe2SQ10M8hPBMQJChyi', 'Arzenic', 'EMAIL', 'ROLE_HIGH_COMMAND', FALSE
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'arzenic@rednecksgaming.com');