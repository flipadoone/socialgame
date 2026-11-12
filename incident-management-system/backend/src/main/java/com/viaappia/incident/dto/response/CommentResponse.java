package com.viaappia.incident.dto.response;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Comment information returned by the API.
 */
public record CommentResponse(

        UUID id,

        UUID incidentId,

        String author,

        String message,

        LocalDateTime createdAt

) {
}