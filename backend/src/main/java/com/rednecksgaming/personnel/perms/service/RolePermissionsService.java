// Written By: RachitSWE
// LICENSE: All rights reserved
// Year: 2026
package com.rednecksgaming.personnel.perms.service;

import com.rednecksgaming.identity.domain.User;
import com.rednecksgaming.personnel.perms.domain.RolePermissions;
import com.rednecksgaming.personnel.perms.dto.EffectivePermissionsDto;
import com.rednecksgaming.personnel.perms.dto.PermsExplorerResponseDto;
import com.rednecksgaming.personnel.perms.dto.PermsFileDto;
import com.rednecksgaming.personnel.perms.dto.PermsFolderDto;
import com.rednecksgaming.personnel.perms.dto.PermsServerSummaryDto;
import com.rednecksgaming.personnel.perms.dto.PreviewRoleOptionDto;
import com.rednecksgaming.personnel.perms.dto.RolePermissionsDto;
import com.rednecksgaming.personnel.perms.dto.UpdateRolePermissionsRequest;
import com.rednecksgaming.personnel.perms.event.RolePermissionsUpdatedEvent;
import com.rednecksgaming.personnel.perms.mapper.RolePermissionsMapper;
import com.rednecksgaming.personnel.perms.repository.RolePermissionsRepository;
import com.rednecksgaming.personnel.roles.domain.MatrixCell;
import com.rednecksgaming.personnel.roles.domain.MatrixDesignation;
import com.rednecksgaming.personnel.roles.repository.MatrixCellRepository;
import com.rednecksgaming.personnel.roles.repository.MatrixDesignationRepository;
import com.rednecksgaming.server.domain.Server;
import com.rednecksgaming.server.repository.ServerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.Objects;
import java.util.Set;

/**
 * Core service managing granular role permissions CRUD, explorer tree projection,
 * multi-role additive union evaluation, and R9/R8 temporary role preview mode.
 */
@Service
public class RolePermissionsService {

    private static final String CACHE_NAME = "personnel:role_perms";

    private final RolePermissionsRepository rolePermissionsRepository;
    private final MatrixDesignationRepository designationRepository;
    private final ServerRepository serverRepository;
    private final RolePermissionsMapper mapper;
    private final PermsSchemaNormalizer schemaNormalizer;
    private final PermsTextFormatter textFormatter;
    private final AdditiveUnionResolver unionResolver;
    private final UserRoleResolutionService roleResolutionService;
    private final CacheManager cacheManager;
    private final ApplicationEventPublisher eventPublisher;
    private final MatrixCellRepository matrixCellRepository;

    public RolePermissionsService(
            RolePermissionsRepository rolePermissionsRepository,
            MatrixDesignationRepository designationRepository,
            ServerRepository serverRepository,
            RolePermissionsMapper mapper,
            PermsSchemaNormalizer schemaNormalizer,
            PermsTextFormatter textFormatter,
            AdditiveUnionResolver unionResolver,
            UserRoleResolutionService roleResolutionService,
            CacheManager cacheManager,
            ApplicationEventPublisher eventPublisher
    ) {
        this(
                rolePermissionsRepository,
                designationRepository,
                serverRepository,
                mapper,
                schemaNormalizer,
                textFormatter,
                unionResolver,
                roleResolutionService,
                cacheManager,
                eventPublisher,
                null
        );
    }

    @Autowired
    public RolePermissionsService(
            RolePermissionsRepository rolePermissionsRepository,
            MatrixDesignationRepository designationRepository,
            ServerRepository serverRepository,
            RolePermissionsMapper mapper,
            PermsSchemaNormalizer schemaNormalizer,
            PermsTextFormatter textFormatter,
            AdditiveUnionResolver unionResolver,
            UserRoleResolutionService roleResolutionService,
            CacheManager cacheManager,
            ApplicationEventPublisher eventPublisher,
            MatrixCellRepository matrixCellRepository
    ) {
        this.rolePermissionsRepository = rolePermissionsRepository;
        this.designationRepository = designationRepository;
        this.serverRepository = serverRepository;
        this.mapper = mapper;
        this.schemaNormalizer = schemaNormalizer;
        this.textFormatter = textFormatter;
        this.unionResolver = unionResolver;
        this.roleResolutionService = roleResolutionService;
        this.cacheManager = cacheManager;
        this.eventPublisher = eventPublisher;
        this.matrixCellRepository = matrixCellRepository;
    }

