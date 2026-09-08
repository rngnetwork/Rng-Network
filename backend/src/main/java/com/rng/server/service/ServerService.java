package com.rng.server.service;

import com.rng.common.exception.ResourceNotFoundException;
import com.rng.identity.domain.User;
import com.rng.identity.repository.UserRepository;
import com.rng.server.client.DiscordServerClient;
import com.rng.server.domain.Server;
import com.rng.server.dto.ChannelDto;
import com.rng.server.dto.ServerDetailDto;
import com.rng.server.dto.ServerDto;
import com.rng.server.dto.UpdateServerSettingsRequest;
import com.rng.server.dto.discord.DiscordChannelDto;
import com.rng.server.dto.discord.DiscordGuildDetailDto;
import com.rng.server.dto.discord.DiscordGuildDto;
import com.rng.server.dto.discord.DiscordGuildPatchRequest;
import com.rng.server.repository.ServerRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.dv8tion.jda.api.JDA;
import net.dv8tion.jda.api.OnlineStatus;
import net.dv8tion.jda.api.entities.Guild;
import net.dv8tion.jda.api.entities.channel.concrete.TextChannel;
import net.dv8tion.jda.api.entities.channel.concrete.VoiceChannel;
import net.dv8tion.jda.api.entities.channel.middleman.GuildChannel;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;

@Slf4j
@Service
public class ServerService {

    private final ServerRepository serverRepository;
    private final DiscordServerClient discordClient;
    private final UserRepository userRepository;
    private final Optional<JDA> jda;

    public ServerService(
            ServerRepository serverRepository,
            DiscordServerClient discordClient,
            UserRepository userRepository,
            @Autowired(required = false) JDA jda
    ) {
        this.serverRepository = serverRepository;
        this.discordClient = discordClient;
        this.userRepository = userRepository;
        this.jda = Optional.ofNullable(jda);
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
            String iconUrl = formatDiscordIconUrl(server.getId(), server.getIconHash());
            String bannerUrl = formatDiscordBannerUrl(server.getId(), server.getBannerHash());
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

            result.add(ServerDto.builder()
                    .id(server.getId())
                    .slug(server.getSlug())
                    .name(serverName)
                    .iconUrl(iconUrl)
                    .bannerUrl(bannerUrl)
                    .onlineCount(guild.getApproximatePresenceCount() != null ? guild.getApproximatePresenceCount() : 0)
                    .totalCount(guild.getApproximateMemberCount() != null ? guild.getApproximateMemberCount() : 0)
                    .boostLevel(boostLevel)
                    .boostCount(boostCount)
                    .status("operational")
                    .build());
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

        return ServerDetailDto.builder()
                .id(server.getId())
                .slug(server.getSlug())
                .name(details.getName())
                .description(details.getDescription())
                .iconUrl(formatDiscordIconUrl(server.getId(), details.getIcon()))
                .bannerUrl(formatDiscordBannerUrl(server.getId(), details.getBanner()))
                .onlineCount(onlineCount)
                .totalCount(totalCount)
                .boostLevel(boostLevel)
                .boostCount(boostCount)
                .features(details.getFeatures() != null ? details.getFeatures() : List.of())
                .afkChannelId(details.getAfkChannelId())
                .afkTimeout(details.getAfkTimeout())
                .systemChannelId(details.getSystemChannelId())
                .sendWelcome(sendWelcome)
                .stickerPrompt(stickerPrompt)
                .boostMessage(boostMessage)
                .setupTips(setupTips)
                .defaultMessageNotifications(details.getDefaultMessageNotifications())
                .vanityUrl(details.getVanityUrlCode())
                .widgetEnabled(details.getWidgetEnabled())
                .widgetChannelId(details.getWidgetChannelId())
                .build();
    }

    @Cacheable(value = "guild:channels", key = "#idOrSlug")
    @Transactional(readOnly = true)
    public List<ChannelDto> getServerChannels(String idOrSlug) {
        Server server = serverRepository.findByIdOrSlug(idOrSlug)
                .orElseThrow(() -> new ResourceNotFoundException("Server not found: " + idOrSlug));

        if (jda.isPresent() && jda.get().getStatus() == JDA.Status.CONNECTED) {
            Guild jdaGuild = jda.get().getGuildById(server.getId());
            if (jdaGuild != null) {
                return jdaGuild.getChannels().stream()
                        .map(this::mapJdaChannelToDto)
                        .toList();
            }
        }

        List<DiscordChannelDto> channels = discordClient.getGuildChannels(server.getId());
        return channels.stream()
                .map(c -> ChannelDto.builder()
                        .id(c.getId())
                        .name(c.getName())
                        .type(c.getType())
                        .position(c.getPosition())
                        .parentId(c.getParentId())
                        .build())
                .toList();
    }

