import React from 'react';
import { 
  LayoutDashboard, 
  FolderTree, 
  PieChart, 
  Copy, 
  SlidersHorizontal,
  FolderOpen
} from 'lucide-react';

export type MobileTab = 'overview' | 'files' | 'insights' | 'duplicates' | 'tools';

interface MobileBottomDockProps {
  activeTab: MobileTab;
  onSelectTab: (tab: MobileTab) => void;
  duplicateCount?: number;
  totalFiles?: number;
  onOpenFolder?: () => void;
}

export function MobileBottomDock({
  activeTab,
  onSelectTab,
  duplicateCount = 0,
  totalFiles = 0,
  onOpenFolder
}: MobileBottomDockProps) {
  const tabs: { id: MobileTab; label: string; icon: React.ReactNode; badge?: number | string }[] = [
    {
      id: 'overview',
      label: 'Overview',
      icon: <LayoutDashboard className="w-5 h-5" />,
      badge: totalFiles > 0 ? totalFiles : undefined
    },
    {
      id: 'files',
      label: 'Files',
      icon: <FolderTree className="w-5 h-5" />
    },
    {
      id: 'insights',
      label: 'Insights',
      icon: <PieChart className="w-5 h-5" />
    },
    {
      id: 'duplicates',
      label: 'Duplicates',
      icon: <Copy className="w-5 h-5" />,
      badge: duplicateCount > 0 ? duplicateCount : undefined
    },
    {
      id: 'tools',
      label: 'Tools',
      icon: <SlidersHorizontal className="w-5 h-5" />
    }
  ];

  return (
    <nav 
      aria-label="Mobile Navigation Dock"
      className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-zinc-950/95 backdrop-blur-xl border-t border-zinc-800/80 gpu-accelerated"
      style={{
        paddingBottom: 'max(8px, env(safe-area-inset-bottom, 16px))'
      }}
    >
      <div className="flex items-center justify-around px-2 pt-1.5 max-w-md mx-auto">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`relative flex flex-col items-center justify-center min-w-[56px] min-h-[48px] py-1 px-2 rounded-xl transition-all duration-150 ${
                isActive 
                  ? 'text-indigo-400 font-medium' 
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
              style={{
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent'
              }}
            >
              <div className="relative">
                {tab.icon}
                {tab.badge !== undefined && (
                  <span className="absolute -top-1.5 -right-2.5 px-1.5 py-0.2 min-w-[16px] text-[10px] font-bold rounded-full bg-rose-500 text-white flex items-center justify-center">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[11px] mt-1 tracking-tight leading-none">
                {tab.label}
              </span>
              {isActive && (
                <span className="absolute bottom-0 w-8 h-1 bg-indigo-500 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
