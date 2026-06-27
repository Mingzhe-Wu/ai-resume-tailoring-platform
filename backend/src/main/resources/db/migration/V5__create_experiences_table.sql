CREATE TABLE experiences (
    id BIGSERIAL PRIMARY KEY,

    profile_id BIGINT NOT NULL,

    company_name VARCHAR(255) NOT NULL,

    position VARCHAR(100) NOT NULL,

    location VARCHAR(100),

    start_date DATE NOT NULL,

    end_date DATE,

    description TEXT,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_experiences_profile
        FOREIGN KEY (profile_id)
        REFERENCES profiles(id)
        ON DELETE CASCADE
);

CREATE INDEX idx_experiences_profile_id
ON experiences(profile_id);