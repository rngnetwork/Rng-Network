package com.rednecksgaming.embed.service;

import com.rednecksgaming.common.exception.BadRequestException;
import com.rednecksgaming.common.exception.ForbiddenException;
import com.rednecksgaming.common.exception.ResourceNotFoundException;
import com.rednecksgaming.common.exception.UnauthorizedException;
import com.rednecksgaming.embed.domain.EmbedTemplate;
import com.rednecksgaming.embed.dto.CreateTemplateRequest;
import com.rednecksgaming.embed.dto.DryRunValidationResponse;
import com.rednecksgaming.embed.dto.TemplateResponse;
import com.rednecksgaming.embed.dto.UpdateTemplateRequest;
import com.rednecksgaming.embed.repository.EmbedTemplateRepository;
import com.rednecksgaming.identity.domain.User;
import com.rednecksgaming.identity.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
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
        lenient().when(validatorService.validate(anyString(), anyString(), anyMap()))
                .thenReturn(DryRunValidationResponse.builder()
                        .isValid(true)
                        .errors(List.of())
                        .warnings(List.of())
                        .permissions(new DryRunValidationResponse.BotPermissionCheck(true, true, true))
                        .build());
        service = new EmbedTemplateService(templateRepository, userRepository, validatorService);
    }

    @Test
    @DisplayName("listTemplates with serverId and category queries findAccessibleByServerAndCategory in lowercase")
    void listTemplates_serverAndCategory() {
        Pageable pageable = PageRequest.of(0, 10);
        when(templateRepository.findAccessibleByServerAndCategory(eq("guild_1"), eq("rules"), eq(pageable)))
                .thenReturn(new PageImpl<>(List.of()));

        Page<TemplateResponse> result = service.listTemplates(1L, "guild_1", "RULES", pageable);

        assertThat(result).isNotNull();
        verify(templateRepository).findAccessibleByServerAndCategory("guild_1", "rules", pageable);
    }

    @Test
    @DisplayName("listTemplates with serverId only queries findAccessibleByServer")
    void listTemplates_serverOnly() {
        Pageable pageable = PageRequest.of(0, 10);
        when(templateRepository.findAccessibleByServer(eq("guild_1"), eq(pageable)))
                .thenReturn(new PageImpl<>(List.of()));

        Page<TemplateResponse> result = service.listTemplates(1L, "guild_1", null, pageable);

        assertThat(result).isNotNull();
        verify(templateRepository).findAccessibleByServer("guild_1", pageable);
    }

    @Test
    @DisplayName("listTemplates with global serverId and category queries findGlobalAccessibleByCategory")
    void listTemplates_globalAndCategory() {
        Pageable pageable = PageRequest.of(0, 10);
        when(templateRepository.findGlobalAccessibleByCategory(eq("1"), eq("onboarding"), eq(pageable)))
                .thenReturn(new PageImpl<>(List.of()));

        Page<TemplateResponse> result = service.listTemplates(1L, "global", "Onboarding", pageable);

        assertThat(result).isNotNull();
        verify(templateRepository).findGlobalAccessibleByCategory("1", "onboarding", pageable);
    }

    @Test
    @DisplayName("listTemplates with null serverId queries findGlobalAccessible")
    void listTemplates_globalOnly() {
        Pageable pageable = PageRequest.of(0, 10);
        when(templateRepository.findGlobalAccessible(eq("1"), eq(pageable)))
                .thenReturn(new PageImpl<>(List.of()));

        Page<TemplateResponse> result = service.listTemplates(1L, null, null, pageable);

        assertThat(result).isNotNull();
        verify(templateRepository).findGlobalAccessible("1", pageable);
    }

    @Test
    @DisplayName("getTemplate returns response when found by templateId or id")
    void getTemplate_found() {
        EmbedTemplate tpl1 = EmbedTemplate.builder().templateId("tmpl_1").name("Template 1").build();
        when(templateRepository.findByTemplateId("tmpl_1")).thenReturn(Optional.of(tpl1));

        TemplateResponse res1 = service.getTemplate("tmpl_1");
        assertThat(res1.name()).isEqualTo("Template 1");

        EmbedTemplate tpl2 = EmbedTemplate.builder().id("mongo_2").templateId("tmpl_2").name("Template 2").build();
        when(templateRepository.findByTemplateId("mongo_2")).thenReturn(Optional.empty());
        when(templateRepository.findById("mongo_2")).thenReturn(Optional.of(tpl2));

        TemplateResponse res2 = service.getTemplate("mongo_2");
        assertThat(res2.name()).isEqualTo("Template 2");
    }

    @Test
    @DisplayName("getTemplate throws ResourceNotFoundException when not found")
    void getTemplate_notFoundThrows() {
        when(templateRepository.findByTemplateId("missing")).thenReturn(Optional.empty());
        when(templateRepository.findById("missing")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.getTemplate("missing"))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Embed template not found: missing");
    }

    @Test
    @DisplayName("createTemplate throws UnauthorizedException when operator is not found")
    void createTemplate_operatorNotFoundThrows() {
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        CreateTemplateRequest request = new CreateTemplateRequest(
                "Name", "Desc", "general", List.of(), null, Map.of(), false
        );

        assertThatThrownBy(() -> service.createTemplate(999L, request))
                .isInstanceOf(UnauthorizedException.class)
                .hasMessageContaining("Authenticated operator record not found");
    }

    @Test
    @DisplayName("createTemplate throws BadRequestException when payload validation fails")
    void createTemplate_validationFailsThrows() {
        User operator = User.builder().id(1L).email("author@rng.com").build();
        when(userRepository.findById(1L)).thenReturn(Optional.of(operator));

        DryRunValidationResponse invalidResponse = DryRunValidationResponse.builder()
                .isValid(false)
                .errors(List.of("Exceeds 40 components"))
                .build();
        when(validatorService.validate(anyString(), anyString(), anyMap())).thenReturn(invalidResponse);

        Map<String, Object> payloadWithComponents = Map.of(
                "components", List.of(Map.of("type", 10, "content", "hi"))
        );
        CreateTemplateRequest request = new CreateTemplateRequest(
                "Name", "Desc", "general", List.of(), "guild_1", payloadWithComponents, false
        );

        assertThatThrownBy(() -> service.createTemplate(1L, request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Template payload is invalid: Exceeds 40 components");
    }

    @Test
    @DisplayName("createTemplate creates and saves template with lowercase category and author fallback")
    void createTemplate_success() {
        User operator = User.builder().id(1L).email("author@rng.com").fullName("").build();
        when(userRepository.findById(1L)).thenReturn(Optional.of(operator));

        when(templateRepository.save(any(EmbedTemplate.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        CreateTemplateRequest request = new CreateTemplateRequest(
                "Welcome Card", "Initial welcome layout", "ONBOARDING", List.of("tag1"), "guild_123", Map.of(), true
        );

        TemplateResponse response = service.createTemplate(1L, request);

        assertThat(response).isNotNull();
        assertThat(response.name()).isEqualTo("Welcome Card");
        assertThat(response.authorName()).isEqualTo("author@rng.com");
        assertThat(response.category()).isEqualTo("onboarding");
        assertThat(response.serverId()).isEqualTo("guild_123");
        assertThat(response.serverIds()).containsExactly("guild_123");
        verify(templateRepository).save(any(EmbedTemplate.class));
    }

    @Test
    @DisplayName("createTemplate handles serverIds array properly")
    void createTemplate_withServerIds() {
        User operator = User.builder().id(1L).email("author@rng.com").fullName("Master Chief").build();
        when(userRepository.findById(1L)).thenReturn(Optional.of(operator));

        when(templateRepository.save(any(EmbedTemplate.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        CreateTemplateRequest request = new CreateTemplateRequest(
                "Multi-Server Card", "Desc", null, null, null, List.of("srv_1", "srv_2"), Map.<String, Object>of(), false
        );

        TemplateResponse response = service.createTemplate(1L, request);

        assertThat(response).isNotNull();
        assertThat(response.serverId()).isEqualTo("srv_1");
        assertThat(response.serverIds()).containsExactly("srv_1", "srv_2");
        assertThat(response.category()).isEqualTo("general");
        assertThat(response.authorName()).isEqualTo("Master Chief");
    }

    @Test
    @DisplayName("updateTemplate throws ResourceNotFoundException on nonexistent template")
    void updateTemplate_notFoundThrows() {
        when(templateRepository.findByTemplateId("missing")).thenReturn(Optional.empty());
        when(templateRepository.findById("missing")).thenReturn(Optional.empty());

        UpdateTemplateRequest updateReq = new UpdateTemplateRequest(
                "Name", "Desc", "general", List.of(), Map.of(), false
        );

        assertThatThrownBy(() -> service.updateTemplate(1L, "missing", updateReq))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    @DisplayName("updateTemplate throws ForbiddenException for unauthorized non-author user")
    void updateTemplate_forbiddenForNonAuthor() {
        EmbedTemplate existing = EmbedTemplate.builder()
                .templateId("tmpl_123")
                .authorId("99")
                .authorName("other@rng.com")
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
    @DisplayName("updateTemplate succeeds when requested by author")
    void updateTemplate_authorSucceeds() {
        EmbedTemplate existing = EmbedTemplate.builder()
                .templateId("tmpl_author")
                .authorId("10")
                .name("Old Name")
                .category("general")
                .build();
        when(templateRepository.findByTemplateId("tmpl_author")).thenReturn(Optional.of(existing));

        User author = User.builder().id(10L).email("author@rng.com").role("ROLE_USER").build();
        when(userRepository.findById(10L)).thenReturn(Optional.of(author));
        when(templateRepository.save(any(EmbedTemplate.class))).thenAnswer(inv -> inv.getArgument(0));

        UpdateTemplateRequest updateReq = new UpdateTemplateRequest(
                "Updated Name", "New Desc", "RULES", List.of("tagA"), null, List.of("s1"), Map.<String, Object>of("key", "val"), true
        );

        TemplateResponse response = service.updateTemplate(10L, "tmpl_author", updateReq);

        assertThat(response.name()).isEqualTo("Updated Name");
        assertThat(response.category()).isEqualTo("rules");
        assertThat(response.description()).isEqualTo("New Desc");
        assertThat(response.serverIds()).containsExactly("s1");
    }

    @Test
    @DisplayName("updateTemplate succeeds when requested by High Command")
    void updateTemplate_highCommandSucceeds() {
        EmbedTemplate existing = EmbedTemplate.builder()
                .templateId("tmpl_hc")
                .authorId("55")
                .name("Original")
                .build();
        when(templateRepository.findByTemplateId("tmpl_hc")).thenReturn(Optional.of(existing));

        User hc = User.builder().id(1L).email("hc@rng.com").role("ROLE_HIGH_COMMAND").roles("ROLE_HIGH_COMMAND").build();
        when(userRepository.findById(1L)).thenReturn(Optional.of(hc));
        when(templateRepository.save(any(EmbedTemplate.class))).thenAnswer(inv -> inv.getArgument(0));

        UpdateTemplateRequest updateReq = new UpdateTemplateRequest(
                "HC Updated", null, null, null, "guild_999", null, Map.<String, Object>of(), null
        );

        TemplateResponse response = service.updateTemplate(1L, "tmpl_hc", updateReq);

        assertThat(response.name()).isEqualTo("HC Updated");
        assertThat(response.serverId()).isEqualTo("guild_999");
    }

    @Test
    @DisplayName("deleteTemplate throws ForbiddenException for unauthorized non-author user")
    void deleteTemplate_forbidden() {
        EmbedTemplate existing = EmbedTemplate.builder().templateId("tmpl_del").authorId("88").build();
        when(templateRepository.findByTemplateId("tmpl_del")).thenReturn(Optional.of(existing));

        User user = User.builder().id(2L).email("user@rng.com").role("ROLE_USER").build();
        when(userRepository.findById(2L)).thenReturn(Optional.of(user));

        assertThatThrownBy(() -> service.deleteTemplate(2L, "tmpl_del"))
                .isInstanceOf(ForbiddenException.class);
    }

    @Test
    @DisplayName("deleteTemplate succeeds for author and deletes document")
    void deleteTemplate_success() {
        EmbedTemplate existing = EmbedTemplate.builder().templateId("tmpl_del").authorId("1").name("To Delete").build();
        when(templateRepository.findByTemplateId("tmpl_del")).thenReturn(Optional.of(existing));

        User author = User.builder().id(1L).email("author@rng.com").build();
        when(userRepository.findById(1L)).thenReturn(Optional.of(author));

        service.deleteTemplate(1L, "tmpl_del");

        verify(templateRepository).delete(existing);
    }

    @Test
    @DisplayName("exportTemplate returns full JSON map or throws if not found")
    void exportTemplate_successAndNotFound() {
        EmbedTemplate template = EmbedTemplate.builder()
                .templateId("tmpl_export")
                .name("Raid Protocol")
                .description("Raid instructions")
                .category("rules")
                .tags(List.of("raid"))
                .payload(Map.of("flags", 32768))
                .isPublic(true)
                .build();
        when(templateRepository.findByTemplateId("tmpl_export")).thenReturn(Optional.of(template));
        when(templateRepository.findByTemplateId("missing")).thenReturn(Optional.empty());
        when(templateRepository.findById("missing")).thenReturn(Optional.empty());

        Map<String, Object> exported = service.exportTemplate("tmpl_export");
        assertThat(exported.get("name")).isEqualTo("Raid Protocol");
        assertThat(exported.get("category")).isEqualTo("rules");
        assertThat(exported).containsKey("exportedAt");

        assertThatThrownBy(() -> service.exportTemplate("missing"))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    @DisplayName("importTemplate validates payload and creates template")
    void importTemplate_validationAndCreation() {
        User operator = User.builder().id(1L).email("author@rng.com").build();
        when(userRepository.findById(1L)).thenReturn(Optional.of(operator));
        when(templateRepository.save(any(EmbedTemplate.class))).thenAnswer(inv -> inv.getArgument(0));

        // Invalid import without payload map
        Map<String, Object> badImport = Map.of("name", "Bad Template", "payload", "not-a-map");
        assertThatThrownBy(() -> service.importTemplate(1L, badImport))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Imported JSON must contain a valid 'payload' object");

        // Valid import
        Map<String, Object> validImport = new HashMap<>();
        validImport.put("name", "Imported Card");
        validImport.put("description", "Imported desc");
        validImport.put("category", "ONBOARDING");
        validImport.put("tags", List.of("tag1", "tag2"));
        validImport.put("payload", Map.of("flags", 32768));

        TemplateResponse response = service.importTemplate(1L, validImport);

        assertThat(response).isNotNull();
        assertThat(response.name()).isEqualTo("Imported Card");
        assertThat(response.category()).isEqualTo("onboarding");
        assertThat(response.tags()).containsExactly("tag1", "tag2");
    }

    @Test
    @DisplayName("updateTemplate throws BadRequestException when payload fails pre-flight validation")
    void updateTemplate_invalidPayloadThrows() {
        EmbedTemplate existing = EmbedTemplate.builder()
                .templateId("tmpl_val_err")
                .authorId("10")
                .build();
        when(templateRepository.findByTemplateId("tmpl_val_err")).thenReturn(Optional.of(existing));

        User author = User.builder().id(10L).role("ROLE_USER").build();
        when(userRepository.findById(10L)).thenReturn(Optional.of(author));

        when(validatorService.validate(anyString(), anyString(), anyMap()))
                .thenReturn(DryRunValidationResponse.builder()
                        .isValid(false)
                        .errors(List.of("Invalid flag"))
                        .warnings(List.of())
                        .permissions(new DryRunValidationResponse.BotPermissionCheck(true, true, true))
                        .build());

        UpdateTemplateRequest updateReq = new UpdateTemplateRequest(
                "Name", null, null, null, null, null, Map.of("components", List.of()), null
        );

        assertThatThrownBy(() -> service.updateTemplate(10L, "tmpl_val_err", updateReq))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Updated template payload is invalid");
    }

    @Test
    @DisplayName("importTemplate throws BadRequestException when payload fails pre-flight validation")
    void importTemplate_invalidPayloadThrows() {
        User operator = User.builder().id(1L).email("author@rng.com").build();
        when(userRepository.findById(1L)).thenReturn(Optional.of(operator));

        when(validatorService.validate(anyString(), anyString(), anyMap()))
                .thenReturn(DryRunValidationResponse.builder()
                        .isValid(false)
                        .errors(List.of("Flag 32768 missing"))
                        .warnings(List.of())
                        .permissions(new DryRunValidationResponse.BotPermissionCheck(true, true, true))
                        .build());

        Map<String, Object> badPayloadImport = Map.of(
                "name", "Bad Card",
                "payload", Map.of("components", List.of())
        );

        assertThatThrownBy(() -> service.importTemplate(1L, badPayloadImport))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Template payload is invalid");
    }

    @Test
    @DisplayName("listTemplates with null operatorUserId and blank serverId queries findGlobalAccessible with null authorId")
    void listTemplates_nullUserAndBlankServer() {
        Pageable pageable = PageRequest.of(0, 10);
        when(templateRepository.findGlobalAccessible(isNull(), eq(pageable)))
                .thenReturn(new PageImpl<>(List.of()));

        Page<TemplateResponse> result = service.listTemplates(null, "   ", null, pageable);
        assertThat(result).isNotNull();
        verify(templateRepository).findGlobalAccessible(isNull(), eq(pageable));
    }

    @Test
    @DisplayName("createTemplate edge cases: payload with flags, plain payload validation failure, null serverId/category/tags")
    void createTemplate_edgeCasesAndFallbacks() {
        User operator = User.builder().id(2L).email("op@rng.com").fullName(null).build(); // null full name
        when(userRepository.findById(2L)).thenReturn(Optional.of(operator));

        when(templateRepository.save(any())).thenAnswer(inv -> {
            EmbedTemplate t = inv.getArgument(0);
            t.setId("saved-id");
            return t;
        });

        // 1. Payload with flags already present
        CreateTemplateRequest req1 = new CreateTemplateRequest(
                "T1", null, null, null, null,
                Map.of("components", List.of(), "flags", 32768), true
        );
        TemplateResponse res1 = service.createTemplate(2L, req1);
        assertThat(res1.authorName()).isEqualTo("op@rng.com");
        assertThat(res1.category()).isEqualTo("general");
        assertThat(res1.tags()).isEmpty();
        assertThat(res1.serverId()).isNull();

        // 2. Plain payload failing validation
        when(validatorService.validate(anyString(), anyString(), anyMap()))
                .thenReturn(DryRunValidationResponse.builder().isValid(false).errors(List.of("Plain validation failed")).build());

        CreateTemplateRequest req2 = new CreateTemplateRequest(
                "T2", "Desc", "CAT", List.of(), "srv-1",
                Map.of("plain", "data"), true
        );
        assertThatThrownBy(() -> service.createTemplate(2L, req2))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Template payload is invalid: Plain validation failed");
    }

    @Test
    @DisplayName("updateTemplate edge cases: null authorId, author match by email, super admin role, serverIds variations")
    void updateTemplate_edgeCasesAndRoles() {
        // 1. Template with null authorId allowed
        EmbedTemplate tplNullAuthor = EmbedTemplate.builder().templateId("t_null_auth").authorId(null).build();
        when(templateRepository.findByTemplateId("t_null_auth")).thenReturn(Optional.of(tplNullAuthor));
        User regularUser = User.builder().id(3L).email("user@rng.com").role("ROLE_USER").build();
        when(userRepository.findById(3L)).thenReturn(Optional.of(regularUser));

        when(templateRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        UpdateTemplateRequest updateReq = new UpdateTemplateRequest(
                "Updated Name", "Updated Desc", "NEW_CAT", List.of("tagA"),
                "primary-srv", List.of("srv1", "srv2"), null, true
        );
        TemplateResponse res = service.updateTemplate(3L, "t_null_auth", updateReq);
        assertThat(res.name()).isEqualTo("Updated Name");
        assertThat(res.serverId()).isEqualTo("primary-srv");

        // 2. Author match by authorName equals email
        EmbedTemplate tplAuthorNameMatch = EmbedTemplate.builder().templateId("t_match_email").authorId("99").authorName("user@rng.com").build();
        when(templateRepository.findByTemplateId("t_match_email")).thenReturn(Optional.of(tplAuthorNameMatch));
        service.updateTemplate(3L, "t_match_email", updateReq);

        // 3. User with ROLE_ADMIN
        EmbedTemplate tplOther = EmbedTemplate.builder().templateId("t_other").authorId("88").build();
        when(templateRepository.findByTemplateId("t_other")).thenReturn(Optional.of(tplOther));
        User adminUser = User.builder().id(4L).email("admin@rng.com").role("ROLE_ADMIN").build();
        when(userRepository.findById(4L)).thenReturn(Optional.of(adminUser));

        // serverIds is empty list -> serverId set to null
        UpdateTemplateRequest emptyServerIdsReq = new UpdateTemplateRequest(
                "Empty ServerIds", null, null, null, null, List.of(), null, null
        );
        TemplateResponse resAdmin = service.updateTemplate(4L, "t_other", emptyServerIdsReq);
        assertThat(resAdmin.serverId()).isNull();

        // 4. Update with single serverId only (no serverIds list)
        UpdateTemplateRequest singleServerIdReq = new UpdateTemplateRequest(
                "Single Server", null, null, null, "srv-single", null, null, null
        );
        TemplateResponse resSingle = service.updateTemplate(4L, "t_other", singleServerIdReq);
        assertThat(resSingle.serverId()).isEqualTo("srv-single");

        // 5. Update plain payload without components and without containers failing validation
        when(validatorService.validate(anyString(), anyString(), anyMap()))
                .thenReturn(DryRunValidationResponse.builder().isValid(false).errors(List.of("Plain validation failed")).build());
        UpdateTemplateRequest plainFailReq = new UpdateTemplateRequest(
                "Fail", null, null, null, null, null, Map.of("plain", "data"), null
        );
        assertThatThrownBy(() -> service.updateTemplate(4L, "t_other", plainFailReq))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Updated template payload is invalid");
    }

    @Test
    @DisplayName("deleteTemplate edge cases: operator not found, match by authorName, and SUPER_ADMIN role")
    void deleteTemplate_edgeCases() {
        when(userRepository.findById(999L)).thenReturn(Optional.empty());
        EmbedTemplate tpl = EmbedTemplate.builder().templateId("t_del").authorId("10").authorName("author@rng.com").build();
        when(templateRepository.findByTemplateId("t_del")).thenReturn(Optional.of(tpl));

        assertThatThrownBy(() -> service.deleteTemplate(999L, "t_del"))
                .isInstanceOf(UnauthorizedException.class);

        // Match author by authorName
        User authorByEmail = User.builder().id(5L).email("author@rng.com").role("ROLE_USER").build();
        when(userRepository.findById(5L)).thenReturn(Optional.of(authorByEmail));
        service.deleteTemplate(5L, "t_del");
        verify(templateRepository).delete(tpl);

        // Delete by SUPER_ADMIN role
        User superAdmin = User.builder().id(6L).email("super@rng.com").role("ROLE_SUPER_ADMIN").build();
        when(userRepository.findById(6L)).thenReturn(Optional.of(superAdmin));
        service.deleteTemplate(6L, "t_del");
        verify(templateRepository, times(2)).delete(tpl);
    }

    @Test
    @DisplayName("listTemplates covers null operator, blank serverId, and blank category")
    void listTemplates_nullOperatorAndBlankFilters() {
        Pageable pageable = PageRequest.of(0, 10);
        when(templateRepository.findGlobalAccessible(isNull(), eq(pageable)))
                .thenReturn(new PageImpl<>(List.of()));
        when(templateRepository.findAccessibleByServer(eq("srv_clean"), eq(pageable)))
                .thenReturn(new PageImpl<>(List.of()));

        // null operator and blank server/category -> findGlobalAccessible(null, pageable)
        Page<TemplateResponse> r1 = service.listTemplates(null, "   ", "   ", pageable);
        assertThat(r1).isNotNull();
        verify(templateRepository).findGlobalAccessible(isNull(), eq(pageable));

        // null operator and global serverId -> findGlobalAccessible(null, pageable)
        Page<TemplateResponse> r2 = service.listTemplates(null, "global", null, pageable);
        assertThat(r2).isNotNull();

        // serverId with blank category -> findAccessibleByServer
        Page<TemplateResponse> r3 = service.listTemplates(1L, " srv_clean ", "   ", pageable);
        assertThat(r3).isNotNull();
        verify(templateRepository).findAccessibleByServer("srv_clean", pageable);
    }

    @Test
    @DisplayName("createTemplate covers fullName, null fields, serverId fallbacks, and validation branches")
    void createTemplate_comprehensiveBranches() {
        when(templateRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        // 1. Operator with non-blank fullName
        User opWithFullName = User.builder().id(10L).email("name@rng.com").fullName("Commander Jane").build();
        when(userRepository.findById(10L)).thenReturn(Optional.of(opWithFullName));

        CreateTemplateRequest reqWithFullName = new CreateTemplateRequest(
                "Name", null, null, null, null, null, false
        );
        TemplateResponse res1 = service.createTemplate(10L, reqWithFullName);
        assertThat(res1.authorName()).isEqualTo("Commander Jane");
        assertThat(res1.category()).isEqualTo("general");
        assertThat(res1.tags()).isEmpty();
        assertThat(res1.serverId()).isNull();
        assertThat(res1.serverIds()).isEmpty();

        // 2. Operator with blank fullName falls back to email
        User opBlankFullName = User.builder().id(11L).email("blank@rng.com").fullName("   ").build();
        when(userRepository.findById(11L)).thenReturn(Optional.of(opBlankFullName));

        CreateTemplateRequest reqBlankCat = new CreateTemplateRequest(
                "Name", "Desc", "   ", List.of("tag1"), "srv1", null, Map.of(), true
        );
        TemplateResponse res2 = service.createTemplate(11L, reqBlankCat);
        assertThat(res2.authorName()).isEqualTo("blank@rng.com");
        assertThat(res2.category()).isEqualTo("general");
        assertThat(res2.serverId()).isEqualTo("srv1");
        assertThat(res2.serverIds()).containsExactly("srv1");

        // 3. Request with serverIds provided but serverId null
        CreateTemplateRequest reqServerIds = new CreateTemplateRequest(
                "Name", null, "custom", null, null, List.of("srvA", "srvB"), null, false
        );
        TemplateResponse res3 = service.createTemplate(11L, reqServerIds);
        assertThat(res3.serverId()).isEqualTo("srvA");
        assertThat(res3.serverIds()).containsExactly("srvA", "srvB");

        // 4. Request with serverId blank and serverIds empty
        CreateTemplateRequest reqBlankServer = new CreateTemplateRequest(
                "Name", null, null, null, "   ", List.of(), null, false
        );
        TemplateResponse res4 = service.createTemplate(11L, reqBlankServer);
        assertThat(res4.serverId()).isNull();
        assertThat(res4.serverIds()).isEmpty();

        // 5. Wire validation with existing flags, serverId null -> passes "global"
        Map<String, Object> wireWithFlags = new HashMap<>();
        wireWithFlags.put("components", List.of(Map.of("type", 10)));
        wireWithFlags.put("flags", 32768);
        wireWithFlags.put("content", "ignored");
        CreateTemplateRequest reqWire = new CreateTemplateRequest(
                "Wire", null, null, null, null, null, wireWithFlags, false
        );
        TemplateResponse resWire = service.createTemplate(11L, reqWire);
        assertThat(resWire).isNotNull();
        verify(validatorService, atLeastOnce()).validate(eq("global"), eq("template-validation"), anyMap());

        // 6. Wire validation failure throws BadRequestException
        when(validatorService.validate(anyString(), anyString(), anyMap()))
                .thenReturn(DryRunValidationResponse.builder().isValid(false).errors(List.of("Wire error")).build());
        assertThatThrownBy(() -> service.createTemplate(11L, reqWire))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Template payload is invalid");

        // 7. Plain validation without components and without containers failure
        Map<String, Object> plainMap = Map.of("key", "val");
        CreateTemplateRequest reqPlain = new CreateTemplateRequest(
                "Plain", null, null, null, "srv9", null, plainMap, false
        );
        assertThatThrownBy(() -> service.createTemplate(11L, reqPlain))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Template payload is invalid");

        // 8. Payload with containers skips validation
        Map<String, Object> containerPayload = Map.of("containers", List.of());
        CreateTemplateRequest reqContainer = new CreateTemplateRequest(
                "Container", null, null, null, null, null, containerPayload, false
        );
        TemplateResponse resCont = service.createTemplate(11L, reqContainer);
        assertThat(resCont).isNotNull();
    }

    @Test
    @DisplayName("updateTemplate covers findById fallback, role hierarchy, containers skip, and field branches")
    void updateTemplate_comprehensiveBranches() {
        when(templateRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        // 1. Template found by findById fallback when findByTemplateId is empty
        EmbedTemplate tplFallback = EmbedTemplate.builder()
                .id("mongo_id_1")
                .templateId("t_id_fallback")
                .authorId("auth_blank")
                .authorName("old_author")
                .serverId(null)
                .build();
        when(templateRepository.findByTemplateId("t_id_fallback")).thenReturn(Optional.empty());
        when(templateRepository.findById("t_id_fallback")).thenReturn(Optional.of(tplFallback));

        // Chief High Command operator
        User chiefOp = User.builder().id(20L).email("chief@rng.com").role("ROLE_CHIEF_HIGH_COMMAND").build();
        when(userRepository.findById(20L)).thenReturn(Optional.of(chiefOp));

        // Update with containers in payload -> skips validation
        // serverIds provided, serverId null, serverIds not empty -> serverId becomes serverIds.get(0)
        UpdateTemplateRequest reqWithContainers = new UpdateTemplateRequest(
                "New Name", null, null, null, null, List.of("srv_from_list"),
                Map.of("containers", List.of()), null
        );
        TemplateResponse res = service.updateTemplate(20L, "t_id_fallback", reqWithContainers);
        assertThat(res.name()).isEqualTo("New Name");
        assertThat(res.serverId()).isEqualTo("srv_from_list");
        assertThat(res.serverIds()).containsExactly("srv_from_list");

        // 2. High Command operator with role containing HIGH_COMMAND
        User hcOp = User.builder().id(21L).email("hc@rng.com").role("SOME_HIGH_COMMAND_ROLE").build();
        when(userRepository.findById(21L)).thenReturn(Optional.of(hcOp));

        // Template with authorId blank ("   ")
        EmbedTemplate tplBlankAuthor = EmbedTemplate.builder().templateId("t_blank_auth").authorId("   ").serverId(null).build();
        when(templateRepository.findByTemplateId("t_blank_auth")).thenReturn(Optional.of(tplBlankAuthor));

        // Wire validation with existing flags, template serverId null -> validates with "global"
        when(validatorService.validate(anyString(), anyString(), anyMap()))
                .thenReturn(DryRunValidationResponse.builder().isValid(true).errors(List.of()).build());
        Map<String, Object> wirePayload = new HashMap<>();
        wirePayload.put("components", List.of(Map.of("type", 10)));
        wirePayload.put("flags", 32768);
        UpdateTemplateRequest reqWire = new UpdateTemplateRequest(
                "Wire Name", "Desc", "CAT", List.of("tag"), "primary_srv", null, wirePayload, true
        );
        TemplateResponse resWire = service.updateTemplate(21L, "t_blank_auth", reqWire);
        assertThat(resWire.name()).isEqualTo("Wire Name");
        assertThat(resWire.category()).isEqualTo("cat");
        assertThat(resWire.serverId()).isEqualTo("primary_srv");

        // 3. Wire validation failure on update throws BadRequestException
        when(validatorService.validate(anyString(), anyString(), anyMap()))
                .thenReturn(DryRunValidationResponse.builder().isValid(false).errors(List.of("Wire update fail")).build());
        assertThatThrownBy(() -> service.updateTemplate(21L, "t_blank_auth", reqWire))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Updated template payload is invalid");

        // 4. Update request with null serverIds and null serverId
        UpdateTemplateRequest reqNullServers = new UpdateTemplateRequest(
                "No Server", null, null, null, null, null, null, null
        );
        TemplateResponse resNull = service.updateTemplate(21L, "t_blank_auth", reqNullServers);
        assertThat(resNull.name()).isEqualTo("No Server");

        // 5. Operator with null email and null role cannot update if not author
        EmbedTemplate tplStrict = EmbedTemplate.builder().templateId("t_strict").authorId("999").build();
        when(templateRepository.findByTemplateId("t_strict")).thenReturn(Optional.of(tplStrict));
        User opNullEmailAndRole = User.builder().id(55L).email(null).role(null).build();
        when(userRepository.findById(55L)).thenReturn(Optional.of(opNullEmailAndRole));
        assertThatThrownBy(() -> service.updateTemplate(55L, "t_strict", reqNullServers))
                .isInstanceOf(ForbiddenException.class);
    }

    @Test
    @DisplayName("deleteTemplate covers findById fallback, blank authorId, and Chief High Command role")
    void deleteTemplate_comprehensiveBranches() {
        // 1. Template found by findById fallback
        EmbedTemplate tplFallback = EmbedTemplate.builder().id("m_del").templateId("t_del_fb").authorId("  ").build();
        when(templateRepository.findByTemplateId("t_del_fb")).thenReturn(Optional.empty());
        when(templateRepository.findById("t_del_fb")).thenReturn(Optional.of(tplFallback));

        User user = User.builder().id(30L).email("any@rng.com").role("ROLE_USER").build();
        when(userRepository.findById(30L)).thenReturn(Optional.of(user));

        service.deleteTemplate(30L, "t_del_fb");
        verify(templateRepository).delete(tplFallback);

        // 2. Chief High Command role delete
        EmbedTemplate tplChiefDel = EmbedTemplate.builder().templateId("t_chief_del").authorId("diff_auth").build();
        when(templateRepository.findByTemplateId("t_chief_del")).thenReturn(Optional.of(tplChiefDel));
        User chiefUser = User.builder().id(31L).email("chief2@rng.com").role("ROLE_CHIEF_HIGH_COMMAND").build();
        when(userRepository.findById(31L)).thenReturn(Optional.of(chiefUser));

        service.deleteTemplate(31L, "t_chief_del");
        verify(templateRepository).delete(tplChiefDel);

        // 3. Role with HIGH_COMMAND
        EmbedTemplate tplHcDel = EmbedTemplate.builder().templateId("t_hc_del").authorId("diff_auth").build();
        when(templateRepository.findByTemplateId("t_hc_del")).thenReturn(Optional.of(tplHcDel));
        User hcUser = User.builder().id(32L).email("hc2@rng.com").role("MINISTRY_HIGH_COMMAND").build();
        when(userRepository.findById(32L)).thenReturn(Optional.of(hcUser));

        service.deleteTemplate(32L, "t_hc_del");
        verify(templateRepository).delete(tplHcDel);
    }

    @Test
    @DisplayName("exportTemplate covers findById fallback and ResourceNotFoundException")
    void exportTemplate_branches() {
        // findById fallback
        EmbedTemplate tpl = EmbedTemplate.builder()
                .id("m_exp")
                .templateId("t_exp")
                .name("Exported")
                .description("Desc")
                .category("general")
                .tags(List.of("tag"))
                .payload(Map.of("k", "v"))
                .isPublic(true)
                .build();
        when(templateRepository.findByTemplateId("t_exp")).thenReturn(Optional.empty());
        when(templateRepository.findById("t_exp")).thenReturn(Optional.of(tpl));

        Map<String, Object> map = service.exportTemplate("t_exp");
        assertThat(map).containsEntry("name", "Exported");
        assertThat(map).containsKey("exportedAt");

        // not found in both throws ResourceNotFoundException
        when(templateRepository.findByTemplateId("t_missing")).thenReturn(Optional.empty());
        when(templateRepository.findById("t_missing")).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.exportTemplate("t_missing"))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    @DisplayName("importTemplate covers default fields, tags as non-list, and invalid payload errors")
    void importTemplate_branches() {
        User op = User.builder().id(40L).email("importer@rng.com").build();
        when(userRepository.findById(40L)).thenReturn(Optional.of(op));
        when(templateRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        // 1. Minimal json with defaults and non-list tags
        Map<String, Object> minJson = new HashMap<>();
        minJson.put("payload", Map.of("key", "val"));
        minJson.put("tags", "not-a-list");

        TemplateResponse res = service.importTemplate(40L, minJson);
        assertThat(res.name()).isEqualTo("Imported Template");
        assertThat(res.category()).isEqualTo("general");
        assertThat(res.tags()).isEmpty();

        // 2. Payload is not a Map -> throws BadRequestException
        Map<String, Object> badPayloadJson = Map.of("payload", "invalid_string_payload");
        assertThatThrownBy(() -> service.importTemplate(40L, badPayloadJson))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Imported JSON must contain a valid 'payload' object");
    }

    @Test
    @DisplayName("getTemplate and toResponse cover serverIds null/empty branches")
    void getTemplate_toResponseBranches() {
        // doc with null serverIds and null serverId
        EmbedTemplate docNullServers = EmbedTemplate.builder()
                .templateId("t_null_srv")
                .name("No Server")
                .serverId(null)
                .serverIds(null)
                .build();
        when(templateRepository.findByTemplateId("t_null_srv")).thenReturn(Optional.of(docNullServers));
        TemplateResponse r1 = service.getTemplate("t_null_srv");
        assertThat(r1.serverId()).isNull();
        assertThat(r1.serverIds()).isEmpty();

        // doc with null serverIds and non-null serverId
        EmbedTemplate docSingleServer = EmbedTemplate.builder()
                .templateId("t_single_srv")
                .name("Single Server")
                .serverId("srv_only")
                .serverIds(null)
                .build();
        when(templateRepository.findByTemplateId("t_single_srv")).thenReturn(Optional.of(docSingleServer));
        TemplateResponse r2 = service.getTemplate("t_single_srv");
        assertThat(r2.serverId()).isEqualTo("srv_only");
        assertThat(r2.serverIds()).containsExactly("srv_only");

        // doc with serverIds but serverId null
        EmbedTemplate docListOnly = EmbedTemplate.builder()
                .templateId("t_list_srv")
                .name("List Server")
                .serverId(null)
                .serverIds(List.of("srv_first", "srv_second"))
                .build();
        when(templateRepository.findByTemplateId("t_list_srv")).thenReturn(Optional.of(docListOnly));
        TemplateResponse r3 = service.getTemplate("t_list_srv");
        assertThat(r3.serverId()).isEqualTo("srv_first");
        assertThat(r3.serverIds()).containsExactly("srv_first", "srv_second");
    }
}
