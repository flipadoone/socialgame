package com.viaappia.incident.service;

import com.viaappia.incident.dto.response.IncidentStatsResponse;

/**
 * Defines incident statistics use cases.
 */
public interface IncidentStatsService {

    IncidentStatsResponse getStats();
}