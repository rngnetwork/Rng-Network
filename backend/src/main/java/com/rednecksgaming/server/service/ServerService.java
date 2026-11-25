// Written By: RachitSWE
// LICENSE: All rights reserved
// Year: 2026
package com.rednecksgaming.server.service;

import com.rednecksgaming.common.exception.ResourceNotFoundException;
import com.rednecksgaming.identity.domain.User;
import com.rednecksgaming.identity.repository.UserRepository;
import com.rednecksgaming.personnel.perms.dto.EffectivePermissionsDto;
import com.rednecksgaming.personnel.perms.service.GranularPermissionEvaluator;
import com.rednecksgaming.server.client.DiscordServerClient;
import com.rednecksgaming.server.domain.Server;
import com.rednecksgaming.server.dto.ChannelDto;
import com.rednecksgaming.server.dto.ServerDetailDto;
import com.rednecksgaming.server.dto.ServerDto;
import com.rednecksgaming.server.dto.UpdateServerSettingsRequest;
import com.rednecksgaming.server.dto.discord.DiscordChannelDto;
import com.rednecksgaming.server.dto.discord.DiscordGuildDetailDto;
import com.rednecksgaming.server.dto.discord.DiscordGuildDto;
import com.rednecksgaming.server.dto.discord.DiscordGuildPatchRequest;
import com.rednecksgaming.server.dto.DiscordEmojiDto;
import com.rednecksgaming.server.dto.discord.DiscordEmojiResponseDto;
import com.rednecksgaming.server.mapper.DiscordServerMapper;
import com.rednecksgaming.server.repository.ServerRepository;
import com.rednecksgaming.server.dto.ServerRoleDto;
import lombok.extern.slf4j.Slf4j;
import net.dv8tion.jda.api.JDA;
import net.dv8tion.jda.api.OnlineStatus;
import net.dv8tion.jda.api.entities.Guild;
import net.dv8tion.jda.api.entities.Member;
import net.dv8tion.jda.api.entities.Role;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Service
public class ServerService {

    private final ServerRepository serverRepository;
    private final DiscordServerClient discordClient;
    private final UserRepository userRepository;
    private final Optional<JDA> jda;
    private final DiscordServerMapper discordServerMapper;
    private final GranularPermissionEvaluator granularPermissionEvaluator;

    @Autowired
    public ServerService(
            ServerRepository serverRepository,
            DiscordServerClient discordClient,
            UserRepository userRepository,
            @Autowired(required = false) JDA jda,
            DiscordServerMapper discordServerMapper,
            @Autowired(required = false) GranularPermissionEvaluator granularPermissionEvaluator
    ) {
        this.serverRepository = serverRepository;
        this.discordClient = discordClient;
        this.userRepository = userRepository;
        this.jda = Optional.ofNullable(jda);
        this.discordServerMapper = discordServerMapper != null ? discordServerMapper : new DiscordServerMapper();
        this.granularPermissionEvaluator = granularPermissionEvaluator;
    }

    public ServerService(
            ServerRepository serverRepository,
            DiscordServerClient discordClient,
            UserRepository userRepository,
            JDA jda,
            DiscordServerMapper discordServerMapper
    ) {
        this(serverRepository, discordClient, userRepository, jda, discordServerMapper, null);
    }

    public ServerService(
            ServerRepository serverRepository,
            DiscordServerClient discordClient,
            UserRepository userRepository,
            JDA jda
    ) {
        this(serverRepository, discordClient, userRepository, jda, new DiscordServerMapper(), null);
    }

    public List<ServerDto> filterVisibleServers(List<ServerDto> servers, EffectivePermissionsDto effective) {
        if (servers == null || effective == null || granularPermissionEvaluator == null) {
            return servers;
        }
        return granularPermissionEvaluator.filterVisibleServers(effective, servers);
    }

