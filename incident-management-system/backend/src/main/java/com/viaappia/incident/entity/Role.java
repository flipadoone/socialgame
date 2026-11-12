package com.viaappia.incident.entity;

import com.viaappia.incident.entity.enums.RoleName;
import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

/**
 * Entity that represents an authorization role.
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "roles")
public class Role {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, unique = true, length = 50)
    private RoleName name;
}