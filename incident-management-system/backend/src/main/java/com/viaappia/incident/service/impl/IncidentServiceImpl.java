package com.viaappia.incident.service.impl;

import com.viaappia.incident.dto.request.CreateIncidentRequest;
import com.viaappia.incident.dto.request.UpdateIncidentRequest;
import com.viaappia.incident.dto.response.IncidentResponse;
import com.viaappia.incident.entity.Incident;
import com.viaappia.incident.entity.enums.IncidentCategory;
import com.viaappia.incident.entity.enums.IncidentPriority;
import com.viaappia.incident.entity.enums.IncidentStatus;
import com.viaappia.incident.exception.ResourceNotFoundException;
import com.viaappia.incident.mapper.IncidentMapper;
import com.viaappia.incident.repository.IncidentRepository;
import com.viaappia.incident.service.IncidentService;
import com.viaappia.incident.specification.IncidentSpecification;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * Implements incident business rules and coordinates persistence operations.
 */
@Service
@RequiredArgsConstructor
public class IncidentServiceImpl implements IncidentService {

    private final IncidentRepository incidentRepository;
    private final IncidentMapper incidentMapper;

    @Override
    @Transactional
    @CacheEvict(value = "incidents", allEntries = true)
    public IncidentResponse create(CreateIncidentRequest request) {
        Incident incident = incidentMapper.toEntity(request);
        Incident savedIncident = incidentRepository.save(incident);
        return incidentMapper.toResponse(savedIncident);
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = "incidentById", key = "#id")
    public IncidentResponse findById(UUID id) {
        Incident incident = findIncidentOrThrow(id);
        return incidentMapper.toResponse(incident);
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = "incidents")
    public Page<IncidentResponse> findAll(
            IncidentStatus status,
            IncidentPriority priority,
            IncidentCategory category,
            String title,
            Pageable pageable
    ) {
        Specification<Incident> specification = Specification
                .where(IncidentSpecification.hasStatus(status))
                .and(IncidentSpecification.hasPriority(priority))
                .and(IncidentSpecification.hasCategory(category))
                .and(IncidentSpecification.titleContains(title));

        return incidentRepository.findAll(specification, pageable)
                .map(incidentMapper::toResponse);
    }

    @Override
    @Transactional
    @CacheEvict(value = {"incidents", "incidentById"}, allEntries = true)
    public IncidentResponse update(UUID id, UpdateIncidentRequest request) {
        Incident incident = findIncidentOrThrow(id);
        incidentMapper.updateEntity(incident, request);
        Incident updatedIncident = incidentRepository.save(incident);
        return incidentMapper.toResponse(updatedIncident);
    }

    @Override
    @Transactional
    @CacheEvict(value = {"incidents", "incidentById"}, allEntries = true)
    public void delete(UUID id) {
        Incident incident = findIncidentOrThrow(id);
        incidentRepository.delete(incident);
    }

    private Incident findIncidentOrThrow(UUID id) {
        return incidentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Incident not found with id: " + id));
    }
}