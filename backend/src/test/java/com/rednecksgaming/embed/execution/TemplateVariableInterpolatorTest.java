package com.rednecksgaming.embed.execution;

import net.dv8tion.jda.api.entities.Guild;
import net.dv8tion.jda.api.entities.Member;
import net.dv8tion.jda.api.entities.Role;
import net.dv8tion.jda.api.entities.User;
import net.dv8tion.jda.api.entities.channel.concrete.PrivateChannel;
import net.dv8tion.jda.api.entities.channel.concrete.TextChannel;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TemplateVariableInterpolatorTest {

    private TemplateVariableInterpolator interpolator;

    @Mock
    private Guild guild;

    @Mock
    private Member operator;

    @Mock
    private Member targetMember;

    @Mock
    private Role targetRole;

    @Mock
    private TextChannel textChannel;

    @Mock
    private PrivateChannel privateChannel;

    @Mock
    private User operatorUser;

    @Mock
    private User targetUser;

    @BeforeEach
    void setUp() {
        interpolator = new TemplateVariableInterpolator();
    }

    @Test
    @DisplayName("resolveTicketChannelName: returns default ticket name when prefix is null or blank")
    void resolveTicketChannelName_nullOrBlankPrefix() {
        assertThat(interpolator.resolveTicketChannelName(null, "abc123", operator, targetMember))
                .isEqualTo("ticket-abc123");
        assertThat(interpolator.resolveTicketChannelName("", "abc123", operator, targetMember))
                .isEqualTo("ticket-abc123");
        assertThat(interpolator.resolveTicketChannelName("   ", "abc123", operator, targetMember))
                .isEqualTo("ticket-abc123");
    }

    @Test
    @DisplayName("resolveTicketChannelName: substitutes all hex code tags")
    void resolveTicketChannelName_hexTags() {
        assertThat(interpolator.resolveTicketChannelName("support-{hexCode}", "99aacc", null, null))
                .isEqualTo("support-99aacc");
        assertThat(interpolator.resolveTicketChannelName("support-{hexcode}", "99aacc", null, null))
                .isEqualTo("support-99aacc");
        assertThat(interpolator.resolveTicketChannelName("support-{ticketId}", "99aacc", null, null))
                .isEqualTo("support-99aacc");
        assertThat(interpolator.resolveTicketChannelName("support-{ticketid}", "99aacc", null, null))
                .isEqualTo("support-99aacc");
        assertThat(interpolator.resolveTicketChannelName("support-{id}", "99aacc", null, null))
                .isEqualTo("support-99aacc");
    }

    @Test
    @DisplayName("resolveTicketChannelName: appends ticketId when prefix ends with hyphen without tag")
    void resolveTicketChannelName_endsWithHyphen() {
        assertThat(interpolator.resolveTicketChannelName("modmail-", "xyz789", null, null))
                .isEqualTo("modmail-xyz789");
    }

    @Test
    @DisplayName("resolveTicketChannelName: retains prefix without appending when no hyphen and no tag")
    void resolveTicketChannelName_noHyphenNoTag() {
        assertThat(interpolator.resolveTicketChannelName("support", "xyz789", null, null))
                .isEqualTo("support");
    }

    @Test
    @DisplayName("resolveTicketChannelName: sanitizes target and operator usernames in channel name")
    void resolveTicketChannelName_sanitizesUsernames() {
        when(targetMember.getUser()).thenReturn(targetUser);
        when(targetUser.getName()).thenReturn("Alice.Special!#_9");
        when(operator.getUser()).thenReturn(operatorUser);
        when(operatorUser.getName()).thenReturn("Bob@Staff!");

        String name = interpolator.resolveTicketChannelName("ticket-{targetUser}-{user}-{ticketId}", "123456", operator, targetMember);
        assertThat(name).isEqualTo("ticket-alicespecial_9-bobstaff-123456");

        String nameAlt = interpolator.resolveTicketChannelName("ticket-{target_user}-{username}-{ticketId}", "123456", operator, targetMember);
        assertThat(nameAlt).isEqualTo("ticket-alicespecial_9-bobstaff-123456");
    }

    @Test
    @DisplayName("resolveTicketChannelName: ignores target and operator when null or users have null names")
    void resolveTicketChannelName_nullUsersAndNames() {
        Member emptyMember = mock(Member.class);
        when(emptyMember.getUser()).thenReturn(null);

        String name = interpolator.resolveTicketChannelName("ticket-{targetUser}-{user}-{ticketId}", "123456", emptyMember, null);
        assertThat(name).isEqualTo("ticket-targetuser-user-123456");

        Member userWithNullName = mock(Member.class);
        User nullNameUser = mock(User.class);
        when(userWithNullName.getUser()).thenReturn(nullNameUser);
        when(nullNameUser.getName()).thenReturn(null);

        String name2 = interpolator.resolveTicketChannelName("ticket-{targetUser}-{user}-{ticketId}", "123456", null, userWithNullName);
        assertThat(name2).isEqualTo("ticket-targetuser-user-123456");
    }

    @Test
    @DisplayName("resolveTicketChannelName: collapses repeated hyphens and truncates to 100 chars")
    void resolveTicketChannelName_sanitizationAndTruncation() {
        String longPrefix = "a".repeat(120) + "---" + "{ticketId}";
        String name = interpolator.resolveTicketChannelName(longPrefix, "123", null, null);
        assertThat(name).hasSize(100);
        assertThat(name).doesNotContain("--");
    }

    @Test
    @DisplayName("buildTemplateVariables: delegates correctly using 6-arg overload detecting PrivateChannel")
    void buildTemplateVariables_sixArgOverload() {
        when(privateChannel.getId()).thenReturn("dm_123");
        when(targetRole.getName()).thenReturn("VIP");

        Map<String, String> dmVars = interpolator.buildTemplateVariables("t1", guild, operator, targetMember, targetRole, privateChannel);
        assertThat(dmVars.get("targetRole")).isEqualTo("@VIP");
        assertThat(dmVars.get("channel")).isEqualTo("<#dm_123>");

        when(textChannel.getId()).thenReturn("tc_456");
        when(targetRole.getAsMention()).thenReturn("<@&789>");
        Map<String, String> guildVars = interpolator.buildTemplateVariables("t2", guild, operator, targetMember, targetRole, textChannel);
        assertThat(guildVars.get("targetRole")).isEqualTo("<@&789>");
        assertThat(guildVars.get("channel")).isEqualTo("<#tc_456>");
    }

    @Test
    @DisplayName("buildTemplateVariables: handles fully populated objects with isDm=false and targetRole asMention")
    void buildTemplateVariables_fullyPopulatedGuild() {
        when(operator.getAsMention()).thenReturn("<@111>");
        when(operator.getUser()).thenReturn(operatorUser);
        when(operatorUser.getName()).thenReturn("OperatorOne");
        when(operator.getId()).thenReturn("111");

        when(targetMember.getAsMention()).thenReturn("<@222>");

        when(targetRole.getName()).thenReturn("Admin");
        when(targetRole.getAsMention()).thenReturn("<@&333>");

        when(guild.getName()).thenReturn("RNG HQ");
        when(textChannel.getId()).thenReturn("444");

        Map<String, String> vars = interpolator.buildTemplateVariables("ticket-555", guild, operator, targetMember, targetRole, textChannel, false);

        assertThat(vars.get("user")).isEqualTo("<@111>");
        assertThat(vars.get("username")).isEqualTo("OperatorOne");
        assertThat(vars.get("user_id")).isEqualTo("111");
        assertThat(vars.get("targetUser")).isEqualTo("<@222>");
        assertThat(vars.get("target_user")).isEqualTo("<@222>");
        assertThat(vars.get("targetRole")).isEqualTo("<@&333>");
        assertThat(vars.get("target_role")).isEqualTo("<@&333>");
        assertThat(vars.get("role")).isEqualTo("<@&333>");
        assertThat(vars.get("targetRoleName")).isEqualTo("Admin");
        assertThat(vars.get("target_role_name")).isEqualTo("Admin");
        assertThat(vars.get("role_name")).isEqualTo("Admin");
        assertThat(vars.get("server")).isEqualTo("RNG HQ");
        assertThat(vars.get("channel")).isEqualTo("<#444>");
        assertThat(vars.get("ticketId")).isEqualTo("ticket-555");
        assertThat(vars.get("ticketid")).isEqualTo("ticket-555");
        assertThat(vars.get("hexCode")).isEqualTo("ticket-555");
        assertThat(vars.get("hexcode")).isEqualTo("ticket-555");
        assertThat(vars.get("id")).isEqualTo("ticket-555");
    }

    @Test
    @DisplayName("buildTemplateVariables: handles role with null asMention in non-DM")
    void buildTemplateVariables_roleWithNullMention() {
        when(targetRole.getName()).thenReturn("Guest");
        when(targetRole.getAsMention()).thenReturn(null);

        Map<String, String> vars = interpolator.buildTemplateVariables(null, null, null, null, targetRole, null, false);
        assertThat(vars.get("targetRole")).isEqualTo("@Guest");
        assertThat(vars.get("role")).isEqualTo("@Guest");
        assertThat(vars.get("role_name")).isEqualTo("Guest");
        assertThat(vars.get("ticketId")).isNull();
    }

    @Test
    @DisplayName("buildTemplateVariables: handles null objects gracefully")
    void buildTemplateVariables_nullEntities() {
        Map<String, String> vars = interpolator.buildTemplateVariables(null, null, null, null, null, null, false);

        assertThat(vars.get("user")).isEmpty();
        assertThat(vars.get("username")).isEmpty();
        assertThat(vars.get("user_id")).isEmpty();
        assertThat(vars.get("targetUser")).isEmpty();
        assertThat(vars.get("target_user")).isEmpty();
        assertThat(vars.get("targetRole")).isEmpty();
        assertThat(vars.get("targetRoleName")).isEmpty();
        assertThat(vars.get("server")).isEmpty();
        assertThat(vars.get("channel")).isEmpty();
        assertThat(vars.containsKey("ticketId")).isFalse();
    }

    @Test
    @DisplayName("buildTemplateVariables: handles operator and target with null getters")
    void buildTemplateVariables_nullGetters() {
        Member partialOp = mock(Member.class);
        when(partialOp.getAsMention()).thenReturn(null);
        when(partialOp.getUser()).thenReturn(null);
        when(partialOp.getId()).thenReturn(null);

        Member partialTarget = mock(Member.class);
        when(partialTarget.getAsMention()).thenReturn(null);

        Role partialRole = mock(Role.class);
        when(partialRole.getName()).thenReturn(null);

        Guild partialGuild = mock(Guild.class);
        when(partialGuild.getName()).thenReturn(null);

        Map<String, String> vars = interpolator.buildTemplateVariables(null, partialGuild, partialOp, partialTarget, partialRole, null, true);

        assertThat(vars.get("user")).isEmpty();
        assertThat(vars.get("username")).isEmpty();
        assertThat(vars.get("user_id")).isEmpty();
        assertThat(vars.get("targetUser")).isEmpty();
        assertThat(vars.get("targetRole")).isEqualTo("@");
        assertThat(vars.get("role_name")).isEmpty();
        assertThat(vars.get("server")).isEmpty();
    }

    @Test
    @DisplayName("interpolate: delegates 7-arg overload to 8-arg overload with isDm flag")
    void interpolate_sevenArgOverload() {
        when(privateChannel.getId()).thenReturn("dm_1");
        when(targetRole.getName()).thenReturn("Helper");

        String result = interpolator.interpolate("Role is {role} in {channel}", guild, operator, targetMember, targetRole, privateChannel, "opt_1");
        assertThat(result).contains("@Helper");
        assertThat(result).contains("<#dm_1>");
    }

    @Test
    @DisplayName("interpolate: returns empty string when text is null or blank")
    void interpolate_nullOrBlankText() {
        assertThat(interpolator.interpolate(null, guild, operator, targetMember, targetRole, textChannel, null, false)).isEmpty();
        assertThat(interpolator.interpolate("", guild, operator, targetMember, targetRole, textChannel, null, false)).isEmpty();
        assertThat(interpolator.interpolate("   ", guild, operator, targetMember, targetRole, textChannel, null, false)).isEmpty();
    }

    @Test
    @DisplayName("interpolate: substitutes all tokens in text")
    void interpolate_allTokens() {
        when(operator.getAsMention()).thenReturn("<@user1>");
        when(operator.getUser()).thenReturn(operatorUser);
        when(operatorUser.getName()).thenReturn("Jane");
        when(operator.getId()).thenReturn("user1");

        when(guild.getName()).thenReturn("RNG Server");
        when(textChannel.getId()).thenReturn("chan123");

        when(targetMember.getAsMention()).thenReturn("<@target2>");
        when(targetMember.getUser()).thenReturn(targetUser);
        when(targetUser.getName()).thenReturn("TargetName");

        when(targetRole.getName()).thenReturn("Moderator");
        when(targetRole.getAsMention()).thenReturn("<@&mod_role>");

        String text = "User: {user} ({username}, {user_id}) from {server} in {channel}. "
                + "Target: {target_user} {targetUser} ({target_username}, {targetUsername}). "
                + "Role: {role} {target_role} {targetRole} ({role_name}, {targetRoleName}, {target_role_name}). "
                + "Selected: {selected_option}";

        String result = interpolator.interpolate(text, guild, operator, targetMember, targetRole, textChannel, "option_a", false);

        assertThat(result).contains("User: <@user1> (Jane, user1) from RNG Server in <#chan123>.");
        assertThat(result).contains("Target: <@target2> <@target2> (TargetName, TargetName).");
        assertThat(result).contains("Role: <@&mod_role> <@&mod_role> <@&mod_role> (Moderator, Moderator, Moderator).");
        assertThat(result).contains("Selected: option_a");
    }

    @Test
    @DisplayName("interpolate: substitutes DM role display when isDm is true")
    void interpolate_dmRoleDisplay() {
        when(targetRole.getName()).thenReturn("SupportAgent");

        String text = "Assigned {role} ({role_name})";
        String result = interpolator.interpolate(text, null, null, null, targetRole, null, null, true);

        assertThat(result).isEqualTo("Assigned @SupportAgent (SupportAgent)");
    }

    @Test
    @DisplayName("interpolate: substitutes role display when isDm is false and getAsMention is null")
    void interpolate_roleNullMentionNonDm() {
        when(targetRole.getName()).thenReturn("SupportAgent");
        when(targetRole.getAsMention()).thenReturn(null);

        String text = "Assigned {target_role}";
        String result = interpolator.interpolate(text, null, null, null, targetRole, null, null, false);

        assertThat(result).isEqualTo("Assigned @SupportAgent");
    }

    @Test
    @DisplayName("interpolate: handles null entities and null getter fields cleanly")
    void interpolate_nullSubEntities() {
        Member mockMember = mock(Member.class);
        when(mockMember.getAsMention()).thenReturn(null);
        when(mockMember.getUser()).thenReturn(null);
        when(mockMember.getId()).thenReturn(null);

        Guild mockGuild = mock(Guild.class);
        when(mockGuild.getName()).thenReturn(null);

        TextChannel mockChannel = mock(TextChannel.class);
        when(mockChannel.getId()).thenReturn(null);

        Member mockTarget = mock(Member.class);
        when(mockTarget.getAsMention()).thenReturn(null);
        when(mockTarget.getUser()).thenReturn(null);

        Role mockRole = mock(Role.class);
        when(mockRole.getName()).thenReturn(null);
        when(mockRole.getAsMention()).thenReturn(null);

        String text = "{user} {username} {user_id} {server} {channel} {target_user} {target_username} {role} {selected_option}";
        String result = interpolator.interpolate(text, mockGuild, mockMember, mockTarget, mockRole, mockChannel, null, false);

        assertThat(result).contains("{user}");
        assertThat(result).contains("{server}");
        assertThat(result).contains("{channel}");
        assertThat(result).contains("{target_user}");
        assertThat(result).contains("{selected_option}");
    }

    @Test
    @DisplayName("buildTemplateVariables: role mention fallback when getAsMention is null on non-DM")
    void buildTemplateVariables_roleMentionFallbackNonDm() {
        when(targetRole.getName()).thenReturn("Admin");
        when(targetRole.getAsMention()).thenReturn(null);

        Map<String, String> vars = interpolator.buildTemplateVariables("t_null_mention", guild, operator, targetMember, targetRole, textChannel, false);
        assertThat(vars.get("targetRole")).isEqualTo("@Admin");
        assertThat(vars.get("role")).isEqualTo("@Admin");

        // When ticketId is null
        Map<String, String> varsNoTicket = interpolator.buildTemplateVariables(null, guild, operator, targetMember, targetRole, textChannel, false);
        assertThat(varsNoTicket.containsKey("ticketId")).isFalse();
    }
}
