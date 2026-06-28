import React, { useState, useEffect, useRef } from "react";
import { Mic, MicOff, Volume2, Loader2, Sparkles, AlertCircle, MapPin, Image as ImageIcon, CheckCircle, ShieldAlert, Check } from "lucide-react";
import { IssueCategory, IssueSeverity } from "../types.js";

interface ReportIssuePageProps {
  token: string | null;
  onNavigateToView: (view: any) => void;
  onSubmitSuccess: () => void;
  triggerXpAlert: (points: number, badge?: string) => void;
}

export default function ReportIssuePage({ token, onNavigateToView, onSubmitSuccess, triggerXpAlert }: ReportIssuePageProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<IssueCategory>(IssueCategory.Other);
  const [severity, setSeverity] = useState<IssueSeverity>(IssueSeverity.Medium);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Voice States
  const [isListening, setIsListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const [voiceLoading, setVoiceLoading] = useState(false);
  const [voiceSuccess, setVoiceSuccess] = useState<boolean>(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  // Duplicate Check State
  const [duplicateCheck, setDuplicateCheck] = useState<{
    isDuplicate: boolean;
    similarityScore: number;
    explanation: string;
    duplicateIssueId?: string;
  } | null>(null);
  const [checkingDuplicate, setCheckingDuplicate] = useState(false);
  const [duplicateIssue, setDuplicateIssue] = useState<any>(null);

  useEffect(() => {
    if (duplicateCheck?.duplicateIssueId && token) {
      fetch("/api/issues")
        .then(res => res.json())
        .then(data => {
          if (data.issues) {
            const found = data.issues.find((i: any) => i.id === duplicateCheck.duplicateIssueId);
            setDuplicateIssue(found);
          }
        })
        .catch(err => console.error("Error fetching duplicate issue details", err));
    } else {
      setDuplicateIssue(null);
    }
  }, [duplicateCheck, token]);

  const handleUpvoteDuplicate = async () => {
    if (!duplicateCheck?.duplicateIssueId || !token) return;
    try {
      const res = await fetch(`/api/issues/${duplicateCheck.duplicateIssueId}/upvote`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        triggerXpAlert(5, "Curation Level Up");
        onSubmitSuccess();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleVerifyDuplicate = async () => {
    if (!duplicateCheck?.duplicateIssueId || !token) return;
    try {
      const res = await fetch(`/api/issues/${duplicateCheck.duplicateIssueId}/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ notes: "Community member verified during duplicate audit checks." })
      });
      if (res.ok) {
        triggerXpAlert(20, "Double Checked!");
        onSubmitSuccess();
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (!token) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8 text-center max-w-xl mx-auto space-y-4 my-8 font-sans">
        <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto border border-blue-100">
          <ShieldAlert className="w-6 h-6 animate-pulse text-rose-500" />
        </div>
        <h3 className="text-base font-bold text-slate-800">Authentication Required</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          Authorized citizen nodes must authenticate with a secure credential badge to access the live reporting systems and log municipal service dispatches.
        </p>
        <button
          onClick={() => onNavigateToView("login")}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase rounded-lg shadow-sm cursor-pointer"
        >
          Authenticate Identity
        </button>
      </div>
    );
  }

  // Preseeded mock photo uploads
  const mockImages = [
    { url: "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?w=300", label: "💧 Water Leak" },
    { url: "https://images.unsplash.com/photo-1599740831114-1779a2c40c88?w=300", label: "🚇 Pothole" },
    { url: "https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=300", label: "🗑️ Trash Dump" },
    { url: "https://images.unsplash.com/photo-1509395062183-67c5ad6faff9?w=300", label: "💡 Dark Street" }
  ];

  // Quick coordinate presets around SF
  const coordinatePresets = [
    { name: "SOMA Grid (Water Leak)", lat: 37.7749, lng: -122.4194 },
    { name: "Mission Ward (Road Crater)", lat: 37.7599, lng: -122.4148 },
    { name: "Tenderloin Sec (Illegal Dump)", lat: 37.7833, lng: -122.4167 }
  ];

  // Speech Recognition Start
  const startVoiceRecording = () => {
    setVoiceError(null);
    setVoiceSuccess(false);
    setVoiceTranscript("");

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceError("Speech recognition is not supported in this browser. Please use Chrome or Safari.");
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
        let text = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          text += event.results[i][0].transcript;
        }
        if (text) {
          setVoiceTranscript(text);
        }
      };

      rec.onerror = (event: any) => {
        console.error(event);
        setVoiceError(`Audio capture error: ${event.error || "unknown"}`);
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
      rec.start();
    } catch (e: any) {
      setVoiceError(`Failed to initialize recorder: ${e.message}`);
      setIsListening(false);
    }
  };

  const stopVoiceRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  // Run AI structured parse on recorded text
  useEffect(() => {
    if (!isListening && voiceTranscript.trim() && !voiceLoading && !voiceSuccess) {
      analyzeSpokenComplaint(voiceTranscript);
    }
  }, [isListening, voiceTranscript]);

  const analyzeSpokenComplaint = async (text: string) => {
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
        setTitle(data.parsed.title);
        setDescription(data.parsed.description);
        setCategory(data.parsed.category as IssueCategory);
        setSeverity(data.parsed.severity as IssueSeverity);
        setVoiceSuccess(true);

        // Preseed lat/lng if empty
        if (!latitude || !longitude) {
          setLatitude(37.7749);
          setLongitude(-122.4194);
        }
      } else {
        setVoiceError(data.error || "Failed to analyze speech with Gemini. Please customize manually.");
      }
    } catch (e) {
      setVoiceError("Network request error compiling spoken transcript.");
    } finally {
      setVoiceLoading(false);
    }
  };

  // Run a Duplicate Sweep Warning using semantic similarity
  const scanForDuplicates = async () => {
    if (!title.trim() || !token) return;
    setCheckingDuplicate(true);
    setDuplicateCheck(null);

    try {
      const res = await fetch("/api/issues/check-duplicate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ title, description })
      });
      const data = await res.json();
      if (res.ok) {
        setDuplicateCheck(data);
      }
    } catch (e) {
      console.warn("Failed to check duplicate issues", e);
    } finally {
      setCheckingDuplicate(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    if (!title.trim() || !description.trim()) {
      setSubmitError("Please fill out the issue Title and Description.");
      return;
    }
    if (!latitude || !longitude) {
      setSubmitError("Please pin SOMA coordinates or select a Quick Location preset.");
      return;
    }

    setSubmitLoading(true);

    try {
      const res = await fetch("/api/issues", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title,
          description,
          category,
          severity,
          latitude,
          longitude,
          imageUrl
        })
      });

      if (res.ok) {
        triggerXpAlert(50, "Clog Master");
        onSubmitSuccess();
      } else {
        const errData = await res.json();
        setSubmitError(errData.error || "Failed to create issue. Please try again.");
      }
    } catch (err: any) {
      setSubmitError("Server error occurred posting issue ticket.");
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in font-sans text-left" id="report-issue-page">
      
      <div className="border-b border-slate-200 pb-3">
        <h2 className="text-xl font-black text-slate-900 uppercase tracking-wide">Report New Community Hazard</h2>
        <p className="text-xs text-slate-500 mt-1">Submit high-density structural defects or request immediate city cleanup services.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: INTERACTIVE FORM (8 COLUMNS) */}
        <div className="lg:col-span-8 space-y-5">
          
          {/* 1. VOICE-TO-COMPLAINT ENHANCEMENT */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-white space-y-3 shadow-md relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-blue-400 uppercase tracking-widest font-black flex items-center gap-1.5">
                <Mic className="w-4 h-4 text-blue-400" />
                Hands-Free Voice-To-Complaint
              </span>
              {isListening && (
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                </span>
              )}
            </div>

            <p className="text-[11px] text-slate-400 leading-normal">
              Describe the problem out loud (e.g., <em className="text-slate-300 font-medium">"There is a water leakage near the market road."</em>). Gemini will map it into a formal title and description!
            </p>

            <div className="flex gap-2 pt-1">
              {!isListening ? (
                <button
                  type="button"
                  onClick={startVoiceRecording}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-[10px] uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-md"
                >
                  <Mic className="w-4 h-4" />
                  Begin Recording
                </button>
              ) : (
                <button
                  type="button"
                  onClick={stopVoiceRecording}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-4 bg-red-600 hover:bg-red-500 text-white font-extrabold text-[10px] uppercase tracking-wider rounded-xl transition-all animate-pulse cursor-pointer shadow-md"
                >
                  <MicOff className="w-4 h-4" />
                  Stop & Process Speech
                </button>
              )}
            </div>

            {/* Loading/transcripts/status indicator */}
            {isListening && (
              <div className="text-xs bg-white/5 border border-white/10 rounded-xl p-3 text-slate-300 italic leading-relaxed font-medium">
                {voiceTranscript || "Awaiting audio signature... Start speaking now."}
              </div>
            )}

            {voiceLoading && (
              <div className="text-[11px] text-blue-300 font-bold flex items-center gap-2 bg-white/5 border border-white/10 p-3 rounded-xl">
                <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                Scribing speech audio through Gemini-3.5-Flash pipeline...
              </div>
            )}

            {voiceError && (
              <div className="text-[11px] text-rose-400 bg-red-950/20 border border-red-900/40 p-3 rounded-xl font-semibold">
                ⚠️ {voiceError}
              </div>
            )}

            {voiceSuccess && (
              <div className="text-[11px] bg-emerald-950/30 border border-emerald-900/40 p-3 rounded-xl text-emerald-300 flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-extrabold uppercase font-mono text-[9px] tracking-wider block text-emerald-400">AI Compilation Completed!</strong>
                  Fields auto-drafted. Check the form below and make edits if necessary.
                </div>
              </div>
            )}
          </div>

          {/* 2. STANDARD FORM INPUTS */}
          <form onSubmit={handleSubmit} className="bg-white border border-slate-200 p-6 rounded-2xl space-y-4 shadow-sm">
            
            <div className="space-y-1">
              <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-wider font-extrabold">Complaint Title</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                onBlur={scanForDuplicates}
                placeholder="Brief summary of the issue..."
                className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-lg text-xs font-semibold focus:outline-none focus:border-blue-500 focus:bg-white text-slate-800"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-wider font-extrabold">Category</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value as IssueCategory)}
                  className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-lg text-xs font-semibold focus:outline-none focus:border-blue-500 focus:bg-white h-9"
                >
                  {Object.values(IssueCategory).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-wider font-extrabold">Observed Severity</label>
                <select
                  value={severity}
                  onChange={e => setSeverity(e.target.value as IssueSeverity)}
                  className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-lg text-xs font-semibold focus:outline-none focus:border-blue-500 focus:bg-white h-9"
                >
                  {Object.values(IssueSeverity).map(sev => (
                    <option key={sev} value={sev}>{sev}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-wider font-extrabold">Detailed Description</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Please describe details such as exact landmarks, physical dimensions, leak frequency, or other useful diagnostic specs..."
                rows={4}
                className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-lg text-xs font-medium focus:outline-none focus:border-blue-500 focus:bg-white text-slate-700 leading-relaxed"
                required
              />
            </div>

            {/* Custom preseeded preset photo selector */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-wider font-extrabold">On-Site Visual Photo (Preseeded Uploads)</label>
              <div className="grid grid-cols-4 gap-2.5">
                {mockImages.map((img) => (
                  <button
                    key={img.url}
                    type="button"
                    onClick={() => setImageUrl(img.url)}
                    className={`relative rounded-xl border overflow-hidden p-0.5 aspect-square transition-all cursor-pointer ${imageUrl === img.url ? "border-blue-600 ring-2 ring-blue-500/20" : "border-slate-200 hover:border-slate-350"}`}
                  >
                    <img src={img.url} alt={img.label} className="w-full h-full object-cover rounded-lg" referrerPolicy="no-referrer" />
                    <div className="absolute inset-x-0 bottom-0 bg-slate-900/80 text-[8px] font-bold text-white py-0.5 truncate text-center">
                      {img.label}
                    </div>
                    {imageUrl === img.url && (
                      <div className="absolute top-1 right-1 bg-blue-600 text-white rounded-full p-0.5">
                        <Check className="w-2.5 h-2.5" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={imageUrl}
                onChange={e => setImageUrl(e.target.value)}
                placeholder="Or paste custom image URL..."
                className="w-full bg-slate-50 border border-slate-200 px-3.5 py-1.5 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white mt-1"
              />
            </div>

            {/* Coordinates display or warnings */}
            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-150">
              <div>
                <span className="text-[8px] font-mono text-slate-400 uppercase font-black block">Geological Latitude</span>
                <span className="text-xs font-bold font-mono text-slate-700">{latitude ? latitude.toFixed(6) : "Not pinned"}</span>
              </div>
              <div>
                <span className="text-[8px] font-mono text-slate-400 uppercase font-black block">Geological Longitude</span>
                <span className="text-xs font-bold font-mono text-slate-700">{longitude ? longitude.toFixed(6) : "Not pinned"}</span>
              </div>
            </div>

            {submitError && (
              <div className="text-[11px] text-red-600 bg-red-50 border border-red-200 p-3 rounded-xl flex items-start gap-1.5">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <span>{submitError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={submitLoading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black text-xs py-2.5 rounded-xl uppercase tracking-wider transition-all cursor-pointer shadow-md flex items-center justify-center gap-1.5"
            >
              {submitLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {submitLoading ? "Dispatching Incident..." : "Confirm & Launch Ticket (+50 XP)"}
            </button>
          </form>
        </div>

        {/* RIGHT COLUMN: DUPLICATE & PRESETS (4 COLUMNS) */}
        <div className="lg:col-span-4 space-y-5">
          
          {/* Quick Coordinate presets */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm text-left">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <MapPin className="w-4 h-4 text-rose-500" />
              SOMA Coordinate Presets
            </h3>
            <p className="text-[11px] text-slate-500 leading-relaxed font-medium">Select a quick preset if you cannot click on the map to pin exact coordinate values.</p>
            <div className="space-y-2">
              {coordinatePresets.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => {
                    setLatitude(preset.lat);
                    setLongitude(preset.lng);
                  }}
                  className={`w-full text-left p-2.5 rounded-xl border text-[11px] font-bold transition-all flex justify-between items-center cursor-pointer hover:border-blue-300 ${latitude === preset.lat ? "bg-blue-50/50 border-blue-200 text-blue-700" : "bg-slate-50 border-slate-150 text-slate-700"}`}
                >
                  <span className="truncate">{preset.name}</span>
                  <span className="font-mono text-[9px] text-slate-400 shrink-0">📍 {preset.lat.toFixed(3)}, {preset.lng.toFixed(3)}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Dynamic Similarity Sweep Warning */}
          {checkingDuplicate && (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 text-center shadow-sm">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto" />
              <p className="text-[10px] text-slate-500 font-mono mt-2 font-bold uppercase tracking-widest">Searching Duplicates...</p>
            </div>
          )}

          {duplicateCheck && (
            <div className={`bg-white border rounded-2xl p-5 space-y-3.5 shadow-sm text-left ${duplicateCheck.isDuplicate ? "border-amber-300 bg-amber-50/10" : "border-emerald-300 bg-emerald-50/10"}`}>
              <div className="flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
                <span className="text-base">{duplicateCheck.isDuplicate ? "⚠️" : "✨"}</span>
                <span className={`text-[10px] font-mono uppercase font-black tracking-wider ${duplicateCheck.isDuplicate ? "text-amber-800" : "text-emerald-800"}`}>
                  {duplicateCheck.isDuplicate ? `Duplicate Alert! (${duplicateCheck.similarityScore}%)` : "No Duplicate Issues Found!"}
                </span>
              </div>
              <p className="text-[11px] text-slate-650 leading-relaxed font-medium">{duplicateCheck.explanation}</p>
              
              {duplicateCheck.isDuplicate && duplicateIssue && (
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <span className="text-[9px] font-mono uppercase font-black text-slate-400 block tracking-wider">Side-By-Side Audit Comparison</span>
                  
                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div className="p-2.5 bg-slate-100 rounded-xl border border-slate-200 space-y-1">
                      <strong className="block text-slate-700 uppercase font-bold text-[8px] font-mono">Your Draft</strong>
                      <span className="font-extrabold text-slate-800 truncate block">{title || "Untitled draft"}</span>
                      <p className="text-[9px] text-slate-500 line-clamp-3">{description || "No description yet."}</p>
                    </div>
                    
                    <div className="p-2.5 bg-amber-50/50 rounded-xl border border-amber-200 space-y-1">
                      <strong className="block text-amber-800 uppercase font-bold text-[8px] font-mono">Existing Ticket</strong>
                      <span className="font-extrabold text-slate-800 truncate block">{duplicateIssue.title}</span>
                      <p className="text-[9px] text-slate-500 line-clamp-3">{duplicateIssue.description}</p>
                      <div className="flex gap-1.5 text-[8px] font-bold text-slate-400 pt-1">
                        <span>👍 {duplicateIssue.upvotesCount}</span>
                        <span>✅ {duplicateIssue.verificationsCount}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 pt-1">
                    <button
                      type="button"
                      onClick={handleUpvoteDuplicate}
                      className="w-full text-center text-[10px] text-blue-700 font-black bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-xl border border-blue-200 cursor-pointer transition-colors block"
                    >
                      Upvote & Support Existing Ticket (+5 XP)
                    </button>
                    <button
                      type="button"
                      onClick={handleVerifyDuplicate}
                      className="w-full text-center text-[10px] text-emerald-700 font-black bg-emerald-50 hover:bg-emerald-100 px-3 py-2 rounded-xl border border-emerald-200 cursor-pointer transition-colors block"
                    >
                      Verify as Duplicate Sightings (+20 XP)
                    </button>
                    <button
                      type="button"
                      onClick={() => onNavigateToView("dashboard")}
                      className="w-full text-center text-[9px] text-slate-500 font-bold hover:text-slate-700 cursor-pointer block"
                    >
                      Discard Draft & Return
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
