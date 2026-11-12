CREATE TABLE incidents (
    id UUID PRIMARY KEY,
    title VARCHAR(120) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(30) NOT NULL,
    priority VARCHAR(30) NOT NULL,
    category VARCHAR(30) NOT NULL,
    location VARCHAR(150),
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

CREATE INDEX idx_incidents_status ON incidents(status);
CREATE INDEX idx_incidents_priority ON incidents(priority);
CREATE INDEX idx_incidents_category ON incidents(category);
CREATE INDEX idx_incidents_created_at ON incidents(created_at);