// Written By: RachitSWE
// LICENSE: All rights reserved
// Year: 2026
package com.rednecksgaming.personnel.roles.service;

import com.rednecksgaming.personnel.roles.domain.DesignationRole;
import com.rednecksgaming.personnel.roles.dto.DesignationRolesResponse;
import com.rednecksgaming.personnel.roles.mapper.RoleHierarchyMapper;
import com.rednecksgaming.personnel.roles.repository.DesignationRoleRepository;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
public class DesignationRoleServiceImpl implements DesignationRoleService {

    private final DesignationRoleRepository designationRoleRepo;
    private final RoleHierarchyMapper mapper;

    public DesignationRoleServiceImpl(DesignationRoleRepository designationRoleRepo, RoleHierarchyMapper mapper) {
        this.designationRoleRepo = designationRoleRepo;
        this.mapper = mapper;
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = "personnel:hierarchy:designation-roles", key = "'all'")
    public DesignationRolesResponse getDesignationRoles() {
        List<DesignationRole> records = designationRoleRepo.findAllByOrderByDesignationNameAscRoleNameAsc();
        return mapper.toDesignationRolesResponse(records);
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = "personnel:hierarchy:designation-roles", key = "'map'")
    public Map<String, List<String>> getDesignationRolesMap() {
        List<DesignationRole> records = designationRoleRepo.findAllByOrderByDesignationNameAscRoleNameAsc();
        return records.stream().collect(Collectors.groupingBy(
                DesignationRole::getDesignationName,
                LinkedHashMap::new,
                Collectors.mapping(DesignationRole::getRoleName, Collectors.toList())
        ));
    }

    @Override
    @Transactional(readOnly = true)
    public List<String> getAllDesignations() {
        return designationRoleRepo.findAll().stream()
                .map(DesignationRole::getDesignationName)
                .distinct()
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<String> getRolesForDesignation(String designation) {
        if (designation == null || designation.isBlank()) return List.of();
        String target = designation.trim();
        return designationRoleRepo.findAll().stream()
                .filter(r -> r.getDesignationId().equalsIgnoreCase(target) || r.getDesignationName().equalsIgnoreCase(target))
                .map(DesignationRole::getRoleName)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isValidDesignation(String designation) {
        if (designation == null || designation.isBlank()) return false;
        String target = designation.trim();
        return designationRoleRepo.findAll().stream()
                .anyMatch(r -> r.getDesignationId().equalsIgnoreCase(target) || r.getDesignationName().equalsIgnoreCase(target));
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isValidRoleForDesignation(String designationId, String roleName) {
        if (designationId == null || roleName == null) {
            return false;
        }

        String pureRole = roleName.contains(":") ? roleName.substring(roleName.indexOf(":") + 1).trim() : roleName.trim();
        String targetDes = roleName.contains(":") ? roleName.substring(0, roleName.indexOf(":")).trim() : designationId.trim();

        List<DesignationRole> records = designationRoleRepo.findAll();
        return records.stream().anyMatch(r ->
                (r.getDesignationId().equalsIgnoreCase(targetDes) || r.getDesignationName().equalsIgnoreCase(targetDes))
                        && r.getRoleName().equalsIgnoreCase(pureRole)
        );
    }

    @Override
    @CacheEvict(value = "personnel:hierarchy:designation-roles", allEntries = true)
    public void ensureRoleExists(String designationId, String designationName, String roleName) {
        if (!designationRoleRepo.existsByDesignationIdAndRoleName(designationId, roleName)) {
            designationRoleRepo.save(new DesignationRole(designationId, designationName, roleName));
        }
    }

    @Override
    @CacheEvict(value = "personnel:hierarchy:designation-roles", allEntries = true)
    public void updateRoleName(String designationId, String oldRoleName, String newRoleName) {
        Optional<DesignationRole> existing = designationRoleRepo.findByDesignationIdAndRoleName(designationId, oldRoleName);
        existing.ifPresent(record -> {
            record.setRoleName(newRoleName);
            designationRoleRepo.save(record);
        });
    }

    @Override
    @CacheEvict(value = "personnel:hierarchy:designation-roles", allEntries = true)
    public void updateDesignationName(String designationId, String newDesignationName) {
        List<DesignationRole> records = designationRoleRepo.findAllByDesignationId(designationId);
        for (DesignationRole r : records) {
            r.setDesignationName(newDesignationName);
        }
        designationRoleRepo.saveAll(records);
    }

    @Override
    @CacheEvict(value = "personnel:hierarchy:designation-roles", allEntries = true)
    public void removeRole(String designationId, String roleName) {
        designationRoleRepo.deleteByDesignationIdAndRoleName(designationId, roleName);
    }

    @Override
    @CacheEvict(value = "personnel:hierarchy:designation-roles", allEntries = true)
    public void removeDesignation(String designationId) {
        designationRoleRepo.deleteByDesignationId(designationId);
    }
}
