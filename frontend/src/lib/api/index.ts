export * from '../model';
export * from './core/types';
export * from './core/client';
export * from './auth/session';
export * from './auth/2fa';
export * from './auth/discord';
export * from './auth/reset-password';
export * from './dashboard';
export * from './dashboard/account';
export * from './dashboard/embeds';
export * from './dashboard/whitelist';
export * from './dashboard/servers';
export * from './dashboard/servers/[serverId]';
export * from './dashboard/servers/[serverId]/analytics';
export * from './dashboard/servers/[serverId]/botconfig';
export * from './dashboard/servers/[serverId]/embeds';
export * from './dashboard/servers/[serverId]/settings';
export * from './bot-module';

import {
  login,
  submitEmailLogin,
  redirectToGoogle,
  refreshToken,
  logout,
  fetchCurrentUser,
} from './auth/session';
import { verifyDiscord2FA, submitDiscord2Fa, get2FAStatus } from './auth/2fa';
import { getDiscordOAuthUrl, handleDiscordCallback } from './auth/discord';
import {
  requestPasswordReset,
  initiateForgotPassword,
  verifyForgotPasswordDiscord,
  confirmPasswordReset,
  resetPassword,
} from './auth/reset-password';
import { fetchDashboardOverviewStats } from './dashboard';
import {
  fetchUserProfile,
  updateAccountPreferences,
  fetchActiveSessions,
  revokeSession,
} from './dashboard/account';
import {
  fetchWhitelistedUsers,
  fetchWhitelistPersonnel,
  createWhitelistedUser,
  addWhitelistPersonnel,
  updateWhitelistedUser,
  updatePersonnelRank,
  deleteWhitelistedUser,
  revokePersonnel,
  fetchPersonnelHierarchy,
} from './dashboard/whitelist';
import {
  dispatchEmbedJson,
  dispatchEmbed,
  dispatchEmbedMultipart,
  scheduleEmbedDispatch,
  scheduleDispatch,
  cancelScheduledEmbedDispatch,
  cancelScheduledDispatch,
  testDryRun,
  validateDryRun,
  validatePreflight,
  fetchDispatchLogs,
  fetchDispatchChannels,
  fetchDispatchableChannels,
  fetchEmbedTemplates,
  fetchGlobalTemplates,
  fetchTemplates,
  fetchEmbedTemplateById,
  createEmbedTemplate,
  createTemplate,
  updateEmbedTemplate,
  updateTemplate,
  saveTemplate,
  deleteEmbedTemplate,
  deleteTemplate,
  exportEmbedTemplate,
  importEmbedTemplate,
  fetchBotEmojis,
  fetchActionTemplates,
  fetchActions,
  getActionTemplate,
  createActionTemplate,
  createAction,
  updateActionTemplate,
  updateAction,
  deleteActionTemplate,
  deleteAction,
  fetchGlobalInteractionLogs,
} from './dashboard/embeds';
import {
  fetchServers,
  fetchUserManagedServers,
  fetchRegisteredServers,
} from './dashboard/servers';
import { fetchServerDetails } from './dashboard/servers/[serverId]';
import {
  fetchInteractionLogs as fetchServerInteractionLogs,
  fetchServerAnalytics,
} from './dashboard/servers/[serverId]/analytics';
import {
  fetchBotConfig,
  updateBotPrefix,
  fetchGatewayHealth,
} from './dashboard/servers/[serverId]/botconfig';
import {
  fetchServerActions,
  createServerAction,
  updateServerAction,
  deleteServerAction,
  fetchServerEmojis,
  fetchServerGuildEmojis,
} from './dashboard/servers/[serverId]/embeds';
import {
  updateServerSettings,
  fetchServerChannels,
  fetchServerRoles,
} from './dashboard/servers/[serverId]/settings';

export const api = {
  login,
  submitEmailLogin,
  redirectToGoogle,
  verifyDiscord2FA,
  submitDiscord2Fa,
  get2FAStatus,
  getDiscordOAuthUrl,
  handleDiscordCallback,
  refreshToken,
  logout,
  fetchCurrentUser,
  fetchUserProfile,
  updateAccountPreferences,
  fetchActiveSessions,
  revokeSession,
  requestPasswordReset,
  initiateForgotPassword,
  verifyForgotPasswordDiscord,
  confirmPasswordReset,
  resetPassword,
  fetchDashboardOverviewStats,
  fetchWhitelistedUsers,
  fetchWhitelistPersonnel,
  createWhitelistedUser,
  addWhitelistPersonnel,
  updateWhitelistedUser,
  updatePersonnelRank,
  deleteWhitelistedUser,
  revokePersonnel,
  fetchPersonnelHierarchy,
  fetchServers,
  fetchUserManagedServers,
  fetchRegisteredServers,
  fetchServerDetails,
  fetchServerChannels,
  updateServerSettings,
  fetchServerRoles,
  fetchRoles: fetchServerRoles,
  fetchServerEmojis,
  fetchServerGuildEmojis,
  fetchBotEmojis,
  fetchBotConfig,
  updateBotPrefix,
  fetchGatewayHealth,
  fetchServerAnalytics,
  dispatchEmbedJson,
  dispatchEmbed,
  dispatchEmbedMultipart,
  scheduleEmbedDispatch,
  scheduleDispatch,
  cancelScheduledEmbedDispatch,
  cancelScheduledDispatch,
  testDryRun,
  validateDryRun,
  validatePreflight,
  fetchDispatchLogs,
  fetchDispatchChannels,
  fetchDispatchableChannels,
  fetchEmbedTemplates,
  fetchGlobalTemplates,
  fetchTemplates,
  fetchEmbedTemplateById,
  createEmbedTemplate,
  createTemplate,
  updateEmbedTemplate,
  updateTemplate,
  saveTemplate,
  deleteEmbedTemplate,
  deleteTemplate,
  exportEmbedTemplate,
  importEmbedTemplate,
  fetchActionTemplates,
  fetchActions,
  fetchServerActions,
  createServerAction,
  updateServerAction,
  deleteServerAction,
  getActionTemplate,
  createActionTemplate,
  createAction,
  updateActionTemplate,
  updateAction,
  deleteActionTemplate,
  deleteAction,
  fetchInteractionLogs: fetchGlobalInteractionLogs,
  fetchServerInteractionLogs,
  fetchLogs: fetchGlobalInteractionLogs,
};

export const apiClient = api;
