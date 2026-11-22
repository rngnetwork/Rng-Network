// Written By: RachitSWE
// LICENSE: All rights reserved
// Year: 2026
package com.rednecksgaming.embed.controller;

import com.rednecksgaming.common.dto.ApiResponse;
import com.rednecksgaming.embed.dto.EmbedMediaResponse;
import com.rednecksgaming.embed.service.EmbedMediaService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.concurrent.TimeUnit;


@RestController
@RequestMapping("/api/v1/embeds/media")
@RequiredArgsConstructor
public class EmbedMediaController {

    private final EmbedMediaService mediaService;

    @PostMapping("/upload")
    public ResponseEntity<ApiResponse<EmbedMediaResponse>> uploadMedia(
            @RequestParam("file") MultipartFile file) {
        EmbedMediaResponse response = mediaService.storeMedia(file);
        return ResponseEntity.ok(ApiResponse.success(response, "Media uploaded successfully"));
    }

    @GetMapping("/{filename:.+}")
    public ResponseEntity<Resource> serveMedia(@PathVariable("filename") String filename) {
        Resource resource = mediaService.loadMediaAsResource(filename);
        String contentType = mediaService.resolveContentType(filename);

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .cacheControl(CacheControl.maxAge(30, TimeUnit.DAYS).cachePublic())
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
                .body(resource);
    }
}
