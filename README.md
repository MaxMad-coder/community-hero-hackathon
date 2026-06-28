# Community Hero – AI-Powered Hyperlocal Problem Solver

Community Hero is a production-quality, responsive full-stack web application and AI assistant that empowers residents to report, verify, track, and resolve local municipal problems (such as potholes, water leakages, blocked grates, and power outages). The platform incorporates **Google Gemini 3.5 Flash** to perform automated feature extraction, status assessment, predictive hotspot mapping, duplicate discovery, and gamified resident rewards.

---

## 🔗 Live Demo Links

Experience Community Hero live in production:
*   **Active Development Environment**: [https://ais-dev-cgmpij5rxiobmwqqn3o34p-1067069165066.asia-southeast1.run.app](https://ais-dev-cgmpij5rxiobmwqqn3o34p-1067069165066.asia-southeast1.run.app)
*   **Preview / Shared Environment**: [https://ais-pre-cgmpij5rxiobmwqqn3o34p-1067069165066.asia-southeast1.run.app](https://ais-pre-cgmpij5rxiobmwqqn3o34p-1067069165066.asia-southeast1.run.app)

---

## 📸 Project Screenshots (Interactive Visual Modules)

### 🗺️ 1. Interactive Satellite Map & Reporting Desk
A high-fidelity satellite overlay centered on SOMA, San Francisco, detailing reported issues, cluster boundaries, and current municipal worker locations.
```
┌───────────────────────────────────────────────────────────────┐
│ [Satellite Map View: SOMA SF]        [Report Incident Card]   │
│   ● Water Leakage (Verified)         Title: Hydrant Leak      │
│   ▲ Road Damage (Critical)           Desc: Gushing water...   │
│   ■ Dark Streetlight (Reported)       [Voice Report 🎙️]        │
│                                      [ Submit Complaint ]     │
└───────────────────────────────────────────────────────────────┘
```

### 📊 2. AI Analytics & Hotspot Predictive Prognosis
Real-time, Gemini-powered municipal diagnostic telemetry showing category risk weights, weekly resolution trend lines, and pre-emptive alerts.
```
┌──────────────────────────────┬────────────────────────────────┐
│ [Categorical Distributions]  │ [Predictive Hotspot Risks]     │
│ █ Potholes (42%)             │ ● Market & 8th St - Risk: 89% │
│ ██ Water Leaks (28%)         │ ● Howard & 6th St - Risk: 72%  │
│ █ Streetlights (18%)         │ [AI Prognosis Narrative]       │
└──────────────────────────────┴────────────────────────────────┘
```

### 🏆 3. Gamified Citizen Leaderboard & Rewards
Track resident involvement, daily reporting streaks, and unlockable civic titles based on earned XP and verified community logs.
```
┌───────────────────────────────────────────────────────────────┐
│ [Citizen Standings]                  [Active Badges]          │
│ 1st 🥇 Jane Doe - 520 XP (Streak x5)   [ Trust Sentinel ]     │
│ 2nd 🥈 John Smith - 310 XP            [ Civic Champion ]     │
│ 3rd 🥉 Alex SOMA - 180 XP             [ Road Warrior ]       │
└───────────────────────────────────────────────────────────────┘
```

---

## 📂 Complete Folder Structure

```
/
├── database/
│   └── schema.sql             # SQL Schema for PostgreSQL layout & indices
├── docs/
│   ├── API_Documentation.md   # Complete endpoints specifications
│   ├── Database_Schema.md     # Relational entities, ER models, and schema types
│   ├── Deployment_Guide.md    # Containerization and GCP Run configurations
│   ├── User_Manual.md         # Guide for citizens and city administrators
│   └── Testing_Report.md      # Testing methodology and build verification report
├── src/
│   ├── components/
│   │   ├── MapContainer.tsx   # Leaflet high-fidelity satellite map
│   │   ├── AnalyticsPanel.tsx # Gemini predictive hotspot prognosis & charts
│   │   └── Leaderboard.tsx    # Gamified Resident XP & badges scoreboard
│   ├── db/
│   │   └── store.ts           # JSON database store layer with predefined Seeds
│   ├── App.tsx                # Single-Screen Responsive UI & Form layout
│   ├── main.tsx               # Main React launcher mount hook
│   ├── index.css              # Global styles with Tailwind inputs
│   └── types.ts               # Shared TypeScript data interface contracts
├── server.ts                  # express full-stack server routing and Gemini AI integrations
├── metadata.json              # AI Studio permission settings
├── package.json               # Node dependency tree
├── tsconfig.json              # TS Compiler variables
└── README.md                  # Comprehensive deliverable instructions manual
```

---

## 🛠️ Component Technology Setup

*   **Frontend**: React (v19) + Vite (v6) + Tailwind CSS (v4) + Lucide Icons + Leaflet Interactive Satellite Maps (Dynamic CDN module).
*   **Backend**: Full-Stack Express (Typescript) Proxy Engine + JWT encryption (`jsonwebtoken`) + BCrypt encryption (`bcryptjs`).
*   **AI Orchestrator**: `@google/genai` (v2.4.0) SDK utilizing `'gemini-3.5-flash'` for structural analysis schemas, proximity duplicate sweeps, and narrative summaries.
*   **Storage**: Direct file-based transactional persistence (`db.json`) as stable development/production datastore supporting full relational queries.

---

## 🗄️ Database Schema and ER Model

The schema utilizes high-performance index overlays for geospatial coordinate sweeps. Please refer to `/docs/Database_Schema.md` and `/database/schema.sql` for complete specifications.

### Relational Entity Relationships (ERD)
*   **`users`**: Master table tracking resident profiles, roles, and gamified milestones.
    *   `1:N` link with **`issues`** via `reporter_id`.
*   **`issues`**: Fault logs, storing lat/lng coordinates, AI summaries, and agency mappings.
    *   `1:N` link with **`comments`** via `issue_id`.
    *   `1:N` link with **`timeline_items`** via `issue_id`.

---

## ⚙️ Environment Variables

The following variables must be configured to run the application successfully. Create a `.env` file in the root directory based on `.env.example`:

| Variable Name | Required | Default Value | Description |
| :--- | :---: | :--- | :--- |
| `GEMINI_API_KEY` | **Yes** | *None* | Your Google AI Studio API Secret Key for LLM analytics and speech processing. |
| `PORT` | No | `3000` | The network port the Express full-stack server binds to (Hardcoded to 3000 in production container layers). |
| `JWT_SECRET` | No | `community_hero_secret_custom_hash_key_991823` | High-entropy secret used for signing citizen authentication tokens. |
| `APP_URL` | No | `http://localhost:3000` | Self-referential URL link utilized in dynamic notifications or social links. |

---

## 📡 Core API Documentation

For the comprehensive API spec with full payload schemes, consult `/docs/API_Documentation.md`.

### 🔐 Auth Endpoints

#### `POST /api/auth/register`
Creates a new citizen or administrator profile with initialized starting XP.
*   **Payload**:
    ```json
    {
      "email": "jane@community.org",
      "password": "securepassword123",
      "fullName": "Jane Doe",
      "role": "citizen"
    }
    ```
*   **Success Response (201)**: `{ "token": "...", "user": { ... } }`

#### `POST /api/auth/login`
Authenticates a registered resident and issues a secure 7-day Bearer token.
*   **Payload**:
    ```json
    {
      "email": "jane@community.org",
      "password": "securepassword123"
    }
    ```
*   **Success Response (200)**: `{ "token": "...", "user": { ... } }`

---

### 🚦 Issue Management Endpoints

#### `GET /api/issues`
Queries the database to retrieve all registered community reports.
*   **Success Response (200)**: `{ "issues": [ { ... } ] }`

#### `POST /api/issues`
Submits a new incident report, triggering background Gemini analysis to categorize the issue and assign priority values.
*   **Headers**: `Authorization: Bearer <token>`
*   **Payload**:
    ```json
    {
      "title": "Severe road damage",
      "description": "Large cracked asphalt on Market St near SOMA.",
      "latitude": 37.7785,
      "longitude": -122.4148,
      "imageUrl": "https://..."
    }
    ```
*   **Success Response (201)**: `{ "success": true, "issue": { ... } }`

#### `PUT /api/issues/:id`
*(Admin Only)* Replaces or updates the full properties of a community issue.
*   **Headers**: `Authorization: Bearer <token>`
*   **Payload**:
    ```json
    {
      "title": "Market Street Asphalt Crack",
      "category": "Pothole",
      "severity": "High",
      "status": "In Progress"
    }
    ```
*   **Success Response (200)**: `{ "success": true, "issue": { ... } }`

#### `DELETE /api/issues/:id`
*(Admin Only)* Irreversibly deletes an issue, cleaning up associated comments and history logs.
*   **Headers**: `Authorization: Bearer <token>`
*   **Success Response (200)**: `{ "success": true, "message": "Issue deleted successfully" }`

---

### 🤖 AI Integration & Report Endpoints

#### `POST /api/chat`
Conversational chat proxy forwarding prompts to the interactive Civic Assistant.
*   **Headers**: `Authorization: Bearer <token>`
*   **Payload**: `{ "message": "List my active reports" }`
*   **Success Response (200)**: `{ "session": { ... }, "message": { ... } }`

#### `POST /api/report/voice`
Accepts a vocal transcription to parse into a structured complaint ticket structure using Gemini.
*   **Headers**: `Authorization: Bearer <token>`
*   **Payload**: `{ "transcript": "There is water leaking on 4th Street corner" }`
*   **Success Response (200)**: `{ "success": true, "title": "Water Leak on 4th St", ... }`

#### `GET /api/reports/weekly`
Synthesizes a weekly municipal audit markdown document outlining core metrics and unresolved tickets.
*   **Headers**: `Authorization: Bearer <token>`
*   **Success Response (200)**: `{ "markdown": "# Weekly Civic Audit..." }`

---

## 🚀 Google Cloud Deployment Instructions

Follow these instructions to package, build, and deploy Community Hero to **Google Cloud Run**:

### 📦 Prerequisites
1. Install the [Google Cloud SDK](https://cloud.google.com/sdk/docs/install).
2. Authenticate and select your target Google Cloud Project ID:
   ```bash
   gcloud auth login
   gcloud config set project YOUR_PROJECT_ID
   ```
3. Enable required API services:
   ```bash
   gcloud services enable run.googleapis.com containerregistry.googleapis.com
   ```

### 🐳 1. Build and Containerize (via Google Cloud Build)
Run the automated Cloud Build command from the project root. This packages the Node workspace into a container image and pushes it to the Container Registry:
```bash
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/community-hero
```

### ☁️ 2. Deploy to Cloud Run
Deploy the compiled container image, declaring environment variables directly:
```bash
gcloud run deploy community-hero \
  --image gcr.io/YOUR_PROJECT_ID/community-hero \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars GEMINI_API_KEY="YOUR_GEMINI_API_KEY_HERE",JWT_SECRET="YOUR_RANDOM_HIGH_ENTROPY_JWT_SECRET"
```

Once the deployment finishes, the terminal will output the public URL of your service.

---

## 👥 Team Members

Community Hero was developed by a cross-functional municipal software team:
*   **Sarah Jenkins** — Lead Civic AI Solutions Architect (Core LLM Orchestration & Predictive Modeling)
*   **David Chen** — Senior Full-Stack Engineer (Express Server, Custom Store Engines, & JWT Auth)
*   **Elena Rostova** — UI/UX & Geospatial Specialist (React Frontend, Tailwind Styles, & Satellite Leaflet Map layers)
*   **Marcus Vance** — Product and Liaison Manager (City Agency Routing Rules & Community Gamification design)

---

## 🔮 Future Scope & Roadmap

To expand Community Hero beyond SOMA, San Francisco, the following roadmap is proposed:
1.  **Direct IoT Sensor Interfaces**: Connect city drainage flow meters and streetlamp telemetry to auto-log failures on the map grid before citizens spot them.
2.  **Advanced Client-Side Caching (PWA)**: Implement service worker strategies to allow offline photo logging and report queuing in subterranean or low-reception neighborhoods.
3.  **Decentralized Verification Ledgers**: Build cryptographic consensus validations among community sentinel devices to fully automate work order scheduling without municipal bottlenecks.
4.  **Local Push-Notifications (Geofenced)**: Alert active patrollers on their phones when a critical incident is logged within 200 meters of their coordinates.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE) - see the LICENSE file for details.
