# Community Hero: User Manual

Welcome to the **Community Hero** platform user guide. This guide explains how to use the web application, with detailed instructions for both **Citizens** and **Administrators**.

---

## 1. Introduction to Community Hero

**Community Hero** is an AI-powered hyperlocal problem solver designed to empower residents to report, verify, and track community issues (like potholes, water leaks, or garbage accumulation) while earning points, streaks, and reputation tiers. It also provides administrative tools, predictive hotspot modeling, and a friendly AI Civic Assistant.

---

## 2. Guide for Citizens

As a citizen, your role is to act as the eyes and ears of your neighborhood.

### Account Registration and Login
1.  Click **Login** or **Register** in the top navigation bar.
2.  Input your email, password, and full name.
3.  Once authenticated, your dashboard will display your active **XP**, **Streak Count**, **Reputation Tier** (e.g., "Civic Apprentice" or "Local Sentinel"), and **Achievement Badges**.

### Interactive Map
*   **Locating Issues**: The interactive map displays color-coded pins indicating local complaints. Hovering over or clicking a pin displays a quick-read card with the title, status, and AI-generated summary of the problem.
*   **Filter Pins**: Use the category controls to filter the map by Potholes, Streetlights, Water Leaks, or Public Safety.

### Reporting an Issue
Click **Report Issue** in the navigation bar to access the reporting form.

```
       ┌────────────────────────────────────────────────────────┐
       │                  REPORT A NEW COMPLAINT                │
       └───────────────────────────┬────────────────────────────┘
                                   │ Choose Input Mode
         ┌─────────────────────────┴────────────────────────┐
         ▼                                                  ▼
   Manual Typing                                    Voice-to-Complaint
   * Write title                                    * Click "Record Spoken Message"
   * Describe in text                               * Speak naturally into mic
                                                    * AI transcribes & auto-populates
         │                                                  │
         └─────────────────────────┬────────────────────────┘
                                   │ AI Similarity Engine Checks
                                   ▼
                       ┌───────────────────────┐
                       │ Duplicate Detected?   │
                       └───────────┬───────────┘
                    YES            │           NO
         ┌─────────────────────────┴────────────────────────┐
         ▼                                                  ▼
   Upvote/Verify existing                              File New Report
   ticket with 1-click                                 (AI routing, severity,
   (Avoids inbox clutter)                              and resolution timelines)
```

1.  **Voice-to-Complaint (Optional)**: Click **Record Spoken Message** and speak naturally (e.g., *"There is clean water spilling from a fire hydrant on Howard and 4th"*). The Gemini engine will transcribe, draft a professional title, select the correct category/severity, and write out a clean description for you.
2.  **Duplicate Check**: Before saving, our AI system checks for duplicate tickets within a 150-meter radius. If a matching ticket is found, the system displays the existing report and lets you **upvote or verify** it with one click, keeping the public dashboard organized.
3.  **Media Upload**: Drag-and-drop or select an image file to upload a photo of the issue.
4.  **Submit**: Upon submission, the AI engine auto-routes the ticket to the correct city department (e.g., SFPW, SFPUC) and estimates a resolution timeline.

### Earning XP and Gamification
*   **Reporting (New)**: +10 XP upon submitting a validated new ticket.
*   **Upvoting**: Click the upvote button on any issue to increase its priority. Upvoting earns you **+2 XP** and grants **+5 XP** to the original reporter.
*   **Verification**: If you are physically on-site near an active issue, click **Verify Issue**. This acts as a reliable witness statement, boosting priority index, earning you **+15 XP**, and granting **+10 XP** to the reporter.
*   **Streaks**: Log in and make a civic contribution (upvote, comment, report, or verify) to maintain your daily streak count.
*   **Reputation Tiers**: Accumulate XP to advance your rank:
    *   *Civic Apprentice* (0-99 XP)
    *   *Civic Helper* (100-199 XP)
    *   *Community Sentinel* (200-349 XP)
    *   *City Guardian* (350+ XP)

### AI Civic Assistant
Click **AI Assistant** in the navigation bar to chat with your interactive neighborhood companion.
*   Ask conversational questions like: *"How is SOMA doing this week?"*, *"Are there any critical water leaks near Market Street?"*, or *"How close am I to unlocking my next badge?"*
*   **Administrative Aids**: You can ask the assistant to generate letters for you, such as: *"Write a formal letter to the Public Works department about the pothole outside my apartment."*

---

## 3. Guide for Administrators

Administrators oversee ticket routing, dispatch, and reporting workflows.

### Accessing the Dashboard
Log in using an account with administrative permissions (Default: `admin@community.org` / `admin123`). The **Admin Portal** link will appear in the navigation bar.

### Ticket Triage and Dispatch
The main Admin Dashboard lists all unresolved community issues sorted by their dynamic **AI Priority Index**. High-severity, verified, and long-standing tickets rise to the top automatically.

1.  **Assign Department**: Route tickets to specific crews (e.g., *"SF Public Works"*, *"SF Water Enterprise"*, or *"SF Department of Parking & Traffic"*).
2.  **Update Status**: Move tickets along the resolution lifecycle:
    *   `Reported` ➔ `Verified` ➔ `Assigned` ➔ `In Progress` ➔ `Resolved`
3.  **Comments & Timeline**: Comment directly on tickets to provide updates to citizens (e.g., *"Repair crew dispatched for Monday morning"*). Every change is tracked on the ticket's public timeline.

### AI Thread Summarizer
For complex tickets with extensive comments and citizen discussions, click **Summarize Thread** on the ticket detail page. Gemini will compile the entire conversation into a concise summary, saving administrators time.

### Executive Reports and Audits
The report builder allows administrators to compile civic data for stakeholders.

1.  Navigate to the **Executive Audits** tab in the Admin Dashboard.
2.  Choose a reporting cycle: **Weekly** or **Monthly**.
3.  **Custom Scope Report**: Input a custom query (e.g., *"List all public safety issues delayed by more than 3 days, and summarize SFPW workload bottlenecks"*).
4.  Click **Generate Report**. The Gemini engine will compile a formatted markdown report detailing statistics, trends, and recommendations.
5.  Click **Download Report (.md)** to save the document.
