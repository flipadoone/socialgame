package com.viaappia.incident.controller;

import com.viaappia.incident.dto.request.LoginRequest;
import com.viaappia.incident.dto.request.RegisterRequest;
import com.viaappia.incident.dto.response.ApiResponse;
import com.viaappia.incident.dto.response.LoginResponse;
import com.viaappia.incident.dto.response.UserResponse;
import com.viaappia.incident.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

/**
 * REST controller responsible for authentication and user registration endpoints.
 */
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @Operation(summary = "Authenticate user and return JWT token")
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponse>> login(@Valid @RequestBody LoginRequest request) {
        LoginResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success("Login successful", response));
    }

    @Operation(summary = "Register a new user")
    @PostMapping("/register")
    public ResponseEntity<ApiResponse<UserResponse>> register(@Valid @RequestBody RegisterRequest request) {
        UserResponse response = authService.register(request);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success("User registered successfully", response));
    }

    @Operation(summary = "Return the authenticated user (validates the token and refreshes roles)")
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserResponse>> me(Authentication authentication) {
        UserResponse response = authService.me(authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Authenticated user", response));
    }
}