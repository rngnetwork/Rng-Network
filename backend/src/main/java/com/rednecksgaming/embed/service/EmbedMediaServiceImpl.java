// Written By: RachitSWE
// LICENSE: All rights reserved
// Year: 2026
package com.rednecksgaming.embed.service;

import com.rednecksgaming.embed.dto.EmbedMediaResponse;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.io.IOException;
import java.io.InputStream;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Slf4j
@Service
public class EmbedMediaServiceImpl implements EmbedMediaService {

    private static final long MAX_FILE_SIZE = 15L * 1024L * 1024L; // 15 MB
    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "image/png",
            "image/jpeg",
            "image/gif",
            "image/webp"
    );
    private static final Map<String, String> EXTENSION_TO_MIME = Map.of(
            "png", "image/png",
            "jpg", "image/jpeg",
            "jpeg", "image/jpeg",
            "gif", "image/gif",
            "webp", "image/webp"
    );

    @Value("${app.media.upload-dir:uploads/embed-media}")
    private String uploadDirProperty;

    @Value("${app.media.base-url:}")
    private String configuredBaseUrl;

    private Path storageLocation;

    @PostConstruct
    public void init() {
        this.storageLocation = Paths.get(uploadDirProperty).toAbsolutePath().normalize();
        try {
            Files.createDirectories(this.storageLocation);
            log.info("Initialized embed media storage directory at: {}", this.storageLocation);
        } catch (IOException e) {
            throw new IllegalStateException("Failed to create embed media storage directory: " + this.storageLocation, e);
        }
    }

    @Override
    public EmbedMediaResponse storeMedia(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No file uploaded or file is empty");
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "File size exceeds the 15 MB maximum limit");
        }

        String rawContentType = file.getContentType();
        if (rawContentType == null || !ALLOWED_CONTENT_TYPES.contains(rawContentType.toLowerCase())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported image type. Permitted: PNG, JPEG, GIF, WEBP");
        }

        String originalFilename = StringUtils.cleanPath(file.getOriginalFilename() != null ? file.getOriginalFilename() : "image.png");
        if (originalFilename.contains("..")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Filename contains invalid path sequence");
        }

        String extension = resolveExtension(originalFilename, rawContentType);
        String storedFilename = UUID.randomUUID() + "." + extension;
        Path targetDestination = this.storageLocation.resolve(storedFilename).normalize();

        if (!targetDestination.startsWith(this.storageLocation)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Security violation: Invalid storage path");
        }

        try (InputStream inputStream = file.getInputStream()) {
            Files.copy(inputStream, targetDestination, StandardCopyOption.REPLACE_EXISTING);
            log.info("Successfully stored embed media: {} (size: {} bytes)", storedFilename, file.getSize());
        } catch (IOException e) {
            log.error("Failed to store media file: {}", originalFilename, e);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to persist media file", e);
        }

        String publicUrl = buildPublicMediaUrl(storedFilename);

        return EmbedMediaResponse.builder()
                .url(publicUrl)
                .filename(storedFilename)
                .contentType(rawContentType)
                .sizeBytes(file.getSize())
                .build();
    }

    @Override
    public Resource loadMediaAsResource(String filename) {
        if (!StringUtils.hasText(filename) || filename.contains("..") || filename.contains("/") || filename.contains("\\")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid media filename");
        }

        try {
            Path filePath = this.storageLocation.resolve(filename).normalize();
            if (!filePath.startsWith(this.storageLocation)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid media path traversal attempt");
            }

            Resource resource = new UrlResource(filePath.toUri());
            if (resource.exists() && resource.isReadable()) {
                return resource;
            } else {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Requested media file not found: " + filename);
            }
        } catch (MalformedURLException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Malformed media file path", e);
        }
    }

    @Override
    public String resolveContentType(String filename) {
        if (filename == null) {
            return "application/octet-stream";
        }
        int dotIndex = filename.lastIndexOf('.');
        if (dotIndex != -1 && dotIndex < filename.length() - 1) {
            String ext = filename.substring(dotIndex + 1).toLowerCase();
            return EXTENSION_TO_MIME.getOrDefault(ext, "application/octet-stream");
        }
        return "application/octet-stream";
    }

    private String resolveExtension(String filename, String contentType) {
        int dotIndex = filename.lastIndexOf('.');
        if (dotIndex != -1 && dotIndex < filename.length() - 1) {
            String ext = filename.substring(dotIndex + 1).toLowerCase();
            if (EXTENSION_TO_MIME.containsKey(ext)) {
                return ext;
            }
        }
        return switch (contentType.toLowerCase()) {
            case "image/jpeg" -> "jpg";
            case "image/gif" -> "gif";
            case "image/webp" -> "webp";
            default -> "png";
        };
    }

    private String buildPublicMediaUrl(String storedFilename) {
        if (StringUtils.hasText(configuredBaseUrl)) {
            String sanitized = configuredBaseUrl.replaceAll("/$", "");
            return sanitized + "/" + storedFilename;
        }

        try {
            return ServletUriComponentsBuilder.fromCurrentContextPath()
                    .path("/api/v1/embeds/media/")
                    .path(storedFilename)
                    .toUriString();
        } catch (Exception e) {
            log.warn("Could not derive request context path for media URL, falling back to relative path: {}", e.getMessage());
            return "/api/v1/embeds/media/" + storedFilename;
        }
    }
}
