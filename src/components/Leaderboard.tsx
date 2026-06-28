/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { User } from "../types.js";

interface LeaderboardProps {
  users: User[];
  currentUser: User | null;
}

export default function Leaderboard({ users, currentUser }: LeaderboardProps) {
  // Sort user scores
  const sorted = [...users].sort((a,b) => b.points - a.points);

  const getCitizenLevel = (pts: number) => {
    if (pts >= 500) return { title: "Civic Champion (Lvl 5)", color: "text-rose-700 bg-rose-50 border border-rose-100/80" };
    if (pts >= 300) return { title: "Local Leader (Lvl 4)", color: "text-amber-700 bg-amber-50 border border-amber-105/80" };
    if (pts >= 150) return { title: "First Responder (Lvl 3)", color: "text-blue-700 bg-blue-50 border border-blue-100/80" };
    if (pts >= 50) return { title: "Active Vigilant (Lvl 2)", color: "text-emerald-700 bg-emerald-50 border border-emerald-100/80" };
    return { title: "Starter Guard (Lvl 1)", color: "text-slate-700 bg-slate-100 border border-slate-250" };
  };

  return (
    <div className="bg-white border border-slate-200 p-6 rounded-2xl space-y-6 shadow-sm text-slate-800" id="gamification-leaderboard">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-1.5">
            🏆 Community Champions Leaderboard
          </h2>
          <p className="text-xs text-slate-500 mt-1">Sponsoring active validation, reporting accuracy, and civic resolution actions.</p>
        </div>
        <div className="bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-lg text-xs font-mono text-blue-800 font-bold">
          🎮 Rewards active: Reporting (+50Xp) | Verifying (+20Xp)
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-700">
          <thead className="text-[10px] text-slate-400 font-mono uppercase tracking-wider border-b border-slate-200">
            <tr>
              <th className="py-3 px-4">Rank</th>
              <th className="py-3 px-4">Resident</th>
              <th className="py-3 px-4 text-center">Level Status</th>
              <th className="py-3 px-4">Clutch Badges</th>
              <th className="py-3 px-4 text-right">XP Points</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sorted.map((user, idx) => {
              const rank = idx + 1;
              const isMe = currentUser?.id === user.id;
              const level = getCitizenLevel(user.points);

              return (
                <tr key={user.id} className={`${isMe ? "bg-blue-50/40 font-semibold" : "hover:bg-slate-50/50"} transition-colors`}>
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                    {rank === 1 ? "🥇 1" : rank === 2 ? "🥈 2" : rank === 3 ? "🥉 3" : `   ${rank}`}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <span className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center font-bold text-xs uppercase text-blue-600 border border-blue-100">
                        {user.fullName.slice(0, 2)}
                      </span>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-800 font-semibold">{user.fullName}</span>
                          {isMe && <span className="text-[10.1px] bg-blue-100 text-blue-700 px-1.5 py-0.2 rounded font-mono border border-blue-200">YOU</span>}
                        </div>
                        <span className="text-xs text-slate-400">{user.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${level.color}`}>
                      {level.title}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex flex-wrap gap-1">
                      {user.badges.map((badge, bIdx) => (
                        <span key={bIdx} className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-100">
                          🛡️ {badge}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-blue-600 font-bold">
                    {user.points.toLocaleString()} XP
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
