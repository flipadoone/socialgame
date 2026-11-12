package com.viaappia.incident.repository;

import com.viaappia.incident.entity.Role;
import com.viaappia.incident.entity.enums.RoleName;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

/**
 * Repository responsible for role persistence operations.
 */
public interface RoleRepository extends JpaRepository<Role, UUID> {

    Optional<Role> findByName(RoleName name);
}