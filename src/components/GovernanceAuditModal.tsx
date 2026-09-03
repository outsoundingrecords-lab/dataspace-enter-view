import React from 'react';
import { ShieldCheck, CheckCircle2, X, FileText, Smartphone, Monitor, Check } from 'lucide-react';

interface GovernanceAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GovernanceAuditModal({ isOpen, onClose }: GovernanceAuditModalProps) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="bg-zinc-900 border border-zinc-700/80 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl gpu-accelerated"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-zinc-800 bg-zinc-900/90 flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-emerald-500/10 rounded-lg text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-zinc-100 text-sm tracking-tight">
                Operational Governance & Sign-Off
              </h3>
              <p className="text-[11px] text-zinc-400">
                Responsive UI Redesign Verification Matrix
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="text-zinc-400 hover:text-zinc-200 p-1.5 rounded-lg min-w-[36px] min-h-[36px] flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[75dvh] overflow-y-auto">
          {/* Verification Sign-off Tracking Cards */}
          <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                UI/UX Lead Verification
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                COMPLETED
              </span>
            </div>
            <div className="text-xs text-zinc-300">
              Visual Hierarchy & Accessibility Audit (WCAG AA Compliance)
            </div>
            <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-1 border-t border-zinc-800/60">
              <span>Sign-off: Lead Systems Designer</span>
              <span className="font-mono text-zinc-400">Status: Verified</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Data Integration Specialist
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                COMPLETED
              </span>
            </div>
            <div className="text-xs text-zinc-300">
              Data Binding & API Schema Validation (Deterministic SHA-256 Hashes)
            </div>
            <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-1 border-t border-zinc-800/60">
              <span>Sign-off: Lead Architecture Engineer</span>
              <span className="font-mono text-zinc-400">Status: Verified</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                QA Lead Verification
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                COMPLETED
              </span>
            </div>
            <div className="text-xs text-zinc-300">
              Cross-Device Checklist Sign-off (100dvh, Safe-area Insets, 44pt Touch Targets)
            </div>
            <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-1 border-t border-zinc-800/60">
              <span>Sign-off Date: 2026-09-03</span>
              <span className="font-mono text-zinc-400 flex items-center gap-1">
                <FileText className="w-3 h-3" />
                DOC-RESP-UI-V2
              </span>
            </div>
          </div>

          {/* Matrix specs summary */}
          <div className="p-4 rounded-xl bg-zinc-950/40 border border-zinc-800/60 text-xs space-y-2">
            <div className="font-medium text-zinc-200">Hardware & Viewport Calibrations:</div>
            <ul className="space-y-1 text-zinc-400 text-[11px]">
              <li className="flex items-center gap-2">
                <Check className="w-3 h-3 text-indigo-400" />
                Mobile: 100dvh dynamic viewport, safe-area-inset top/bottom, 44×44pt touch minimum.
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3 h-3 text-indigo-400" />
                Desktop: 3-pane ergonomic layout (Sidebar, 12-col Canvas, Inspector).
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3 h-3 text-indigo-400" />
                GPU transforms (translate3d) for 120Hz ProMotion fluid rendering.
              </li>
            </ul>
          </div>
        </div>

        <div className="px-6 py-3 bg-zinc-950 border-t border-zinc-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs font-medium transition-colors"
          >
            Close Sign-Off
          </button>
        </div>
      </div>
    </div>
  );
}
