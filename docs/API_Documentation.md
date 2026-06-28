# Community Hero: API Documentation

Welcome to the backend API documentation for **Community Hero** (the AI-Powered Hyperlocal Problem Solver). This application utilizes a full-stack Node.js (Express + Vite) architecture with standard JSON Web Token (JWT) authentication, local JSON-based transactional storage, and extensive Gemini LLM integration via the official `@google/genai` SDK.

---

## Table of Contents

- [Authentication Overview](#authentication-overview)
- [Auth Endpoints](#auth-endpoints)
- [Issue Management Endpoints](#issue-management-endpoints)
- [Notifications Endpoints](#notifications-endpoints)
- [Gamification & Leaderboard](#gamification--leaderboard)
- [AI Analytics & Predictive Insights](#ai-analytics--predictive-insights)
- [AI Civic Assistant Endpoints](#ai-civic-assistant-endpoints)
- [Executive Reports & Audits](#executive-reports--audits)

---

## Authentication Overview

All endpoints under `/api/*` and `/assistant/*` (except registration and login) require authentication via a standard bearer token. 

### Authorization Header
```http
Authorization: Bearer <your_jwt_token_here>
```

Upon successful login or registration, the server returns a JWT token containing the user’s core profile (`id`, `email`, `role`, `fullName`) which expires in **7 days**.

---

## Auth Endpoints

### 1. Register User
Creates a new citizen or administrator account.

*   **URL:** `/api/auth/register`
*   **Method:** `POST`
*   **Auth Required:** No
*   **Request Body:**
    ```json
    {
      "email": "jane@community.org",
      "password": "jane123password",
      "fullName": "Jane Doe",
      "role": "citizen" 
    }
    ```
    *(Note: `role` can be `"citizen"` or `"admin"`)*
*   **Response (201 Created):**
    ```json
    {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "user": {
        "id": "u_jane_doe_170123",
        "email": "jane@community.org",
        "fullName": "Jane Doe",
        "role": "citizen",
        "points": 0,
        "xp": 0,
        "reputationScore": 50,
        "reputationTier": "Civic Apprentice",
        "streakCount": 1,
        "badges": ["Civic Apprentice"],
        "createdAt": "2026-06-28T16:00:00.000Z"
      }
    }
    ```

### 2. Login User
Authenticates a user and issues a JWT token.

*   **URL:** `/api/auth/login`
*   **Method:** `POST`
*   **Auth Required:** No
*   **Request Body:**
    ```json
    {
      "email": "jane@community.org",
      "password": "jane123password"
    }
    ```
*   **Response (200 OK):**
    ```json
    {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "user": {
        "id": "u_jane_doe_170123",
        "email": "jane@community.org",
        "fullName": "Jane Doe",
        "role": "citizen",
        "points": 120,
        "xp": 120,
        "reputationScore": 85,
        "reputationTier": "Civic Helper",
        "streakCount": 3,
        "badges": ["Civic Apprentice", "Community Helper"],
        "createdAt": "2026-06-25T12:00:00.000Z"
      }
    }
    ```

### 3. Get Current User Session
Returns details of the currently logged-in user based on the provided JWT token.

*   **URL:** `/api/auth/me`
*   **Method:** `GET`
*   **Auth Required:** Yes
*   **Response (200 OK):**
    ```json
    {
      "user": {
        "id": "u_jane_doe_170123",
        "email": "jane@community.org",
        "fullName": "Jane Doe",
        "role": "citizen",
        "points": 120,
        "xp": 120,
        "reputationScore": 85,
        "reputationTier": "Civic Helper",
        "streakCount": 3,
        "badges": ["Civic Apprentice", "Community Helper"],
        "createdAt": "2026-06-25T12:00:00.000Z"
      }
    }
    ```

---

## Issue Management Endpoints

### 4. Fetch All Issues
Returns a list of all submitted community issues.

*   **URL:** `/api/issues`
*   **Method:** `GET`
*   **Auth Required:** No
*   **Response (200 OK):**
    ```json
    [
      {
        "id": "issue_1",
        "title": "Disruptive Pothole on Market Street",
        "description": "A huge pothole has formed in the middle of Market Street near 8th. It is damaging vehicle suspensions...",
        "category": "Pothole",
        "severity": "High",
        "status": "In Progress",
        "latitude": 37.7785,
        "longitude": -122.4148,
        "imageUrl": "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?q=80&w=800",
        "reporterId": "u_jane_doe",
        "reporterName": "Jane Doe",
        "assignedDepartment": "Department of Public Works (SFPW)",
        "upvotesCount": 22,
        "upvotedBy": ["u_john_smith", "u_default_admin"],
        "verifiedBy": ["u_john_smith"],
        "verificationsCount": 1,
        "priorityIndex": 73,
        "summary": "High-severity pothole causing vehicle hazard on Market Street.",
        "aiExplanation": "Identified as pothole based on road swerving and vehicular damage descriptions. Department of Public Works is appropriate for road reparations.",
        "createdAt": "2026-06-20T10:00:00.000Z",
        "updatedAt": "2026-06-21T15:30:00.000Z"
      }
    ]
    ```

### 5. Check Duplicate Report (AI-Powered)
Compares a potential issue description and category against existing active issues using Gemini similarity analysis.

*   **URL:** `/api/issues/check-duplicate`
*   **Method:** `POST`
*   **Auth Required:** Yes
*   **Request Body:**
    ```json
    {
      "title": "Broken pavement on Market",
      "description": "Deep hole on the road near 8th Market St that can break car wheels.",
      "category": "Pothole",
      "latitude": 37.7786,
      "longitude": -122.4149
    }
    ```
*   **Response (200 OK):**
    ```json
    {
      "isDuplicate": true,
      "duplicateIssueId": "issue_1",
      "similarityScore": 92,
      "explanation": "The submitted complaint describes a deep hole on the road at Market St near 8th, which matches the existing reported Pothole at 37.7785, -122.4148 (issue_1) with 92% similarity."
    }
    ```

### 6. Create New Issue
Submits a new community issue. This triggers background Gemini operations to parse descriptions, auto-categorize (if left blank), calculate dynamic AI severity, generate a concise semantic summary, set a priority index, and predict resolution timelines.

*   **URL:** `/api/issues`
*   **Method:** `POST`
*   **Auth Required:** Yes
*   **Request Body:**
    ```json
    {
      "title": "Flooded street corner",
      "description": "Water is actively gushing out of a broken utility valve on the corner of 5th and Mission. It is flooding the sidewalk and crosswalk.",
      "category": "Water Leakage", 
      "severity": "Medium", 
      "latitude": 37.7812,
      "longitude": -122.4056,
      "imageUrl": "data:image/jpeg;base64,..."
    }
    ```
    *(Note: `category` and `severity` are optional. If omitted, the AI engine auto-populates them based on description content analysis.)*
*   **Response (201 Created):**
    ```json
    {
      "success": true,
      "issue": {
        "id": "issue_102",
        "title": "Flooded street corner",
        "description": "Water is actively gushing out of a broken utility valve...",
        "category": "Water Leakage",
        "severity": "High",
        "status": "Reported",
        "latitude": 37.7812,
        "longitude": -122.4056,
        "imageUrl": "https://images.unsplash.com/...",
        "reporterId": "u_jane_doe_170123",
        "reporterName": "Jane Doe",
        "assignedDepartment": "Water Enterprise Division (SFPUC)",
        "upvotesCount": 0,
        "upvotedBy": [],
        "verifiedBy": [],
        "verificationsCount": 0,
        "priorityIndex": 65,
        "summary": "Active water main break flooding pedestrian areas on 5th and Mission.",
        "aiExplanation": "Assigned to SFPUC based on active gushing utility water and street flooding.",
        "predictedResolutionDays": 2,
        "predictionConfidenceScore": 88,
        "predictionReasoning": "Minor utility line floods typically take 48 hours for dispatch, barring scheduling bottlenecks.",
        "createdAt": "2026-06-28T16:10:00.000Z",
        "updatedAt": "2026-06-28T16:10:00.000Z"
      }
    }
    ```

### 7. Fetch Issue Details
Returns a single issue along with its comments and history timeline.

*   **URL:** `/api/issues/:id`
*   **Method:** `GET`
*   **Auth Required:** No
*   **Response (200 OK):**
    ```json
    {
      "id": "issue_1",
      "title": "Disruptive Pothole on Market Street",
      "description": "A huge pothole...",
      "category": "Pothole",
      "severity": "High",
      "status": "In Progress"
      // ...all fields
    }
    ```

### 8. Patch Issue (Admin Actions)
Updates issue state, such as changing status, modifying severity, or re-routing the assigned department.

*   **URL:** `/api/issues/:id`
*   **Method:** `PATCH`
*   **Auth Required:** Yes (Must have `"role": "admin"`)
*   **Request Body:**
    ```json
    {
      "status": "In Progress",
      "assignedDepartment": "Department of Public Works (SFPW)"
    }
    ```
*   **Response (200 OK):**
    ```json
    {
      "success": true,
      "issue": {
        "id": "issue_1",
        "status": "In Progress",
        "assignedDepartment": "Department of Public Works (SFPW)",
        "updatedAt": "2026-06-28T16:15:00.000Z"
        // ...remaining fields
      }
    }
    ```

### 8b. Replace or Complete Update of an Issue (Admin Only)
Performs a complete update or replacement of specified core properties on an existing community issue.

*   **URL:** `/api/issues/:id`
*   **Method:** `PUT`
*   **Auth Required:** Yes (Must have `"role": "admin"`)
*   **Request Body:**
    ```json
    {
      "title": "Disruptive Pothole on Market Street - Repaired Gutter Zone",
      "description": "Deep asphalt failure causing swerving near the 8th street crosswalk.",
      "category": "Pothole",
      "severity": "Medium",
      "status": "In Progress",
      "assignedDepartment": "Department of Public Works (SFPW)",
      "latitude": 37.7785,
      "longitude": -122.4148
    }
    ```
*   **Response (200 OK):**
    ```json
    {
      "success": true,
      "issue": {
        "id": "issue_1",
        "title": "Disruptive Pothole on Market Street - Repaired Gutter Zone",
        "description": "Deep asphalt failure causing swerving near the 8th street crosswalk.",
        "category": "Pothole",
        "severity": "Medium",
        "status": "In Progress",
        "assignedDepartment": "Department of Public Works (SFPW)",
        "latitude": 37.7785,
        "longitude": -122.4148,
        "updatedAt": "2026-06-28T16:20:00.000Z"
        // ...other fields
      }
    }
    ```

### 8c. Delete an Issue Report (Admin Only)
Irreversibly deletes an issue report from the storage system, cleaning up all associated comment lists and timeline events.

*   **URL:** `/api/issues/:id`
*   **Method:** `DELETE`
*   **Auth Required:** Yes (Must have `"role": "admin"`)
*   **Response (200 OK):**
    ```json
    {
      "success": true,
      "message": "Issue deleted successfully"
    }
    ```

### 9. Upvote Issue
Registers an upvote from an authenticated user. Adds +5 XP/points to the reporter, updates the issue upvotedBy array, and recalculates Priority Index.

*   **URL:** `/api/issues/:id/upvote`
*   **Method:** `POST`
*   **Auth Required:** Yes
*   **Response (200 OK):**
    ```json
    {
      "success": true,
      "upvotesCount": 23,
      "priorityIndex": 75,
      "xpAwarded": 2, 
      "message": "Upvote successfully registered. You earned 2 XP, and the reporter earned 5 XP!"
    }
    ```

### 10. Verify Issue
Allows community members to verify the existence of an reported issue on-site. Verifications boost report credibility significantly, award +15 XP to the verifier, +10 XP to the reporter, and trigger timeline updates.

*   **URL:** `/api/issues/:id/verify`
*   **Method:** `POST`
*   **Auth Required:** Yes
*   **Response (200 OK):**
    ```json
    {
      "success": true,
      "verificationsCount": 3,
      "priorityIndex": 81,
      "xpAwarded": 15,
      "message": "Verification successfully registered. You gained 15 XP!"
    }
    ```

---

## Notifications Endpoints

### 11. Fetch User Notifications
Gets a list of unread/read system and gamification alerts for the authenticated user.

*   **URL:** `/api/notifications`
*   **Method:** `GET`
*   **Auth Required:** Yes
*   **Response (200 OK):**
    ```json
    [
      {
        "id": "notif_293",
        "userId": "u_jane_doe_170123",
        "title": "Badge Unlocked!",
        "message": "Congratulations! You unlocked the 'Community Sentinel' badge for completing 5 verifications.",
        "type": "badge",
        "createdAt": "2026-06-28T12:00:00.000Z",
        "read": false
      }
    ]
    ```

### 12. Mark Single Notification as Read
*   **URL:** `/api/notifications/:id/read`
*   **Method:** `POST`
*   **Auth Required:** Yes
*   **Response (200 OK):**
    ```json
    { "success": true }
    ```

### 13. Mark All Notifications as Read
*   **URL:** `/api/notifications/read-all`
*   **Method:** `POST`
*   **Auth Required:** Yes
*   **Response (200 OK):**
    ```json
    { "success": true }
    ```

---

## Gamification & Leaderboard

### 14. Get Leaderboard Standings
Retrieves top performing community members ranked by aggregate civic XP, featuring streak counts and unlocked badges.

*   **URL:** `/api/users/leaderboard`
*   **Method:** `GET`
*   **Auth Required:** No
*   **Response (200 OK):**
    ```json
    [
      {
        "id": "u_default_admin",
        "fullName": "Alex Admin",
        "points": 500,
        "xp": 500,
        "reputationScore": 100,
        "reputationTier": "City Guardian",
        "streakCount": 15,
        "badges": ["Civic Champion", "City Administrator"],
        "createdAt": "2026-05-28T12:00:00.000Z"
      },
      {
        "id": "u_jane_doe_170123",
        "fullName": "Jane Doe",
        "points": 240,
        "xp": 240,
        "reputationScore": 95,
        "reputationTier": "Community Sentinel",
        "streakCount": 6,
        "badges": ["Community Helper", "Civic Champion"],
        "createdAt": "2026-06-25T12:00:00.000Z"
      }
    ]
    ```

---

## AI Analytics & Predictive Insights

### 15. Fetch Civic Analytics (AI Enhanced)
Retrieves category distributions, resolution metrics, localized trends, and dynamic LLM narrative summaries regarding community pain points.

*   **URL:** `/api/analytics`
*   **Method:** `GET`
*   **Auth Required:** No
*   **Response (200 OK):**
    ```json
    {
      "mostCommonCategory": "Pothole",
      "mostAffectedArea": "SOMA, San Francisco",
      "averageResolutionTimeHours": 38.5,
      "monthlyTrends": [
        { "month": "May", "reports": 12, "resolved": 10 },
        { "month": "June", "reports": 24, "resolved": 18 }
      ],
      "categoryDistribution": [
        { "category": "Pothole", "count": 14 },
        { "category": "Garbage", "count": 8 }
      ],
      "severityDistribution": [
        { "severity": "Critical", "count": 2 },
        { "severity": "High", "count": 9 },
        { "severity": "Medium", "count": 10 },
        { "severity": "Low", "count": 3 }
      ],
      "summaryMessage": "SOMA is experiencing a significant surge in Pothole and Garbage complaints this month, primarily high-severity pothole clusters on key commuter lines. Average resolution is stable at 38 hours, but critical issues are delaying routine repairs."
    }
    ```

### 16. Fetch Predictive Infrastructural Hotspots
Leverages Gemini to examine historical reports and spatial clusters to output risk hotspots, recurring failures, and preemptive actions.

*   **URL:** `/api/predictive`
*   **Method:** `GET`
*   **Auth Required:** No
*   **Response (200 OK):**
    ```json
    {
      "hotspots": [
        {
          "lat": 37.7785,
          "lng": -122.4148,
          "areaName": "8th and Market Street Intersection",
          "riskScore": 89,
          "riskLevel": "High",
          "predictedCategory": "Road Damage",
          "reasoning": "High-density heavy transit lines intersecting with active utility leaks has historically accelerated sub-surface pavement degradation within 14 days."
        }
      ],
      "recurringFailures": [
        {
          "infrastructureType": "Storm Drainage Valves",
          "locationPattern": "Howard and 6th Corridor",
          "suggestedPreemptiveAction": "Execute gutter silt clearing before the forecasted autumn rains to prevent recurring localized back-flow."
        }
      ],
      "summaryMarkdown": "### Preemptive Civic Intelligence Report\nAnalysis reveals elevated pavement structural risks around heavy transit nodes..."
    }
    ```

---

## AI Civic Assistant Endpoints

### 17. Assistant Suggestions
Gets introductory prompts for citizens chatting with the civic assistant.

*   **URL:** `/assistant/suggestions`
*   **Method:** `GET`
*   **Auth Required:** Yes
*   **Response (200 OK):**
    ```json
    [
      "How is my neighborhood doing this week?",
      "Summarize the active water leakage tickets.",
      "How can I earn the 'Clean Streets' badge?",
      "Write a short formal letter to public works about the potholes."
    ]
    ```

### 18. Session History
Lists previous interactive chat sessions of the user.

*   **URL:** `/assistant/history`
*   **Method:** `GET`
*   **Auth Required:** Yes
*   **Response (200 OK):**
    ```json
    [
      {
        "id": "sess_88301",
        "userId": "u_jane_doe_170123",
        "title": "Discussion on local SOMA infrastructure",
        "createdAt": "2026-06-27T18:22:00.000Z",
        "updatedAt": "2026-06-27T18:30:00.000Z"
      }
    ]
    ```

### 19. Send Message / Multi-Turn Interactive Chat
Submits a user chat query to the multi-turn conversational Gemini engine. This evaluates municipal rules, coordinates with the local ticket databases (using structured system context), and answers citizen inquiries in a highly helpful, non-jargony, community-oriented tone.

*   **URL:** `/assistant/chat`
*   **Method:** `POST`
*   **Auth Required:** Yes
*   **Request Body:**
    ```json
    {
      "message": "Which pothole reports are currently labeled critical near me?",
      "sessionId": "sess_88301" 
    }
    ```
    *(Note: If `sessionId` is omitted, the engine automatically instantiates and returns a new session.)*
*   **Response (200 OK):**
    ```json
    {
      "session": {
        "id": "sess_88301",
        "title": "Potholes inquiries"
      },
      "message": {
        "id": "msg_99401",
        "role": "model",
        "text": "Based on current local records, there are two high-importance potholes near you on Market Street. One of them (ID: issue_1) near 8th Street is actively swerving buses and has an AI Priority Index of 75. A utility team from SFPW has been dispatched.",
        "createdAt": "2026-06-28T16:25:00.000Z"
      }
    }
    ```

### 19b. Send Message (Compatibility Alias)
A compatibility endpoint that forwards requests directly to the main interactive Civic Assistant chat engine.

*   **URL:** `/api/chat`
*   **Method:** `POST`
*   **Auth Required:** Yes
*   **Request Body:**
    ```json
    {
      "message": "Which pothole reports are currently labeled critical near me?",
      "sessionId": "sess_88301"
    }
    ```
*   **Response (200 OK):** Identical to `/assistant/chat` response structure.

---

## Executive Reports & Audits

These routes retrieve AI-synthesized audit dossiers based on selected report intervals or custom prompts. Perfect for city supervisors, municipal directors, or neighborhood associations.

### 20. Fetch Weekly Audit Report
*   **URL:** `/api/reports/weekly`
*   **Method:** `GET`
*   **Auth Required:** Yes
*   **Response (200 OK):**
    ```json
    {
      "markdown": "# Weekly Civic Audit Report\n\n**Period:** June 21 - June 28, 2026...\n"
    }
    ```

### 21. Fetch Monthly Audit Report
*   **URL:** `/api/reports/monthly`
*   **Method:** `GET`
*   **Auth Required:** Yes
*   **Response (200 OK):**
    ```json
    {
      "markdown": "# Monthly Civic Audit Report\n\n**Period:** June 2026...\n"
    }
    ```

### 22. Generate Custom Scope Report (AI Guided)
Provides an dynamic interface where administrators can prompt Gemini to run detailed query analysis across all issues, user statistics, and comments to compile bespoke audits.

*   **URL:** `/api/reports/custom?prompt=List%20all%20SFPW%20delays`
*   **Method:** `GET`
*   **Auth Required:** Yes
*   **Response (200 OK):**
    ```json
    {
      "markdown": "# Custom Administrative Audit\n\n**Scope Prompt:** 'List all SFPW delays'\n\n### Findings:\n1. **Market St Pothole (issue_1)**: In Progress since June 20th. Scheduled resolution was predicted at 3 days but delayed due to emergency crew rerouting."
    }
    ```

### 23. Voice-to-Complaint Transcribe & Parse
Accepts user audio blobs or raw spoke transcripts, leverages Gemini’s multimodal understanding to extract structural fields (title, category, severity, description), and maps them into an easily editable ticket format on the front-end reporting wizard.

*   **URL:** `/api/voice-to-complaint`
*   **Method:** `POST`
*   **Auth Required:** Yes
*   **Request Body:**
    ```json
    {
      "transcript": "Yeah, hey, there is a giant leak on Howard and 4th, clean water is flowing everywhere from a fire hydrant, it's pretty bad, can cause crashes."
    }
    ```
*   **Response (200 OK):**
    ```json
    {
      "success": true,
      "title": "Active Hydrant Leak on Howard & 4th",
      "category": "Water Leakage",
      "severity": "High",
      "description": "Clean water is flowing heavily from a broken fire hydrant at the intersection of Howard St and 4th St, causing road hazards and potential vehicle collisions."
    }
    ```

### 23b. Voice-to-Complaint Compatibility Endpoint
A compatibility endpoint that accepts either a transcript, a general message, or speech text to parse into structured complaints.

*   **URL:** `/api/report/voice`
*   **Method:** `POST`
*   **Auth Required:** Yes
*   **Request Body:** Supports `transcript`, `speechText`, or `message`.
    ```json
    {
      "transcript": "Yeah, hey, there is a giant leak on Howard and 4th, clean water is flowing everywhere from a fire hydrant."
    }
    ```
*   **Response (200 OK):** Identical to `/api/voice-to-complaint` response structure.