    /**
     * Lists all persisted role permission configurations sorted by role identifier.
     *
     * @return ordered list of {@link RolePermissionsDto}
     */
    @Transactional(readOnly = true)
    public List<RolePermissionsDto> getAllRolePermissions() {
        Map<String, String> designationNames = loadDesignationNamesById();
        Map<String, String> serverNames = loadServerNamesBySlug(serverRepository.findAll());
        return rolePermissionsRepository.findAll(Sort.by(Sort.Direction.ASC, "roleId")).stream()
                .map(entity -> mapper.toDto(entity, designationNames, serverNames))
                .toList();
    }

    /**
     * Builds the designation-grouped explorer payload with normalized schemas and backend-formatted labels.
     *
     * @return {@link PermsExplorerResponseDto}
     */
    @Transactional(readOnly = true)
    public PermsExplorerResponseDto getExplorer() {
        List<MatrixDesignation> designations = designationRepository.findAllByOrderByPositionAsc();
        Map<String, String> designationNames = new LinkedHashMap<>();
        for (MatrixDesignation md : designations) {
            designationNames.put(md.getId(), md.getName());
        }

        List<Server> servers = serverRepository.findAll();
        List<String> serverSlugs = servers.stream().map(Server::getSlug).toList();
        Map<String, String> serverNames = loadServerNamesBySlug(servers);
        List<PermsServerSummaryDto> serverSummaries = servers.stream()
                .map(s -> new PermsServerSummaryDto(s.getSlug(), s.getName(), buildServerIconUrl(s)))
                .toList();

        List<RolePermissions> allRoles = rolePermissionsRepository.findAll();
        Map<String, List<RolePermissions>> byDesignation = new LinkedHashMap<>();
        for (MatrixDesignation md : designations) {
            byDesignation.put(md.getId(), new ArrayList<>());
        }
        for (RolePermissions rp : allRoles) {
            byDesignation.computeIfAbsent(rp.getDesignationId(), ignored -> new ArrayList<>()).add(rp);
        }

        Comparator<RolePermissions> roleOrder = Comparator
                .comparing((RolePermissions rp) -> rp.getRankWeight() != null ? rp.getRankWeight() : 0)
                .reversed()
                .thenComparing(rp -> rp.getRoleName() != null ? rp.getRoleName() : "");

        Map<String, String> labels = new LinkedHashMap<>();
        List<PermsFolderDto> folders = new ArrayList<>();

        for (Map.Entry<String, List<RolePermissions>> entry : byDesignation.entrySet()) {
            String desId = entry.getKey();
            String desName = designationNames.getOrDefault(desId, desId);
            List<PermsFileDto> files = new ArrayList<>();

            entry.getValue().stream().sorted(roleOrder).forEach(rp -> {
                int weight = rp.getRankWeight() != null ? rp.getRankWeight() : 0;
                Map<String, Object> normalized = schemaNormalizer.normalize(rp.getPermissions(), serverSlugs, weight);
                textFormatter.collectLabelsInto(labels, normalized, serverNames);
                files.add(mapper.toFileDto(rp, normalized, designationNames));
            });

            folders.add(new PermsFolderDto(desId, desName, files));
        }

        return new PermsExplorerResponseDto(folders, serverSummaries, labels);
    }

