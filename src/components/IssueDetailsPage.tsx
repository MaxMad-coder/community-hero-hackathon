import React, { useState, useEffect } from "react";
import { Issue, Comment, TimelineItem, User, IssueStatus } from "../types.js";
import { MessageSquare, ArrowLeft, ThumbsUp, CheckCircle, Award, ShieldAlert, Clock, Sparkles, Building2, ChevronRight, User as UserIcon } from "lucide-react";

interface IssueDetailsPageProps {
  issueId: string;
  currentUser: User | null;
  token: string | null;
  onBack: () => void;
  triggerXpAlert: (points: number, badge?: string) => void;
}

export default function IssueDetailsPage({ issueId, currentUser, token, onBack, triggerXpAlert }: IssueDetailsPageProps) {
  const [issue, setIssue] = useState<Issue | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  // Admin overrides
  const [adminStatus, setAdminStatus] = useState<IssueStatus>(IssueStatus.Reported);
  const [adminDept, setAdminDept] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [updatingAdmin, setUpdatingAdmin] = useState(false);

  // AI Resolution Predictor State
  const [prediction, setPrediction] = useState<{
    predicted_resolution_days: number;
    confidence_score: number;
    reasoning: string;
  } | null>(null);
  const [loadingPrediction, setLoadingPrediction] = useState(false);
  const [predictionError, setPredictionError] = useState<string | null>(null);

  const fetchPredictionData = async (forceRecalculate = false) => {
    if (!token) return;
    setLoadingPrediction(true);
    setPredictionError(null);
    try {
      const endpoint = `/api/issues/${issueId}/prediction`;
      const method = forceRecalculate ? "POST" : "GET";
      const res = await fetch(endpoint, {
        method,
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
      if (res.ok) {
        const data = await res.json();
        setPrediction(data);
      } else {
        setPredictionError("Predictive engines are busy. Please try again.");
      }
    } catch (err) {
      console.error("Error fetching prediction:", err);
      setPredictionError("Failed to fetch AI resolution prediction.");
    } finally {
      setLoadingPrediction(false);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const issueRes = await fetch(`/api/issues/${issueId}`);
      if (issueRes.ok) {
        const issueData = await issueRes.json();
        setIssue(issueData);
        setAdminStatus(issueData.status);
        setAdminDept(issueData.assignedDepartment || "");
      }

      const commentsRes = await fetch(`/api/issues/${issueId}/comments`);
      if (commentsRes.ok) {
        setComments(await commentsRes.json());
      }

      const timelineRes = await fetch(`/api/issues/${issueId}/timeline`);
      if (timelineRes.ok) {
        setTimeline(await timelineRes.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    fetchPredictionData(false);
  }, [issueId, token]);

  const handleUpvote = async () => {
    if (!token || !issue) return;
    try {
      const res = await fetch(`/api/issues/${issueId}/upvote`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        triggerXpAlert(15);
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleVerify = async () => {
    if (!token || !issue) return;
    try {
      const res = await fetch(`/api/issues/${issueId}/verify`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        triggerXpAlert(25);
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !token) return;
    setSubmittingComment(true);

    try {
      const res = await fetch(`/api/issues/${issueId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ text: newComment })
      });
      if (res.ok) {
        setNewComment("");
        // Reload comments
        const commentsRes = await fetch(`/api/issues/${issueId}/comments`);
        if (commentsRes.ok) {
          setComments(await commentsRes.json());
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmittingComment(false);
    }
  };

  // Admin update submission
  const handleAdminUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || currentUser?.role !== "admin") return;
    setUpdatingAdmin(true);

    try {
      const res = await fetch(`/api/issues/${issueId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          status: adminStatus,
          assignedDepartment: adminDept
        })
      });
      if (res.ok) {
        setAdminNotes("");
        triggerXpAlert(100, "City Architect");
        fetchData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingAdmin(false);
    }
  };

  const [summarizing, setSummarizing] = useState(false);
  const handleSummarizeThread = async () => {
    if (!token) return;
    setSummarizing(true);
    try {
      const res = await fetch(`/api/issues/${issueId}/summarize-thread`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.aiThreadSummary) {
          setIssue(prev => prev ? { ...prev, aiThreadSummary: data.aiThreadSummary } : null);
          triggerXpAlert(10);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSummarizing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-80 space-y-4 bg-white border border-slate-200 rounded-2xl shadow-sm my-6 font-sans">
        <Clock className="w-10 h-10 animate-spin text-blue-600" />
        <span className="text-xs font-semibold text-slate-500 font-mono uppercase tracking-wider">Syncing ticket node telemetry...</span>
      </div>
    );
  }

  if (!issue) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8 text-center max-w-xl mx-auto space-y-4 my-8 font-sans">
        <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto" />
        <h3 className="text-base font-bold text-slate-800">Issue Node Not Found</h3>
        <p className="text-xs text-slate-500">The requested ticket reference ID does not exist in the local database or has been archived.</p>
        <button onClick={onBack} className="text-xs text-blue-600 hover:underline font-bold">
          &larr; Return to Map Grid
        </button>
      </div>
    );
  }

  // Find if user already verified or upvoted
  const isUpvoted = currentUser ? issue.upvotedBy.includes(currentUser.id) : false;
  const isVerifiedByMe = currentUser ? issue.verifiedBy.includes(currentUser.id) : false;

  return (
    <div className="space-y-6 animate-fade-in font-sans text-left max-w-5xl mx-auto" id="issue-details-root">
      
      {/* Back CTA */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-3xs cursor-pointer"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Dashboard
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: PRIMARY DETAILS (7 COLUMNS) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Main card */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            {issue.imageUrl && (
              <img
                src={issue.imageUrl}
                alt={issue.title}
                referrerPolicy="no-referrer"
                className="w-full h-56 object-cover border-b border-slate-150"
              />
            )}

            <div className="p-6 space-y-5">
              {/* Category tags */}
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full border border-blue-100">
                  {issue.category}
                </span>
                <span className={`text-[10px] font-mono font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full border ${
                  issue.severity === "Critical" ? "text-red-700 bg-red-50 border-red-100" :
                  issue.severity === "High" ? "text-orange-700 bg-orange-50 border-orange-100" :
                  issue.severity === "Medium" ? "text-blue-700 bg-blue-50 border-blue-100" :
                  "text-slate-600 bg-slate-50 border-slate-150"
                }`}>
                  {issue.severity} Severity
                </span>
                <span className={`text-[10px] font-mono font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full border ${
                  issue.status === IssueStatus.Resolved ? "text-emerald-700 bg-emerald-50 border-emerald-100" :
                  issue.status === IssueStatus.InProgress ? "text-blue-700 bg-blue-50 border-blue-100" :
                  issue.status === IssueStatus.Assigned ? "text-amber-700 bg-amber-50 border-amber-100" :
                  "text-slate-600 bg-slate-50 border-slate-150"
                }`}>
                  {issue.status}
                </span>
                {issue.priorityIndex !== undefined && (
                  <span className="text-[10px] font-mono font-bold uppercase tracking-widest bg-amber-50 text-amber-700 px-2.5 py-0.5 rounded-full border border-amber-200 flex items-center gap-1 shadow-3xs" title="Smart algorithmic value calculated using severity, citizen consensus indicators, and decay indices.">
                    Priority Score: {Math.round(issue.priorityIndex)}
                  </span>
                )}
              </div>

              {/* Title & Desc */}
              <div className="space-y-2">
                <h2 className="text-lg md:text-xl font-black text-slate-900 uppercase tracking-tight">{issue.title}</h2>
                <p className="text-xs text-slate-400 font-mono">
                  LOGGED BY {issue.reporterName} • {new Date(issue.createdAt).toLocaleDateString()} AT SOMA {issue.latitude.toFixed(4)}°, {issue.longitude.toFixed(4)}°
                </p>
                <p className="text-xs md:text-sm text-slate-700 leading-relaxed font-medium pt-2 border-t border-slate-100">
                  {issue.description}
                </p>
              </div>

              {/* Gemini explanation block */}
              {issue.summary && (
                <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-xl space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    <span className="text-[10px] font-mono font-bold text-blue-800 uppercase tracking-widest">Gemini Scribe Classifier Audit</span>
                  </div>
                  <p className="text-[11px] text-slate-700 leading-relaxed font-medium">"{issue.summary}"</p>
                  {issue.aiExplanation && (
                    <p className="text-[10px] text-slate-450 leading-relaxed italic">{issue.aiExplanation}</p>
                  )}
                </div>
              )}

              {/* Action indicators */}
              <div className="flex gap-3 pt-3 border-t border-slate-100">
                <button
                  onClick={handleUpvote}
                  disabled={!token || isUpvoted}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border text-xs font-bold transition-all cursor-pointer ${isUpvoted ? "bg-blue-50 border-blue-200 text-blue-600" : "bg-white border-slate-200 text-slate-650 hover:bg-slate-50"}`}
                >
                  <ThumbsUp className="w-4 h-4" />
                  {isUpvoted ? "Upvoted!" : "Upvote"} ({issue.upvotesCount})
                </button>

                <button
                  onClick={handleVerify}
                  disabled={!token || isVerifiedByMe}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border text-xs font-bold transition-all cursor-pointer ${isVerifiedByMe ? "bg-emerald-50 border-emerald-200 text-emerald-600" : "bg-white border-slate-200 text-slate-650 hover:bg-slate-50"}`}
                >
                  <CheckCircle className="w-4 h-4" />
                  {isVerifiedByMe ? "Verified Duplicate!" : "Verify Issue"} ({issue.verificationsCount})
                </button>
              </div>
            </div>
          </div>

          {/* AI Resolution Prediction Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm relative overflow-hidden text-left" id="ai-resolution-predictor-card">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-xl pointer-events-none" />
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-blue-600 animate-pulse" />
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">
                  AI Resolution Predictor
                </h3>
              </div>
              <button
                onClick={() => fetchPredictionData(true)}
                disabled={loadingPrediction || !token}
                className="text-[9px] font-mono font-bold bg-slate-100 hover:bg-slate-200 text-slate-650 px-2.5 py-1 rounded-lg border border-slate-200 cursor-pointer disabled:opacity-50 transition-all uppercase"
                title="Request fresh Gemini prediction recalculation"
              >
                {loadingPrediction ? "Recalculating..." : "Recalculate 🔄"}
              </button>
            </div>

            {loadingPrediction ? (
              <div className="py-6 space-y-3">
                <div className="flex gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-slate-100 rounded-full w-24 animate-pulse" />
                    <div className="h-6 bg-slate-100 rounded w-full animate-pulse" />
                  </div>
                  <div className="w-20 space-y-2">
                    <div className="h-3 bg-slate-100 rounded-full w-12 animate-pulse" />
                    <div className="h-6 bg-slate-100 rounded w-full animate-pulse" />
                  </div>
                </div>
                <div className="h-3 bg-slate-100 rounded-full w-3/4 animate-pulse" />
                <div className="h-3 bg-slate-100 rounded-full w-1/2 animate-pulse" />
              </div>
            ) : predictionError ? (
              <div className="py-4 text-center space-y-2">
                <p className="text-[11px] text-red-500 font-medium">{predictionError}</p>
                <button 
                  onClick={() => fetchPredictionData(false)}
                  className="text-[10px] text-blue-600 font-bold hover:underline"
                >
                  Retry Prediction
                </button>
              </div>
            ) : prediction ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {/* Expected Time Range */}
                  <div className="bg-slate-50 border border-slate-150 p-3.5 rounded-xl text-left">
                    <span className="text-[9px] font-mono font-bold text-slate-400 block uppercase tracking-wider">
                      Expected Resolution
                    </span>
                    <span className="text-sm md:text-base font-black text-slate-800 font-mono block mt-1">
                      {prediction.predicted_resolution_days <= 1 
                        ? "Within 24 Hours" 
                        : prediction.predicted_resolution_days <= 2 
                        ? "1–2 Days" 
                        : `${prediction.predicted_resolution_days - 1}–${prediction.predicted_resolution_days + 2} Days`}
                    </span>
                  </div>

                  {/* Confidence Percentage */}
                  <div className="bg-slate-50 border border-slate-150 p-3.5 rounded-xl text-left">
                    <span className="text-[9px] font-mono font-bold text-slate-400 block uppercase tracking-wider">
                      Prediction Confidence
                    </span>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-sm md:text-base font-black text-blue-600 font-mono">
                        {prediction.confidence_score}%
                      </span>
                      <span className="text-[8px] text-slate-400 font-mono font-semibold">
                        (Gemini Flash)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Explanation reasoning */}
                <div className="bg-blue-50/20 border border-blue-100/50 p-3.5 rounded-xl text-left space-y-1.5">
                  <span className="text-[9px] font-mono font-bold text-blue-800 block uppercase tracking-wider">
                    Prediction Factors & Reasoning
                  </span>
                  <p className="text-[11px] text-slate-700 leading-relaxed font-medium">
                    {prediction.reasoning}
                  </p>
                </div>
              </div>
            ) : (
              <div className="py-6 text-center space-y-2">
                <p className="text-[11px] text-slate-450 italic">AI resolution estimates are available for authenticated patrols.</p>
                {!token ? (
                  <p className="text-[10px] text-amber-600 font-semibold">Please authenticate to load predictor module.</p>
                ) : (
                  <button 
                    onClick={() => fetchPredictionData(false)}
                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[10px] font-bold uppercase transition-colors cursor-pointer"
                  >
                    Compile Prediction ✨
                  </button>
                )}
              </div>
            )}
          </div>

          {/* AI Thread Briefing Section */}
          <div className="bg-slate-900 text-white border border-slate-800 rounded-2xl p-5 space-y-3 shadow-md relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span className="text-[10px] font-mono uppercase tracking-wider font-black text-indigo-300">AI Thread Analyst Briefing</span>
              </div>
              <button
                onClick={handleSummarizeThread}
                disabled={summarizing || !token}
                className="text-[9px] font-mono font-bold bg-indigo-600 hover:bg-indigo-500 px-2.5 py-1 rounded-lg text-white border border-indigo-500 cursor-pointer disabled:opacity-50 transition-all uppercase"
              >
                {summarizing ? "Recalculating..." : "Generate Summary ✨"}
              </button>
            </div>
            {issue.aiThreadSummary ? (
              <div className="text-[11px] text-slate-300 leading-relaxed font-medium bg-white/5 border border-white/10 rounded-xl p-3">
                <div className="whitespace-pre-line text-left">
                  {issue.aiThreadSummary}
                </div>
              </div>
            ) : (
              <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                No thread summary briefing generated yet. Click to request Gemini compilation across all logged citizen comments, verifications, and progress milestones.
              </p>
            )}
          </div>

          {/* Comments list */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <MessageSquare className="w-4 h-4 text-blue-600" />
              Citizen Discussion Feed ({comments.length})
            </h3>

            {comments.length === 0 ? (
              <p className="text-[11px] text-slate-400 py-4 text-center">No citizen comments logged on this ticket yet. Be the first to coordinate!</p>
            ) : (
              <div className="space-y-4">
                {comments.map((comment) => (
                  <div key={comment.id} className="text-xs space-y-1.5 border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-800 flex items-center gap-1">
                        <UserIcon className="w-3 h-3 text-slate-400" />
                        {comment.userName}
                        <span className={`text-[8px] font-mono font-bold uppercase tracking-widest px-1.5 rounded ${
                          comment.userRole === "admin" ? "bg-rose-50 text-rose-600" :
                          comment.userRole === "ai" ? "bg-blue-50 text-blue-600" : "bg-slate-100 text-slate-500"
                        }`}>
                          {comment.userRole}
                        </span>
                      </span>
                      <span className="text-[9px] font-mono text-slate-400">{new Date(comment.createdAt).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-slate-600 leading-relaxed font-medium">{comment.text}</p>
                  </div>
                ))}
              </div>
            )}

            {token ? (
              <form onSubmit={handlePostComment} className="flex gap-2.5 pt-2.5">
                <input
                  type="text"
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  placeholder="Post diagnostic updates, verification notes, or status inquiries..."
                  className="flex-1 bg-slate-50 border border-slate-250 px-3.5 py-1.5 rounded-lg text-xs font-medium focus:outline-none focus:border-blue-500 focus:bg-white text-slate-800"
                  required
                />
                <button
                  type="submit"
                  disabled={submittingComment}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-[10px] uppercase tracking-wider px-4 py-2 rounded-lg cursor-pointer"
                >
                  Send
                </button>
              </form>
            ) : (
              <p className="text-[10px] text-slate-400 italic text-center font-mono">Authenticate your resident node to leave comments.</p>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: TIMELINE & ADMIN OVERRIDES (5 COLUMNS) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Timeline Tracker */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <Clock className="w-4 h-4 text-indigo-650" />
              Municipal Status Timeline
            </h3>

            <div className="relative border-l border-slate-200 pl-4 space-y-5 ml-1">
              {timeline.map((step, idx) => (
                <div key={step.id} className="relative text-xs space-y-1">
                  <span className="absolute -left-[20.5px] top-1 w-3 h-3 rounded-full bg-indigo-600 border border-white" />
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-800 text-[11px] uppercase tracking-wide">{step.title}</span>
                    <span className="text-[8px] font-mono text-slate-400 font-bold">{new Date(step.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-slate-500 leading-normal text-[10.5px] font-medium">{step.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Assigned Dept Info */}
          {issue.assignedDepartment && (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm text-left flex items-center gap-3.5">
              <div className="p-2.5 bg-blue-50 rounded-xl border border-blue-100 text-blue-600 shrink-0">
                <Building2 className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="text-[8px] font-mono text-slate-400 uppercase font-black block">Assigned Municipal Office</span>
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wide truncate block">{issue.assignedDepartment}</span>
              </div>
            </div>
          )}

          {/* Admin Override Console */}
          {currentUser?.role === "admin" && (
            <div className="bg-rose-50/50 border border-rose-150 rounded-2xl p-5 space-y-4 shadow-sm">
              <h3 className="text-xs font-bold text-rose-900 uppercase tracking-wider font-mono flex items-center gap-1.5 border-b border-rose-200 pb-2">
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                City Architect override Console
              </h3>

              <form onSubmit={handleAdminUpdate} className="space-y-3.5 text-xs text-left">
                <div className="space-y-1">
                  <label className="block text-[10px] font-mono uppercase text-slate-500 font-extrabold">Dispatch Status</label>
                  <select
                    value={adminStatus}
                    onChange={e => setAdminStatus(e.target.value as IssueStatus)}
                    className="w-full bg-white border border-slate-250 px-3.5 py-1.5 rounded-lg text-xs font-semibold focus:outline-none focus:border-rose-500 h-8.5"
                  >
                    {Object.values(IssueStatus).map(st => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-mono uppercase text-slate-500 font-extrabold">Municipal Department</label>
                  <input
                    type="text"
                    value={adminDept}
                    onChange={e => setAdminDept(e.target.value)}
                    placeholder="SOMA Water Commission / Dept of Public Works"
                    className="w-full bg-white border border-slate-250 px-3.5 py-1.5 rounded-lg text-xs font-medium focus:outline-none focus:border-rose-500 text-slate-800"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-mono uppercase text-slate-500 font-extrabold">Dispatch Updates / Timeline Notes</label>
                  <textarea
                    value={adminNotes}
                    onChange={e => setAdminNotes(e.target.value)}
                    placeholder="Provide diagnostic notes detailing dispatch crews, parts ordered, or resolution audits..."
                    rows={3}
                    className="w-full bg-white border border-slate-250 px-3.5 py-1.5 rounded-lg text-xs font-medium focus:outline-none focus:border-rose-500 text-slate-700 leading-relaxed"
                  />
                </div>

                <button
                  type="submit"
                  disabled={updatingAdmin}
                  className="w-full bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-[10px] uppercase tracking-wider py-2 rounded-lg cursor-pointer shadow-sm transition-colors active:scale-99"
                >
                  {updatingAdmin ? "Updating Node..." : "Commit Override Milestone (+100 XP)"}
                </button>
              </form>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
