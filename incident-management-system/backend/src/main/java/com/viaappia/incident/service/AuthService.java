package com.viaappia.incident.service;

import com.viaappia.incident.dto.request.LoginRequest;
import com.viaappia.incident.dto.request.RegisterRequest;
import com.viaappia.incident.dto.response.LoginResponse;
import com.viaappia.incident.dto.response.UserResponse;

/**
 * Defines authentication and user registration use cases.
 */
public interface AuthService {

    LoginResponse login(LoginRequest request);

    UserResponse register(RegisterRequest request);

    /** Returns the current data (including roles) of the user identified by e-mail. */
    UserResponse me(String email);
}