    /**
     * Fetches a single role's persisted permission configuration by canonical {@code roleId}.
     *
     * @param roleId canonical identifier ({@code designationId:roleName})
     * @return {@link RolePermissionsDto}
     */
    @Transactional(readOnly = true)
    public RolePermissionsDto getRolePermissions(String roleId) {
        RolePermissions entity = rolePermissionsRepository.findById(roleId)
                .orElseThrow(() -> new NoSuchElementException("Role permissions not found: " + roleId));
        Map<String, String> designationNames = loadDesignationNamesById();
        Map<String, String> serverNames = loadServerNamesBySlug(serverRepository.findAll());
        return mapper.toDto(entity, designationNames, serverNames);
    }

    /**
     * Persists updated JSONB permissions for any role with strict optimistic concurrency locking.
     *
     * @param roleId        canonical target role identifier
     * @param request       update payload containing permissions map and expected version
     * @param operatorEmail auditing email of the operator executing the mutation
     * @return updated {@link RolePermissionsDto}
     */
    @Transactional
    public RolePermissionsDto updateRolePermissions(
            String roleId,
            UpdateRolePermissionsRequest request,
            String operatorEmail
    ) {
        RolePermissions entity = rolePermissionsRepository.findById(roleId)
                .orElseThrow(() -> new NoSuchElementException("Role permissions not found: " + roleId));

        if (!Objects.equals(request.version(), entity.getVersion())) {
            throw new OptimisticLockingFailureException(
                    "Version conflict updating permissions for role " + roleId
            );
        }

        entity.setPermissions(new LinkedHashMap<>(request.permissions()));
        entity.setUpdatedBy(operatorEmail);

        RolePermissions saved = rolePermissionsRepository.saveAndFlush(entity);
        eventPublisher.publishEvent(new RolePermissionsUpdatedEvent(roleId, operatorEmail, Instant.now()));

        Map<String, String> designationNames = loadDesignationNamesById();
        Map<String, String> serverNames = loadServerNamesBySlug(serverRepository.findAll());
        return mapper.toDto(saved, designationNames, serverNames);
    }

    /**
     * Resets a role's JSONB permission tree back to its rank-derived canonical default
     * ({@code true} for R9/R8, {@code false} for R7-R0).
     *
     * @param roleId        canonical target role identifier
     * @param operatorEmail auditing email of the operator
     * @return reset {@link RolePermissionsDto}
     */
    @Transactional
    public RolePermissionsDto resetToDefault(String roleId, String operatorEmail) {
        RolePermissions entity = rolePermissionsRepository.findById(roleId)
                .orElseThrow(() -> new NoSuchElementException("Role permissions not found: " + roleId));

        int weight = entity.getRankWeight() != null ? entity.getRankWeight() : 0;
        List<String> serverSlugs = serverRepository.findAll().stream().map(Server::getSlug).toList();
        Map<String, Object> defaultTree = schemaNormalizer.buildDefaultTree(weight >= 8, serverSlugs);

        entity.setPermissions(defaultTree);
        entity.setUpdatedBy(operatorEmail);

        RolePermissions saved = rolePermissionsRepository.saveAndFlush(entity);
        eventPublisher.publishEvent(new RolePermissionsUpdatedEvent(roleId, operatorEmail, Instant.now()));

        Map<String, String> designationNames = loadDesignationNamesById();
        Map<String, String> serverNames = loadServerNamesBySlug(serverRepository.findAll());
        return mapper.toDto(saved, designationNames, serverNames);
    }

