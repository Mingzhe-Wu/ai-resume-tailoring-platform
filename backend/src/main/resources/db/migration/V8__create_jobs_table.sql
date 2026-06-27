CREATE TABLE jobs (
    id BIGSERIAL PRIMARY KEY,

    user_id BIGINT NOT NULL,

    title VARCHAR(100) NOT NULL,

    company VARCHAR(100) NOT NULL,

    location VARCHAR(100),

    salary VARCHAR(100),

    job_description TEXT,

    source_url VARCHAR(500),

    status job_status NOT NULL DEFAULT 'SAVED',

    interview_time TIMESTAMP,

    priority INTEGER NOT NULL DEFAULT 0,

    notes TEXT,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_jobs_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

CREATE INDEX idx_jobs_user_id
ON jobs(user_id);

CREATE INDEX idx_jobs_user_status
ON jobs(user_id, status);