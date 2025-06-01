# AI Assistant Platform: Manual Deployment & Configuration Guide

This guide provides detailed instructions for deploying the AI Assistant Platform, focusing on the manual configuration steps required to get all components interconnected and operational.

## 1. Introduction

Deploying the AI Assistant Platform involves setting up several services (PostgreSQL, Redis, n8n, Frontend) and ensuring they can communicate correctly. While Docker automates much of the service setup, several crucial configuration steps for n8n, external service connections, and environment variables must be performed manually.

This guide assumes you have already cloned the project repository and have the necessary prerequisites installed.

## 2. Prerequisites

Before you begin, ensure you have the following:

*   **Docker and Docker Compose**: Latest stable versions.
*   **Project Files**: The complete project repository cloned to your machine.
*   **API Keys & Credentials**:
    *   OpenAI API Key.
    *   GitHub Personal Access Token (PAT) with `repo` scope (if using GitHub integration for code commits).
    *   Slack Webhook URL (if using Slack notifications for human review tasks or other alerts).
*   **A Text Editor**: For editing configuration files.
*   **Web Browser**: For accessing the n8n UI and the frontend application.

## 3. Step 1: Environment Variable Configuration

This is a critical manual step. All sensitive information and service configurations are managed through environment variables.

1.  **Locate `.env.example`**: In the root of the project, you'll find a `.env.example` file.
2.  **Create `.env` File**: Copy `.env.example` to a new file named `.env` in the same root directory.
    ```bash
    cp .env.example .env
    ```
3.  **Edit `.env` File**: Open the `.env` file with your text editor and carefully fill in all required values. Pay close attention to:

    *   **Database Credentials (`POSTGRES_...`)**:
        *   `POSTGRES_USER`: Desired PostgreSQL username (e.g., `ai_user`).
        *   `POSTGRES_PASSWORD`: A strong password for the PostgreSQL user. **Change this from the default.**
        *   `POSTGRES_DB`: Name for your PostgreSQL database (e.g., `ai_platform`).

    *   **Redis Password (`REDIS_PASSWORD`)**:
        *   A strong password for Redis. **Change this from the default.**

    *   **n8n Configuration (`N8N_...`)**:
        *   `N8N_USER`: Username for accessing the n8n UI.
        *   `N8N_PASSWORD`: A strong password for the n8n UI. **Change this from the default.**
        *   `N8N_ENCRYPTION_KEY`: **Crucial for security.** A **32-character random string** used by n8n to encrypt credentials. Generate a strong, unique key. You can use a password generator or a command like `openssl rand -hex 16` (which gives 32 hex characters).
        *   `WEBHOOK_URL`: The base URL n8n will use to generate its webhook URLs. For local Docker deployment, this is usually `http://localhost:5678`. If deploying n8n behind a reverse proxy with a custom domain and HTTPS, this should be your public n8n URL (e.g., `https://n8n.yourdomain.com`).

    *   **API Keys**:
        *   `OPENAI_API_KEY`: Your OpenAI API key (e.g., `sk-xxxxxxxxxxxx`).
        *   `GITHUB_TOKEN`: Your GitHub Personal Access Token (if using GitHub integration).

    *   **Frontend Configuration (`VITE_...`)**:
        *   `VITE_API_BASE_URL`: The URL the frontend will use to call your n8n API endpoints.
            *   If running n8n directly exposed on `localhost:5678` and frontend on `localhost:3000` (or similar), this would be `http://localhost:5678` (or `http://localhost:5678/webhook` if all your n8n webhooks start with `/webhook`).
            *   If using the provided Nginx setup in `Dockerfile` and `docker/nginx/default.conf` which proxies `/api` to n8n, this should be `/api` (if frontend and Nginx are served from the same origin) or `http://your-nginx-host:port/api`. For local Docker development with Nginx, this might be `http://localhost:8080/api` if Nginx is on port 8080.
        *   `VITE_WS_URL`: The WebSocket URL. If n8n is at `http://localhost:5678`, this would be `ws://localhost:5678`. Adjust if using a reverse proxy.
        *   `VITE_USE_MOCK_API`: Set to `false` to use the live n8n backend. Set to `true` if you want to use the mock API server for frontend development.

    **Security Note**: Never commit your actual `.env` file with secrets to your Git repository. Ensure `.env` is listed in your `.gitignore` file.

