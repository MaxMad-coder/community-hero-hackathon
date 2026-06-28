/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { 
  AlertTriangle, 
  MapPin, 
  Activity, 
  CheckCircle2, 
  MessageSquare, 
  PlusCircle, 
  Search, 
  ShieldAlert, 
  Sparkles, 
  TrendingUp, 
  User, 
  UserCheck, 
  LogOut, 
  Map as MapIcon, 
  Award, 
  Upload, 
  Clock, 
  ShieldCheck, 
  CheckSquare,
  Lock,
  Menu,
  X,
  Mic,
  MicOff,
  Volume2,
  Loader2,
  Bell
} from "lucide-react";
import MapContainer from "./components/MapContainer.js";
import AnalyticsPanel from "./components/AnalyticsPanel.js";
import Leaderboard from "./components/Leaderboard.js";
import AICivicAssistant from "./components/AICivicAssistant.js";
import LandingPage from "./components/LandingPage.js";
import AuthPages from "./components/AuthPages.js";
import DashboardPage from "./components/DashboardPage.js";
import ReportIssuePage from "./components/ReportIssuePage.js";
import IssueDetailsPage from "./components/IssueDetailsPage.js";
import CommunityFeedPage from "./components/CommunityFeedPage.js";
import AdminDashboardPage from "./components/AdminDashboardPage.js";
import { User as UserType, Issue, Comment, TimelineItem, IssueCategory, IssueSeverity, IssueStatus } from "./types.js";

const CATEGORY_ICONS: Record<IssueCategory, string> = {
  [IssueCategory.Pothole]: "🚇",
  [IssueCategory.WaterLeakage]: "💧",
  [IssueCategory.Garbage]: "🗑️",
  [IssueCategory.Drainage]: "🌀",
  [IssueCategory.Streetlight]: "💡",
  [IssueCategory.RoadDamage]: "🚧",
  [IssueCategory.PublicSafety]: "🛡️",
  [IssueCategory.Other]: "⚙️"
};

const IMAGE_PRESETS = [
  { label: "Pothole Damaged Road", url: "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?q=80&w=800&auto=format&fit=crop" },
  { label: "Busted Water Mains", url: "https://images.unsplash.com/photo-1542013936693-8848e5744a70?q=80&w=800&auto=format&fit=crop" },
  { label: "Overflowing Street Trash Can", url: "https://images.unsplash.com/photo-1611273426858-450d8e3c9fce?q=80&w=800&auto=format&fit=crop" },
  { label: "Dark Street Lantern Grid", url: "https://images.unsplash.com/photo-1540959733332-eab4deceeaf7?q=80&w=800&auto=format&fit=crop" },
  { label: "Sewer Drain Blockage", url: "https://images.unsplash.com/photo-1508873696983-2df519fcd3ad?q=80&w=800&auto=format&fit=crop" }
];

