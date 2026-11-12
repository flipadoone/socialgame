package com.viaappia.incident.service.impl;

import com.viaappia.incident.dto.response.IncidentStatsResponse;
import com.viaappia.incident.entity.enums.IncidentPriority;
import com.viaappia.incident.entity.enums.IncidentStatus;
import com.viaappia.incident.repository.IncidentRepository;
import com.viaappia.incident.service.IncidentStatsService;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Implements incident statistics aggregation.
 */
@Service
@RequiredArgsConstructor
public class IncidentStatsServiceImpl
        implements IncidentStatsService {

    private final IncidentRepository incidentRepository;

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = "stats")
    public IncidentStatsResponse getStats() {
        long total = incidentRepository.count();

        long open = incidentRepository.countByStatus(
                IncidentStatus.OPEN
        );

        long inProgress = incidentRepository.countByStatus(
                IncidentStatus.IN_PROGRESS
        );

        long resolved = incidentRepository.countByStatus(
                IncidentStatus.RESOLVED
        );

        long closed = incidentRepository.countByStatus(
                IncidentStatus.CLOSED
        );

        long critical = incidentRepository.countByPriority(
                IncidentPriority.CRITICAL
        );

        return new IncidentStatsResponse(
                total,
                open,
                inProgress,
                resolved,
                closed,
                critical
        );
    }
}