CREATE TABLE educations (
    id BIGSERIAL PRIMARY KEY,

    profile_id BIGINT NOT NULL,

    school_name VARCHAR(255) NOT NULL,

    degree VARCHAR(100),

    major VARCHAR(100),

    start_date DATE,

    end_date DATE,

    gpa NUMERIC(4, 3),

    relevant_coursework TEXT,

    description TEXT,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_educations_profile
        FOREIGN KEY (profile_id)
        REFERENCES profiles(id)
        ON DELETE CASCADE
);

CREATE INDEX idx_educations_profile_id
ON educations(profile_id);