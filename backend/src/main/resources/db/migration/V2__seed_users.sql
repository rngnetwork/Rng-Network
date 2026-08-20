-- V2__seed_users.sql
-- Seed single High Command administrator into users table

INSERT INTO users (email, password, full_name, provider, role, discord_linked)
SELECT 'arzenic@rednecksgaming.com', '$2a$10$8.UnVuG9HHgffUDAlk8qfOUVGkqRzgVymGe07Xd00DMxs.AQvq47a', 'Arzenic', 'EMAIL', 'ROLE_HIGH_COMMAND', FALSE
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'arzenic@rednecksgaming.com');