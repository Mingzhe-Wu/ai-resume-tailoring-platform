# ResumeTailor Backend

## Project Overview

ResumeTailor Backend is a Spring Boot service for storing resume source data and generating job-tailored resume text with the OpenAI API.

The backend supports a workflow where a user:

1. Registers and logs in to obtain a JWT.
2. Creates a profile with contact information, summary, and optional prior resume text.
3. Stores education, experience, projects, skills, and target job descriptions.
4. Triggers resume generation for a saved job.
5. Receives generated resume content, which is persisted in the database for that job.

The service focuses on backend CRUD workflows, authentication, and AI-powered resume generation. It does not include deployment automation, database migrations, or infrastructure provisioning in this repository.

## Tech Stack

- Java 17
- Spring Boot 4
- Spring Web MVC
- Spring Security
- MyBatis
- MySQL
- JWT via `jjwt`
- OpenAI Chat Completions API integration
- Maven Wrapper (`mvnw`, `mvnw.cmd`)
- Lombok
- Jakarta Bean Validation

## Backend Architecture

### Controllers

REST controllers under `src/main/java/com/mingzhe/resumetailor/*` expose resource-oriented API groups:

- `AuthController`
- `UserController`
- `ProfileController`
- `EducationController`
- `ExperienceController`
- `ProjectController`
- `SkillController`
- `JobController`
- `ResumeController`

Each controller delegates business logic to a service and returns JSON responses with standard HTTP status codes.

### Services

Service classes implement validation and application logic, including:

- authentication and password verification
- resource existence checks
- date and GPA validation
- skill CSV import
- resume generation prompt construction
- OpenAI retry handling
- persistence of generated resume content

### Mappers

MyBatis mapper interfaces perform SQL access directly with annotation-based queries. The project uses mapper methods for inserts, fetches, updates, and deletes across all major entities.

### Models and DTOs

The codebase separates persistence models from request/response DTOs where needed:

- Models/entities: `User`, `Profile`, `Education`, `Experience`, `Project`, `Skill`, `Job`, `Resume`
- Auth DTOs: `UserRequestDTO`, `LoginResponseDTO`
- CRUD DTOs for create/update requests across modules
- Resume generation helper: `ResumeGenerationContext`
- CSV import response DTO: `SkillImportResponseDTO`
- Error payload DTO: `ErrorResponse`

### Exception Handling

`GlobalExceptionHandler` converts several application exceptions into JSON error responses:

- validation failures from `@Valid`
- custom bad request exceptions
- resource not found exceptions
- `DataAccessException` database failures

### Authentication and Security Flow

- `POST /api/auth/**` endpoints are public.
- All other routes require authentication.
- `JwtAuthenticationFilter` reads `Authorization: Bearer <token>`.
- `JwtService` validates token signature and expiration, then places the user email into the Spring Security context.
- Passwords used in registration and login are handled with `BCryptPasswordEncoder`.
- Security is stateless; sessions are disabled.
- CORS currently allows `http://localhost:5173`.

## Core Features

- User registration
- User login with JWT issuance
- Authenticated API access for non-auth routes
- User CRUD endpoints
- Profile CRUD, including contact data, summary, and prior resume text
- Education CRUD with date and GPA validation
- Experience CRUD with date validation
- Project CRUD with date validation
- Skill CRUD
- Skill CSV import by profile
- Job CRUD with stored title, company, job description, source URL, status, and interview time
- Resume CRUD
- Resume generation from stored profile and job data
- Asynchronous resume generation endpoint
- Persistence of generated resume content in `resume_versions`

## Resume Generation Workflow

The implemented resume generation flow is centered in `ResumeService`.

1. A client calls the resume generation endpoint with a `jobId`.
2. The service loads the target `Job`.
3. Using `job.userId`, the service loads the related `Profile`.
4. It then gathers:
   - experiences by `profileId`
   - educations by `profileId`
   - projects by `profileId`
   - skills by `profileId`
5. These records are assembled into a `ResumeGenerationContext`.
6. `buildPrompt(...)` creates a structured prompt containing:
   - target job information
   - candidate profile data
   - optional prior resume text
   - education, experience, project, and skill sections
   - realism and formatting constraints
7. `OpenAiService.generate(...)` sends the prompt to the OpenAI Chat Completions API.
8. `callLlmWithRetry(...)` retries up to three times if generation or validation fails.
9. The generated text is validated to reject empty, too-short, or obviously failed responses.
10. The service inserts or updates the related record in `resume_versions`.

