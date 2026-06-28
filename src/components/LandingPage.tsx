import React from "react";
import { Shield, MapPin, Sparkles, TrendingUp, Award, CheckCircle, Users, Zap, ArrowRight, Activity, Flame } from "lucide-react";

interface LandingPageProps {
  onNavigate: (view: any) => void;
  token: string | null;
}

export default function LandingPage({ onNavigate, token }: LandingPageProps) {
  return (
    <div className="space-y-16 animate-fade-in font-sans" id="landing-page-root">
      
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-8 md:p-14 text-white shadow-2xl border border-indigo-500/20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-500/10 via-transparent to-transparent pointer-events-none" />
        <div className="absolute -bottom-24 -left-20 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative max-w-3xl space-y-6 text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/20 border border-indigo-400/30 rounded-full text-indigo-200 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            Hyperlocal Civic Empowerment
          </div>
          
          <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">
            Be the Hero Your <br className="hidden md:inline" />
            <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-amber-300 bg-clip-text text-transparent">
              Neighborhood Needs
            </span>
          </h1>
          
          <p className="text-sm md:text-base text-slate-300 leading-relaxed max-w-xl font-medium">
            Community Hero bridges the gap between residents and city services. Report hazards with state-of-the-art AI, upvote municipal duplicate sweeps, and track issues on our live satellite map.
          </p>

          <div className="flex flex-wrap gap-4 pt-4">
            <button
              onClick={() => onNavigate("map")}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg hover:shadow-blue-500/30 flex items-center gap-2 cursor-pointer"
            >
              Explore Live Map Grid
              <ArrowRight className="w-4 h-4" />
            </button>
            
            {!token ? (
              <button
                onClick={() => onNavigate("login")}
                className="px-6 py-3 bg-white/10 hover:bg-white/15 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl border border-white/10 transition-all flex items-center gap-2 cursor-pointer"
              >
                Authenticate Identity
              </button>
            ) : (
              <button
                onClick={() => onNavigate("dashboard")}
                className="px-6 py-3 bg-indigo-600/50 hover:bg-indigo-600/70 text-indigo-100 font-extrabold text-xs uppercase tracking-wider rounded-xl border border-indigo-500/30 transition-all flex items-center gap-2 cursor-pointer"
              >
                Go to Citizen Hub
              </button>
            )}
          </div>
        </div>

        {/* Floating Demo Credential Notice on Hero */}
        {!token && (
          <div className="mt-10 pt-6 border-t border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs font-mono text-slate-400">
            <div className="flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Rapid Sandbox Access Enabled:</span>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-slate-300">
              <span>Citizen: <strong className="text-yellow-400">jane@community.org</strong> (pwd: jane123)</span>
              <span>Admin: <strong className="text-yellow-400">admin@community.org</strong> (pwd: admin123)</span>
            </div>
          </div>
        )}
      </section>

      {/* 2. REAL-TIME COMMUNITY STATS */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4" id="landing-stats">
        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm text-left flex items-start gap-4 hover:border-slate-300 transition-all">
          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-emerald-600">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-extrabold block">Resolved Faults</span>
            <span className="text-2xl font-black text-slate-800">418</span>
            <span className="text-[10px] text-emerald-600 font-bold block mt-0.5">84.2% Success Rate</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm text-left flex items-start gap-4 hover:border-slate-300 transition-all">
          <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 text-blue-600">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-extrabold block">Active Citizens</span>
            <span className="text-2xl font-black text-slate-800">1,482</span>
            <span className="text-[10px] text-blue-600 font-bold block mt-0.5">143 Joined Today</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm text-left flex items-start gap-4 hover:border-slate-300 transition-all">
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 text-amber-600">
            <Flame className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-extrabold block">Streak Hotspot</span>
            <span className="text-2xl font-black text-slate-800">SOMA District</span>
            <span className="text-[10px] text-amber-600 font-bold block mt-0.5">High Citizen Verifications</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm text-left flex items-start gap-4 hover:border-slate-300 transition-all">
          <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100 text-indigo-600">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-extrabold block">AI Predictive Risk</span>
            <span className="text-2xl font-black text-slate-800">92% Acc.</span>
            <span className="text-[10px] text-indigo-600 font-bold block mt-0.5">Preemptive Fixes Live</span>
          </div>
        </div>
      </section>

      {/* 3. CAPABILITIES GRID */}
      <section className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-xs font-mono font-bold text-blue-600 uppercase tracking-widest">Interactive Core Pillars</h2>
          <p className="text-xl font-black text-slate-800 uppercase tracking-wide">Autonomous Civic Dispatch Features</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6" id="landing-capabilities">
          {/* Card 1 */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 text-left space-y-4 hover:shadow-md transition-all group">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 group-hover:bg-blue-600 group-hover:text-white transition-all">
              <MapPin className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide">Interactive Satellite Grid</h3>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              A responsive Leaflet mapping viewport displaying high-density clusters, duplicate ticket overlays, and precise geographical coordinates.
            </p>
            <button 
              onClick={() => onNavigate("map")}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 group-hover:translate-x-1 transition-all text-left"
            >
              Launch Maps Grid →
            </button>
          </div>

          {/* Card 2 */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 text-left space-y-4 hover:shadow-md transition-all group">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 group-hover:bg-indigo-600 group-hover:text-white transition-all">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide">Voice-to-Complaint Scribe</h3>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              Report issues completely hands-free. State the issue vocally, and Gemini will autonomously summarize, classify, and calculate the appropriate severity.
            </p>
            <button 
              onClick={() => onNavigate("report")}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 group-hover:translate-x-1 transition-all text-left"
            >
              Try Voice Reporting →
            </button>
          </div>

          {/* Card 3 */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 text-left space-y-4 hover:shadow-md transition-all group">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100 group-hover:bg-amber-600 group-hover:text-white transition-all">
              <Award className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide">Citizen Gamification</h3>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              Earn Civic XP and exclusive community badges like "Clog Master" or "Pothole Patrol" by verifying reports, upvoting duplicates, and writing helper feedback.
            </p>
            <button 
              onClick={() => onNavigate("dashboard")}
              className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1 group-hover:translate-x-1 transition-all text-left"
            >
              View Rewards Hub →
            </button>
          </div>
        </div>
      </section>

      {/* 4. WORKFLOW MAP ILLUSTRATION */}
      <section className="bg-slate-100 border border-slate-200 rounded-2xl p-6 md:p-8 text-left space-y-4">
        <h3 className="text-xs font-mono font-bold text-slate-500 uppercase tracking-widest">Autonomous Pipeline Flow</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-xs text-slate-600">
          <div className="space-y-1 bg-white p-4 rounded-xl border border-slate-200/60 shadow-3xs">
            <span className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-[10px] font-mono mb-2">01</span>
            <h4 className="font-bold text-slate-800 uppercase">Input Capture</h4>
            <p className="text-[11px] font-medium text-slate-500">Citizen speaks a hazard description or uploads an on-site photo.</p>
          </div>
          <div className="space-y-1 bg-white p-4 rounded-xl border border-slate-200/60 shadow-3xs">
            <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[10px] font-mono mb-2">02</span>
            <h4 className="font-bold text-slate-800 uppercase">Gemini Parsing</h4>
            <p className="text-[11px] font-medium text-slate-500">AI converts speech to structured Title, Category, and Severity score.</p>
          </div>
          <div className="space-y-1 bg-white p-4 rounded-xl border border-slate-200/60 shadow-3xs">
            <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-[10px] font-mono mb-2">03</span>
            <h4 className="font-bold text-slate-800 uppercase">Duplicate Audit</h4>
            <p className="text-[11px] font-medium text-slate-500">The vector engine audits past records, warning if a similar fault exists.</p>
          </div>
          <div className="space-y-1 bg-white p-4 rounded-xl border border-slate-200/60 shadow-3xs">
            <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-[10px] font-mono mb-2">04</span>
            <h4 className="font-bold text-slate-800 uppercase">City Action</h4>
            <p className="text-[11px] font-medium text-slate-500">City Admins assign repair dispatches; citizens gain XP upon resolution.</p>
          </div>
        </div>
      </section>

    </div>
  );
}
