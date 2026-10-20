package com.rednecksgaming.common.security;

import com.rednecksgaming.common.dto.DiscordUserDto;

public interface DiscordClient {

    DiscordUserDto fetchDiscordUser(String code);
}
