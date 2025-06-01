-- AI Assistant Platform Database Schema
-- Comprehensive PostgreSQL schema supporting all six layers of functionality

-- Enable UUID extension for generating unique IDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pgvector extension for vector embeddings
CREATE EXTENSION IF NOT EXISTS "vector";

-- =====================================================
-- USER MANAGEMENT
-- =====================================================

-- Users table for authentication and profile information
CREATE TABLE users (
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

-- User skill profiles for personalization (Layer 4)
CREATE TABLE user_skills (
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

-- User interaction history for adaptive learning (Layer 4)
CREATE TABLE user_interactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    interaction_type VARCHAR(50) NOT NULL,
    interaction_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    session_id UUID
);

CREATE INDEX idx_user_interactions_user_id ON user_interactions(user_id);
CREATE INDEX idx_user_interactions_type ON user_interactions(interaction_type);
CREATE INDEX idx_user_interactions_created_at ON user_interactions(created_at);

-- =====================================================
-- LAYER 1: INTELLIGENT PROMPT EXPANSION & SPECIFICATION
-- =====================================================

-- Conversations table for tracking multi-turn dialogues
CREATE TABLE conversations (
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

-- Specifications table for storing generated project specifications
CREATE TABLE specifications (
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
-- LAYER 2: AUTONOMOUS CODE GENERATION & VERSION CONTROL
-- =====================================================

-- Projects table for tracking overall project information
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    spec_id UUID REFERENCES specifications(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('draft', 'active', 'completed', 'archived')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    settings JSONB DEFAULT '{}'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_status ON projects(status);

-- Code repositories for version control integration
CREATE TABLE code_repositories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    provider VARCHAR(50) NOT NULL CHECK (provider IN ('github', 'gitlab', 'bitbucket', 'local')),
    url TEXT,
    default_branch VARCHAR(100) NOT NULL DEFAULT 'main',
    credentials_id UUID, -- Reference to securely stored credentials
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    last_synced_at TIMESTAMP WITH TIME ZONE,
    sync_status VARCHAR(50) DEFAULT 'pending' CHECK (sync_status IN ('pending', 'syncing', 'synced', 'failed')),
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_code_repositories_project_id ON code_repositories(project_id);

-- Generated code files
CREATE TABLE code_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    repository_id UUID REFERENCES code_repositories(id) ON DELETE CASCADE,
    file_path VARCHAR(1000) NOT NULL,
    file_content TEXT NOT NULL,
    language VARCHAR(100),
    status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'generated', 'committed', 'modified')),
    commit_hash VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_code_files_project_id ON code_files(project_id);
CREATE INDEX idx_code_files_repository_id ON code_files(repository_id);
CREATE INDEX idx_code_files_language ON code_files(language);

-- Code generation prompts and results
CREATE TABLE code_generation_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    prompt TEXT NOT NULL,
    model_used VARCHAR(100) NOT NULL,
    result_summary JSONB,
    files_generated INTEGER,
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT
);

CREATE INDEX idx_code_generation_sessions_project_id ON code_generation_sessions(project_id);
CREATE INDEX idx_code_generation_sessions_status ON code_generation_sessions(status);

-- =====================================================
-- LAYER 3: DYNAMIC WORKFLOW AUTOMATION & NOTIFICATIONS
-- =====================================================

-- Project milestones
CREATE TABLE milestones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    start_date DATE,
    end_date DATE,
    status VARCHAR(50) NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed', 'delayed')),
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage BETWEEN 0 AND 100),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    sequence_order INTEGER NOT NULL DEFAULT 0,
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_milestones_project_id ON milestones(project_id);
CREATE INDEX idx_milestones_status ON milestones(status);

-- Project tasks
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    milestone_id UUID REFERENCES milestones(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'review', 'completed', 'blocked')),
    priority VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    estimated_hours DECIMAL(8,2),
    actual_hours DECIMAL(8,2),
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    due_date TIMESTAMP WITH TIME ZONE,
    sequence_order INTEGER NOT NULL DEFAULT 0,
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_tasks_project_id ON tasks(project_id);
CREATE INDEX idx_tasks_milestone_id ON tasks(milestone_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);

-- Task dependencies
CREATE TABLE task_dependencies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    predecessor_task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    successor_task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    dependency_type VARCHAR(50) NOT NULL DEFAULT 'finish_to_start' CHECK (dependency_type IN ('finish_to_start', 'start_to_start', 'finish_to_finish', 'start_to_finish')),
    lag_time INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE (predecessor_task_id, successor_task_id)
);

CREATE INDEX idx_task_dependencies_project_id ON task_dependencies(project_id);
CREATE INDEX idx_task_dependencies_predecessor ON task_dependencies(predecessor_task_id);
CREATE INDEX idx_task_dependencies_successor ON task_dependencies(successor_task_id);

