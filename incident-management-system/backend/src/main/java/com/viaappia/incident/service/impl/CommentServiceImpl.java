package com.viaappia.incident.service.impl;

import com.viaappia.incident.dto.request.CreateCommentRequest;
import com.viaappia.incident.dto.response.CommentResponse;
import com.viaappia.incident.entity.Comment;
import com.viaappia.incident.entity.Incident;
import com.viaappia.incident.exception.ResourceNotFoundException;
import com.viaappia.incident.mapper.CommentMapper;
import com.viaappia.incident.repository.CommentRepository;
import com.viaappia.incident.repository.IncidentRepository;
import com.viaappia.incident.service.CommentService;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * Implements comment business rules.
 */
@Service
@RequiredArgsConstructor
public class CommentServiceImpl implements CommentService {

    private final CommentRepository commentRepository;
    private final IncidentRepository incidentRepository;
    private final CommentMapper commentMapper;

    @Override
    @Transactional
    @CacheEvict(
            value = "commentsByIncident",
            key = "#incidentId"
    )
    public CommentResponse create(
            UUID incidentId,
            CreateCommentRequest request
    ) {
        Incident incident = findIncidentOrThrow(incidentId);

        String authenticatedAuthor =
                getAuthenticatedUsername();

        String normalizedMessage =
                commentMapper.normalizeMessage(
                        request.message()
                );

        Comment comment = new Comment(
                incident,
                authenticatedAuthor,
                normalizedMessage
        );

        Comment savedComment =
                commentRepository.save(comment);

        return commentMapper.toResponse(savedComment);
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(
            value = "commentsByIncident",
            key = "#incidentId"
    )
    public List<CommentResponse> findAllByIncidentId(
            UUID incidentId
    ) {
        /*
         * Validates the incident even when it has no comments.
         * This ensures a nonexistent incident returns HTTP 404.
         */
        findIncidentOrThrow(incidentId);

        return commentRepository
                .findAllByIncidentIdOrderByCreatedAtAsc(
                        incidentId
                )
                .stream()
                .map(commentMapper::toResponse)
                .toList();
    }

    /**
     * Retrieves the incident or raises a consistent 404 error.
     */
    private Incident findIncidentOrThrow(UUID incidentId) {
        return incidentRepository
                .findById(incidentId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Incident not found with id: "
                                        + incidentId
                        )
                );
    }

    /**
     * Obtains the author from Spring Security.
     *
     * The JWT subject in this project is the user's email.
     */
    private String getAuthenticatedUsername() {
        Authentication authentication =
                SecurityContextHolder
                        .getContext()
                        .getAuthentication();

        if (
                authentication == null
                        || !authentication.isAuthenticated()
                        || "anonymousUser".equals(
                                authentication.getPrincipal()
                        )
        ) {
            throw new AccessDeniedException(
                    "Authenticated user is required"
            );
        }

        return authentication.getName();
    }
}