    /**
     * Evaluates the caller's effective permission matrix via multi-role additive union,
     * or returns the simulated permissions of {@code previewRoleId} for R9/R8 personnel.
     *
     * @param user          authenticated operator entity
     * @param previewRoleId optional {@code X-Preview-Role-Id} header value
     * @return {@link EffectivePermissionsDto}
     */
    @Transactional(readOnly = true)
    public EffectivePermissionsDto computeEffectivePermissions(User user, String previewRoleId) {
        if (user == null) {
            throw new AccessDeniedException("Unauthenticated caller");
        }

        Set<String> assignedRoleIds = roleResolutionService.resolveRoleIds(user);
        List<RolePermissions> assignedEntities = assignedRoleIds.isEmpty()
                ? List.of()
                : rolePermissionsRepository.findAllByRoleIdIn(assignedRoleIds);
        int callerMaxWeight = roleResolutionService.resolveMaxRankWeight(user, assignedEntities);

        List<String> serverSlugs = serverRepository.findAll().stream().map(Server::getSlug).toList();

        if (previewRoleId != null && !previewRoleId.isBlank()) {
            if (callerMaxWeight < 8) {
                throw new AccessDeniedException("Role preview mode is restricted to R9 and R8 personnel");
            }
            String trimmedPreviewId = previewRoleId.trim();
            RolePermissions previewEntity = rolePermissionsRepository.findById(trimmedPreviewId)
                    .orElseThrow(() -> new NoSuchElementException("Preview role not found: " + trimmedPreviewId));

            int previewWeight = previewEntity.getRankWeight() != null ? previewEntity.getRankWeight() : 0;
            Map<String, Object> previewTree = getCachedOrPutPermissions(previewEntity);
            Map<String, Object> normalizedPreview = schemaNormalizer.normalize(previewTree, serverSlugs, previewWeight);

            return new EffectivePermissionsDto(
                    String.valueOf(user.getId()),
                    Set.of(previewEntity.getRoleId()),
                    true,
                    previewEntity.getRoleId(),
                    previewEntity.getRoleName(),
                    callerMaxWeight,
                    normalizedPreview
            );
        }

        List<Map<String, Object>> roleTrees = new ArrayList<>();
        for (RolePermissions entity : assignedEntities) {
            roleTrees.add(getCachedOrPutPermissions(entity));
        }

        Map<String, Object> unionTree = unionResolver.computeUnion(roleTrees);
        Map<String, Object> normalizedEffective = schemaNormalizer.normalize(unionTree, serverSlugs, callerMaxWeight);

        return new EffectivePermissionsDto(
                String.valueOf(user.getId()),
                assignedRoleIds,
                false,
                null,
                null,
                callerMaxWeight,
                normalizedEffective
        );
    }

    /**
     * Lists all selectable roles for temporary preview mode (R9/R8 personnel only).
     *
     * @param user authenticated operator entity
     * @return sorted list of {@link PreviewRoleOptionDto}
     */
    @Transactional(readOnly = true)
    public List<PreviewRoleOptionDto> getPreviewRoleOptions(User user) {
        if (user == null) {
            throw new AccessDeniedException("Unauthenticated caller");
        }
        Set<String> assignedRoleIds = roleResolutionService.resolveRoleIds(user);
        List<RolePermissions> assignedEntities = assignedRoleIds.isEmpty()
                ? List.of()
                : rolePermissionsRepository.findAllByRoleIdIn(assignedRoleIds);
        int callerMaxWeight = roleResolutionService.resolveMaxRankWeight(user, assignedEntities);

        if (callerMaxWeight < 8) {
            throw new AccessDeniedException("Role preview options are restricted to R9 and R8 personnel");
        }

        Map<String, String> designationNames = loadDesignationNamesById();
        Comparator<RolePermissions> order = Comparator
                .comparing((RolePermissions rp) -> rp.getRankWeight() != null ? rp.getRankWeight() : 0)
                .reversed()
                .thenComparing(rp -> rp.getDesignationId() != null ? rp.getDesignationId() : "")
                .thenComparing(rp -> rp.getRoleName() != null ? rp.getRoleName() : "");

        return rolePermissionsRepository.findAll().stream()
                .sorted(order)
                .map(rp -> mapper.toPreviewOptionDto(rp, designationNames))
                .toList();
    }

