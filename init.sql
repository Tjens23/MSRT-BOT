CREATE DATABASE IF NOT EXISTS msrtbot;
\c msrtbot;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
GRANT ALL PRIVILEGES ON DATABASE msrtbot TO postgres;
SELECT 'Database initialization completed successfully!' as message;
