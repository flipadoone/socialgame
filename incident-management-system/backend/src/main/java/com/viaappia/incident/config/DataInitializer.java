package com.viaappia.incident.config;

import com.viaappia.incident.entity.Role;
import com.viaappia.incident.entity.User;
import com.viaappia.incident.entity.enums.RoleName;
import com.viaappia.incident.repository.RoleRepository;
import com.viaappia.incident.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Set;

/**
 * Creates the default roles and the demonstration users documented in the README.
 *
 * Demo users are created only when {@code app.seed.demo-users} is true (env SEED_DEMO_USERS,
 * default true). Set SEED_DEMO_USERS=false in production.
 */
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.seed.demo-users:true}")
    private boolean seedDemoUsers;

    @Override
    public void run(String... args) {
        Role adminRole = roleRepository.findByName(RoleName.ROLE_ADMIN)
                .orElseGet(() -> roleRepository.save(
                        Role.builder().name(RoleName.ROLE_ADMIN).build()
                ));

        Role userRole = roleRepository.findByName(RoleName.ROLE_USER)
                .orElseGet(() -> roleRepository.save(
                        Role.builder().name(RoleName.ROLE_USER).build()
                ));

        if (!seedDemoUsers) {
            return;
        }

        createUserIfMissing("Usuário Admin", "admin@viaappia.com", "Admin@123", adminRole);
        createUserIfMissing("Usuário Leitor", "leitor@viaappia.com", "Leitor@123", userRole);
        createUserIfMissing("Via Appia Admin", "user@email.com", "user1234", adminRole);
    }

    private void createUserIfMissing(String name, String email, String rawPassword, Role role) {
        if (userRepository.existsByEmail(email)) {
            return;
        }

        User user = User.builder()
                .name(name)
                .email(email)
                .passwordHash(passwordEncoder.encode(rawPassword))
                .active(true)
                .roles(Set.of(role))
                .build();

        userRepository.save(user);
    }
}