    /**
     * Resolves an operator or target user's authoritative maximum rank weight from
     * persisted {@link RolePermissions} (with legacy fallback when no rows match).
     *
     * @param user target user entity
     * @return effective rank weight (0-9)
     */
    @Transactional(readOnly = true)
    public int resolveUserRankWeight(User user) {
        if (user == null) {
            return 0;
        }
        Set<String> assignedRoleIds = roleResolutionService.resolveRoleIds(user);
        List<RolePermissions> assignedEntities = assignedRoleIds.isEmpty()
                ? List.of()
                : rolePermissionsRepository.findAllByRoleIdIn(assignedRoleIds);
        return roleResolutionService.resolveMaxRankWeight(user, assignedEntities);
    }

    /**
     * Returns a lookup map of {@code "DesignationName:RoleName"} -> persisted {@code rankWeight}
     * for dynamic whitelist hierarchy checks.
     *
     * @return ordered map of display-scoped role tokens to numeric rank weights
     */
    @Transactional(readOnly = true)
    public Map<String, Integer> getHierarchyRankWeights() {
        Map<String, String> designationNames = loadDesignationNamesById();
        Map<String, Integer> weights = new LinkedHashMap<>();
        if (matrixCellRepository != null) {
            for (MatrixCell cell : matrixCellRepository.findAll()) {
                if (cell.getDesignationId() == null || cell.getRoleName() == null) {
                    continue;
                }
                String desName = designationNames.getOrDefault(cell.getDesignationId(), cell.getDesignationId());
                int weight = cell.getRankWeight() != null ? cell.getRankWeight() : 0;
                weights.put(desName + ":" + cell.getRoleName(), weight);
            }
        }
        for (RolePermissions rp : rolePermissionsRepository.findAll()) {
            if (rp.getDesignationId() == null || rp.getRoleName() == null) {
                continue;
            }
            String desName = designationNames.getOrDefault(rp.getDesignationId(), rp.getDesignationId());
            int weight = rp.getRankWeight() != null ? rp.getRankWeight() : 0;
            weights.putIfAbsent(desName + ":" + rp.getRoleName(), weight);
        }
        return weights;
    }

    /**
     * Computes the maximum numeric rank weight across arbitrary requested role tokens
     * (supporting {@code DesignationName:RoleName}, {@code designationId:roleName}, and unprefixed names).
     *
     * @param rawRoleTokens raw role tokens from a whitelist create/update payload
     * @return highest resolved rank weight across the tokens
     */
    @Transactional(readOnly = true)
    public int resolveRoleTokensMaxRankWeight(Collection<String> rawRoleTokens) {
        if (rawRoleTokens == null || rawRoleTokens.isEmpty()) {
            return 0;
        }
        Map<String, String> designationNamesById = loadDesignationNamesById();
        Map<String, String> nameToId = new LinkedHashMap<>();
        for (Map.Entry<String, String> entry : designationNamesById.entrySet()) {
            if (entry.getKey() != null) {
                nameToId.put(entry.getKey().toLowerCase(Locale.ROOT), entry.getKey());
            }
            if (entry.getValue() != null) {
                nameToId.put(entry.getValue().toLowerCase(Locale.ROOT), entry.getKey());
            }
        }
        List<MatrixCell> allCells = matrixCellRepository != null ? matrixCellRepository.findAll() : List.of();
        List<RolePermissions> allRoles = rolePermissionsRepository.findAll();

        Integer maxWeight = null;
        for (String raw : rawRoleTokens) {
            if (raw == null || raw.isBlank()) {
                continue;
            }
            String trimmed = raw.trim();
            Integer resolvedWeight = resolveSingleTokenWeight(trimmed, nameToId, allCells, allRoles);
            int weight = resolvedWeight != null ? resolvedWeight : User.getRoleRankWeight(trimmed);
            maxWeight = maxWeight == null ? weight : Math.max(maxWeight, weight);
        }
        return maxWeight != null ? maxWeight : 0;
    }

