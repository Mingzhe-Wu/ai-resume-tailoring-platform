CREATE TABLE prompt_templates (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL,
    version INT NOT NULL,
    content TEXT NOT NULL,
    active BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_prompt_template_version_positive CHECK (version > 0),
    CONSTRAINT uk_prompt_template_type_version UNIQUE (type, version)
);

CREATE UNIQUE INDEX uk_prompt_template_active_type
ON prompt_templates (type)
WHERE active = TRUE;