import React, { useState } from 'react';
import { 
  PanelRightClose, 
  PanelRightOpen, 
  FileCode, 
  Download, 
  History, 
  Sparkles, 
  Copy, 
  Check, 
  Trash2, 
  ExternalLink, 
  Wand2, 
  Database, 
  FileText, 
  ShieldCheck, 
  RotateCcw,
  Layers,
  FileSpreadsheet
} from 'lucide-react';
import { FileRecord } from '../types';
import { formatBytes, getFileCategory, CATEGORY_STYLES } from '../utils';

interface InspectorPanelProps {
  isOpen: boolean;
  onToggle: () => void;
  selectedFile: FileRecord | null;
  onCloseSelectedFile: () => void;
  onCopyHash: (hash: string) => void;
  onAdvancedExport: () => void;
  onDownloadHashes: () => void;
  onDownloadCSV: () => void;
  onDownloadJSON: () => void;
  onDownloadPDF: () => void;
  onDownloadSummary: () => void;
  onAiOrganize: () => void;
  isAiLoading: boolean;
  aiSuggestion: string | null;
  cleanupHistory: { id: string; timestamp: number; action: string; count: number; size: number; paths: string[] }[];
  totalFiles: number;
  totalSize: number;
  duplicateCount: number;
  onOpenGovernance: () => void;
}

