package com.viaappia.incident.dto.response;

/**
 * Response payload returned after successful authentication.
 */
public record LoginResponse(
        String token,
        String tokenType,
        UserResponse user
) {
}