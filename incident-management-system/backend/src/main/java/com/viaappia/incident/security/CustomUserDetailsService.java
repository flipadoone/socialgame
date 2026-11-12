package com.viaappia.incident.security;

import com.viaappia.incident.entity.User;
import com.viaappia.incident.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

/**
 * Loads application users for Spring Security authentication.
 */
@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    /**
     * Loads a user by email and converts it to Spring Security's UserDetails model.
     *
     * @param email user email used as username
     * @return authenticated user details
     */
    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));

        return org.springframework.security.core.userdetails.User.builder()
                .username(user.getEmail())
                .password(user.getPasswordHash())
                .disabled(!user.getActive())
                .authorities(
                        user.getRoles()
                                .stream()
                                .map(role -> new SimpleGrantedAuthority(role.getName().name()))
                                .toList()
                )
                .build();
    }
}