package com.rng.embed.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class WebhookCryptoServiceTest {

    private WebhookCryptoService cryptoService;

    @BeforeEach
    void setUp() {
        cryptoService = new WebhookCryptoService("test_secret_for_aes_256_gcm_must_be_strong!");
    }

    @Test
    @DisplayName("Parse valid Discord Webhook URL extracts ID and Token")
    void parseAndValidateWebhookUrl_valid() {
        String validUrl = "https://discord.com/api/webhooks/123456789012345678/abcdefghijklmnopqrstuvwxyz0123456789-_ABCDEF";
        String[] parts = cryptoService.parseAndValidateWebhookUrl(validUrl);

        assertThat(parts).hasSize(2);
        assertThat(parts[0]).isEqualTo("123456789012345678");
        assertThat(parts[1]).isEqualTo("abcdefghijklmnopqrstuvwxyz0123456789-_ABCDEF");
    }

    @Test
    @DisplayName("SSRF protection blocks localhost and metadata IP addresses")
    void parseAndValidateWebhookUrl_ssrfBlocked() {
        assertThatThrownBy(() -> cryptoService.parseAndValidateWebhookUrl("https://localhost/api/webhooks/123/token"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("SSRF policy");

        assertThatThrownBy(() -> cryptoService.parseAndValidateWebhookUrl("https://127.0.0.1/api/webhooks/123/token"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("SSRF policy");
    }

    @Test
    @DisplayName("AES-256-GCM encryption and decryption round-trip preserves secret token")
    void encryptAndDecryptToken_roundTrip() {
        String originalToken = "super_secret_discord_webhook_token_998877";
        String encrypted = cryptoService.encryptToken(originalToken);

        assertThat(encrypted).isNotNull();
        assertThat(encrypted).isNotEqualTo(originalToken);

        String decrypted = cryptoService.decryptToken(encrypted);
        assertThat(decrypted).isEqualTo(originalToken);
    }
}
