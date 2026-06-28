/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum IssueCategory {
  Pothole = "Pothole",
  WaterLeakage = "Water Leakage",
  Garbage = "Garbage",
  Drainage = "Drainage",
  Streetlight = "Streetlight",
  RoadDamage = "Road Damage",
  PublicSafety = "Public Safety",
  Other = "Other"
}

export enum IssueSeverity {
  Low = "Low",
  Medium = "Medium",
  High = "High",
  Critical = "Critical"
}

export enum IssueStatus {
  Reported = "Reported",
  Verified = "Verified",
  Assigned = "Assigned",
  InProgress = "In Progress",
  Resolved = "Resolved"
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: "citizen" | "admin";
  points: number;
  xp?: number; // Synonymous with points for frontend UI safety
  reputationScore?: number; // 0-100 Civic Trust Rating
  reputationTier?: string; // "Civic Apprentice", "Local Sentinel", "Golden Guardian", "City Defender"
  streakCount?: number; // Daily contribution streak
  badges: string[];
  createdAt: string;
}

export interface Issue {
  id: string;
  title: string;
  description: string;
  category: IssueCategory;
  severity: IssueSeverity;
  status: IssueStatus;
  latitude: number;
  longitude: number;
  imageUrl: string;
  reporterId: string;
  reporterName: string;
  assignedDepartment?: string;
  upvotesCount: number;
  upvotedBy: string[]; // List of user IDs
  verifiedBy: string[]; // List of user IDs who verified it
  verificationsCount: number;
  priorityIndex: number; // AI dynamic Priority Ranking (1-100)
  summary: string;
  aiExplanation?: string;
  aiThreadSummary?: string; // Long-form AI summarization of entire ticket thread
  predictedResolutionDays?: number; // AI predicted resolution time in days
  predictionConfidenceScore?: number; // Confidence score (0-100)
  predictionReasoning?: string; // AI explanation/reasoning behind prediction
  isDuplicateOfId?: string; // Pointer to primary issue if marked duplicate
  duplicateCount?: number; // Number of merged duplicate reports
  createdAt: string;
  updatedAt: string;
}

export interface CivicNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: "xp" | "badge" | "status" | "duplicate" | "system" | "priority" | "verify";
  createdAt: string;
  read: boolean;
}

export interface Comment {
  id: string;
  issueId: string;
  userId: string;
  userName: string;
  userRole: "citizen" | "admin" | "ai";
  text: string;
  createdAt: string;
}

export interface TimelineItem {
  id: string;
  issueId: string;
  status: IssueStatus;
  title: string;
  description: string;
  updatedBy: string; // "reporter" | "admin" | "ai"
  createdAt: string;
}

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  duplicateIssueId?: string;
  similarityScore: number; // 0 to 100
  explanation: string;
}

export interface AIAnalytics {
  mostCommonCategory: IssueCategory;
  mostAffectedArea: string;
  averageResolutionTimeHours: number;
  monthlyTrends: { month: string; reports: number; resolved: number }[];
  categoryDistribution: { category: string; count: number }[];
  severityDistribution: { severity: string; count: number }[];
  summaryMessage: string;
  predictiveStats?: {
    averagePredictedDays: number;
    fastestDepartments: { department: string; avgDays: number }[];
    slowestDepartments: { department: string; avgDays: number }[];
  };
}

export interface PredictiveInsight {
  hotspots: {
    lat: number;
    lng: number;
    areaName: string;
    riskScore: number; // 1-100
    riskLevel: "Low" | "Medium" | "High" | "Critical";
    predictedCategory: IssueCategory;
    reasoning: string;
  }[];
  recurringFailures: {
    infrastructureType: string;
    locationPattern: string;
    suggestedPreemptiveAction: string;
  }[];
  summaryMarkdown: string;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  role: "user" | "model";
  text: string;
  createdAt: string;
}

export interface ChatSession {
  id: string;
  userId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

