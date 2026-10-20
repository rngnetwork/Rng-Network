package com.rednecksgaming.common.config;

import lombok.extern.slf4j.Slf4j;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;
import java.nio.charset.StandardCharsets;
import java.util.List;

@Slf4j
public final class DotenvLoader {

    private DotenvLoader() {}

    public static void load() {
        List<File> candidates = List.of(
                new File(".env"),
                new File("../.env"),
                new File("backend/.env"),
                new File("../backend/.env")
        );

        for (File file : candidates) {
            if (file.exists() && file.isFile()) {
                log.info("Loading environment variables from: {}", file.getAbsolutePath());
                loadFile(file);
                return;
            }
        }
        log.warn("No .env file found in candidate locations ({})", candidates);
    }

    private static void loadFile(File file) {
        try (BufferedReader reader = new BufferedReader(new FileReader(file, StandardCharsets.UTF_8))) {
            String line;
            int loadedCount = 0;
            while ((line = reader.readLine()) != null) {
                line = line.trim();
                if (line.isEmpty() || line.startsWith("#")) {
                    continue;
                }
                int eqIdx = line.indexOf('=');
                if (eqIdx > 0) {
                    String key = line.substring(0, eqIdx).trim();
                    String value = line.substring(eqIdx + 1).trim();

                    if ((value.startsWith("\"") && value.endsWith("\"")) ||
                        (value.startsWith("'") && value.endsWith("'"))) {
                        value = value.substring(1, value.length() - 1);
                    }

                    if (System.getenv(key) == null && System.getProperty(key) == null) {
                        System.setProperty(key, value);
                        loadedCount++;
                    }
                }
            }
            log.info("Successfully loaded {} environment variables from {}", loadedCount, file.getName());
        } catch (Exception e) {
            log.error("Failed to read .env file from {}: {}", file.getAbsolutePath(), e.getMessage());
        }
    }
}
