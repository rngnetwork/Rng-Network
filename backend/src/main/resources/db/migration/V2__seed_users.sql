INSERT INTO users (email, password, full_name, provider, role, discord_linked)
SELECT 'testuser@rng.com', '$2a$10$8.UnVuG9HHgffUDAlk8qfOUVGkqRzgVymGe07Xd00DMxs.AQvq47a', 'Test User', 'EMAIL', 'ROLE_USER', FALSE
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'testuser@rng.com');

INSERT INTO users (email, password, full_name, provider, role, discord_linked)
SELECT 'rachitanand3.8.2011@gmail.com', NULL, 'RachitTheGoat', 'GOOGLE', 'ROLE_USER', FALSE
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'rachitanand3.8.2011@gmail.com');

INSERT INTO users (email, password, full_name, provider, role, discord_linked)
SELECT 'admin@rng.com', '$2a$10$8.UnVuG9HHgffUDAlk8qfOUVGkqRzgVymGe07Xd00DMxs.AQvq47a', 'Admin User', 'EMAIL', 'ROLE_ADMIN', FALSE
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@rng.com');