export default function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"));
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  
  // Auth Form State
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authName, setAuthName] = useState("");
  const [authRole, setAuthRole] = useState<"citizen" | "admin">("citizen");
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  // Active Tab navigation
  const [activeTab, setActiveTab] = useState<string>("landing");
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  const [isFloatingOpen, setIsFloatingOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Core Data
  const [issues, setIssues] = useState<Issue[]>([]);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [allUsers, setAllUsers] = useState<UserType[]>([]);
  const [analytics, setAnalytics] = useState<any | null>(null);
  const [predictive, setPredictive] = useState<any | null>(null);

  // Filter conditions
  const [filterCategory, setFilterCategory] = useState<string>("All");
  const [filterSeverity, setFilterSeverity] = useState<string>("All");
  const [filterStatus, setFilterStatus] = useState<string>("All");
  const [searchText, setSearchText] = useState("");

  // Create Issue Modal / Form States
  const [isReporting, setIsReporting] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newLat, setNewLat] = useState<number | null>(null);
  const [newLng, setNewLng] = useState<number | null>(null);
  const [newImage, setNewImage] = useState("");
  
  // Real-Time AI duplicate sweep trigger
  const [duplicateAudit, setDuplicateAudit] = useState<{
    checked: boolean;
    isDuplicate: boolean;
    duplicateIssueId?: string;
    similarityScore: number;
    explanation: string;
  } | null>(null);
  const [duplicateCheckLoading, setDuplicateCheckLoading] = useState(false);

  // Creation loading
  const [submitLoading, setSubmitLoading] = useState(false);

  // Voice-to-Complaint States
  const [isListening, setIsListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const [voiceLoading, setVoiceLoading] = useState(false);
  const [voiceSuccessMsg, setVoiceSuccessMsg] = useState<{
    original: string;
    title: string;
    description: string;
    category: string;
    severity: string;
  } | null>(null);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  
  // User Verification Actions
  const [verificationNotes, setVerificationNotes] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  // Action comment text
  const [newCommentText, setNewCommentText] = useState("");

  // Admin controls
  const [adminStatusUpdate, setAdminStatusUpdate] = useState<string>("");
  const [adminDeptUpdate, setAdminDeptUpdate] = useState<string>("");
  const [adminSaving, setAdminSaving] = useState(false);

  // XP Alert Notice
  const [xpNotice, setXpNotice] = useState<{ points: number; badge?: string } | null>(null);

  // Notifications State
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const fetchNotifications = async () => {
    if (!token) return;
    try {
      const res = await fetch("/api/notifications", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      }
    } catch (err) {
      console.error("Error fetching notifications", err);
    }
  };

  const handleMarkAllRead = async () => {
    if (!token) return;
    try {
      const res = await fetch("/api/notifications/read-all", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchNotifications();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkRead = async (id: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/notifications/${id}/read`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchNotifications();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch Session data immediately
  useEffect(() => {
    const activeToken = token || localStorage.getItem("token");
    console.log("[App useEffect] Session check. Active token present:", !!activeToken, "CurrentUser present:", !!currentUser);
    if (activeToken) {
      if (!currentUser) {
        console.log("[App useEffect] Token found but no currentUser. Fetching profile...");
        fetchCurrentUser();
      } else {
        console.log("[App useEffect] Token found and currentUser already set. Skipping profile fetch.");
      }
      fetchNotifications();
    } else {
      console.log("[App useEffect] No active token. Skipping profile and notification fetch.");
    }
    fetchIssues();
    fetchLeaderboard();
  }, [token, currentUser]);

  // Handle active selected issues updates
  useEffect(() => {
    if (selectedIssue) {
      fetchCommentsAndTimeline(selectedIssue.id);
    }
  }, [selectedIssue]);

  // Handle analytical streams
  useEffect(() => {
    if (activeTab === "analytics") {
      fetchAnalyticsAndPredictive();
    }
  }, [activeTab]);

  const fetchCurrentUser = async () => {
    const activeToken = token || localStorage.getItem("token");
    if (!activeToken) {
      console.warn("[fetchCurrentUser] No token found. Skipping fetch.");
      return;
    }
    try {
      console.log("[fetchCurrentUser] Starting fetch. Token length:", activeToken.length);
      const res = await fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${activeToken}` }
      });
      console.log("[fetchCurrentUser] Response status code:", res.status);
      if (res.ok) {
        const data = await res.json();
        console.log("[fetchCurrentUser] Profile fetched successfully for:", data.user?.email);
        setCurrentUser(data.user);
      } else if (res.status === 401 || res.status === 403 || res.status === 404) {
        console.warn("[fetchCurrentUser] Auth error status received. Calling handleLogout(). res status:", res.status);
        handleLogout();
      }
    } catch (err) {
      console.error("[fetchCurrentUser] Network error fetching current user profile:", err);
      // Do not clear token or log out on temporary network/server connection issues
    }
  };

  const fetchIssues = async () => {
    try {
      const res = await fetch("/api/issues");
      if (res.ok) {
        const data = await res.json();
        setIssues(data.issues);
        // Sync selected issue if it exists
        if (selectedIssue) {
          const match = data.issues.find((i: Issue) => i.id === selectedIssue.id);
          if (match) setSelectedIssue(match);
        }
      }
    } catch (err) {
      console.error("Failed to load issues", err);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const res = await fetch("/api/users/leaderboard");
      if (res.ok) {
        const data = await res.json();
        setAllUsers(data.leaderboard);
      }
    } catch (err) {
      console.error("Leaderboard load failed", err);
    }
  };

  const fetchCommentsAndTimeline = async (id: string) => {
    try {
      const creq = fetch(`/api/issues/${id}/comments`);
      const treq = fetch(`/api/issues/${id}/timeline`);
      const [cres, tres] = await Promise.all([creq, treq]);
      if (cres.ok) {
        const cdata = await cres.json();
        setComments(cdata.comments);
      }
      if (tres.ok) {
        const tdata = await tres.json();
        setTimeline(tdata.timeline);
      }
    } catch (err) {
      console.error("Timeline comments load failed", err);
    }
  };

  const fetchAnalyticsAndPredictive = async () => {
    try {
      const areq = fetch("/api/analytics");
      const preq = fetch("/api/predictive");
      const [ares, pres] = await Promise.all([areq, preq]);
      if (ares.ok) {
        const adata = await ares.json();
        setAnalytics(adata.analytics);
      }
      if (pres.ok) {
        const pdata = await pres.json();
        setPredictive(pdata.predictive);
      }
    } catch (err) {
      console.error("Data load failed", err);
    }
  };

  // Auth operations
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);
    const endpoint = authMode === "login" ? "/api/auth/login" : "/api/auth/register";
    const body = authMode === "login" 
      ? { email: authEmail, password: authPassword }
      : { email: authEmail, fullName: authName, password: authPassword, role: authRole };

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!res.ok) {
        setAuthError(data.error || "Authentication failed");
      } else {
        localStorage.setItem("token", data.token);
        setToken(data.token);
        setCurrentUser(data.user);
        setAuthEmail("");
        setAuthPassword("");
        setAuthName("");
      }
    } catch {
      setAuthError("Network error, please verify express connection.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setCurrentUser(null);
    setSelectedIssue(null);
  };

  // Upvote process
  const handleUpvote = async (issueId: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/issues/${issueId}/upvote`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        // Instant local update
        setIssues(prev => prev.map(issue => {
          if (issue.id === issueId) {
            const hasUpvoted = issue.upvotedBy.includes(currentUser?.id || "");
            const newUpvoted = hasUpvoted
              ? issue.upvotedBy.filter(u => u !== currentUser?.id)
              : [...issue.upvotedBy, currentUser?.id || ""];
            return {
              ...issue,
              upvotedBy: newUpvoted,
              upvotesCount: newUpvoted.length
            };
          }
          return issue;
        }));
        
        // Sync detail view
        if (selectedIssue?.id === issueId) {
          const hasUpvoted = selectedIssue.upvotedBy.includes(currentUser?.id || "");
          const newUpvoted = hasUpvoted
            ? selectedIssue.upvotedBy.filter(u => u !== currentUser?.id)
            : [...selectedIssue.upvotedBy, currentUser?.id || ""];
          setSelectedIssue(prev => prev ? {
            ...prev,
            upvotedBy: newUpvoted,
            upvotesCount: newUpvoted.length
          } : null);
        }
        
        triggerXpAlert(5);
        fetchIssues();
        fetchLeaderboard();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Custom Verification process
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedIssue) return;
    try {
      const res = await fetch(`/api/issues/${selectedIssue.id}/verify`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ notes: verificationNotes })
      });
      if (res.ok) {
        const data = await res.json();
        setVerificationNotes("");
        setIsVerifying(false);
        triggerXpAlert(20);
        fetchIssues();
        fetchCommentsAndTimeline(selectedIssue.id);
        fetchLeaderboard();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Create comments block
  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedIssue || !newCommentText.trim()) return;
    try {
      const res = await fetch(`/api/issues/${selectedIssue.id}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ text: newCommentText })
      });
      if (res.ok) {
        setNewCommentText("");
        fetchCommentsAndTimeline(selectedIssue.id);
        fetchLeaderboard();
        triggerXpAlert(2);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // ADMIN UPDATE FOR TICKET STATUS
  const handleAdminUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedIssue || currentUser?.role !== "admin") return;
    setAdminSaving(true);
    try {
      const res = await fetch(`/api/issues/${selectedIssue.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          status: adminStatusUpdate || undefined,
          assignedDepartment: adminDeptUpdate || undefined
        })
      });
      if (res.ok) {
        fetchIssues();
        fetchCommentsAndTimeline(selectedIssue.id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAdminSaving(false);
    }
  };

  // Run Real-Time background duplicate analysis before submit
  const handleTriggerDuplicateCheck = async () => {
    if (!newTitle.trim() || !newLat || !newLng || !token) return;
    setDuplicateCheckLoading(true);
    setDuplicateAudit(null);
    try {
      const res = await fetch("/api/issues/check-duplicate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: newTitle,
          description: newDescription,
          latitude: newLat,
          longitude: newLng
        })
      });
      if (res.ok) {
        const data = await res.json();
        setDuplicateAudit({
          checked: true,
          ...data.duplicateAudit
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDuplicateCheckLoading(false);
    }
  };

  const startVoiceRecording = () => {
    setVoiceError(null);
    setVoiceSuccessMsg(null);
    setVoiceTranscript("");

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceError("Speech recognition is not supported in this browser. Please use Google Chrome, Edge, or Safari.");
      return;
    }

    try {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = true;
      rec.lang = "en-US";

      rec.onstart = () => {
        setIsListening(true);
      };

      rec.onresult = (event: any) => {
        let currentText = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          currentText += event.results[i][0].transcript;
        }
        if (currentText) {
          setVoiceTranscript(currentText);
        }
      };

      rec.onerror = (event: any) => {
        console.error("Speech recognition error", event);
        setVoiceError(`Audio capture error: ${event.error || "unknown"}`);
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
      rec.start();
    } catch (err: any) {
      console.error(err);
      setVoiceError(`Failed to initialize recorder: ${err.message || err}`);
      setIsListening(false);
    }
  };

  const stopVoiceRecording = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.error(e);
      }
    }
    setIsListening(false);
  };

  // Run AI structured parse on recorded text
  useEffect(() => {
    if (!isListening && voiceTranscript.trim() && !voiceLoading && !voiceSuccessMsg) {
      analyzeVoiceComplaint(voiceTranscript);
    }
  }, [isListening, voiceTranscript]);

  const analyzeVoiceComplaint = async (text: string) => {
    if (!text.trim() || !token) return;
    setVoiceLoading(true);
    setVoiceError(null);

    try {
      const res = await fetch("/api/voice-to-complaint", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ speechText: text })
      });
      const data = await res.json();
      if (res.ok && data.parsed) {
        setNewTitle(data.parsed.title);
        setNewDescription(data.parsed.description);
        setVoiceSuccessMsg({
          original: text,
          title: data.parsed.title,
          description: data.parsed.description,
          category: data.parsed.category,
          severity: data.parsed.severity
        });
        
        // Setup coordinates if empty (center of SF index as helper preset)
        if (!newLat || !newLng) {
          setNewLat(37.7749);
          setNewLng(-122.4194);
        }
      } else {
        setVoiceError(data.error || "Failed to analyze speech with Gemini. Please try again.");
      }
    } catch (err: any) {
      console.error(err);
      setVoiceError("Network request error analyzing spoken transcript.");
    } finally {
      setVoiceLoading(false);
    }
  };

  // Complete Creation submittal
  const handleCreateIssueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDescription.trim() || !newLat || !newLng || !token) return;
    setSubmitLoading(true);

    try {
      const res = await fetch("/api/issues", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: newTitle,
          description: newDescription,
          latitude: newLat,
          longitude: newLng,
          imageUrl: newImage
        })
      });
      if (res.ok) {
        // Clear reporting modal state
        setNewTitle("");
        setNewDescription("");
        setNewLat(null);
        setNewLng(null);
        setNewImage("");
        setDuplicateAudit(null);
        setVoiceTranscript("");
        setVoiceSuccessMsg(null);
        setVoiceError(null);
        setIsReporting(false);
        triggerXpAlert(50);
        fetchIssues();
        fetchLeaderboard();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitLoading(false);
    }
  };

  const triggerXpAlert = (points: number, badge?: string) => {
    setXpNotice({ points, badge });
    setTimeout(() => {
      setXpNotice(null);
      fetchCurrentUser();
    }, 4500);
  };

  // Quick coordinate auto pin of SF SOMA hotspots
  const handleSelectHotspotCoords = (lat: number, lng: number) => {
    setActiveTab("map");
    // Generate a temporary selected mock state to pan leaflets
    const tempIssue = { latitude: lat, longitude: lng } as any;
    setSelectedIssue(tempIssue);
    setTimeout(() => {
      setSelectedIssue(null);
    }, 1500);
  };

  // Input drag-drop simulated file upload
  const handlePresetImageChange = (url: string) => {
    setNewImage(url);
  };

  // Global search and status classification cascades
  const filteredIssues = issues.filter(issue => {
    const sTerm = searchText.toLowerCase();
    const titleMatch = issue.title.toLowerCase().includes(sTerm) || issue.description.toLowerCase().includes(sTerm);
    const catMatch = filterCategory === "All" || issue.category === filterCategory;
    const sevMatch = filterSeverity === "All" || issue.severity === filterSeverity;
    const statMatch = filterStatus === "All" || issue.status === filterStatus;
    return titleMatch && catMatch && sevMatch && statMatch;
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans tracking-tight flex flex-col">
      
      {/* 1. GAMIFIED FLOATING NOTIFICATION BANNER */}
      {xpNotice && (
        <div className="fixed top-24 right-6 bg-white border border-blue-100 px-5 py-3 rounded-xl shadow-xl flex items-center gap-3 animate-bounce z-[9999]">
          <span className="text-xl">⭐</span>
          <div>
            <div className="text-xs font-mono font-bold text-blue-600 uppercase tracking-widest">CIVIC ACTION XP</div>
            <div className="text-sm font-extrabold text-slate-800">+{xpNotice.points} Points Gained!</div>
            {xpNotice.badge && (
              <div className="text-[10px] text-amber-600 font-extrabold mt-0.5">Unlocked Badge: {xpNotice.badge}</div>
            )}
          </div>
        </div>
      )}

      {/* 2. UNIVERSAL NAVIGATION HEADER */}
      <header className="sticky top-0 bg-white border-b border-slate-200 px-4 md:px-6 py-4 flex items-center justify-between z-[2000] shadow-sm">
        <div className="flex items-center gap-6 text-left">
          {/* Logo */}
          <div 
            onClick={() => setActiveTab("landing")}
            className="flex items-center gap-2 cursor-pointer group"
          >
            <span className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-xl shadow-sm border border-blue-400/20 text-white font-sans font-bold">🛡️</span>
            <div>
              <h1 className="text-sm font-black uppercase tracking-wider text-slate-900 leading-none">Community Hero</h1>
              <span className="text-[9px] font-mono font-extrabold text-blue-600 tracking-widest uppercase">Hyperlocal AI Solver</span>
            </div>
          </div>

          {/* Desktop Navigation Link Tabs */}
          <nav className="hidden lg:flex items-center gap-1.5 text-xs font-bold text-slate-600">
            <button
              onClick={() => setActiveTab("landing")}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${activeTab === "landing" ? "bg-slate-100 text-slate-900 font-black" : "hover:bg-slate-50 hover:text-slate-900"}`}
            >
              Home
            </button>
            <button
              onClick={() => setActiveTab("map")}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${activeTab === "map" ? "bg-slate-100 text-slate-900 font-black" : "hover:bg-slate-50 hover:text-slate-900"}`}
            >
              Live Map
            </button>
            <button
              onClick={() => setActiveTab("feed")}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${activeTab === "feed" ? "bg-slate-100 text-slate-900 font-black" : "hover:bg-slate-50 hover:text-slate-900"}`}
            >
              Incident Feed
            </button>
            <button
              onClick={() => {
                if (token) {
                  setActiveTab("report");
                } else {
                  setActiveTab("login");
                }
              }}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${activeTab === "report" ? "bg-slate-100 text-slate-900 font-black" : "hover:bg-slate-50 hover:text-slate-900"}`}
            >
              Report Hazard
            </button>
            <button
              onClick={() => setActiveTab("analytics")}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${activeTab === "analytics" ? "bg-slate-100 text-slate-900 font-black" : "hover:bg-slate-50 hover:text-slate-900"}`}
            >
              AI Analytics
            </button>
            <button
              onClick={() => {
                fetchLeaderboard();
                setActiveTab("leaderboard");
              }}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${activeTab === "leaderboard" ? "bg-slate-100 text-slate-900 font-black" : "hover:bg-slate-50 hover:text-slate-900"}`}
            >
              Champions
            </button>
            <button
              onClick={() => setActiveTab("assistant")}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${activeTab === "assistant" ? "bg-slate-100 text-slate-900 font-black" : "hover:bg-slate-50 hover:text-slate-900"}`}
            >
              AI Coordinator
            </button>
            {token && currentUser && (
              <button
                onClick={() => setActiveTab("dashboard")}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${activeTab === "dashboard" ? "bg-blue-50 text-blue-700 font-black border border-blue-100" : "hover:bg-slate-50 hover:text-slate-900"}`}
              >
                My Dashboard
              </button>
            )}
            {token && currentUser?.role === "admin" && (
              <button
                onClick={() => setActiveTab("admin")}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${activeTab === "admin" ? "bg-rose-50 text-rose-700 font-black border border-rose-100" : "hover:bg-slate-50 hover:text-slate-900"}`}
              >
                Admin Console
              </button>
            )}
          </nav>
        </div>

        {/* Auth / Profile CTA */}
        <div className="flex items-center gap-3 relative">
          {token && currentUser ? (
            <div className="flex items-center gap-3 text-right">
              {/* Notification Bell */}
              <div className="relative">
                <button
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl border border-slate-200 cursor-pointer relative flex items-center justify-center"
                  title="Smart Notifications"
                >
                  <Bell className="w-4 h-4" />
                  {notifications.filter(n => !n.read).length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white font-mono font-bold text-[8px] w-4 h-4 flex items-center justify-center rounded-full animate-pulse">
                      {notifications.filter(n => !n.read).length}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown Panel */}
                {notificationsOpen && (
                  <div className="absolute right-0 mt-2.5 w-72 bg-white border border-slate-200 rounded-2xl shadow-xl z-[9999] overflow-hidden p-3.5 space-y-3 animate-fade-in text-left">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                      <span className="text-[10px] font-mono font-extrabold uppercase tracking-widest text-slate-500">Citizen Alerts ({notifications.length})</span>
                      {notifications.filter(n => !n.read).length > 0 && (
                        <button
                          onClick={handleMarkAllRead}
                          className="text-[9px] text-blue-600 font-bold hover:underline"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>

                    <div className="max-h-60 overflow-y-auto space-y-2.5 pr-0.5">
                      {notifications.length === 0 ? (
                        <p className="text-[11px] text-slate-400 py-6 text-center italic font-medium">No live notifications logged yet.</p>
                      ) : (
                        notifications.map((notif) => (
                          <div
                            key={notif.id}
                            onClick={() => {
                              handleMarkRead(notif.id);
                              if (notif.issueId) {
                                setSelectedIssueId(notif.issueId);
                                setActiveTab("details");
                              }
                              setNotificationsOpen(false);
                            }}
                            className={`p-2.5 rounded-xl border text-[11px] transition-all cursor-pointer space-y-1 ${notif.read ? "bg-slate-50/50 border-slate-100 text-slate-500" : "bg-blue-50/20 border-blue-100 text-slate-800 font-medium hover:bg-blue-50/35"}`}
                          >
                            <div className="flex justify-between items-center">
                              <span className="text-[8px] font-mono font-bold uppercase tracking-widest bg-slate-150 text-slate-600 px-1.5 py-0.5 rounded">
                                {notif.type}
                              </span>
                              <span className="text-[8px] font-mono text-slate-400 font-bold">
                                {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="leading-snug text-slate-700">{notif.text}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div 
                onClick={() => setActiveTab("dashboard")}
                className="hidden md:flex flex-col text-right cursor-pointer group"
              >
                <span className="text-xs font-black text-slate-800 group-hover:text-blue-600 transition-colors uppercase tracking-tight">{currentUser.fullName}</span>
                <span className="text-[10px] text-amber-600 font-mono font-bold uppercase">⭐ {currentUser.xp || 0} XP • {currentUser.role}</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200 cursor-pointer animate-fade-in"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab("login")}
                className="text-xs font-bold text-slate-650 hover:text-slate-900 px-3 py-2 cursor-pointer"
              >
                Login
              </button>
              <button
                onClick={() => setActiveTab("register")}
                className="bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs uppercase tracking-wider px-4 py-2 rounded-xl shadow-xs cursor-pointer transition-all active:scale-99"
              >
                Register
              </button>
            </div>
          )}

          {/* Mobile menu burger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-600 hover:text-slate-900 lg:hidden rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* MOBILE EXPANDABLE MENU */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-slate-200 py-3.5 px-4 space-y-2 text-xs font-bold text-slate-600 shadow-sm animate-fade-in text-left">
          <button
            onClick={() => { setActiveTab("landing"); setMobileMenuOpen(false); }}
            className="block w-full py-2 hover:bg-slate-50 px-2 rounded"
          >
            Home Landing Page
          </button>
          <button
            onClick={() => { setActiveTab("map"); setMobileMenuOpen(false); }}
            className="block w-full py-2 hover:bg-slate-50 px-2 rounded"
          >
            Live Map Coordinates
          </button>
          <button
            onClick={() => { setActiveTab("feed"); setMobileMenuOpen(false); }}
            className="block w-full py-2 hover:bg-slate-50 px-2 rounded"
          >
            Incident Feed List
          </button>
          <button
            onClick={() => {
              if (token) {
                setActiveTab("report");
              } else {
                setActiveTab("login");
              }
              setMobileMenuOpen(false);
            }}
            className="block w-full py-2 hover:bg-slate-50 px-2 rounded"
          >
            Report Local Hazard
          </button>
          <button
            onClick={() => { setActiveTab("analytics"); setMobileMenuOpen(false); }}
            className="block w-full py-2 hover:bg-slate-50 px-2 rounded"
          >
            AI Analytics Dashboard
          </button>
          <button
            onClick={() => { fetchLeaderboard(); setActiveTab("leaderboard"); setMobileMenuOpen(false); }}
            className="block w-full py-2 hover:bg-slate-50 px-2 rounded"
          >
            Champions & Rewards
          </button>
          <button
            onClick={() => { setActiveTab("assistant"); setMobileMenuOpen(false); }}
            className="block w-full py-2 hover:bg-slate-50 px-2 rounded"
          >
            AI Coordinator Terminal
          </button>
          {token && currentUser && (
            <button
              onClick={() => { setActiveTab("dashboard"); setMobileMenuOpen(false); }}
              className="block w-full py-2 text-blue-600 hover:bg-blue-50/50 px-2 rounded"
            >
              My Citizen Dashboard
            </button>
          )}
          {token && currentUser?.role === "admin" && (
            <button
              onClick={() => { setActiveTab("admin"); setMobileMenuOpen(false); }}
              className="block w-full py-2 text-rose-600 hover:bg-rose-50/50 px-2 rounded"
            >
              Admin Command Console
            </button>
          )}
        </div>
      )}

      {/* 3. MAIN CONTENT ROUTER WRAPPER */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-6 space-y-6">

        {activeTab === "landing" && (
          <LandingPage 
            onNavigate={setActiveTab} 
            token={token} 
          />
        )}

        {(activeTab === "login" || activeTab === "register") && (
          <AuthPages 
            onAuthSuccess={(t, u) => {
              setToken(t);
              localStorage.setItem("token", t);
              setCurrentUser(u);
              setActiveTab("dashboard");
              triggerXpAlert(50, "Registered Resident");
            }} 
            initialMode={activeTab as "login" | "register"} 
          />
        )}

        {activeTab === "dashboard" && (
          <DashboardPage 
            currentUser={currentUser} 
            issues={issues} 
            analytics={analytics}
            onNavigateToIssue={(id) => {
              setSelectedIssueId(id);
              setActiveTab("details");
            }} 
            onNavigateToView={setActiveTab} 
          />
        )}

        {activeTab === "report" && (
          <ReportIssuePage 
            token={token} 
            onNavigateToView={setActiveTab} 
            onSubmitSuccess={() => {
              fetchIssues();
              setActiveTab("dashboard");
            }} 
            triggerXpAlert={triggerXpAlert} 
          />
        )}

        {activeTab === "details" && (
          <IssueDetailsPage 
            issueId={selectedIssueId || ""} 
            currentUser={currentUser} 
            token={token} 
            onBack={() => {
              setActiveTab("feed");
              setSelectedIssueId(null);
            }} 
            triggerXpAlert={triggerXpAlert} 
          />
        )}

        {activeTab === "feed" && (
          <CommunityFeedPage 
            issues={issues} 
            onSelectIssue={(id) => {
              setSelectedIssueId(id);
              setActiveTab("details");
            }} 
            onNavigateToView={setActiveTab} 
          />
        )}

        {activeTab === "admin" && (
          <AdminDashboardPage 
            currentUser={currentUser} 
            issues={issues} 
            onSelectIssue={(id) => {
              setSelectedIssueId(id);
              setActiveTab("details");
            }} 
            onNavigateToView={setActiveTab} 
            onRefresh={() => {
              fetchIssues();
              fetchAnalyticsAndPredictive();
            }} 
            token={token} 
          />
        )}

        {/* 4. CONTENT WRAPPERS */}
        {activeTab === "map" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="dashboard-tab-map-grid">
            
            {/* LEFT 5 COLUMNS: ISSUE LISTING & FILTERS & REPORT ACTIONS */}
            <div className="lg:col-span-4 flex flex-col gap-4 text-slate-800">
              
              {/* ACTION: CREATE REPORT BUTTON */}
              {token && currentUser && (
                <button 
                  onClick={() => {
                    setIsReporting(!isReporting);
                    setSelectedIssue(null);
                    // Autofill coordinates to slightly offset SF Downtown for fast entry
                    if (!newLat) {
                      setNewLat(37.7749 + (Math.random() - 0.5) * 0.015);
                      setNewLng(-122.4194 + (Math.random() - 0.5) * 0.015);
                    }
                  }}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm border border-blue-500 tracking-wider uppercase cursor-pointer transition-colors"
                >
                  <PlusCircle className="w-4.5 h-4.5" />
                  Report Hyperlocal Hazard
                </button>
              )}

              {/* REPORTING CREATION FORM */}
              {isReporting && token && currentUser && (
                <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-lg animate-fade-in text-left">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-blue-600 uppercase tracking-widest font-mono">Create Hyperlocal Report</h3>
                    <button onClick={() => setIsReporting(false)} className="text-slate-400 hover:text-slate-600">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <form onSubmit={handleCreateIssueSubmit} className="space-y-3.5">
                    {/* Voice-to-Complaint Scribe Block */}
                    <div className="bg-slate-50 border border-slate-150 rounded-xl p-3.5 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono text-slate-700 uppercase tracking-widest font-bold flex items-center gap-1.5">
                          <Mic className="w-3.5 h-3.5 text-blue-650" />
                          Voice-to-Complaint Scribe
                        </span>
                        {isListening ? (
                          <span className="flex h-2 w-2 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                          </span>
                        ) : null}
                      </div>

                      <p className="text-[10px] text-slate-500 leading-normal font-sans">
                        Press speak and describe the hazard in natural words (e.g. <em>"There is a water leakage near the market road."</em>). Gemini will automatically draft the title and description!
                      </p>

                      <div className="flex gap-2">
                        {!isListening ? (
                          <button
                            type="button"
                            onClick={startVoiceRecording}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-blue-50/50 hover:bg-blue-100/70 text-blue-700 font-bold text-[10px] uppercase rounded-lg border border-blue-200/50 cursor-pointer shadow-3xs transition-all active:scale-98"
                          >
                            <Mic className="w-3.5 h-3.5 text-blue-600" />
                            Speak Complaint
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={stopVoiceRecording}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-red-50/70 hover:bg-red-100 text-red-700 font-bold text-[10px] uppercase rounded-lg border border-red-200/50 cursor-pointer shadow-3xs transition-all animate-pulse active:scale-98"
                          >
                            <MicOff className="w-3.5 h-3.5 text-red-600" />
                            Stop Recording
                          </button>
                        )}
                      </div>

                      {/* Live transcripts feedback */}
                      {isListening && (
                        <div className="text-[10px] bg-white border border-slate-200 rounded-lg p-2.5 font-sans font-medium text-slate-650 italic leading-normal animate-pulse shadow-3xs">
                          {voiceTranscript || "Listening... Start speaking now."}
                        </div>
                      )}

                      {voiceLoading && (
                        <div className="text-[10px] text-blue-700 font-bold flex items-center gap-1.5 bg-blue-50/50 border border-blue-150 p-2.5 rounded-lg shadow-3xs">
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                          Gemini core intelligence compiling speech to structured report...
                        </div>
                      )}

                      {voiceError && (
                        <div className="text-[10px] text-red-650 bg-red-50/50 border border-red-150 p-2.5 rounded-lg font-medium shadow-3xs">
                          {voiceError}
                        </div>
                      )}

                      {voiceSuccessMsg && (
                        <div className="text-[10px] bg-emerald-50/30 border border-emerald-150 p-3 rounded-lg space-y-1.5 text-slate-700 shadow-3xs">
                          <div className="text-[9px] font-mono font-bold text-emerald-800 uppercase tracking-widest flex items-center gap-1">
                            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                            AI Voice Capture Extracted!
                          </div>
                          <div>
                            <span className="font-mono text-[9px] text-slate-400 uppercase font-black tracking-wider block">Raw Spoken Phrase</span>
                            <p className="italic text-slate-700 font-medium leading-relaxed">"{voiceSuccessMsg.original}"</p>
                          </div>
                          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 mt-1">
                            <div>
                              <span className="font-mono text-[8px] text-slate-400 uppercase tracking-widest block font-bold">Category Match</span>
                              <span className="font-bold text-slate-800 text-[10px] bg-white px-2 py-0.5 rounded border border-slate-200 mt-0.5 inline-block">{voiceSuccessMsg.category}</span>
                            </div>
                            <div>
                              <span className="font-mono text-[8px] text-slate-400 uppercase tracking-widest block font-bold">Severity Meter</span>
                              <span className={`font-bold text-[10px] px-2 py-0.5 rounded border mt-0.5 inline-block ${
                                voiceSuccessMsg.severity === "Critical" ? "text-red-700 bg-red-50 border-red-100" :
                                voiceSuccessMsg.severity === "High" ? "text-orange-700 bg-orange-50 border-orange-100" :
                                voiceSuccessMsg.severity === "Medium" ? "text-blue-700 bg-blue-50 border-blue-100" :
                                "text-slate-700 bg-slate-50 border-slate-150"
                              }`}>{voiceSuccessMsg.severity}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1">Issue Title</label>
                      <input 
                        type="text" 
                        value={newTitle}
                        onChange={e => setNewTitle(e.target.value)}
                        placeholder="e.g. Deep pothole expanding near corner" 
                        className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                        required
                        onBlur={handleTriggerDuplicateCheck}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1">Hazard Specifications</label>
                      <textarea 
                        value={newDescription}
                        onChange={e => setNewDescription(e.target.value)}
                        placeholder="Provide details of location offsets, damaged components, or pedestrian blockages..." 
                        rows={3}
                        className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                        required
                      />
                    </div>

                    {/* SELECT PRESET PHOTO FOR HACK PREVIEW */}
                    <div className="space-y-2">
                      <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1">Evidence Photo Presets</label>
                      <div className="flex flex-wrap gap-1.5">
                        {IMAGE_PRESETS.map((preset, idx) => (
                          <button 
                            type="button"
                            key={idx}
                            onClick={() => handlePresetImageChange(preset.url)}
                            className={`text-[10px] border px-2 py-1 rounded transition-all font-semibold ${newImage === preset.url ? "bg-blue-600 border-blue-500 text-white" : "bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300"}`}
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* GPS Coordinates selectors */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1">Latitude</label>
                        <input 
                          type="number" 
                          step="0.0001" 
                          value={newLat || ""}
                          onChange={e => setNewLat(parseFloat(e.target.value))}
                          placeholder="37.7749" 
                          className="w-full bg-slate-50 border border-slate-200 px-3 py-1.5 rounded text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1">Longitude</label>
                        <input 
                          type="number" 
                          step="0.0001" 
                          value={newLng || ""}
                          onChange={e => setNewLng(parseFloat(e.target.value))}
                          placeholder="-122.4194" 
                          className="w-full bg-slate-50 border border-slate-200 px-3 py-1.5 rounded text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                          required
                        />
                      </div>
                    </div>

                    {/* DUPLICATE DETECT RESULTS */}
                    {newTitle.trim() && newLat && newLng && (
                      <div className="bg-blue-55/30 border border-blue-100 p-3 rounded-lg space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-mono font-bold text-purple-750 uppercase tracking-widest flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-purple-600 animate-pulse" />
                            Gemini Proximity Audit
                          </span>
                          <button 
                            type="button" 
                            onClick={handleTriggerDuplicateCheck}
                            className="text-[9px] text-blue-600 hover:underline font-bold"
                            disabled={duplicateCheckLoading}
                          >
                            {duplicateCheckLoading ? "Scanning..." : "Force scan"}
                          </button>
                        </div>
                        {duplicateCheckLoading && (
                          <div className="text-[10px] text-slate-500 font-medium">Scanning adjacent GPS pins for duplicates...</div>
                        )}
                        {duplicateAudit?.checked && (
                          <div className="space-y-1 text-[10px] text-slate-600">
                            <div className="flex justify-between items-center">
                              <span>Match Confidence:</span>
                              <span className={`font-mono font-black ${duplicateAudit.isDuplicate ? "text-red-650" : "text-emerald-700"}`}>
                                {duplicateAudit.similarityScore}% {duplicateAudit.isDuplicate ? "(DUPLICATE ALERT)" : "(UNIQUE)"}
                              </span>
                            </div>
                            <p className="leading-relaxed leading-tight text-slate-600 font-medium">{duplicateAudit.explanation}</p>
                            {duplicateAudit.isDuplicate && duplicateAudit.duplicateIssueId && (
                              <button 
                                type="button"
                                onClick={() => {
                                  const issueMatched = issues.find(i => i.id === duplicateAudit.duplicateIssueId);
                                  if (issueMatched) {
                                    setSelectedIssue(issueMatched);
                                    setIsReporting(false);
                                  }
                                }}
                                className="text-[10px] text-blue-600 font-bold underline mt-1"
                              >
                                View Matching Ticket instead
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    <button 
                      type="submit"
                      disabled={submitLoading || (duplicateAudit?.isDuplicate && duplicateAudit.similarityScore > 80)}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2.5 rounded flex items-center justify-center gap-1 cursor-pointer disabled:opacity-40 shadow-sm"
                    >
                      {submitLoading ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          AI Analyzing Issue & Dispatching...
                        </>
                      ) : "COMPILE & INITIATE AI DISPATCH"}
                    </button>
                  </form>
                </div>
              )}

              {/* SEARCH & FILTERS CONTROLS */}
              <div className="bg-white border border-slate-200 p-4 rounded-xl space-y-4 shadow-sm text-slate-800">
                <div className="relative">
                  <input 
                    type="text" 
                    value={searchText}
                    onChange={e => setSearchText(e.target.value)}
                    placeholder="Search incident logs..." 
                    className="w-full bg-slate-50 border border-slate-200 pl-9 pr-4 py-2 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-blue-500 font-sans"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                </div>

                <div className="grid grid-cols-2 gap-3 text-left">
                  <div>
                    <label className="text-[9px] font-mono uppercase tracking-wider text-slate-500 block mb-1 font-bold">Category</label>
                    <select 
                      value={filterCategory}
                      onChange={e => setFilterCategory(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded text-xs select-dropdown focus:border-blue-500 text-slate-700"
                    >
                      <option value="All">All Categories</option>
                      {Object.values(IssueCategory).map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[9px] font-mono uppercase tracking-wider text-slate-500 block mb-1 font-bold">Severity</label>
                    <select 
                      value={filterSeverity}
                      onChange={e => setFilterSeverity(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded text-xs select-dropdown focus:border-blue-500 text-slate-700"
                    >
                      <option value="All">All Severities</option>
                      {Object.values(IssueSeverity).map(sev => (
                        <option key={sev} value={sev}>{sev}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[9px] font-mono uppercase tracking-wider text-slate-500 block mb-1 font-bold">Resolution Status</label>
                  <select 
                    value={filterStatus}
                    onChange={e => setFilterStatus(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded text-xs select-dropdown focus:border-blue-500 text-slate-700 text-left"
                  >
                    <option value="All">All Statuses</option>
                    {Object.values(IssueStatus).map(stat => (
                      <option key={stat} value={stat}>{stat}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* CARD LISTING GRID */}
              <div className="space-y-3 overflow-y-auto max-h-[55vh]" id="issue-incident-scroll-viewport">
                <div className="flex justify-between items-center text-xs text-slate-500 px-1 font-mono">
                  <span>Incident Log Feed ({filteredIssues.length})</span>
                  <span>Clustered</span>
                </div>

                {filteredIssues.length === 0 ? (
                  <div className="text-center py-12 border border-dashed border-slate-200 bg-white rounded-xl text-xs text-slate-400">
                    No matching hyperlocal issues recorded in this sector.
                  </div>
                ) : (
                  filteredIssues.map(issue => {
                    const isFocus = selectedIssue?.id === issue.id;
                    const cIcon = CATEGORY_ICONS[issue.category] || "⚙️";
                    
                    return (
                      <div 
                        key={issue.id}
                        onClick={() => { setSelectedIssue(issue); setIsReporting(false); }}
                        className={`border rounded-xl p-3.5 text-left cursor-pointer transition-all hover:scale-[1.01] flex items-start gap-3.5 relative ${isFocus ? "bg-blue-50/40 border-blue-400 shadow-md" : "bg-white border-slate-200 hover:border-slate-300 shadow-xs"}`}
                      >
                        <span className="text-2xl mt-0.5">{cIcon}</span>
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded uppercase bg-slate-100 text-slate-600 border border-slate-200">
                              {issue.category}
                            </span>
                            <span className={`text-[9px] font-mono font-bold uppercase ${issue.severity === "Critical" ? "text-red-700 bg-red-50 border border-red-100 rounded px-1.5" : issue.severity === "High" ? "text-orange-700 bg-orange-50 border border-orange-100 rounded px-1.5" : "text-slate-600 bg-slate-50 border border-slate-150 rounded px-1.5"}`}>
                              • {issue.severity} Priority
                            </span>
                          </div>
                          <h4 className="text-xs font-bold text-slate-800 capitalize truncate">{issue.title}</h4>
                          <p className="text-[10px] text-slate-500 font-medium truncate max-w-[280px]">{issue.summary}</p>
                          <div className="flex items-center justify-between text-[9px] font-mono text-slate-500 pt-1 border-t border-slate-100">
                            <span>Status: <strong className="text-slate-600 font-sans">{issue.status}</strong></span>
                            <span>👍 {issue.upvotesCount} • 📝 {issue.verificationsCount}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* RIGHT col-span-8: SAT MAPS / INCIDENT DEEP CONTROL DETAILS VIEW SPLIT */}
            <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-12 gap-6 h-[80vh]">
              
              {/* PRIMARY LEFT PANEL: THE SATELLITE ITERATIVE MAPS */}
              <div className={`h-full ${selectedIssue ? "md:col-span-6" : "md:col-span-12"} transition-all duration-300`}>
                <MapContainer 
                  issues={filteredIssues}
                  selectedIssue={selectedIssue}
                  onSelectIssue={issue => { setSelectedIssue(issue); setIsReporting(false); }}
                  interactive={isReporting}
                  onCoordinatesChange={(lat, lng) => {
                    setNewLat(lat);
                    setNewLng(lng);
                  }}
                  reportCoordinates={isReporting && newLat && newLng ? { lat: newLat, lng: newLng } : null}
                />
              </div>

              {/* SECONDARY RIGHT PANEL: THE INCIDENT DETAILS DRAWER */}
              {selectedIssue && (
                <div className="md:col-span-6 bg-white border border-slate-200 rounded-2xl flex flex-col h-full overflow-hidden shadow-2xl animate-slide-in text-left text-slate-800">
                  
                  {/* Detailed Title */}
                  <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                        <span className="text-[10px] bg-slate-100 border border-slate-200 font-mono text-slate-650 px-1.5 py-0.5 rounded font-bold uppercase">
                          {selectedIssue.category}
                        </span>
                        <span className={`text-[10px] font-mono font-bold uppercase ${selectedIssue.severity === "Critical" ? "text-red-700 bg-rose-50 px-1.5 rounded border border-red-100" : "text-slate-500"}`}>
                          {selectedIssue.severity} Priority
                        </span>
                        <span className="text-[10px] bg-blue-100/60 text-blue-800 px-2.0 py-0.5 rounded border border-blue-200/50">
                          {selectedIssue.status}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 truncate leading-tight capitalize">{selectedIssue.title}</h3>
                      <p className="text-[10px] font-mono text-slate-500 mt-0.5 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        ({selectedIssue.latitude.toFixed(4)}, {selectedIssue.longitude.toFixed(4)}) • Reported by {selectedIssue.reporterName}
                      </p>
                    </div>

                    <button 
                      onClick={() => setSelectedIssue(null)}
                      className="p-1 px-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors"
                      id="close-drawer-btn"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Scroller Contents */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-5">
                    
                    {/* Visual Asset Evidence */}
                    <div className="relative w-full h-32 bg-slate-50 rounded-xl overflow-hidden border border-slate-200 flex items-center justify-center">
                      <img 
                        src={selectedIssue.imageUrl} 
                        alt="Infrastructure Failure Evidence"
                        className="w-full h-full object-cover opacity-80"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-900/40 to-transparent p-3 flex justify-between items-end text-[10px]">
                        <span className="text-white bg-slate-900/40 py-0.5 px-2 rounded font-mono">Camera Snap 01</span>
                        <span className="text-blue-100 bg-blue-900/40 py-0.5 px-2 rounded font-mono font-bold text-[9px]">Verified Location Accurate</span>
                      </div>
                    </div>

                    {/* AI Summary and Explanation */}
                    <div className="bg-blue-50/40 p-4 border border-blue-100 rounded-xl space-y-3 relative shadow-xs">
                      <div className="flex items-center justify-between">
                        <h4 className="text-[10px] font-mono uppercase text-blue-800 tracking-wider flex items-center gap-1 font-bold">
                          <Sparkles className="w-3 text-blue-600 animate-pulse" />
                          City Dispatch AI analysis
                        </h4>
                        <span className="text-[9px] bg-blue-100 text-blue-700 font-mono px-2 py-0.2 rounded border border-blue-200">Gemini Active</span>
                      </div>
                      <div className="space-y-1 text-xs">
                        <div className="font-bold text-slate-800">Executive Summary:</div>
                        <p className="text-slate-700 leading-relaxed italic font-medium">"{selectedIssue.summary}"</p>
                      </div>
                      {selectedIssue.aiExplanation && (
                        <div className="text-[10px] text-slate-600 leading-relaxed border-t border-slate-100 pt-2.5 font-medium">
                          <strong>Analytical Justification:</strong> {selectedIssue.aiExplanation}
                        </div>
                      )}
                      
                      {selectedIssue.assignedDepartment && (
                        <div className="flex justify-between items-center text-[10px] pt-2 border-t border-slate-100 font-mono">
                          <span className="text-slate-500">Assigned City Department:</span>
                          <span className="text-slate-700 font-sans font-bold">{selectedIssue.assignedDepartment}</span>
                        </div>
                      )}
                    </div>

                    {/* Standard Narrative descriptions */}
                    <div className="space-y-1 text-slate-850">
                      <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block font-bold">Citizen Description</span>
                      <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line bg-slate-50 rounded-lg p-3 border border-slate-100">
                        {selectedIssue.description}
                      </p>
                    </div>

                    {/* TIMELINE TRANSACTION LOG */}
                    <div className="space-y-3">
                      <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block font-bold">Incident Lifecycle Timeline</span>
                      <div className="space-y-4 border-l border-slate-200 ml-2 pl-4">
                        {timeline.length === 0 ? (
                          <div className="text-xs text-slate-400 italic">No timeline entries synced.</div>
                        ) : (
                          timeline.map(item => (
                            <div key={item.id} className="relative text-xs space-y-1">
                              <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-blue-600 border-2 border-white"></span>
                              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                                <span>{new Date(item.createdAt).toLocaleDateString()} {new Date(item.createdAt).toLocaleTimeString([], {hour: "numeric", minute:"numeric"})}</span>
                                <span className="uppercase text-[9px] font-bold text-blue-600">{item.updatedBy}</span>
                              </div>
                              <h4 className="font-extrabold text-slate-700">{item.title}</h4>
                              <p className="text-[10px] text-slate-500 leading-relaxed font-medium">{item.description}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* VERIFICATION ACTIONS ROW FOR LOGGED CIVIC PLAYERS */}
                    {token && currentUser && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider font-bold">Engagement & verify</span>
                          <span className="text-[9px] bg-blue-50 text-blue-700 font-mono px-2 py-0.5 rounded border border-blue-100 font-semibold">Get up to +20 points</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => handleUpvote(selectedIssue.id)}
                            className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all flex items-center justify-center gap-1 cursor-pointer ${
                              selectedIssue.upvotedBy.includes(currentUser.id)
                                ? "bg-blue-600 border-blue-500 text-white font-extrabold shadow-sm"
                                : "bg-white border-slate-200 hover:border-slate-300 text-slate-700 font-semibold shadow-xs"
                            }`}
                          >
                            🚀 {selectedIssue.upvotedBy.includes(currentUser.id) ? "Hyper voted" : "Upvote Hazard"} ({selectedIssue.upvotesCount})
                          </button>
                          
                          <button 
                            disabled={selectedIssue.verifiedBy.includes(currentUser.id)}
                            onClick={() => setIsVerifying(!isVerifying)}
                            className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all flex items-center justify-center gap-1 cursor-pointer ${
                              selectedIssue.verifiedBy.includes(currentUser.id)
                                ? "bg-emerald-50 border-emerald-200 text-emerald-800 font-bold"
                                : "bg-white border-slate-200 hover:border-slate-300 text-slate-700 font-semibold shadow-xs"
                            }`}
                          >
                            🛡️ {selectedIssue.verifiedBy.includes(currentUser.id) ? "You Verified" : "Verify Incidence"} ({selectedIssue.verificationsCount})
                          </button>
                        </div>

                        {/* Dropdown verification form */}
                        {isVerifying && (
                          <form onSubmit={handleVerify} className="bg-blue-50/50 p-3 rounded-lg border border-blue-100 space-y-2.5 text-left animation-fade-in">
                            <span className="text-[9px] font-mono text-blue-800 uppercase tracking-widest block font-bold">Resident Site Inspection Report</span>
                            <input 
                              type="text"
                              value={verificationNotes}
                              onChange={e => setVerificationNotes(e.target.value)}
                              placeholder="Provide current state: e.g., Confirmed still bubbling across lane."
                              className="w-full bg-white border border-slate-200 px-3 py-1.5 rounded text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                              required
                            />
                            <div className="flex justify-end gap-2 text-[10px]">
                              <button type="button" onClick={() => setIsVerifying(false)} className="text-slate-500 hover:text-slate-700 font-semibold">Cancel</button>
                              <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1.5 rounded cursor-pointer">Submit Verification (+20 XP)</button>
                            </div>
                          </form>
                        )}
                      </div>
                    )}

                    {/* EXCLUSIVE ADMIN CONTROLS ROW */}
                    {token && currentUser?.role === "admin" && (
                      <div className="border-t border-slate-150 pt-4 space-y-3">
                        <div className="flex items-center gap-1.5">
                          <Lock className="w-3.5 h-3.5 text-rose-600" />
                          <h4 className="text-[10px] font-mono uppercase text-rose-750 tracking-wider font-extrabold">City Dispatch Supervisor actions</h4>
                        </div>

                        <form onSubmit={handleAdminUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="text-[9px] font-mono uppercase tracking-wider text-slate-500 block mb-1 font-bold">Update Status</label>
                            <select 
                              value={adminStatusUpdate || selectedIssue.status}
                              onChange={e => setAdminStatusUpdate(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded text-xs select-dropdown focus:border-rose-500 text-slate-700"
                            >
                              {Object.values(IssueStatus).map(stat => (
                                <option key={stat} value={stat}>{stat}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="text-[9px] font-mono uppercase tracking-wider text-slate-500 block mb-1 font-bold">Target Department</label>
                            <input 
                              type="text" 
                              value={adminDeptUpdate || selectedIssue.assignedDepartment || ""}
                              onChange={e => setAdminDeptUpdate(e.target.value)}
                              placeholder="e.g. Dept of Transportation"
                              className="w-full bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded text-xs focus:outline-none focus:border-rose-500 text-slate-700 font-medium"
                            />
                          </div>
                          
                          <button 
                            type="submit"
                            disabled={adminSaving}
                            className="bg-rose-650 hover:bg-rose-700 text-white font-bold py-2 rounded text-xs uppercase tracking-wider md:col-span-2 cursor-pointer transition-colors shadow-sm"
                          >
                            {adminSaving ? "Updating logs..." : "Apply Admin Directive"}
                          </button>
                        </form>
                      </div>
                    )}

                    {/* DISCUSSION BOARDS (Resident Comments) */}
                    <div className="space-y-4 pt-3 border-t border-slate-100">
                      <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block font-bold">Resident Discussion Boards</span>
                      
                      {comments.length === 0 ? (
                        <div className="text-xs text-slate-400 italic py-2 text-center">No resident discussions on this incident log yet.</div>
                      ) : (
                        <div className="space-y-3">
                          {comments.map(c => (
                            <div key={c.id} className="bg-slate-50 border border-slate-100 p-3 rounded-xl text-xs space-y-1">
                              <div className="flex justify-between items-center text-[10px] font-mono text-slate-500">
                                <div className="flex items-center gap-1">
                                  <span className={`w-1.5 h-1.5 rounded-full ${c.userRole === "admin" ? "bg-rose-500" : c.userRole === "ai" ? "bg-purple-600 animate-pulse" : "bg-slate-400"}`}></span>
                                  <span className="font-bold text-slate-800">{c.userName}</span>
                                  <span className={`text-[8px] px-1 py-0.2 rounded font-sans uppercase font-bold ${c.userRole === "admin" ? "bg-rose-100 text-rose-800" : c.userRole === "ai" ? "bg-purple-100 text-purple-800" : "bg-slate-200 text-slate-600"}`}>{c.userRole}</span>
                                </div>
                                <span>{new Date(c.createdAt).toLocaleDateString()}</span>
                              </div>
                              <p className="text-slate-700 leading-relaxed font-sans">{c.text}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Comment inputs */}
                      {token && currentUser && (
                        <form onSubmit={handlePostComment} className="flex gap-2">
                          <input 
                            type="text" 
                            value={newCommentText}
                            onChange={e => setNewCommentText(e.target.value)}
                            placeholder="Add to the local discussion..." 
                            className="flex-1 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                            required
                          />
                          <button type="submit" className="bg-blue-600 hover:bg-blue-700 border border-blue-500 text-white font-bold px-4 py-1.5 rounded-lg text-xs cursor-pointer transition-colors shadow-xs">
                            Post
                          </button>
                        </form>
                      )}
                    </div>

                  </div>
                </div>
              )}

            </div>

          </div>
        )}

        {activeTab === "analytics" && (
          <AnalyticsPanel 
            analytics={analytics}
            predictive={predictive}
            onSelectMapCoordinates={handleSelectHotspotCoords}
          />
        )}

        {activeTab === "leaderboard" && (
          <Leaderboard 
            users={allUsers}
            currentUser={currentUser}
          />
        )}

        {token && activeTab === "assistant" && (
          <AICivicAssistant 
            token={token}
            currentUser={currentUser}
            isFloatingOpen={isFloatingOpen}
            setIsFloatingOpen={setIsFloatingOpen}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />
        )}

        {!token && activeTab === "assistant" && (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8 text-center max-w-2xl mx-auto space-y-6 my-8 font-sans" id="assistant-unauthorized-notice">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto border border-blue-100 shadow-sm">
              <Sparkles className="w-8 h-8 animate-pulse text-amber-500" />
            </div>
            <div className="space-y-3">
              <h3 className="text-lg font-black text-slate-850 uppercase tracking-wide">Connect to AI Civic Coordinator</h3>
              <p className="text-xs text-slate-500 leading-relaxed max-w-md mx-auto font-medium">
                Authorized citizen authentication is required to access the real-time AI Civic Coordinator terminal. Once connected, you can review persistent chat history logs, ask about repair schedule details, upvote duplicate Sweeps, and trigger municipal RAG insights!
              </p>
            </div>
            
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 max-w-sm mx-auto space-y-3">
              <div className="text-xs font-bold text-slate-700 uppercase tracking-widest border-b border-slate-200 pb-1.5 flex items-center justify-center gap-1.5 font-mono">
                <Lock className="w-3.5 h-3.5 text-blue-500" />
                Pre-seeded Citizen Login
              </div>
              <div className="space-y-2 text-left font-sans text-xs">
                <div className="flex justify-between items-center bg-white p-2.5 rounded-lg border border-slate-150 shadow-3xs">
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-mono text-slate-400 block uppercase font-bold">Email Address</span>
                    <span className="font-semibold text-slate-800">jane@community.org</span>
                  </div>
                  <button 
                    onClick={() => {
                      const emailInput = document.getElementById("auth-email") as HTMLInputElement || document.querySelector('input[type="email"]') as HTMLInputElement;
                      const pwdInput = document.getElementById("auth-password") as HTMLInputElement || document.querySelector('input[type="password"]') as HTMLInputElement;
                      if (emailInput && pwdInput) {
                        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
                        nativeInputValueSetter?.call(emailInput, "jane@community.org");
                        emailInput.dispatchEvent(new Event('input', { bubbles: true }));
                        nativeInputValueSetter?.call(pwdInput, "jane123");
                        pwdInput.dispatchEvent(new Event('input', { bubbles: true }));
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      } else {
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }
                    }}
                    className="p-1.5 px-2 bg-blue-100/80 hover:bg-blue-600 text-blue-700 hover:text-white rounded-md text-[10px] font-bold tracking-tight transition-all cursor-pointer shadow-3xs"
                  >
                    Auto-Fill Credentials
                  </button>
                </div>
                <div className="flex justify-between items-center bg-white p-2.5 rounded-lg border border-slate-150 shadow-3xs">
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-mono text-slate-400 block uppercase font-bold">Default Password</span>
                    <span className="font-mono font-semibold text-slate-800">jane123</span>
                  </div>
                  <span className="text-[9px] font-mono text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 font-extrabold uppercase">Verified</span>
                </div>
              </div>
            </div>

            <p className="text-[10px] text-slate-400 font-mono">
              Please use the login form located at the top banner of the page to connect.
            </p>
          </div>
        )}

      </main>

      {token && activeTab !== "assistant" && (
        <AICivicAssistant 
          token={token}
          currentUser={currentUser}
          isFloatingOpen={isFloatingOpen}
          setIsFloatingOpen={setIsFloatingOpen}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
      )}

      {/* FOOTER METRICS AND TECH LABELS */}
      <footer className="footer bg-white border-t border-slate-200 py-8 px-6 text-center space-y-2 mt-12 z-[1000] relative shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center text-[11px] text-slate-500 font-mono gap-4">
          <div>
            Built with 💻 <strong className="text-blue-600 font-black">Google Gemini</strong> API, Express, React, and Leaflet Maps.
          </div>
          <div className="flex gap-4">
            <span className="text-slate-400 font-medium">Node JS Sandbox Environment</span>
            <span className="text-emerald-600 font-extrabold">• All systems operational</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
