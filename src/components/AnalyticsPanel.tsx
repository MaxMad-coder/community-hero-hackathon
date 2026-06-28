/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AIAnalytics, PredictiveInsight, IssueCategory } from "../types.js";

interface AnalyticsPanelProps {
  analytics: AIAnalytics | null;
  predictive: PredictiveInsight | null;
  onSelectMapCoordinates?: (lat: number, lng: number) => void;
}

export default function AnalyticsPanel({ analytics, predictive, onSelectMapCoordinates }: AnalyticsPanelProps) {
  if (!analytics) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-450 bg-white border border-slate-200 rounded-xl shadow-sm">
        <span className="text-sm font-semibold">Synthesizing AI Audit Aggregations...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 text-slate-800" id="analytics-panel-wrapper">
      
      {/* 1. Core Summary Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4" id="analytics-grid-metrics">
        <div className="bg-white border border-slate-200 p-5 rounded-xl flex flex-col justify-between shadow-sm">
          <span className="text-xs text-slate-450 font-bold font-mono uppercase tracking-wider">Top Recurrent Issue</span>
          <span className="text-lg font-black text-slate-900 mt-2 truncate">{analytics.mostCommonCategory}</span>
          <span className="text-[10px] text-emerald-600 font-semibold mt-1">Requires dispatch prioritization</span>
        </div>
        <div className="bg-white border border-slate-200 p-5 rounded-xl flex flex-col justify-between shadow-sm">
          <span className="text-xs text-slate-450 font-bold font-mono uppercase tracking-wider">Hotspot Cluster Zone</span>
          <span className="text-lg font-black text-slate-900 mt-2 truncate">{analytics.mostAffectedArea}</span>
          <span className="text-[10px] text-blue-600 font-semibold mt-1">SOMA District high concentration</span>
        </div>
        <div className="bg-white border border-slate-200 p-5 rounded-xl flex flex-col justify-between shadow-sm">
          <span className="text-xs text-slate-450 font-bold font-mono uppercase tracking-wider">Mean Resolution Speed</span>
          <span className="text-lg font-black text-slate-900 mt-2">{analytics.averageResolutionTimeHours} Hrs</span>
          <span className="text-[10px] text-emerald-600 font-semibold mt-1">↑ 14% improvement over last week</span>
        </div>
        <div className="bg-white border border-slate-200 p-5 rounded-xl flex flex-col justify-between shadow-sm">
          <span className="text-xs text-slate-450 font-bold font-mono uppercase tracking-wider">Active Watchers</span>
          <span className="text-lg font-black text-slate-900 mt-2">1,482 Residents</span>
          <span className="text-[10px] text-amber-600 font-semibold mt-1">Dynamic gamification active</span>
        </div>
      </div>

      {/* 2. Qualitative AI Analysis Banner */}
      <div className="bg-blue-50/50 border border-blue-100 p-6 rounded-xl hover:bg-blue-50/70 transition-all shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[10px] bg-blue-100 text-blue-700 font-mono font-bold px-2 py-0.5 rounded-full border border-blue-200 uppercase tracking-wider">City AI Scientist</span>
          <h4 className="text-[10.5px] font-bold text-blue-800 uppercase tracking-widest font-mono">Real-Time Executive Summary</h4>
        </div>
        <div className="text-xs md:text-sm text-slate-700 leading-relaxed space-y-2 whitespace-pre-line font-medium">
          {analytics.summaryMessage}
        </div>
      </div>

      {/* 3. Category Distribution Charts (CSS bar graphics) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Category breakdown */}
        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm">
          <h3 className="text-xs font-bold text-slate-700 mb-4 font-mono uppercase tracking-wider">Fault Distribution By Category</h3>
          <div className="space-y-4">
            {analytics.categoryDistribution.map((item, idx) => {
              const maxVal = Math.max(...analytics.categoryDistribution.map(c => c.count));
              const pct = maxVal > 0 ? (item.count / maxVal) * 100 : 0;
              return (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-800">{item.category}</span>
                    <span className="font-mono text-slate-500 font-bold">{item.count} reports</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div className="bg-blue-600 h-full rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Severity levels breakdown */}
        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm">
          <h3 className="text-xs font-bold text-slate-700 mb-4 font-mono uppercase tracking-wider">Fault Intensity & Severity Breakdown</h3>
          <div className="space-y-4 block">
            {analytics.severityDistribution.map((item, idx) => {
              const maxVal = Math.max(...analytics.severityDistribution.map(s => s.count));
              const pct = maxVal > 0 ? (item.count / maxVal) * 100 : 0;
              
              const getSeverColor = (severity: string) => {
                switch (severity) {
                  case "Critical": return "bg-red-500";
                  case "High": return "bg-orange-500";
                  case "Medium": return "bg-amber-500";
                  case "Low": return "bg-emerald-500";
                  default: return "bg-slate-500";
                }
              };

              return (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-800">{item.severity}</span>
                    <span className="font-mono text-slate-500 font-bold">{item.count} instances</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div className={`${getSeverColor(item.severity)} h-full rounded-full`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. Predictive Hotspot Analysis Insights (Gemini Prognostics) */}
      {predictive && (
        <div className="space-y-6" id="predictive-insights-block">
          <div className="border-t border-slate-200 pt-6">
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
              Gemini Automated Predictive Hotspots
            </h2>
            <p className="text-xs text-slate-500 mt-1">Synthesizing live sensor data + civic histories to chart high-risk grid corridors.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {predictive.hotspots.map((spot, idx) => {
              const rLevel = spot.riskLevel;
              const rColor = rLevel === "Critical" ? "text-red-700 bg-red-50 border-red-100" :
                             rLevel === "High" ? "text-orange-700 bg-orange-50 border-orange-100" :
                             rLevel === "Medium" ? "text-amber-700 bg-amber-50 border-amber-100" :
                             "text-emerald-700 bg-emerald-50 border-emerald-100";
              
              return (
                <div key={idx} className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between shadow-sm">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono text-slate-500 uppercase tracking-widest font-bold">{spot.areaName}</span>
                      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${rColor}`}>{rLevel} ({spot.riskScore}%)</span>
                    </div>
                    <div className="text-sm font-bold text-slate-800 mt-2">Predicted: {spot.predictedCategory} Failure</div>
                    <p className="text-xs text-slate-500 leading-relaxed mt-1">{spot.reasoning}</p>
                  </div>
                  
                  {onSelectMapCoordinates && (
                    <button 
                      onClick={() => onSelectMapCoordinates(spot.lat, spot.lng)}
                      className="text-xs text-blue-600 font-semibold mt-4 hover:text-blue-700 flex items-center gap-1 hover:underline text-left pointer-events-auto"
                    >
                      📍 Zoom in Satellite Grid -&gt;
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Systemic Infrastructure Failures suggestions */}
          <div className="bg-white border border-slate-200 p-5 rounded-xl space-y-4 shadow-sm">
            <h3 className="text-xs font-bold text-blue-600 uppercase tracking-widest font-mono">Systemic Failure Preemptive Solutions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {predictive.recurringFailures.map((failure, idx) => (
                <div key={idx} className="space-y-2 border-l-2 border-blue-400 pl-4">
                  <h4 className="text-xs font-bold text-slate-800 uppercase">{failure.infrastructureType}</h4>
                  <p className="text-xs text-slate-500"><strong className="text-slate-700">Target Hotspots:</strong> {failure.locationPattern}</p>
                  <p className="text-xs text-blue-700 font-medium"><strong className="text-blue-800 font-semibold">AI Recommended Mitigation:</strong> {failure.suggestedPreemptiveAction}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
