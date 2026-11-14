// Written By: RachitSWE
// LICENSE: All rights reserved
// Year: 2026
package com.rednecksgaming.embed.repository;

import com.rednecksgaming.embed.domain.DispatchLog;
import com.rednecksgaming.embed.domain.DispatchStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Spring Data MongoDB repository for DispatchLog documents.
 */
@Repository
public interface DispatchLogRepository extends MongoRepository<DispatchLog, String> {

    Optional<DispatchLog> findByDispatchId(String dispatchId);

    Page<DispatchLog> findByServerIdOrderByTimestampDesc(String serverId, Pageable pageable);

    Page<DispatchLog> findByServerIdAndStatusOrderByTimestampDesc(String serverId, DispatchStatus status, Pageable pageable);

    Page<DispatchLog> findByUserIdOrderByTimestampDesc(String userId, Pageable pageable);

    Page<DispatchLog> findByStatusOrderByTimestampDesc(DispatchStatus status, Pageable pageable);

    long countByStatus(DispatchStatus status);
}
