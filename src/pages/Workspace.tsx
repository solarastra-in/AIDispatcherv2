import { useState, useEffect, useRef } from "react";
import ChatHistorySidebar from "../components/ChatHistorySidebar";
import ExpandableComposer from "../components/ExpandableComposer";
import ModelAvailabilityPanel from "../components/ModelAvailabilityPanel";
import ContextPreviewPanel from "../components/ContextPreviewPanel";
import OutputArtifactPanel, { type OutputArtifact } from "../components/OutputArtifactPanel";
import CorroboratePanel from "../components/CorroboratePanel";
import RelayPanel from "../components/RelayPanel";
import FileUploadZone, { type UploadedFile, readAsBase64 } from "../components/FileUploadZone";
import PreprocessingToggle from "../components/PreprocessingToggle";
import { authedFetch } from "../lib/firebaseClient";
import { 
  MessageSquare, 
  Sparkles, 
  GitCompare, 
  Layers, 
  Paperclip, 
  Send, 
  Bot, 
  User, 
  Cpu, 
  AlertCircle, 
  RefreshCw, 
  CheckCircle2, 
  ChevronDown, 
  ChevronRight,
  Sliders,
  Maximize2,
  Minimize2,
  PanelLeftClose,
  PanelLeft,
  Copy,
  Check,
  Zap,
  Plus
} from "lucide-react";

type DispatchMode = "chat" | "corroborate" | "relay";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  artifact?: OutputArtifact;
  modelUsed?: string;
  providerUsed?: string;
  timestamp?: string;
  costUsd?: number;
}

export interface WorkspaceProps {
  prefilledPrompt?: string;
  prefilledModelId?: string;
  onClearPrefill?: () => void;
  onNewLedgerEntry?: (entry: any) => void;
  onNavigateTab?: (tab: string) => void;
}

