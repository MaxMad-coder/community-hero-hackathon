import React, { useState } from "react";
import { Issue, IssueCategory, IssueStatus, IssueSeverity } from "../types.js";
import { Search, Filter, ArrowUpDown, ChevronRight, Calendar, AlertTriangle, ThumbsUp, CheckCircle, Flame } from "lucide-react";

interface CommunityFeedPageProps {
  issues: Issue[];
  onSelectIssue: (id: string) => void;
  onNavigateToView: (view: any) => void;
}

export default function CommunityFeedPage({ issues, onSelectIssue, onNavigateToView }: CommunityFeedPageProps) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedStatus, setSelectedStatus] = useState<string>("All");
  const [sortBy, setSortBy] = useState<"date" | "upvotes" | "severity">("date");

  // Filter logic
  const filtered = issues.filter(issue => {
    const searchMatch = issue.title.toLowerCase().includes(search.toLowerCase()) || 
                        issue.description.toLowerCase().includes(search.toLowerCase());
    const catMatch = selectedCategory === "All" || issue.category === selectedCategory;
    const statusMatch = selectedStatus === "All" || issue.status === selectedStatus;
    return searchMatch && catMatch && statusMatch;
  });

  // Sorting logic
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "date") {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    if (sortBy === "upvotes") {
      return b.upvotesCount - a.upvotesCount;
    }
    if (sortBy === "severity") {
      const severityOrder: Record<IssueSeverity, number> = {
        [IssueSeverity.Critical]: 4,
        [IssueSeverity.High]: 3,
        [IssueSeverity.Medium]: 2,
        [IssueSeverity.Low]: 1
      };
      return severityOrder[b.severity] - severityOrder[a.severity];
    }
    return 0;
  });

  return (
    <div className="space-y-6 animate-fade-in font-sans text-left" id="community-feed-page">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-3">
        <div>
          <h2 className="text-xl font-black text-slate-900 uppercase tracking-wide">Community Incident Dispatch Feed</h2>
          <p className="text-xs text-slate-500 mt-1">Review live local reported hazards, inspect municipal diagnostics, and coordinate upvotes.</p>
        </div>
        <button
          onClick={() => onNavigateToView("report")}
          className="py-2 px-4 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-sm cursor-pointer self-start md:self-auto"
        >
          + File New Complaint
        </button>
      </div>

      {/* SEARCH AND FILTERS PANEL */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 md:p-5 shadow-3xs grid grid-cols-1 md:grid-cols-12 gap-3.5">
        {/* Search */}
        <div className="md:col-span-4 relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search keyword, landmark, department..."
            className="w-full bg-slate-50 border border-slate-250 pl-9 pr-3 py-1.5 rounded-lg text-xs font-semibold focus:outline-none focus:border-blue-500 focus:bg-white text-slate-800"
          />
        </div>

        {/* Filter Category */}
        <div className="md:col-span-3 flex items-center gap-2">
          <span className="text-[10px] font-mono text-slate-400 uppercase font-bold shrink-0">Category</span>
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="flex-1 bg-slate-50 border border-slate-250 px-2.5 py-1.5 rounded-lg text-xs font-semibold focus:outline-none focus:border-blue-500 focus:bg-white h-8"
          >
            <option value="All">All Categories</option>
            {Object.values(IssueCategory).map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Filter Status */}
        <div className="md:col-span-3 flex items-center gap-2">
          <span className="text-[10px] font-mono text-slate-400 uppercase font-bold shrink-0">Status</span>
          <select
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value)}
            className="flex-1 bg-slate-50 border border-slate-250 px-2.5 py-1.5 rounded-lg text-xs font-semibold focus:outline-none focus:border-blue-500 focus:bg-white h-8"
          >
            <option value="All">All Statuses</option>
            {Object.values(IssueStatus).map(st => (
              <option key={st} value={st}>{st}</option>
            ))}
          </select>
        </div>

        {/* Sort By */}
        <div className="md:col-span-2 flex items-center gap-2">
          <span className="text-[10px] font-mono text-slate-400 uppercase font-bold shrink-0">Sort</span>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            className="flex-1 bg-slate-50 border border-slate-250 px-2.5 py-1.5 rounded-lg text-xs font-semibold focus:outline-none focus:border-blue-500 focus:bg-white h-8"
          >
            <option value="date">Date Logged</option>
            <option value="upvotes">Upvote Popularity</option>
            <option value="severity">Observed Severity</option>
          </select>
        </div>
      </div>

      {/* FEED RESULTS */}
      {sorted.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center space-y-3.5 shadow-sm">
          <span className="text-3xl">🏜️</span>
          <p className="text-xs text-slate-500 font-medium">No active incident reports match your criteria.</p>
          <p className="text-[10px] text-slate-400 max-w-sm mx-auto">Try clearing your filters or search phrases to fetch all local municipal reports.</p>
        </div>
      ) : (
        <div className="space-y-4" id="community-feed-grid">
          {sorted.map((issue) => {
            return (
              <div
                key={issue.id}
                onClick={() => onSelectIssue(issue.id)}
                className="bg-white border border-slate-200 rounded-2xl overflow-hidden hover:border-slate-350 hover:shadow-sm transition-all flex flex-col md:flex-row gap-5 p-5 cursor-pointer text-left relative"
              >
                {/* Photo/Visual Indicator */}
                {issue.imageUrl ? (
                  <img
                    src={issue.imageUrl}
                    alt={issue.title}
                    referrerPolicy="no-referrer"
                    className="w-full md:w-36 h-28 object-cover rounded-xl border border-slate-200 shrink-0 self-center"
                  />
                ) : (
                  <div className="w-full md:w-36 h-28 bg-slate-50 text-blue-600 rounded-xl border border-slate-150 shrink-0 flex flex-col items-center justify-center text-xl font-bold font-mono">
                    🚨
                    <span className="text-[8px] uppercase tracking-wider text-slate-400 font-black font-sans mt-1">No on-site image</span>
                  </div>
                )}

                {/* Body Content */}
                <div className="flex-1 space-y-2 min-w-0 flex flex-col justify-between py-1">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[9px] font-mono font-bold uppercase tracking-widest bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md border border-blue-100">
                        {issue.category}
                      </span>
                      <span className={`text-[9px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 rounded-md border ${
                        issue.severity === "Critical" ? "text-red-700 bg-red-50 border-red-100 font-extrabold" :
                        issue.severity === "High" ? "text-orange-700 bg-orange-50 border-orange-100 font-extrabold" :
                        "text-slate-600 bg-slate-50 border-slate-150 font-semibold"
                      }`}>
                        {issue.severity} Severity
                      </span>
                      <span className={`text-[9px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 rounded-md border ${
                        issue.status === IssueStatus.Resolved ? "text-emerald-700 bg-emerald-50 border-emerald-100" :
                        issue.status === IssueStatus.InProgress ? "text-blue-700 bg-blue-50 border-blue-100" :
                        issue.status === IssueStatus.Assigned ? "text-amber-700 bg-amber-50 border-amber-100" :
                        "text-slate-655 bg-slate-50 border-slate-150"
                      }`}>
                        {issue.status}
                      </span>
                    </div>

                    <h3 className="text-sm md:text-base font-black text-slate-900 leading-snug truncate uppercase tracking-tight">
                      {issue.title}
                    </h3>

                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed font-medium">
                      {issue.description}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-100 mt-2 text-[10px] text-slate-450 font-mono font-semibold">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      Logged {new Date(issue.createdAt).toLocaleDateString()} by {issue.reporterName}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-slate-800 font-bold font-sans">👍 {issue.upvotesCount} upvotes</span>
                      <span className="text-slate-800 font-bold font-sans">🛡️ {issue.verificationsCount} validations</span>
                    </div>
                  </div>
                </div>

                <div className="absolute right-4 top-4 text-slate-300 md:block hidden">
                  <ChevronRight className="w-5 h-5" />
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
