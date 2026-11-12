package com.viaappia.incident.controller;

import com.viaappia.incident.dto.request.CreateIncidentRequest;
import com.viaappia.incident.dto.request.UpdateIncidentRequest;
import com.viaappia.incident.dto.response.ApiResponse;
import com.viaappia.incident.dto.response.IncidentResponse;
import com.viaappia.incident.entity.enums.IncidentCategory;
import com.viaappia.incident.entity.enums.IncidentPriority;
import com.viaappia.incident.entity.enums.IncidentStatus;
import com.viaappia.incident.service.IncidentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * REST controller responsible for authenticated incident management endpoints.
 */
@RestController
@RequestMapping("/api/v1/incidents")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
public class IncidentController {

    private final IncidentService incidentService;

    @Operation(summary = "Create a new incident")
    @PostMapping
    public ResponseEntity<ApiResponse<IncidentResponse>> create(@Valid @RequestBody CreateIncidentRequest request) {
        IncidentResponse response = incidentService.create(request);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success("Incident created successfully", response));
    }

    @Operation(summary = "Find an incident by ID")
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<IncidentResponse>> findById(@PathVariable UUID id) {
        IncidentResponse response = incidentService.findById(id);
        return ResponseEntity.ok(ApiResponse.success("Incident found successfully", response));
    }

    @Operation(summary = "List incidents with optional filters and pagination")
    @GetMapping
    public ResponseEntity<ApiResponse<Page<IncidentResponse>>> findAll(
            @RequestParam(required = false) IncidentStatus status,
            @RequestParam(required = false) IncidentPriority priority,
            @RequestParam(required = false) IncidentCategory category,
            @RequestParam(required = false) String title,
            @ParameterObject Pageable pageable
    ) {
        Page<IncidentResponse> response = incidentService.findAll(status, priority, category, title, pageable);
        return ResponseEntity.ok(ApiResponse.success("Incidents listed successfully", response));
    }

    @Operation(summary = "Update an existing incident")
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<IncidentResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateIncidentRequest request
    ) {
        IncidentResponse response = incidentService.update(id, request);
        return ResponseEntity.ok(ApiResponse.success("Incident updated successfully", response));
    }

    @Operation(summary = "Delete an incident")
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        incidentService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Incident deleted successfully", null));
    }
}