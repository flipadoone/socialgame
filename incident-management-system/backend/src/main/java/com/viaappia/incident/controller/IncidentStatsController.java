package com.viaappia.incident.controller;

import com.viaappia.incident.dto.response.ApiResponse;
import com.viaappia.incident.dto.response.IncidentStatsResponse;
import com.viaappia.incident.service.IncidentStatsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST controller responsible for incident statistics.
 */
@RestController
@RequestMapping("/api/v1/stats/incidents")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
public class IncidentStatsController {

    private final IncidentStatsService incidentStatsService;

    @Operation(
            summary = "Get incident statistics",
            description =
                    "Returns aggregated counts by status and priority."
    )
    @GetMapping
    public ResponseEntity<
            ApiResponse<IncidentStatsResponse>
    > getStats() {
        IncidentStatsResponse response =
                incidentStatsService.getStats();

        return ResponseEntity.ok(
                ApiResponse.success(
                        "Incident statistics retrieved successfully",
                        response
                )
        );
    }
}