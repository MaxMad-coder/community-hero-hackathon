# Community Hero: Deployment and Infrastructure Guide

This guide describes how to configure, build, run, and deploy the **Community Hero** full-stack web application. The stack consists of a React 19 (Vite) frontend, an Express (TypeScript) server backend, and a local file database, with Gemini LLM deep integration.

---

## Workspace Port Configuration

> [!CAUTION]
> The port **3000** is hardcoded into the infrastructure and managed by an upstream Nginx reverse proxy routing layer.
>
> Do NOT configure the production server or development server to listen on any port other than `3000`. Do NOT read or override the `PORT` environment variable inside your custom configuration.

---

## Environment Variables Setup

You must define your environmental variables before starting the server. To configure them, create a `.env` file in the project root:

```bash
# Copy from the example template
cp .env.example .env
```

### Reference Parameters

| Variable Name | Required | Default Value | Description |
| :--- | :--- | :--- | :--- |
| `GEMINI_API_KEY` | **Yes** | - | Google Gemini Developer Key. Enables duplicate check, auto-categorization, timeline forecasting, voice transcribing, and the Conversational Assistant. |
| `JWT_SECRET` | No | `community_hero_secret_key_998182` | Encryption secret used by JSON Web Token engine to sign/verify citizen session payloads. |
| `NODE_ENV` | No | `development` | Dictates runtime mode. Set to `production` in live environments to activate static asset serving. |

---

## Local Development Lifecycle

### 1. Installation
Install all dependencies. This includes building dependencies for packages like `bcryptjs` and resolving modern ESM requirements:

```bash
npm install
```

### 2. Boot Development Server
Run the development environment. This boots Express via `tsx` (TypeScript Execute) on port `3000`. Express automatically mounts the Vite Dev Server as middleware in non-production, enabling lightning-fast client loading:

```bash
npm run dev
```
*Your application will be live at `http://localhost:3000`.*

### 3. Verification & Linter
To verify TypeScript compilation and search for type issues before committing:

```bash
npm run lint
```

---

## Production Compilation Pipeline

The production build pipeline compiles both the client-side SPA bundle and the backend server into optimized production-ready artifacts under the `dist/` folder.

```bash
npm run build
```

### What happens under the hood?
When `npm run build` is called:
1.  **Vite Client Build**: Compiles React components, applies PostCSS, splits code, and outputs static HTML, JS, and CSS files under `/dist`.
2.  **Server Compilation (esbuild)**: Compiles `server.ts` into a single, bundled, self-contained CommonJS file under `/dist/server.cjs`. 
    *   *Why esbuild?* The esbuild bundle resolves all internal relative typescript import paths at build-time. Outputting a `.cjs` (CommonJS) file completely bypasses Node’s strict runtime ES Module restrictions regarding relative imports in compiled environments, providing a fast cold start.
    *   *External Handling*: All core Node modules and standard external node packages (like `express`, `bcryptjs`, and `@google/genai`) are safely left external to the bundle via `--packages=external` to prevent bloating.

---

## Production Start

To boot the compiled full-stack server in production:

```bash
# Sets environment to production and launches compiled server
NODE_ENV=production npm start
```

When `NODE_ENV=production` is active:
1.  Express **bypasses** Vite Dev middleware initialization.
2.  Express **mounts static asset directories** pointing directly to `/dist`.
3.  All requests that do not hit `/api/*` or `/assistant/*` routes are automatically served the compiled `index.html` file, preserving SPA client-side routing.

---

## Containerization (Docker)

To deploy Community Hero as a containerized microservice on container runtimes (e.g., Google Cloud Run, AWS ECS, or Kubernetes), use the following multi-stage `Dockerfile`:

```dockerfile
# --- STAGE 1: Build static frontend and bundle server ---
FROM node:22-alpine AS builder
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy project files
COPY . .

# Run production build compilation
RUN npm run build

# --- STAGE 2: Lightweight runtime environment ---
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy package configurations and install production-only dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy compiled bundles from stage 1
COPY --from=builder /app/dist ./dist

# Expose the mandatory application port
EXPOSE 3000

# Start the compiled CommonJS server
CMD ["node", "dist/server.cjs"]
```

---

## Deployment to Google Cloud Run

Google Cloud Run is the recommended hosting platform for Community Hero because of its native support for containerized Web servers and serverless scaling.

### Step 1: Build and Push Container Image to Google Artifact Registry
```bash
# Configure Docker credential helper
gcloud auth configure-docker us-central1-docker.pkg.dev

# Build the container image locally (or via Cloud Build)
docker build -t us-central1-docker.pkg.dev/my-project-id/community-hero/app:v1 .

# Push image to registry
docker push us-central1-docker.pkg.dev/my-project-id/community-hero/app:v1
```

### Step 2: Deploy to Cloud Run
Run the deployment command. Be sure to inject the `GEMINI_API_KEY` securely from Google Secret Manager rather than exposing it as plain-text:

```bash
gcloud run deploy community-hero-app \
  --image us-central1-docker.pkg.dev/my-project-id/community-hero/app:v1 \
  --region us-central1 \
  --platform managed \
  --port 3000 \
  --allow-unauthenticated \
  --set-env-vars="JWT_SECRET=production_jwt_secret_xyz" \
  --set-secrets="GEMINI_API_KEY=GEMINI_API_KEY_SECRET:latest"
```

### Handling Storage Persistence on Cloud Run
Cloud Run containers are **stateless and ephemeral**. The `/db.json` file will reset every time a container scales down or restarts. 
To ensure durable data storage across sessions:
1.  **Google Cloud Storage (GCS) FUSE**: Mount a GCS Bucket directly to the `/app/data` directory of your Cloud Run container and point `DB_FILE` in `store.ts` to `/app/data/db.json`.
2.  **Upgrade to Firestore / Cloud SQL**: For high-concurrency or clustered instances, replace `/src/db/store.ts` with direct Firestore SDK CRUD commands or configure Cloud SQL setup using the database connector. Refer to the system schemas for relational conversion.
