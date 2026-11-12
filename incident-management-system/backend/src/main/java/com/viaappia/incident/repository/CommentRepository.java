package com.viaappia.incident.repository;

import com.viaappia.incident.entity.Comment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

/**
 * Repository responsible for comment persistence.
 */
public interface CommentRepository
        extends JpaRepository<Comment, UUID> {

    /**
     * Lists comments from oldest to newest.
     *
     * @param incidentId incident identifier
     * @return ordered comments
     */
    List<Comment> findAllByIncidentIdOrderByCreatedAtAsc(
            UUID incidentId
    );
}