    private Integer resolveSingleTokenWeight(
            String trimmed,
            Map<String, String> nameToId,
            List<MatrixCell> allCells,
            List<RolePermissions> allRoles
    ) {
        if (trimmed.contains(":")) {
            int colonIdx = trimmed.indexOf(':');
            String prefix = trimmed.substring(0, colonIdx).trim();
            String roleName = trimmed.substring(colonIdx + 1).trim();
            if (roleName.isEmpty()) {
                return null;
            }
            String targetDesId = nameToId.getOrDefault(prefix.toLowerCase(Locale.ROOT), prefix);
            for (MatrixCell cell : allCells) {
                if (cell.getDesignationId() != null
                        && cell.getDesignationId().equalsIgnoreCase(targetDesId)
                        && cell.getRoleName() != null
                        && cell.getRoleName().equalsIgnoreCase(roleName)
                        && cell.getRankWeight() != null) {
                    return cell.getRankWeight();
                }
            }
            for (RolePermissions rp : allRoles) {
                if (rp.getDesignationId() != null
                        && rp.getDesignationId().equalsIgnoreCase(targetDesId)
                        && rp.getRoleName() != null
                        && rp.getRoleName().equalsIgnoreCase(roleName)) {
                    return rp.getRankWeight() != null ? rp.getRankWeight() : 0;
                }
            }
            return null;
        }
        Integer highest = null;
        for (MatrixCell cell : allCells) {
            if (cell.getRoleName() != null && cell.getRoleName().equalsIgnoreCase(trimmed) && cell.getRankWeight() != null) {
                highest = highest == null ? cell.getRankWeight() : Math.max(highest, cell.getRankWeight());
            }
        }
        if (highest != null) {
            return highest;
        }
        for (RolePermissions rp : allRoles) {
            if (rp.getRoleName() != null && rp.getRoleName().equalsIgnoreCase(trimmed)) {
                int w = rp.getRankWeight() != null ? rp.getRankWeight() : 0;
                highest = highest == null ? w : Math.max(highest, w);
            }
        }
        return highest;
    }

    private Map<String, Object> getCachedOrPutPermissions(RolePermissions entity) {
        Cache cache = cacheManager != null ? cacheManager.getCache(CACHE_NAME) : null;
        if (cache != null) {
            Cache.ValueWrapper wrapper = cache.get(entity.getRoleId());
            if (wrapper != null && wrapper.get() instanceof Map<?, ?> cachedMap) {
                return copyStringKeyedMap(cachedMap);
            }
        }
        Map<String, Object> perms = entity.getPermissions() != null ? entity.getPermissions() : Map.of();
        if (cache != null) {
            cache.put(entity.getRoleId(), perms);
        }
        return perms;
    }

    private Map<String, Object> copyStringKeyedMap(Map<?, ?> source) {
        Map<String, Object> copy = new LinkedHashMap<>();
        for (Map.Entry<?, ?> entry : source.entrySet()) {
            if (entry.getKey() instanceof String k && entry.getValue() != null) {
                copy.put(k, entry.getValue());
            }
        }
        return copy;
    }

    private Map<String, String> loadDesignationNamesById() {
        Map<String, String> map = new LinkedHashMap<>();
        for (MatrixDesignation md : designationRepository.findAllByOrderByPositionAsc()) {
            map.put(md.getId(), md.getName());
        }
        return map;
    }

    private Map<String, String> loadServerNamesBySlug(List<Server> servers) {
        Map<String, String> map = new LinkedHashMap<>();
        for (Server server : servers) {
            if (server.getSlug() != null && server.getName() != null) {
                map.put(server.getSlug(), server.getName());
            }
        }
        return map;
    }

    private String buildServerIconUrl(Server server) {
        if (server.getId() == null || server.getIconHash() == null || server.getIconHash().isBlank()) {
            return null;
        }
        String ext = server.getIconHash().startsWith("a_") ? "gif" : "png";
        return "https://cdn.discordapp.com/icons/" + server.getId() + "/" + server.getIconHash() + "." + ext;
    }
}
