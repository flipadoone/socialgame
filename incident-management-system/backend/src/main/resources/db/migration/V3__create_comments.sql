CREATE TABLE comments (
    id UUID NOT NULL,
    incident_id UUID NOT NULL,
    author VARCHAR(255) NOT NULL,
    message VARCHAR(2000) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_comments
        PRIMARY KEY (id),

    CONSTRAINT fk_comments_incident
        FOREIGN KEY (incident_id)
        REFERENCES incidents (id)
        ON DELETE CASCADE
);

CREATE INDEX idx_comments_incident_id
    ON comments (incident_id);

CREATE INDEX idx_comments_created_at
    ON comments (created_at);