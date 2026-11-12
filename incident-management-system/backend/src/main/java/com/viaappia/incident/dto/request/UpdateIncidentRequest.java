package com.viaappia.incident.dto.request;

import com.viaappia.incident.entity.enums.IncidentCategory;
import com.viaappia.incident.entity.enums.IncidentPriority;
import com.viaappia.incident.entity.enums.IncidentStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Request payload used to update an existing incident.
 */
public record UpdateIncidentRequest(

        @NotBlank(message = "Title is required")
        @Size(max = 120, message = "Title must have at most 120 characters")
        String title,

        @NotBlank(message = "Description is required")
        String description,

        @NotNull(message = "Status is required")
        IncidentStatus status,

        @NotNull(message = "Priority is required")
        IncidentPriority priority,

        @NotNull(message = "Category is required")
        IncidentCategory category,

        @Size(max = 150, message = "Location must have at most 150 characters")
        String location
) {
}