    @Cacheable(value = "guilds:summary", key = "'all'")
    @Transactional
    public List<ServerDto> getAllServers() {
        // Priority 1: Outbound REST Client (with accurate approximatePresenceCount & approximateMemberCount, cached in Redis for 60s)
        List<DiscordGuildDto> guilds = null;
        try {
            guilds = discordClient.getBotGuilds();
        } catch (Exception e) {
            log.warn("Discord REST API unavailable for getAllServers ({}), falling back to JDA Gateway cache", e.getMessage());
        }

        if (guilds != null && !guilds.isEmpty()) {
            return syncAndMapRestGuilds(guilds);
        }

        // Priority 2: Fast read from JDA Gateway Cache (when REST is rate-limited / offline)
        if (jda.isPresent() && jda.get().getStatus() == JDA.Status.CONNECTED) {
            List<Guild> jdaGuilds = jda.get().getGuilds();
            if (!jdaGuilds.isEmpty()) {
                log.debug("Serving {} servers from JDA Gateway in-memory cache", jdaGuilds.size());
                return syncAndMapJdaGuilds(jdaGuilds);
            }
        }

        // Priority 3: Database records
        return serverRepository.findAll().stream()
                .map(this::mapEntityToDto)
                .toList();
    }

    private List<ServerDto> syncAndMapRestGuilds(List<DiscordGuildDto> guilds) {
        List<ServerDto> result = new ArrayList<>();
        for (DiscordGuildDto guild : guilds) {
            Server server = serverRepository.findById(guild.getId())
                    .orElseGet(() -> {
                        String slug = generateUniqueSlug(guild.getName(), guild.getId());
                        Server newServer = Server.builder()
                                .id(guild.getId())
                                .slug(slug)
                                .name(guild.getName())
                                .iconHash(guild.getIcon())
                                .bannerHash(guild.getBanner())
                                .premiumTier(0)
                                .premiumSubscriptionCount(0)
                                .build();
                        return serverRepository.save(newServer);
                    });

            if (!server.getName().equals(guild.getName())
                    || (guild.getIcon() != null && !guild.getIcon().equals(server.getIconHash()))
                    || (guild.getBanner() != null && !guild.getBanner().equals(server.getBannerHash()))) {
                server.setName(guild.getName());
                server.setIconHash(guild.getIcon());
                server.setBannerHash(guild.getBanner());
                serverRepository.save(server);
            }

            int boostLevel = server.getPremiumTier();
            int boostCount = server.getPremiumSubscriptionCount();
            String iconUrl = discordServerMapper.formatDiscordIconUrl(server.getId(), server.getIconHash());
            String bannerUrl = discordServerMapper.formatDiscordBannerUrl(server.getId(), server.getBannerHash());
            String serverName = server.getName();

            if (jda.isPresent() && jda.get().getStatus() == JDA.Status.CONNECTED) {
                Guild jdaGuild = jda.get().getGuildById(guild.getId());
                if (jdaGuild != null) {
                    boostLevel = jdaGuild.getBoostTier().getKey();
                    boostCount = jdaGuild.getBoostCount();
                    if (jdaGuild.getIconUrl() != null) {
                        iconUrl = jdaGuild.getIconUrl();
                    }
                    if (jdaGuild.getBannerUrl() != null) {
                        bannerUrl = jdaGuild.getBannerUrl();
                    }
                    serverName = jdaGuild.getName();
                }
            }

            result.add(discordServerMapper.toServerDto(
                    server,
                    serverName,
                    iconUrl,
                    bannerUrl,
                    guild.getApproximatePresenceCount() != null ? guild.getApproximatePresenceCount() : 0,
                    guild.getApproximateMemberCount() != null ? guild.getApproximateMemberCount() : 0,
                    boostLevel,
                    boostCount
            ));
        }
        return result;
    }

    @Cacheable(value = "guild:details", key = "#idOrSlug")
    @Transactional(readOnly = true)
    public ServerDetailDto getServerDetails(String idOrSlug) {
        Server server = serverRepository.findByIdOrSlug(idOrSlug)
                .orElseThrow(() -> new ResourceNotFoundException("Server not found: " + idOrSlug));

        // Priority 1: Discord REST Client with ?with_counts=true (cached in Redis for 30s)
        try {
            DiscordGuildDetailDto details = discordClient.getGuildDetails(server.getId());
            if (details != null) {
                return mapRestDetailDto(server, details);
            }
        } catch (Exception e) {
            log.warn("Discord REST API unavailable for getServerDetails {}: {}, falling back to JDA Gateway", server.getId(), e.getMessage());
        }

        // Priority 2: Fallback to JDA in-memory guild details
        if (jda.isPresent() && jda.get().getStatus() == JDA.Status.CONNECTED) {
            Guild jdaGuild = jda.get().getGuildById(server.getId());
            if (jdaGuild != null) {
                return mapJdaGuildToDetailDto(server, jdaGuild);
            }
        }

        throw new ResourceNotFoundException("Discord guild details unavailable for " + server.getId());
    }

