// Written By: RachitSWE
// LICENSE: All rights reserved
// Year: 2026
package com.rednecksgaming.server.controller;

import com.rednecksgaming.common.dto.ApiResponse;
import com.rednecksgaming.server.dto.DiscordEmojiDto;
import com.rednecksgaming.server.service.ServerService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/bot")
@RequiredArgsConstructor
public class BotController {

    private final ServerService serverService;

    @GetMapping("/emojis")
    public ResponseEntity<ApiResponse<List<DiscordEmojiDto>>> getBotEmojis() {
        List<DiscordEmojiDto> emojis = serverService.getBotEmojis();
        return ResponseEntity.ok(ApiResponse.success(emojis));
    }
}
