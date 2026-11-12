package com.viaappia.incident.mapper;

import com.viaappia.incident.dto.request.CreateIncidentRequest;
import com.viaappia.incident.dto.request.UpdateIncidentRequest;
import com.viaappia.incident.dto.response.IncidentResponse;
import com.viaappia.incident.entity.Incident;
import com.viaappia.incident.entity.enums.IncidentStatus;
import org.springframework.stereotype.Component;

/**
 * Converts incident entities to DTOs and DTOs to entities.
 */
@Component
public class IncidentMapper {

    public Incident toEntity(CreateIncidentRequest request) {
        return Incident.builder()
                .title(request.title())
                .description(request.description())
                .priority(request.priority())
                .category(request.category())
                .location(request.location())
                .status(IncidentStatus.OPEN)
                .build();
    }

    public void updateEntity(Incident incident, UpdateIncidentRequest request) {
        incident.setTitle(request.title());
        incident.setDescription(request.description());
        incident.setStatus(request.status());
        incident.setPriority(request.priority());
        incident.setCategory(request.category());
        incident.setLocation(request.location());
    }

    public IncidentResponse toResponse(Incident incident) {
        return new IncidentResponse(
                incident.getId(),
                incident.getTitle(),
                incident.getDescription(),
                incident.getStatus(),
                incident.getPriority(),
                incident.getCategory(),
                incident.getLocation(),
                incident.getCreatedAt(),
                incident.getUpdatedAt()
        );
    }
}