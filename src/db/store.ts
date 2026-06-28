/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";
import { User, Issue, Comment, TimelineItem, IssueCategory, IssueSeverity, IssueStatus, ChatMessage, ChatSession, CivicNotification } from "../types.js";

const DB_FILE = path.join(process.cwd(), "db.json");

export function calculatePriorityIndex(issue: { severity: IssueSeverity; upvotesCount: number; verificationsCount: number; createdAt: string }): number {
  let severityScore = 20;
  if (issue.severity === IssueSeverity.Critical) severityScore = 80;
  else if (issue.severity === IssueSeverity.High) severityScore = 60;
  else if (issue.severity === IssueSeverity.Medium) severityScore = 40;
  else if (issue.severity === IssueSeverity.Low) severityScore = 20;

  const engagementScore = Math.min(issue.upvotesCount * 1.5 + issue.verificationsCount * 4, 15);
  const ageInDays = (Date.now() - new Date(issue.createdAt).getTime()) / (1000 * 3600 * 24);
  const ageScore = Math.min(ageInDays * 0.5, 5);

  return Math.round(Math.min(severityScore + engagementScore + ageScore, 100));
}

interface DBStructure {
  users: User[];
  passwords: Record<string, string>; // Maps userId -> hashedPassword
  issues: Issue[];
  comments: Comment[];
  timeline: TimelineItem[];
  chat_sessions: ChatSession[];
  chat_messages: ChatMessage[];
  notifications: CivicNotification[];
}

class Store {
  private data: DBStructure = {
    users: [],
    passwords: {},
    issues: [],
    comments: [],
    timeline: [],
    chat_sessions: [],
    chat_messages: [],
    notifications: []
  };

  constructor() {
    this.load();
  }

