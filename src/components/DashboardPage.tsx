import React from "react";
import { Award, Shield, CheckCircle2, AlertTriangle, MessageSquare, Flame, CheckCircle, TrendingUp, Sparkles, MapPin, Zap, Compass, Star } from "lucide-react";
import { User, Issue, IssueStatus, AIAnalytics } from "../types.js";

interface DashboardPageProps {
  currentUser: User | null;
  issues: Issue[];
  analytics: AIAnalytics | null;
  onNavigateToIssue: (id: string) => void;
  onNavigateToView: (view: any) => void;
}

export default function DashboardPage({ currentUser, issues, analytics, onNavigateToIssue, onNavigateToView }: DashboardPageProps) {
  if (!currentUser) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8 text-center max-w-xl mx-auto space-y-4 my-8 font-sans">
        <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto border border-blue-100">
          <Shield className="w-6 h-6 animate-pulse text-amber-500" />
        </div>
        <h3 className="text-base font-bold text-slate-800">Verify Identity Required</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          Authorized citizen credentials are required to sync your gamified dashboard, streak challenges, level progression meters, and local reported logs.
        </p>
        <button
          onClick={() => onNavigateToView("login")}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase rounded-lg shadow-sm cursor-pointer"
        >
          Authenticate Secure Node
        </button>
      </div>
    );
  }

  // Filter issues reported by current user
  const myIssues = issues.filter(issue => issue.reporterId === currentUser.id);

  // Compute stats
  const totalReported = myIssues.length;
  const totalVerified = myIssues.filter(issue => issue.status === "Verified").length;
  const totalResolved = myIssues.filter(issue => issue.status === "Resolved").length;

  // Compute progress bar for next Level
  const currentLevel = Math.floor(currentUser.points / 100) + 1;
  const currentLevelXp = currentUser.points % 100;
  const xpNeeded = 100 - currentLevelXp;

  // Client-side prediction math fallback
  const getClientSidePredictiveStats = () => {
    if (issues.length === 0) {
      return {
        averagePredictedDays: 4.2,
        fastestDepartments: [
          { department: "Municipal Power & Lighting Department", avgDays: 2.1 },
          { department: "Civil Defense & Public Safety Division", avgDays: 2.5 }
        ],
        slowestDepartments: [
          { department: "Department of Public Works (SFPW)", avgDays: 7.8 },
          { department: "Sanitation & Sewer Management Service", avgDays: 6.2 }
        ]
      };
    }

    const getHeuristicDays = (issue: Issue): number => {
      let baseDays = 5;
      switch (issue.category) {
        case "Pothole": baseDays = 6; break;
        case "Water Leakage": baseDays = 3; break;
        case "Garbage": baseDays = 2; break;
        case "Drainage": baseDays = 4; break;
        case "Streetlight": baseDays = 5; break;
        case "Road Damage": baseDays = 10; break;
        case "Public Safety": baseDays = 2; break;
        default: baseDays = 5;
      }

      let sevMult = 1.0;
      switch (issue.severity) {
        case "Critical": sevMult = 0.3; break;
        case "High": sevMult = 0.6; break;
        case "Medium": sevMult = 1.0; break;
        case "Low": sevMult = 1.5; break;
      }

      const verPressure = Math.max(0.7, 1 - ((issue.verificationsCount || 0) * 0.05));
      return Math.round(Math.max(1, baseDays * sevMult * verPressure));
    };

    const predictions = issues.map(i => ({
      department: i.assignedDepartment || "City Administration Department",
      days: i.predictedResolutionDays !== undefined ? i.predictedResolutionDays : getHeuristicDays(i)
    }));

    const totalDays = predictions.reduce((sum, p) => sum + p.days, 0);
    const averagePredictedDays = parseFloat((totalDays / predictions.length).toFixed(1));

    const deptGroups: Record<string, { totalDays: number; count: number }> = {};
    predictions.forEach(p => {
      if (!deptGroups[p.department]) {
        deptGroups[p.department] = { totalDays: 0, count: 0 };
      }
      deptGroups[p.department].totalDays += p.days;
      deptGroups[p.department].count += 1;
    });

    const deptAverages = Object.entries(deptGroups).map(([dept, data]) => ({
      department: dept,
      avgDays: parseFloat((data.totalDays / data.count).toFixed(1))
    }));

    const sortedDepts = [...deptAverages].sort((a, b) => a.avgDays - b.avgDays);
    const fastest = sortedDepts.slice(0, 2);
    const slowest = sortedDepts.slice(-2).reverse();

    if (fastest.length === 0) {
      fastest.push({ department: "Civil Defense & Public Safety Division", avgDays: 1.5 });
    }
    if (slowest.length === 0) {
      slowest.push({ department: "Department of Public Works (SFPW)", avgDays: 6.8 });
    }

    return {
      averagePredictedDays,
      fastestDepartments: fastest,
      slowestDepartments: slowest
    };
  };

  const predStats = analytics?.predictiveStats || getClientSidePredictiveStats();

  // Static gamified quests
  const activeQuests = [
    {
      id: "q1",
      title: "Water Leakage Sweep",
      reward: "150 XP",
      progress: "0/1",
      icon: "💧",
      description: "Submit 1 Water Leakage complaint using Hands-Free Voice capture."
    },
    {
      id: "q2",
      title: "Audit Inspector",
      reward: "80 XP",
      progress: "1/2",
      icon: "🔍",
      description: "Perform 2 duplicate upvotes on nearby reported hazards."
    },
    {
      id: "q3",
      title: "Neighborhood Guardian",
      reward: "200 XP",
      progress: "1/3",
      icon: "🏘️",
      description: "Contribute to 3 community feedback comments to confirm resolution."
    }
  ];

  return (
    <div className="space-y-8 animate-fade-in font-sans" id="citizen-dashboard">
      
      {/* 1. GAMIFIED PROFILE HEADER CARD */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 rounded-2xl p-6 md:p-8 text-white border border-blue-500/10 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative">
          <div className="flex items-center gap-4 text-left">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center text-2xl font-black text-slate-900 shadow-md border-2 border-amber-300">
              {currentUser.fullName ? currentUser.fullName.charAt(0).toUpperCase() : "C"}
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black">{currentUser.fullName}</h2>
                <span className="text-[10px] font-mono font-bold bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Lv.{currentLevel} Resident
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[9px] font-mono font-black bg-blue-500/30 border border-blue-500/40 px-2 py-0.5 rounded-full uppercase text-blue-200">
                  🛡️ {currentUser.reputationTier || "Active Patrol"}
                </span>
                <span className="text-[9px] font-mono font-black bg-indigo-500/30 border border-indigo-500/40 px-2 py-0.5 rounded-full uppercase text-indigo-200">
                  ⭐ Reputation: {currentUser.reputationScore !== undefined ? currentUser.reputationScore : 50}/100
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">NODE ID: {currentUser.id.slice(0, 8)} • SECTOR: {currentUser.role === "admin" ? "SOMA City Architect" : "Neighborhood Patrol"}</p>
            </div>
          </div>

          <div className="flex gap-4 self-stretch md:self-auto justify-between md:justify-start items-center">
            {/* XP progress */}
            <div className="space-y-2 text-right">
              <div className="text-xs font-mono font-bold text-amber-300">Total Score: {currentUser.points} XP</div>
              <div className="w-40 bg-white/10 rounded-full h-2.5 border border-white/5 overflow-hidden">
                <div className="bg-amber-400 h-full rounded-full transition-all" style={{ width: `${currentLevelXp}%` }} />
              </div>
              <div className="text-[10px] text-slate-400 font-medium">{xpNeeded} XP to Level {currentLevel + 1}</div>
            </div>

            {/* Streak indicator */}
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2">
              <Flame className="w-5 h-5 text-orange-500 animate-pulse shrink-0" />
              <div className="text-left">
                <span className="text-[8px] font-mono text-slate-400 block uppercase font-bold">Daily Streak</span>
                <span className="text-xs font-bold font-mono">{currentUser.streakCount !== undefined ? currentUser.streakCount : 1} Days Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. STATS OVERVIEW */}
      <div className="grid grid-cols-3 gap-4" id="dashboard-stats-grid">
        <div className="bg-white border border-slate-200 p-4 rounded-xl text-left shadow-3xs">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block font-bold">Issues Logged</span>
          <span className="text-xl font-black text-slate-800">{totalReported}</span>
          <span className="text-[9px] text-slate-500 block mt-0.5">Submitted by you</span>
        </div>
        <div className="bg-white border border-slate-200 p-4 rounded-xl text-left shadow-3xs">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block font-bold">Issues Verified</span>
          <span className="text-xl font-black text-slate-800">{totalVerified}</span>
          <span className="text-[9px] text-emerald-600 block mt-0.5">Upvoted by community</span>
        </div>
        <div className="bg-white border border-slate-200 p-4 rounded-xl text-left shadow-3xs">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block font-bold">Faults Solved</span>
          <span className="text-xl font-black text-slate-800">{totalResolved}</span>
          <span className="text-[9px] text-indigo-600 block mt-0.5">Successfully closed</span>
        </div>
      </div>

      {/* 2.5 PREDICTIVE DISPATCH INTELLIGENCE */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 md:p-6 space-y-4 shadow-sm text-left" id="predictive-dispatch-dashboard">
        <div className="flex items-center gap-1.5 border-b border-slate-100 pb-3">
          <Sparkles className="w-4 h-4 text-blue-600 animate-pulse" />
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">
            Gemini Predictive Dispatch Dashboard
          </h3>
          <span className="text-[9px] font-mono font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-100 uppercase ml-auto animate-pulse">
            Real-time Prognostics
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Average Predicted Resolution Time Card */}
          <div className="bg-slate-50 border border-slate-150 p-4.5 rounded-2xl flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-mono font-bold text-slate-400 block uppercase tracking-wider">
                Average Predicted Resolution Time
              </span>
              <span className="text-3xl font-black text-slate-800 font-mono block mt-2">
                {predStats.averagePredictedDays} Days
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-medium leading-relaxed mt-3">
              Synthesized from active ticket loads, historic turnaround velocities, and SOMA district service pressure indicators.
            </p>
          </div>

          {/* Fastest Resolving Departments Card */}
          <div className="bg-emerald-50/25 border border-emerald-100 p-4.5 rounded-2xl space-y-3">
            <span className="text-[10px] font-mono font-bold text-emerald-800 block uppercase tracking-wider">
              Fastest Resolving Departments ⚡
            </span>
            <div className="space-y-2">
              {predStats.fastestDepartments.map((dept, idx) => (
                <div key={idx} className="bg-white border border-emerald-100 p-2.5 rounded-xl flex justify-between items-center">
                  <span className="text-[10.5px] font-bold text-slate-750 truncate max-w-[170px]" title={dept.department}>
                    {dept.department}
                  </span>
                  <span className="text-xs font-black text-emerald-700 font-mono shrink-0 ml-2">
                    {dept.avgDays}d avg
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Slowest Resolving Departments Card */}
          <div className="bg-amber-50/25 border border-amber-100 p-4.5 rounded-2xl space-y-3">
            <span className="text-[10px] font-mono font-bold text-amber-800 block uppercase tracking-wider">
              Slowest Resolving Departments ⏳
            </span>
            <div className="space-y-2">
              {predStats.slowestDepartments.map((dept, idx) => (
                <div key={idx} className="bg-white border border-amber-100 p-2.5 rounded-xl flex justify-between items-center">
                  <span className="text-[10.5px] font-bold text-slate-750 truncate max-w-[170px]" title={dept.department}>
                    {dept.department}
                  </span>
                  <span className="text-xs font-black text-amber-700 font-mono shrink-0 ml-2">
                    {dept.avgDays}d avg
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 3. DOUBLE LAYER: CHALLENGES & BADGES VS. PERSONAL REPORTS HISTORY */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: ACTIVE CHALLENGES & BADGES (5 COLUMNS) */}
        <div className="lg:col-span-5 space-y-6 text-left">
          {/* Active Quests */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-sm">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <Compass className="w-4 h-4 text-blue-600" />
              Active Dispatch Quests
            </h3>
            <div className="space-y-3">
              {activeQuests.map((quest) => (
                <div key={quest.id} className="bg-slate-50 border border-slate-150 p-3 rounded-xl space-y-1.5 hover:border-slate-300 transition-colors">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                      <span>{quest.icon}</span>
                      {quest.title}
                    </span>
                    <span className="text-[9px] font-mono bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-100 font-extrabold uppercase">
                      +{quest.reward}
                    </span>
                  </div>
                  <p className="text-[10.5px] text-slate-500 leading-normal font-medium">{quest.description}</p>
                  <div className="flex justify-between items-center pt-1.5 text-[9px] font-mono">
                    <span className="text-slate-450 uppercase">Progress Challenge</span>
                    <span className="font-bold text-slate-700">{quest.progress}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Badges showcase */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-sm">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <Award className="w-4 h-4 text-amber-500" />
              Citizen Badges Showcase
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-amber-50/50 border border-amber-200 p-2.5 rounded-xl text-center space-y-1.5">
                <span className="text-2xl block">🏅</span>
                <span className="text-[10px] font-bold text-amber-900 block truncate leading-tight">First Alert</span>
                <span className="text-[8px] font-mono text-amber-600 block leading-tight font-bold">1st Incident</span>
              </div>
              <div className="bg-blue-50/50 border border-blue-200 p-2.5 rounded-xl text-center space-y-1.5">
                <span className="text-2xl block">🎖️</span>
                <span className="text-[10px] font-bold text-blue-900 block truncate leading-tight">Patrol Cadet</span>
                <span className="text-[8px] font-mono text-blue-600 block leading-tight font-bold">Level 2+</span>
              </div>
              <div className="bg-emerald-50/50 border border-emerald-200 p-2.5 rounded-xl text-center space-y-1.5">
                <span className="text-2xl block">💎</span>
                <span className="text-[10px] font-bold text-emerald-900 block truncate leading-tight">Clog Master</span>
                <span className="text-[8px] font-mono text-emerald-600 block leading-tight font-bold">Drainage Pro</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: RECENT REPORTS HISTORY (7 COLUMNS) */}
        <div className="lg:col-span-7 space-y-4 text-left">
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-sm">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                Your Reported Incidents ({myIssues.length})
              </h3>
              <button
                onClick={() => onNavigateToView("report")}
                className="text-xs text-blue-600 hover:text-blue-700 font-bold hover:underline"
              >
                + Report New Hazard
              </button>
            </div>

            {myIssues.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-xl space-y-3">
                <span className="text-2xl">🗳️</span>
                <p className="text-xs text-slate-500 font-medium">You haven't reported any local hazards yet.</p>
                <p className="text-[10px] text-slate-400 max-w-xs mx-auto">Get out there and patrol! Earn +50 XP on your first validated report.</p>
              </div>
            ) : (
              <div className="space-y-3.5 max-h-[420px] overflow-y-auto pr-1">
                {myIssues.map((issue) => (
                  <div
                    key={issue.id}
                    onClick={() => onNavigateToIssue(issue.id)}
                    className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl flex gap-3.5 items-start justify-between cursor-pointer transition-all hover:translate-x-0.5"
                  >
                    {issue.imageUrl ? (
                      <img
                        src={issue.imageUrl}
                        alt={issue.title}
                        referrerPolicy="no-referrer"
                        className="w-12 h-12 rounded-lg object-cover border border-slate-200 shrink-0 mt-0.5"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 shrink-0 flex items-center justify-center text-xl font-bold">
                        🚨
                      </div>
                    )}

                    <div className="flex-1 space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] bg-slate-200 text-slate-700 font-semibold px-1.5 py-0.5 rounded uppercase block truncate">
                          {issue.category}
                        </span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${
                          issue.status === IssueStatus.Resolved ? "bg-emerald-50 text-emerald-700 border border-emerald-100" :
                          issue.status === IssueStatus.InProgress ? "bg-blue-50 text-blue-700 border border-blue-100" :
                          issue.status === IssueStatus.Assigned ? "bg-amber-50 text-amber-700 border border-amber-100" :
                          "bg-slate-100 text-slate-600"
                        }`}>
                          {issue.status}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-800 truncate">{issue.title}</h4>
                      <p className="text-[11px] text-slate-500 line-clamp-1">{issue.description}</p>
                    </div>

                    <div className="text-right flex flex-col justify-between h-12 shrink-0">
                      <span className="text-[9px] font-mono text-slate-400">{new Date(issue.createdAt).toLocaleDateString()}</span>
                      <span className="text-[10px] font-bold text-slate-700">👍 {issue.upvotesCount} upvotes</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
