import React, { useState, useEffect, useRef } from "react";
import { 
  Bot, 
  MessageSquare, 
  Send, 
  Plus, 
  X, 
  Sparkles, 
  ChevronUp, 
  Loader2, 
  CornerDownRight, 
  HelpCircle,
  Clock,
  User as UserIcon,
  ChevronRight,
  Maximize2
} from "lucide-react";
import { User, ChatSession, ChatMessage } from "../types.js";

interface AICivicAssistantProps {
  token: string | null;
  currentUser: User | null;
  isFloatingOpen: boolean;
  setIsFloatingOpen: (open: boolean) => void;
  activeTab: "map" | "analytics" | "leaderboard" | "assistant";
  setActiveTab: (tab: "map" | "analytics" | "leaderboard" | "assistant") => void;
}

export default function AICivicAssistant({
  token,
  currentUser,
  isFloatingOpen,
  setIsFloatingOpen,
  activeTab,
  setActiveTab
}: AICivicAssistantProps) {
  // Chat States
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([
    "Show my pending complaints",
    "What is happening with Issue #issue_1?",
    "Which areas have the most reports?",
    "How many issues were resolved this week?",
    "What should I verify nearby?"
  ]);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Fetch initial suggestions and history
  useEffect(() => {
    if (token) {
      fetchSuggestions();
      fetchHistory();
    }
  }, [token]);

  // Scroll to bottom when messages list updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const fetchSuggestions = async () => {
    try {
      const res = await fetch("/assistant/suggestions", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.suggestions && data.suggestions.length > 0) {
          setSuggestions(data.suggestions);
        }
      }
    } catch (err) {
      console.warn("[Assistant] Suggestions load failed:", err);
    }
  };

  const fetchHistory = async () => {
    if (!token) return;
    setHistoryLoading(true);
    try {
      const res = await fetch("/assistant/history", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions || []);
        // Set active session to first session if none exists
        if (data.sessions && data.sessions.length > 0 && !activeSessionId) {
          handleSelectSession(data.sessions[0].id);
        }
      }
    } catch (err) {
      console.warn("[Assistant] History load failed:", err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleSelectSession = async (sessionId: string) => {
    setActiveSessionId(sessionId);
    try {
      const res = await fetch(`/assistant/session/${sessionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch (err) {
      console.error("[Assistant] Failed to fetch session messages:", err);
    }
  };

  const startNewChat = () => {
    setActiveSessionId(null);
    setMessages([]);
    setChatInput("");
  };

  const handleSendMessage = async (textToSend: string) => {
    if (!token) return;
    const trimmed = textToSend.trim();
    if (!trimmed) return;

    // Fast local optimistic UI insert for user
    const userMsgTemp: ChatMessage = {
      id: `temp_u_${Date.now()}`,
      sessionId: activeSessionId || "",
      role: "user",
      text: trimmed,
      createdAt: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMsgTemp]);
    setChatInput("");
    setLoading(true);

    try {
      const res = await fetch("/assistant/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          message: trimmed,
          sessionId: activeSessionId
        })
      });

      if (res.ok) {
        const data = await res.json();
        // Update session ID if it was a new session
        if (!activeSessionId && data.session) {
          setActiveSessionId(data.session.id);
          // Insert the session into history list
          setSessions(prev => [data.session, ...prev]);
        }
        
        // Replace temp optimistic messages with final message history
        if (data.session) {
          const mRes = await fetch(`/assistant/session/${data.session.id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (mRes.ok) {
            const mData = await mRes.json();
            setMessages(mData.messages || []);
          }
        }
      } else {
        throw new Error("Chat dispatch status failed");
      }
    } catch (err) {
      console.error("[Assistant] Chat failure:", err);
      // Place an error message
      const errorMsg: ChatMessage = {
        id: `temp_err_${Date.now()}`,
        sessionId: activeSessionId || "",
        role: "model",
        text: "Municipal networks are currently experiencing high demand. Reconnecting standard backup dispatch. Let me know if I should retry.",
        createdAt: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
      // Refresh list to make sure titles update dynamically
      fetchHistory();
    }
  };

  // Custom regex-based Markdown text formatter to prevent markup slop while staying lightweight
  const renderFormattedMarkdown = (text: string) => {
    if (!text) return null;
    
    const lines = text.split("\n");
    return lines.map((line, blockIdx) => {
      let content = line.trim();
      
      // Headers
      if (content.startsWith("###")) {
        return <h4 key={blockIdx} className="text-sm font-bold text-slate-900 mt-3 mb-1.5 font-sans uppercase tracking-wider">{content.replace("###", "").trim()}</h4>;
      }
      if (content.startsWith("##")) {
        return <h3 key={blockIdx} className="text-base font-black text-slate-900 mt-4 mb-2 border-b border-slate-100 pb-1">{content.replace("##", "").trim()}</h3>;
      }
      if (content.startsWith("#")) {
        return <h2 key={blockIdx} className="text-lg font-black text-blue-900 mt-4 mb-2">{content.replace("#", "").trim()}</h2>;
      }

      // Bullets
      if (content.startsWith("- ") || content.startsWith("* ")) {
        const bulletText = content.substring(2);
        return (
          <div key={blockIdx} className="flex items-start gap-2 my-1 text-slate-700 leading-relaxed pl-1">
            <span className="text-blue-500 font-bold mt-1 text-xs">•</span>
            <span className="text-xs font-sans">{parseInlineStyles(bulletText)}</span>
          </div>
        );
      }

      // Plain paragraph
      if (content.length === 0) {
        return <div key={blockIdx} className="h-2"></div>;
      }

      return (
        <p key={blockIdx} className="text-xs text-slate-700 leading-relaxed font-sans my-1.5">
          {parseInlineStyles(content)}
        </p>
      );
    });
  };

  const parseInlineStyles = (text: string) => {
    // Basic regex styling for **bold** and `code`
    const boldRegex = /\*\*(.*?)\*\*/g;
    const codeRegex = /`(.*?)`/g;
    
    let parts = [];
    let currentIdx = 0;
    
    // Process markdown symbols safely
    const formatted = text
      .split(boldRegex)
      .map((part, i) => {
        if (i % 2 === 1) {
          return <strong key={i} className="font-bold text-slate-900">{part}</strong>;
        }
        // Nest code regex
        return part.split(codeRegex).map((codePart, j) => {
          if (j % 2 === 1) {
            return <code key={`${i}-${j}`} className="bg-slate-100 text-slate-800 px-1 py-0.5 rounded font-mono text-[10px] border border-slate-200">{codePart}</code>;
          }
          return codePart;
        });
      });

    return formatted;
  };

  // RENDER FLOATING WIDGET OR FULL-SCREEN VIEW
  if (activeTab === "assistant") {
    // --- FULL-SCREEN ASSISTANT VIEW ---
    return (
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col md:flex-row h-[650px]" id="fullscreen-assistant-viewer">
        
        {/* SIDEBAR: CHAT HISTORY */}
        <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-slate-200 flex flex-col bg-slate-50">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <span className="text-xs font-bold font-sans text-slate-700 tracking-wider uppercase flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
              Chat History
            </span>
            <button 
              onClick={startNewChat}
              className="p-1 px-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1 text-[10px] font-bold transition-all shadow-xs cursor-pointer"
              title="Start New Conversation"
            >
              <Plus className="w-3 h-3" />
              New Chat
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {historyLoading ? (
              <div className="flex items-center justify-center p-8 text-xs text-slate-400 font-mono">
                <Loader2 className="w-4 h-4 animate-spin mr-1.5 text-blue-500" />
                Loading logs...
              </div>
            ) : sessions.length === 0 ? (
              <div className="text-center p-6 text-[11px] text-slate-400 font-medium">
                No conversation history yet. Start one now!
              </div>
            ) : (
              sessions.map((session) => {
                const isActive = session.id === activeSessionId;
                return (
                  <button
                    key={session.id}
                    onClick={() => handleSelectSession(session.id)}
                    className={`w-full text-left p-3 rounded-lg flex items-start gap-2.5 transition-all outline-none cursor-pointer group ${isActive ? "bg-white border border-slate-200 shadow-xs" : "hover:bg-slate-200/50"}`}
                  >
                    <MessageSquare className={`w-4 h-4 shrink-0 mt-0.5 ${isActive ? "text-blue-600" : "text-slate-400 group-hover:text-blue-500"}`} />
                    <div className="flex-1 min-w-0">
                      <div className={`text-xs font-semibold truncate ${isActive ? "text-slate-900" : "text-slate-600"}`}>
                        {session.title || "Civic Inquiry"}
                      </div>
                      <div className="text-[9px] font-mono text-slate-400 mt-1 flex items-center gap-1 text-left">
                        <Clock className="w-2.5 h-2.5" />
                        {new Date(session.updatedAt).toLocaleDateString()}
                      </div>
                    </div>
                    <ChevronRight className="w-3 h-3 text-slate-300 self-center opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                );
              })
            )}
          </div>

          {/* ALWAYS-VISIBLE CIVIC DISPATCH COMMAND OPTIONS */}
          <div className="p-3 bg-slate-100/90 border-t border-slate-200 space-y-2">
            <span className="text-[9px] font-mono text-slate-500 font-black uppercase tracking-widest flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500 animate-pulse" />
              Civic Hotkeys
            </span>
            <div className="space-y-1.5 flex flex-col font-sans">
              {suggestions.slice(0, 5).map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(q)}
                  className="w-full text-left text-[11px] font-semibold bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 p-2 rounded-lg transition-all text-slate-700 hover:text-blue-700 truncate cursor-pointer flex items-center gap-1 shadow-3xs hover:-translate-y-0.5 duration-150"
                  title={q}
                >
                  <CornerDownRight className="w-3 h-3 text-blue-500 shrink-0" />
                  {q}
                </button>
              ))}
            </div>
          </div>
          
          <div className="p-3 bg-slate-200/50 border-t border-slate-200 text-[10px] font-mono text-slate-400 text-center">
            City AI Coordinator v1.0.4
          </div>
        </div>

        {/* CHAT CONTAINER PANEL */}
        <div className="flex-1 flex flex-col min-w-0 bg-white">
          <div className="p-4 bg-slate-50 border-b border-slate-250 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 border border-blue-200 shadow-sm animate-pulse">
                <Bot className="w-4.5 h-4.5" />
              </div>
              <div className="text-left">
                <div className="text-xs font-black text-slate-950 flex items-center gap-1.5">
                  AI Civic Intelligence Officer
                  <span className="bg-emerald-100 text-emerald-800 text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider border border-emerald-200">Online</span>
                </div>
                <div className="text-[10px] font-mono text-slate-500 font-medium">SOMA Municipal Grounded RAG Expert</div>
              </div>
            </div>
          </div>

          {/* MESSAGE LOGS THREAD */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-slate-50/50">
            {messages.length === 0 ? (
              <div className="max-w-md mx-auto text-center space-y-5 pt-8">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto border border-blue-100 shadow-xs mb-2">
                  <Sparkles className="w-6 h-6 animate-pulse" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">Hello {currentUser?.fullName || "Citizen"}!</h3>
                  <p className="text-xs text-slate-500 leading-relaxed font-sans font-medium">
                    I am connected to the Community Hero municipal database. Ask me anything about your reported issues, upcoming repair schedules, area concerns, or how to accelerate city priorities!
                  </p>
                </div>
                
                {/* SUGGESTED QUESTIONS GRID */}
                <div className="space-y-2.5 pt-4">
                  <div className="text-[10px] font-mono text-blue-600 font-bold uppercase tracking-wider flex items-center gap-1 justify-center">
                    <HelpCircle className="w-3.5 h-3.5" />
                    Suggested Inquiries
                  </div>
                  <div className="grid grid-cols-1 gap-2.5">
                    {suggestions.slice(0, 5).map((q, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSendMessage(q)}
                        className="text-left text-xs bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 p-3 rounded-xl transition-all cursor-pointer font-sans shadow-2xs font-semibold text-slate-700 flex items-center gap-2 group hover:-translate-y-0.5 duration-200"
                      >
                        <CornerDownRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-500 shrink-0" />
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              messages.map((m) => {
                const isUser = m.role === "user";
                return (
                  <div key={m.id} className={`flex gap-3 max-w-4xl mx-auto ${isUser ? "justify-end" : "justify-start"}`}>
                    {!isUser && (
                      <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 border border-blue-200 mt-1 shrink-0 shadow-2xs">
                        <Bot className="w-4 h-4" />
                      </div>
                    )}
                    
                    <div className="space-y-1 max-w-[85%]">
                      <div className={`p-4 rounded-2xl text-left shadow-2xs ${isUser ? "bg-blue-600 text-white rounded-br-none" : "bg-white border border-slate-200 text-slate-850 rounded-bl-none"}`}>
                        {isUser ? (
                          <p className="text-xs font-sans leading-relaxed break-words font-semibold">{m.text}</p>
                        ) : (
                          <div className="space-y-1 max-w-none prose prose-slate">
                            {renderFormattedMarkdown(m.text)}
                          </div>
                        )}
                      </div>
                      <div className={`text-[9px] font-mono text-slate-400 font-medium ${isUser ? "text-right" : "text-left ml-2"}`}>
                        {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>

                    {isUser && (
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700 border border-emerald-200 mt-1 shrink-0 shadow-2xs">
                        <UserIcon className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                );
              })
            )}

            {/* TYPING INDICATOR */}
            {loading && (
              <div className="flex gap-3 max-w-2xl mx-auto justify-start animate-fade-in">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 border border-blue-200 shrink-0 shadow-2xs">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-white border border-slate-200 p-4 rounded-2xl rounded-bl-none max-w-xs flex items-center gap-2.5 shadow-2xs">
                  <div className="flex gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-400 animate-bounce delay-100"></span>
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-bounce delay-200"></span>
                    <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce delay-300"></span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 font-semibold uppercase tracking-wider">AI compiling dispatcher logs...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

           {/* INPUT DISPATCH CONTROLS */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-3">
            {messages.length > 0 && (
              <div className="space-y-1.5 max-w-5xl mx-auto">
                <span className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider block">Suggested followups:</span>
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
                  {suggestions.slice(0, 5).map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(q)}
                      className="shrink-0 text-xs text-slate-600 hover:text-blue-600 bg-white hover:bg-blue-50/50 border border-slate-200 hover:border-blue-300/60 p-2 px-3 rounded-full transition-all cursor-pointer font-semibold font-sans shadow-3xs"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <form 
              onSubmit={(e) => { e.preventDefault(); handleSendMessage(chatInput); }}
              className="flex items-center gap-2.5 bg-white border border-slate-250 p-1.5 rounded-xl max-w-5xl mx-auto shadow-xs"
            >
              <input
                type="text"
                placeholder="Ask about active SOMA updates, schedule timeline summaries..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className="flex-1 bg-transparent px-3 text-xs outline-none text-slate-900 py-1.5 font-sans"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !chatInput.trim()}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 text-white p-2.5 rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                <Send className="w-4.5 h-4.5" />
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // --- FLOATING COLLAPSED CHATBOT WIDGET ---
  return (
    <div className="fixed bottom-6 right-6 z-[9999] font-sans" id="floating-assistant-widget">
      {isFloatingOpen ? (
        // Expanded Panel
        <div className="bg-white border border-slate-200 w-80 md:w-96 rounded-2xl shadow-2xl flex flex-col h-[480px] overflow-hidden border-t-4 border-t-blue-600 animate-in fade-in slide-in-from-bottom-4 duration-300">
          
          {/* Header */}
          <div className="p-3.5 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white border border-blue-500">
                <Bot className="w-4 h-4 animate-pulse" />
              </div>
              <div className="text-left">
                <div className="text-xs font-black tracking-tight">Civic Assistant</div>
                <div className="text-[9px] font-mono text-slate-300">Active RAG Heuristics Terminal</div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button 
                onClick={() => { setIsFloatingOpen(false); setActiveTab("assistant"); }}
                className="p-1 hover:bg-white/10 rounded text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="Expand Fullscreen"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
              <button 
                onClick={() => setIsFloatingOpen(false)}
                className="p-1 hover:bg-white/10 rounded text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Messages Grid */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-slate-50/50">
            {messages.length === 0 ? (
              <div className="text-center p-4 space-y-3 pt-6">
                <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100 mx-auto shadow-xs">
                  <Sparkles className="w-4.5 h-4.5 animate-pulse" />
                </div>
                <div className="space-y-1.5">
                  <h4 className="text-xs font-black text-slate-900 uppercase">Civic Intelligence Console</h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed font-sans max-w-[220px] mx-auto">
                    Type a question or select a quick query option below to poll the database:
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-1.5 pt-2 text-left">
                  {suggestions.slice(0, 3).map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(q)}
                      className="text-left text-[11px] bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 p-2 px-2.5 rounded-lg transition-all cursor-pointer font-medium text-slate-600 truncate flex items-center gap-1.5"
                    >
                      <CornerDownRight className="w-3 h-3 text-slate-400 shrink-0" />
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((m) => {
                const isUser = m.role === "user";
                return (
                  <div key={m.id} className={`flex gap-2 text-left ${isUser ? "justify-end" : "justify-start"}`}>
                    {!isUser && (
                      <div className="w-6 h-6 rounded bg-blue-100 flex items-center justify-center text-blue-600 border border-blue-200 mt-1 shrink-0 shadow-3xs">
                        <Bot className="w-3 h-3" />
                      </div>
                    )}
                    <div className="space-y-0.5 max-w-[80%]">
                      <div className={`p-2.5 rounded-xl text-[11px] leading-relaxed break-words shadow-3xs ${isUser ? "bg-blue-600 text-white rounded-br-none" : "bg-white border border-slate-200 text-slate-800 rounded-bl-none"}`}>
                        {isUser ? (
                          <span className="font-semibold">{m.text}</span>
                        ) : (
                          <div className="space-y-1 prose prose-slate">
                            {renderFormattedMarkdown(m.text)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}

            {loading && (
              <div className="flex gap-2 justify-start animate-fade-in text-left">
                <div className="w-6 h-6 rounded bg-blue-100 flex items-center justify-center text-blue-600 border border-blue-200 shrink-0 shadow-3xs">
                  <Bot className="w-3 h-3" />
                </div>
                <div className="bg-white border border-slate-200 p-2.5 rounded-xl rounded-bl-none max-w-[200px] flex items-center gap-2 shadow-3xs">
                  <Loader2 className="w-3 h-3 animate-spin text-blue-600 shrink-0" />
                  <span className="text-[9px] font-mono text-slate-400 font-bold uppercase tracking-wider">Piping logs...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick suggestions block */}
          {messages.length > 0 && (
            <div className="bg-slate-100 p-2 border-t border-slate-200 flex gap-1.5 overflow-x-auto scrollbar-none">
              {suggestions.slice(0, 3).map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(q)}
                  className="shrink-0 text-[10px] bg-white text-slate-600 hover:text-blue-600 border border-slate-200 px-2.5 py-1 rounded-full whitespace-nowrap font-sans font-semibold shadow-3xs cursor-pointer"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input Area */}
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSendMessage(chatInput); }}
            className="p-2 border-t border-slate-200 flex items-center bg-slate-50 gap-2"
          >
            <input
              type="text"
              placeholder="Ask about your issues..."
              className="flex-1 text-xs px-2 py-1.5 rounded-lg border border-slate-250 bg-white outline-none font-sans"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              disabled={loading}
              required
            />
            <button
              type="submit"
              disabled={loading || !chatInput.trim()}
              className="p-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 text-white rounded-lg transition-colors cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>

        </div>
      ) : (
        // Closed circular launcher button
        <button
          onClick={() => setIsFloatingOpen(true)}
          className="w-14 h-14 bg-gradient-to-tr from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white rounded-full flex items-center justify-center shadow-2xl transition-all cursor-pointer group hover:-translate-y-1 active:scale-95 duration-200 border-2 border-white/80"
          title="Open AI Civic Assistant"
          id="assistant-launcher-bubble"
        >
          <div className="relative">
            <Bot className="w-6.5 h-6.5 group-hover:rotate-12 transition-transform duration-300" />
            <span className="absolute -top-1 -right-1.5 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
          </div>
        </button>
      )}
    </div>
  );
}
