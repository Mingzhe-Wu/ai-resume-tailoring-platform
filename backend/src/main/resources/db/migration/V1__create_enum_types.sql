CREATE TYPE user_role as ENUM (
    'USER',
    'ADMIN'
);

CREATE TYPE user_status AS ENUM (
    'ACTIVE',
    'DISABLED',
    'DELETED'
);

CREATE TYPE job_status AS ENUM (
    'SAVED',
    'APPLIED',
    'INTERVIEWING',
    'OFFER',
    'REJECTED'
);