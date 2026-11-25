-- V9__seed_role_permissions.sql
-- Dynamically seeds role permissions from matrix_cells without hardcoded role names:
--   R9 & R8 (rank_weight >= 8): all JSONB permission flags initialized to true
--   R7 - R0 (rank_weight < 8):  all JSONB permission flags initialized to false

INSERT INTO role_permissions (role_id, designation_id, role_name, rank_weight, permissions, version, updated_by)
SELECT
    mc.designation_id || ':' || mc.role_name,
    mc.designation_id,
    mc.role_name,
    mc.rank_weight,
    CAST(
        CASE
            WHEN mc.rank_weight >= 8 THEN JSON_OBJECT(
                'dashboard' VALUE JSON_OBJECT('enabled' VALUE true),
                'dashboard.servers' VALUE JSON_OBJECT(
                    'enabled' VALUE true,
                    'dashboard.servers.[serverId]' VALUE JSON_OBJECT()
                ),
                'dashboard.embeds' VALUE JSON_OBJECT('enabled' VALUE true),
                'dashboard.botconfig' VALUE JSON_OBJECT('enabled' VALUE true),
                'dashboard.personnel' VALUE JSON_OBJECT(
                    'enabled' VALUE true,
                    'dashboard.personnel.roles' VALUE JSON_OBJECT('enabled' VALUE true),
                    'dashboard.personnel.perms' VALUE JSON_OBJECT('enabled' VALUE true)
                ),
                'dashboard.whitelist' VALUE JSON_OBJECT('enabled' VALUE true, 'fullAccess' VALUE true),
                'dashboard.account' VALUE JSON_OBJECT('enabled' VALUE true)
            )
            ELSE JSON_OBJECT(
                'dashboard' VALUE JSON_OBJECT('enabled' VALUE false),
                'dashboard.servers' VALUE JSON_OBJECT(
                    'enabled' VALUE false,
                    'dashboard.servers.[serverId]' VALUE JSON_OBJECT()
                ),
                'dashboard.embeds' VALUE JSON_OBJECT('enabled' VALUE false),
                'dashboard.botconfig' VALUE JSON_OBJECT('enabled' VALUE false),
                'dashboard.personnel' VALUE JSON_OBJECT(
                    'enabled' VALUE false,
                    'dashboard.personnel.roles' VALUE JSON_OBJECT('enabled' VALUE false),
                    'dashboard.personnel.perms' VALUE JSON_OBJECT('enabled' VALUE false)
                ),
                'dashboard.whitelist' VALUE JSON_OBJECT('enabled' VALUE false, 'fullAccess' VALUE false),
                'dashboard.account' VALUE JSON_OBJECT('enabled' VALUE false)
            )
        END
        AS JSONB
    ),
    0,
    'SYSTEM_SEED'
FROM matrix_cells mc
WHERE NOT EXISTS (
    SELECT 1 FROM role_permissions rp
    WHERE rp.role_id = mc.designation_id || ':' || mc.role_name
       OR (rp.designation_id = mc.designation_id AND rp.role_name = mc.role_name)
);
