-- V5__add_chief_high_command_role.sql
-- Assigns Chief High Command and High Command roles to default administrator

UPDATE users 
SET designations = 'Supreme',
    roles = 'High Command, Chief High Command'
WHERE email = 'arzenic@rednecksgaming.com';
