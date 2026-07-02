# AI ResumeTailor Platform v2.1

## Overview

AI ResumeTailor is a job application management platform with an AI resume assistant. It is not only a resume generator: the core product remains useful without AI through profile management, job tracking, resume editing, and browser-side PDF export.

AI enhances that workflow through Normal resume generation, RAG-based generation, database-backed prompt templates, controlled async generation, daily quota and rate limiting, generation history, and lightweight keyword hints.

## Key Features

### Core Product

- User registration and login with JWT authentication
- Master profile management using `profiles.full_name` as the user-facing name
- Education, experience, project, and skill records
- Skill CSV import
- Job tracker with status, interview time, notes, salary, source URL, and priority
- Job search and status filtering
- Skill search by name and backend-driven category dropdown
- Toast notifications and backend-aware frontend error handling

### Resume Builder

- Structured resume JSON schema
- PostgreSQL `JSONB` storage in `resume_versions.generated_content`
- ATS-style resume renderer
- Inline resume editing
- Contact, summary, education, experience, project, and skill editing
- Section visibility controls
- Save Resume workflow that persists the edited JSON document
- Resume overflow detection
- Browser-side PDF export from the rendered resume page
- Separate Normal and RAG resume versions per job

### AI Features

- Normal resume generation from the full profile
- RAG resume generation from retrieved profile evidence
- Lazy profile embedding generation
- PostgreSQL `pgvector` semantic retrieval
- Resume context builder for production and debug context formatting
- Database-backed prompt templates for Normal and RAG generation
- User prompt overrides with default prompt fallback
- Generation history with lifecycle status
- Token usage and estimated cost tracking when OpenAI usage data is available
- Database-backed keyword hints
- Async generation status and failure recovery

### Reliability / Production Features

- Redis-backed daily AI quota
- Redis-backed resume generation rate limiting
- Redis cache-aside for effective prompt templates
- Backend global exception handling and full server-side exception logging
- Async generation lifecycle statuses: `PENDING`, `RUNNING`, `SUCCESS`, `FAILED`
- Frontend polling that uses generation status instead of treating an old resume as a completed new one
- Docker Compose full-stack startup

## Tech Stack

### Backend

- Java 17
- Spring Boot 3.5
- Spring Security
- MyBatis
- PostgreSQL
- Flyway
- pgvector
- Redis
- OpenAI API
- JWT authentication

### Frontend

- React
- Vite
- Axios
- html2canvas
- jsPDF
- Nginx production container

### Infrastructure

- Docker Compose
- PostgreSQL / pgvector container
- Redis container
- Spring Boot backend container
- React static frontend container

## Project Structure

```text
backend/                Spring Boot backend
  src/main/java/        Feature-based backend packages
  src/main/resources/   Spring config and Flyway migrations
frontend/               React/Vite frontend
  src/components/resume Resume builder and renderer components
docs/                   Product roadmap and database design documents
docker-compose.yml      Full-stack Docker Compose setup
.env.example            Local environment template
```

## Quick Start with Docker Compose

Docker Compose is the recommended way to run the full application locally.

1. Clone the repository.
2. Copy the environment template:

```powershell
Copy-Item .env.example .env
Do not commit .env. Use .env.example for shared placeholders.
```

3. Fill local values in `.env`.

Set a long local JWT_SECRET. For production, use a strong secret managed outside the repository. AI generation requires `OPENAI_API_KEY`; the non-AI product surfaces can still run without calling OpenAI.

4. Start the stack:

```powershell
docker compose up --build
```

Default local URLs:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8080`
- PostgreSQL: `localhost:5433`
- Redis: `localhost:6379`

PostgreSQL uses port `5433` on the host by default because the container maps `${POSTGRES_PORT:-5433}:5432`.

If ports are already occupied, override them in PowerShell:

```powershell
$env:BACKEND_PORT='18080'
$env:FRONTEND_PORT='15173'
$env:VITE_API_BASE_URL='http://localhost:18080'
$env:CORS_ALLOWED_ORIGINS='http://localhost:15173'
docker compose up -d --build
```

Then open `http://localhost:15173`.

