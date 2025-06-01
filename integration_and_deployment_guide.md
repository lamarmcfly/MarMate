# Integration & Deployment Guide  
AI Assistant Platform (n8n + PostgreSQL + React)

---

## 0. Prerequisites

| Tool | Tested Version | Purpose |
|------|----------------|---------|
| Docker / Docker-Compose | 24.x | Container orchestration |
| Node.js | ≥ 18.x | Build React SPA |
| pnpm (or npm/yarn) | ≥ 8.x | JS package manager |
| Git | ≥ 2.40 | Clone repos, push code |
| OpenAI account | — | LLM API key |
| GitHub account (optional) | — | Code repo integration |
| A domain name + HTTPS cert | — | Production deployment |

---

## 1. Repository Layout

```
ai-assistant-platform/
├─ docker/                  # Container configs
│   ├─ docker-compose.yml
│   └─ n8n/
│       ├─ Dockerfile
│       └─ .env.example
├─ db/
│   └─ database_schema.sql
├─ workflows/               # n8n JSON exports
│   ├─ conversation_manager_workflow.json
│   ├─ code_generation_workflow.json
│   └─ workflow_automation_workflow.json
└─ frontend/
    └─ … (React app)
```

Clone or copy all generated files into this folder.

---

## 2. PostgreSQL Setup

### 2.1 Local (Docker)

```bash
cd ai-assistant-platform
docker network create ai-platform-net

docker run -d --name pg-ai \
  --network ai-platform-net \
  -e POSTGRES_USER=ai_user \
  -e POSTGRES_PASSWORD=supersecret \
  -e POSTGRES_DB=ai_platform \
  -p 5432:5432 \
  postgres:16
```

### 2.2 Apply Schema

```bash
docker cp db/database_schema.sql pg-ai:/schema.sql
docker exec -it pg-ai psql -U ai_user -d ai_platform -f /schema.sql
```

The schema enables `uuid-ossp` + `pgvector`; if the extension install fails, connect as superuser (`postgres`) and rerun `CREATE EXTENSION …`.

### 2.3 Production Tips

- Use managed Postgres (Supabase, Neon, AWS RDS) with daily automated backups.  
- Enable connection pooling (pgbouncer) once concurrent workflows > 50.  
- Restrict inbound traffic to n8n’s container IP(s) / VPC.

---

## 3. n8n Server

### 3.1 Build & Run (Docker Compose)

`docker/docker-compose.yml`

```yaml
version: '3.8'
services:
  n8n:
    build:
      context: ./n8n
    environment:
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=admin
      - N8N_BASIC_AUTH_PASSWORD=<STRONG_PASSWORD>
      - N8N_HOST=localhost
      - N8N_PORT=5678
      - DB_TYPE=postgresdb
      - DB_POSTGRESDB_HOST=pg-ai
      - DB_POSTGRESDB_PORT=5432
      - DB_POSTGRESDB_DATABASE=ai_platform
      - DB_POSTGRESDB_USER=ai_user
      - DB_POSTGRESDB_PASSWORD=supersecret
      - GENERIC_TIMEZONE=UTC
      - N8N_ENCRYPTION_KEY=<32_char_secret>
      - EXECUTIONS_PROCESS=main
      - WEBHOOK_TUNNEL_URL=https://yourdomain.com
      - OPENAI_API_KEY=<your_openai_key>
      - GITHUB_TOKEN=<optional_pat>
    ports:
      - "5678:5678"
    networks:
      - ai-platform-net
    volumes:
      - n8n_data:/home/node/.n8n
volumes:
  n8n_data:
networks:
  ai-platform-net:
    external: true
```

```bash
docker compose -f docker/docker-compose.yml up -d
```

n8n is now at `http://localhost:5678` (use HTTPS in prod).

### 3.2 Import Workflows

1. Open n8n UI → **Workflows → Import from File**.  
2. Import each JSON in `workflows/` folder.  
3. Save & **activate** them (toggle top-right).

Environment variables (OpenAI, DB, GitHub) are read automatically; adjust credentials nodes in UI if needed.

### 3.3 Secure n8n

