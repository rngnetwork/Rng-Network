package com.rednecksgaming.embed.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.rednecksgaming.common.exception.ConflictException;
import com.rednecksgaming.common.exception.GlobalExceptionHandler;
import com.rednecksgaming.common.exception.ResourceNotFoundException;
import com.rednecksgaming.embed.dto.CreateTemplateRequest;
import com.rednecksgaming.embed.dto.TemplateResponse;
import com.rednecksgaming.embed.dto.UpdateTemplateRequest;
import com.rednecksgaming.embed.service.EmbedTemplateService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.*;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.Instant;
import java.util.List;
import java.util.Map;

import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class EmbedTemplateControllerTest {

    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());

    @Mock
    private EmbedTemplateService templateService;

    @InjectMocks
    private EmbedTemplateController controller;

    @Captor
    private ArgumentCaptor<Pageable> pageableCaptor;

    private TemplateResponse sampleTemplate;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(controller)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();

        sampleTemplate = TemplateResponse.builder()
                .id("mongo-tpl-1")
                .templateId("tpl-welcome-announcement")
                .name("Welcome Announcement")
                .description("Standard welcoming embed")
                .authorId("42")
                .authorName("Admin")
                .serverId("104812345678901234")
                .serverIds(List.of("104812345678901234"))
                .category("onboarding")
                .tags(List.of("welcome", "rules"))
                .payload(Map.of("title", "Welcome to RNG!"))
                .isPublic(true)
                .version(1L)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();
    }

    @Test
    @DisplayName("GET /api/v1/embeds/templates returns paginated templates with default parameters")
    void listTemplates_withDefaults_returnsPaginatedTemplates() throws Exception {
        Authentication auth = new UsernamePasswordAuthenticationToken(42L, null);
        Page<TemplateResponse> page = new PageImpl<>(List.of(sampleTemplate), PageRequest.of(0, 20), 1);

        when(templateService.listTemplates(eq(42L), isNull(), isNull(), any(Pageable.class))).thenReturn(page);

        mockMvc.perform(get("/api/v1/embeds/templates").principal(auth))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.content", hasSize(1)))
                .andExpect(jsonPath("$.data.content[0].name", is("Welcome Announcement")))
                .andExpect(jsonPath("$.data.content[0].templateId", is("tpl-welcome-announcement")));

        verify(templateService).listTemplates(eq(42L), isNull(), isNull(), pageableCaptor.capture());
        Pageable captured = pageableCaptor.getValue();
        org.assertj.core.api.Assertions.assertThat(captured.getPageNumber()).isEqualTo(0);
        org.assertj.core.api.Assertions.assertThat(captured.getPageSize()).isEqualTo(20);
        org.assertj.core.api.Assertions.assertThat(captured.getSort().getOrderFor("updatedAt").getDirection())
                .isEqualTo(Sort.Direction.DESC);
    }

    @Test
    @DisplayName("GET /api/v1/embeds/templates with serverId, category and pagination clamps bounds")
    void listTemplates_withFiltersAndClampedPagination() throws Exception {
        Authentication auth = new UsernamePasswordAuthenticationToken("42", null);
        Page<TemplateResponse> page = new PageImpl<>(List.of(sampleTemplate), PageRequest.of(0, 100), 1);

        when(templateService.listTemplates(eq(42L), eq("104812345678901234"), eq("onboarding"), any(Pageable.class)))
                .thenReturn(page);

        mockMvc.perform(get("/api/v1/embeds/templates")
                        .principal(auth)
                        .param("serverId", "104812345678901234")
                        .param("category", "onboarding")
                        .param("page", "-5")
                        .param("size", "250"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)));

        verify(templateService).listTemplates(eq(42L), eq("104812345678901234"), eq("onboarding"), pageableCaptor.capture());
        Pageable captured = pageableCaptor.getValue();
        org.assertj.core.api.Assertions.assertThat(captured.getPageNumber()).isEqualTo(0);
        org.assertj.core.api.Assertions.assertThat(captured.getPageSize()).isEqualTo(100);
    }

    @Test
    @DisplayName("GET /api/v1/embeds/templates with non-numeric principal name falls back to 1L")
    void listTemplates_withNonNumericPrincipalName_fallsBackTo1() throws Exception {
        Authentication auth = new UsernamePasswordAuthenticationToken("not-a-number", null);
        Page<TemplateResponse> page = new PageImpl<>(List.of(sampleTemplate), PageRequest.of(0, 20), 1);

        when(templateService.listTemplates(eq(1L), isNull(), isNull(), any(Pageable.class))).thenReturn(page);

        mockMvc.perform(get("/api/v1/embeds/templates").principal(auth))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)));

        verify(templateService).listTemplates(eq(1L), isNull(), isNull(), any(Pageable.class));
    }

    @Test
    @DisplayName("GET /api/v1/embeds/templates with auth whose getName is null falls back to 1L")
    void listTemplates_withNullPrincipalName_fallsBackTo1() throws Exception {
        Authentication auth = mock(Authentication.class);
        when(auth.getPrincipal()).thenReturn("string-principal");
        when(auth.getName()).thenReturn(null);

        Page<TemplateResponse> page = new PageImpl<>(List.of(sampleTemplate), PageRequest.of(0, 20), 1);
        when(templateService.listTemplates(eq(1L), isNull(), isNull(), any(Pageable.class))).thenReturn(page);

        mockMvc.perform(get("/api/v1/embeds/templates").principal(auth))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)));

        verify(templateService).listTemplates(eq(1L), isNull(), isNull(), any(Pageable.class));
    }

    @Test
    @DisplayName("GET /api/v1/embeds/templates with null authentication falls back to 1L")
    void listTemplates_withNullAuth_fallsBackTo1() throws Exception {
        Page<TemplateResponse> page = new PageImpl<>(List.of(sampleTemplate), PageRequest.of(0, 20), 1);
        when(templateService.listTemplates(eq(1L), isNull(), isNull(), any(Pageable.class))).thenReturn(page);

        mockMvc.perform(get("/api/v1/embeds/templates"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)));

        verify(templateService).listTemplates(eq(1L), isNull(), isNull(), any(Pageable.class));
    }

    @Test
    @DisplayName("GET /api/v1/embeds/templates/{templateId} returns template when found")
    void getTemplate_whenFound_returnsTemplate() throws Exception {
        when(templateService.getTemplate("tpl-welcome-announcement")).thenReturn(sampleTemplate);

        mockMvc.perform(get("/api/v1/embeds/templates/tpl-welcome-announcement"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.templateId", is("tpl-welcome-announcement")))
                .andExpect(jsonPath("$.data.name", is("Welcome Announcement")));
    }

    @Test
    @DisplayName("GET /api/v1/embeds/templates/{templateId} returns 404 when not found")
    void getTemplate_whenNotFound_returns404() throws Exception {
        when(templateService.getTemplate("tpl-unknown"))
                .thenThrow(new ResourceNotFoundException("Template not found: tpl-unknown"));

        mockMvc.perform(get("/api/v1/embeds/templates/tpl-unknown"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.message", is("Template not found: tpl-unknown")));
    }

    @Test
    @DisplayName("POST /api/v1/embeds/templates creates template successfully")
    void createTemplate_validRequest_returnsCreated() throws Exception {
        Authentication auth = new UsernamePasswordAuthenticationToken(42L, null);
        CreateTemplateRequest request = new CreateTemplateRequest(
                "Welcome Announcement",
                "Standard welcoming embed",
                "onboarding",
                List.of("welcome"),
                "104812345678901234",
                List.of("104812345678901234"),
                Map.of("content", "Welcome!"),
                true
        );

        when(templateService.createTemplate(eq(42L), any(CreateTemplateRequest.class))).thenReturn(sampleTemplate);

        mockMvc.perform(post("/api/v1/embeds/templates")
                        .principal(auth)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.message", is("Template created successfully.")))
                .andExpect(jsonPath("$.data.name", is("Welcome Announcement")));
    }

    @Test
    @DisplayName("POST /api/v1/embeds/templates with invalid request body returns 400 validation error")
    void createTemplate_invalidRequest_returns400() throws Exception {
        CreateTemplateRequest invalidRequest = new CreateTemplateRequest(
                "",
                "Description",
                "category",
                List.of(),
                "104812345678901234",
                null,
                false
        );

        mockMvc.perform(post("/api/v1/embeds/templates")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.message", is("Validation failed")))
                .andExpect(jsonPath("$.data.name", notNullValue()))
                .andExpect(jsonPath("$.data.payload", notNullValue()));
    }

    @Test
    @DisplayName("PUT /api/v1/embeds/templates/{templateId} updates template successfully")
    void updateTemplate_validRequest_returnsUpdated() throws Exception {
        Authentication auth = new UsernamePasswordAuthenticationToken(42L, null);
        UpdateTemplateRequest request = new UpdateTemplateRequest(
                "Updated Welcome",
                "Updated description",
                "onboarding",
                List.of("welcome"),
                "104812345678901234",
                List.of("104812345678901234"),
                Map.of("content", "New content"),
                true
        );

        when(templateService.updateTemplate(eq(42L), eq("tpl-welcome-announcement"), any(UpdateTemplateRequest.class)))
                .thenReturn(sampleTemplate);

        mockMvc.perform(put("/api/v1/embeds/templates/tpl-welcome-announcement")
                        .principal(auth)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.message", is("Template updated successfully.")));
    }

    @Test
    @DisplayName("PUT /api/v1/embeds/templates/{templateId} with invalid request body returns 400 validation error")
    void updateTemplate_invalidRequest_returns400() throws Exception {
        UpdateTemplateRequest invalidRequest = new UpdateTemplateRequest(
                "",
                "Description",
                "category",
                List.of(),
                "104812345678901234",
                List.of("104812345678901234"),
                null,
                false
        );

        mockMvc.perform(put("/api/v1/embeds/templates/tpl-welcome-announcement")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.message", is("Validation failed")))
                .andExpect(jsonPath("$.data.name", notNullValue()))
                .andExpect(jsonPath("$.data.payload", notNullValue()));
    }

    @Test
    @DisplayName("PUT /api/v1/embeds/templates/{templateId} on optimistic lock conflict returns 409")
    void updateTemplate_conflict_returns409() throws Exception {
        Authentication auth = new UsernamePasswordAuthenticationToken(42L, null);
        UpdateTemplateRequest request = new UpdateTemplateRequest(
                "Updated Welcome",
                "Updated description",
                "onboarding",
                List.of("welcome"),
                Map.of("content", "New content"),
                true
        );

        when(templateService.updateTemplate(eq(42L), eq("tpl-welcome-announcement"), any(UpdateTemplateRequest.class)))
                .thenThrow(new ConflictException("Template has been modified concurrently by another transaction."));

        mockMvc.perform(put("/api/v1/embeds/templates/tpl-welcome-announcement")
                        .principal(auth)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.message", is("Template has been modified concurrently by another transaction.")));
    }

    @Test
    @DisplayName("DELETE /api/v1/embeds/templates/{templateId} deletes template successfully")
    void deleteTemplate_validRequest_returnsSuccess() throws Exception {
        Authentication auth = new UsernamePasswordAuthenticationToken(42L, null);
        doNothing().when(templateService).deleteTemplate(42L, "tpl-welcome-announcement");

        mockMvc.perform(delete("/api/v1/embeds/templates/tpl-welcome-announcement").principal(auth))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data", is(true)))
                .andExpect(jsonPath("$.message", is("Template deleted successfully.")));

        verify(templateService).deleteTemplate(42L, "tpl-welcome-announcement");
    }

    @Test
    @DisplayName("GET /api/v1/embeds/templates/{templateId}/export exports template successfully")
    void exportTemplate_validId_returnsMap() throws Exception {
        Map<String, Object> exported = Map.of("name", "Welcome Announcement", "payload", Map.of("title", "Welcome"));
        when(templateService.exportTemplate("tpl-welcome-announcement")).thenReturn(exported);

        mockMvc.perform(get("/api/v1/embeds/templates/tpl-welcome-announcement/export"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.message", is("Template exported successfully.")))
                .andExpect(jsonPath("$.data.name", is("Welcome Announcement")));
    }

    @Test
    @DisplayName("POST /api/v1/embeds/templates/import imports template successfully")
    void importTemplate_validJson_returnsImportedTemplate() throws Exception {
        Authentication auth = new UsernamePasswordAuthenticationToken(42L, null);
        Map<String, Object> importJson = Map.of("name", "Welcome Announcement", "payload", Map.of("title", "Welcome"));

        when(templateService.importTemplate(eq(42L), any())).thenReturn(sampleTemplate);

        mockMvc.perform(post("/api/v1/embeds/templates/import")
                        .principal(auth)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(importJson)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.message", is("Template imported successfully.")))
                .andExpect(jsonPath("$.data.name", is("Welcome Announcement")));
    }
}
