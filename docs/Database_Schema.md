# Community Hero: Database Schema Specification

This document details the database schema, data models, and entity-relationships of the **Community Hero** platform. The application uses a robust, transactional file-backed database system stored locally in `db.json` and loaded into memory as a unified state tree via `/src/db/store.ts`.

---

## Storage Architecture Overview

```
                  ┌──────────────────────────────┐
                  │          server.ts           │
                  └──────────────┬───────────────┘
                                 │ imports / writes
                  ┌──────────────▼───────────────┐
                  │       src/db/store.ts        │
                  │   (Singleton State Engine)   │
                  └──────────────┬───────────────┘
                                 │ reads / writes
                  ┌──────────────▼───────────────┐
                  │  db.json (JSON State Store)  │
                  └──────────────────────────────┘
```

The data store is handled by a singleton `Store` class which:
1.  **Loads** the entire JSON object from `/db.json` synchronously at startup.
2.  **Applies structural integrity overrides** (e.g., seeding default administrative accounts, default open issues, and historical timeline logs if the file is missing or corrupted).
3.  **Persists state changes atomically** to `db.json` upon every write transaction (e.g., issue submission, upvote addition, comment creation, or notification dispatch).

---

## Entity-Relationship Diagram (Logical)

```
        ┌──────────────┐                 ┌─────────────────┐
        │     User     ├─ 1:N (reports) ─►      Issue      │
        └──────┬───────┘                 └────────┬────────┘
               │                                  │
          1:N  │                                  │ 1:N
     (receives)│                                  │ (triggers log)
               │                                  │
        ┌──────▼──────────┐              ┌────────▼────────┐
        │Notification     │              │  TimelineItem   │
        └─────────────────┘              └────────┬────────┘
                                                  │
        ┌──────────────┐                 ┌────────▼────────┐
        │ Comment      │◄─── 1:N (has) ──┤     Comment     │
        └──────▲───────┘                 └─────────────────┘
               │ 1:N (writes)
               │
        ┌──────┴───────┐                 ┌─────────────────┐
        │ ChatSession  ├─ 1:N (owns) ───►   ChatMessage   │
        └─────────────────┘              └─────────────────┘
```

---

## Detailed Entity Models (TypeScript Interfaces)

The following tables list the database fields, data types, and primary/foreign keys defined in `/src/types.ts`.

### 1. User
Represents platform members (citizens and administrators), tracking their credentials, reputation, streaks, and gamification state.

| Field Name | Type | Key Type | Description |
| :--- | :--- | :--- | :--- |
| `id` | `string` | **Primary Key** | Unique identifier (e.g., `u_jane_doe`). |
| `email` | `string` | Unique Index | User's login email address. |
| `fullName` | `string` | - | Display name on the feed and leaderboard. |
| `role` | `"citizen" \| "admin"` | - | Security clearance role. |
| `points` | `number` | - | Current redeemable civic currency (synonymous with XP). |
| `xp` | `number` | - | Lifetime Accumulated Experience Points. |
| `reputationScore` | `number` | - | Trust Rating (0-100) based on verified reports. |
| `reputationTier` | `string` | - | Human-readable rank title matching reputation score. |
| `streakCount` | `number` | - | Consecutive days of active community contributions. |
| `badges` | `string[]` | - | Collection of unlocked unique achievement badges. |
| `createdAt` | `string` (ISO-8601) | - | Account creation timestamp. |

### 2. Issue
Represents user-reported hyperlocal complaints, containing geographic coordinates, priority scoring, and AI-prediction parameters.

| Field Name | Type | Key Type | Description |
| :--- | :--- | :--- | :--- |
| `id` | `string` | **Primary Key** | Unique issue key (e.g., `issue_101`). |
| `title` | `string` | - | Brief title summarizing the complaint. |
| `description` | `string` | - | Long-form description written or spoken by user. |
| `category` | `IssueCategory` | - | Enum: `Pothole`, `Water Leakage`, `Garbage`, etc. |
| `severity` | `IssueSeverity` | - | Enum: `Low`, `Medium`, `High`, `Critical`. |
| `status` | `IssueStatus` | - | Enum: `Reported`, `Verified`, `Assigned`, etc. |
| `latitude` | `number` | - | Floating point latitude coordinate. |
| `longitude` | `number` | - | Floating point longitude coordinate. |
| `imageUrl` | `string` | - | Base64 string stream or Unsplash image URL. |
| `reporterId` | `string` | **Foreign Key** | Reference to `User.id` who reported it. |
| `reporterName` | `string` | - | Denormalized reporter name for high-speed feeds. |
| `assignedDepartment` | `string` | - | Municipal department tasked with remediation. |
| `upvotesCount` | `number` | - | Aggregate user upvotes. |
| `upvotedBy` | `string[]` | **Foreign Key** | Array of `User.id` strings representing upvoters. |
| `verifiedBy` | `string[]` | **Foreign Key** | Array of `User.id` strings representing verifiers. |
| `verificationsCount`| `number` | - | Aggregate verifications logged on-site. |
| `priorityIndex` | `number` | - | AI dynamic Priority Index (1-100). |
| `summary` | `string` | - | Short AI semantic summary for map pins. |
| `aiExplanation` | `string` | - | AI explanation of category routing logic. |
| `aiThreadSummary` | `string` | - | Thread summary synthesizing citizen dialogues. |
| `predictedResolutionDays` | `number` | - | AI forecast of remediation time in days. |
| `predictionConfidenceScore`| `number`| - | AI evaluation confidence rating (0-100). |
| `predictionReasoning`| `string` | - | Narrative behind resolution timeline estimation. |
| `isDuplicateOfId` | `string` | **Foreign Key** | Pointer to primary `Issue.id` if merged. |
| `duplicateCount` | `number` | - | Number of duplicate reports consolidated inside this. |
| `createdAt` | `string` (ISO-8601) | - | Submission timestamp. |
| `updatedAt` | `string` (ISO-8601) | - | Last modification timestamp. |

