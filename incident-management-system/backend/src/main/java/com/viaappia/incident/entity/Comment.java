package com.viaappia.incident.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Represents a comment associated with an incident.
 */
@Entity
@Table(
        name = "comments",
        indexes = {
                @Index(
                        name = "idx_comments_incident_id",
                        columnList = "incident_id"
                ),
                @Index(
                        name = "idx_comments_created_at",
                        columnList = "created_at"
                )
        }
)
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Comment {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "incident_id",
            nullable = false,
            foreignKey = @ForeignKey(
                    name = "fk_comments_incident"
            )
    )
    private Incident incident;

    @Column(
            name = "author",
            nullable = false,
            length = 255
    )
    private String author;

    @Column(
            name = "message",
            nullable = false,
            length = 2000
    )
    private String message;

    @Column(
            name = "created_at",
            nullable = false,
            updatable = false
    )
    private LocalDateTime createdAt;

    public Comment(
            Incident incident,
            String author,
            String message
    ) {
        this.incident = incident;
        this.author = author;
        this.message = message;
    }

    /**
     * Defines the creation timestamp on the server.
     */
    @PrePersist
    private void prePersist() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}