## Required Configuration

The project uses `.env.example` as the local configuration template.

| Variable | Purpose |
| --- | --- |
| `POSTGRES_DB` | PostgreSQL database name |
| `POSTGRES_USER` | PostgreSQL username |
| `POSTGRES_PASSWORD` | PostgreSQL password |
| `POSTGRES_PORT` | Host port mapped to PostgreSQL container port `5432` |
| `REDIS_PORT` | Host port mapped to Redis container port `6379` |
| `BACKEND_PORT` | Host port mapped to backend container port `8080` |
| `FRONTEND_PORT` | Host port mapped to frontend container port `80` |
| `VITE_API_BASE_URL` | Browser-facing backend API base URL |
| `CORS_ALLOWED_ORIGINS` | Allowed frontend origin for backend CORS |
| `OPENAI_API_KEY` | OpenAI API key used by AI generation and embeddings |
| `JWT_SECRET` | JWT signing secret |
| `JWT_EXPIRATION_MS` | JWT expiration duration in milliseconds |
| `AI_QUOTA_DAILY_LIMIT` | Daily AI generation quota per user |
| `AI_RATE_LIMIT_RESUME_GENERATE_PER_MINUTE` | Per-minute resume generation rate limit |
| `AI_PRICING_INPUT_PER_MILLION` | Estimated input token price per 1M tokens |
| `AI_PRICING_OUTPUT_PER_MILLION` | Estimated output token price per 1M tokens |

Inside Docker, the backend connects to PostgreSQL and Redis through Docker service names:

- PostgreSQL: `postgres`
- Redis: `redis`

Do not use `localhost` for container-to-container database or Redis access.

## Local Development Without Full Docker

You can run infrastructure in Docker and run the application processes locally.

Start PostgreSQL and Redis:

```powershell
docker compose up postgres redis
```

Run the backend:

```powershell
cd backend
mvn compile
mvn spring-boot:run
```

Run the frontend:

```powershell
cd frontend
npm install
npm run dev
```

For frontend local development, keep `VITE_API_BASE_URL` pointed at the backend, usually `http://localhost:8080`.

## Main User Workflow

1. Register or log in.
2. Complete the master profile.
3. Add education, experience, projects, and skills.
4. Import skills from CSV if useful.
5. Create a job.
6. Generate a Normal resume for a polished full-profile draft.
7. Generate a RAG resume when stricter job-description matching from existing evidence is needed.
8. Switch between Normal and RAG resume versions.
9. Edit the rendered resume inline.
10. Save the edited resume JSON.
11. Export the rendered resume as PDF.

## Normal vs RAG Generation

### Normal Generation

Normal generation uses the full profile context. It is better for most users, early drafts, rough profile content, and cases where the AI should organize, expand, compress, and shape a polished resume around a role direction.

### RAG Generation

RAG generation uses lazy embeddings and `pgvector` retrieval to select relevant profile evidence for a specific job description. It is better when factual grounding and job-specific evidence selection matter more than creative rewriting. It works best when the profile already contains many detailed, well-written bullets.

Neither mode is universally better. They are two different generation paths for different resume tailoring needs.

## Important Design Notes

- AI generates structured content, not visual layout.
- The frontend controls rendering, inline editing, section visibility, overflow detection, and PDF export.
- `resume_versions.need_generate` is a freshness flag that marks a resume as outdated.
- `generation_history.status` controls the async generation lifecycle.
- Keyword hints are lightweight manual checklist aids, not ATS scores or match scores.
- Resume scoring, ATS scoring, and AI self-review are intentionally avoided or deferred.
- Core job tracking and resume editing remain useful without AI.

## Database Overview

The PostgreSQL schema is managed by Flyway. Key tables include:

