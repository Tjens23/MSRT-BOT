-- Check if database exists and create if it doesn't
SELECT 'CREATE DATABASE msrtbot'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'msrtbot')\gexec

\c msrtbot;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
GRANT ALL PRIVILEGES ON DATABASE msrtbot TO postgres;
SELECT 'Database initialization completed successfully!' as message;