  private load() {
    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, "utf-8");
        this.data = JSON.parse(raw);
        if (!this.data.chat_sessions) this.data.chat_sessions = [];
        if (!this.data.chat_messages) this.data.chat_messages = [];
        if (!this.data.notifications) this.data.notifications = [];
        console.log(`[Store] Loaded ${this.data.issues.length} issues, ${this.data.users.length} users successfully from ${DB_FILE}`);
        return;
      } catch (err) {
        console.error("[Store] Failed to parse db.json, re-initializing", err);
      }
    }
    
    // Seed default data if not exists
    console.log("[Store] db.json not found. Initializing seed data...");
    this.seed();
    this.save();
  }

  public save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), "utf-8");
    } catch (err) {
      console.error("[Store] Failed to write to db.json", err);
    }
  }

  private seed() {
    const adminId = "u_default_admin";
    const citizen1Id = "u_jane_doe";
    const citizen2Id = "u_john_smith";

    // 1. Seed Users
    const plainPasswords = {
      [adminId]: "admin123",
      [citizen1Id]: "jane123",
      [citizen2Id]: "john123"
    };

    const users: User[] = [
      {
        id: adminId,
        email: "admin@community.org",
        fullName: "Alex Admin",
        role: "admin",
        points: 500,
        xp: 500,
        reputationScore: 100,
        reputationTier: "City Guardian",
        streakCount: 15,
        badges: ["Civic Champion", "City Administrator"],
        createdAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString()
      },
      {
        id: citizen1Id,
        email: "jane@community.org",
        fullName: "Jane Doe",
        role: "citizen",
        points: 240,
        xp: 240,
        reputationScore: 95,
        reputationTier: "Community Sentinel",
        streakCount: 6,
        badges: ["Community Helper", "Civic Champion"],
        createdAt: new Date(Date.now() - 25 * 24 * 3600 * 1000).toISOString()
      },
      {
        id: citizen2Id,
        email: "john@community.org",
        fullName: "John Smith",
        role: "citizen",
        points: 80,
        xp: 80,
        reputationScore: 84,
        reputationTier: "Civic Helper",
        streakCount: 3,
        badges: ["Community Helper"],
        createdAt: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString()
      }
    ];

    const passwords: Record<string, string> = {};
    for (const [uid, pwd] of Object.entries(plainPasswords)) {
      passwords[uid] = bcrypt.hashSync(pwd, 10);
    }

    // 2. Seed Issues (Centered around San Francisco Civic Center / SOMA: 37.7749, -122.4194)
    const issues: Issue[] = [
      {
        id: "issue_1",
        title: "Disruptive Pothole on Market Street",
        description: "A huge pothole has formed in the middle of Market Street near 8th. It is damaging vehicle suspensions and causing drivers to swerve dangerously into the bus lane.",
        category: IssueCategory.Pothole,
        severity: IssueSeverity.High,
        status: IssueStatus.InProgress,
        latitude: 37.7785,
        longitude: -122.4148,
        imageUrl: "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?q=80&w=800&auto=format&fit=crop",
        reporterId: citizen1Id,
        reporterName: "Jane Doe",
        assignedDepartment: "Department of Public Works (SFPW)",
        upvotesCount: 22,
        upvotedBy: [citizen2Id, adminId],
        verifiedBy: [citizen2Id, adminId],
        verificationsCount: 2,
        priorityIndex: 78,
        summary: "Hazardous mid-street pothole on Market near 8th causing vehicle detours and safe lane violations.",
        aiExplanation: "Our AI model evaluated this issue and flagged it with High Severity due to high traffic density on Market Street combined with high reports of vehicle alignment stress near 8th.",
        createdAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString()
      },
      {
        id: "issue_2",
        title: "Water Mains Leaking onto Sidewalk",
        description: "Fresh water has been bubbling up from under the sidewalk flagstones for three days straight. It is creating a large mossy slick and wasting municipal water.",
        category: IssueCategory.WaterLeakage,
        severity: IssueSeverity.Medium,
        status: IssueStatus.Verified,
        latitude: 37.7725,
        longitude: -122.4225,
        imageUrl: "https://images.unsplash.com/photo-1542013936693-8848e5744a70?q=80&w=800&auto=format&fit=crop",
        reporterId: citizen2Id,
        reporterName: "John Smith",
        assignedDepartment: "Water Supply & Sanitation Department",
        upvotesCount: 14,
        upvotedBy: [citizen1Id],
        verifiedBy: [citizen1Id],
        verificationsCount: 1,
        priorityIndex: 52,
        summary: "Subterranean leak wasting fresh water and forming slipping hazards on pedestrian walkways.",
        aiExplanation: "Analyzed via Gemini. Categorized as Water Leakage with moderate risk due to continuous clean water loss but minimal foundation damage reports.",
        createdAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString()
      },
      {
        id: "issue_3",
        title: "Widespread Illegal Garbage Pile",
        description: "Extensive heap of unbagged household waste, old mattresses, and electronic equipment dumped directly in front of the community park playground. Dog owners and children are exposed to broken glass.",
        category: IssueCategory.Garbage,
        severity: IssueSeverity.Critical,
        status: IssueStatus.Reported,
        latitude: 37.7761,
        longitude: -122.4082,
        imageUrl: "https://images.unsplash.com/photo-1611273426858-450d8e3c9fce?q=80&w=800&auto=format&fit=crop",
        reporterId: citizen1Id,
        reporterName: "Jane Doe",
        upvotesCount: 8,
        upvotedBy: [],
        verifiedBy: [],
        verificationsCount: 0,
        priorityIndex: 85,
        summary: "Hazardous illegal dumping of toxic items and broken glass directly adjacent to children's park boundaries.",
        aiExplanation: "Gemini assessed: Severe public health risk. Biohazard and physical laceration vectors near high children density markers. Recommending immediate waste remediation dispatch.",
        createdAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString()
      },
      {
        id: "issue_4",
        title: "Broken Streetlight on Valencia St",
        description: "Entire streetlight base is dark for the second block of Valencia. It is extremely pitch dark at night, causing several near-miss incidents for cyclists on the bike lanes.",
        category: IssueCategory.Streetlight,
        severity: IssueSeverity.Medium,
        status: IssueStatus.Resolved,
        latitude: 37.7612,
        longitude: -122.4218,
        imageUrl: "https://images.unsplash.com/photo-1540959733332-eab4deceeaf7?q=80&w=800&auto=format&fit=crop",
        reporterId: citizen2Id,
        reporterName: "John Smith",
        assignedDepartment: "Municipal Power & Lighting Department",
        upvotesCount: 30,
        upvotedBy: [citizen1Id, adminId],
        verifiedBy: [citizen1Id, adminId],
        verificationsCount: 2,
        priorityIndex: 45,
        summary: "Darkened utility streetlamps along highly traveled Valencia cycling corridor causing collision dangers.",
        aiExplanation: "AI diagnostics recommend prioritised lighting crews due to the high density of nighttime micro-mobility traffic on Valencia bike lane grid.",
        createdAt: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString()
      },
      {
        id: "issue_5",
        title: "Clogged Storm Drain Flooding Corner",
        description: "Dead leaves, single-use cups, and mud have fully packed the corner curb drainage grate. Over 6 inches of water overflows the sidewalk even during a light drizzle.",
        category: IssueCategory.Drainage,
        severity: IssueSeverity.Medium,
        status: IssueStatus.Resolved,
        latitude: 37.7712,
        longitude: -122.4112,
        imageUrl: "https://images.unsplash.com/photo-1508873696983-2df519fcd3ad?q=80&w=800&auto=format&fit=crop",
        reporterId: citizen1Id,
        reporterName: "Jane Doe",
        assignedDepartment: "Sanitation & Sewer Management Service",
        upvotesCount: 12,
        upvotedBy: [citizen2Id],
        verifiedBy: [citizen2Id],
        verificationsCount: 1,
        priorityIndex: 30,
        summary: "Curb drain blockage generating standing water pool and intersection flooding on footpaths.",
        aiExplanation: "Gemini automatic assessment: Blocked drainage grate. Medium priority because it impacts accessibility but doesn't threaten foundation flooding.",
        createdAt: new Date(Date.now() - 12 * 24 * 3600 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 9 * 24 * 3600 * 1000).toISOString()
      }
    ];

    // 3. Seed Comments
    const comments: Comment[] = [
      {
        id: "com_1_1",
        issueId: "issue_1",
        userId: citizen2Id,
        userName: "John Smith",
        userRole: "citizen",
        text: "I literally hit this pothole yesterday on my drive home! Thankfully my tires are okay, but this is incredibly deep. Glad someone reported it.",
        createdAt: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString()
      },
      {
        id: "com_1_2",
        issueId: "issue_1",
        userId: adminId,
        userName: "Alex Admin",
        userRole: "admin",
        text: "Understood. The Department of Public Works was notified, and have formally accepted and assigned this work order. Setting status to In Progress.",
        createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString()
      },
      {
        id: "com_2_1",
        issueId: "issue_2",
        userId: citizen1Id,
        userName: "Jane Doe",
        userRole: "citizen",
        text: "I just walked by and can confirm water is still pooling. The sidewalk is getting very slippery as some green moss has started to grow.",
        createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString()
      }
    ];

    // 4. Seed Timeline
    const timeline: TimelineItem[] = [
      {
        id: "time_1_1",
        issueId: "issue_1",
        status: IssueStatus.Reported,
        title: "Refined Issue Created",
        description: "Citizen Jane Doe filed a detailed report with coordinates and a photo.",
        updatedBy: "reporter",
        createdAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString()
      },
      {
        id: "time_1_2",
        issueId: "issue_1",
        status: IssueStatus.Verified,
        title: "Community Verified",
        description: "Verified by nearby citizens checking coordinates and status.",
        updatedBy: "ai",
        createdAt: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString()
      },
      {
        id: "time_1_3",
        issueId: "issue_1",
        status: IssueStatus.Assigned,
        title: "Work Order Assigned",
        description: "Assigned by City Admin to Department of Public Works (SFPW).",
        updatedBy: "admin",
        createdAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString()
      },
      {
        id: "time_1_4",
        issueId: "issue_1",
        status: IssueStatus.InProgress,
        title: "Resolution In Progress",
        description: "Service crew dispatched to complete asphalt patch filling.",
        updatedBy: "admin",
        createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString()
      },
      // Issue 2
      {
        id: "time_2_1",
        issueId: "issue_2",
        status: IssueStatus.Reported,
        title: "Reported Leakage",
        description: "Citizen John Smith created report.",
        updatedBy: "reporter",
        createdAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString()
      },
      {
        id: "time_2_2",
        issueId: "issue_2",
        status: IssueStatus.Verified,
        title: "Upvoted & Verified by Citizens",
        description: "Civic members verified and confirmed active sidewalk flow.",
        updatedBy: "reporter",
        createdAt: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString()
      },
      // Issue 3
      {
        id: "time_3_1",
        issueId: "issue_3",
        status: IssueStatus.Reported,
        title: "Critical Household Dump Encountered",
        description: "Report filed inside citizen panel.",
        updatedBy: "reporter",
        createdAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString()
      },
      // Issue 4
      {
        id: "time_4_1",
        issueId: "issue_4",
        status: IssueStatus.Reported,
        title: "Dark Cycleway Reported",
        description: "Citizen John Smith filed streetlight outage.",
        updatedBy: "reporter",
        createdAt: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString()
      },
      {
        id: "time_4_2",
        issueId: "issue_4",
        status: IssueStatus.InProgress,
        title: "Crews Active on Lamp Pole",
        description: "Technicians tracking ballast outage and changing bulb.",
        updatedBy: "admin",
        createdAt: new Date(Date.now() - 6 * 24 * 3600 * 1000).toISOString()
      },
      {
        id: "time_4_3",
        issueId: "issue_4",
        status: IssueStatus.Resolved,
        title: "Lamp Bulb & Base Repaired",
        description: "Light sensor swapped and service verified nominal functional status. Citizen rewarded +100 XP.",
        updatedBy: "admin",
        createdAt: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString()
      }
    ];

    this.data = {
      users,
      passwords,
      issues,
      comments,
      timeline,
      notifications: [],
      chat_sessions: [],
      chat_messages: []
    };
  }

  // API wrappers
  public getUsers(): User[] {
    return this.data.users;
  }

  public getUserByEmail(email: string): User | undefined {
    return this.data.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  public getUserById(id: string): User | undefined {
    return this.data.users.find((u) => u.id === id);
  }

  public getUserPasswordHash(userId: string): string | undefined {
    return this.data.passwords[userId];
  }

  public addUser(user: User, passwordHash: string) {
    this.data.users.push(user);
    this.data.passwords[user.id] = passwordHash;
    this.save();
  }

  public updateUserPointsAndBadges(userId: string, pointsEarned: number) {
    const user = this.getUserById(userId);
    if (user) {
      user.points += pointsEarned;
      user.xp = user.points;
      
      // Initialize if missing
      if (user.reputationScore === undefined || user.reputationScore === null) {
        user.reputationScore = 75;
      }
      if (user.streakCount === undefined || user.streakCount === null) {
        user.streakCount = 1;
      }
      
      // Update reputation dynamically based on activities
      const reputationEarned = Math.round(pointsEarned / 12);
      user.reputationScore = Math.min(Math.max(user.reputationScore + (reputationEarned || 1), 0), 100);
      
      // Calculate reputation tier
      if (user.reputationScore >= 95) {
        user.reputationTier = "City Guardian";
      } else if (user.reputationScore >= 85) {
        user.reputationTier = "Community Sentinel";
      } else if (user.reputationScore >= 70) {
        user.reputationTier = "Active Patrol";
      } else if (user.reputationScore >= 50) {
        user.reputationTier = "Civic Helper";
      } else {
        user.reputationTier = "Civic Apprentice";
      }

      // Randomly simulate streak progression (for richer mock feel)
      if (Math.random() > 0.4) {
        user.streakCount = Math.min(user.streakCount + 1, 100);
      }

      // Dynamic gamified badge tracking
      const oldBadges = [...user.badges];
      if (user.points >= 150 && !user.badges.includes("Community Helper")) {
        user.badges.push("Community Helper");
      }
      if (user.points >= 300 && !user.badges.includes("Civic Champion")) {
        user.badges.push("Civic Champion");
      }
      if (user.points >= 500 && !user.badges.includes("Local Hero")) {
        user.badges.push("Local Hero");
      }
      if (user.reputationScore >= 90 && !user.badges.includes("Trust Sentinel")) {
        user.badges.push("Trust Sentinel");
      }
      
      this.save();
      return {
        points: user.points,
        xp: user.xp,
        reputationScore: user.reputationScore,
        reputationTier: user.reputationTier,
        streakCount: user.streakCount,
        badges: user.badges,
        newBadges: user.badges.filter(b => !oldBadges.includes(b))
      };
    }
    return null;
  }

  public getIssues(): Issue[] {
    return this.data.issues;
  }

  public getIssueById(id: string): Issue | undefined {
    return this.data.issues.find((i) => i.id === id);
  }

  public addIssue(issue: Issue) {
    this.data.issues.unshift(issue); // Put newest on top
    this.save();
  }

  public updateIssue(id: string, updates: Partial<Issue>) {
    const issueIndex = this.data.issues.findIndex((i) => i.id === id);
    if (issueIndex !== -1) {
      this.data.issues[issueIndex] = {
        ...this.data.issues[issueIndex],
        ...updates,
        updatedAt: new Date().toISOString()
      };
      this.save();
      return this.data.issues[issueIndex];
    }
    return undefined;
  }

  public deleteIssue(id: string): boolean {
    const issueIndex = this.data.issues.findIndex((i) => i.id === id);
    if (issueIndex !== -1) {
      this.data.issues.splice(issueIndex, 1);
      this.data.comments = this.data.comments.filter((c) => c.issueId !== id);
      this.data.timeline = this.data.timeline.filter((t) => t.issueId !== id);
      this.save();
      return true;
    }
    return false;
  }

  public getComments(issueId: string): Comment[] {
    return this.data.comments.filter((c) => c.issueId === issueId);
  }

  public addComment(comment: Comment) {
    this.data.comments.push(comment);
    this.save();
  }

  public getTimeline(issueId: string): TimelineItem[] {
    return this.data.timeline.filter((t) => t.issueId === issueId).sort((a,b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  public addTimelineItem(item: TimelineItem) {
    this.data.timeline.push(item);
    this.save();
  }

  public getChatSessions(userId: string): ChatSession[] {
    return (this.data.chat_sessions || []).filter((s) => s.userId === userId).sort((a,b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  public getChatSessionById(id: string): ChatSession | undefined {
    return (this.data.chat_sessions || []).find((s) => s.id === id);
  }

  public addChatSession(session: ChatSession) {
    if (!this.data.chat_sessions) this.data.chat_sessions = [];
    this.data.chat_sessions.push(session);
    this.save();
  }

  public getChatMessages(sessionId: string): ChatMessage[] {
    return (this.data.chat_messages || []).filter((m) => m.sessionId === sessionId).sort((a,b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  public addChatMessage(msg: ChatMessage) {
    if (!this.data.chat_messages) this.data.chat_messages = [];
    this.data.chat_messages.push(msg);
    const session = this.getChatSessionById(msg.sessionId);
    if (session) {
      session.updatedAt = new Date().toISOString();
    }
    this.save();
  }

  public getNotifications(userId: string): CivicNotification[] {
    if (!this.data.notifications) this.data.notifications = [];
    return this.data.notifications
      .filter((n) => n.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public addNotification(notif: CivicNotification) {
    if (!this.data.notifications) this.data.notifications = [];
    this.data.notifications.push(notif);
    this.save();
  }

  public markNotificationAsRead(id: string) {
    if (!this.data.notifications) this.data.notifications = [];
    const n = this.data.notifications.find((notif) => notif.id === id);
    if (n) {
      n.read = true;
      this.save();
    }
  }

  public markAllNotificationsAsRead(userId: string) {
    if (!this.data.notifications) this.data.notifications = [];
    this.data.notifications.forEach((n) => {
      if (n.userId === userId) {
        n.read = true;
      }
    });
    this.save();
  }
}

export const dbStore = new Store();