- `users`
- `profiles`
- `educations`
- `experiences`
- `projects`
- `skills`
- `jobs`
- `resume_versions`
- `profile_embedding_chunks`
- `prompt_templates`
- `generation_history`
- `skill_keywords`

The schema uses PostgreSQL enum types, `JSONB` for generated resume content, and `pgvector` for embedding retrieval. See the database design document in `docs/` for full relationships and constraints.

## Useful API Areas

Representative backend routes:

- Auth: `POST /api/auth/register`, `POST /api/auth/login`
- Profile: `/api/profile`
- Education: `/api/education`
- Experience: `/api/experience`
- Projects: `/api/project`
- Skills: `/api/skill`
- Skill keywords: `GET /api/skill-keywords`
- Jobs: `/api/job`
- Resume versions and generation: `/api/resume`
- Prompt templates: `/api/prompt-templates`
- AI quota: `GET /api/redis/quota/today?userId={userId}`

Async generation endpoints:

- Normal: `POST /api/resume/generate-async/{jobId}`
- RAG: `POST /api/resume/generate-rag-async/{jobId}`
- Status: `GET /api/resume/generation-status/{jobId}?generationMethod=NORMAL`
- Status: `GET /api/resume/generation-status/{jobId}?generationMethod=RAG`

Debug endpoints may exist for local Redis or RAG inspection, but they are not part of the formal frontend API.

## Documentation Map

- `docs/AI ResumeTailor Platform v2.1 Updated Roadmap.docx`
  - Product vision, architecture, implementation status, and milestone roadmap.
- `docs/AI_Resume_Tailoring_v2.1_Database_Design_SQL_Aligned_Updated.docx`
  - SQL-aligned PostgreSQL schema and relationships.
- Milestone summaries
  - Completed milestone implementation records are stored in the project documentation set or development notes.

## Current Status

Completed:

- Milestone 1: Product Foundation
- Milestone 2: Resume Builder
- Milestone 3: AI Foundation / RAG Generation
- Milestone 4: AI Configuration, Tracking & Maintainability

Next planned:

- Milestone 5: Deployment / Production Readiness

## Future Work

Future work should remain clearly separate from implemented features:

- AWS deployment
- CI/CD
- Chrome extension companion workflow
- Cover letter generation
- Interview preparation
- Resume comparison
- Analytics or cost dashboard
- DOCX export if prioritized later
- Multiple LLM provider support

## Validation Commands

Use these commands to validate the project after changes:

```powershell
cd backend
mvn compile
```

```powershell
cd frontend
npm run build
```

```powershell
docker compose build
docker compose up --build
```

Expected Docker Compose services:

- `postgres`: PostgreSQL with pgvector
- `redis`: Redis
- `backend`: Spring Boot API on port `8080` inside the container
- `frontend`: Nginx-served React build on port `80` inside the container

## Troubleshooting

### Port 8080 or 5173 is already in use

Override the ports before starting Docker Compose:

```powershell
$env:BACKEND_PORT='18080'
$env:FRONTEND_PORT='15173'
$env:VITE_API_BASE_URL='http://localhost:18080'
$env:CORS_ALLOWED_ORIGINS='http://localhost:15173'
docker compose up -d --build
```

### AI generation fails immediately

Check that `OPENAI_API_KEY` is set in `.env`. Also check daily quota and rate-limit settings:

- `AI_QUOTA_DAILY_LIMIT`
- `AI_RATE_LIMIT_RESUME_GENERATE_PER_MINUTE`

The frontend should show backend-provided quota, rate-limit, and generation failure messages when available.

### Frontend cannot reach the backend

Make sure `VITE_API_BASE_URL` points to the browser-accessible backend URL. In Docker local development, the default is:

```text
VITE_API_BASE_URL=http://localhost:8080
```

If the frontend port changes, update `CORS_ALLOWED_ORIGINS` to match the browser origin.

### Database migrations fail during startup

Flyway runs on backend startup. Check backend logs for the failing migration. If you are intentionally resetting local development data, Docker volumes can be recreated, but that deletes local database data.
