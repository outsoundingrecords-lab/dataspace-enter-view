import React from 'react';
import { 
  Database, 
  LayoutDashboard, 
  FolderTree, 
  Copy, 
  PieChart, 
  Network, 
  FolderSearch, 
  GitCompare, 
  AlertTriangle, 
  Settings, 
  Command, 
  PanelLeftClose, 
  PanelLeftOpen, 
  BookOpen,
  Sparkles,
  ShieldCheck,
  CheckCircle
} from 'lucide-react';

export type DesktopNavModule = 'overview' | 'files' | 'duplicates' | 'insights' | 'deps';

interface DesktopSidebarProps {
  activeModule: DesktopNavModule;
  onSelectModule: (module: DesktopNavModule) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onSelectFolder: () => void;
  onOpenQuickStart: () => void;
  onOpenCompare: () => void;
  onBatchValidate: () => void;
  onOpenPreferences: () => void;
  onOpenCommandPalette: () => void;
  onOpenGovernance: () => void;
  totalFiles: number;
  duplicateCount: number;
  isProcessing: boolean;
}

export function DesktopSidebar({
  activeModule,
  onSelectModule,
  isCollapsed,
  onToggleCollapse,
  onSelectFolder,
  onOpenQuickStart,
  onOpenCompare,
  onBatchValidate,
  onOpenPreferences,
  onOpenCommandPalette,
  onOpenGovernance,
  totalFiles,
  duplicateCount,
  isProcessing
}: DesktopSidebarProps) {
  const navItems: { id: DesktopNavModule; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'files', label: 'File Explorer', icon: <FolderTree className="w-4 h-4" />, badge: totalFiles > 0 ? totalFiles : undefined },
    { id: 'duplicates', label: 'Duplicates', icon: <Copy className="w-4 h-4" />, badge: duplicateCount > 0 ? duplicateCount : undefined },
    { id: 'insights', label: 'Insights & Charts', icon: <PieChart className="w-4 h-4" /> },
    { id: 'deps', label: 'Dependency Map', icon: <Network className="w-4 h-4" /> }
  ];

  return (
    <aside 
      className={`hidden lg:flex flex-col border-r border-zinc-800 bg-zinc-950/80 backdrop-blur-md transition-all duration-200 z-30 shrink-0 ${
        isCollapsed ? 'w-[72px]' : 'w-[250px]'
      }`}
    >
      {/* Top Header */}
      <div className="h-16 px-4 border-b border-zinc-800/80 flex items-center justify-between">
        {!isCollapsed ? (
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400 shrink-0">
              <Database className="w-5 h-5" />
            </div>
            <div className="flex flex-col truncate">
              <span className="font-semibold text-zinc-100 text-sm tracking-tight truncate">
                Structure Arch
              </span>
              <span className="text-[11px] text-zinc-500 truncate">
                Workspace Inspector
              </span>
            </div>
          </div>
        ) : (
          <div className="mx-auto p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
            <Database className="w-5 h-5" />
          </div>
        )}

        <button
          onClick={onToggleCollapse}
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          className="text-zinc-400 hover:text-zinc-200 p-1.5 rounded-lg hover:bg-zinc-900 transition-colors"
        >
          {isCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
        </button>
      </div>

      {/* Primary Action Button */}
      <div className="p-3">
        <button
          onClick={onSelectFolder}
          disabled={isProcessing}
          className={`w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition-all duration-150 flex items-center justify-center gap-2 shadow-sm ${
            isCollapsed ? 'p-2.5' : 'px-3 py-2.5'
          } ${isProcessing ? 'opacity-60 cursor-not-allowed' : 'active:scale-98'}`}
          title="Select Folder to Inventory"
        >
          <FolderSearch className="w-4 h-4 shrink-0" />
          {!isCollapsed && (
            <span className="truncate">{isProcessing ? 'Hashing...' : 'Select Folder'}</span>
          )}
        </button>
      </div>

      {/* Navigation Modules */}
      <div className="px-3 py-2 flex-1 overflow-y-auto space-y-1">
        <div className={`px-2 mb-2 text-[11px] font-medium tracking-wider text-zinc-500 uppercase ${isCollapsed ? 'text-center' : ''}`}>
          {!isCollapsed ? 'Workspace' : '•••'}
        </div>
        {navItems.map((item) => {
          const isActive = activeModule === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectModule(item.id)}
              title={item.label}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors ${
                isActive
                  ? 'bg-indigo-600/15 text-indigo-300 font-medium border border-indigo-500/30'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 border border-transparent'
              } ${isCollapsed ? 'justify-center px-2' : ''}`}
            >
              <span className={`shrink-0 ${isActive ? 'text-indigo-400' : 'text-zinc-400'}`}>
                {item.icon}
              </span>
              {!isCollapsed && (
                <span className="truncate flex-1 text-left">{item.label}</span>
              )}
              {!isCollapsed && item.badge !== undefined && (
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                  item.id === 'duplicates' 
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' 
                    : 'bg-zinc-800 text-zinc-300'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        <div className={`pt-4 px-2 mb-2 text-[11px] font-medium tracking-wider text-zinc-500 uppercase ${isCollapsed ? 'text-center' : ''}`}>
          {!isCollapsed ? 'Commands & Tools' : '•••'}
        </div>

        <button
          onClick={onOpenCommandPalette}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 transition-colors ${
            isCollapsed ? 'justify-center px-2' : ''
          }`}
          title="Command Palette (Cmd+K)"
        >
          <Command className="w-4 h-4 text-indigo-400 shrink-0" />
          {!isCollapsed && (
            <>
              <span className="truncate flex-1 text-left">Command Palette</span>
              <kbd className="text-[10px] font-mono bg-zinc-800 border border-zinc-700 text-zinc-400 px-1.5 py-0.5 rounded">
                ⌘K
              </kbd>
            </>
          )}
        </button>

        <button
          onClick={onOpenCompare}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 transition-colors ${
            isCollapsed ? 'justify-center px-2' : ''
          }`}
          title="Compare Workspace"
        >
          <GitCompare className="w-4 h-4 text-sky-400 shrink-0" />
          {!isCollapsed && <span className="truncate">Compare Workspace</span>}
        </button>

        <button
          onClick={onBatchValidate}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 transition-colors ${
            isCollapsed ? 'justify-center px-2' : ''
          }`}
          title="Validate Hashes"
        >
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          {!isCollapsed && <span className="truncate">Validate Hashes</span>}
        </button>

        <button
          onClick={onOpenGovernance}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 transition-colors ${
            isCollapsed ? 'justify-center px-2' : ''
          }`}
          title="Audit & Sign-Off Verification"
        >
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          {!isCollapsed && (
            <span className="truncate flex items-center gap-1.5">
              Audit Sign-Off
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </span>
          )}
        </button>
      </div>

      {/* Bottom Settings & Status */}
      <div className="p-3 border-t border-zinc-800/80 space-y-1">
        <button
          onClick={onOpenQuickStart}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 transition-colors ${
            isCollapsed ? 'justify-center px-2' : ''
          }`}
          title="Quick Start Guide"
        >
          <BookOpen className="w-4 h-4 text-zinc-400 shrink-0" />
          {!isCollapsed && <span className="truncate">Guide & Docs</span>}
        </button>

        <button
          onClick={onOpenPreferences}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 transition-colors ${
            isCollapsed ? 'justify-center px-2' : ''
          }`}
          title="Preferences"
        >
          <Settings className="w-4 h-4 text-zinc-400 shrink-0" />
          {!isCollapsed && <span className="truncate">Preferences</span>}
        </button>
      </div>
    </aside>
  );
}
