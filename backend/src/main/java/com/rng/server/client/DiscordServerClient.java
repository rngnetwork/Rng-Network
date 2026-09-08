package com.rng.server.client;

import com.rng.server.dto.discord.DiscordChannelDto;
import com.rng.server.dto.discord.DiscordGuildDetailDto;
import com.rng.server.dto.discord.DiscordGuildDto;
import com.rng.server.dto.discord.DiscordGuildPatchRequest;

import java.util.List;

public interface DiscordServerClient {

    List<DiscordGuildDto> getBotGuilds();

    DiscordGuildDetailDto getGuildDetails(String guildId);

    List<DiscordChannelDto> getGuildChannels(String guildId);

    void updateGuildSettings(String guildId, DiscordGuildPatchRequest request, String auditReason);

    void updateGuildWidget(String guildId, boolean enabled, String channelId, String auditReason);
}
