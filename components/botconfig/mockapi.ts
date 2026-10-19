import { BotModule, DiscordChannelOption, DiscordRoleOption } from './types';

export const mockDiscordChannels: DiscordChannelOption[] = [
  { id: '1001', name: 'general', type: 0 },
  { id: '1002', name: 'announcements', type: 5 },
  { id: '1003', name: 'mod-logs', type: 0 },
  { id: '1004', name: 'bot-commands', type: 0 },
  { id: '1005', name: 'welcome', type: 0 },
  { id: '1006', name: 'ticket-transcripts', type: 0 },
  { id: '1007', name: 'giveaways', type: 0 },
  { id: '1008', name: 'economy-shop', type: 0 },
  { id: '2001', name: 'General Voice', type: 2 },
  { id: '2002', name: 'Gaming Lounge', type: 2 },
  { id: '2003', name: 'AFK Channel', type: 2 },
  { id: '2004', name: '➕ Create Voice', type: 2 },
];

export const mockDiscordRoles: DiscordRoleOption[] = [
  { id: '3001', name: 'Owner', color: '#E11D2E', position: 10 },
  { id: '3002', name: 'Administrator', color: '#F97316', position: 9 },
  { id: '3003', name: 'Senior Moderator', color: '#EF4444', position: 8 },
  { id: '3004', name: 'Moderator', color: '#3B82F6', position: 7 },
  { id: '3005', name: 'Support Team', color: '#10B981', position: 6 },
  { id: '3006', name: 'Verified Member', color: '#8B5CF6', position: 5 },
  { id: '3007', name: 'VIP', color: '#EC4899', position: 4 },
  { id: '3008', name: 'Muted', color: '#6B7280', position: 3 },
  { id: '3009', name: '@everyone', color: '#9CA3AF', position: 1 },
];

