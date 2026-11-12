package com.viaappia.incident.dto.response;

import java.util.Set;
import java.util.UUID;

/**
 * Response payload used to expose safe user information.
 */
public record UserResponse(
        UUID id,
        String name,
        String email,
        Boolean active,
        Set<String> roles
) {
}