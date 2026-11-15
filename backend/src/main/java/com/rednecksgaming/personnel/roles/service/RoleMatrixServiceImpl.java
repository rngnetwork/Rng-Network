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
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class RoleMatrixServiceImpl implements RoleMatrixService {

    private final MatrixRankRepository rankRepo;
    private final MatrixDesignationRepository desRepo;
    private final MatrixCellRepository cellRepo;
    private final RoleHierarchyMapper mapper;
    private final ApplicationEventPublisher eventPublisher;

    public RoleMatrixServiceImpl(
            MatrixRankRepository rankRepo,
            MatrixDesignationRepository desRepo,
            MatrixCellRepository cellRepo,
            RoleHierarchyMapper mapper,
            ApplicationEventPublisher eventPublisher
    ) {
        this.rankRepo = rankRepo;
        this.desRepo = desRepo;
        this.cellRepo = cellRepo;
        this.mapper = mapper;
        this.eventPublisher = eventPublisher;
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = "personnel:hierarchy:matrix", key = "'full'")
    public RoleHierarchyMatrixDto getFullMatrix() {
        List<MatrixRank> ranks = rankRepo.findAllByOrderByWeightDesc();
        List<MatrixDesignation> designations = desRepo.findAllByOrderByPositionAsc();
        List<MatrixCell> cells = cellRepo.findAll();
        return mapper.toMatrixDto(ranks, designations, cells);
    }

    @Override
    @CacheEvict(value = {"personnel:hierarchy:matrix", "personnel:hierarchy:designation-roles"}, allEntries = true)
    public RoleHierarchyMatrixDto addRole(AddRoleRequest req) {
        if (!rankRepo.existsById(req.rankWeight())) {
            throw new IllegalArgumentException("Rank not found: " + req.rankWeight());
        }

        MatrixDesignation des = desRepo.findById(req.designationId())
                .orElseThrow(() -> new IllegalArgumentException("Designation not found: " + req.designationId()));

        if (cellRepo.existsByRankWeightAndDesignationIdAndRoleName(req.rankWeight(), req.designationId(), req.name())) {
            throw new IllegalArgumentException("Role already exists in cell");
        }

        MatrixCell cell = new MatrixCell(req.rankWeight(), req.designationId(), req.name().trim());
        cellRepo.save(cell);

        eventPublisher.publishEvent(new RoleHierarchyMutationEvent(
                RoleHierarchyMutationEventType.ROLE_ADDED,
                des.getId(),
                des.getName(),
                req.name().trim(),
                null
        ));

        return getFullMatrix();
    }

    @Override
    @CacheEvict(value = {"personnel:hierarchy:matrix", "personnel:hierarchy:designation-roles"}, allEntries = true)
    public RoleHierarchyMatrixDto updateRole(Long roleId, String newName) {
        MatrixCell cell = cellRepo.findById(roleId)
                .orElseThrow(() -> new IllegalArgumentException("Role cell not found: " + roleId));

        if ("Chief High Command".equalsIgnoreCase(cell.getRoleName()) || "High Command".equalsIgnoreCase(cell.getRoleName())) {
            throw new IllegalArgumentException("Cannot modify canonical role: " + cell.getRoleName());
        }

        String oldName = cell.getRoleName();
        cell.setRoleName(newName.trim());
        cellRepo.save(cell);

        MatrixDesignation des = desRepo.findById(cell.getDesignationId()).orElse(null);
        String desName = des != null ? des.getName() : cell.getDesignationId();

        eventPublisher.publishEvent(new RoleHierarchyMutationEvent(
                RoleHierarchyMutationEventType.ROLE_UPDATED,
                cell.getDesignationId(),
                desName,
                newName.trim(),
                oldName
        ));

        return getFullMatrix();
    }

    @Override
    @CacheEvict(value = {"personnel:hierarchy:matrix", "personnel:hierarchy:designation-roles"}, allEntries = true)
    public RoleHierarchyMatrixDto deleteRole(Long roleId) {
        MatrixCell cell = cellRepo.findById(roleId)
                .orElseThrow(() -> new IllegalArgumentException("Role cell not found: " + roleId));

        if ("Chief High Command".equalsIgnoreCase(cell.getRoleName()) || "High Command".equalsIgnoreCase(cell.getRoleName())) {
            throw new IllegalArgumentException("Cannot delete canonical role: " + cell.getRoleName());
        }

        String roleName = cell.getRoleName();
        String designationId = cell.getDesignationId();
        cellRepo.deleteById(roleId);

        MatrixDesignation des = desRepo.findById(designationId).orElse(null);
        String desName = des != null ? des.getName() : designationId;

        eventPublisher.publishEvent(new RoleHierarchyMutationEvent(
                RoleHierarchyMutationEventType.ROLE_DELETED,
                designationId,
                desName,
                roleName,
                null
        ));

        return getFullMatrix();
    }

    @Override
    @CacheEvict(value = {"personnel:hierarchy:matrix", "personnel:hierarchy:designation-roles"}, allEntries = true)
    public RoleHierarchyMatrixDto addDesignation(AddDesignationRequest req) {
        String slug = "des_" + req.name().toLowerCase().replaceAll("[^a-z0-9]+", "_").replaceAll("^_+|_+$", "");
        if (desRepo.existsById(slug)) {
            throw new IllegalArgumentException("Designation with ID '" + slug + "' already exists");
        }

        int position = (int) desRepo.count();
        desRepo.save(new MatrixDesignation(slug, req.name().trim(), position));

        return getFullMatrix();
    }

    @Override
    @CacheEvict(value = {"personnel:hierarchy:matrix", "personnel:hierarchy:designation-roles"}, allEntries = true)
    public RoleHierarchyMatrixDto updateDesignation(String designationId, UpdateDesignationRequest req) {
        if ("des_supreme".equalsIgnoreCase(designationId)) {
            throw new IllegalArgumentException("Cannot modify canonical designation: des_supreme");
        }

        MatrixDesignation des = desRepo.findById(designationId)
                .orElseThrow(() -> new IllegalArgumentException("Designation not found: " + designationId));

        des.setName(req.name().trim());
        desRepo.save(des);

        eventPublisher.publishEvent(new RoleHierarchyMutationEvent(
                RoleHierarchyMutationEventType.DESIGNATION_UPDATED,
                designationId,
                req.name().trim(),
                null,
                null
        ));

        return getFullMatrix();
    }

    @Override
    @CacheEvict(value = {"personnel:hierarchy:matrix", "personnel:hierarchy:designation-roles"}, allEntries = true)
    public RoleHierarchyMatrixDto deleteDesignation(String designationId) {
        if ("des_supreme".equalsIgnoreCase(designationId)) {
            throw new IllegalArgumentException("Cannot delete canonical designation: des_supreme");
        }

        MatrixDesignation des = desRepo.findById(designationId)
                .orElseThrow(() -> new IllegalArgumentException("Designation not found: " + designationId));

        cellRepo.deleteByDesignationId(designationId);
        desRepo.deleteById(designationId);

        eventPublisher.publishEvent(new RoleHierarchyMutationEvent(
                RoleHierarchyMutationEventType.DESIGNATION_DELETED,
                designationId,
                des.getName(),
                null,
                null
        ));

        return getFullMatrix();
    }

    @Override
    @CacheEvict(value = {"personnel:hierarchy:matrix", "personnel:hierarchy:designation-roles"}, allEntries = true)
    public RoleHierarchyMatrixDto addRank(AddRankRequest req) {
        if (rankRepo.existsById(req.weight())) {
            throw new IllegalArgumentException("Rank with weight " + req.weight() + " already exists");
        }

        rankRepo.save(new MatrixRank(req.weight(), req.code().trim()));
        return getFullMatrix();
    }

    @Override
    @CacheEvict(value = {"personnel:hierarchy:matrix", "personnel:hierarchy:designation-roles"}, allEntries = true)
    public RoleHierarchyMatrixDto updateRank(Integer rankWeight, UpdateRankRequest req) {
        MatrixRank rank = rankRepo.findById(rankWeight)
                .orElseThrow(() -> new IllegalArgumentException("Rank not found: " + rankWeight));

        rank.setCode(req.code().trim());
        rankRepo.save(rank);

        return getFullMatrix();
    }

    @Override
    @CacheEvict(value = {"personnel:hierarchy:matrix", "personnel:hierarchy:designation-roles"}, allEntries = true)
    public RoleHierarchyMatrixDto deleteRank(Integer rankWeight) {
        if (rankWeight != null && (rankWeight == 8 || rankWeight == 9)) {
            throw new IllegalArgumentException("Cannot delete canonical rank tier: " + rankWeight);
        }

        if (!rankRepo.existsById(rankWeight)) {
            throw new IllegalArgumentException("Rank not found: " + rankWeight);
        }

        cellRepo.deleteByRankWeight(rankWeight);
        rankRepo.deleteById(rankWeight);

        return getFullMatrix();
    }
}
