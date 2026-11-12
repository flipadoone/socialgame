package com.viaappia.incident.specification;

import com.viaappia.incident.entity.Incident;
import com.viaappia.incident.entity.enums.IncidentCategory;
import com.viaappia.incident.entity.enums.IncidentPriority;
import com.viaappia.incident.entity.enums.IncidentStatus;
import org.springframework.data.jpa.domain.Specification;

/**
 * Provides dynamic filters for incident search.
 */
public final class IncidentSpecification {

    private IncidentSpecification() {
    }

    public static Specification<Incident> hasStatus(IncidentStatus status) {
        return (root, query, criteriaBuilder) ->
                status == null ? null : criteriaBuilder.equal(root.get("status"), status);
    }

    public static Specification<Incident> hasPriority(IncidentPriority priority) {
        return (root, query, criteriaBuilder) ->
                priority == null ? null : criteriaBuilder.equal(root.get("priority"), priority);
    }

    public static Specification<Incident> hasCategory(IncidentCategory category) {
        return (root, query, criteriaBuilder) ->
                category == null ? null : criteriaBuilder.equal(root.get("category"), category);
    }

    public static Specification<Incident> titleContains(String title) {
        return (root, query, criteriaBuilder) ->
                title == null || title.isBlank()
                        ? null
                        : criteriaBuilder.like(criteriaBuilder.lower(root.get("title")), "%" + title.toLowerCase() + "%");
    }
}