ALTER TABLE prompt_templates
DROP CONSTRAINT IF EXISTS uk_prompt_template_type_version;

CREATE UNIQUE INDEX IF NOT EXISTS uk_prompt_template_default_type
ON prompt_templates (type)
WHERE user_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uk_prompt_template_user_type
ON prompt_templates (user_id, type)
WHERE user_id IS NOT NULL;
