CREATE TABLE projects (
    id BIGSERIAL PRIMARY KEY,

    profile_id BIGINT NOT NULL,

    project_name VARCHAR(255) NOT NULL,

    tech_stack TEXT,

    start_date DATE,

    end_date DATE,

    description TEXT,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_projects_profile
        FOREIGN KEY (profile_id)
        REFERENCES profiles(id)
        ON DELETE CASCADE
);

CREATE INDEX idx_projects_profile_id
ON projects(profile_id);