    private ServerDetailDto mapRestDetailDto(Server server, DiscordGuildDetailDto details) {
        int flags = details.getSystemChannelFlags() != null ? details.getSystemChannelFlags() : 0;
        boolean sendWelcome = (flags & (1 << 0)) == 0;
        boolean boostMessage = (flags & (1 << 1)) == 0;
        boolean setupTips = (flags & (1 << 2)) == 0;
        boolean stickerPrompt = (flags & (1 << 3)) == 0;

        int onlineCount = 0;
        int totalCount = 0;
        if (details.getApproximatePresenceCount() != null && details.getApproximateMemberCount() != null) {
            onlineCount = details.getApproximatePresenceCount();
            totalCount = details.getApproximateMemberCount();
        } else {
            try {
                List<DiscordGuildDto> guilds = discordClient.getBotGuilds();
                for (DiscordGuildDto g : guilds) {
                    if (g.getId().equals(server.getId())) {
                        onlineCount = g.getApproximatePresenceCount() != null ? g.getApproximatePresenceCount() : 0;
                        totalCount = g.getApproximateMemberCount() != null ? g.getApproximateMemberCount() : 0;
                        break;
                    }
                }
            } catch (Exception e) {
                log.warn("Could not fetch presence counts for server {}: {}", server.getId(), e.getMessage());
            }
        }

        int boostLevel = details.getPremiumTier() != null ? details.getPremiumTier() : 0;
        int boostCount = details.getPremiumSubscriptionCount() != null ? details.getPremiumSubscriptionCount() : 0;
        if (jda.isPresent() && jda.get().getStatus() == JDA.Status.CONNECTED) {
            Guild jdaGuild = jda.get().getGuildById(server.getId());
            if (jdaGuild != null) {
                boostLevel = jdaGuild.getBoostTier().getKey();
                boostCount = jdaGuild.getBoostCount();
            }
        }

        return discordServerMapper.toServerDetailDto(
                server,
                details,
                onlineCount,
                totalCount,
                boostLevel,
                boostCount,
                sendWelcome,
                stickerPrompt,
                boostMessage,
                setupTips
        );
    }

    @Cacheable(value = "guild:channels", key = "#idOrSlug")
    @Transactional(readOnly = true)
    public List<ChannelDto> getServerChannels(String idOrSlug) {
        Server server = serverRepository.findByIdOrSlug(idOrSlug)
                .orElseThrow(() -> new ResourceNotFoundException("Server not found: " + idOrSlug));

        // Priority 1: Fetch live directly from Discord REST API v10
        if (discordClient != null) {
            try {
                List<DiscordChannelDto> channels = discordClient.getGuildChannels(server.getId());
                if (channels != null && !channels.isEmpty()) {
                    List<ChannelDto> dtos = channels.stream()
                            .map(discordServerMapper::toChannelDto)
                            .toList();
                    return sortChannelsHierarchically(dtos);
                }
            } catch (Exception e) {
                log.warn("Discord REST client channel retrieval failed for {}: {}", server.getId(), e.getMessage());
            }
        }

        // Priority 2: Fallback to JDA Gateway in-memory cache
        if (jda.isPresent() && jda.get().getStatus() == JDA.Status.CONNECTED) {
            Guild jdaGuild = jda.get().getGuildById(server.getId());
            if (jdaGuild != null) {
                List<ChannelDto> dtos = jdaGuild.getChannels().stream()
                        .map(discordServerMapper::toChannelDto)
                        .toList();
                return sortChannelsHierarchically(dtos);
            }
        }

        return List.of();
    }

