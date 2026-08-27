import { useCallback, useRef, useState, useEffect } from "react";
import { 
  UploadCloud, 
  X, 
  FileText, 
  Image as ImageIcon, 
  FileSpreadsheet, 
  FileCode2, 
  File, 
  AlertCircle, 
  Plus, 
  Trash2, 
  Paperclip,
  CheckCircle2,
  Eye,
  Maximize2
} from "lucide-react";

export interface UploadedFile {
  id: string;
  file: File;
  mimeType: string;
  sizeBytes: number;
  previewUrl: string | null;
  textPreview: string | null;
  base64: string | null;
}

const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024;
const TEXT_PREVIEW_MIME_TYPES = new Set([
  "text/plain", 
  "text/csv", 
  "text/markdown", 
  "application/json", 
  "text/javascript", 
  "application/javascript", 
  "text/typescript", 
  "text/x-python",
  "text/html",
  "text/css"
]);

function readAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).slice(0, 500));
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

export function readAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result);
      resolve(result.substring(result.indexOf(",") + 1));
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function getFileCategory(mimeType: string, filename: string): {
  icon: any;
  colorClass: string;
  badge: string;
} {
  const lowerName = filename.toLowerCase();
  if (mimeType.startsWith("image/") || /\.(png|jpe?g|webp|gif|svg)$/i.test(lowerName)) {
    return { icon: ImageIcon, colorClass: "text-purple-400 bg-purple-500/10 border-purple-500/30", badge: "IMAGE" };
  }
  if (mimeType === "application/pdf" || lowerName.endsWith(".pdf")) {
    return { icon: FileText, colorClass: "text-rose-400 bg-rose-500/10 border-rose-500/30", badge: "PDF" };
  }
  if (
    mimeType.includes("spreadsheet") || 
    mimeType.includes("excel") || 
    mimeType === "text/csv" || 
    /\.(xlsx?|csv|tsv)$/i.test(lowerName)
  ) {
    return { icon: FileSpreadsheet, colorClass: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30", badge: lowerName.endsWith(".csv") ? "CSV" : "EXCEL" };
  }
  if (
    mimeType.includes("json") || 
    mimeType.includes("javascript") || 
    mimeType.includes("typescript") || 
    mimeType.includes("python") || 
    /\.(ts|tsx|js|jsx|py|go|rs|cpp|c|java|json|yaml|yml|sql|sh|html|css|md)$/i.test(lowerName)
  ) {
    const ext = lowerName.split(".").pop()?.toUpperCase() || "CODE";
    return { icon: FileCode2, colorClass: "text-cyan-400 bg-cyan-500/10 border-cyan-500/30", badge: ext };
  }
  return { icon: File, colorClass: "text-amber-400 bg-amber-500/10 border-amber-500/30", badge: "DOC" };
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function FileUploadZone({
  files,
  onFilesChange,
  compact = false,
}: {
  files: UploadedFile[];
  onFilesChange: (files: UploadedFile[]) => void;
  compact?: boolean;
}) {
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageModalUrl, setImageModalUrl] = useState<{ url: string; name: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    async (fileList: FileList | File[]) => {
      setError(null);
      const accepted: UploadedFile[] = [];
      const incoming = Array.from(fileList);

      for (const file of incoming) {
        if (file.size > MAX_FILE_SIZE_BYTES) {
          setError(`"${file.name}" (${formatBytes(file.size)}) exceeds the 20MB limit and was skipped.`);
          continue;
        }

        // Avoid adding duplicate files with same name and size
        if (files.some((existing) => existing.file.name === file.name && existing.sizeBytes === file.size)) {
          continue;
        }

        const mimeType = file.type || (file.name.endsWith(".csv") ? "text/csv" : file.name.endsWith(".json") ? "application/json" : "application/octet-stream");
        const previewUrl = mimeType.startsWith("image/") || /\.(png|jpe?g|webp|gif|svg)$/i.test(file.name) ? URL.createObjectURL(file) : null;
        
        let textPreview: string | null = null;
        if (TEXT_PREVIEW_MIME_TYPES.has(mimeType) || /\.(txt|csv|json|md|py|ts|tsx|js|jsx|html|css|sql|sh)$/i.test(file.name)) {
          textPreview = await readAsText(file).catch(() => null);
        }

        accepted.push({
          id: `file_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          file,
          mimeType,
          sizeBytes: file.size,
          previewUrl,
          textPreview,
          base64: null,
        });
      }

      if (accepted.length > 0) {
        onFilesChange([...files, ...accepted]);
      }
    },
    [files, onFilesChange]
  );

  // Global Clipboard Paste Listener for attachments
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (!e.clipboardData || !e.clipboardData.files.length) return;
      const target = e.target as HTMLElement;
      // If user is pasting into a text area, only intercept if they actually pasted files/images
      if (e.clipboardData.files.length > 0) {
        handleFiles(e.clipboardData.files);
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [handleFiles]);

  function removeFile(id: string) {
    const target = files.find((f) => f.id === id);
    if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
    onFilesChange(files.filter((f) => f.id !== id));
  }

  function clearAllFiles() {
    files.forEach((f) => {
      if (f.previewUrl) URL.revokeObjectURL(f.previewUrl);
    });
    onFilesChange([]);
  }

  const totalBytes = files.reduce((acc, f) => acc + f.sizeBytes, 0);

  return (
    <div className="space-y-2.5">
      {/* Hidden Native File Input */}
      <input
        ref={inputRef}
        type="file"
        multiple
        accept=".pdf,.xlsx,.xls,.csv,.tsv,.txt,.json,.md,.png,.jpg,.jpeg,.webp,.gif,.svg,.ts,.tsx,.js,.jsx,.py,.go,.rs,.sql,.sh,.html,.css"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            handleFiles(e.target.files);
            e.target.value = ""; // Reset input so same file can be re-selected if removed
          }
        }}
      />

      {/* Sleek, Modern, Space-Saving Drop & Attach Bar */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragging(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragging(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragging(false);
          if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFiles(e.dataTransfer.files);
          }
        }}
        onClick={() => inputRef.current?.click()}
        className={`group relative rounded-xl border border-dashed p-3 sm:py-2.5 sm:px-4 cursor-pointer transition-all flex flex-col sm:flex-row items-center justify-between gap-2.5 select-none ${
          dragging
            ? "border-orange-400 bg-orange-500/15 ring-2 ring-orange-500/30 shadow-lg shadow-orange-500/10"
            : "border-slate-800 bg-slate-950/60 hover:border-orange-500/40 hover:bg-slate-950/90"
        }`}
      >
        {/* Left Info & Prompt */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${
            dragging 
              ? "bg-orange-500 text-slate-950 shadow-md shadow-orange-500/30" 
              : "bg-orange-500/10 text-orange-400 border border-orange-500/20"
          }`}>
            <Paperclip className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-slate-200 group-hover:text-white transition-colors">
                {dragging ? "Drop files to attach" : "Attach Files & Documents"}
              </span>
              <span className="text-[10px] font-mono text-slate-500 hidden md:inline">
                (or drag &amp; drop / paste ⌘V)
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
              <span className="text-[9px] font-mono font-medium px-1.5 py-0.2 rounded bg-slate-900 border border-slate-800 text-rose-300">PDF</span>
              <span className="text-[9px] font-mono font-medium px-1.5 py-0.2 rounded bg-slate-900 border border-slate-800 text-emerald-300">Excel / CSV</span>
              <span className="text-[9px] font-mono font-medium px-1.5 py-0.2 rounded bg-slate-900 border border-slate-800 text-purple-300">Images</span>
              <span className="text-[9px] font-mono font-medium px-1.5 py-0.2 rounded bg-slate-900 border border-slate-800 text-cyan-300">Code / JSON</span>
              <span className="text-[10px] font-mono text-slate-500 ml-1">Up to 20MB</span>
            </div>
          </div>
        </div>

        {/* Right CTA Button */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end shrink-0">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              inputRef.current?.click();
            }}
            className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 hover:border-orange-500/40 text-xs font-mono flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-orange-400" />
            <span>Browse Files</span>
          </button>
        </div>
      </div>

      {/* Error Alert if any */}
      {error && (
        <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-center justify-between gap-2 animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-red-400 hover:text-red-200 p-1 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Attached Files List - Crisp, Space-Efficient Grid */}
      {files.length > 0 && (
        <div className="space-y-2 pt-1 animate-in fade-in">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Attached ({files.length} file{files.length !== 1 ? "s" : ""})
              </span>
              <span className="text-[10px] font-mono text-slate-500">
                • {formatBytes(totalBytes)} total
              </span>
            </div>
            <button
              onClick={clearAllFiles}
              className="text-[11px] font-mono text-slate-500 hover:text-rose-400 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3 h-3" />
              <span>Clear All</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {files.map((f) => {
              const { icon: FileIcon, colorClass, badge } = getFileCategory(f.mimeType, f.file.name);
              return (
                <div
                  key={f.id}
                  className="relative rounded-xl border border-slate-800 bg-slate-950/80 hover:border-slate-700 p-2.5 flex items-center gap-2.5 shadow-sm group transition-all"
                >
                  {/* File Thumbnail or Icon */}
                  {f.previewUrl ? (
                    <div 
                      onClick={() => setImageModalUrl({ url: f.previewUrl!, name: f.file.name })}
                      className="w-11 h-11 rounded-lg overflow-hidden shrink-0 border border-slate-800 bg-black relative cursor-zoom-in group/img"
                    >
                      <img
                        src={f.previewUrl}
                        alt={f.file.name}
                        className="w-full h-full object-cover group-hover/img:scale-110 transition-transform"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-opacity">
                        <Eye className="w-3.5 h-3.5 text-white" />
                      </div>
                    </div>
                  ) : (
                    <div className={`w-11 h-11 rounded-lg border flex flex-col items-center justify-center shrink-0 ${colorClass}`}>
                      <FileIcon className="w-4 h-4" />
                      <span className="text-[8px] font-mono font-bold mt-0.5 uppercase tracking-tighter">
                        {badge}
                      </span>
                    </div>
                  )}

                  {/* File Details */}
                  <div className="min-w-0 flex-1 pr-6">
                    <p className="text-xs font-mono font-medium text-slate-200 truncate" title={f.file.name}>
                      {f.file.name}
                    </p>
                    <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-500 mt-0.5">
                      <span className="text-slate-400 font-semibold">{formatBytes(f.sizeBytes)}</span>
                      <span>•</span>
                      <span className="truncate">{badge}</span>
                    </div>
                    {f.textPreview && (
                      <p className="text-[9px] font-mono text-slate-400 truncate mt-0.5 opacity-80">
                        {f.textPreview.slice(0, 45)}...
                      </p>
                    )}
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(f.id);
                    }}
                    className="absolute top-2 right-2 text-slate-500 hover:text-rose-400 p-1 rounded-md hover:bg-white/5 transition-colors cursor-pointer"
                    title="Remove file"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Image Preview Lightbox Modal */}
      {imageModalUrl && (
        <div 
          onClick={() => setImageModalUrl(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-900 border border-white/15 rounded-2xl max-w-2xl w-full p-4 space-y-3 shadow-2xl"
          >
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <span className="text-xs font-mono text-slate-200 font-semibold truncate">
                {imageModalUrl.name}
              </span>
              <button
                onClick={() => setImageModalUrl(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="max-h-[70vh] flex items-center justify-center overflow-hidden rounded-xl bg-black/50">
              <img
                src={imageModalUrl.url}
                alt={imageModalUrl.name}
                className="max-h-[65vh] w-auto object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

