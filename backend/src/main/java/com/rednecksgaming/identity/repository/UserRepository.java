package com.rednecksgaming.identity.repository;

import com.rednecksgaming.identity.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    Optional<User> findByGoogleId(String googleId);

    Optional<User> findByDiscordId(String discordId);

    boolean existsByEmail(String email);

    boolean existsByDiscordId(String discordId);
}
