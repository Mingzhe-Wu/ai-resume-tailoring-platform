CREATE TYPE user_role as ENUM (
    'USER',
    'ADMIN'
);

CREATE TYPE user_status AS ENUM (
    'ACTIVE',
    'DISABLED',
    'DELETED'
);