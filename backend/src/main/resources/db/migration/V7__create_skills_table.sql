CREATE TABLE skills (
    id BIGSERIAL PRIMARY KEY,

    profile_id BIGINT NOT NULL,

    category VARCHAR(50),

    name VARCHAR(100) NOT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_skills_profile
        FOREIGN KEY (profile_id)
        REFERENCES profiles(id)
        ON DELETE CASCADE
);

CREATE INDEX idx_skills_profile_id
ON skills(profile_id);