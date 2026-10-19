package com.rng.embed.service;

import com.rng.common.exception.ForbiddenException;
import com.rng.embed.domain.EmbedTemplate;
import com.rng.embed.dto.CreateTemplateRequest;
import com.rng.embed.dto.DryRunValidationResponse;
import com.rng.embed.dto.TemplateResponse;
import com.rng.embed.dto.UpdateTemplateRequest;
import com.rng.embed.repository.EmbedTemplateRepository;
import com.rng.identity.domain.User;
import com.rng.identity.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EmbedTemplateServiceTest {

    @Mock
    private EmbedTemplateRepository templateRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private PreFlightValidatorService validatorService;

    private EmbedTemplateService service;

    @BeforeEach
    void setUp() {
        service = new EmbedTemplateService(templateRepository, userRepository, validatorService);
    }

    @Test
    @DisplayName("Create template succeeds for authenticated operator")
    void createTemplate_success() {
        User operator = User.builder().id(1L).email("author@rng.com").fullName("Template Author").build();
        when(userRepository.findById(1L)).thenReturn(Optional.of(operator));

        when(validatorService.validate(anyString(), anyString(), anyMap()))
                .thenReturn(DryRunValidationResponse.builder().isValid(true).build());

        when(templateRepository.save(any(EmbedTemplate.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        CreateTemplateRequest request = new CreateTemplateRequest(
                "Welcome Card", "Initial welcome layout", "GENERAL", null, "guild_123", Map.of("flags", 32768), true
        );

        TemplateResponse response = service.createTemplate(1L, request);

        assertThat(response).isNotNull();
        assertThat(response.name()).isEqualTo("Welcome Card");
        assertThat(response.authorId()).isEqualTo("1");
        verify(templateRepository).save(any(EmbedTemplate.class));
    }

    @Test
    @DisplayName("Update template throws ForbiddenException for unauthorized non-author user")
    void updateTemplate_forbiddenForNonAuthor() {
        EmbedTemplate existing = EmbedTemplate.builder()
                .templateId("tmpl_123")
                .authorId("99") // Different author
                .build();
        when(templateRepository.findByTemplateId("tmpl_123")).thenReturn(Optional.of(existing));

        User intruder = User.builder().id(2L).email("intruder@rng.com").role("ROLE_USER").build();
        when(userRepository.findById(2L)).thenReturn(Optional.of(intruder));

        UpdateTemplateRequest updateReq = new UpdateTemplateRequest(
                "Hacked Card", "Description", "GENERAL", null, Map.of(), false
        );

        assertThatThrownBy(() -> service.updateTemplate(2L, "tmpl_123", updateReq))
                .isInstanceOf(ForbiddenException.class)
                .hasMessageContaining("Only the original template author or High Command");
    }

    @Test
    @DisplayName("Export template returns full JSON map")
    void exportTemplate_success() {
        EmbedTemplate template = EmbedTemplate.builder()
                .templateId("tmpl_export")
                .name("Raid Protocol")
                .payload(Map.of("flags", 32768))
                .build();
        when(templateRepository.findByTemplateId("tmpl_export")).thenReturn(Optional.of(template));

        Map<String, Object> exported = service.exportTemplate("tmpl_export");
        assertThat(exported.get("name")).isEqualTo("Raid Protocol");
        assertThat(exported).containsKey("exportedAt");
    }

    @Test
    @DisplayName("listTemplates delegates to repository with operator authorId")
    void listTemplates_delegatesWithAuthorId() {
        org.springframework.data.domain.Page<EmbedTemplate> emptyPage = new org.springframework.data.domain.PageImpl<>(java.util.List.of());
        when(templateRepository.findAccessibleTemplates(eq("guild_123"), eq("1"), any(org.springframework.data.domain.Pageable.class)))
                .thenReturn(emptyPage);

        var result = service.listTemplates(1L, "guild_123", null, org.springframework.data.domain.PageRequest.of(0, 10));
        assertThat(result).isNotNull();
        verify(templateRepository).findAccessibleTemplates(eq("guild_123"), eq("1"), any(org.springframework.data.domain.Pageable.class));
    }
}
