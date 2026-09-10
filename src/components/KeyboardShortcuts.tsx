import React from 'react';
import { X, Command, Search, Download, Trash2, ArrowUpDown, CheckSquare, FileText } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  onClose: () => void;
}

export function KeyboardShortcutsModal({ onClose }: KeyboardShortcutsModalProps) {
  const shortcuts = [
    { key: '↑ / ↓', description: 'Navigate Inventory Rows', icon: <ArrowUpDown className="w-4 h-4 text-indigo-400" /> },
    { key: 'Space', description: 'Toggle Row Selection', icon: <CheckSquare className="w-4 h-4 text-indigo-400" /> },
    { key: 'Enter', description: 'Open File Details Inspector', icon: <FileText className="w-4 h-4 text-indigo-400" /> },
    { key: 'Ctrl + /', description: 'Focus Search Bar', icon: <Search className="w-4 h-4 text-zinc-400" /> },
    { key: 'Ctrl + D', description: 'Open Duplicate Cleanup', icon: <Trash2 className="w-4 h-4 text-zinc-400" /> },
    { key: 'Ctrl + E', description: 'Advanced Export Menu', icon: <Download className="w-4 h-4 text-zinc-400" /> },
    { key: 'Ctrl + K', description: 'Show Keyboard Shortcuts', icon: <Command className="w-4 h-4 text-zinc-400" /> },
    { key: 'Esc', description: 'Close modal / Clear row focus', icon: <X className="w-4 h-4 text-zinc-400" /> },
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-md w-full overflow-hidden shadow-2xl">
        <div className="px-6 py-4 border-b border-zinc-800 bg-zinc-900 flex justify-between items-center">
          <h3 className="font-medium text-zinc-100 flex items-center gap-2">
            <Command className="w-4 h-4 text-indigo-400" />
            Keyboard Shortcuts
          </h3>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">
          <div className="space-y-2">
            {shortcuts.map((s, idx) => (
              <div key={idx} className="flex justify-between items-center p-3 rounded-lg bg-zinc-950 border border-zinc-800/50">
                <div className="flex items-center gap-3">
                  {s.icon}
                  <span className="text-sm font-medium text-zinc-300">{s.description}</span>
                </div>
                <div className="bg-zinc-800 border border-zinc-700 text-zinc-400 px-2 py-1 rounded text-xs font-mono tracking-wider">
                  {s.key}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