export function InspectorPanel({
  isOpen,
  onToggle,
  selectedFile,
  onCloseSelectedFile,
  onCopyHash,
  onAdvancedExport,
  onDownloadHashes,
  onDownloadCSV,
  onDownloadJSON,
  onDownloadPDF,
  onDownloadSummary,
  onAiOrganize,
  isAiLoading,
  aiSuggestion,
  cleanupHistory,
  totalFiles,
  totalSize,
  duplicateCount,
  onOpenGovernance
}: InspectorPanelProps) {
  const [activeTab, setActiveTab] = useState<'inspect' | 'exports' | 'ai_history'>('inspect');
  const [copiedHash, setCopiedHash] = useState(false);

  const handleCopy = (text: string) => {
    onCopyHash(text);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  if (!isOpen) {
    return (
      <div className="hidden xl:flex flex-col items-center py-4 px-2 border-l border-zinc-800 bg-zinc-950/60 z-20">
        <button
          onClick={onToggle}
          title="Expand Inspector & Action Panel (Ctrl+I)"
          className="p-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/80 rounded-xl transition-colors"
        >
          <PanelRightOpen className="w-5 h-5 text-indigo-400" />
        </button>
        <span className="[writing-mode:vertical-rl] text-xs uppercase tracking-widest text-zinc-500 font-mono mt-4">
          Inspector & Actions
        </span>
      </div>
    );
  }

  return (
    <aside className="hidden xl:flex flex-col w-[320px] 2xl:w-[350px] border-l border-zinc-800 bg-zinc-950/90 backdrop-blur-md z-20 shrink-0 gpu-accelerated">
      {/* Header */}
      <div className="h-16 px-4 border-b border-zinc-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-indigo-400" />
          <span className="font-semibold text-zinc-200 text-sm tracking-tight">
            Inspector & Actions
          </span>
        </div>
        <button
          onClick={onToggle}
          title="Collapse Panel"
          className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 rounded-lg transition-colors"
        >
          <PanelRightClose className="w-4 h-4" />
        </button>
      </div>

      {/* Segmented Control Tabs */}
      <div className="grid grid-cols-3 p-2 gap-1 border-b border-zinc-800/80 bg-zinc-900/40 text-xs">
        <button
          onClick={() => setActiveTab('inspect')}
          className={`py-1.5 px-2 rounded-lg font-medium transition-colors ${
            activeTab === 'inspect'
              ? 'bg-zinc-800 text-zinc-100 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Inspect
        </button>
        <button
          onClick={() => setActiveTab('exports')}
          className={`py-1.5 px-2 rounded-lg font-medium transition-colors ${
            activeTab === 'exports'
              ? 'bg-zinc-800 text-zinc-100 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Export
        </button>
        <button
          onClick={() => setActiveTab('ai_history')}
          className={`py-1.5 px-2 rounded-lg font-medium transition-colors ${
            activeTab === 'ai_history'
              ? 'bg-zinc-800 text-zinc-100 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          AI & History
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {activeTab === 'inspect' && (
          <div>
            {selectedFile ? (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium uppercase tracking-wider text-indigo-400">
                    File Details
                  </span>
                  <button
                    onClick={onCloseSelectedFile}
                    className="text-xs text-zinc-400 hover:text-zinc-200"
                  >
                    Clear
                  </button>
                </div>

                <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-xl space-y-2">
                  <div className="text-sm font-medium text-zinc-200 break-all">
                    {selectedFile.file_name}
                  </div>
                  <div className="text-xs text-zinc-500 font-mono break-all">
                    {selectedFile.relative_path}
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between p-2 rounded-lg bg-zinc-900/40 border border-zinc-800/60">
                    <span className="text-zinc-400">Size</span>
                    <span className="text-zinc-200 font-mono">{formatBytes(selectedFile.size_bytes)}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg bg-zinc-900/40 border border-zinc-800/60">
                    <span className="text-zinc-400">Extension</span>
                    <span className="text-indigo-400 font-mono font-medium">.{selectedFile.extension || 'none'}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded-lg bg-zinc-900/40 border border-zinc-800/60">
                    <span className="text-zinc-400">Category</span>
                    {(() => {
                      const category = selectedFile.category || getFileCategory(selectedFile.file_name, selectedFile.extension, selectedFile.mime_type);
                      const style = CATEGORY_STYLES[category] || CATEGORY_STYLES['Other'];
                      return (
                        <span className={`px-2 py-0.5 rounded text-[11px] font-medium border uppercase tracking-wider ${style.badgeClass}`}>
                          {category}
                        </span>
                      );
                    })()}
                  </div>
                  <div className="flex justify-between p-2 rounded-lg bg-zinc-900/40 border border-zinc-800/60">
                    <span className="text-zinc-400">Modified</span>
                    <span className="text-zinc-300">{new Date(selectedFile.modified_utc).toLocaleString()}</span>
                  </div>
                </div>

                {selectedFile.sha256 && (
                  <div className="p-3 rounded-xl bg-zinc-900/50 border border-zinc-800 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-400 font-medium">SHA-256 Hash</span>
                      <button
                        onClick={() => handleCopy(selectedFile.sha256!)}
                        className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 text-[11px]"
                      >
                        {copiedHash ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        {copiedHash ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                    <div className="p-2 rounded bg-zinc-950 font-mono text-[11px] text-zinc-300 break-all select-all">
                      {selectedFile.sha256}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Workspace Schema
                </div>
                <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800/80 space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-zinc-400">Scanned Items</span>
                    <span className="text-zinc-200 font-medium">{totalFiles} files</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-zinc-400">Total Volume</span>
                    <span className="text-zinc-200 font-mono font-medium">{formatBytes(totalSize)}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-zinc-400">Deduplication</span>
                    <span className={`font-medium ${duplicateCount > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {duplicateCount > 0 ? `${duplicateCount} duplicate groups` : 'Clean / Optimal'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-zinc-400">Hash Digest</span>
                    <span className="text-zinc-300 font-mono">SHA-256 (Deterministic)</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-indigo-500/5 border border-indigo-500/20 text-xs text-zinc-400 leading-relaxed">
                  <p className="font-medium text-indigo-300 mb-1 flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5" />
                    Quick Selection Tip
                  </p>
                  Click any row in the file inventory table to inspect full metadata, copy checksums, or compare revisions.
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'exports' && (
          <div className="space-y-3">
            <div className="text-xs font-medium uppercase tracking-wider text-zinc-500 mb-2">
              Export Pipelines
            </div>

            <button
              onClick={onAdvancedExport}
              className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-200 text-xs font-medium transition-colors shadow-sm"
            >
              <Download className="w-4 h-4 text-indigo-400 shrink-0" />
              <div className="flex flex-col text-left">
                <span>Advanced Image Export</span>
                <span className="text-[10px] text-indigo-300/70">Render 1x/2x PNG Dashboard</span>
              </div>
            </button>

            <button
              onClick={onDownloadHashes}
              className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800/80 border border-zinc-800 text-zinc-300 text-xs font-medium transition-colors"
            >
              <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
              <div className="flex flex-col text-left">
                <span>Filtered Hashes (TXT)</span>
                <span className="text-[10px] text-zinc-500">One SHA-256 hash per line</span>
              </div>
            </button>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={onDownloadCSV}
                className="flex items-center justify-center gap-1.5 p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs transition-colors"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-zinc-400" />
                CSV Table
              </button>
              <button
                onClick={onDownloadJSON}
                className="flex items-center justify-center gap-1.5 p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs transition-colors"
              >
                <FileCode className="w-3.5 h-3.5 text-zinc-400" />
                JSON Schema
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={onDownloadPDF}
                className="flex items-center justify-center gap-1.5 p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs transition-colors"
              >
                <FileText className="w-3.5 h-3.5 text-zinc-400" />
                PDF Report
              </button>
              <button
                onClick={onDownloadSummary}
                className="flex items-center justify-center gap-1.5 p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs transition-colors"
              >
                <FileText className="w-3.5 h-3.5 text-zinc-400" />
                TXT Summary
              </button>
            </div>

            <div className="pt-3 border-t border-zinc-800/80">
              <div className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 mb-2">
                Operational Governance
              </div>
              <button
                onClick={onOpenGovernance}
                className="w-full flex items-center justify-between p-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs text-zinc-300 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Audit & Sign-Off Workflow</span>
                </div>
                <span className="text-[10px] text-emerald-400 font-mono">100% PASS</span>
              </button>
            </div>
          </div>
        )}

        {activeTab === 'ai_history' && (
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  AI Reorganization
                </span>
                <button
                  onClick={onAiOrganize}
                  disabled={isAiLoading || totalFiles === 0}
                  className="text-xs bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors"
                >
                  <Wand2 className="w-3 h-3" />
                  {isAiLoading ? 'Analyzing...' : 'Run Analysis'}
                </button>
              </div>

              {aiSuggestion ? (
                <div className="p-3 bg-zinc-900/60 border border-indigo-500/30 rounded-xl text-xs text-zinc-300 max-h-48 overflow-y-auto font-mono whitespace-pre-wrap">
                  {aiSuggestion}
                </div>
              ) : (
                <p className="text-xs text-zinc-500">
                  Analyze folder hierarchy and generate recommendations for clean domain structuring.
                </p>
              )}
            </div>

            <div className="pt-3 border-t border-zinc-800/80">
              <div className="text-xs font-medium uppercase tracking-wider text-zinc-500 mb-2 flex items-center gap-1.5">
                <History className="w-3.5 h-3.5" />
                Cleanup History ({cleanupHistory.length})
              </div>

              {cleanupHistory.length === 0 ? (
                <p className="text-xs text-zinc-500 py-2">
                  No deduplication actions executed yet in this session.
                </p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {cleanupHistory.map((item) => (
                    <div key={item.id} className="p-2.5 bg-zinc-900/40 border border-zinc-800/60 rounded-lg text-xs space-y-1">
                      <div className="flex justify-between items-center text-zinc-300 font-medium">
                        <span>{item.action}</span>
                        <span className="text-rose-400 font-mono">-{formatBytes(item.size)}</span>
                      </div>
                      <div className="text-[11px] text-zinc-500 flex justify-between">
                        <span>{item.count} files resolved</span>
                        <span>{new Date(item.timestamp).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