    private List<ChannelDto> sortChannelsHierarchically(List<ChannelDto> rawChannels) {
        if (rawChannels == null || rawChannels.isEmpty()) {
            return List.of();
        }

        Comparator<ChannelDto> channelComparator = Comparator
                .comparingInt((ChannelDto c) -> getChannelTypePrecedence(c.getType()))
                .thenComparingInt(c -> c.getPosition() != null ? c.getPosition() : 0)
                .thenComparing(c -> c.getName() != null ? c.getName() : "");

        List<ChannelDto> categories = rawChannels.stream()
                .filter(c -> c.getType() != null && c.getType() == 4)
                .sorted(Comparator.comparingInt(c -> c.getPosition() != null ? c.getPosition() : 0))
                .toList();

        Set<String> categoryIds = categories.stream()
                .map(ChannelDto::getId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        List<ChannelDto> uncategorized = rawChannels.stream()
                .filter(c -> (c.getType() == null || c.getType() != 4) && (c.getParentId() == null || c.getParentId().isBlank() || !categoryIds.contains(c.getParentId())))
                .sorted(channelComparator)
                .toList();

        Map<String, List<ChannelDto>> groupedByParent = rawChannels.stream()
                .filter(c -> (c.getType() == null || c.getType() != 4) && c.getParentId() != null && !c.getParentId().isBlank() && categoryIds.contains(c.getParentId()))
                .sorted(channelComparator)
                .collect(Collectors.groupingBy(ChannelDto::getParentId, LinkedHashMap::new, Collectors.toList()));

        List<ChannelDto> result = new ArrayList<>(rawChannels.size());
        result.addAll(uncategorized);

        for (ChannelDto category : categories) {
            result.add(category);
            List<ChannelDto> children = groupedByParent.get(category.getId());
            if (children != null) {
                result.addAll(children);
            }
        }

        return Collections.unmodifiableList(result);
    }

    private int getChannelTypePrecedence(Integer type) {
        if (type == null) {
            return 0;
        }
        return switch (type) {
            case 0, 5, 15, 16 -> 0;
            case 2, 13 -> 1;
            default -> 2;
        };
    }

    @Cacheable(value = "guild:roles", key = "#idOrSlug")
    @Transactional(readOnly = true)
    public List<ServerRoleDto> getServerRoles(String idOrSlug) {
        Server server = serverRepository.findByIdOrSlug(idOrSlug)
                .orElseThrow(() -> new ResourceNotFoundException("Server not found: " + idOrSlug));

        if (jda.isPresent() && jda.get().getStatus() == JDA.Status.CONNECTED) {
            Guild jdaGuild = jda.get().getGuildById(server.getId());
            if (jdaGuild != null) {
                Member botMember = null;
                try {
                    botMember = jdaGuild.getSelfMember();
                } catch (Exception e) {
                    if (jda.get().getSelfUser() != null) {
                        try {
                            botMember = jdaGuild.retrieveMember(jda.get().getSelfUser()).complete();
                        } catch (Exception ex) {
                            log.warn("Could not retrieve bot self member for guild {}: {}", jdaGuild.getId(), ex.getMessage());
                        }
                    }
                }
                final Member resolvedBotMember = botMember;
                return jdaGuild.getRoles().stream()
                        .filter(role -> !role.isPublicRole())
                        .map(role -> ServerRoleDto.builder()
                                .id(role.getId())
                                .name(role.getName())
                                .colorHex(role.getColor() != null ? String.format("#%06X", (0xFFFFFF & role.getColor().getRGB())) : null)
                                .position(role.getPosition())
                                .managed(role.isManaged())
                                .assignableByBot(resolvedBotMember != null && resolvedBotMember.canInteract(role) && !role.isManaged())
                                .build())
                        .sorted(Comparator.comparingInt(ServerRoleDto::getPosition).reversed())
                        .toList();
            }
        }

        return List.of();
    }

    @Caching(evict = {
            @CacheEvict(value = "guilds:summary", allEntries = true),
            @CacheEvict(value = "guild:details", allEntries = true),
            @CacheEvict(value = "guild:channels", allEntries = true),
            @CacheEvict(value = "guild:roles", allEntries = true)
    })
    @Transactional
    public ServerDetailDto updateServerSettings(String idOrSlug, UpdateServerSettingsRequest request, String operatorEmail) {
        Server server = serverRepository.findByIdOrSlug(idOrSlug)
                .orElseThrow(() -> new ResourceNotFoundException("Server not found: " + idOrSlug));

        DiscordGuildDetailDto liveDetails = discordClient.getGuildDetails(server.getId());
        if (liveDetails == null) {
            throw new ResourceNotFoundException("Discord guild details unavailable for " + server.getId());
        }

        validateBoostPerks(request, liveDetails);

        String auditReason = buildAuditReason(operatorEmail);

        int suppressionFlags = 0;
        if (!Boolean.TRUE.equals(request.getSendWelcome())) suppressionFlags |= (1 << 0);
        if (!Boolean.TRUE.equals(request.getBoostMessage())) suppressionFlags |= (1 << 1);
        if (!Boolean.TRUE.equals(request.getSetupTips())) suppressionFlags |= (1 << 2);
        if (!Boolean.TRUE.equals(request.getStickerPrompt())) suppressionFlags |= (1 << 3);

        String iconPayload = null;
        if (request.getIcon() != null && request.getIcon().startsWith("data:")) {
            iconPayload = request.getIcon();
        }

        String bannerPayload = null;
        if (request.getBanner() != null && !request.getBanner().isBlank() && request.getBanner().startsWith("data:")) {
            bannerPayload = request.getBanner();
        }

        DiscordGuildPatchRequest patchRequest = DiscordGuildPatchRequest.builder()
                .name(request.getName().trim())
                .description(request.getDescription())
                .icon(iconPayload)
                .banner(bannerPayload)
                .afkChannelId(request.getAfkChannelId())
                .afkTimeout(request.getAfkTimeout())
                .systemChannelId(request.getSystemChannelId())
                .systemChannelFlags(suppressionFlags)
                .defaultMessageNotifications(request.getDefaultMessageNotifications())
                .build();

        discordClient.updateGuildSettings(server.getId(), patchRequest, auditReason);

        if (request.getWidgetEnabled() != null) {
            discordClient.updateGuildWidget(server.getId(), request.getWidgetEnabled(), request.getWidgetChannelId(), auditReason);
        }

        server.setName(request.getName().trim());
        serverRepository.save(server);

        return getServerDetails(server.getId());
    }

    public void validateBoostPerks(UpdateServerSettingsRequest request, DiscordGuildDetailDto liveDetails) {
        int boostLevel = liveDetails.getPremiumTier() != null ? liveDetails.getPremiumTier() : 0;
        List<String> features = liveDetails.getFeatures() != null ? liveDetails.getFeatures() : List.of();

        if (request.getIcon() != null && request.getIcon().startsWith("data:image/gif")) {
            if (boostLevel < 1 && !features.contains("ANIMATED_ICON")) {
                throw new IllegalArgumentException("Animated GIF icons require Server Boost Level 1.");
            }
        }

        if (request.getBanner() != null && !request.getBanner().isBlank() && request.getBanner().startsWith("data:")) {
            if (boostLevel < 2 && !features.contains("BANNER")) {
                throw new IllegalArgumentException("Server banners require Server Boost Level 2.");
            }
            if (request.getBanner().startsWith("data:image/gif")) {
                if (boostLevel < 3 && !features.contains("ANIMATED_BANNER")) {
                    throw new IllegalArgumentException("Animated GIF banners require Server Boost Level 3.");
                }
            }
        }
    }

    public String generateUniqueSlug(String name, String guildId) {
        String base = name == null ? "" : name.toLowerCase(Locale.ENGLISH)
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("^-+|-+$", "");

        if (base.isBlank()) {
            base = "server-" + guildId;
        }

        String candidate = base;
        int counter = 2;
        while (serverRepository.existsBySlug(candidate)) {
            Optional<Server> existing = serverRepository.findBySlug(candidate);
            if (existing.isPresent() && existing.get().getId().equals(guildId)) {
                return candidate;
            }
            candidate = base + "-" + counter;
            counter++;
        }
        return candidate;
    }

    private String buildAuditReason(String operatorEmail) {
        String fullName = operatorEmail;
        if (userRepository != null && operatorEmail != null) {
            Optional<User> opUser = userRepository.findByEmail(operatorEmail);
            if (opUser.isPresent() && opUser.get().getFullName() != null && !opUser.get().getFullName().isBlank()) {
                fullName = opUser.get().getFullName();
            }
        }
        return String.format("Updated via RNG Control Center by %s (%s)", fullName, operatorEmail);
    }

    private List<ServerDto> syncAndMapJdaGuilds(List<Guild> jdaGuilds) {
        Map<String, DiscordGuildDto> countMap = new HashMap<>();
        try {
            List<DiscordGuildDto> botGuilds = discordClient.getBotGuilds();
            if (botGuilds != null) {
                for (DiscordGuildDto bg : botGuilds) {
                    countMap.put(bg.getId(), bg);
                }
            }
        } catch (Exception e) {
            log.warn("Could not retrieve bot guilds for presence mapping in syncAndMapJdaGuilds: {}", e.getMessage());
        }

        List<ServerDto> result = new ArrayList<>();
        for (Guild guild : jdaGuilds) {
            Server server = serverRepository.findById(guild.getId())
                    .orElseGet(() -> {
                        String slug = generateUniqueSlug(guild.getName(), guild.getId());
                        Server newServer = Server.builder()
                                .id(guild.getId())
                                .slug(slug)
                                .name(guild.getName())
                                .iconHash(guild.getIconId())
                                .bannerHash(guild.getBannerId())
                                .premiumTier(guild.getBoostTier().getKey())
                                .premiumSubscriptionCount(guild.getBoostCount())
                                .build();
                        return serverRepository.save(newServer);
                    });

            DiscordGuildDto countDto = countMap.get(guild.getId());
            int online = 0;
            if (countDto != null && countDto.getApproximatePresenceCount() != null) {
                online = countDto.getApproximatePresenceCount();
            } else {
                online = calculateOnlineCount(guild);
            }
            int total = guild.getMemberCount();
            if (total == 0 && countDto != null && countDto.getApproximateMemberCount() != null) {
                total = countDto.getApproximateMemberCount();
            }

            result.add(discordServerMapper.toServerDto(
                    server,
                    guild.getName(),
                    guild.getIconUrl(),
                    guild.getBannerUrl(),
                    online,
                    total,
                    guild.getBoostTier().getKey(),
                    guild.getBoostCount()
            ));
        }
        return result;
    }

    private int calculateOnlineCount(Guild guild) {
        if (guild == null) {
            return 0;
        }
        try {
            long online = guild.getMembers().stream()
                    .filter(m -> {
                        if (m == null) return false;
                        OnlineStatus status = m.getOnlineStatus();
                        return status == OnlineStatus.ONLINE
                                || status == OnlineStatus.IDLE
                                || status == OnlineStatus.DO_NOT_DISTURB;
                    })
                    .count();
            return (int) online;
        } catch (Exception e) {
            log.warn("Could not compute online presence count from JDA guild {}: {}", guild.getId(), e.getMessage());
            return 0;
        }
    }

    private ServerDetailDto mapJdaGuildToDetailDto(Server server, Guild guild) {
        int online = 0;
        try {
            DiscordGuildDetailDto detail = discordClient.getGuildDetails(server.getId());
            if (detail != null && detail.getApproximatePresenceCount() != null) {
                online = detail.getApproximatePresenceCount();
            }
        } catch (Exception ignored) {
        }
        if (online == 0) {
            online = calculateOnlineCount(guild);
        }
        int total = guild.getMemberCount();

        return discordServerMapper.toServerDetailDto(server, guild, online, total);
    }

    private ServerDto mapEntityToDto(Server server) {
        return discordServerMapper.toServerDto(
                server,
                server.getName(),
                discordServerMapper.formatDiscordIconUrl(server.getId(), server.getIconHash()),
                discordServerMapper.formatDiscordBannerUrl(server.getId(), server.getBannerHash()),
                0,
                0,
                server.getPremiumTier(),
                server.getPremiumSubscriptionCount()
        );
    }

    public String resolveGuildId(String idOrSlug) {
        if (idOrSlug == null || idOrSlug.isBlank()) {
            return idOrSlug;
        }
        if (idOrSlug.matches("\\d+")) {
            return idOrSlug;
        }
        Optional<Server> server = serverRepository.findByIdOrSlug(idOrSlug);
        if (server.isPresent()) {
            return server.get().getId();
        }
        if (jda.isPresent() && jda.get().getStatus() == JDA.Status.CONNECTED) {
            for (Guild g : jda.get().getGuilds()) {
                String slug = generateUniqueSlug(g.getName(), g.getId());
                if (slug.equalsIgnoreCase(idOrSlug)) {
                    return g.getId();
                }
            }
        }
        try {
            List<DiscordGuildDto> botGuilds = discordClient.getBotGuilds();
            if (botGuilds != null) {
                for (DiscordGuildDto bg : botGuilds) {
                    String slug = generateUniqueSlug(bg.getName(), bg.getId());
                    if (slug.equalsIgnoreCase(idOrSlug)) {
                        return bg.getId();
                    }
                }
            }
        } catch (Exception ignored) {}

        return idOrSlug;
    }

    @Caching(
            evict = {
                    @CacheEvict(value = "emojis:server", key = "#idOrSlug", condition = "#refresh", beforeInvocation = true)
            },
            cacheable = {
                    @Cacheable(value = "emojis:server", key = "#idOrSlug")
            }
    )
    public List<DiscordEmojiDto> getServerEmojis(String idOrSlug, boolean refresh) {
        String guildId = resolveGuildId(idOrSlug);
        if (guildId == null || !guildId.matches("\\d+")) {
            log.warn("Cannot resolve valid Discord snowflake ID for server identifier: {}", idOrSlug);
            return List.of();
        }

        // 1. Try Discord REST API v10
        if (discordClient != null) {
            try {
                List<DiscordEmojiResponseDto> restEmojis = discordClient.getGuildEmojis(guildId);
                if (restEmojis != null && !restEmojis.isEmpty()) {
                    return restEmojis.stream()
                            .map(discordServerMapper::toDiscordEmojiDto)
                            .toList();
                }
            } catch (Exception e) {
                log.warn("Failed to fetch server emojis from Discord REST for guild {}: {}", guildId, e.getMessage());
            }
        }

        // 2. Fallback to JDA Gateway cache
        if (jda.isPresent() && jda.get().getStatus() == JDA.Status.CONNECTED) {
            try {
                Guild guild = jda.get().getGuildById(guildId);
                if (guild != null) {
                    List<net.dv8tion.jda.api.entities.emoji.RichCustomEmoji> emojis = guild.getEmojis();
                    if (!emojis.isEmpty()) {
                        return emojis.stream()
                                .map(discordServerMapper::toDiscordEmojiDto)
                                .toList();
                    }
                }
            } catch (Exception e) {
                log.warn("JDA cache lookup failed for guild emojis {}: {}", guildId, e.getMessage());
            }
        }

        return List.of();
    }

    public List<DiscordEmojiDto> getServerEmojis(String idOrSlug) {
        return getServerEmojis(idOrSlug, false);
    }

    @Caching(
            evict = {
                    @CacheEvict(value = "emojis:bot", allEntries = true, condition = "#refresh", beforeInvocation = true)
            },
            cacheable = {
                    @Cacheable(value = "emojis:bot", key = "'all'")
            }
    )
    public List<DiscordEmojiDto> getBotEmojis(boolean refresh) {
        // Resolve Application ID and fetch application-scoped emojis
        String appId = null;
        if (jda.isPresent()) {
            try {
                appId = jda.get().retrieveApplicationInfo().complete().getId();
            } catch (Exception ignored) {}
        }
        if (appId == null) {
            appId = discordClient.getApplicationId();
        }

        if (appId != null) {
            try {
                List<DiscordEmojiResponseDto> appEmojis = discordClient.getApplicationEmojis(appId);
                if (appEmojis != null && !appEmojis.isEmpty()) {
                    return appEmojis.stream()
                            .map(discordServerMapper::toDiscordEmojiDto)
                            .toList();
                }
            } catch (Exception e) {
                log.warn("Failed to fetch application emojis for bot: {}", e.getMessage());
            }
        }

        return List.of();
    }

    public List<DiscordEmojiDto> getBotEmojis() {
        return getBotEmojis(false);
    }
}