-- Notifications
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    notification_type VARCHAR(50) NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    scheduled_for TIMESTAMP WITH TIME ZONE,
    action_url TEXT,
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_project_id ON notifications(project_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

-- Resource recommendations
CREATE TABLE resource_recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    resource_type VARCHAR(50) NOT NULL,
    resource_name VARCHAR(255) NOT NULL,
    description TEXT,
    url TEXT,
    cost_estimate DECIMAL(10,2),
    confidence_score DECIMAL(3,2) CHECK (confidence_score BETWEEN 0 AND 1),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_resource_recommendations_project_id ON resource_recommendations(project_id);
CREATE INDEX idx_resource_recommendations_type ON resource_recommendations(resource_type);

-- =====================================================
-- LAYER 4: ADAPTIVE LEARNING & USER PERSONALIZATION
-- =====================================================

-- User learning profiles
CREATE TABLE user_learning_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    learning_style VARCHAR(50),
    preferred_explanation_depth VARCHAR(20) CHECK (preferred_explanation_depth IN ('basic', 'intermediate', 'detailed', 'expert')),
    preferred_code_examples BOOLEAN DEFAULT TRUE,
    preferred_visual_aids BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb,
    UNIQUE (user_id)
);

CREATE INDEX idx_user_learning_profiles_user_id ON user_learning_profiles(user_id);

-- Project templates for quick setup
CREATE TABLE project_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    template_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    usage_count INTEGER NOT NULL DEFAULT 0,
    is_public BOOLEAN NOT NULL DEFAULT FALSE,
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_project_templates_category ON project_templates(category);
CREATE INDEX idx_project_templates_is_public ON project_templates(is_public);

-- User template preferences
CREATE TABLE user_template_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    template_id UUID NOT NULL REFERENCES project_templates(id) ON DELETE CASCADE,
    usage_count INTEGER NOT NULL DEFAULT 0,
    last_used_at TIMESTAMP WITH TIME ZONE,
    is_favorite BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, template_id)
);

CREATE INDEX idx_user_template_preferences_user_id ON user_template_preferences(user_id);

-- =====================================================
-- LAYER 5: INTEGRATED DEBUGGING & SELF-HEALING
-- =====================================================

-- Debug sessions
CREATE TABLE debug_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    issue_description TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'analyzing', 'resolved', 'unresolved')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolution_summary TEXT,
    logs TEXT,
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_debug_sessions_project_id ON debug_sessions(project_id);
CREATE INDEX idx_debug_sessions_user_id ON debug_sessions(user_id);
CREATE INDEX idx_debug_sessions_status ON debug_sessions(status);

-- Error patterns and solutions
CREATE TABLE error_patterns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    error_type VARCHAR(100) NOT NULL,
    pattern TEXT NOT NULL,
    description TEXT NOT NULL,
    solution TEXT NOT NULL,
    language VARCHAR(50),
    framework VARCHAR(50),
    confidence_score DECIMAL(3,2) CHECK (confidence_score BETWEEN 0 AND 1),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    usage_count INTEGER NOT NULL DEFAULT 0,
    success_rate DECIMAL(5,2) DEFAULT 0 CHECK (success_rate BETWEEN 0 AND 100),
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_error_patterns_error_type ON error_patterns(error_type);
CREATE INDEX idx_error_patterns_language ON error_patterns(language);
CREATE INDEX idx_error_patterns_framework ON error_patterns(framework);

-- Debug steps and actions
CREATE TABLE debug_steps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    debug_session_id UUID NOT NULL REFERENCES debug_sessions(id) ON DELETE CASCADE,
    step_number INTEGER NOT NULL,
    action_type VARCHAR(50) NOT NULL,
    action_description TEXT NOT NULL,
    action_result TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_debug_steps_debug_session_id ON debug_steps(debug_session_id);
CREATE INDEX idx_debug_steps_status ON debug_steps(status);

-- =====================================================
-- LAYER 6: MODULAR AI AGENT INTEGRATION & CONTEXT MANAGEMENT
-- =====================================================

-- AI Agents configuration
CREATE TABLE ai_agents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    agent_type VARCHAR(50) NOT NULL,
    capabilities TEXT[] NOT NULL,
    model_configuration JSONB NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_ai_agents_agent_type ON ai_agents(agent_type);
CREATE INDEX idx_ai_agents_is_active ON ai_agents(is_active);

-- Agent interactions
CREATE TABLE agent_interactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    agent_id UUID NOT NULL REFERENCES ai_agents(id) ON DELETE CASCADE,
    interaction_type VARCHAR(50) NOT NULL,
    input_data JSONB NOT NULL,
    output_data JSONB,
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    duration_ms INTEGER,
    error_message TEXT,
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_agent_interactions_project_id ON agent_interactions(project_id);
CREATE INDEX idx_agent_interactions_agent_id ON agent_interactions(agent_id);
CREATE INDEX idx_agent_interactions_status ON agent_interactions(status);