    @Caching(evict = {
            @CacheEvict(value = "guilds:summary", allEntries = true),
            @CacheEvict(value = "guild:details", allEntries = true),
            @CacheEvict(value = "guild:channels", allEntries = true)
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
        if (request.getBanner() != null && request.getBanner().startsWith("data:")) {
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

    private String formatDiscordIconUrl(String guildId, String iconHash) {
        if (guildId == null || iconHash == null) {
            return null;
        }
        String ext = iconHash.startsWith("a_") ? "gif" : "png";
        return String.format("https://cdn.discordapp.com/icons/%s/%s.%s", guildId, iconHash, ext);
    }

    private String formatDiscordBannerUrl(String guildId, String bannerHash) {
        if (guildId == null || bannerHash == null) {
            return null;
        }
        String ext = bannerHash.startsWith("a_") ? "gif" : "png";
        return String.format("https://cdn.discordapp.com/banners/%s/%s.%s", guildId, bannerHash, ext);
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
            int online = calculateOnlineCount(guild);
            if (online == 0 && countDto != null && countDto.getApproximatePresenceCount() != null) {
                online = countDto.getApproximatePresenceCount();
            }
            int total = guild.getMemberCount();
            if (total == 0 && countDto != null && countDto.getApproximateMemberCount() != null) {
                total = countDto.getApproximateMemberCount();
            }

            result.add(ServerDto.builder()
                    .id(server.getId())
                    .slug(server.getSlug())
                    .name(guild.getName())
                    .iconUrl(guild.getIconUrl())
                    .bannerUrl(guild.getBannerUrl())
                    .onlineCount(online)
                    .totalCount(total)
                    .boostLevel(guild.getBoostTier().getKey())
                    .boostCount(guild.getBoostCount())
                    .status("operational")
                    .build());
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
        int online = calculateOnlineCount(guild);
        int total = guild.getMemberCount();
        if (online == 0) {
            try {
                DiscordGuildDetailDto detail = discordClient.getGuildDetails(server.getId());
                if (detail != null && detail.getApproximatePresenceCount() != null) {
                    online = detail.getApproximatePresenceCount();
                }
            } catch (Exception ignored) {
            }
        }

        return ServerDetailDto.builder()
                .id(server.getId())
                .slug(server.getSlug())
                .name(guild.getName())
                .description(guild.getDescription())
                .iconUrl(guild.getIconUrl())
                .bannerUrl(guild.getBannerUrl())
                .onlineCount(online)
                .totalCount(total)
                .boostLevel(guild.getBoostTier().getKey())
                .boostCount(guild.getBoostCount())
                .features(guild.getFeatures().stream().toList())
                .afkChannelId(guild.getAfkChannel() != null ? guild.getAfkChannel().getId() : null)
                .afkTimeout(guild.getAfkTimeout().getSeconds())
                .systemChannelId(guild.getSystemChannel() != null ? guild.getSystemChannel().getId() : null)
                .sendWelcome(true)
                .stickerPrompt(true)
                .boostMessage(true)
                .setupTips(true)
                .defaultMessageNotifications(guild.getDefaultNotificationLevel().getKey())
                .vanityUrl(guild.getVanityCode())
                .widgetEnabled(false)
                .widgetChannelId(null)
                .build();
    }

    private ChannelDto mapJdaChannelToDto(GuildChannel channel) {
        int position = channel instanceof net.dv8tion.jda.api.entities.channel.attribute.IPositionableChannel pc ? pc.getPosition() : 0;
        return ChannelDto.builder()
                .id(channel.getId())
                .name(channel.getName())
                .type(channel.getType().getId())
                .position(position)
                .parentId(null)
                .build();
    }

    private ServerDto mapEntityToDto(Server server) {
        return ServerDto.builder()
                .id(server.getId())
                .slug(server.getSlug())
                .name(server.getName())
                .iconUrl(formatDiscordIconUrl(server.getId(), server.getIconHash()))
                .bannerUrl(formatDiscordBannerUrl(server.getId(), server.getBannerHash()))
                .onlineCount(0)
                .totalCount(0)
                .boostLevel(server.getPremiumTier())
                .boostCount(server.getPremiumSubscriptionCount())
                .status("operational")
                .build();
    }
}
