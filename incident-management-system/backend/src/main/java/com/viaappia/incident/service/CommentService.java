package com.viaappia.incident.service;

import com.viaappia.incident.dto.request.CreateCommentRequest;
import com.viaappia.incident.dto.response.CommentResponse;

import java.util.List;
import java.util.UUID;

/**
 * Defines the comment use cases available to the application.
 */
public interface CommentService {

    /**
     * Creates a comment for an incident.
     *
     * @param incidentId incident identifier
     * @param request comment payload
     * @return created comment
     */
    CommentResponse create(
            UUID incidentId,
            CreateCommentRequest request
    );

    /**
     * Lists all comments associated with an incident.
     *
     * @param incidentId incident identifier
     * @return incident comments
     */
    List<CommentResponse> findAllByIncidentId(
            UUID incidentId
    );
}