export const INITIAL_MOCK_MODULES: BotModule[] = [
  {
    id: 'antinuke',
    name: 'Anti-Nuke Protection',
    description: 'Guards your guild against malicious administrator rogue actions, mass bans, channel purges, and unvetted bot additions.',
    category: 'security',
    icon: 'ShieldAlert',
    enabled: true,
    submoduleCount: 4,
    tags: ['security', 'protection', 'admin', 'antinuke', 'defense'],
    badge: 'Core Defense',
    isPopular: true,
    submodules: [
      {
        id: 'an_channel_guard',
        title: 'Channel Destruction Protection',
        description: 'Intercepts unauthorized mass channel creation or deletion bursts.',
        icon: 'Hash',
        enabled: true,
        fields: [
          {
            id: 'an_channel_limit',
            label: 'Channel Deletion Threshold',
            description: 'Maximum channels an admin can delete within 10 seconds before being stripped of permissions.',
            type: 'number',
            value: 3,
            defaultValue: 3,
            validation: { min: 1, max: 20 },
            unit: 'channels',
          },
          {
            id: 'an_channel_action',
            label: 'Punishment Action',
            description: 'Action triggered when the threshold is breached.',
            type: 'select',
            value: 'ban',
            options: [
              { value: 'strip_roles', label: 'Strip All Administrative Roles' },
              { value: 'kick', label: 'Kick from Guild' },
              { value: 'ban', label: 'Ban Immediately & Quarantine' },
            ],
          },
          {
            id: 'an_channel_whitelist_roles',
            label: 'Exempt Whitelist Roles',
            description: 'Trusted roles allowed to exceed deletion limits without penalty.',
            type: 'role_select',
            multiSelect: true,
            value: ['3001'],
          },
        ],
      },
      {
        id: 'an_ban_guard',
        title: 'Mass Ban & Kick Shield',
        description: 'Stops rogue moderators or compromised accounts from mass banning or kicking members.',
        icon: 'UserX',
        enabled: true,
        fields: [
          {
            id: 'an_ban_limit',
            label: 'Max Bans per 10 Seconds',
            description: 'Threshold to trigger auto-quarantine.',
            type: 'number',
            value: 5,
            defaultValue: 5,
            validation: { min: 2, max: 50 },
            unit: 'bans',
          },
          {
            id: 'an_ban_action',
            label: 'Immediate Defense Action',
            type: 'select',
            value: 'ban',
            options: [
              { value: 'strip_roles', label: 'Strip Roles' },
              { value: 'ban', label: 'Ban Malicious Account' },
            ],
          },
        ],
      },
      {
        id: 'an_bot_guard',
        title: 'Unauthorized Bot Blocker',
        description: 'Instantly kicks any bot invited to the guild unless approved by the server owner.',
        icon: 'Bot',
        enabled: true,
        fields: [
          {
            id: 'an_bot_autokick',
            label: 'Auto-kick Unverified Bots',
            description: 'Immediately removes unauthorized bots upon join.',
            type: 'toggle',
            value: true,
          },
          {
            id: 'an_bot_punish_inviter',
            label: 'Punish Account Who Invited Bot',
            description: 'Strips administrative roles from whoever generated the OAuth invite.',
            type: 'toggle',
            value: true,
          },
        ],
      },
      {
        id: 'an_log_channel',
        title: 'Security Alert Dispatch',
        description: 'Dedicated high-priority security logging channel for real-time alerts.',
        icon: 'BellRing',
        enabled: true,
        fields: [
          {
            id: 'an_alert_channel_id',
            label: 'Security Alert Channel',
            description: 'Channel where critical threat detections and emergency alerts are sent.',
            type: 'channel_select',
            value: '1003',
          },
        ],
      },
    ],
  },
  {
    id: 'automod',
    name: 'Auto-Moderation',
    description: 'Autonomous filtering of spam, harmful discord invites, excessive mentions, and toxic content in real time.',
    category: 'security',
    icon: 'ShieldCheck',
    enabled: true,
    submoduleCount: 4,
    tags: ['automod', 'spam', 'links', 'invites', 'filters'],
    isPopular: true,
    submodules: [
      {
        id: 'am_anti_spam',
        title: 'Anti-Spam & Duplicate Message Filter',
        description: 'Detects and purges high-frequency chat flooding and copy-paste spam.',
        icon: 'MessageSquareX',
        enabled: true,
        fields: [
          {
            id: 'am_spam_rate_limit',
            label: 'Message Rate Threshold',
            description: 'Number of messages allowed within 5 seconds before mute.',
            type: 'number',
            value: 5,
            validation: { min: 2, max: 20 },
            unit: 'messages',
          },
          {
            id: 'am_spam_mute_duration',
            label: 'Auto-Timeout Duration',
            description: 'Length of timeout applied to offending users.',
            type: 'duration',
            value: '5m',
          },
          {
            id: 'am_spam_ignored_channels',
            label: 'Ignored Channels',
            description: 'Channels where spam filters are bypassed (e.g. bot commands).',
            type: 'channel_select',
            multiSelect: true,
            value: ['1004'],
          },
        ],
      },
      {
        id: 'am_anti_invite',
        title: 'Discord Invite Blocker',
        description: 'Blocks discord.gg and discord.com/invite links to prevent unauthorized advertising.',
        icon: 'Link',
        enabled: true,
        fields: [
          {
            id: 'am_delete_invite_message',
            label: 'Auto-Delete Invite Messages',
            type: 'toggle',
            value: true,
          },
          {
            id: 'am_invite_warning_dm',
            label: 'Send Warning DM to Offender',
            type: 'toggle',
            value: true,
          },
          {
            id: 'am_invite_allowed_roles',
            label: 'Roles Permitted to Post Invites',
            type: 'role_select',
            multiSelect: true,
            value: ['3001', '3002', '3004'],
          },
        ],
      },
      {
        id: 'am_mass_mentions',
        title: 'Mass Mention Shield',
        description: 'Stops malicious users from mass pinging members or roles in a single message.',
        icon: 'AtSign',
        enabled: true,
        fields: [
          {
            id: 'am_max_mentions',
            label: 'Max Mentions per Message',
            type: 'number',
            value: 4,
            validation: { min: 1, max: 25 },
            unit: 'mentions',
          },
          {
            id: 'am_block_everyone_ping',
            label: 'Block Unauthorized @everyone / @here',
            description: 'Deletes messages attempting to bypass ping restrictions.',
            type: 'toggle',
            value: true,
          },
        ],
      },
      {
        id: 'am_banned_words',
        title: 'Forbidden Words & RegEx Blacklist',
        description: 'Deletes messages containing banned terms, slurs, or custom regex patterns.',
        icon: 'FileWarning',
        enabled: false,
        fields: [
          {
            id: 'am_word_list',
            label: 'Blacklisted Keywords & Phrases',
            description: 'Add words or phrases that trigger immediate message deletion.',
            type: 'key_value_list',
            value: ['free nitro', 'steam gift card', 'airdrop claim'],
            placeholder: 'Add blacklisted keyword...',
          },
        ],
      },
    ],
  },
  {
    id: 'moderation',
    name: 'Moderation System',
    description: 'Comprehensive staff punishment controls, warning counters, strike progression, and moderation action logging.',
    category: 'moderation',
    icon: 'Gavel',
    enabled: false,
    submoduleCount: 3,
    tags: ['mod', 'moderation', 'punish', 'kick', 'ban', 'strike'],
    submodules: [
      {
        id: 'mod_strike_system',
        title: 'Warning & Strike Escalation',
        description: 'Automatically applies higher penalties as a user accumulates infraction strikes.',
        icon: 'Flame',
        enabled: true,
        fields: [
          {
            id: 'mod_max_strikes',
            label: 'Strikes Before Temporary Ban',
            type: 'number',
            value: 3,
            validation: { min: 1, max: 10 },
            unit: 'strikes',
          },
          {
            id: 'mod_strike_decay',
            label: 'Strike Expiration Window',
            description: 'Duration before unserved strikes automatically expire.',
            type: 'duration',
            value: '30d',
          },
        ],
      },
      {
        id: 'mod_roles_config',
        title: 'Mute & Staff Roles',
        description: 'Assign which roles control moderation actions and which role isolates muted members.',
        icon: 'Users',
        enabled: false,
        fields: [
          {
            id: 'mod_mute_role',
            label: 'Muted Member Role',
            description: 'Role applied when members are muted by bot command.',
            type: 'role_select',
            value: '3008',
          },
          {
            id: 'mod_staff_roles',
            label: 'Moderator Authorized Roles',
            description: 'Roles granted permission to issue warnings, kicks, and timeouts.',
            type: 'role_select',
            multiSelect: true,
            value: ['3002', '3003', '3004'],
          },
        ],
      },
      {
        id: 'mod_dm_notifications',
        title: 'Punishment DM Dispatch',
        description: 'Notify users via private DM whenever a strike, mute, or kick is enacted.',
        icon: 'Mail',
        enabled: false,
        fields: [
          {
            id: 'mod_send_dm_reason',
            label: 'Send DM with Punishment Reason',
            type: 'toggle',
            value: true,
          },
          {
            id: 'mod_appeal_link',
            label: 'Ban Appeal URL',
            description: 'Optional web URL embedded into ban notification DMs.',
            type: 'text',
            value: 'https://rng-network.gg/appeal',
            placeholder: 'https://...',
          },
        ],
      },
    ],
  },
  {
    id: 'j2c',
    name: 'Join to Create (J2C)',
    description: 'Dynamic voice channels that spawn automatically when members join a hub, then cleanly self-delete when empty.',
    category: 'utility',
    icon: 'Volume2',
    enabled: false,
    submoduleCount: 3,
    tags: ['voice', 'j2c', 'channels', 'audio', 'dynamic'],
    badge: 'Popular',
    isPopular: true,
    submodules: [
      {
        id: 'j2c_hub_setup',
        title: 'Voice Hub Master Channel',
        description: 'Select the trigger voice channel that members join to spawn their custom room.',
        icon: 'Headphones',
        enabled: false,
        fields: [
          {
            id: 'j2c_hub_channel',
            label: 'Master Hub Voice Channel',
            description: 'Members joining this channel will be moved into their private room.',
            type: 'channel_select',
            value: '2004',
          },
          {
            id: 'j2c_name_template',
            label: 'Default Channel Name Template',
            description: 'Available tokens: {user}, {count}, {game}',
            type: 'text',
            value: "{user}'s Lounge",
            placeholder: "{user}'s Room",
          },
        ],
      },
      {
        id: 'j2c_room_defaults',
        title: 'Room Limits & Audio Quality',
        description: 'Default constraints applied to newly created voice rooms.',
        icon: 'Sliders',
        enabled: true,
        fields: [
          {
            id: 'j2c_user_limit',
            label: 'Default User Limit',
            description: '0 = Unlimited members.',
            type: 'number',
            value: 0,
            validation: { min: 0, max: 99 },
            unit: 'users',
          },
          {
            id: 'j2c_bitrate',
            label: 'Voice Bitrate',
            type: 'select',
            value: 64,
            options: [
              { value: 64, label: '64 kbps (Standard)' },
              { value: 96, label: '96 kbps (High Quality)' },
              { value: 128, label: '128 kbps (Nitro Boosted)' },
            ],
          },
        ],
      },
      {
        id: 'j2c_permissions',
        title: 'Channel Owner Privileges',
        description: 'Permissions granted to the room creator over their dynamic voice channel.',
        icon: 'Key',
        enabled: true,
        fields: [
          {
            id: 'j2c_allow_lock',
            label: 'Allow Room Locking',
            description: 'Owners can lock their channel via button or command.',
            type: 'toggle',
            value: true,
          },
          {
            id: 'j2c_allow_kick',
            label: 'Allow Room Kicking',
            description: 'Owners can disconnect unwanted users from their voice channel.',
            type: 'toggle',
            value: true,
          },
        ],
      },
    ],
  },
  {
    id: 'welcome',
    name: 'Welcome & Onboarding',
    description: 'Greet new members with automated welcome cards, send direct messages, and assign initial starter roles.',
    category: 'engagement',
    icon: 'UserPlus',
    enabled: true,
    submoduleCount: 3,
    tags: ['welcome', 'greetings', 'autorole', 'join', 'embed'],
    isPopular: true,
    submodules: [
      {
        id: 'wc_channel_message',
        title: 'Channel Welcome Announcement',
        description: 'Post custom messages or rich cards in a designated public channel.',
        icon: 'Sparkles',
        enabled: true,
        fields: [
          {
            id: 'wc_channel_id',
            label: 'Welcome Channel',
            type: 'channel_select',
            value: '1005',
          },
          {
            id: 'wc_message_content',
            label: 'Welcome Message Template',
            description: 'Variables: {user}, {server}, {memberCount}',
            type: 'textarea',
            value: 'Welcome to **{server}**, {user}! You are member #{memberCount}. Make sure to check out the rules!',
            placeholder: 'Type welcome message...',
          },
          {
            id: 'wc_embed_toggle',
            label: 'Send as Rich Styled Embed',
            type: 'toggle',
            value: true,
          },
        ],
      },
      {
        id: 'wc_autorole',
        title: 'Auto-Role on Join',
        description: 'Automatically grant roles to newly joined accounts.',
        icon: 'Shield',
        enabled: true,
        fields: [
          {
            id: 'wc_default_roles',
            label: 'Roles to Assign Immediately',
            type: 'role_select',
            multiSelect: true,
            value: ['3006'],
          },
          {
            id: 'wc_bot_autorole',
            label: 'Separate Role for Bots',
            description: 'Automatically applied only to joining bot accounts.',
            type: 'role_select',
            value: '',
          },
        ],
      },
      {
        id: 'wc_dm_greeting',
        title: 'Private Direct Message Greeting',
        description: 'Deliver an onboarding guide or verification instructions directly to member DMs.',
        icon: 'Send',
        enabled: false,
        fields: [
          {
            id: 'wc_dm_text',
            label: 'DM Content',
            type: 'textarea',
            value: 'Hey {user}, welcome to {server}! Glad to have you here.',
          },
        ],
      },
    ],
  },
  {
    id: 'tickets',
    name: 'Support Tickets',
    description: 'Multi-category private support ticket panels with button openers, staff claiming, and transcript archiving.',
    category: 'utility',
    icon: 'Ticket',
    enabled: true,
    submoduleCount: 3,
    tags: ['tickets', 'support', 'help', 'transcripts', 'staff'],
    isPopular: true,
    submodules: [
      {
        id: 'tk_general_settings',
        title: 'Ticket Core System',
        description: 'Configure ticket naming rules, maximum active tickets, and transcript logs.',
        icon: 'FolderOpen',
        enabled: true,
        fields: [
          {
            id: 'tk_support_roles',
            label: 'Support Handler Roles',
            description: 'Roles notified when a new ticket is opened.',
            type: 'role_select',
            multiSelect: true,
            value: ['3002', '3005'],
          },
          {
            id: 'tk_transcript_channel',
            label: 'Transcript Archive Channel',
            description: 'Channel where HTML or text chat logs are saved upon ticket closure.',
            type: 'channel_select',
            value: '1006',
          },
          {
            id: 'tk_max_per_user',
            label: 'Max Concurrent Tickets per Member',
            type: 'number',
            value: 2,
            validation: { min: 1, max: 5 },
            unit: 'tickets',
          },
        ],
      },
      {
        id: 'tk_auto_close',
        title: 'Inactivity Auto-Closure',
        description: 'Closes stale tickets automatically when the user stops responding.',
        icon: 'Clock',
        enabled: true,
        fields: [
          {
            id: 'tk_inactive_timeout',
            label: 'Inactivity Close Window',
            type: 'duration',
            value: '24h',
          },
          {
            id: 'tk_send_warning_before_close',
            label: 'Send Warning Ping 2 Hours Before Close',
            type: 'toggle',
            value: true,
          },
        ],
      },
      {
        id: 'tk_feedback',
        title: 'Post-Ticket Satisfaction Rating',
        description: 'Prompt users for a 1-5 star feedback rating after their support request is resolved.',
        icon: 'Star',
        enabled: false,
        fields: [
          {
            id: 'tk_enable_rating',
            label: 'Enable Rating Prompt',
            type: 'toggle',
            value: false,
          },
        ],
      },
    ],
  },
  {
    id: 'triggers',
    name: 'Custom Triggers & Commands',
    description: 'Build custom text triggers, automated keywords, keyword regex matchers, and slash shortcuts.',
    category: 'engagement',
    icon: 'Zap',
    enabled: false,
    submoduleCount: 2,
    tags: ['commands', 'triggers', 'custom', 'autoresponder', 'keywords'],
    submodules: [
      {
        id: 'tr_keyword_triggers',
        title: 'Keyword Auto-Responses',
        description: 'Whenever a message includes specific keywords, the bot responds automatically.',
        icon: 'MessageCircle',
        enabled: false,
        fields: [
          {
            id: 'tr_case_sensitive',
            label: 'Case Sensitive Matching',
            type: 'toggle',
            value: false,
          },
          {
            id: 'tr_cooldown',
            label: 'Response Cooldown',
            description: 'Prevents response spamming for identical triggers.',
            type: 'duration',
            value: '10s',
          },
        ],
      },
      {
        id: 'tr_prefix_settings',
        title: 'Legacy Message Prefix',
        description: 'Custom character prefix for text commands.',
        icon: 'Terminal',
        enabled: true,
        fields: [
          {
            id: 'tr_bot_prefix',
            label: 'Server Bot Prefix',
            type: 'text',
            value: '!',
            placeholder: '!',
            validation: { max: 5 },
          },
        ],
      },
    ],
  },
  {
    id: 'economy',
    name: 'Economy & Finance',
    description: 'Complete server currency system with daily payouts, gambling mini-games, server shop, and bank vaults.',
    category: 'economy',
    icon: 'Coins',
    enabled: false,
    submoduleCount: 3,
    tags: ['economy', 'currency', 'shop', 'coins', 'rewards', 'finance'],
    submodules: [
      {
        id: 'ec_currency_config',
        title: 'Currency Branding',
        description: 'Set your server unique currency name and symbol.',
        icon: 'CircleDollarSign',
        enabled: false,
        fields: [
          {
            id: 'ec_coin_name',
            label: 'Currency Name',
            type: 'text',
            value: 'RNG Credits',
            placeholder: 'Credits, Gems, Gold...',
          },
          {
            id: 'ec_coin_symbol',
            label: 'Currency Symbol / Emoji',
            type: 'text',
            value: '🪙',
            placeholder: '$',
          },
          {
            id: 'ec_starting_balance',
            label: 'New Member Starting Balance',
            type: 'number',
            value: 250,
            unit: 'credits',
          },
        ],
      },
      {
        id: 'ec_daily_rewards',
        title: 'Daily & Hourly Streaks',
        description: 'Reward active members with bonus balance for logging in.',
        icon: 'Gift',
        enabled: true,
        fields: [
          {
            id: 'ec_daily_amount',
            label: 'Daily Reward Amount',
            type: 'number',
            value: 500,
            unit: 'credits',
          },
          {
            id: 'ec_streak_bonus',
            label: 'Consecutive Day Bonus Multiplier',
            type: 'number',
            value: 10,
            unit: '% per day',
          },
        ],
      },
      {
        id: 'ec_shop_settings',
        title: 'Server Role Shop',
        description: 'Allow members to buy exclusive vanity roles using their earned currency.',
        icon: 'ShoppingBag',
        enabled: true,
        fields: [
          {
            id: 'ec_shop_channel',
            label: 'Dedicated Shop Channel',
            type: 'channel_select',
            value: '1008',
          },
        ],
      },
    ],
  },
  {
    id: 'logging',
    name: 'Audit & Event Logging',
    description: 'Track deleted messages, channel modifications, role permission updates, and voice transitions.',
    category: 'moderation',
    icon: 'FileText',
    enabled: true,
    submoduleCount: 3,
    tags: ['logging', 'audit', 'logs', 'tracker', 'history'],
    submodules: [
      {
        id: 'lg_message_events',
        title: 'Message Log Stream',
        description: 'Logs message edits, message purges, and deleted attachments.',
        icon: 'FileEdit',
        enabled: true,
        fields: [
          {
            id: 'lg_msg_channel',
            label: 'Message Log Channel',
            type: 'channel_select',
            value: '1003',
          },
          {
            id: 'lg_track_edits',
            label: 'Log Message Edits (Before & After)',
            type: 'toggle',
            value: true,
          },
          {
            id: 'lg_track_deletions',
            label: 'Log Message Deletions',
            type: 'toggle',
            value: true,
          },
        ],
      },
      {
        id: 'lg_member_events',
        title: 'Member Activity Logs',
        description: 'Tracks role assignments, avatar changes, and nickname updates.',
        icon: 'UserCheck',
        enabled: true,
        fields: [
          {
            id: 'lg_member_channel',
            label: 'Member Activity Channel',
            type: 'channel_select',
            value: '1003',
          },
        ],
      },
      {
        id: 'lg_voice_events',
        title: 'Voice State Transitions',
        description: 'Records when users connect, mute, deafen, or switch voice rooms.',
        icon: 'Mic',
        enabled: false,
        fields: [
          {
            id: 'lg_voice_channel',
            label: 'Voice Logs Channel',
            type: 'channel_select',
            value: '1003',
          },
        ],
      },
    ],
  },
  {
    id: 'verification',
    name: 'Member Verification Gate',
    description: 'Require new accounts to pass a verification gate before seeing channels, filtering out raids and raid bots.',
    category: 'security',
    icon: 'BadgeCheck',
    enabled: false,
    submoduleCount: 2,
    tags: ['verification', 'gate', 'captcha', 'security', 'onboarding'],
    submodules: [
      {
        id: 'vf_mode_config',
        title: 'Gate Verification Method',
        description: 'Select how users complete authentication.',
        icon: 'Lock',
        enabled: false,
        fields: [
          {
            id: 'vf_type',
            label: 'Verification Mode',
            type: 'select',
            value: 'button',
            options: [
              { value: 'button', label: 'Single Click Button Verification' },
              { value: 'captcha', label: 'Visual Image CAPTCHA' },
              { value: 'web', label: 'OAuth Web Portal Verification' },
            ],
          },
          {
            id: 'vf_verified_role',
            label: 'Role Granted Upon Success',
            type: 'role_select',
            value: '3006',
          },
        ],
      },
      {
        id: 'vf_timeout_config',
        title: 'Unverified Account Cleanup',
        description: 'Kick members who fail to verify within a specified timeframe.',
        icon: 'UserMinus',
        enabled: false,
        fields: [
          {
            id: 'vf_kick_unverified',
            label: 'Auto-kick Unverified Users',
            type: 'toggle',
            value: false,
          },
          {
            id: 'vf_kick_duration',
            label: 'Verification Timeout',
            type: 'duration',
            value: '1h',
          },
        ],
      },
    ],
  },
  {
    id: 'giveaways',
    name: 'Giveaway Manager',
    description: 'Host automated giveaways with emoji reactions, role requirements, server booster multipliers, and winner redraws.',
    category: 'engagement',
    icon: 'Gift',
    enabled: false,
    submoduleCount: 2,
    tags: ['giveaways', 'events', 'prizes', 'drops', 'contests'],
    submodules: [
      {
        id: 'gw_general',
        title: 'Giveaway Core Settings',
        description: 'Default announcement channels and manager permissions.',
        icon: 'Award',
        enabled: false,
        fields: [
          {
            id: 'gw_channel',
            label: 'Default Giveaway Channel',
            type: 'channel_select',
            value: '1007',
          },
          {
            id: 'gw_manager_roles',
            label: 'Giveaway Manager Roles',
            description: 'Can create and reroll giveaways without administrator permissions.',
            type: 'role_select',
            multiSelect: true,
            value: ['3002', '3004'],
          },
        ],
      },
      {
        id: 'gw_multipliers',
        title: 'Booster & VIP Multipliers',
        description: 'Give extra entry tickets to active supporters and donors.',
        icon: 'TrendingUp',
        enabled: true,
        fields: [
          {
            id: 'gw_booster_multiplier',
            label: 'Server Booster Extra Entries',
            type: 'number',
            value: 2,
            unit: 'x entries',
          },
        ],
      },
    ],
  },
  {
    id: 'staff',
    name: 'Staff Management',
    description: 'Monitor moderator shift clocks, activity metrics, case resolutions, and staff team presence.',
    category: 'utility',
    icon: 'Briefcase',
    enabled: true,
    submoduleCount: 2,
    tags: ['staff', 'management', 'shifts', 'roster', 'activity'],
    submodules: [
      {
        id: 'st_activity_tracking',
        title: 'Moderator Activity Tracker',
        description: 'Monitors staff commands, message counts, and actions per week.',
        icon: 'Activity',
        enabled: true,
        fields: [
          {
            id: 'st_min_weekly_actions',
            label: 'Minimum Weekly Staff Actions',
            type: 'number',
            value: 25,
            unit: 'actions',
          },
          {
            id: 'st_staff_roles',
            label: 'Staff Tracked Roles',
            type: 'role_select',
            multiSelect: true,
            value: ['3003', '3004'],
          },
        ],
      },
      {
        id: 'st_shift_logging',
        title: 'Staff On-Duty Shift Logs',
        description: 'Log when staff clock in or clock out of active duty.',
        icon: 'ClipboardList',
        enabled: false,
        fields: [
          {
            id: 'st_shift_channel',
            label: 'Duty Log Channel',
            type: 'channel_select',
            value: '1003',
          },
        ],
      },
    ],
  },
];

