package com.viaappia.incident.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Request payload used to create a comment.
 *
 * The author is obtained from the authenticated user.
 */
public record CreateCommentRequest(

        @NotBlank(message = "Comment message is required")
        @Size(
                max = 2000,
                message = "Comment message must have at most 2000 characters"
        )
        String message

) {
}