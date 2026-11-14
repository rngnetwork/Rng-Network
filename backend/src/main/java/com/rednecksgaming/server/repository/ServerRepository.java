// Written By: RachitSWE
// LICENSE: All rights reserved
// Year: 2026
package com.rednecksgaming.server.repository;

import com.rednecksgaming.server.domain.Server;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ServerRepository extends JpaRepository<Server, String> {

    Optional<Server> findBySlug(String slug);

    boolean existsBySlug(String slug);

    default Optional<Server> findByIdOrSlug(String idOrSlug) {
        Optional<Server> byId = findById(idOrSlug);
        if (byId.isPresent()) {
            return byId;
        }
        return findBySlug(idOrSlug);
    }
}
