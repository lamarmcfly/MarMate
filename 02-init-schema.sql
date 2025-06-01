-- db/init/02-init-schema.sql
-- Initial schema for AI Assistant Platform - Core Tables (Layer 1)
-- This script creates the essential tables needed for the Conversation Manager functionality

-- Set search path to public schema
SET search_path TO public;

-- =====================================================
-- USERS TABLE
-- Stores user information for authentication and personalization
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    last_login_at TIMESTAMP WITH TIME ZONE,
    account_status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (account_status IN ('active', 'inactive', 'suspended')),
    preferences JSONB DEFAULT '{}'::jsonb,
    avatar_url TEXT,
    CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(account_status);

-- =====================================================
-- CONVERSATIONS TABLE
-- Tracks multi-turn dialogues between users and the AI assistant
-- =====================================================
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    project_name VARCHAR(255) NOT NULL DEFAULT 'Untitled Project',
    user_skill_level VARCHAR(20) CHECK (user_skill_level IN ('beginner', 'intermediate', 'expert')),
    stage VARCHAR(50) NOT NULL DEFAULT 'collecting' CHECK (stage IN ('collecting', 'clarifying', 'generating', 'completed')),
    initial_prompt TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    messages JSONB[] DEFAULT ARRAY[]::jsonb[],
    open_questions TEXT[] DEFAULT ARRAY[]::text[],
    answered_questions JSONB DEFAULT '{}'::jsonb,
    analysis_result JSONB,
    analyzed BOOLEAN NOT NULL DEFAULT FALSE,
    spec_ready BOOLEAN NOT NULL DEFAULT FALSE,
    spec_id UUID
);

CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_conversations_stage ON conversations(stage);
CREATE INDEX idx_conversations_created_at ON conversations(created_at);

-- =====================================================
-- SPECIFICATIONS TABLE
-- Stores generated project specifications
-- =====================================================
CREATE TABLE IF NOT EXISTS specifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    project_name VARCHAR(255) NOT NULL,
    content JSONB NOT NULL,
    markdown_content TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    version INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX idx_specifications_user_id ON specifications(user_id);
CREATE INDEX idx_specifications_conversation_id ON specifications(conversation_id);

-- Add foreign key reference from conversations to specifications
ALTER TABLE conversations ADD CONSTRAINT fk_conversations_spec_id 
    FOREIGN KEY (spec_id) REFERENCES specifications(id) ON DELETE SET NULL;

-- =====================================================
-- USER SKILL PROFILES
-- Stores user skill levels for personalization (Layer 4 foundation)
-- =====================================================
CREATE TABLE IF NOT EXISTS user_skills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    skill_category VARCHAR(50) NOT NULL,
    skill_name VARCHAR(100) NOT NULL,
    proficiency_level INTEGER NOT NULL CHECK (proficiency_level BETWEEN 1 AND 5),
    last_assessed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, skill_category, skill_name)
);

CREATE INDEX idx_user_skills_user_id ON user_skills(user_id);

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Function to update 'updated_at' timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply the updated_at trigger to tables with updated_at column
CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at
BEFORE UPDATE ON conversations
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_specifications_updated_at
BEFORE UPDATE ON specifications
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_skills_updated_at
BEFORE UPDATE ON user_skills
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- INITIAL DATA
-- =====================================================

-- Create a default admin user (password: admin123)
INSERT INTO users (email, password_hash, full_name, account_status)
VALUES ('admin@example.com', '$2a$10$eCQwsY5/lzAOBBs0zfGnVeQFfGGXUXYX5XwJBCm5dTZ9WIVj3eJn2', 'Admin User', 'active')
ON CONFLICT (email) DO NOTHING;

-- Log initialization
SELECT 'Core schema initialized successfully' AS status, now() AS timestamp;
