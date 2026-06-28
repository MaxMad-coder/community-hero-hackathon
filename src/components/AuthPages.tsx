import React, { useState } from "react";
import { Lock, Mail, User, Shield, AlertCircle, Key, Landmark, Eye, EyeOff } from "lucide-react";

interface AuthPagesProps {
  onAuthSuccess: (token: string, user: any) => void;
  initialMode?: "login" | "register";
}

export default function AuthPages({ onAuthSuccess, initialMode = "login" }: AuthPagesProps) {
  const [authMode, setAuthMode] = useState<"login" | "register">(initialMode);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"citizen" | "admin">("citizen");
  const [neighborhood, setNeighborhood] = useState("SOMA District");
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);

    const endpoint = authMode === "login" ? "/api/auth/login" : "/api/auth/register";
    const body: any = { email, password };
    if (authMode === "register") {
      body.fullName = fullName || email.split("@")[0];
      body.role = role;
    }

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (res.ok && data.token && data.user) {
        onAuthSuccess(data.token, data.user);
      } else {
        setAuthError(data.error || "Authentication failed. Please verify credentials.");
      }
    } catch (err: any) {
      console.error(err);
      setAuthError("Network server authentication timeout. Ensure API is online.");
    } finally {
      setAuthLoading(false);
    }
  };

  const autofillUser = (userType: "citizen" | "admin") => {
    setAuthMode("login");
    setAuthError(null);
    if (userType === "citizen") {
      setEmail("jane@community.org");
      setPassword("jane123");
    } else {
      setEmail("admin@community.org");
      setPassword("admin123");
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden animate-fade-in my-6 font-sans" id="auth-panel">
      
      {/* Upper header */}
      <div className="bg-slate-900 px-6 py-8 text-center text-white relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-600/20 via-transparent to-transparent pointer-events-none" />
        <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mx-auto text-xl font-bold shadow-md border border-blue-400/30 mb-3">
          🔑
        </div>
        <h3 className="text-lg font-black uppercase tracking-wider">Citizen Access Terminal</h3>
        <p className="text-[10px] text-slate-400 font-mono mt-1 uppercase tracking-widest">Community Hero Secure Node Verification</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-150 bg-slate-50">
        <button
          onClick={() => { setAuthMode("login"); setAuthError(null); }}
          className={`flex-1 text-center py-3.5 text-xs font-bold transition-all border-r border-slate-150 ${authMode === "login" ? "text-blue-600 bg-white border-b-2 border-b-blue-600" : "text-slate-400 hover:text-slate-600"}`}
        >
          CITIZEN SIGN IN
        </button>
        <button
          onClick={() => { setAuthMode("register"); setAuthError(null); }}
          className={`flex-1 text-center py-3.5 text-xs font-bold transition-all ${authMode === "register" ? "text-blue-600 bg-white border-b-2 border-b-blue-600" : "text-slate-400 hover:text-slate-600"}`}
        >
          REGISTER RESIDENT
        </button>
      </div>

      {/* Body form */}
      <div className="p-6 md:p-8 space-y-6">
        
        {/* Preseeded helper credentials */}
        <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-xl space-y-2">
          <div className="text-[10px] font-bold text-blue-700 uppercase tracking-widest flex items-center gap-1.5 font-mono">
            <Shield className="w-3.5 h-3.5 text-blue-500" />
            Rapid Sandbox Autofill Credentials
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => autofillUser("citizen")}
              className="py-1.5 px-2.5 bg-white border border-blue-150 hover:bg-blue-50 text-blue-700 hover:text-blue-800 rounded-lg text-[10px] font-bold transition-colors cursor-pointer shadow-3xs"
            >
              👤 Jane (Citizen)
            </button>
            <button
              onClick={() => autofillUser("admin")}
              className="py-1.5 px-2.5 bg-white border border-blue-150 hover:bg-blue-50 text-blue-700 hover:text-blue-800 rounded-lg text-[10px] font-bold transition-colors cursor-pointer shadow-3xs"
            >
              👑 Alex (City Admin)
            </button>
          </div>
        </div>

        <form onSubmit={handleAuthSubmit} className="space-y-4 text-left">
          {authMode === "register" && (
            <div className="space-y-1">
              <label className="block text-[10px] font-mono uppercase text-slate-500 tracking-wider font-extrabold">Citizen Full Name</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none">
                  <User className="w-3.5 h-3.5" />
                </span>
                <input
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="Jane Doe"
                  required
                  className="w-full bg-slate-50 border border-slate-200 pl-9 pr-3 py-2 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-blue-500 font-medium"
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="block text-[10px] font-mono uppercase text-slate-500 tracking-wider font-extrabold">Secure Email Node</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none">
                <Mail className="w-3.5 h-3.5" />
              </span>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="jane@community.org"
                required
                className="w-full bg-slate-50 border border-slate-200 pl-9 pr-3 py-2 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-blue-500 font-medium"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] font-mono uppercase text-slate-500 tracking-wider font-extrabold">Account Key Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none">
                <Key className="w-3.5 h-3.5" />
              </span>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-slate-50 border border-slate-200 pl-9 pr-10 py-2 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-blue-500 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {authMode === "register" && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-[10px] font-mono uppercase text-slate-500 tracking-wider font-extrabold">Pre-seeded Role</label>
                <select
                  value={role}
                  onChange={e => setRole(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-blue-500 h-9 font-medium"
                >
                  <option value="citizen">Citizen Account</option>
                  <option value="admin">City Architect (Admin)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-mono uppercase text-slate-500 tracking-wider font-extrabold">Sector Ward</label>
                <select
                  value={neighborhood}
                  onChange={e => setNeighborhood(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-blue-500 h-9 font-medium"
                >
                  <option value="SOMA District">SOMA District</option>
                  <option value="Mission Ward">Mission Ward</option>
                  <option value="Tenderloin Sec">Tenderloin Sec</option>
                  <option value="Castro Ward">Castro Ward</option>
                  <option value="Marina Point">Marina Point</option>
                </select>
              </div>
            </div>
          )}

          {authError && (
            <div className="text-[11px] text-red-600 bg-red-50 border border-red-200 px-3 py-2.5 rounded-lg flex items-start gap-1.5 font-medium leading-relaxed">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span>{authError}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={authLoading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black text-xs py-2.5 rounded-lg uppercase tracking-wider transition-all cursor-pointer shadow-md active:scale-99 disabled:bg-blue-300"
          >
            {authLoading ? "Initializing Terminal Sync..." : authMode === "login" ? "Verify Credentials" : "Authorize New Node"}
          </button>
        </form>

        <div className="text-center">
          <p className="text-[10px] text-slate-450 font-mono">
            {authMode === "login" ? "Don't have an active ward pass?" : "Already registered your citizen badge?"}{" "}
            <button
              onClick={() => { setAuthMode(authMode === "login" ? "register" : "login"); setAuthError(null); }}
              className="text-blue-600 hover:underline font-bold"
            >
              {authMode === "login" ? "Register Resident" : "Log In Citizen"}
            </button>
          </p>
        </div>

      </div>
    </div>
  );
}
