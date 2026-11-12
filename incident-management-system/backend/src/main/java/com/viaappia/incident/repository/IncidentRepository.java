package com.viaappia.incident.repository;

import com.viaappia.incident.entity.Incident;
import com.viaappia.incident.entity.enums.IncidentPriority;
import com.viaappia.incident.entity.enums.IncidentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.UUID;

/**
 * Repository responsible for incident persistence operations.
 */
public interface IncidentRepository
        extends JpaRepository<Incident, UUID>,
                JpaSpecificationExecutor<Incident> {

    long countByStatus(IncidentStatus status);

    long countByPriority(IncidentPriority priority);
}