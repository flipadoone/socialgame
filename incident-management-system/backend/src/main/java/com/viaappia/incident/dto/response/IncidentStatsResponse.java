package com.viaappia.incident.dto.response;

/**
 * Aggregated incident statistics returned by the API.
 */
public record IncidentStatsResponse(

        long total,

        long open,

        long inProgress,

        long resolved,

        long closed,

        long critical

) {
}