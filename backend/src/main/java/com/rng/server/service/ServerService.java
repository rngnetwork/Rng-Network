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
import java.util.List;
import java.util.Locale;
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
        // Priority 1: Fast 0ms read from JDA Gateway Cache
        if (jda.isPresent() && jda.get().getStatus() == JDA.Status.CONNECTED) {
            List<Guild> jdaGuilds = jda.get().getGuilds();
            if (!jdaGuilds.isEmpty()) {
                log.debug("Serving {} servers from JDA Gateway in-memory cache", jdaGuilds.size());
                return syncAndMapJdaGuilds(jdaGuilds);
            }
        }

        // Priority 2: Outbound REST Client (with auto fallback to database on 429/failures)
        List<DiscordGuildDto> guilds;
        try {
            guilds = discordClient.getBotGuilds();
        } catch (Exception e) {
            log.warn("Discord REST API unavailable for getAllServers ({}), falling back to database records", e.getMessage());
            return serverRepository.findAll().stream()
                    .map(this::mapEntityToDto)
                    .toList();
        }

        if (guilds.isEmpty()) {
            return serverRepository.findAll().stream()
                    .map(this::mapEntityToDto)
                    .toList();
        }

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

            result.add(ServerDto.builder()
                    .id(server.getId())
                    .slug(server.getSlug())
                    .name(server.getName())
                    .iconUrl(formatDiscordIconUrl(server.getId(), server.getIconHash()))
                    .bannerUrl(formatDiscordBannerUrl(server.getId(), server.getBannerHash()))
                    .onlineCount(guild.getApproximatePresenceCount() != null ? guild.getApproximatePresenceCount() : 0)
                    .totalCount(guild.getApproximateMemberCount() != null ? guild.getApproximateMemberCount() : 0)
                    .boostLevel(server.getPremiumTier())
                    .boostCount(server.getPremiumSubscriptionCount())
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

        // Priority 1: JDA in-memory guild details
        if (jda.isPresent() && jda.get().getStatus() == JDA.Status.CONNECTED) {
            Guild jdaGuild = jda.get().getGuildById(server.getId());
            if (jdaGuild != null) {
                return mapJdaGuildToDetailDto(server, jdaGuild);
            }
        }

        // Priority 2: Discord REST Client
        DiscordGuildDetailDto details = discordClient.getGuildDetails(server.getId());
        if (details == null) {
            throw new ResourceNotFoundException("Discord guild details unavailable for " + server.getId());
        }

        int flags = details.getSystemChannelFlags() != null ? details.getSystemChannelFlags() : 0;
        boolean sendWelcome = (flags & (1 << 0)) == 0;
        boolean boostMessage = (flags & (1 << 1)) == 0;
        boolean setupTips = (flags & (1 << 2)) == 0;
        boolean stickerPrompt = (flags & (1 << 3)) == 0;

        int onlineCount = 0;
        int totalCount = 0;
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

        return ServerDetailDto.builder()
                .id(server.getId())
                .slug(server.getSlug())
                .name(details.getName())
                .description(details.getDescription())
                .iconUrl(formatDiscordIconUrl(server.getId(), details.getIcon()))
                .bannerUrl(formatDiscordBannerUrl(server.getId(), details.getBanner()))
                .onlineCount(onlineCount)
                .totalCount(totalCount)
                .boostLevel(details.getPremiumTier() != null ? details.getPremiumTier() : 0)
                .boostCount(details.getPremiumSubscriptionCount() != null ? details.getPremiumSubscriptionCount() : 0)
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

        if (request.getVanityUrl() != null && !request.getVanityUrl().isBlank()) {
            String sanitizedVanity = request.getVanityUrl().trim();
            if (!sanitizedVanity.equals(liveDetails.getVanityUrlCode())) {
                discordClient.updateGuildVanityUrl(server.getId(), sanitizedVanity, auditReason);
            }
        }

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

        if (request.getVanityUrl() != null && !request.getVanityUrl().isBlank()) {
            String requestedVanity = request.getVanityUrl().trim();
            if (!requestedVanity.equals(liveDetails.getVanityUrlCode())) {
                if (boostLevel < 3 && !features.contains("VANITY_URL")) {
                    throw new IllegalArgumentException("Custom vanity URLs require Server Boost Level 3.");
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

            result.add(ServerDto.builder()
                    .id(server.getId())
                    .slug(server.getSlug())
                    .name(guild.getName())
                    .iconUrl(guild.getIconUrl())
                    .bannerUrl(guild.getBannerUrl())
                    .onlineCount(guild.getMemberCount())
                    .totalCount(guild.getMemberCount())
                    .boostLevel(guild.getBoostTier().getKey())
                    .boostCount(guild.getBoostCount())
                    .status("operational")
                    .build());
        }
        return result;
    }

    private ServerDetailDto mapJdaGuildToDetailDto(Server server, Guild guild) {
        return ServerDetailDto.builder()
                .id(server.getId())
                .slug(server.getSlug())
                .name(guild.getName())
                .description(guild.getDescription())
                .iconUrl(guild.getIconUrl())
                .bannerUrl(guild.getBannerUrl())
                .onlineCount(guild.getMemberCount())
                .totalCount(guild.getMemberCount())
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
