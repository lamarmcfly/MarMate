-- Enable necessary PostgreSQL extensions for the AI Assistant Platform

-- uuid-ossp: Provides functions to generate UUIDs
-- Used for primary keys in the database schema
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- pgvector: Enables vector operations for similarity search
-- Used for storing and querying embeddings for context awareness
CREATE EXTENSION IF NOT EXISTS "vector";

-- Check if extensions were successfully enabled
DO $$
BEGIN
    RAISE NOTICE 'Enabled extensions:';
    RAISE NOTICE '- uuid-ossp: %', EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'uuid-ossp');
    RAISE NOTICE '- vector: %', EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vector');
END
$$;

-- Set search path to public schema
SET search_path TO public;

-- Log initialization
SELECT now() AS initialization_time, current_user AS initialized_by, version() AS postgres_version;
