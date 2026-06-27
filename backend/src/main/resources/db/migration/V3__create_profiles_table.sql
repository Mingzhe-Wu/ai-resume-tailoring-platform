CREATE TABLE profiles (
    id BIGSERIAL PRIMARY KEY,

    user_id BIGINT NOT NULL UNIQUE,

    full_name VARCHAR(100) NOT NULL,

    phone VARCHAR(20),

    contact_email VARCHAR(255),

    linkedin_url VARCHAR(255),

    github_url VARCHAR(255),

    location VARCHAR(100),

    summary TEXT,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_profiles_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);