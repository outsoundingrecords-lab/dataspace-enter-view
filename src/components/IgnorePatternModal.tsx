import React, { useState, useMemo } from 'react';
import {
  ShieldAlert,
  FolderMinus,
  CheckCircle2,
  X,
  Plus,
  Zap,
  Info,
  Layers,
  Sparkles,
  RotateCcw
} from 'lucide-react';
import {
  PreScanResult,
  PRESET_IGNORE_PATTERNS,
  WorkspaceIgnoreConfig,
  saveStoredIgnoreConfig,
} from '../utils/ignorePatterns';
import { formatBytes } from '../utils';

interface IgnorePatternModalProps {
  isOpen: boolean;
  preScanResult: PreScanResult;
  initialConfig: WorkspaceIgnoreConfig;
  onConfirm: (selectedPatterns: string[], rememberChoice: boolean) => void;
  onSkip: () => void;
  onCancel: () => void;
}

export function IgnorePatternModal({
  isOpen,
  preScanResult,
  initialConfig,
  onConfirm,
  onSkip,
  onCancel,
}: IgnorePatternModalProps) {
  // Initialize enabled patterns with detected ones that are pre-selected in initialConfig
  const [enabledPatterns, setEnabledPatterns] = useState<Set<string>>(() => {
    const detectedPatterns = new Set(preScanResult.detectedRules.map(r => r.pattern));
    // If user has saved preferences, use saved preferences intersected with or including presets
    if (initialConfig.enabledPatterns.length > 0) {
      const set = new Set<string>();
      initialConfig.enabledPatterns.forEach(p => {
        if (detectedPatterns.has(p)) set.add(p);
      });
      // If none of the saved matched detected, default to all detected
      if (set.size === 0) {
        preScanResult.detectedRules.forEach(r => set.add(r.pattern));
      }
      return set;
    }
    // Default: select all detected preset patterns
    return detectedPatterns;
  });

  const [customPatterns, setCustomPatterns] = useState<string[]>(() => initialConfig.customPatterns || []);
  const [customInput, setCustomInput] = useState('');
  const [rememberChoice, setRememberChoice] = useState<boolean>(() => initialConfig.rememberChoice);

  // Group detected rules by category
  const categories = useMemo(() => {
    const map = new Map<string, typeof preScanResult.detectedRules>();
    preScanResult.detectedRules.forEach(rule => {
      const list = map.get(rule.category) || [];
      list.push(rule);
      map.set(rule.category, list);
    });
    return map;
  }, [preScanResult.detectedRules]);

  // Calculations for excluded files & memory/time savings
  const { totalExcludedFiles, totalExcludedBytes } = useMemo(() => {
    let count = 0;
    let bytes = 0;
    for (const rule of preScanResult.detectedRules) {
      if (enabledPatterns.has(rule.pattern)) {
        count += rule.detectedCount;
        bytes += rule.totalSizeBytes;
      }
    }
    return { totalExcludedFiles: count, totalExcludedBytes: bytes };
  }, [preScanResult.detectedRules, enabledPatterns]);

  const netFilesToIndex = Math.max(0, preScanResult.totalCandidateFiles - totalExcludedFiles);
  const reductionPercentage = preScanResult.totalCandidateFiles > 0
    ? Math.round((totalExcludedFiles / preScanResult.totalCandidateFiles) * 100)
    : 0;

  if (!isOpen) return null;

  const togglePattern = (pattern: string) => {
    setEnabledPatterns(prev => {
      const next = new Set(prev);
      if (next.has(pattern)) {
        next.delete(pattern);
      } else {
        next.add(pattern);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    const all = new Set<string>();
    preScanResult.detectedRules.forEach(r => all.add(r.pattern));
    customPatterns.forEach(p => all.add(p));
    setEnabledPatterns(all);
  };

  const handleDeselectAll = () => {
    setEnabledPatterns(new Set());
  };

  const handleAddCustomPattern = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customInput.trim();
    if (!trimmed) return;

    if (!customPatterns.includes(trimmed)) {
      const updated = [...customPatterns, trimmed];
      setCustomPatterns(updated);
      setEnabledPatterns(prev => new Set(prev).add(trimmed));
    }
    setCustomInput('');
  };

  const handleRemoveCustomPattern = (pattern: string) => {
    setCustomPatterns(prev => prev.filter(p => p !== pattern));
    setEnabledPatterns(prev => {
      const next = new Set(prev);
      next.delete(pattern);
      return next;
    });
  };

  const handleProceed = () => {
    const finalPatterns = Array.from(enabledPatterns);
    if (rememberChoice) {
      saveStoredIgnoreConfig({
        rememberChoice: true,
        enabledPatterns: finalPatterns,
        customPatterns,
      });
    }
    onConfirm(finalPatterns, rememberChoice);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-800 bg-zinc-950/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400 border border-indigo-500/20">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-zinc-100 flex items-center gap-2">
                Automated Ignore Pattern Suggestions
                <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[11px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Pre-Scan Complete
                </span>
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                We detected common dependencies and build artifacts in your folder. Excluding them prevents noise and speeds up indexing.
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="text-zinc-500 hover:text-zinc-300 transition-colors p-1.5 rounded-lg hover:bg-zinc-800"
            title="Cancel import"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Impact Metric Banner */}
        <div className="px-6 py-3.5 bg-gradient-to-r from-indigo-950/30 via-zinc-900 to-zinc-900 border-b border-zinc-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4 flex-wrap">
            <div>
              <span className="text-zinc-500 block text-[10px] uppercase tracking-wider font-semibold">Total Discovered</span>
              <span className="font-semibold text-zinc-200 text-sm">{preScanResult.totalCandidateFiles.toLocaleString()} files</span>
              <span className="text-zinc-500 text-[11px] ml-1">({formatBytes(preScanResult.totalCandidateBytes)})</span>
            </div>
            <div className="h-6 w-px bg-zinc-800" />
            <div>
              <span className="text-zinc-500 block text-[10px] uppercase tracking-wider font-semibold">To Exclude</span>
              <span className="font-semibold text-rose-400 text-sm">{totalExcludedFiles.toLocaleString()} files</span>
              <span className="text-rose-400/80 text-[11px] ml-1">(-{formatBytes(totalExcludedBytes)})</span>
            </div>
            <div className="h-6 w-px bg-zinc-800" />
            <div>
              <span className="text-zinc-500 block text-[10px] uppercase tracking-wider font-semibold">Target Index</span>
              <span className="font-semibold text-emerald-400 text-sm">{netFilesToIndex.toLocaleString()} files</span>
            </div>
          </div>

          {reductionPercentage > 0 && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full font-medium">
              <Zap className="w-3.5 h-3.5" />
              <span>~{reductionPercentage}% index speedup & memory savings</span>
            </div>
          )}
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {/* Quick Selection Toolbar */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
              Detected Exclusion Rules
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-xs text-indigo-400 hover:text-indigo-300 hover:underline px-2 py-1 rounded transition-colors"
              >
                Approve All Recommendations
              </button>
              <span className="text-zinc-700">|</span>
              <button
                type="button"
                onClick={handleDeselectAll}
                className="text-xs text-zinc-500 hover:text-zinc-300 hover:underline px-2 py-1 rounded transition-colors"
              >
                Deselect All
              </button>
            </div>
          </div>

          {/* Categorized Pattern Chip Groups */}
          {categories.size > 0 ? (
            <div className="space-y-4">
              {Array.from(categories.entries()).map(([category, rules]) => (
                <div key={category} className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-medium text-zinc-300">
                    <Layers className="w-3.5 h-3.5 text-zinc-500" />
                    <span>{category}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {rules.map(rule => {
                      const isSelected = enabledPatterns.has(rule.pattern);
                      return (
                        <button
                          key={rule.id}
                          type="button"
                          onClick={() => togglePattern(rule.pattern)}
                          className={`group flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium border transition-all text-left select-none ${
                            isSelected
                              ? 'bg-indigo-600/15 border-indigo-500/40 text-indigo-200 shadow-sm'
                              : 'bg-zinc-800/40 border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-300'
                          }`}
                        >
                          <div className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${
                            isSelected
                              ? 'bg-indigo-600 border-indigo-500 text-white'
                              : 'border-zinc-700 bg-zinc-900 group-hover:border-zinc-600'
                          }`}>
                            {isSelected && <CheckCircle2 className="w-3 h-3" />}
                          </div>
                          <div>
                            <span className="font-mono font-semibold">{rule.label}</span>
                            <span className={`ml-2 text-[11px] px-1.5 py-0.5 rounded-full ${
                              isSelected ? 'bg-indigo-500/20 text-indigo-300' : 'bg-zinc-800 text-zinc-500'
                            }`}>
                              {rule.detectedCount.toLocaleString()} {rule.detectedCount === 1 ? 'file' : 'files'}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 bg-zinc-950/60 border border-zinc-800/60 rounded-xl text-center text-xs text-zinc-500">
              No known preset patterns detected in this directory root. You can still add custom exclusion globs below.
            </div>
          )}

          {/* Custom Glob Patterns */}
          <div className="border-t border-zinc-800/80 pt-5 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-zinc-300 flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5 text-zinc-500" />
                Custom Exclusion Patterns (Glob or Folder)
              </label>
              <span className="text-[11px] text-zinc-500">e.g. *.log, temp/*, coverage/</span>
            </div>
            
            <form onSubmit={handleAddCustomPattern} className="flex gap-2">
              <input
                type="text"
                placeholder="Enter glob (e.g. *.tmp, cache/, test_data/*)"
                value={customInput}
                onChange={e => setCustomInput(e.target.value)}
                className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                disabled={!customInput.trim()}
                className="bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-zinc-200 px-4 py-2 rounded-xl text-xs font-medium transition-colors flex items-center gap-1.5 border border-zinc-700"
              >
                <Plus className="w-3.5 h-3.5" />
                Add
              </button>
            </form>

            {customPatterns.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {customPatterns.map(pattern => {
                  const isSelected = enabledPatterns.has(pattern);
                  return (
                    <span
                      key={pattern}
                      className={`inline-flex items-center gap-1.5 pl-3 pr-1.5 py-1 rounded-xl text-xs font-mono border transition-all ${
                        isSelected
                          ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                          : 'bg-zinc-800/40 border-zinc-800 text-zinc-500 line-through'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => togglePattern(pattern)}
                        className="hover:underline"
                        title={isSelected ? 'Disable rule' : 'Enable rule'}
                      >
                        {pattern}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveCustomPattern(pattern)}
                        className="p-0.5 hover:bg-zinc-800 rounded text-zinc-400 hover:text-zinc-200 transition-colors ml-1"
                        title="Remove pattern"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          {/* Remember Choice for Workspace */}
          <div className="border-t border-zinc-800/80 pt-4">
            <label className="flex items-center gap-3 cursor-pointer group select-none">
              <input
                type="checkbox"
                checked={rememberChoice}
                onChange={e => setRememberChoice(e.target.checked)}
                className="w-4 h-4 rounded border-zinc-700 bg-zinc-950 text-indigo-500 focus:ring-indigo-500 cursor-pointer"
              />
              <div>
                <span className="text-xs font-medium text-zinc-300 group-hover:text-zinc-100 transition-colors">
                  Remember choice for workspace
                </span>
                <p className="text-[11px] text-zinc-500">
                  Save these exclusion preferences locally to automatically suggest or apply them to future imports.
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-zinc-800 bg-zinc-950/80 flex flex-col-reverse sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={onSkip}
            className="w-full sm:w-auto text-xs text-zinc-400 hover:text-zinc-200 px-3 py-2 rounded-xl transition-colors hover:bg-zinc-900 text-center"
          >
            Index Everything (No Exclusions)
          </button>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleProceed}
              className="bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white px-5 py-2.5 rounded-xl text-xs font-medium transition-all shadow-sm flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Apply & Start Indexing ({netFilesToIndex.toLocaleString()} files)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
