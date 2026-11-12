package com.viaappia.incident.mapper;

import com.viaappia.incident.dto.response.CommentResponse;
import com.viaappia.incident.entity.Comment;
import org.springframework.stereotype.Component;

/**
 * Centralizes mappings related to comments.
 */
@Component
public class CommentMapper {

    /**
     * Creates a response DTO from the comment entity.
     *
     * @param comment comment entity
     * @return comment response
     */
    public CommentResponse toResponse(Comment comment) {
        return new CommentResponse(
                comment.getId(),
                comment.getIncident().getId(),
                comment.getAuthor(),
                comment.getMessage(),
                comment.getCreatedAt()
        );
    }

    /**
     * Normalizes comment messages before persistence.
     *
     * @param message original message
     * @return normalized message
     */
    public String normalizeMessage(String message) {
        if (message == null) {
            return null;
        }

        return message.trim();
    }
}