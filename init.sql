-- Database initialization script for MSRT Bot
-- This script will run when the PostgreSQL container starts for the first time

-- Create the database (this is handled by POSTGRES_DB environment variable)
-- CREATE DATABASE IF NOT EXISTS msrtbot;

-- Connect to the database
\c msrtbot;

-- Create any additional extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE msrtbot TO postgres;

-- You can add any additional initialization queries here
-- For example, creating indexes or setting up initial data

-- Print completion message
SELECT 'Database initialization completed successfully!' as message;
