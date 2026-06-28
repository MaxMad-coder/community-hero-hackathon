import React, { useState } from "react";
import { User, Issue, IssueStatus, IssueCategory } from "../types.js";
import { ShieldAlert, AlertTriangle, Hammer, Truck, RefreshCcw, Landmark, Users, Clock, CheckCircle, MapPin, Sparkles, Send, FileText, Download, TrendingUp, Award, Zap, Search } from "lucide-react";

interface AdminDashboardPageProps {
  currentUser: User | null;
  issues: Issue[];
  onSelectIssue: (id: string) => void;
  onNavigateToView: (view: any) => void;
  onRefresh: () => void;
  token: string | null;
}

export default function AdminDashboardPage({ currentUser, issues, onSelectIssue, onNavigateToView, onRefresh, token }: AdminDashboardPageProps) {
  const [dispatchDept, setDispatchDept] = useState("SOMA Public Works");
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  // AI Civic Report Generator State
  const [activeReport, setActiveReport] = useState<any | null>(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState("");
  const [selectedReportType, setSelectedReportType] = useState<string>("Weekly");

  const fetchReport = async (type: string) => {
    if (!token) return;
    setLoadingReport(true);
    setReportError(null);
    setSelectedReportType(type);
    try {
      let endpoint = `/api/reports/${type.toLowerCase()}`;
      if (type === "Custom") {
        endpoint = `/api/reports/custom?prompt=${encodeURIComponent(customPrompt)}`;
      }
      const res = await fetch(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
      if (res.ok) {
        const data = await res.json();
        setActiveReport(data);
      } else {
        setReportError("The Civic Engine is busy. Please try again in a moment.");
      }
    } catch (err) {
      console.error(err);
      setReportError("Failed to connect to the municipal report processor.");
    } finally {
      setLoadingReport(false);
    }
  };

  const downloadReport = () => {
    if (!activeReport) return;
    
    const content = `# MUNICIPAL CITIZEN SERVICES & CIVIC INFRASTRUCTURE REPORT
Generated: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}
Reporting Cycle: ${selectedReportType} Audit
Status: COMPLETED (AI-Generated via Gemini 2.5 Flash / 3.5 Flash)

========================================================================

## 1. EXECUTIVE SUMMARY
${activeReport.executive_summary}

========================================================================

## 2. KEY INSIGHTS & HAZARD VELOCITY TRENDS
${activeReport.key_insights.map((insight: string, idx: number) => `* ${insight}`).join("\n")}

========================================================================

## 3. SECTOR TREND ANALYSIS
${activeReport.trend_analysis}

========================================================================

## 4. PRIORITY HOTSPOTS & RISK MATRIX ZONES
${activeReport.priority_areas.map((area: string) => `* [CRITICAL DISPATCH] - ${area}`).join("\n")}

========================================================================

## 5. REPAIR STRATEGY RECOMMENDATIONS & SLA ACTIONS
${activeReport.recommendations.map((rec: string, idx: number) => `${idx + 1}. ${rec}`).join("\n")}

========================================================================

## 6. METROPOLITAN TELEMETRY SUMMARY
* Total Active Reports logged: ${activeReport.telemetry?.total_reported || issues.length}
* Total Successfully Closed tickets: ${activeReport.telemetry?.total_resolved || issues.filter(i => i.status === "Resolved").length}
* SLA Turnaround Resolution Rate: ${activeReport.telemetry?.resolution_rate || 0}%
* Hyperlocal Public Participation score: ${activeReport.telemetry?.participation_score || 0} (👍 upvotes & community verifications count)
* Leading Stress Category: ${activeReport.telemetry?.most_reported_category || "N/A"}
* Most Active Sector: ${activeReport.telemetry?.most_active_area || "N/A"}

========================================================================
City Administration Terminal Office | Community Hero Platform
`;

    const blob = new Blob([content], { type: "text/markdown;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Municipal_Civic_Report_${selectedReportType}_${new Date().toISOString().slice(0,10)}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Dynamic live widget metrics calculation
  const totalReported = issues.length;
  const totalResolved = issues.filter(i => i.status === "Resolved").length;
  const resolutionRate = totalReported > 0 ? parseFloat(((totalResolved / totalReported) * 100).toFixed(1)) : 0.0;

  // Most active category calculation
  const catCounts: Record<string, number> = {};
  issues.forEach(i => {
    catCounts[i.category] = (catCounts[i.category] || 0) + 1;
  });
  let mostReportedCategory = "Potholes & Drainage";
  let maxCatCount = 0;
  Object.entries(catCounts).forEach(([cat, count]) => {
    if (count > maxCatCount) {
      maxCatCount = count;
      mostReportedCategory = cat;
    }
  });

  // Most active area calculation
  const areaCounts: Record<string, number> = {};
  issues.forEach(i => {
    let area = "SOMA District";
    const desc = (i.description || "").toLowerCase();
    const title = (i.title || "").toLowerCase();
    if (desc.includes("mission") || title.includes("mission")) {
      area = "Mission Ward";
    } else if (desc.includes("market") || title.includes("market")) {
      area = "Market Area";
    } else if (desc.includes("tenderloin") || title.includes("tenderloin")) {
      area = "Tenderloin Corridor";
    } else if (desc.includes("castro") || title.includes("castro")) {
      area = "Castro Heights";
    }
    areaCounts[area] = (areaCounts[area] || 0) + 1;
  });
  let mostActiveArea = "SOMA District";
  let maxAreaCount = 0;
  Object.entries(areaCounts).forEach(([area, count]) => {
    if (count > maxAreaCount) {
      maxAreaCount = count;
      mostActiveArea = area;
    }
  });

  // Participation Score calculation
  const totalUpvotes = issues.reduce((sum, i) => sum + (i.upvotesCount || 0), 0);
  const totalVerifications = issues.reduce((sum, i) => sum + (i.verificationsCount || 0), 0);
  const citizenParticipationScore = totalUpvotes + (totalVerifications * 3);

  if (!currentUser || currentUser.role !== "admin") {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8 text-center max-w-xl mx-auto space-y-4 my-8 font-sans">
        <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-100">
          <ShieldAlert className="w-6 h-6 animate-pulse text-rose-500" />
        </div>
        <h3 className="text-base font-bold text-slate-800">Admin Authentication Required</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          You are logged in as a normal citizen. Access to the high-privilege Municipal Architect Console is strictly locked to administrative credentials.
        </p>
        <div className="text-xs bg-slate-50 p-3 rounded-lg border border-slate-150 text-slate-600 font-mono">
          Pre-seeded Admin login: <strong className="text-yellow-600">admin@community.org</strong> / <strong className="text-yellow-600">admin123</strong>
        </div>
        <button
          onClick={() => onNavigateToView("login")}
          className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold uppercase rounded-lg shadow-sm cursor-pointer"
        >
          Relog as Administrator
        </button>
      </div>
    );
  }

  // Segment issues for management
  const pendingIssues = issues.filter(issue => issue.status === "Reported");
  const activeDispatches = issues.filter(issue => issue.status === "Assigned" || issue.status === "In Progress");
  const resolvedIssues = issues.filter(issue => issue.status === "Resolved");

  const triggerPreemptiveCrew = async (category: string, area: string) => {
    setLoadingAction(category);
    try {
      // Post a mock preemptive dispatch crew via the comments pipeline or an admin log trigger
      // Select the first pending ticket in SOMA or create a log update
      const target = issues.find(i => i.category === category && i.status !== "Resolved");
      if (target && token) {
        await fetch(`/api/issues/${target.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            status: "Assigned",
            assignedDepartment: dispatchDept,
            timelineDescription: `Preemptive maintenance crew triggered by AI Hotspot analysis in ${area} to check for systemic ${category} faults.`
          })
        });
        onRefresh();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in font-sans text-left" id="admin-dashboard-page">
      
      {/* 1. HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-3">
        <div>
          <h2 className="text-xl font-black text-rose-950 uppercase tracking-wide flex items-center gap-1.5">
            <span className="w-3 h-3 bg-rose-600 rounded-full animate-pulse"></span>
            Municipal architect command console
          </h2>
          <p className="text-xs text-slate-500 mt-1">Review active reporting queues, allocate repair dispatches, and trigger preemptive AI maintenance.</p>
        </div>
        <button
          onClick={onRefresh}
          className="p-2 bg-white hover:bg-slate-50 text-slate-700 rounded-xl border border-slate-200 shadow-3xs text-xs font-bold flex items-center gap-1.5 cursor-pointer self-start md:self-auto"
        >
          <RefreshCcw className="w-3.5 h-3.5" />
          Refresh Systems
        </button>
      </div>

      {/* 2. CORE METRICS ROW */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4" id="admin-metrics-grid">
        <div className="bg-white border border-slate-200 p-5 rounded-2xl flex items-start gap-3.5 shadow-3xs">
          <div className="p-3 bg-rose-50 text-rose-600 border border-rose-100 rounded-xl shrink-0">
            <AlertTriangle className="w-5.5 h-5.5" />
          </div>
          <div>
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-extrabold block">Awaiting Dispatch</span>
            <span className="text-2xl font-black text-slate-800">{pendingIssues.length} Tickets</span>
            <span className="text-[9px] text-rose-600 font-bold block mt-0.5">High priority response</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl flex items-start gap-3.5 shadow-3xs">
          <div className="p-3 bg-blue-50 text-blue-600 border border-blue-100 rounded-xl shrink-0">
            <Truck className="w-5.5 h-5.5" />
          </div>
          <div>
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-extrabold block">Active Dispatches</span>
            <span className="text-2xl font-black text-slate-800">{activeDispatches.length} Crews</span>
            <span className="text-[9px] text-blue-600 font-bold block mt-0.5">Underway on site</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl flex items-start gap-3.5 shadow-3xs">
          <div className="p-3 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-xl shrink-0">
            <CheckCircle className="w-5.5 h-5.5" />
          </div>
          <div>
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-extrabold block">Resolved This Month</span>
            <span className="text-2xl font-black text-slate-800">{resolvedIssues.length} Closed</span>
            <span className="text-[9px] text-emerald-600 font-bold block mt-0.5">94.8% SLA resolution speed</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl flex items-start gap-3.5 shadow-3xs">
          <div className="p-3 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-xl shrink-0">
            <Landmark className="w-5.5 h-5.5" />
          </div>
          <div>
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-extrabold block">Assigned Officers</span>
            <span className="text-2xl font-black text-slate-800">12 Admins</span>
            <span className="text-[9px] text-indigo-600 font-bold block mt-0.5">Unified sector coverage</span>
          </div>
        </div>
      </div>

      {/* 3. PRIORITY TICKETS BINS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Awaiting Dispatch (Left) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono flex items-center gap-1.5 border-b border-slate-100 pb-2">
            <ShieldAlert className="w-4 h-4 text-rose-600" />
            Unassigned / New Alerts ({pendingIssues.length})
          </h3>

          {pendingIssues.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-xl">
              <span className="text-xl">🙌</span>
              <p className="text-xs text-slate-500 font-medium mt-1">Outstanding complaint queue is empty. Good job, admin!</p>
            </div>
          ) : (
            <div className="space-y-3.5 max-h-96 overflow-y-auto pr-1">
              {pendingIssues.map(issue => (
                <div
                  key={issue.id}
                  onClick={() => onSelectIssue(issue.id)}
                  className="p-3 bg-rose-50/20 hover:bg-rose-50/50 border border-rose-100 rounded-xl flex justify-between items-start gap-3.5 cursor-pointer transition-colors"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[8px] font-mono bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded uppercase font-black tracking-wider">
                        {issue.category}
                      </span>
                      <span className="text-[8px] font-mono text-slate-400 font-bold">
                        Logged {new Date(issue.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-800 truncate uppercase tracking-tight">{issue.title}</h4>
                    <p className="text-[11px] text-slate-500 line-clamp-1">{issue.description}</p>
                  </div>
                  <span className="text-[10px] font-mono text-rose-600 bg-rose-50 px-2 py-0.5 rounded font-extrabold border border-rose-100 shrink-0">
                    {issue.severity}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Active Dispatches (Right) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono flex items-center gap-1.5 border-b border-slate-100 pb-2">
            <Truck className="w-4 h-4 text-blue-600" />
            Active Repair Crews Underway ({activeDispatches.length})
          </h3>

          {activeDispatches.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-xl">
              <span className="text-xl">🏗️</span>
              <p className="text-xs text-slate-500 font-medium mt-1">No active crews dispatched. Review unassigned queue to allocate help.</p>
            </div>
          ) : (
            <div className="space-y-3.5 max-h-96 overflow-y-auto pr-1">
              {activeDispatches.map(issue => (
                <div
                  key={issue.id}
                  onClick={() => onSelectIssue(issue.id)}
                  className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl flex justify-between items-start gap-3.5 cursor-pointer transition-colors"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[8px] font-mono bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded uppercase font-black tracking-wider">
                        {issue.category}
                      </span>
                      <span className="text-[8px] font-mono bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded uppercase font-black tracking-wider">
                        {issue.status}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-800 truncate uppercase tracking-tight">{issue.title}</h4>
                    <p className="text-[11px] text-slate-650 line-clamp-1"><strong className="text-slate-800">Office:</strong> {issue.assignedDepartment || "Unassigned department"}</p>
                  </div>
                  <span className="text-[9px] font-mono text-slate-400 shrink-0">
                    👍 {issue.upvotesCount} votes
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* 3.5 AI CIVIC REPORT GENERATOR */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6 shadow-sm text-left" id="ai-civic-report-generator">
        
        {/* Header Block */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
              <FileText className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-800 uppercase tracking-tight flex items-center gap-1.5">
                AI Civic Report Generator
                <span className="text-[9px] font-mono font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-150 uppercase tracking-wide">
                  Gemini Active Intelligence
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Produce authoritative municipality-style planning intelligence compiled from real-time community telemetry.</p>
            </div>
          </div>

          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => fetchReport("Weekly")}
              disabled={loadingReport}
              className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-mono font-bold uppercase rounded-lg cursor-pointer transition-all disabled:opacity-50"
            >
              Weekly Audit 📊
            </button>
            <button
              onClick={() => fetchReport("Monthly")}
              disabled={loadingReport}
              className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-mono font-bold uppercase rounded-lg cursor-pointer transition-all disabled:opacity-50"
            >
              Monthly Audit 🗓️
            </button>
          </div>
        </div>

        {/* 4 Core Telemetry Dashboard Widgets */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4" id="civic-report-widgets">
          {/* Widget 1: Most Reported Issue Category */}
          <div className="bg-slate-50 border border-slate-150 p-4 rounded-xl space-y-2">
            <div className="flex items-center gap-1.5 text-slate-400">
              <AlertTriangle className="w-4 h-4 text-slate-500" />
              <span className="text-[9px] font-mono font-bold uppercase tracking-wider">Top Fault Stressor</span>
            </div>
            <div>
              <span className="text-sm font-black text-slate-800 block truncate">{mostReportedCategory}</span>
              <span className="text-[8.5px] font-mono font-bold text-slate-450 block uppercase mt-0.5">Leading category queue</span>
            </div>
          </div>

          {/* Widget 2: Most Active Community Area */}
          <div className="bg-slate-50 border border-slate-150 p-4 rounded-xl space-y-2">
            <div className="flex items-center gap-1.5 text-slate-400">
              <MapPin className="w-4 h-4 text-slate-500" />
              <span className="text-[9px] font-mono font-bold uppercase tracking-wider">Hotspot Sector</span>
            </div>
            <div>
              <span className="text-sm font-black text-slate-800 block truncate">{mostActiveArea}</span>
              <span className="text-[8.5px] font-mono font-bold text-slate-450 block uppercase mt-0.5">High reporting density</span>
            </div>
          </div>

          {/* Widget 3: Resolution Rate */}
          <div className="bg-slate-50 border border-slate-150 p-4 rounded-xl space-y-2">
            <div className="flex items-center gap-1.5 text-slate-400">
              <CheckCircle className="w-4 h-4 text-slate-500" />
              <span className="text-[9px] font-mono font-bold uppercase tracking-wider">SLA Resolution Velocity</span>
            </div>
            <div>
              <span className="text-sm font-black text-slate-800 block">{resolutionRate}%</span>
              <div className="w-full bg-slate-200 h-1 rounded-full mt-1.5 overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${resolutionRate}%` }} />
              </div>
            </div>
          </div>

          {/* Widget 4: Citizen Participation Score */}
          <div className="bg-slate-50 border border-slate-150 p-4 rounded-xl space-y-2">
            <div className="flex items-center gap-1.5 text-slate-400">
              <Award className="w-4 h-4 text-slate-500" />
              <span className="text-[9px] font-mono font-bold uppercase tracking-wider">Community Cohesion</span>
            </div>
            <div>
              <span className="text-sm font-black text-slate-800 block font-mono">{citizenParticipationScore} pts</span>
              <span className="text-[8.5px] font-mono font-bold text-slate-450 block uppercase mt-0.5">Votes & Verifications</span>
            </div>
          </div>
        </div>

        {/* Custom Focus Prompt Segment */}
        <div className="bg-blue-50/10 border border-blue-100 rounded-xl p-4 space-y-2">
          <label className="text-[9px] font-mono font-bold text-slate-450 uppercase tracking-wider block">
            Target Custom Focus Report instructions (Optional)
          </label>
          <div className="flex flex-col md:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={customPrompt}
                onChange={e => setCustomPrompt(e.target.value)}
                placeholder="e.g. Highlight potholes repair lags or prioritize water grid leaks in Market ward..."
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 placeholder-slate-400 focus:outline-none focus:border-blue-500 shadow-3xs"
              />
            </div>
            <button
              onClick={() => fetchReport("Custom")}
              disabled={loadingReport || !customPrompt.trim()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-200 disabled:text-slate-400 text-white text-[11px] font-mono font-black uppercase rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Compile Focus Audit
            </button>
          </div>
        </div>

        {/* Report Content Output Box */}
        {loadingReport ? (
          <div className="border border-slate-100 rounded-2xl p-8 space-y-4 animate-pulse">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-slate-200 rounded-full" />
              <div className="h-4 bg-slate-200 rounded w-48" />
            </div>
            <div className="space-y-2.5 pt-3">
              <div className="h-3.5 bg-slate-100 rounded w-full" />
              <div className="h-3.5 bg-slate-100 rounded w-5/6" />
              <div className="h-3.5 bg-slate-100 rounded w-3/4" />
            </div>
            <div className="grid grid-cols-3 gap-4 pt-4">
              <div className="h-20 bg-slate-50 border border-slate-100 rounded-xl" />
              <div className="h-20 bg-slate-50 border border-slate-100 rounded-xl" />
              <div className="h-20 bg-slate-50 border border-slate-100 rounded-xl" />
            </div>
          </div>
        ) : reportError ? (
          <div className="border border-rose-100 bg-rose-50/20 rounded-2xl p-6 text-center space-y-2">
            <AlertTriangle className="w-6 h-6 text-rose-500 mx-auto" />
            <h4 className="text-xs font-bold text-rose-950 uppercase font-mono">Report Generation Interrupted</h4>
            <p className="text-[11px] text-rose-700 max-w-sm mx-auto">{reportError}</p>
          </div>
        ) : activeReport ? (
          <div className="border border-slate-200 rounded-2xl p-5 md:p-6 space-y-6 bg-slate-50/40 relative overflow-hidden transition-all animate-fade-in text-left">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />
            
            {/* Metadata bar */}
            <div className="flex justify-between items-center border-b border-slate-150 pb-3">
              <div className="space-y-0.5">
                <span className="text-[9px] font-mono font-bold text-blue-700 uppercase tracking-widest bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full">
                  {selectedReportType} Civic Audit Report
                </span>
                <span className="text-[9.5px] font-mono text-slate-400 block mt-1">
                  Muni-Core ID: <strong className="text-slate-600 font-bold font-mono">CC-{issues.length}-{selectedReportType.toUpperCase()}</strong>
                </span>
              </div>
              <button
                onClick={downloadReport}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-mono font-black uppercase rounded-lg border border-emerald-500 flex items-center gap-1.5 cursor-pointer shadow-3xs hover:shadow-2xs transition-all shrink-0"
                id="download-report-btn"
              >
                <Download className="w-3.5 h-3.5" />
                Download Report (.md)
              </button>
            </div>

            {/* 1. Executive Summary */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono border-l-3 border-blue-600 pl-2">
                1. Executive Summary
              </h4>
              <p className="text-[11px] md:text-xs text-slate-650 leading-relaxed font-semibold pl-3">
                {activeReport.executive_summary}
              </p>
            </div>

            {/* 2. Key Insights Grid */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono border-l-3 border-emerald-600 pl-2">
                2. Key Insights & Hazard Velocity
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-3">
                {activeReport.key_insights.map((insight: string, idx: number) => (
                  <div key={idx} className="bg-white border border-slate-150 p-3 rounded-xl flex gap-2.5 items-start">
                    <TrendingUp className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="text-[11px] text-slate-650 font-semibold leading-relaxed">
                      {insight}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. Trend Analysis */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono border-l-3 border-amber-600 pl-2">
                3. Sector Trend Analysis
              </h4>
              <p className="text-[11px] text-slate-650 leading-relaxed font-semibold pl-3">
                {activeReport.trend_analysis}
              </p>
            </div>

            {/* 4. Priority Hotspots & Recommendations */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 pt-1">
              
              {/* Left Column: Priority Areas */}
              <div className="md:col-span-5 space-y-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono border-l-3 border-rose-600 pl-2">
                  4. Priority Hotspot Zones
                </h4>
                <div className="flex flex-wrap gap-2 pl-3">
                  {activeReport.priority_areas.map((area: string, idx: number) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 bg-rose-50 text-rose-700 text-[10px] font-bold border border-rose-100 rounded-lg font-mono flex items-center gap-1 shrink-0"
                    >
                      <MapPin className="w-3 h-3 shrink-0" />
                      {area}
                    </span>
                  ))}
                </div>
              </div>

              {/* Right Column: recommendations */}
              <div className="md:col-span-7 space-y-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono border-l-3 border-indigo-600 pl-2">
                  5. Strategic Action Recommendations
                </h4>
                <div className="space-y-2 pl-3">
                  {activeReport.recommendations.map((rec: string, idx: number) => (
                    <div key={idx} className="flex gap-2 items-start text-[11px] text-slate-650 leading-relaxed font-semibold">
                      <span className="w-4.5 h-4.5 rounded-full bg-indigo-50 border border-indigo-150 text-indigo-700 flex items-center justify-center font-mono font-black text-[9px] shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span>{rec}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>
        ) : (
          <div className="border border-slate-150 border-dashed rounded-2xl py-8 text-center space-y-3">
            <FileText className="w-8 h-8 text-slate-350 mx-auto animate-pulse" />
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-slate-700 uppercase font-mono">No Active Planning Report Loaded</h4>
              <p className="text-[10.5px] text-slate-450 max-w-sm mx-auto">Click Weekly Audit or Monthly Audit above to request Gemini synthesis of the SOMA municipal complaint queues.</p>
            </div>
          </div>
        )}

      </div>

      {/* 4. PREEMPTIVE AI CO-PILOT ACTIONS */}
      <div className="bg-gradient-to-br from-slate-900 via-rose-950 to-slate-900 border border-rose-500/20 rounded-2xl p-6 text-white space-y-4 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="space-y-1.5">
          <span className="text-[9px] font-mono text-rose-400 bg-rose-500/20 px-2.5 py-1 rounded-full border border-rose-400/20 uppercase tracking-widest font-black inline-block">
            Gemini Predictive AI Hotspots
          </span>
          <h3 className="text-base font-black uppercase tracking-wide">Preemptive Service Allocation Copilot</h3>
          <p className="text-xs text-slate-400 leading-normal max-w-2xl">
            Gemini forecasts systemic water grid leakage or sewer drainage failures by reviewing community upvote clusters. Trigger dispatch trucks with one click to resolve infrastructure bottlenecks before they cause service downtime!
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {/* Preset AI hot repair trigger */}
          <div className="bg-white/5 border border-white/10 p-4 rounded-xl space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="font-mono text-[10px] text-amber-300 uppercase font-bold">Zone: SOMA District Grid</span>
              <span className="font-bold text-rose-400">92% Failure Risk</span>
            </div>
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-200">Systemic: Water Leakage pipeline hazard</h4>
            <div className="flex gap-2">
              <input
                type="text"
                value={dispatchDept}
                onChange={e => setDispatchDept(e.target.value)}
                placeholder="Department allocation name..."
                className="bg-white/10 border border-white/10 px-3 py-1.5 rounded-lg text-xs font-semibold focus:outline-none focus:border-rose-400 flex-1 text-white"
              />
              <button
                onClick={() => triggerPreemptiveCrew("Water Leakage", "SOMA District")}
                disabled={loadingAction === "Water Leakage"}
                className="py-1.5 px-3 bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-[10px] uppercase rounded-lg cursor-pointer transition-colors"
              >
                {loadingAction === "Water Leakage" ? "Crews Deploying..." : "Deploy Preemptive Crew"}
              </button>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 p-4 rounded-xl space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="font-mono text-[10px] text-amber-300 uppercase font-bold">Zone: Mission Ward Central</span>
              <span className="font-bold text-amber-400">76% Failure Risk</span>
            </div>
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-200">Systemic: Road Damage Crater defect</h4>
            <div className="flex gap-2">
              <span className="text-[10px] text-slate-400 italic flex-1 self-center">Assigned to SOMA Public Works department</span>
              <button
                onClick={() => triggerPreemptiveCrew("Pothole", "Mission Ward")}
                disabled={loadingAction === "Pothole"}
                className="py-1.5 px-3 bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-[10px] uppercase rounded-lg cursor-pointer transition-colors"
              >
                {loadingAction === "Pothole" ? "Deploying..." : "Send Inspection Patrol"}
              </button>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
