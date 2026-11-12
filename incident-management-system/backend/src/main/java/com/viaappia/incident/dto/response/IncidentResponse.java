package com.viaappia.incident.dto.response;

import com.viaappia.incident.entity.enums.IncidentCategory;
import com.viaappia.incident.entity.enums.IncidentPriority;
import com.viaappia.incident.entity.enums.IncidentStatus;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Response payload returned to clients when exposing incident data.
 */
public record IncidentResponse(
        UUID id,
        String title,
        String description,
        IncidentStatus status,
        IncidentPriority priority,
        IncidentCategory category,
        String location,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}