Additional implemented behavior:

- An async endpoint delegates to `generateResumeAsync(...)` using Spring `@Async`.
- The service keeps an in-memory cache keyed by `jobId` and `profileId` to avoid regenerating the same resume within five minutes.

## Database Design

The repository does not include SQL schema files or migrations, but the table structure is visible from the MyBatis mappers.

### Major tables

- `users`
  - `id`, `email`, `password`, `created_at`

- `profiles`
  - `id`, `user_id`, `full_name`, `phone`, `contact_email`, `linkedin_url`, `github_url`, `location`, `summary`, `prior_resume`, timestamps

- `educations`
  - `id`, `profile_id`, `school_name`, `degree`, `major`, `start_date`, `end_date`, `gpa`, `relevant_coursework`, `description`, timestamps

- `experiences`
  - `id`, `profile_id`, `company_name`, `position`, `location`, `start_date`, `end_date`, `description`, timestamps

- `projects`
  - `id`, `profile_id`, `project_name`, `tech_stack`, `start_date`, `end_date`, `description`, timestamps

- `skills`
  - `id`, `profile_id`, `category`, `name`, timestamps

- `jobs`
  - `id`, `user_id`, `title`, `company`, `job_description`, `source_url`, `status`, `interview_time`, timestamps

- `resume_versions`
  - `id`, `job_id`, `match_score`, `generated_content`, `pdf_file_path`, timestamps

### Relationships

- One `User` can own one `Profile` in current service logic.
- One `User` can own many `Job` records.
- One `Profile` can own many `Education`, `Experience`, `Project`, and `Skill` records.
- One `Job` maps to one stored generated resume record in current resume service behavior, even though the table name is `resume_versions`.

## API Overview

Major API groups implemented in the controllers:

- `/api/auth`
  - registration
  - login

- `/api/user`
  - create, fetch, update, delete

- `/api/profile`
  - create, fetch by user, update, delete

- `/api/education`
  - create, fetch by profile, update, delete

- `/api/experience`
  - create, fetch by profile, update, delete

- `/api/project`
  - create, fetch by profile, update, delete

- `/api/skill`
  - create, fetch by profile, update, delete
  - CSV import for skills

- `/api/job`
  - create, fetch by user, update, delete

- `/api/resume`
  - create, fetch by job, update, delete
  - synchronous resume generation
  - asynchronous resume generation

Except for `/api/auth/**`, requests require a Bearer token.

## Local Development Setup

### Prerequisites

- Java 17
- Maven, or use the included Maven Wrapper
- MySQL
- OpenAI API key for resume generation endpoints

### Configuration

Current datasource settings are defined in `src/main/resources/application.yaml`:

- database: `resumetailor`
- username: `resumeuser`
- password: `resume123`
- host: `localhost:3306`

You can either:

- create a local MySQL instance that matches these values, or
- override the Spring datasource properties for your environment

Required environment variable for AI generation:

```bash
OPENAI_API_KEY=your_api_key_here
```

### Database Initialization

The backend was developed against a Dockerized MySQL instance for consistent local database setup during development.

This repository currently does not include Docker Compose or automated infrastructure provisioning files.

The schema must be created manually based on the mapper definitions before the application can run successfully.

### Start the Application

Windows:

```powershell
.\mvnw.cmd spring-boot:run
```

macOS/Linux:

```bash
./mvnw spring-boot:run
```

Run tests:

```bash
./mvnw test
```

Note: the repository currently contains only a minimal Spring Boot test class, so automated coverage is limited.

## Error Handling and Validation

Implemented validation and error handling includes:

- `@Valid` on many create endpoints for DTO-based required fields
- service-layer existence checks for related records such as user, profile, job, and resume
- date validation for education, experience, and project ranges
- GPA range validation for education (`0.00` to `4.00`)
- resume `matchScore` validation (`0` to `100`)
- CSV import input checks for empty files and malformed rows
- JSON error responses via `ErrorResponse`

Current error response behavior in the global handler:

- `400 Bad Request` for validation failures and custom bad request exceptions
- `404 Not Found` for missing resources
- `500 Internal Server Error` for `DataAccessException`

## Future Improvements

Reasonable next steps based on the current codebase:

- add database migrations and seed scripts
- add stronger integration and service-level test coverage
- externalize JWT secret and datasource credentials
- improve OpenAI request/response handling and structured parsing
- add API documentation such as OpenAPI/Swagger
- move resume generation to a more robust background job flow
- improve prompt template management and versioning
