// Written By: RachitSWE
// LICENSE: All rights reserved
// Year: 2026
package com.rednecksgaming.personnel.roles.service;

import com.rednecksgaming.personnel.roles.domain.MatrixCell;
import com.rednecksgaming.personnel.roles.domain.MatrixDesignation;
import com.rednecksgaming.personnel.roles.domain.MatrixRank;
import com.rednecksgaming.personnel.roles.dto.*;
import com.rednecksgaming.personnel.roles.event.RoleHierarchyMutationEvent;
import com.rednecksgaming.personnel.roles.event.RoleHierarchyMutationEventType;
import com.rednecksgaming.personnel.roles.mapper.RoleHierarchyMapper;
import com.rednecksgaming.personnel.roles.repository.MatrixCellRepository;
import com.rednecksgaming.personnel.roles.repository.MatrixDesignationRepository;
import com.rednecksgaming.personnel.roles.repository.MatrixRankRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RoleMatrixServiceTest {

    @Mock
    private MatrixRankRepository rankRepo;

    @Mock
    private MatrixDesignationRepository desRepo;

    @Mock
    private MatrixCellRepository cellRepo;

    @Mock
    private RoleHierarchyMapper mapper;

    @Mock
    private ApplicationEventPublisher eventPublisher;

    private RoleMatrixServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new RoleMatrixServiceImpl(rankRepo, desRepo, cellRepo, mapper, eventPublisher);
    }

    @Test
    @DisplayName("getFullMatrix should fetch ranks, designations, and cells in single batch and map to DTO")
    void testGetFullMatrix() {
        List<MatrixRank> ranks = List.of(new MatrixRank(9, "R9"));
        List<MatrixDesignation> designations = List.of(new MatrixDesignation("des_supreme", "Supreme", 0));
        List<MatrixCell> cells = List.of(new MatrixCell(9, "des_supreme", "Chief High Command"));
        RoleHierarchyMatrixDto expectedDto = new RoleHierarchyMatrixDto(List.of(), List.of(), Collections.emptyMap());

        when(rankRepo.findAllByOrderByWeightDesc()).thenReturn(ranks);
        when(desRepo.findAllByOrderByPositionAsc()).thenReturn(designations);
        when(cellRepo.findAll()).thenReturn(cells);
        when(mapper.toMatrixDto(ranks, designations, cells)).thenReturn(expectedDto);

        RoleHierarchyMatrixDto result = service.getFullMatrix();

        assertThat(result).isSameAs(expectedDto);
        verify(rankRepo).findAllByOrderByWeightDesc();
        verify(desRepo).findAllByOrderByPositionAsc();
        verify(cellRepo).findAll();
    }

    @Test
    @DisplayName("addRole should persist cell and publish ROLE_ADDED event")
    void testAddRole() {
        MatrixDesignation tech = new MatrixDesignation("des_tech", "Ministry of Tech", 1);
        when(rankRepo.existsById(5)).thenReturn(true);
        when(desRepo.findById("des_tech")).thenReturn(Optional.of(tech));
        when(cellRepo.existsByRankWeightAndDesignationIdAndRoleName(5, "des_tech", "Senior Dev")).thenReturn(false);
        when(cellRepo.save(any(MatrixCell.class))).thenAnswer(i -> i.getArgument(0));

        RoleHierarchyMatrixDto refreshedDto = new RoleHierarchyMatrixDto(List.of(), List.of(), Collections.emptyMap());
        when(rankRepo.findAllByOrderByWeightDesc()).thenReturn(List.of());
        when(desRepo.findAllByOrderByPositionAsc()).thenReturn(List.of());
        when(cellRepo.findAll()).thenReturn(List.of());
        when(mapper.toMatrixDto(any(), any(), any())).thenReturn(refreshedDto);

        RoleHierarchyMatrixDto result = service.addRole(new AddRoleRequest(5, "des_tech", "Senior Dev"));

        assertThat(result).isNotNull();
        verify(cellRepo).save(any(MatrixCell.class));

        ArgumentCaptor<RoleHierarchyMutationEvent> eventCaptor = ArgumentCaptor.forClass(RoleHierarchyMutationEvent.class);
        verify(eventPublisher).publishEvent(eventCaptor.capture());
        RoleHierarchyMutationEvent event = eventCaptor.getValue();
        assertThat(event.type()).isEqualTo(RoleHierarchyMutationEventType.ROLE_ADDED);
        assertThat(event.designationId()).isEqualTo("des_tech");
        assertThat(event.roleName()).isEqualTo("Senior Dev");
    }

    @Test
    @DisplayName("updateRole should rename role and publish ROLE_UPDATED event")
    void testUpdateRole() {
        MatrixCell cell = new MatrixCell(5, "des_tech", "Dev");
        when(cellRepo.findById(10L)).thenReturn(Optional.of(cell));
        when(desRepo.findById("des_tech")).thenReturn(Optional.of(new MatrixDesignation("des_tech", "Ministry of Tech", 1)));

        RoleHierarchyMatrixDto refreshedDto = new RoleHierarchyMatrixDto(List.of(), List.of(), Collections.emptyMap());
        when(rankRepo.findAllByOrderByWeightDesc()).thenReturn(List.of());
        when(desRepo.findAllByOrderByPositionAsc()).thenReturn(List.of());
        when(cellRepo.findAll()).thenReturn(List.of());
        when(mapper.toMatrixDto(any(), any(), any())).thenReturn(refreshedDto);

        service.updateRole(10L, "Lead Dev");

        assertThat(cell.getRoleName()).isEqualTo("Lead Dev");
        verify(cellRepo).save(cell);

        ArgumentCaptor<RoleHierarchyMutationEvent> eventCaptor = ArgumentCaptor.forClass(RoleHierarchyMutationEvent.class);
        verify(eventPublisher).publishEvent(eventCaptor.capture());
        assertThat(eventCaptor.getValue().type()).isEqualTo(RoleHierarchyMutationEventType.ROLE_UPDATED);
        assertThat(eventCaptor.getValue().oldRoleName()).isEqualTo("Dev");
        assertThat(eventCaptor.getValue().roleName()).isEqualTo("Lead Dev");
    }

    @Test
    @DisplayName("Modifying or deleting canonical roles Chief High Command and High Command should throw IllegalArgumentException")
    void testCanonicalRoleProtection() {
        MatrixCell chiefCell = new MatrixCell(9, "des_supreme", "Chief High Command");
        when(cellRepo.findById(1L)).thenReturn(Optional.of(chiefCell));

        assertThatThrownBy(() -> service.updateRole(1L, "Supreme Overlord"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Cannot modify canonical role");

        assertThatThrownBy(() -> service.deleteRole(1L))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Cannot delete canonical role");

        MatrixCell hcCell = new MatrixCell(8, "des_supreme", "High Command");
        when(cellRepo.findById(2L)).thenReturn(Optional.of(hcCell));

        assertThatThrownBy(() -> service.updateRole(2L, "Officer"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Cannot modify canonical role");

        assertThatThrownBy(() -> service.deleteRole(2L))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Cannot delete canonical role");
    }

    @Test
    @DisplayName("Modifying or deleting canonical designation des_supreme should throw IllegalArgumentException")
    void testCanonicalDesignationProtection() {
        assertThatThrownBy(() -> service.updateDesignation("des_supreme", new UpdateDesignationRequest("Supreme Council")))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Cannot modify canonical designation: des_supreme");

        assertThatThrownBy(() -> service.deleteDesignation("des_supreme"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Cannot delete canonical designation: des_supreme");
    }

    @Test
    @DisplayName("updateDesignation should update designation and publish DESIGNATION_UPDATED event")
    void testUpdateDesignation() {
        MatrixDesignation tech = new MatrixDesignation("des_tech", "Ministry of Tech", 1);
        when(desRepo.findById("des_tech")).thenReturn(Optional.of(tech));

        RoleHierarchyMatrixDto refreshedDto = new RoleHierarchyMatrixDto(List.of(), List.of(), Collections.emptyMap());
        when(rankRepo.findAllByOrderByWeightDesc()).thenReturn(List.of());
        when(desRepo.findAllByOrderByPositionAsc()).thenReturn(List.of());
        when(cellRepo.findAll()).thenReturn(List.of());
        when(mapper.toMatrixDto(any(), any(), any())).thenReturn(refreshedDto);

        service.updateDesignation("des_tech", new UpdateDesignationRequest("Ministry of Technology"));

        assertThat(tech.getName()).isEqualTo("Ministry of Technology");
        verify(desRepo).save(tech);

        ArgumentCaptor<RoleHierarchyMutationEvent> eventCaptor = ArgumentCaptor.forClass(RoleHierarchyMutationEvent.class);
        verify(eventPublisher).publishEvent(eventCaptor.capture());
        assertThat(eventCaptor.getValue().type()).isEqualTo(RoleHierarchyMutationEventType.DESIGNATION_UPDATED);
        assertThat(eventCaptor.getValue().designationId()).isEqualTo("des_tech");
        assertThat(eventCaptor.getValue().designationName()).isEqualTo("Ministry of Technology");
    }

    @Test
    @DisplayName("Deleting canonical ranks R8 or R9 should throw IllegalArgumentException")
    void testCanonicalRankProtection() {
        assertThatThrownBy(() -> service.deleteRank(8))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Cannot delete canonical rank");

        assertThatThrownBy(() -> service.deleteRank(9))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Cannot delete canonical rank");
    }
}