- Force HTTPS (reverse proxy with Caddy / Traefik).  
- Change default credentials & disable `executeWorkflow` via REST unless required.  
- Store secrets in Docker secrets or Vault; never commit `.env` with real keys.  
- Enable two-factor auth plugin for production.

---

## 4. React Frontend

### 4.1 Configuration

`frontend/.env`

```
VITE_API_BASE_URL=https://yourdomain.com # same as WEBHOOK_TUNNEL_URL
VITE_WS_URL=wss://yourdomain.com/ws
```

### 4.2 Install & Build

```bash
cd frontend
pnpm install      # or npm install
pnpm run build    # outputs to dist/
```

### 4.3 Serve

Local dev:

```bash
pnpm run dev   # http://localhost:5173
```

Production options:

1. **Static** – Copy `dist/` to S3 + CloudFront or Vercel.  
2. **Docker** – Use nginx:

```dockerfile
# frontend/Dockerfile
FROM node:18-alpine as build
WORKDIR /app
COPY . .
RUN pnpm install && pnpm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
```

Add this service to `docker-compose.yml` on same network.

---

## 5. End-to-End Test

1. Navigate to React app → submit project description.  
2. Observe chat messages; n8n logs should show conversation workflow run.  
3. When “spec_ready” true, click *Specification* tab.  
4. Trigger **/code/generate** endpoint via UI or Postman to see repository output.  
5. View **/workflow/project/:projectId** endpoint JSON for Gantt diagram & tasks.

---

## 6. Scaling & Performance

| Component | Action |
|-----------|--------|
| n8n | Horizontal scale with multiple worker pods + Redis queue (set `QUEUE_BULL_REDIS_*`). |
| Postgres | Use read replicas; enable `pgvector` IVF index quantization for >1 M embeddings. |
| OpenAI | Cache embeddings/completions (redis TTL) to cut token cost 30-50 %. |
| Frontend | Enable HTTP/2 + CDN; split chunks with Vite `build.rollupOptions`. |

---

## 7. Security Checklist

- 🔒 Rotate API keys quarterly.  
- 🔒 Enable Row Level Security if multitenant.  
- 🔒 Harden CORS (`Access-Control-Allow-Origin` whitelist).  
- 🔒 Run `npm audit` & `docker scan` in CI.  
- 🔒 Turn on Postgres TLS (`sslmode=require`).

---

## 8. Maintenance & Monitoring

| Area | Tool | Frequency |
|------|------|-----------|
| DB backups | pg_dump / provider snapshots | Daily |
| Workflow runs | n8n execution list | Weekly review |
| Logs | Grafana Loki + Promtail | Continuous |
| Alerts | Uptime Kuma / Prometheus Alertmanager | On-call |
| Dependency updates | Renovate bot | Auto PR weekly |
| Cost audit | OpenAI usage dashboard | Weekly |

---

## 9. Troubleshooting

| Symptom | Likely Cause | Fix |
|---------|--------------|-----|
| `ECONNREFUSED 5432` in n8n | Postgres container not up | `docker logs pg-ai` |
| Workflows stay “waiting” | Bad webhook URL | Update `WEBHOOK_TUNNEL_URL` & restart |
| OpenAI 429 errors | Rate limit | Increase `OPENAI_ORG_QUOTA` or back-off in workflow |
| React CORS errors | Wrong API base URL | Verify `.env` & proxy headers |

---

## 10. Going Live

1. Point DNS `api.yourdomain.com` → reverse proxy.  
2. Obtain Let’s Encrypt cert (Caddy auto).  
3. Update `.env`, rebuild images, redeploy.  
4. Run load test (`k6`, 100 RPS) – ensure p95 < 300 ms.  
5. Create first production user account, disable sign-up if closed beta.

---

### Congratulations!

Your AI Assistant Platform is now fully operational with n8n orchestration, PostgreSQL persistence, and a modern React interface. Enhance further by:

- Adding additional agents (Design, DevOps) as new n8n workflows.  
- Switching to serverless Postgres (Neon) for burst traffic.  
- Implementing WebAuthn login for stronger security.

Happy building! 🚀
