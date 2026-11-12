package com.viaappia.incident.controller;

import com.viaappia.incident.dto.request.CreateCommentRequest;
import com.viaappia.incident.dto.response.ApiResponse;
import com.viaappia.incident.dto.response.CommentResponse;
import com.viaappia.incident.service.CommentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * REST controller responsible for incident comments.
 */
@RestController
@RequestMapping(
        "/api/v1/incidents/{incidentId}/comments"
)
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
public class CommentController {

    private final CommentService commentService;

    @Operation(
            summary = "Create a comment for an incident",
            description =
                    "The comment author is obtained from the authenticated user."
    )
    @PostMapping
    public ResponseEntity<ApiResponse<CommentResponse>> create(
            @PathVariable UUID incidentId,
            @Valid @RequestBody CreateCommentRequest request
    ) {
        CommentResponse response =
                commentService.create(
                        incidentId,
                        request
                );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(
                        ApiResponse.success(
                                "Comment created successfully",
                                response
                        )
                );
    }

    @Operation(
            summary = "List comments from an incident"
    )
    @GetMapping
    public ResponseEntity<
            ApiResponse<List<CommentResponse>>
    > findAllByIncidentId(
            @PathVariable UUID incidentId
    ) {
        List<CommentResponse> response =
                commentService.findAllByIncidentId(
                        incidentId
                );

        return ResponseEntity.ok(
                ApiResponse.success(
                        "Comments listed successfully",
                        response
                )
        );
    }
}