-- Context vectors for semantic search
CREATE TABLE context_vectors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    content_type VARCHAR(50) NOT NULL,
    content_id UUID NOT NULL,
    content_snippet TEXT NOT NULL,
    embedding VECTOR(1536) NOT NULL, -- Dimension depends on embedding model
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_context_vectors_project_id ON context_vectors(project_id);
CREATE INDEX idx_context_vectors_content_type ON context_vectors(content_type);
-- Create vector index for efficient similarity search
CREATE INDEX idx_context_vectors_embedding ON context_vectors USING ivfflat (embedding vector_cosine_ops);

-- Cross-project knowledge
CREATE TABLE knowledge_snippets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    tags TEXT[] DEFAULT ARRAY[]::text[],
    source_project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    usage_count INTEGER NOT NULL DEFAULT 0,
    embedding VECTOR(1536) -- Dimension depends on embedding model
);

CREATE INDEX idx_knowledge_snippets_category ON knowledge_snippets(category);
CREATE INDEX idx_knowledge_snippets_tags ON knowledge_snippets USING GIN(tags);
-- Create vector index for efficient similarity search
CREATE INDEX idx_knowledge_snippets_embedding ON knowledge_snippets USING ivfflat (embedding vector_cosine_ops);

-- =====================================================
-- VIEWS
-- =====================================================

-- Project overview with status and progress
CREATE VIEW project_overview AS
SELECT 
    p.id AS project_id,
    p.name AS project_name,
    p.status AS project_status,
    p.user_id,
    u.full_name AS owner_name,
    p.created_at,
    p.updated_at,
    COUNT(DISTINCT m.id) AS milestone_count,
    COUNT(DISTINCT t.id) AS task_count,
    ROUND(AVG(CASE WHEN m.id IS NOT NULL THEN m.progress_percentage ELSE NULL END)) AS avg_milestone_progress,
    COUNT(DISTINCT CASE WHEN t.status = 'completed' THEN t.id ELSE NULL END) * 100.0 / 
        NULLIF(COUNT(DISTINCT t.id), 0) AS task_completion_percentage,
    EXISTS(SELECT 1 FROM code_repositories cr WHERE cr.project_id = p.id) AS has_repository,
    EXISTS(SELECT 1 FROM debug_sessions ds WHERE ds.project_id = p.id AND ds.status = 'open') AS has_open_debug_sessions
FROM 
    projects p
LEFT JOIN 
    users u ON p.user_id = u.id
LEFT JOIN 
    milestones m ON p.id = m.project_id
LEFT JOIN 
    tasks t ON p.id = t.project_id
GROUP BY 
    p.id, p.name, p.status, p.user_id, u.full_name, p.created_at, p.updated_at;

-- User activity summary
CREATE VIEW user_activity_summary AS
SELECT 
    u.id AS user_id,
    u.full_name,
    u.email,
    u.last_login_at,
    COUNT(DISTINCT p.id) AS project_count,
    COUNT(DISTINCT c.id) AS conversation_count,
    COUNT(DISTINCT t.id) AS assigned_task_count,
    COUNT(DISTINCT CASE WHEN t.status = 'completed' THEN t.id ELSE NULL END) AS completed_task_count,
    COUNT(DISTINCT ds.id) AS debug_session_count,
    MAX(p.updated_at) AS last_project_activity,
    MAX(c.updated_at) AS last_conversation_activity
FROM 
    users u
LEFT JOIN 
    projects p ON u.id = p.user_id
LEFT JOIN 
    conversations c ON u.id = c.user_id
LEFT JOIN 
    tasks t ON u.id = t.assigned_to
LEFT JOIN 
    debug_sessions ds ON u.id = ds.user_id
GROUP BY 
    u.id, u.full_name, u.email, u.last_login_at;

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