## 4. Step 2: Start Docker Services

Once your `.env` file is configured, you can start all the necessary services (PostgreSQL, Redis, n8n) using Docker Compose.

```bash
docker-compose up -d
```

*   This command reads the `docker-compose.yml` file and your `.env` file to configure and start the containers in detached mode (`-d`).
*   The database initialization scripts in `db/init/` will run automatically when the PostgreSQL container starts for the first time.

To check if services are running:
```bash
docker-compose ps
```
You should see `postgres`, `redis`, and `n8n` services running.

## 5. Step 3: n8n Manual Configuration

These steps are performed in the n8n Web UI.

### 5.1 Access n8n UI

Open your web browser and navigate to the n8n instance. If running locally as per `docker-compose.yml`, this is typically:
`http://localhost:5678`

Log in using the `N8N_USER` and `N8N_PASSWORD` you set in your `.env` file.

### 5.2 Create n8n Credentials

n8n workflows need credentials to connect to external services. You must create these manually in the n8n UI.

1.  Click on the **Credentials** section in the left sidebar (or under your profile/settings icon, depending on n8n version).
2.  Click **Add credential**.
3.  Create the following credentials, ensuring the "Credential Name" matches what's expected in the workflow files (typically the default name suggested by n8n when you select the type, or a custom name if specified in the workflow's node settings).

    *   **PostgreSQL**:
        *   **Credential Type**: `Postgres`
        *   **Credential Name**: `Postgres Account` (or verify the name used in the workflow's Postgres nodes)
        *   **Host**: `postgres` (This is the service name defined in `docker-compose.yml`, resolvable within the Docker network)
        *   **Port**: `5432`
        *   **Database**: The value of `POSTGRES_DB` from your `.env` file.
        *   **User**: The value of `POSTGRES_USER` from your `.env` file.
        *   **Password**: The value of `POSTGRES_PASSWORD` from your `.env` file.
        *   **SSL**: Set to `false` or `Allow` for local Docker-to-Docker connections. For production, configure appropriately.
        *   Save the credential.

    *   **OpenAI API**:
        *   **Credential Type**: `OpenAI API`
        *   **Credential Name**: `OpenAI Account` (or verify name)
        *   **API Key**: Your `OPENAI_API_KEY` from your `.env` file.
        *   Save the credential.

    *   **GitHub (Optional - if using code commit features)**:
        *   **Credential Type**: `GitHub API`
        *   **Credential Name**: `GitHub Account` (or verify name)
        *   **Authentication**: `Personal Access Token`
        *   **Access Token**: Your `GITHUB_TOKEN` from your `.env` file. This token needs `repo` scope to create/commit to repositories.
        *   Save the credential.

    *   **Slack (Optional - if using notifications)**:
        *   **Credential Type**: `Slack`
        *   **Credential Name**: `Slack Account` (or verify name)
        *   **Authentication Method**: Typically `Webhook URL` for simple notifications, or `OAuth2` for more complex interactions.
        *   **Webhook URL**: If using webhook, paste your Slack Incoming Webhook URL here.
        *   Save the credential.

### 5.3 Import Workflows

1.  Navigate to the **Workflows** section in the n8n UI.
2.  Click the **"Add Workflow"** button, then choose **"Import from File"**.
3.  Import each of the following JSON files from the `workflows/` directory of your project:
    *   `optimized_conversation_manager_workflow.json`
    *   `optimized_code_generation_workflow.json`
    *   `workflow_automation_workflow.json` (if provided and you intend to use its features)

### 5.4 Activate Workflows and Verify Credentials

For each imported workflow:

1.  **Open the Workflow**: Click on its name in the Workflows list.
2.  **Check Credential Linkage**:
    *   Examine nodes that connect to external services (e.g., `Postgres`, `OpenAI API`, `GitHub`, `Slack`).
    *   Ensure the "Credential for..." dropdown in each node is correctly selecting the credential you created in step 5.2. If a node shows "No credentials selected" or an incorrect one, select the appropriate credential from the dropdown.
3.  **Save the Workflow**: Click the "Save" button.
4.  **Activate the Workflow**: Toggle the switch (usually in the top-right corner of the workflow editor) from "Inactive" to "Active".
    *   An active workflow means its Webhook trigger nodes are listening for incoming requests.

### 5.5 Understanding Webhook URLs

*   When you activate a workflow that starts with a **Webhook node**, n8n makes its URL live.
*   **Test URL vs. Production URL**: The Webhook node usually shows two URLs:
    *   **Test URL**: Used for testing while you have the workflow open in the editor (e.g., `http://localhost:5678/webhook-test/...`).
    *   **Production URL**: Used when the workflow is active and you are not in test mode (e.g., `http://localhost:5678/webhook/...`).
*   The **path** segment of the webhook URL (e.g., `conversation/start` in `http://localhost:5678/webhook/conversation/start`) is defined in the Webhook node's "Path" parameter within the n8n workflow editor.
*   Your frontend application will make API calls to these Production URLs.

## 6. Step 4: Frontend Configuration

The frontend needs to know where to send API requests (to your n8n webhooks).

1.  **Navigate to Frontend Directory**:
    ```bash
    cd frontend
    ```
2.  **Configure `.env` for Frontend**:
    *   Ensure you have a `.env` file in the `frontend/` directory (copy from `frontend/.env.example` if needed).
    *   Set `VITE_API_BASE_URL` to the base URL of your n8n webhooks.
        *   If you are **not** using an Nginx reverse proxy in front of n8n for API calls, and n8n is at `http://localhost:5678`, this might be `http://localhost:5678`. The actual paths like `/webhook/conversation/start` will be appended by your API service files.
        *   If you **are** using the Nginx setup provided in `Dockerfile` and `docker/nginx/default.conf` which proxies `/api` to n8n's webhook path, and Nginx is running on port `8080`, then `VITE_API_BASE_URL` should be `http://localhost:8080/api`.
    *   Set `VITE_WS_URL` for WebSocket connections if your application uses them. This would typically point to your n8n server or a dedicated WebSocket server. For n8n, it might be `ws://localhost:5678` if not proxied.
    *   Set `VITE_USE_MOCK_API=false` to use the live n8n backend.

3.  **Install Dependencies and Run**:
    ```bash
    npm install 
    npm run dev
    ```
    The frontend should now be accessible, typically at `http://localhost:3000` or `http://localhost:5173`.

## 7. Step 5: Initial System Test

1.  **Open Frontend**: Access the frontend application in your browser.
2.  **Register/Login**: Create a new user account or log in with demo credentials if available.
3.  **Start a Conversation**:
    *   Navigate to the "Conversation" or "New Project" section.
    *   Initiate a conversation with an initial prompt (e.g., "I want to build a simple to-do list app").
    *   **Check n8n**: Go to the n8n UI -> Executions. You should see an execution for the `optimized_conversation_manager_workflow.json`. Verify it ran successfully or inspect errors.
    *   **Check Frontend**: Observe if the AI responds with clarifying questions or an analysis summary.
4.  **Generate Specification**:
    *   Continue the conversation until enough information is gathered.
    *   Trigger specification generation (either automatically by the workflow or via a UI button if implemented).
    *   **Check n8n**: Verify the `optimized_conversation_manager_workflow.json` execution related to spec generation.
    *   **Check Database**: Look into the `specifications` table in your PostgreSQL database to see if a new entry was created.
    *   **Check Frontend**: View the generated specification in the UI.
5.  **Generate Code**:
    *   Navigate to the "Code Generation" page.
    *   Select the specification generated in the previous step.
    *   Choose frameworks and initiate code generation.
    *   **Check n8n**: Monitor the `optimized_code_generation_workflow.json` execution.
    *   **Check Database**: Check the `code_generation_sessions` and `code_files` tables. If human review was triggered, check `human_review_tasks`.
    *   **Check Frontend**: View the generated file tree and code previews.

## 8. Step 6: Production Considerations (Manual Aspects)

When deploying to a production environment:

1.  **HTTPS Configuration**:
    *   Manually configure a reverse proxy (e.g., Nginx, Traefik, Caddy) to sit in front of your n8n server and frontend server.
    *   Obtain and configure SSL/TLS certificates (e.g., from Let's Encrypt) for your domain(s) in the reverse proxy. This ensures all traffic is encrypted.
    *   Update `N8N_PROTOCOL=https` and `WEBHOOK_URL=https://your-n8n-domain.com` in your n8n environment variables.
    *   Update `VITE_API_BASE_URL` and `VITE_WS_URL` (if using WebSockets directly to n8n) in your frontend build to use `https://`.

2.  **Secure Secret Management**:
    *   Do not hardcode secrets or include them in your Git repository.
    *   For production, use a dedicated secret management solution like HashiCorp Vault, AWS Secrets Manager, Google Secret Manager, or Docker Secrets (for Swarm/Kubernetes).
    *   Inject these secrets into your Docker containers as environment variables at runtime.

3.  **Database Backups & Security**:
    *   If using a self-hosted PostgreSQL, manually set up and verify regular automated backup procedures (e.g., using `pg_dump` and cron jobs).
    *   Ensure your production database is not publicly accessible and is firewalled appropriately.

4.  **n8n Execution Data Pruning**:
    *   Manually configure n8n's data pruning settings (via environment variables like `EXECUTIONS_DATA_PRUNE`, `EXECUTIONS_DATA_MAX_AGE`) to prevent the database from growing indefinitely with execution logs.

## 9. Troubleshooting Common Manual Configuration Issues

*   **"Workflow not found" or 404 errors from frontend to n8n**:
    *   **Cause**: Workflow not active in n8n, incorrect `VITE_API_BASE_URL` in frontend, or incorrect "Path" in n8n Webhook node.
    *   **Solution**: Ensure the target workflow is active. Double-check the full webhook URL (base + path) called by the frontend against the Production URL shown in the n8n Webhook node.

*   **n8n Node Errors: "Credentials not found" or "Authentication failed"**:
    *   **Cause**: Credential name in the n8n node does not match the name used when creating the credential in n8n UI, or the credential details (API key, password) are incorrect.
    *   **Solution**: Open the failing n8n workflow, find the node, and re-select the correct credential from the dropdown. Verify the credential details themselves are correct in the Credentials section.

*   **n8n Errors: "Cannot connect to database" / "Database authentication failed"**:
    *   **Cause**: Incorrect PostgreSQL credential details in n8n, PostgreSQL service not running, or network connectivity issue between n8n and PostgreSQL containers.
    *   **Solution**: Verify `postgres` service is running (`docker-compose ps`). Check n8n's PostgreSQL credential details. Ensure `DB_POSTGRESDB_HOST` in n8n's environment is `postgres` (the Docker service name).

*   **Environment Variables Not Taking Effect**:
    *   **Cause**: Docker Compose might not have picked up changes in `.env` if containers were already running.
    *   **Solution**: Restart services: `docker-compose down && docker-compose up -d`. For n8n, sometimes a direct container restart is needed: `docker-compose restart n8n`.

*   **CORS Issues (Frontend to n8n)**:
    *   **Cause**: If frontend and n8n are on different origins (domains/ports) and no reverse proxy is handling CORS.
    *   **Solution**:
        *   **Recommended**: Use a reverse proxy (like the provided Nginx setup) to serve both frontend and proxy n8n API calls from the same origin.
        *   **Alternative (n8n config)**: Set n8n environment variables for CORS if direct cross-origin calls are necessary (e.g., `N8N_CORS_ALLOWED_ORIGINS=http://localhost:3000`). This is generally less secure for production.

*   **OpenAI/GitHub API Key Issues**:
    *   **Cause**: Invalid API key, insufficient permissions/scope for the key, or billing issues with the provider.
    *   **Solution**: Regenerate API keys if necessary. Ensure GitHub PAT has `repo` scope. Check your OpenAI account status.

By carefully following these manual configuration steps, you can ensure a smooth deployment and a stable, well-integrated AI Assistant Platform.
