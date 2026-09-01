package com.rng.common;

import com.rng.common.dto.ApiResponse;
import com.rng.common.dto.DiscordUserDto;
import com.rng.common.exception.*;
import com.rng.common.security.SecurityConstants;
import com.rng.identity.domain.AuthProvider;
import com.rng.identity.domain.User;
import com.rng.identity.dto.*;
import com.rng.security.oauth2.CustomOAuth2User;
import com.rng.server.domain.Server;
import com.rng.server.dto.*;
import com.rng.server.dto.discord.*;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class DomainAndDtoUnitTest {

    @Test
    @DisplayName("User entity helper methods, builders, and getters operate correctly")
    void userEntity_helpers() {
        LocalDateTime now = LocalDateTime.now();
        User user = User.builder()
                .id(1L)
                .email("user@rng.com")
                .fullName("Full Name")
                .provider(AuthProvider.EMAIL)
                .password("hash")
                .googleId("google-123")
                .role("ROLE_HIGH_COMMAND")
                .designations("Supreme, Ministry of Tech")
                .roles("Chief High Command, Lead Architect")
                .discordId("123456789")
                .discordUsername("discord_user")
                .discordAvatar("avatar_hash")
                .discordLinked(true)
                .status("ACTIVE")
                .createdAt(now)
                .updatedAt(now)
                .build();

        assertThat(user.getId()).isEqualTo(1L);
        assertThat(user.getEmail()).isEqualTo("user@rng.com");
        assertThat(user.getFullName()).isEqualTo("Full Name");
        assertThat(user.getProvider()).isEqualTo(AuthProvider.EMAIL);
        assertThat(user.getPassword()).isEqualTo("hash");
        assertThat(user.getGoogleId()).isEqualTo("google-123");
        assertThat(user.getRole()).isEqualTo("ROLE_HIGH_COMMAND");
        assertThat(user.getDesignations()).isEqualTo("Supreme, Ministry of Tech");
        assertThat(user.getRoles()).isEqualTo("Chief High Command, Lead Architect");
        assertThat(user.getDiscordId()).isEqualTo("123456789");
        assertThat(user.getDiscordUsername()).isEqualTo("discord_user");
        assertThat(user.getDiscordAvatar()).isEqualTo("avatar_hash");
        assertThat(user.isDiscordLinked()).isTrue();
        assertThat(user.getStatus()).isEqualTo("ACTIVE");
        assertThat(user.getCreatedAt()).isEqualTo(now);
        assertThat(user.getUpdatedAt()).isEqualTo(now);

        assertThat(user.getDesignationList()).containsExactly("Supreme", "Ministry of Tech");
        assertThat(user.getRoleList()).containsExactly("Chief High Command", "Lead Architect");

        User emptyUser = new User();
        emptyUser.setDesignations(null);
        emptyUser.setRoles(null);
        assertThat(emptyUser.getDesignationList()).isEmpty();
        assertThat(emptyUser.getRoleList()).isEmpty();

        emptyUser.setDesignations("   ");
        emptyUser.setRoles("   ");
        assertThat(emptyUser.getDesignationList()).isEmpty();
        assertThat(emptyUser.getRoleList()).isEmpty();
    }

    @Test
    @DisplayName("Server entity getters and setters operate correctly")
    void serverEntity_helpers() {
        LocalDateTime now = LocalDateTime.now();
        Server server = Server.builder()
                .id("100200300")
                .name("RNG HQ")
                .slug("rng-hq")
                .iconHash("icon_hash")
                .bannerHash("banner_hash")
                .createdAt(now)
                .updatedAt(now)
                .build();

        assertThat(server.getId()).isEqualTo("100200300");
        assertThat(server.getSlug()).isEqualTo("rng-hq");
        assertThat(server.getName()).isEqualTo("RNG HQ");
        assertThat(server.getIconHash()).isEqualTo("icon_hash");
        assertThat(server.getBannerHash()).isEqualTo("banner_hash");
        assertThat(server.getCreatedAt()).isEqualTo(now);
        assertThat(server.getUpdatedAt()).isEqualTo(now);

        Server noArgServer = new Server();
        noArgServer.setId("200");
        noArgServer.setName("Server 200");
        noArgServer.setSlug("server-200");
        assertThat(noArgServer.getId()).isEqualTo("200");
        assertThat(noArgServer.getName()).isEqualTo("Server 200");
    }

    @Test
    @DisplayName("ApiResponse factory methods construct envelopes properly")
    void apiResponse_factories() {
        ApiResponse<String> success1 = ApiResponse.success("payload");
        assertThat(success1.isSuccess()).isTrue();
        assertThat(success1.getData()).isEqualTo("payload");
        assertThat(success1.getMessage()).isEqualTo("Operation successful");

        ApiResponse<String> success2 = ApiResponse.success("payload", "Custom Success");
        assertThat(success2.isSuccess()).isTrue();
        assertThat(success2.getData()).isEqualTo("payload");
        assertThat(success2.getMessage()).isEqualTo("Custom Success");

        ApiResponse<Void> err1 = ApiResponse.error("Custom Error");
        assertThat(err1.isSuccess()).isFalse();
        assertThat(err1.getMessage()).isEqualTo("Custom Error");
        assertThat(err1.getData()).isNull();

        ApiResponse<Void> err2 = ApiResponse.error("Error", "Detail error");
        assertThat(err2.isSuccess()).isFalse();
        assertThat(err2.getMessage()).isEqualTo("Error");
    }

    @Test
    @DisplayName("Custom exceptions construct with expected status and messages")
    void customExceptions_constructors() {
        assertThat(new BadCredentialsException("Bad Credentials").getMessage()).isEqualTo("Bad Credentials");
        assertThat(new ConflictException("Conflict").getMessage()).isEqualTo("Conflict");
        assertThat(new ForbiddenException("Forbidden").getMessage()).isEqualTo("Forbidden");
        assertThat(new ResourceNotFoundException("Not Found").getMessage()).isEqualTo("Not Found");
        assertThat(new ServiceUnavailableException("Outage").getMessage()).isEqualTo("Outage");
        assertThat(new UnauthorizedException("Unauthorized").getMessage()).isEqualTo("Unauthorized");
    }

    @Test
    @DisplayName("CustomOAuth2User implements OAuth2User interface methods properly")
    void customOAuth2User_methods() {
        User user = User.builder().id(50L).email("oauth@rng.com").role("ROLE_HIGH_COMMAND").build();
        Map<String, Object> attrs = Map.of("sub", "google-sub-50", "email", "oauth@rng.com");
        CustomOAuth2User customOAuth2User = new CustomOAuth2User(user, attrs);

        assertThat(customOAuth2User.getUser()).isEqualTo(user);
        assertThat(customOAuth2User.getName()).isEqualTo("50");
        assertThat(customOAuth2User.getEmail()).isEqualTo("oauth@rng.com");
        assertThat(customOAuth2User.getAttributes()).isEqualTo(attrs);
        assertThat(customOAuth2User.getAuthorities()).hasSize(1);
        assertThat(customOAuth2User.getAuthorities().iterator().next().getAuthority()).isEqualTo("ROLE_HIGH_COMMAND");
    }

    @Test
    @DisplayName("AuthProvider enum values and valueOf operate correctly")
    void authProvider_enum() {
        assertThat(AuthProvider.valueOf("EMAIL")).isEqualTo(AuthProvider.EMAIL);
        assertThat(AuthProvider.valueOf("GOOGLE")).isEqualTo(AuthProvider.GOOGLE);
        assertThat(AuthProvider.valueOf("DISCORD")).isEqualTo(AuthProvider.DISCORD);
        assertThat(AuthProvider.values()).containsExactly(AuthProvider.EMAIL, AuthProvider.GOOGLE, AuthProvider.DISCORD);
    }

    @Test
    @DisplayName("SecurityConstants class verifies header names, token types, and scopes")
    void securityConstants_constants() {
        assertThat(SecurityConstants.AUTHORIZATION_HEADER).isEqualTo("Authorization");
        assertThat(SecurityConstants.TOKEN_TYPE_HEADER).isEqualTo("Bearer ");
        assertThat(SecurityConstants.SCOPE_PRE_2FA).isEqualTo("SCOPE_PRE_2FA");
        assertThat(SecurityConstants.SCOPE_FULLY_AUTHENTICATED).isEqualTo("SCOPE_FULLY_AUTHENTICATED");
        assertThat(SecurityConstants.SCOPE_RESET_REQUEST).isEqualTo("SCOPE_RESET_REQUEST");
        assertThat(SecurityConstants.SCOPE_RESET_PASSWORD).isEqualTo("SCOPE_RESET_PASSWORD");
        assertThat(SecurityConstants.REFRESH_TOKEN_COOKIE_NAME).isEqualTo("rng_refresh_token");
        assertThat(SecurityConstants.ACCESS_TOKEN_EXPIRATION_MS).isEqualTo(15 * 60 * 1000L);
        assertThat(SecurityConstants.REFRESH_TOKEN_EXPIRATION_MS).isEqualTo(7 * 24 * 60 * 60 * 1000L);
    }

    @Test
    @DisplayName("DTO records and models construct and map fields properly")
    void dtos_models_construct() {
        DiscordUserDto discordUser = new DiscordUserDto("id", "username", "avatar", "email@discord.com");
        assertThat(discordUser.getId()).isEqualTo("id");
        assertThat(discordUser.getUsername()).isEqualTo("username");
        assertThat(discordUser.getAvatar()).isEqualTo("avatar");
        assertThat(discordUser.getEmail()).isEqualTo("email@discord.com");

        DiscordUserDto noArgDiscordUser = new DiscordUserDto();
        noArgDiscordUser.setId("id2");
        noArgDiscordUser.setUsername("user2");
        assertThat(noArgDiscordUser.getId()).isEqualTo("id2");

        AuthResponse auth = AuthResponse.builder().accessToken("jwt").tokenType("Bearer").expiresIn(900L).userEmail("a@b.com").role("ROLE_USER").build();
        assertThat(auth.getAccessToken()).isEqualTo("jwt");
        assertThat(auth.getTokenType()).isEqualTo("Bearer");
        assertThat(auth.getExpiresIn()).isEqualTo(900L);
        assertThat(auth.getUserEmail()).isEqualTo("a@b.com");
        assertThat(auth.getRole()).isEqualTo("ROLE_USER");

        Discord2FaRequest d2fa = new Discord2FaRequest("code-123");
        assertThat(d2fa.getCode()).isEqualTo("code-123");
        Discord2FaRequest emptyD2fa = new Discord2FaRequest();
        emptyD2fa.setCode("code-456");
        assertThat(emptyD2fa.getCode()).isEqualTo("code-456");

        ForgotPasswordInitiateRequest initReq = new ForgotPasswordInitiateRequest("test@rng.com");
        assertThat(initReq.getEmail()).isEqualTo("test@rng.com");
        ForgotPasswordInitiateRequest emptyInitReq = new ForgotPasswordInitiateRequest();
        emptyInitReq.setEmail("test2@rng.com");
        assertThat(emptyInitReq.getEmail()).isEqualTo("test2@rng.com");

        ForgotPasswordInitiateResponse initRes = ForgotPasswordInitiateResponse.builder().discordAuthUrl("https://discord.com/auth").build();
        assertThat(initRes.getDiscordAuthUrl()).isEqualTo("https://discord.com/auth");

        ForgotPasswordVerifyRequest verReq = new ForgotPasswordVerifyRequest("code", "state");
        assertThat(verReq.getCode()).isEqualTo("code");
        assertThat(verReq.getState()).isEqualTo("state");

        ForgotPasswordVerifyResponse verRes = ForgotPasswordVerifyResponse.builder().resetToken("rst").email("u@rng.com").build();
        assertThat(verRes.getResetToken()).isEqualTo("rst");
        assertThat(verRes.getEmail()).isEqualTo("u@rng.com");

        LoginRequest login = new LoginRequest("email", "password");
        assertThat(login.getEmail()).isEqualTo("email");
        assertThat(login.getPassword()).isEqualTo("password");

        Pre2FaResponse pre2Fa = Pre2FaResponse.builder().token("tkn").requiresDiscord2Fa(true).discordLinked(false).userEmail("e@rng.com").build();
        assertThat(pre2Fa.getToken()).isEqualTo("tkn");
        assertThat(pre2Fa.isRequiresDiscord2Fa()).isTrue();
        assertThat(pre2Fa.isDiscordLinked()).isFalse();
        assertThat(pre2Fa.getUserEmail()).isEqualTo("e@rng.com");

        ResetPasswordRequest resetReq = new ResetPasswordRequest("NewSecret123!");
        assertThat(resetReq.getNewPassword()).isEqualTo("NewSecret123!");

        UpdateWhitelistedUserRequest updateReq = UpdateWhitelistedUserRequest.builder().userName("Name").designations(List.of("Tech")).roles(List.of("Dev")).build();
        assertThat(updateReq.getUserName()).isEqualTo("Name");
        assertThat(updateReq.getDesignations()).contains("Tech");
        assertThat(updateReq.getRoles()).contains("Dev");

        UserResponse userRes = UserResponse.builder().id(10L).email("u@rng.com").fullName("User Name").provider("EMAIL").discordId("123").discordUsername("u").discordAvatar("a").discordLinked(true).role("ROLE_USER").designations("Tech").roles("Dev").designationList(List.of("Tech")).roleList(List.of("Dev")).status("ACTIVE").build();
        assertThat(userRes.getId()).isEqualTo(10L);
        assertThat(userRes.getEmail()).isEqualTo("u@rng.com");

        WhitelistUserRequest wlReq = WhitelistUserRequest.builder().email("new@rng.com").userName("New User").provider(AuthProvider.EMAIL).designations(List.of("Tech")).roles(List.of("Dev")).build();
        assertThat(wlReq.getEmail()).isEqualTo("new@rng.com");

        WhitelistedUserDto wlDto = WhitelistedUserDto.builder().id(5L).email("wl@rng.com").userName("WL User").provider("EMAIL").role("ROLE_USER").designations(List.of("Tech")).roles(List.of("Dev")).discordId("123").discordUsername("wl").discordAvatar("a").discordLinked(true).status("ACTIVE").createdAt(LocalDateTime.now()).updatedAt(LocalDateTime.now()).build();
        assertThat(wlDto.getId()).isEqualTo(5L);

        ChannelDto channel = ChannelDto.builder().id("c1").name("general").type(0).position(1).parentId(null).build();
        assertThat(channel.getName()).isEqualTo("general");

        ServerDetailDto detail = ServerDetailDto.builder().id("g1").name("Guild").slug("guild").boostLevel(1).build();
        assertThat(detail.getBoostLevel()).isEqualTo(1);

        ServerDto serverDto = ServerDto.builder().id("g1").name("Server").slug("srv").iconUrl("icon").bannerUrl("banner").memberCount(100).presenceCount(50).build();
        assertThat(serverDto.getId()).isEqualTo("g1");

        UpdateServerSettingsRequest srvReq = UpdateServerSettingsRequest.builder().name("New Name").icon("icon").banner("banner").vanityUrl("vanity").widgetEnabled(true).widgetChannelId("c1").sendWelcome(true).boostMessage(false).setupTips(true).stickerPrompt(false).build();
        assertThat(srvReq.getName()).isEqualTo("New Name");

        DiscordChannelDto dChan = DiscordChannelDto.builder().id("c1").name("chan").type(0).position(1).parentId(null).build();
        assertThat(dChan.getId()).isEqualTo("c1");

        DiscordGuildDetailDto dGuildDet = DiscordGuildDetailDto.builder().id("g1").name("Guild Det").icon("icon").banner("banner").premiumTier(2).premiumSubscriptionCount(7).vanityUrlCode("van").systemChannelFlags(0).features(List.of("VANITY_URL")).build();
        assertThat(dGuildDet.getPremiumTier()).isEqualTo(2);

        DiscordGuildDto dGuild = DiscordGuildDto.builder().id("g1").name("Guild").icon("icon").banner("banner").approximateMemberCount(100).approximatePresenceCount(20).build();
        assertThat(dGuild.getApproximateMemberCount()).isEqualTo(100);

        DiscordGuildPatchRequest dPatch = DiscordGuildPatchRequest.builder().name("Patched").icon("icon").banner("banner").systemChannelFlags(1).build();
        assertThat(dPatch.getName()).isEqualTo("Patched");
    }
}