-- Apply the updated_at trigger to all tables with updated_at column
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN 
        SELECT table_name 
        FROM information_schema.columns 
        WHERE column_name = 'updated_at' 
        AND table_schema = 'public'
    LOOP
        EXECUTE format('
            CREATE TRIGGER update_updated_at_timestamp
            BEFORE UPDATE ON %I
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
        ', t);
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to update project milestone progress based on task completion
CREATE OR REPLACE FUNCTION update_milestone_progress()
RETURNS TRIGGER AS $$
DECLARE
    total_tasks INTEGER;
    completed_tasks INTEGER;
BEGIN
    -- Count total and completed tasks for the milestone
    SELECT 
        COUNT(*), 
        COUNT(CASE WHEN status = 'completed' THEN 1 ELSE NULL END)
    INTO 
        total_tasks, 
        completed_tasks
    FROM 
        tasks
    WHERE 
        milestone_id = NEW.milestone_id;
    
    -- Update milestone progress percentage
    IF total_tasks > 0 THEN
        UPDATE milestones
        SET progress_percentage = (completed_tasks * 100 / total_tasks)
        WHERE id = NEW.milestone_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update milestone progress when task status changes
CREATE TRIGGER update_milestone_progress_trigger
AFTER INSERT OR UPDATE OF status ON tasks
FOR EACH ROW
WHEN (NEW.milestone_id IS NOT NULL)
EXECUTE FUNCTION update_milestone_progress();

-- =====================================================
-- INITIAL DATA
-- =====================================================

-- Insert default AI agents
INSERT INTO ai_agents (name, description, agent_type, capabilities, model_configuration)
VALUES 
    ('Code Agent', 'Generates and modifies code based on specifications', 'code', 
     ARRAY['code_generation', 'code_review', 'refactoring'], 
     '{"model": "gpt-4o", "temperature": 0.2, "max_tokens": 4000}'::jsonb),
    
    ('Design Agent', 'Converts wireframes and descriptions into UI components', 'design', 
     ARRAY['ui_design', 'css_generation', 'responsive_layout'], 
     '{"model": "gpt-4o", "temperature": 0.4, "max_tokens": 2000}'::jsonb),
    
    ('DevOps Agent', 'Manages CI/CD pipelines and deployment configurations', 'devops', 
     ARRAY['ci_cd_config', 'docker_config', 'cloud_deployment'], 
     '{"model": "gpt-4o", "temperature": 0.1, "max_tokens": 3000}'::jsonb),
    
    ('Documentation Agent', 'Generates comprehensive documentation', 'documentation', 
     ARRAY['api_docs', 'user_manuals', 'code_comments'], 
     '{"model": "gpt-4o", "temperature": 0.3, "max_tokens": 4000}'::jsonb);

-- Insert common error patterns
INSERT INTO error_patterns (error_type, pattern, description, solution, language, framework, confidence_score)
VALUES
    ('TypeError', 'TypeError: Cannot read property ''.*'' of undefined', 
     'Attempting to access a property of an undefined variable', 
     'Check if the variable exists before accessing its properties using optional chaining or conditional checks', 
     'JavaScript', 'Any', 0.95),
    
    ('ImportError', 'ImportError: No module named ''.*''', 
     'Python cannot find the specified module', 
     'Ensure the module is installed using pip or check your PYTHONPATH', 
     'Python', 'Any', 0.90),
    
    ('NullPointerException', 'java.lang.NullPointerException', 
     'Attempting to use a null reference', 
     'Add null checks before accessing object methods or properties', 
     'Java', 'Any', 0.95),
    
    ('CORS', 'Access to fetch at ''.*'' from origin ''.*'' has been blocked by CORS policy', 
     'Cross-Origin Resource Sharing policy is blocking API requests', 
     'Configure CORS headers on your server to allow requests from your frontend origin', 
     'JavaScript', 'Web', 0.85);

-- Insert some project templates
INSERT INTO project_templates (name, description, category, template_data)
VALUES
    ('Basic Web App', 'Simple web application with user authentication and CRUD operations', 'Web', 
     '{"frontend": "React", "backend": "Node.js/Express", "database": "MongoDB", "features": ["user_auth", "crud_operations", "responsive_design"]}'::jsonb),
    
    ('E-commerce Site', 'Online store with product catalog, shopping cart, and checkout', 'E-commerce', 
     '{"frontend": "React", "backend": "Django", "database": "PostgreSQL", "features": ["product_catalog", "shopping_cart", "payment_processing", "order_management"]}'::jsonb),
    
    ('Mobile App with API', 'Mobile application with RESTful API backend', 'Mobile', 
     '{"frontend": "React Native", "backend": "FastAPI", "database": "PostgreSQL", "features": ["user_auth", "offline_support", "push_notifications"]}'::jsonb),
    
    ('Data Dashboard', 'Interactive dashboard for data visualization and analysis', 'Data', 
     '{"frontend": "Vue.js", "backend": "Flask", "database": "PostgreSQL", "features": ["charts", "filters", "export_data", "real_time_updates"]}'::jsonb);

-- =====================================================
-- PERMISSIONS
-- =====================================================

-- Create application roles
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'app_user') THEN
        CREATE ROLE app_user;
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'app_admin') THEN
        CREATE ROLE app_admin;
    END IF;
END
$$;

-- Grant permissions to app_user
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO app_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE ON TABLES TO app_user;

-- Grant all permissions to app_admin
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO app_admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO app_admin;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON TABLES TO app_admin;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON SEQUENCES TO app_admin;
