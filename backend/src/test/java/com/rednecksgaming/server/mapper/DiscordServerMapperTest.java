package com.rednecksgaming.server.mapper;

import com.rednecksgaming.server.domain.Server;
import com.rednecksgaming.server.dto.ChannelDto;
import com.rednecksgaming.server.dto.DiscordEmojiDto;
import com.rednecksgaming.server.dto.ServerDetailDto;
import com.rednecksgaming.server.dto.ServerDto;
import com.rednecksgaming.server.dto.discord.DiscordChannelDto;
import com.rednecksgaming.server.dto.discord.DiscordEmojiResponseDto;
import com.rednecksgaming.server.dto.discord.DiscordGuildDetailDto;
import net.dv8tion.jda.api.entities.channel.ChannelType;
import net.dv8tion.jda.api.entities.channel.concrete.Category;
import net.dv8tion.jda.api.entities.channel.concrete.TextChannel;
import net.dv8tion.jda.api.entities.channel.middleman.GuildChannel;
import net.dv8tion.jda.api.entities.emoji.RichCustomEmoji;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class DiscordServerMapperTest {

    private DiscordServerMapper mapper;

    @BeforeEach
    void setUp() {
        mapper = new DiscordServerMapper();
    }

    @Test
    @DisplayName("toChannelDto(DiscordChannelDto) should map fields and handle nulls")
    void testToChannelDtoFromDiscordChannelDto() {
        assertThat(mapper.toChannelDto((DiscordChannelDto) null)).isNull();

        DiscordChannelDto dto = DiscordChannelDto.builder()
                .id("ch_101")
                .name("general-chat")
                .type(0)
                .position(3)
                .parentId("cat_01")
                .build();

        ChannelDto mapped = mapper.toChannelDto(dto);
        assertThat(mapped).isNotNull();
        assertThat(mapped.getId()).isEqualTo("ch_101");
        assertThat(mapped.getName()).isEqualTo("general-chat");
        assertThat(mapped.getType()).isEqualTo(0);
        assertThat(mapped.getPosition()).isEqualTo(3);
        assertThat(mapped.getParentId()).isEqualTo("cat_01");

        // Null position defaults to 0
        DiscordChannelDto nullPosDto = DiscordChannelDto.builder()
                .id("ch_102")
                .name("lobby")
                .type(0)
                .position(null)
                .parentId(null)
                .build();
        ChannelDto mappedNullPos = mapper.toChannelDto(nullPosDto);
        assertThat(mappedNullPos.getPosition()).isZero();
        assertThat(mappedNullPos.getParentId()).isNull();
    }

    @Test
    @DisplayName("toChannelDto(GuildChannel) should extract position and parent category")
    void testToChannelDtoFromGuildChannel() {
        assertThat(mapper.toChannelDto((GuildChannel) null)).isNull();

        TextChannel textChannel = mock(TextChannel.class);
        Category category = mock(Category.class);

        when(textChannel.getId()).thenReturn("ch_201");
        when(textChannel.getName()).thenReturn("announcements");
        when(textChannel.getType()).thenReturn(ChannelType.TEXT);
        when(textChannel.getPosition()).thenReturn(5);
        when(textChannel.getParentCategory()).thenReturn(category);
        when(category.getId()).thenReturn("cat_999");

        ChannelDto mapped = mapper.toChannelDto((GuildChannel) textChannel);
        assertThat(mapped).isNotNull();
        assertThat(mapped.getId()).isEqualTo("ch_201");
        assertThat(mapped.getName()).isEqualTo("announcements");
        assertThat(mapped.getType()).isEqualTo(ChannelType.TEXT.getId());
        assertThat(mapped.getPosition()).isEqualTo(5);
        assertThat(mapped.getParentId()).isEqualTo("cat_999");
    }

    @Test
    @DisplayName("toDiscordEmojiDto(DiscordEmojiResponseDto) should map static and animated emojis")
    void testToDiscordEmojiDtoFromResponseDto() {
        assertThat(mapper.toDiscordEmojiDto((DiscordEmojiResponseDto) null)).isNull();

        DiscordEmojiResponseDto staticEmoji = new DiscordEmojiResponseDto("111222", "pepe_smile", false, true, true);
        DiscordEmojiDto mappedStatic = mapper.toDiscordEmojiDto(staticEmoji);
        assertThat(mappedStatic).isNotNull();
        assertThat(mappedStatic.id()).isEqualTo("111222");
        assertThat(mappedStatic.name()).isEqualTo("pepe_smile");
        assertThat(mappedStatic.animated()).isFalse();
        assertThat(mappedStatic.url()).isEqualTo("https://cdn.discordapp.com/emojis/111222.webp?size=64");
        assertThat(mappedStatic.formatted()).isEqualTo("<:pepe_smile:111222>");

        DiscordEmojiResponseDto animEmoji = new DiscordEmojiResponseDto("333444", "party_blob", true, true, true);
        DiscordEmojiDto mappedAnim = mapper.toDiscordEmojiDto(animEmoji);
        assertThat(mappedAnim).isNotNull();
        assertThat(mappedAnim.animated()).isTrue();
        assertThat(mappedAnim.url()).isEqualTo("https://cdn.discordapp.com/emojis/333444.gif?size=64");
        assertThat(mappedAnim.formatted()).isEqualTo("<a:party_blob:333444>");
    }

    @Test
    @DisplayName("toDiscordEmojiDto(RichCustomEmoji) should map JDA rich emoji")
    void testToDiscordEmojiDtoFromRichCustomEmoji() {
        assertThat(mapper.toDiscordEmojiDto((RichCustomEmoji) null)).isNull();

        RichCustomEmoji emoji = mock(RichCustomEmoji.class);
        when(emoji.getId()).thenReturn("777888");
        when(emoji.getName()).thenReturn("custom_badge");
        when(emoji.isAnimated()).thenReturn(false);

        DiscordEmojiDto mapped = mapper.toDiscordEmojiDto(emoji);
        assertThat(mapped).isNotNull();
        assertThat(mapped.id()).isEqualTo("777888");
        assertThat(mapped.name()).isEqualTo("custom_badge");
        assertThat(mapped.animated()).isFalse();
    }

    @Test
    @DisplayName("toServerDetailDto should map all fields correctly")
    void testToServerDetailDto() {
        Server server = Server.builder()
                .id("srv_001")
                .slug("rng-main")
                .name("RNG Main")
                .build();

        DiscordGuildDetailDto details = DiscordGuildDetailDto.builder()
                .id("srv_001")
                .name("RNG Main Server")
                .description("Official Server")
                .icon("icon_hash_123")
                .banner("a_banner_hash_456")
                .features(List.of("COMMUNITY", "WELCOME_SCREEN_ENABLED"))
                .afkChannelId("afk_01")
                .afkTimeout(300)
                .systemChannelId("sys_01")
                .defaultMessageNotifications(0)
                .vanityUrlCode("rng")
                .widgetEnabled(true)
                .widgetChannelId("wid_01")
                .build();

        ServerDetailDto detailDto = mapper.toServerDetailDto(
                server,
                details,
                150,
                500,
                3,
                14,
                true,
                false,
                true,
                false
        );

        assertThat(detailDto).isNotNull();
        assertThat(detailDto.getId()).isEqualTo("srv_001");
        assertThat(detailDto.getSlug()).isEqualTo("rng-main");
        assertThat(detailDto.getName()).isEqualTo("RNG Main Server");
        assertThat(detailDto.getDescription()).isEqualTo("Official Server");
        assertThat(detailDto.getIconUrl()).isEqualTo("https://cdn.discordapp.com/icons/srv_001/icon_hash_123.png");
        assertThat(detailDto.getBannerUrl()).isEqualTo("https://cdn.discordapp.com/banners/srv_001/a_banner_hash_456.gif");
        assertThat(detailDto.getOnlineCount()).isEqualTo(150);
        assertThat(detailDto.getTotalCount()).isEqualTo(500);
        assertThat(detailDto.getBoostLevel()).isEqualTo(3);
        assertThat(detailDto.getBoostCount()).isEqualTo(14);
        assertThat(detailDto.getFeatures()).containsExactly("COMMUNITY", "WELCOME_SCREEN_ENABLED");
        assertThat(detailDto.getAfkChannelId()).isEqualTo("afk_01");
        assertThat(detailDto.getAfkTimeout()).isEqualTo(300);
        assertThat(detailDto.getSystemChannelId()).isEqualTo("sys_01");
        assertThat(detailDto.getSendWelcome()).isTrue();
        assertThat(detailDto.getStickerPrompt()).isFalse();
        assertThat(detailDto.getBoostMessage()).isTrue();
        assertThat(detailDto.getSetupTips()).isFalse();
        assertThat(detailDto.getDefaultMessageNotifications()).isZero();
        assertThat(detailDto.getVanityUrl()).isEqualTo("rng");
        assertThat(detailDto.getWidgetEnabled()).isTrue();
        assertThat(detailDto.getWidgetChannelId()).isEqualTo("wid_01");
    }

    @Test
    @DisplayName("toServerDto should map fields with operational status")
    void testToServerDto() {
        Server server = Server.builder()
                .id("srv_002")
                .slug("rng-war")
                .name("Ministry of War")
                .build();

        ServerDto dto = mapper.toServerDto(
                server,
                "Ministry of War",
                "https://cdn.discordapp.com/icons/srv_002/icon.png",
                "https://cdn.discordapp.com/banners/srv_002/banner.png",
                80,
                220,
                2,
                7
        );

        assertThat(dto).isNotNull();
        assertThat(dto.getId()).isEqualTo("srv_002");
        assertThat(dto.getSlug()).isEqualTo("rng-war");
        assertThat(dto.getName()).isEqualTo("Ministry of War");
        assertThat(dto.getIconUrl()).isEqualTo("https://cdn.discordapp.com/icons/srv_002/icon.png");
        assertThat(dto.getBannerUrl()).isEqualTo("https://cdn.discordapp.com/banners/srv_002/banner.png");
        assertThat(dto.getOnlineCount()).isEqualTo(80);
        assertThat(dto.getTotalCount()).isEqualTo(220);
        assertThat(dto.getBoostLevel()).isEqualTo(2);
        assertThat(dto.getBoostCount()).isEqualTo(7);
        assertThat(dto.getStatus()).isEqualTo("operational");
    }

    @Test
    @DisplayName("formatDiscordIconUrl should handle null, png, and animated gif")
    void testFormatDiscordIconUrl() {
        assertThat(mapper.formatDiscordIconUrl(null, "hash")).isNull();
        assertThat(mapper.formatDiscordIconUrl("guild_1", null)).isNull();
        assertThat(mapper.formatDiscordIconUrl("guild_1", "static_hash"))
                .isEqualTo("https://cdn.discordapp.com/icons/guild_1/static_hash.png");
        assertThat(mapper.formatDiscordIconUrl("guild_1", "a_animated_hash"))
                .isEqualTo("https://cdn.discordapp.com/icons/guild_1/a_animated_hash.gif");
    }

    @Test
    @DisplayName("formatDiscordBannerUrl should handle null, png, and animated gif")
    void testFormatDiscordBannerUrl() {
        assertThat(mapper.formatDiscordBannerUrl(null, "hash")).isNull();
        assertThat(mapper.formatDiscordBannerUrl("guild_1", null)).isNull();
        assertThat(mapper.formatDiscordBannerUrl("guild_1", "banner_static"))
                .isEqualTo("https://cdn.discordapp.com/banners/guild_1/banner_static.png");
        assertThat(mapper.formatDiscordBannerUrl("guild_1", "a_banner_anim"))
                .isEqualTo("https://cdn.discordapp.com/banners/guild_1/a_banner_anim.gif");
    }

    @Test
    @DisplayName("toServerDetailDto and toServerDto should handle null inputs defensively")
    void testDefensiveNullChecks() {
        assertThat(mapper.toServerDetailDto(null, (DiscordGuildDetailDto) null, 0, 0, 0, 0, false, false, false, false)).isNull();
        assertThat(mapper.toServerDetailDto(null, (net.dv8tion.jda.api.entities.Guild) null, 0, 0)).isNull();
        assertThat(mapper.toServerDto(null, "name", "icon", "banner", 0, 0, 0, 0)).isNull();
    }

    @Test
    @DisplayName("toServerDetailDto(Server, Guild, online, total) should map JDA guild accurately")
    void testToServerDetailDtoFromJdaGuild() {
        Server server = Server.builder().id("srv_jda").slug("jda-server").name("JDA Server").build();
        net.dv8tion.jda.api.entities.Guild guild = mock(net.dv8tion.jda.api.entities.Guild.class);
        when(guild.getName()).thenReturn("JDA Server Name");
        when(guild.getDescription()).thenReturn("JDA Description");
        when(guild.getIconUrl()).thenReturn("https://cdn.discordapp.com/icons/srv_jda/icon.png");
        when(guild.getBannerUrl()).thenReturn("https://cdn.discordapp.com/banners/srv_jda/banner.png");
        when(guild.getBoostTier()).thenReturn(net.dv8tion.jda.api.entities.Guild.BoostTier.TIER_2);
        when(guild.getBoostCount()).thenReturn(8);
        when(guild.getFeatures()).thenReturn(java.util.Set.of("ANIMATED_ICON"));
        when(guild.getVanityCode()).thenReturn("jda-vanity");
        when(guild.getDefaultNotificationLevel()).thenReturn(net.dv8tion.jda.api.entities.Guild.NotificationLevel.MENTIONS_ONLY);

        ServerDetailDto dto = mapper.toServerDetailDto(server, guild, 50, 200);

        assertThat(dto).isNotNull();
        assertThat(dto.getId()).isEqualTo("srv_jda");
        assertThat(dto.getSlug()).isEqualTo("jda-server");
        assertThat(dto.getName()).isEqualTo("JDA Server Name");
        assertThat(dto.getOnlineCount()).isEqualTo(50);
        assertThat(dto.getTotalCount()).isEqualTo(200);
        assertThat(dto.getBoostLevel()).isEqualTo(2);
        assertThat(dto.getBoostCount()).isEqualTo(8);
        assertThat(dto.getVanityUrl()).isEqualTo("jda-vanity");
        assertThat(dto.getSendWelcome()).isTrue();
    }
}
