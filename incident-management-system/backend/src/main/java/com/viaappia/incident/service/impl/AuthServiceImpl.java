package com.viaappia.incident.service.impl;

import com.viaappia.incident.dto.request.LoginRequest;
import com.viaappia.incident.dto.request.RegisterRequest;
import com.viaappia.incident.dto.response.LoginResponse;
import com.viaappia.incident.dto.response.UserResponse;
import com.viaappia.incident.entity.Role;
import com.viaappia.incident.entity.User;
import com.viaappia.incident.entity.enums.RoleName;
import com.viaappia.incident.exception.BusinessException;
import com.viaappia.incident.exception.ResourceNotFoundException;
import com.viaappia.incident.repository.RoleRepository;
import com.viaappia.incident.repository.UserRepository;
import com.viaappia.incident.security.jwt.JwtService;
import com.viaappia.incident.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;
import java.util.stream.Collectors;

/**
 * Implements authentication and registration rules.
 */
@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final AuthenticationManager authenticationManager;
    private final PasswordEncoder passwordEncoder;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final JwtService jwtService;

    @Override
    @Transactional(readOnly = true)
    public LoginResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.email(), request.password())
        );

        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResourceNotFoundException("Authenticated user not found"));

        String token = jwtService.generateToken(user);

        return new LoginResponse(token, "Bearer", toUserResponse(user));
    }

    @Override
    @Transactional
    public UserResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new BusinessException("Email is already registered");
        }

        Role userRole = roleRepository.findByName(RoleName.ROLE_USER)
                .orElseThrow(() -> new ResourceNotFoundException("Default user role not found"));

        User user = User.builder()
                .name(request.name())
                .email(request.email())
                .passwordHash(passwordEncoder.encode(request.password()))
                .active(true)
                .roles(Set.of(userRole))
                .build();

        User savedUser = userRepository.save(user);
        return toUserResponse(savedUser);
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse me(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Authenticated user not found"));

        return toUserResponse(user);
    }

    private UserResponse toUserResponse(User user) {
        Set<String> roles = user.getRoles()
                .stream()
                .map(role -> role.getName().name())
                .collect(Collectors.toSet());

        return new UserResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getActive(),
                roles
        );
    }
}