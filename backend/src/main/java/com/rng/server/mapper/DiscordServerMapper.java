package com.rng.server.mapper;

import com.rng.server.domain.Server;
import com.rng.server.dto.ChannelDto;
import com.rng.server.dto.DiscordEmojiDto;
import com.rng.server.dto.ServerDetailDto;
import com.rng.server.dto.ServerDto;
import com.rng.server.dto.discord.DiscordChannelDto;
import com.rng.server.dto.discord.DiscordEmojiResponseDto;
import com.rng.server.dto.discord.DiscordGuildDetailDto;
import net.dv8tion.jda.api.entities.channel.attribute.IPositionableChannel;
import net.dv8tion.jda.api.entities.channel.concrete.Category;
import net.dv8tion.jda.api.entities.channel.middleman.GuildChannel;
import net.dv8tion.jda.api.entities.emoji.RichCustomEmoji;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Enterprise mapper translating raw Discord API / JDA gateway representations
 * into structured RNG Control Center domain DTOs.
 */
@Component
public class DiscordServerMapper {

    public ChannelDto toChannelDto(DiscordChannelDto c) {
        if (c == null) {
            return null;
        }
        return ChannelDto.builder()
                .id(c.getId())
                .name(c.getName())
                .type(c.getType())
                .position(c.getPosition() != null ? c.getPosition() : 0)
                .parentId(c.getParentId())
                .build();
    }

    public ChannelDto toChannelDto(GuildChannel c) {
        if (c == null) {
            return null;
        }
        int position = (c instanceof IPositionableChannel pos) ? pos.getPosition() : 0;
        String parentId = null;
        if (c instanceof net.dv8tion.jda.api.entities.channel.attribute.ICategorizableChannel cat) {
            Category parent = cat.getParentCategory();
            if (parent != null) {
                parentId = parent.getId();
            }
        }
        return ChannelDto.builder()
                .id(c.getId())
                .name(c.getName())
                .type(c.getType().getId())
                .position(position)
                .parentId(parentId)
                .build();
    }

    public DiscordEmojiDto toDiscordEmojiDto(DiscordEmojiResponseDto e) {
        if (e == null) {
            return null;
        }
        return DiscordEmojiDto.from(e.id(), e.name(), e.animated());
    }

    public DiscordEmojiDto toDiscordEmojiDto(RichCustomEmoji e) {
        if (e == null) {
            return null;
        }
        return DiscordEmojiDto.from(e.getId(), e.getName(), e.isAnimated());
    }

    public ServerDetailDto toServerDetailDto(
            Server server,
            DiscordGuildDetailDto details,
            int onlineCount,
            int totalCount,
            int boostLevel,
            int boostCount,
            boolean sendWelcome,
            boolean stickerPrompt,
            boolean boostMessage,
            boolean setupTips) {

        if (server == null || details == null) {
            return null;
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

    public ServerDetailDto toServerDetailDto(
            Server server,
            net.dv8tion.jda.api.entities.Guild guild,
            int onlineCount,
            int totalCount) {

        if (server == null || guild == null) {
            return null;
        }

        return ServerDetailDto.builder()
                .id(server.getId())
                .slug(server.getSlug())
                .name(guild.getName())
                .description(guild.getDescription())
                .iconUrl(guild.getIconUrl())
                .bannerUrl(guild.getBannerUrl())
                .onlineCount(onlineCount)
                .totalCount(totalCount)
                .boostLevel(guild.getBoostTier().getKey())
                .boostCount(guild.getBoostCount())
                .features(guild.getFeatures() != null ? guild.getFeatures().stream().toList() : List.of())
                .afkChannelId(guild.getAfkChannel() != null ? guild.getAfkChannel().getId() : null)
                .afkTimeout(guild.getAfkTimeout() != null ? guild.getAfkTimeout().getSeconds() : 0)
                .systemChannelId(guild.getSystemChannel() != null ? guild.getSystemChannel().getId() : null)
                .sendWelcome(true)
                .stickerPrompt(true)
                .boostMessage(true)
                .setupTips(true)
                .defaultMessageNotifications(guild.getDefaultNotificationLevel() != null ? guild.getDefaultNotificationLevel().getKey() : 0)
                .vanityUrl(guild.getVanityCode())
                .widgetEnabled(false)
                .widgetChannelId(null)
                .build();
    }

    public ServerDto toServerDto(
            Server server,
            String serverName,
            String iconUrl,
            String bannerUrl,
            int onlineCount,
            int totalCount,
            int boostLevel,
            int boostCount) {

        if (server == null) {
            return null;
        }

        return ServerDto.builder()
                .id(server.getId())
                .slug(server.getSlug())
                .name(serverName)
                .iconUrl(iconUrl)
                .bannerUrl(bannerUrl)
                .onlineCount(onlineCount)
                .totalCount(totalCount)
                .boostLevel(boostLevel)
                .boostCount(boostCount)
                .status("operational")
                .build();
    }

    public String formatDiscordIconUrl(String guildId, String iconHash) {
        if (guildId == null || iconHash == null) {
            return null;
        }
        String ext = iconHash.startsWith("a_") ? "gif" : "png";
        return String.format("https://cdn.discordapp.com/icons/%s/%s.%s", guildId, iconHash, ext);
    }

    public String formatDiscordBannerUrl(String guildId, String bannerHash) {
        if (guildId == null || bannerHash == null) {
            return null;
        }
        String ext = bannerHash.startsWith("a_") ? "gif" : "png";
        return String.format("https://cdn.discordapp.com/banners/%s/%s.%s", guildId, bannerHash, ext);
    }
}
