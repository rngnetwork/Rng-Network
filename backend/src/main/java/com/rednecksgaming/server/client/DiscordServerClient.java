package com.rednecksgaming.server.client;

import com.rednecksgaming.server.dto.discord.DiscordChannelDto;
import com.rednecksgaming.server.dto.discord.DiscordGuildDetailDto;
import com.rednecksgaming.server.dto.discord.DiscordGuildDto;
import com.rednecksgaming.server.dto.discord.DiscordGuildPatchRequest;

import java.util.List;

public interface DiscordServerClient {

    List<DiscordGuildDto> getBotGuilds();

    DiscordGuildDetailDto getGuildDetails(String guildId);

    List<DiscordChannelDto> getGuildChannels(String guildId);

    void updateGuildSettings(String guildId, DiscordGuildPatchRequest request, String auditReason);

    void updateGuildWidget(String guildId, boolean enabled, String channelId, String auditReason);

    List<com.rednecksgaming.server.dto.discord.DiscordEmojiResponseDto> getGuildEmojis(String guildId);

    List<com.rednecksgaming.server.dto.discord.DiscordEmojiResponseDto> getApplicationEmojis(String applicationId);

    String getApplicationId();
}
