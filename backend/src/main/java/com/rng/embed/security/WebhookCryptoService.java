package com.rng.embed.security;

import com.rng.common.exception.InternalServerException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Cryptographic service securing Discord incoming webhook URLs and tokens at rest
 * using AES-256-GCM with dynamic initialization vectors (IV).
 */
@Service
public class WebhookCryptoService {

    private static final String ALGORITHM = "AES/GCM/NoPadding";
    private static final int GCM_TAG_LENGTH = 128;
    private static final int IV_LENGTH = 12;

    // Discord Webhook URL pattern: https://discord.com/api/webhooks/{webhookId}/{webhookToken}
    private static final Pattern WEBHOOK_URL_PATTERN = Pattern.compile(
            "^https://(?:ptb\\.|canary\\.)?discord(?:app)?\\.com/api(?:/v10)?/webhooks/(\\d{17,20})/([A-Za-z0-9_-]{30,80})(?:[/?#].*)?$"
    );

    private final SecretKey secretKey;
    private final SecureRandom secureRandom = new SecureRandom();

    public WebhookCryptoService(@Value("${app.encryption.secret:rng_default_encryption_secret_32_bytes_long!}") String secret) {
        try {
            MessageDigest sha = MessageDigest.getInstance("SHA-256");
            byte[] keyBytes = sha.digest(secret.getBytes(StandardCharsets.UTF_8));
            this.secretKey = new SecretKeySpec(keyBytes, "AES");
        } catch (Exception e) {
            throw new InternalServerException("Failed to initialize AES-256-GCM webhook encryption key", e);
        }
    }

    /**
     * Parses Discord Webhook URL and extracts [webhookId, webhookToken].
     */
    public String[] parseAndValidateWebhookUrl(String webhookUrl) {
        if (webhookUrl == null || webhookUrl.isBlank()) {
            throw new IllegalArgumentException("Webhook URL cannot be blank.");
        }

        String clean = webhookUrl.trim();
        // SSRF guard against loopback and private metadata services
        if (clean.contains("localhost") || clean.contains("127.0.0.1") || clean.contains("169.254.169.254")) {
            throw new IllegalArgumentException("Target webhook hostname is disallowed under SSRF policy.");
        }

        Matcher matcher = WEBHOOK_URL_PATTERN.matcher(clean);
        if (!matcher.matches()) {
            throw new IllegalArgumentException("Invalid Discord webhook URL format. Must be an official discord.com webhook URL.");
        }

        return new String[]{matcher.group(1), matcher.group(2)};
    }

    /**
     * Encrypts plaintext webhook token with AES-256-GCM and a unique 12-byte IV.
     */
    public String encryptToken(String token) {
        if (token == null) return null;
        try {
            byte[] iv = new byte[IV_LENGTH];
            secureRandom.nextBytes(iv);

            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.ENCRYPT_MODE, secretKey, new GCMParameterSpec(GCM_TAG_LENGTH, iv));
            byte[] cipherText = cipher.doFinal(token.getBytes(StandardCharsets.UTF_8));

            ByteBuffer byteBuffer = ByteBuffer.allocate(iv.length + cipherText.length);
            byteBuffer.put(iv);
            byteBuffer.put(cipherText);

            return Base64.getEncoder().encodeToString(byteBuffer.array());
        } catch (Exception e) {
            throw new InternalServerException("Failed encrypting webhook token", e);
        }
    }

    /**
     * Decrypts Base64 encoded payload [12-byte IV + Ciphertext + Tag].
     */
    public String decryptToken(String encryptedBase64) {
        if (encryptedBase64 == null) return null;
        try {
            byte[] decoded = Base64.getDecoder().decode(encryptedBase64);
            ByteBuffer byteBuffer = ByteBuffer.wrap(decoded);

            byte[] iv = new byte[IV_LENGTH];
            byteBuffer.get(iv);

            byte[] cipherText = new byte[byteBuffer.remaining()];
            byteBuffer.get(cipherText);

            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.DECRYPT_MODE, secretKey, new GCMParameterSpec(GCM_TAG_LENGTH, iv));
            byte[] plainText = cipher.doFinal(cipherText);

            return new String(plainText, StandardCharsets.UTF_8);
        } catch (Exception e) {
            throw new InternalServerException("Failed decrypting webhook token", e);
        }
    }
}