export default function Workspace({
  prefilledPrompt,
  prefilledModelId,
  onClearPrefill,
  onNewLedgerEntry,
  onNavigateTab,
}: WorkspaceProps = {}) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionTitle, setSessionTitle] = useState<string>("Active Session");
  const [mode, setMode] = useState<DispatchMode>("chat");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [selectedModelIds, setSelectedModelIds] = useState<string[]>(prefilledModelId ? [prefilledModelId] : []);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [optimizeFiles, setOptimizeFiles] = useState(true);
  const [sending, setSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (prefilledModelId) {
      setSelectedModelIds([prefilledModelId]);
    }
  }, [prefilledModelId]);

  // Handle ESC key to exit full screen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFullScreen) {
        setIsFullScreen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullScreen]);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  const uploadedMimeTypes = uploadedFiles.map((f) => f.mimeType);

  // Load session messages when sessionId changes
  useEffect(() => {
    if (!sessionId) return;
    setErrorMessage(null);
    authedFetch(`/api/chat/sessions/${sessionId}`)
      .then(async (res) => {
        if (!res.ok) {
          throw new Error("Could not load session history");
        }
        const data = await res.json();
        if (data.title) setSessionTitle(data.title);
        if (Array.isArray(data.messages) && data.messages.length > 0) {
          setMessages(
            data.messages.map((m: any) => ({
              role: m.role,
              content: m.content,
              modelUsed: m.modelUsed || "auto-routed",
              providerUsed: m.providerUsed,
              timestamp: m.timestamp || new Date().toISOString(),
              artifact: m.artifact,
            }))
          );
        } else {
          setMessages([
            {
              role: "assistant",
              content: "Welcome to WhyOr Dispatch Workspace! Enter any prompt below to auto-dispatch across frontier & open models with adaptive context compression, or switch to Corroborate / Relay modes above.",
              modelUsed: "gemini-3.1-flash-lite",
              providerUsed: "google",
              timestamp: new Date().toISOString(),
            },
          ]);
        }
      })
      .catch((err) => {
        console.warn("Session fetch notice:", err.message);
        // Fallback default message
        setMessages([
          {
            role: "assistant",
            content: "Ready to dispatch. Enter your request below — WhyOr will select the most optimal model based on latency, cost, and task archetype.",
            modelUsed: "auto-router",
            timestamp: new Date().toISOString(),
          },
        ]);
      })
      .finally(() => setIsInitializing(false));
  }, [sessionId]);

  const handleCopyText = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  async function handleSend(effectivePrompt: string, rawUserPrompt: string, outputFormat: any) {
    if (!sessionId) {
      setErrorMessage("No active session selected. Creating a new chat session...");
      try {
        const res = await authedFetch("/api/chat/sessions", { method: "POST" });
        const data = await res.json();
        if (data && data.id) {
          setSessionId(data.id);
        }
      } catch (err: any) {
        setErrorMessage("Unable to initialize chat session. Please check your connection.");
        return;
      }
    }

    setSending(true);
    setErrorMessage(null);
    const userMsg: ChatMessage = {
      role: "user",
      content: rawUserPrompt,
      timestamp: new Date().toISOString(),
    };
    setMessages((m) => [...m, userMsg]);

    try {
      for (const f of uploadedFiles) {
        if (!f.base64) f.base64 = await readAsBase64(f.file);
      }

      const activeSession = sessionId || "session_default";

      const res = await authedFetch("/api/dispatch/output", {
        method: "POST",
        body: JSON.stringify({
          prompt: effectivePrompt,
          targetModelIds: selectedModelIds,
          provider: selectedModelIds.length > 0 ? (selectedModelIds[0].includes(":") ? selectedModelIds[0].split(":")[0] : "google") : "google",
          modelId: selectedModelIds.length > 0 ? (selectedModelIds[0].includes(":") ? selectedModelIds[0].split(":")[1] : selectedModelIds[0]) : "gemini-2.5-flash",
          outputFormat: outputFormat || "auto",
          sessionId: activeSession,
          skipPreprocessing: !optimizeFiles,
          files: uploadedFiles.map((f) => ({ mimeType: f.mimeType, base64Data: f.base64, filename: f.file.name })),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `Server responded with error status ${res.status}`);
      }

      const returnedModel = data.modelUsed || (selectedModelIds.length === 1 ? selectedModelIds[0] : "Auto-Optimized");
      const returnedProvider = data.providerUsed || "whyor";

      const assistantMsg: ChatMessage = {
        role: "assistant",
        content: data.text || (data.format !== "text" ? `Generated output file (${data.format.toUpperCase()})` : "Task completed successfully."),
        artifact: data.format !== "text" ? data : undefined,
        modelUsed: returnedModel,
        providerUsed: returnedProvider,
        timestamp: new Date().toISOString(),
      };

      setMessages((m) => [...m, assistantMsg]);
      setUploadedFiles([]);
      setShowFileUpload(false);
    } catch (e: any) {
      setErrorMessage(e.message || "Failed to dispatch request. Please check model credentials or retry.");
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: `⚠️ Dispatch Notice: ${e.message || "Request could not be completed."} (Check that API keys are configured or use the auto-routed Gemini tier)`,
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setSending(false);
    }
  }

  // Render Full Screen View Overlay or Normal View
  return (
    <div className={isFullScreen ? "fixed inset-0 z-50 bg-slate-950 text-slate-100 flex flex-col overflow-hidden" : "space-y-6"}>
      {/* Top Header Card */}
      <div className={`bg-slate-900/80 border border-white/10 rounded-2xl backdrop-blur-xl shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4 ${isFullScreen ? "m-3 p-4 rounded-xl border-orange-500/20" : "p-5"}`}>
        <div className="flex items-center gap-3">
          {isFullScreen && (
            <button
              onClick={() => setIsSidebarOpen((s) => !s)}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
              title={isSidebarOpen ? "Hide Sessions Sidebar" : "Show Sessions Sidebar"}
            >
              {isSidebarOpen ? <PanelLeftClose className="w-4 h-4 text-orange-400" /> : <PanelLeft className="w-4 h-4 text-orange-400" />}
            </button>
          )}

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-orange-500/10 text-orange-400 border border-orange-500/20 font-bold uppercase tracking-wider">
                {isFullScreen ? "Full Size Workspace" : "Interactive Workspace"}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                Multi-Engine Routing
              </span>
              {selectedModelIds.length > 0 && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                  {selectedModelIds.length} Target Model{selectedModelIds.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>
            <h1 className="text-lg sm:text-xl font-bold font-display text-slate-100 mt-1 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-orange-400" />
              {isFullScreen ? sessionTitle : "AI Dispatch & Multi-Model Chat"}
            </h1>
            {!isFullScreen && (
              <p className="text-xs text-slate-400 mt-0.5 max-w-2xl">
                Streamlined prompt execution, prompt redrafting, file synthesis (PDF/Excel/Images), cross-model fact corroboration, and sequential relay refinement.
              </p>
            )}
          </div>
        </div>

        {/* Header Right Controls: Mode Switcher + Fullscreen Toggle */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Mode Switcher Tabs */}
          <div className="flex items-center bg-slate-950/80 p-1 rounded-xl border border-slate-800 shrink-0 gap-1">
            <button
              onClick={() => setMode("chat")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                mode === "chat"
                  ? "bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 font-bold shadow-md shadow-orange-500/20"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Dispatch Chat</span>
            </button>

            <button
              onClick={() => setMode("corroborate")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                mode === "corroborate"
                  ? "bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 font-bold shadow-md shadow-orange-500/20"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
              }`}
            >
              <GitCompare className="w-3.5 h-3.5" />
              <span>WhyOr Corroborate</span>
            </button>

            <button
              onClick={() => setMode("relay")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                mode === "relay"
                  ? "bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 font-bold shadow-md shadow-orange-500/20"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>WhyOr Relay</span>
            </button>
          </div>

          {/* Fullscreen Toggle Button */}
          <button
            onClick={() => setIsFullScreen((f) => !f)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-mono font-semibold transition-all border cursor-pointer ${
              isFullScreen
                ? "bg-orange-500/20 text-orange-300 border-orange-500/40 shadow-sm"
                : "bg-slate-900 text-slate-300 border-slate-700 hover:text-white hover:bg-slate-800"
            }`}
            title={isFullScreen ? "Exit Full Size [Esc]" : "Make Chat Window Full Size"}
          >
            {isFullScreen ? <Minimize2 className="w-4 h-4 text-orange-400" /> : <Maximize2 className="w-4 h-4 text-orange-400" />}
            <span className="hidden sm:inline">{isFullScreen ? "Exit Full Size [Esc]" : "Full Size"}</span>
          </button>
        </div>
      </div>

      {/* Error Banner if any */}
      {errorMessage && (
        <div className={`bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-xs flex items-start justify-between gap-3 animate-in fade-in ${isFullScreen ? "mx-3 p-3" : "p-4"}`}>
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-red-400 hover:text-red-200 font-bold text-sm cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Workspace Layout */}
      <div className={`flex-1 min-h-0 ${isFullScreen ? "flex gap-3 px-3 pb-3 overflow-hidden" : "grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"}`}>
        {/* Left Sidebar: Chat Sessions History */}
        {(isSidebarOpen || !isFullScreen) && (
          <div className={isFullScreen ? "w-64 sm:w-72 shrink-0 h-full overflow-hidden flex flex-col" : "lg:col-span-3"}>
            <ChatHistorySidebar
              activeSessionId={sessionId}
              onSelectSession={setSessionId}
              onNewChat={() => {
                setMessages([]);
                setErrorMessage(null);
              }}
            />
          </div>
        )}

        {/* Right Main Panel */}
        <div className={isFullScreen ? "flex-1 min-w-0 h-full flex flex-col overflow-hidden" : "lg:col-span-9 space-y-6"}>
          {mode === "corroborate" ? (
            <div className={isFullScreen ? "flex-1 overflow-y-auto" : ""}>
              <CorroboratePanel
                prompt={messages[messages.length - 1]?.content || ""}
                modelA={{ provider: "google", modelId: "gemini-3.7-flash", label: "Gemini 3.7 Flash" }}
                modelB={{ provider: "google", modelId: "gemini-3.1-flash-lite", label: "Gemini 3.1 Flash Lite" }}
              />
            </div>
          ) : mode === "relay" ? (
            <div className={isFullScreen ? "flex-1 overflow-y-auto" : ""}>
              <RelayPanel />
            </div>
          ) : (
            <div className={`bg-slate-900/60 border border-white/10 rounded-2xl backdrop-blur-xl shadow-xl flex flex-col overflow-hidden ${isFullScreen ? "h-full flex-1" : ""}`}>
              {/* Chat Session Top Bar */}
              <div className="px-5 py-3 border-b border-slate-800 bg-slate-950/50 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)] animate-pulse" />
                  <span className="text-xs font-semibold text-slate-200">{sessionTitle}</span>
                  <span className="text-[10px] font-mono text-slate-500 bg-slate-800/60 px-2 py-0.5 rounded-md">
                    ID: {sessionId ? sessionId.slice(0, 16) : "Initializing"}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-mono text-slate-400">
                    {messages.length} message{messages.length !== 1 ? "s" : ""}
                  </span>
                  {!isFullScreen && (
                    <button
                      onClick={() => setIsFullScreen(true)}
                      className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors cursor-pointer"
                      title="Expand Chat Window to Full Size"
                    >
                      <Maximize2 className="w-3.5 h-3.5 text-orange-400" />
                    </button>
                  )}
                </div>
              </div>

              {/* Message Thread Scroll Area */}
              <div className={`p-5 space-y-4 overflow-y-auto bg-slate-950/30 ${isFullScreen ? "flex-1 min-h-[300px]" : "min-h-[340px] max-h-[520px]"}`}>
                {messages.length === 0 ? (
                  <div className="text-center py-16 text-slate-500 text-xs space-y-2">
                    <Bot className="w-8 h-8 mx-auto text-slate-600 opacity-60" />
                    <p className="font-medium text-slate-400">Your chat conversation is ready.</p>
                    <p className="text-[11px]">Type a prompt below to dispatch across available AI models with automatic routing.</p>
                  </div>
                ) : (
                  messages.map((msg, i) => (
                    <div
                      key={i}
                      className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} items-start gap-3`}
                    >
                      {msg.role === "assistant" && (
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-500/20 to-amber-500/10 border border-orange-500/30 flex items-center justify-center shrink-0 mt-0.5 text-orange-400">
                          <Bot className="w-4 h-4" />
                        </div>
                      )}

                      <div
                        className={`max-w-[85%] sm:max-w-[78%] rounded-2xl p-4 shadow-lg relative group ${
                          msg.role === "user"
                            ? "bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 font-medium"
                            : "bg-slate-900/90 border border-slate-800 text-slate-200"
                        }`}
                      >
                        {msg.role === "assistant" && (
                          <div className="flex items-center justify-between gap-3 mb-2 pb-2 border-b border-slate-800/80 text-[10px] font-mono text-slate-400">
                            <span className="flex items-center gap-1 text-cyan-400 font-semibold">
                              <Cpu className="w-3 h-3" />
                              {msg.modelUsed || "Auto-Routed"}
                            </span>
                            <div className="flex items-center gap-2">
                              {msg.timestamp && (
                                <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              )}
                              <button
                                onClick={() => handleCopyText(msg.content, i)}
                                className="opacity-0 group-hover:opacity-100 p-1 hover:text-white transition-opacity cursor-pointer"
                                title="Copy message"
                              >
                                {copiedIndex === i ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                              </button>
                            </div>
                          </div>
                        )}

                        <p className={`text-xs sm:text-sm leading-relaxed whitespace-pre-wrap ${msg.role === "user" ? "text-slate-950 font-medium" : "text-slate-200"}`}>
                          {msg.content}
                        </p>

                        {msg.artifact && (
                          <div className="mt-3">
                            <OutputArtifactPanel artifact={msg.artifact} />
                          </div>
                        )}
                      </div>

                      {msg.role === "user" && (
                        <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 mt-0.5 text-slate-300">
                          <User className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                  ))
                )}

                {sending && (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 animate-pulse">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    </div>
                    <div className="bg-slate-900 border border-slate-800 px-4 py-2.5 rounded-2xl text-xs text-slate-400 font-mono flex items-center gap-2">
                      <span className="inline-block w-2 h-2 rounded-full bg-orange-400 animate-ping" />
                      Optimizing prompt & routing to optimal model…
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Controls Footer Ribbon (Collapsible Panels & Composer) */}
              <div className="border-t border-slate-800 bg-slate-900/90 shrink-0">
                {/* Context Compression Preview Accordion */}
                {sessionId && (
                  <div className="px-5 py-2 border-b border-slate-800/80 bg-slate-950/60">
                    <ContextPreviewPanel sessionId={sessionId} />
                  </div>
                )}

                {/* Model Availability / Selection Ribbon */}
                <div className="px-5 py-2.5 border-b border-slate-800/80 bg-slate-900/40">
                  <ModelAvailabilityPanel
                    uploadedFileMimeTypes={uploadedMimeTypes}
                    selectedModelIds={selectedModelIds}
                    onSelect={setSelectedModelIds}
                  />
                </div>

                {/* Collapsible File Upload Zone */}
                <div className="px-5 py-2 border-b border-slate-800/80 bg-slate-950/40">
                  <button
                    onClick={() => setShowFileUpload((s) => !s)}
                    className="flex items-center gap-2 text-xs font-mono text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                  >
                    {showFileUpload ? <ChevronDown className="w-3.5 h-3.5 text-orange-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-500" />}
                    <Paperclip className="w-3.5 h-3.5 text-orange-400" />
                    <span>Attach Documents / Images for Multimodal Analysis</span>
                    {uploadedFiles.length > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-orange-500/20 text-orange-300 font-bold border border-orange-500/30">
                        {uploadedFiles.length} file{uploadedFiles.length !== 1 ? "s" : ""}
                      </span>
                    )}
                  </button>

                  {showFileUpload && (
                    <div className="mt-2.5 pt-2.5 border-t border-slate-800">
                      <FileUploadZone files={uploadedFiles} onFilesChange={setUploadedFiles} />
                    </div>
                  )}
                </div>

                {/* Preprocessing Optimization Toggle */}
                <div className="px-5 py-1.5 border-b border-slate-800/80 bg-slate-950/40">
                  <PreprocessingToggle enabled={optimizeFiles} onToggle={setOptimizeFiles} files={uploadedFiles} />
                </div>

                {/* Expandable Composer Section */}
                <div className="p-4 sm:p-5 bg-slate-900/80">
                  <ExpandableComposer
                    sessionId={sessionId || "session_default"}
                    onSend={handleSend}
                    initialDraft={prefilledPrompt}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

