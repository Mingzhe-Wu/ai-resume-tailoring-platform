ALTER TABLE generation_history
DROP CONSTRAINT IF EXISTS chk_generation_history_status;

ALTER TABLE generation_history
ADD COLUMN IF NOT EXISTS started_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP;

ALTER TABLE generation_history
ADD CONSTRAINT chk_generation_history_status
CHECK (status IN ('PENDING', 'RUNNING', 'SUCCESS', 'FAILED'));
