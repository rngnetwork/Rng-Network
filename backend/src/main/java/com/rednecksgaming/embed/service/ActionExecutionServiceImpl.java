package com.rednecksgaming.embed.service;

import com.rednecksgaming.embed.domain.EmbedAction;
import com.rednecksgaming.embed.dto.ActionExecutionResult;
import com.rednecksgaming.embed.execution.*;
import com.rednecksgaming.embed.repository.EmbedActionRepository;
import com.rednecksgaming.embed.repository.EmbedTemplateRepository;
import com.rednecksgaming.embed.repository.InteractionLogRepository;
import lombok.extern.slf4j.Slf4j;
import net.dv8tion.jda.api.entities.Guild;
import net.dv8tion.jda.api.entities.Member;
import net.dv8tion.jda.api.entities.Role;
import net.dv8tion.jda.api.entities.User;
import net.dv8tion.jda.api.entities.channel.concrete.TextChannel;
import net.dv8tion.jda.api.events.interaction.component.ButtonInteractionEvent;
import net.dv8tion.jda.api.events.interaction.component.StringSelectInteractionEvent;
import net.dv8tion.jda.api.interactions.InteractionHook;
import net.dv8tion.jda.api.utils.messages.MessageCreateData;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.util.Map;


@Slf4j
@Service
public class ActionExecutionServiceImpl implements ActionExecutionService {

    private final ActionExecutionRouter actionExecutionRouter;
    private final RoleActionExecutor roleActionExecutor;
    private final DmActionExecutor dmActionExecutor;

    public ActionExecutionServiceImpl(
            InteractionLogRepository interactionLogRepository,
            EmbedTemplateRepository embedTemplateRepository,
            EmbedActionRepository embedActionRepository,
            @Autowired(required = false) EmbedTemplateRenderer embedTemplateRenderer,
            @Autowired(required = false) StringRedisTemplate redisTemplate) {
        this(interactionLogRepository, embedTemplateRepository, embedActionRepository, embedTemplateRenderer, redisTemplate, null);
    }

    public ActionExecutionServiceImpl(
            InteractionLogRepository interactionLogRepository,
            EmbedTemplateRepository embedTemplateRepository,
            EmbedActionRepository embedActionRepository,
            @Autowired(required = false) EmbedTemplateRenderer embedTemplateRenderer,
            @Autowired(required = false) StringRedisTemplate redisTemplate,
            @Autowired(required = false) DiscordDispatchService discordDispatchService) {
        TemplateVariableInterpolator interpolator = new TemplateVariableInterpolator();
        RoleActionExecutor roleExecutor = new RoleActionExecutor(interactionLogRepository, embedTemplateRepository, interpolator, embedTemplateRenderer, discordDispatchService);
        DmActionExecutor dmExecutor = new DmActionExecutor(interactionLogRepository, embedTemplateRepository, interpolator, roleExecutor, embedTemplateRenderer, discordDispatchService);
        ReplyActionExecutor replyExecutor = new ReplyActionExecutor(interactionLogRepository, embedTemplateRepository, interpolator, roleExecutor, embedTemplateRenderer, discordDispatchService);
        TicketActionExecutor ticketExecutor = new TicketActionExecutor(interactionLogRepository, embedTemplateRepository, interpolator, roleExecutor, dmExecutor, replyExecutor, embedTemplateRenderer);
        CompoundActionExecutor compoundExecutor = new CompoundActionExecutor(embedActionRepository, embedTemplateRepository, interpolator, roleExecutor, dmExecutor, embedTemplateRenderer);
        this.actionExecutionRouter = new ActionExecutionRouter(embedActionRepository, interactionLogRepository, roleExecutor, ticketExecutor, replyExecutor, dmExecutor, compoundExecutor, redisTemplate);
        this.roleActionExecutor = roleExecutor;
        this.dmActionExecutor = dmExecutor;
    }

    @Autowired
    public ActionExecutionServiceImpl(
            ActionExecutionRouter actionExecutionRouter,
            RoleActionExecutor roleActionExecutor,
            DmActionExecutor dmActionExecutor) {
        this.actionExecutionRouter = actionExecutionRouter;
        this.roleActionExecutor = roleActionExecutor;
        this.dmActionExecutor = dmActionExecutor;
    }

    @Override
    public void executeButtonAction(ButtonInteractionEvent event, EmbedAction action, Map<String, String> sessionData) {
        actionExecutionRouter.executeButtonAction(event, action, sessionData);
    }

    @Override
    public void executeStringSelectAction(StringSelectInteractionEvent event, EmbedAction action, Map<String, String> sessionData) {
        actionExecutionRouter.executeStringSelectAction(event, action, sessionData);
    }

    @Override
    public ActionExecutionResult executeComponentAction(String actionId, Guild guild, Member operator, InteractionHook hook, Map<String, String> sessionData) {
        return actionExecutionRouter.executeComponentAction(actionId, guild, operator, hook, sessionData);
    }

    @Override
    public ActionExecutionResult executeCompoundAction(String actionId, Guild guild, Member operator, InteractionHook hook, Map<String, String> sessionData) {
        return actionExecutionRouter.executeCompoundAction(actionId, guild, operator, hook, sessionData);
    }

    @Override
    public boolean canOperatorAssignRole(Member operator, Role targetRole) {
        return roleActionExecutor.canOperatorAssignRole(operator, targetRole);
    }

    @Override
    public ActionExecutionResult dispatchDMLogsWithFallback(User user, TextChannel ticketChannel, MessageCreateData logData) {
        return dmActionExecutor.dispatchDMLogsWithFallback(user, ticketChannel, logData);
    }
}