// In-memory cache for simulating persistence during the frontend session
let modulesCache: Record<string, BotModule[]> = {};

export async function fetchBotModules(serverId: string): Promise<BotModule[]> {
  await new Promise((resolve) => setTimeout(resolve, 250));
  if (!modulesCache[serverId]) {
    modulesCache[serverId] = JSON.parse(JSON.stringify(INITIAL_MOCK_MODULES));
  }
  return JSON.parse(JSON.stringify(modulesCache[serverId]));
}

export async function fetchBotModuleById(serverId: string, moduleId: string): Promise<BotModule | null> {
  const modules = await fetchBotModules(serverId);
  const found = modules.find((m) => m.id === moduleId);
  return found ? JSON.parse(JSON.stringify(found)) : null;
}

export async function updateBotModule(
  serverId: string,
  moduleId: string,
  payload: Partial<BotModule>
): Promise<{ success: boolean; data: BotModule }> {
  await new Promise((resolve) => setTimeout(resolve, 350));
  if (!modulesCache[serverId]) {
    modulesCache[serverId] = JSON.parse(JSON.stringify(INITIAL_MOCK_MODULES));
  }
  const index = modulesCache[serverId].findIndex((m) => m.id === moduleId);
  if (index === -1) {
    throw new Error(`Module ${moduleId} not found`);
  }
  const updated: BotModule = {
    ...modulesCache[serverId][index],
    ...payload,
  };
  modulesCache[serverId][index] = updated;
  return { success: true, data: JSON.parse(JSON.stringify(updated)) };
}

export async function toggleBotModule(
  serverId: string,
  moduleId: string,
  enabled: boolean
): Promise<{ success: boolean; enabled: boolean }> {
  await new Promise((resolve) => setTimeout(resolve, 200));
  if (!modulesCache[serverId]) {
    modulesCache[serverId] = JSON.parse(JSON.stringify(INITIAL_MOCK_MODULES));
  }
  const mod = modulesCache[serverId].find((m) => m.id === moduleId);
  if (mod) {
    mod.enabled = enabled;
  }
  return { success: true, enabled };
}

export async function fetchDiscordChannels(_serverId: string): Promise<DiscordChannelOption[]> {
  await new Promise((resolve) => setTimeout(resolve, 150));
  return mockDiscordChannels;
}

export async function fetchDiscordRoles(_serverId: string): Promise<DiscordRoleOption[]> {
  await new Promise((resolve) => setTimeout(resolve, 150));
  return mockDiscordRoles;
}
