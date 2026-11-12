package com.viaappia.incident.service;

import com.viaappia.incident.dto.request.CreateIncidentRequest;
import com.viaappia.incident.dto.request.UpdateIncidentRequest;
import com.viaappia.incident.dto.response.IncidentResponse;
import com.viaappia.incident.entity.enums.IncidentCategory;
import com.viaappia.incident.entity.enums.IncidentPriority;
import com.viaappia.incident.entity.enums.IncidentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

/**
 * Defines incident use cases available to the application.
 */
public interface IncidentService {

    IncidentResponse create(CreateIncidentRequest request);

    IncidentResponse findById(UUID id);

    Page<IncidentResponse> findAll(
            IncidentStatus status,
            IncidentPriority priority,
            IncidentCategory category,
            String title,
            Pageable pageable
    );

    IncidentResponse update(UUID id, UpdateIncidentRequest request);

    void delete(UUID id);
}