### 3. Comment
Represents feedback and discussion threads attached to a specific ticket.

| Field Name | Type | Key Type | Description |
| :--- | :--- | :--- | :--- |
| `id` | `string` | **Primary Key** | Unique comment identifier. |
| `issueId` | `string` | **Foreign Key** | Reference to parent `Issue.id`. |
| `userId` | `string` | **Foreign Key** | Reference to author `User.id` (or `"ai"` / `"system"`). |
| `userName` | `string` | - | Display name of the commenter. |
| `userRole` | `"citizen" \| "admin" \| "ai"` | - | Role context of the commenter. |
| `text` | `string` | - | Comment text body. |
| `createdAt` | `string` (ISO-8601) | - | Posting timestamp. |

### 4. TimelineItem
Logs formal audit transitions, administrative department assignments, or verifications of a ticket.

| Field Name | Type | Key Type | Description |
| :--- | :--- | :--- | :--- |
| `id` | `string` | **Primary Key** | Unique log identifier. |
| `issueId` | `string` | **Foreign Key** | Reference to target `Issue.id`. |
| `status` | `IssueStatus` | - | Target ticket state after transition. |
| `title` | `string` | - | Header of timeline milestone. |
| `description` | `string` | - | Detailed text describing what happened and who did it. |
| `updatedBy` | `"reporter" \| "admin" \| "ai"` | - | Entity triggering the timeline event. |
| `createdAt` | `string` (ISO-8601) | - | Timestamp when this milestone occurred. |

### 5. CivicNotification
Contains alert cards delivered to the user feed detailing rewards, badge triggers, or issue updates.

| Field Name | Type | Key Type | Description |
| :--- | :--- | :--- | :--- |
| `id` | `string` | **Primary Key** | Unique alert identifier. |
| `userId` | `string` | **Foreign Key** | Reference to target `User.id`. |
| `title` | `string` | - | Notification title. |
| `message` | `string` | - | Narrative notification details. |
| `type` | `"xp" \| "badge" \| "status" \| "duplicate" \| "system"` | - | Category classification for styling icons in frontend. |
| `read` | `boolean` | - | Read/unread status flag. |
| `createdAt` | `string` (ISO-8601) | - | Dispatch timestamp. |

### 6. ChatSession & ChatMessage
Maintains multi-turn conversation logs between citizens and the AI Civic Assistant.

#### ChatSession
| Field Name | Type | Key Type | Description |
| :--- | :--- | :--- | :--- |
| `id` | `string` | **Primary Key** | Unique chat thread session identifier. |
| `userId` | `string` | **Foreign Key** | Owner `User.id` who opened the thread. |
| `title` | `string` | - | Dynamic title generated by Gemini representing context. |
| `createdAt` | `string` (ISO-8601) | - | Thread creation time. |

#### ChatMessage
| Field Name | Type | Key Type | Description |
| :--- | :--- | :--- | :--- |
| `id` | `string` | **Primary Key** | Unique message key. |
| `sessionId` | `string` | **Foreign Key** | Parent `ChatSession.id`. |
| `role` | `"user" \| "model"` | - | Message author context. |
| `text` | `string` | - | Main conversation dialogue. |
| `createdAt` | `string` (ISO-8601) | - | Message creation timestamp. |

---

## Algorithms and Dynamic Calculations

### 1. Dynamic Priority Index Formula
A key feature of the community dispatch system is the AI Priority Index ($1$-$100$) recalculated automatically upon upvotes, verifications, and aging. It is computed as:

$$\text{Priority Index} = \text{Min}(\text{Severity Score} + \text{Engagement Score} + \text{Age Score}, 100)$$

*   **Severity Score**: Base priority points mapped to the issue's severity:
    *   `Critical` = $80$ points
    *   `High` = $60$ points
    *   `Medium` = $40$ points
    *   `Low` = $20$ points
*   **Engagement Score**: Gauges public urgency and peer-verification:
    *   $$\text{Engagement} = \text{Min}(\text{Upvotes} \times 1.5 + \text{Verifications} \times 4.0, 15)$$
    *   *(Note: Verifications are weighted heavily ($4.0$) because physical field validation signals extreme authenticity)*.
*   **Age Score**: Gradual priority boost over time to prevent older low-severity tickets from being starved of municipal attention:
    *   $$\text{Age Score} = \text{Min}(\text{Age in Days} \times 0.5, 5)$$

---

## Schema Seeding Logic (On First Load)

At initialization, if `db.json` is not present, `/src/db/store.ts` populates three default mock profiles with pre-hashed passwords:

1.  **Alex Admin** (`admin@community.org` / `admin123`): Cleared as `"admin"` role, seeded with 500 XP and the "City Administrator" badge.
2.  **Jane Doe** (`jane@community.org` / `jane123`): Cleared as `"citizen"` role, seeded with 240 XP and the "Community Sentinel" badge.
3.  **John Smith** (`john@community.org` / `john123`): Cleared as `"citizen"` role, seeded with 80 XP and the "Civic Helper" badge.
