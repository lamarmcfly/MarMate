# AI Assistant Platform

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](https://github.com/your-repo/ai-assistant-platform)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/version-0.1.0-blue)](https://github.com/your-repo/ai-assistant-platform)
[![n8n](https://img.shields.io/badge/Powered%20by-n8n-purple)](https://n8n.io/)
[![React](https://img.shields.io/badge/Frontend-React-blue)](https://reactjs.org/)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-blue)](https://www.postgresql.org/)

The AI Assistant Platform is a comprehensive tool designed to empower users—from novices to experts—to autonomously or collaboratively ideate, specify, build, deploy, and maintain software projects. It leverages deep context-awareness, multi-agent specialization, dynamic workflow automation, and personalized learning to streamline the software development lifecycle.

## Overview

This platform aims to revolutionize software development by providing an intelligent, AI-powered assistant that understands user needs, translates them into technical specifications, generates high-quality code, manages project workflows, and adapts to individual user skills. It's built to be a stable, reliable tool that minimizes AI hallucinations through robust prompt engineering, structured outputs, and a human-in-the-loop review system for critical components.

## Features

The platform is built upon a layered architecture, delivering a comprehensive set of features:

1.  **Intelligent Prompt Expansion & Specification**:
    *   Analyzes user prompts to identify missing requirements and constraints.
    *   Engages in multi-turn conversational Q&A to clarify intent and scope.
    *   Translates layperson terminology into precise technical specifications.
    *   Outputs detailed, actionable project specification documents.

2.  **Autonomous Full-Stack Code Generation & Version Control**:
    *   Generates clean, well-documented, idiomatic code for various frameworks.
    *   Includes comprehensive testing suites and inline documentation.
    *   Integrates static analysis and automated fixing for common errors.
    *   Automates version control with meaningful commits and branch management.

3.  **Dynamic Workflow Automation & Notifications**:
    *   Maps project tasks and dependencies into visual timelines.
    *   Recommends tools, libraries, and cloud services.
    *   Provides proactive notifications about deadlines and blocked tasks.

4.  **Adaptive Learning & User Personalization**:
    *   Assesses user skill levels through interaction analysis.
    *   Dynamically adjusts interaction complexity and explanations.
    *   Offers pre-configured templates for common project types.

5.  **Integrated Debugging & Self-Healing**:
    *   Provides a natural language diagnostic interface.
    *   Performs root cause analysis for errors.
    *   Autonomously applies fixes for common issues or guides users through complex problems.

6.  **Modular AI Agent Integration & Context Management**:
    *   Orchestrates specialized AI agents (Code, Design, DevOps, Documentation).
    *   Maintains persistent project context using a vector database for continuity and knowledge reuse.
    *   Supports cross-project learning and solution reuse.

## Architecture Overview

The AI Assistant Platform utilizes a modern, decoupled architecture:

*   **Frontend**: A responsive React application built with TypeScript and styled with Tailwind CSS, providing the user interface for all platform interactions.
*   **Workflow Engine (Backend Logic)**: n8n serves as the core backend orchestration layer, managing complex workflows for conversation management, specification generation, code generation, and task automation.
*   **Database**: PostgreSQL with the `pgvector` extension is used for persistent storage of all project data, user information, conversation histories, specifications, generated code artifacts, and context embeddings.
*   **Cache & Queue**: Redis is used for caching frequently accessed data and managing background job queues for asynchronous tasks within n8n or other backend services.
*   **AI Services**: Primarily integrates with OpenAI APIs (e.g., GPT-4o) for natural language understanding, generation, and analysis tasks. The platform is designed to be extensible to other AI models.
*   **Version Control**: Integrates with GitHub (and potentially other Git providers) for automated code commits, branching, and PR creation.
*   **Notification System**: Can integrate with services like Slack for real-time alerts and updates (optional).

The n8n workflows are central to the platform's intelligence, employing advanced prompt engineering techniques and structured data processing to ensure high-quality, reliable outputs with minimal AI "hallucinations."

## Technology Stack

*   **Frontend**: React, TypeScript, Vite, Tailwind CSS, TanStack Query, Zustand, React Hook Form, React Router
*   **Backend/Workflow Orchestration**: n8n
*   **Database**: PostgreSQL, pgvector
*   **Caching/Queueing**: Redis
*   **AI Models**: OpenAI (GPT-4o and others)
*   **Containerization**: Docker, Docker Compose
*   **Web Server (Production)**: Nginx

## Getting Started (Development Setup)

Follow these instructions to set up the AI Assistant Platform for local development.

### Prerequisites

*   **Docker & Docker Compose**: Latest stable versions.
*   **Node.js**: Version 18.x or later.
*   **npm or pnpm or yarn**: Latest stable versions (examples will use `npm`, adjust as needed for `pnpm` or `yarn`).
*   **Git**: Latest stable version.
*   **n8n Desktop App (Optional but Recommended for local workflow editing)**: If you prefer to edit n8n workflows locally with a GUI before importing them into the Dockerized n8n.

### 1. Clone the Repository

```bash
git clone https://your-repository-url/ai-assistant-platform.git
cd ai-assistant-platform
```

### 2. Environment Variables

Copy the example environment file and configure it:

```bash
cp .env.example .env
```

Open the `.env` file in your editor and fill in the required values, especially:
*   `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`
*   `REDIS_PASSWORD`
*   `N8N_USER`, `N8N_PASSWORD`, `N8N_ENCRYPTION_KEY` (must be a 32-character string)
*   `OPENAI_API_KEY`
*   `GITHUB_TOKEN` (if you plan to use GitHub integration for code generation)
*   Ensure `WEBHOOK_URL` is set to `http://localhost:5678` for local development if n8n is running via Docker Compose as configured.
*   `VITE_API_BASE_URL` for the frontend should typically point to your n8n webhook proxy (e.g., `http://localhost:8080/api` if using the provided Nginx setup, or directly to n8n `http://localhost:5678` if not proxying through Nginx for API calls).
*   `VITE_WS_URL` for WebSocket connections.

### 3. Start Services with Docker Compose

This command will start PostgreSQL, Redis, and the n8n server as defined in `docker-compose.yml`.

```bash
docker-compose up -d
```

To check the status of the containers:

```bash
docker-compose ps
```

To view logs for a specific service (e.g., n8n):

```bash
docker-compose logs -f n8n
```

### 4. Database Initialization

The `docker-compose.yml` setup is configured to automatically run initialization scripts located in the `db/init/` directory when the PostgreSQL container starts for the first time. This includes:
*   `01-create-extensions.sql`: Enables `uuid-ossp` and `pgvector` extensions.
*   `02-init-schema.sql`: Creates the initial database schema (core tables for Layer 1).
*   The full schema is defined in `db/database_schema.sql` which you can apply manually if needed or extend the init scripts.

To verify extensions (after a brief wait for the DB to initialize):

```bash
docker-compose exec postgres psql -U your_postgres_user -d your_postgres_db -c "\dx"
```
(Replace `your_postgres_user` and `your_postgres_db` with values from your `.env` file).

### 5. n8n Setup

#### 5.1 Access n8n UI

Open your browser and navigate to `http://localhost:5678`. You should see the n8n login screen. Use the `N8N_USER` and `N8N_PASSWORD` credentials from your `.env` file to log in.

#### 5.2 Setup Credentials in n8n

Inside the n8n UI, navigate to **Credentials** (usually found under the settings/profile icon). Add new credentials for:

1.  **PostgreSQL**:
    *   **Credential Name**: `Postgres Account` (or as referenced in workflow files)
    *   **Host**: `postgres` (this is the service name in `docker-compose.yml`)
    *   **Port**: `5432`
    *   **Database**: Value of `POSTGRES_DB` from your `.env`
    *   **User**: Value of `POSTGRES_USER` from your `.env`
    *   **Password**: Value of `POSTGRES_PASSWORD` from your `.env`
    *   **SSL**: Typically `false` or `Allow` for local Docker setup.

2.  **OpenAI API**:
    *   **Credential Name**: `OpenAI Account` (or as referenced in workflow files)
    *   **API Key**: Your `OPENAI_API_KEY` from your `.env` file.

3.  **GitHub (Optional)**:
    *   If you plan to use GitHub integration for code commits.
    *   **Credential Name**: `GitHub Account`
    *   **Authentication Method**: Personal Access Token
    *   **Token**: Your `GITHUB_TOKEN` from your `.env` file (ensure it has `repo` scope).

4.  **Slack (Optional)**:
    *   If you plan to use Slack notifications for human review tasks or other alerts.
    *   **Credential Name**: `Slack Account`
    *   **Authentication Method**: Webhook URL or OAuth2 (depending on your n8n Slack node setup).
    *   Provide the necessary details (e.g., Slack Webhook URL).

#### 5.3 Import and Activate Workflows

1.  In the n8n UI, go to **Workflows**.
2.  Click on **Import from File**.
3.  Import the following workflow JSON files located in the `workflows/` directory of this project:
    *   `optimized_conversation_manager_workflow.json`
    *   `optimized_code_generation_workflow.json`
    *   `workflow_automation_workflow.json` (if you plan to use project management features)
4.  After importing each workflow:
    *   Open the workflow.
    *   Verify that the credential selections in nodes (e.g., PostgreSQL, OpenAI) match the names you used when creating credentials in n8n.
    *   **Save** the workflow.
    *   **Activate** the workflow using the toggle switch (usually in the top right). Active workflows will have their webhook endpoints listening.

#### 5.4 Webhook URLs

Once activated, n8n workflows with Webhook trigger nodes will have active URLs. For local development with Docker Compose, these URLs will typically be like `http://localhost:5678/webhook/your-path` or `http://localhost:5678/webhook-test/your-path` for test executions.
The frontend will call these endpoints. Ensure your `VITE_API_BASE_URL` in `frontend/.env` is correctly set up to proxy to or directly hit these n8n webhook URLs.

### 6. Frontend Setup

#### 6.1 Install Dependencies

Navigate to the frontend directory and install dependencies:

```bash
cd frontend
npm install
```
(Or `pnpm install` / `yarn install` if you use those package managers).

#### 6.2 Configure Frontend Environment Variables

Ensure your `frontend/.env` file (create it from `frontend/.env.example` if it doesn't exist) has the correct `VITE_API_BASE_URL`. If you are running Nginx locally via Docker to proxy requests (as per the provided `Dockerfile` and `docker/nginx/default.conf`), this might be `http://localhost:8080/api`. If the frontend is directly calling n8n, it would be `http://localhost:5678`.

Example `frontend/.env`:
```
VITE_API_BASE_URL=http://localhost:5678 # Or your Nginx proxy URL
VITE_WS_URL=ws://localhost:5678        # For WebSocket connections, adjust if proxied
VITE_USE_MOCK_API=true                 # Set to false to use live n8n endpoints
```

#### 6.3 Run Frontend Development Server

```bash
npm run dev
```

This will start the Vite development server, typically at `http://localhost:3000` or `http://localhost:5173`. Open this URL in your browser.

### 7. Mock API (Optional)

For frontend development without running the full n8n backend, a mock API server is provided in the `mock-api/` directory.

To run the mock API:
```bash
cd mock-api
npm install
npm run dev
```
This will typically start the mock server on a port like `3001`. You would then point `VITE_API_BASE_URL` in `frontend/.env` to this mock server's URL and set `VITE_USE_MOCK_API=true`.

You should now have the AI Assistant Platform running locally!

## Key n8n Workflows

The platform's backend logic is orchestrated by several key n8n workflows:

*   **`optimized_conversation_manager_workflow.json`**: This is the heart of Layer 1. It manages multi-turn user conversations, performs sophisticated analysis of user inputs using advanced prompt engineering, extracts requirements, identifies ambiguities, asks clarifying questions, and ultimately generates detailed project specifications. It incorporates confidence scoring and triggers for human review when AI analysis or specification quality is below defined thresholds.
*   **`optimized_code_generation_workflow.json`**: Powers Layer 2. This workflow takes a project specification as input and generates code file by file. It includes steps for selecting target frameworks, prompting AI for code, performing static analysis on generated code, and optionally committing code to a GitHub repository. It also features a robust human-in-the-loop mechanism, flagging code for review based on AI confidence, static analysis results, or file complexity.
*   **`workflow_automation_workflow.json`**: Implements parts of Layer 3. This workflow handles project task creation from specifications, dependency management, and can be extended for notifications and resource recommendations. (Note: Full implementation of this workflow depends on specific project management tool integrations or custom UI elements for task display).

These workflows are designed with **elite prompt engineering** techniques, including clear system roles, few-shot examples (implicitly or explicitly in prompt design), structured JSON outputs, chain-of-thought reasoning instructions, and anti-hallucination strategies to ensure stable and reliable AI-driven operations.

## Human-in-the-Loop Review System

A critical feature for ensuring quality and reliability is the Human-in-the-Loop (HITL) review system. This system is integrated into both the conversation/specification and code generation workflows:

*   **Triggers**: Reviews are automatically triggered by:
    *   Low AI confidence scores during analysis or generation.
    *   Poor static analysis results for generated code (e.g., high number of critical issues, low quality score).
    *   High complexity of the item being generated.
*   **Process**:
    1.  When a review is triggered, a task is created in the `human_review_tasks` database table.
    2.  (Optional) A notification can be sent (e.g., via Slack) to designated reviewers.
    3.  Reviewers use the frontend's `HumanReviewInterface.tsx` (for code) or an equivalent interface for specifications to examine the flagged item, AI's reasoning/confidence, and provide feedback or corrections.
    4.  The reviewed and potentially corrected content is then integrated back into the system.
*   **Importance**: This system acts as a crucial quality gate, mitigating risks associated with AI hallucinations or suboptimal outputs, and allows for continuous improvement of the AI's performance through feedback.

## Testing

### Frontend Tests

Navigate to the `frontend/` directory:

*   **Unit & Component Tests**: Run with Vitest.
    ```bash
    npm test 
    # or
    npm run test:watch
    ```
*   **End-to-End Tests**: Run with Cypress.
    ```bash
    npm run test:e2e
    # or to open the Cypress runner:
    npm run test:e2e:open
    ```

### Backend (n8n Workflow) Tests

*   **Manual Execution**: Use the n8n UI to manually execute workflows with sample JSON inputs to test individual nodes and overall flow.
*   **Webhook Testing**: Use tools like Postman or `curl` to send requests to your activated webhook URLs and observe the execution in n8n.
*   **Assertions**: Add Function nodes within your n8n workflows at critical points to assert expected data structures or values, and use an IF node to branch to an error state if assertions fail.

### End-to-End Testing Scenarios

1.  **Full Specification Lifecycle**:
    *   Start a new conversation from the UI.
    *   Provide an initial project prompt.
    *   Answer clarifying questions from the AI.
    *   Trigger specification generation.
    *   View the generated specification.
    *   (If review triggered) Check the `human_review_tasks` table or notification.
2.  **Code Generation Lifecycle**:
    *   Navigate to the Code Generation page.
    *   Select a generated specification.
    *   Choose target frameworks.
    *   Initiate code generation.
    *   Monitor progress.
    *   View generated files and static analysis reports in the UI.
    *   (If review triggered) Use the `HumanReviewInterface` to review and approve/reject code.
    *   (If GitHub configured) Verify code is committed to the repository.

## Production Deployment Guidance

Deploying the platform to production involves several key considerations:

1.  **Containerization**: Use Docker and Docker Compose (or Kubernetes for larger scale) for all services (Frontend Nginx, n8n, PostgreSQL, Redis).
2.  **n8n Production Mode**:
    *   Set `EXECUTIONS_PROCESS=main` and `QUEUE_MODE=redis` (if using Redis for queueing) in n8n environment variables for scalability.
    *   Ensure `N8N_ENCRYPTION_KEY` is strong and securely managed.
    *   Configure proper logging.
3.  **HTTPS**: Secure all communication with HTTPS. Use a reverse proxy like Nginx or Traefik to handle SSL termination for n8n and the frontend.
4.  **Database**:
    *   Use a managed PostgreSQL service (e.g., AWS RDS, Google Cloud SQL, Supabase) for reliability, backups, and scaling.
    *   Ensure `pgvector` is enabled.
    *   Configure regular automated backups.
5.  **Frontend**:
    *   Build the React app for production (`npm run build`).
    *   Serve the static files from the `dist/` folder using Nginx or a CDN.
    *   Ensure `VITE_API_BASE_URL` and `VITE_WS_URL` in the frontend build point to your production n8n/proxy URLs.
6.  **Environment Variables**: Securely manage all production environment variables and API keys (e.g., using Docker secrets, HashiCorp Vault, or cloud provider's secret management services). **Do not commit secrets to Git.**
7.  **Scalability**:
    *   n8n can be scaled by running multiple instances in `main` mode connected to the same database and queue.
    *   Scale PostgreSQL and Redis as needed.
8.  **Security Hardening**:
    *   Regularly update all dependencies.
    *   Configure firewalls and network security groups.
    *   Implement rate limiting on public-facing APIs.
    *   Follow security best practices for Nginx, Docker, and your chosen cloud provider.

Refer to the `integration_and_deployment_guide.md` and `Dockerfile` along with `docker/nginx/default.conf` for more detailed examples.

## Troubleshooting

*   **n8n Workflow Not Triggering**:
    *   Ensure the workflow is **active** in the n8n UI.
    *   Verify the webhook URL called by the frontend matches the one displayed in the n8n Webhook node.
    *   Check n8n execution logs for errors.
*   **Database Connection Issues (n8n or other services)**:
    *   Verify hostname, port, username, password, and database name in n8n credentials and/or `.env` files.
    *   Ensure Docker containers are on the same network (`ai-platform-net` in the provided `docker-compose.yml`).
    *   Check PostgreSQL logs (`docker-compose logs postgres`).
*   **Frontend API Errors**:
    *   Open browser developer tools (Network tab) to inspect API requests and responses.
    *   Check `VITE_API_BASE_URL` in `frontend/.env`.
    *   Verify CORS configuration if frontend and n8n are on different domains/ports without a proxy.
*   **OpenAI API Errors**:
    *   Ensure `OPENAI_API_KEY` is correctly set in n8n credentials or environment variables.
    *   Check your OpenAI account for billing issues or rate limits.
*   **Low Quality AI Output / Hallucinations**:
    *   Review and refine the prompts in the n8n OpenAI nodes. Make them more specific, add examples, or constrain the output format.
    *   Adjust the "Temperature" setting in OpenAI nodes (lower values like 0.1-0.3 tend to be more factual).
    *   Ensure the correct AI model is selected (e.g., GPT-4o for complex tasks).
    *   Utilize the human review system to catch and correct issues.

## Contributing

(Placeholder - Add guidelines for contributing to the project, code style, PR process, etc.)

We welcome contributions! Please see `CONTRIBUTING.md` for more details.

## License

This project is licensed under the MIT License - see the `LICENSE` file for details.
