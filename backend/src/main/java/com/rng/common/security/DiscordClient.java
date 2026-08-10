package com.rng.common.security;

import com.rng.common.dto.DiscordUserDto;

public interface DiscordClient {

    DiscordUserDto fetchDiscordUser(String code);
}
