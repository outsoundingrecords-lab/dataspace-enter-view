import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Command, 
  X, 
  LayoutDashboard, 
  FolderTree, 
  BarChart3, 
  Copy, 
  FileText, 
  Download, 
  CheckCircle2, 
  Wand2, 
  Settings, 
  PanelRightClose, 
  PanelRightOpen, 
  RotateCcw,
  Sparkles,
  Layers
} from 'lucide-react';

export interface CommandItem {
  id: string;
  title: string;
  category: 'Navigation' | 'Actions' | 'Export' | 'View';
  icon: React.ReactNode;
  shortcut?: string;
  perform: () => void;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  commands: CommandItem[];
}

export function CommandPalette({ isOpen, onClose, commands }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const filteredCommands = commands.filter(cmd => 
    cmd.title.toLowerCase().includes(query.toLowerCase()) ||
    cmd.category.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % (filteredCommands.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % (filteredCommands.length || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredCommands[selectedIndex]) {
        filteredCommands[selectedIndex].perform();
        onClose();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/70 backdrop-blur-md z-[9999] flex items-start justify-center pt-16 sm:pt-24 p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="bg-zinc-900 border border-zinc-700/80 rounded-2xl max-w-xl w-full overflow-hidden shadow-2xl gpu-accelerated"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-zinc-800 bg-zinc-900/90">
          <Search className="w-5 h-5 text-indigo-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command or search action..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="bg-transparent border-none text-zinc-100 placeholder-zinc-500 text-base focus:outline-none w-full"
          />
          <kbd className="hidden sm:flex items-center gap-1 text-[11px] font-mono bg-zinc-800 border border-zinc-700 text-zinc-400 px-2 py-0.5 rounded">
            ESC to exit
          </kbd>
          <button 
            onClick={onClose} 
            className="text-zinc-400 hover:text-zinc-200 p-1 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="max-h-[360px] overflow-y-auto p-2 space-y-1">
          {filteredCommands.length === 0 ? (
            <div className="py-12 text-center text-zinc-500 text-sm">
              No matching actions or commands found.
            </div>
          ) : (
            filteredCommands.map((cmd, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={cmd.id}
                  onClick={() => {
                    cmd.perform();
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer text-sm transition-colors ${
                    isSelected ? 'bg-indigo-600/20 text-indigo-200 border border-indigo-500/30' : 'text-zinc-300 hover:bg-zinc-800/60 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`p-1.5 rounded-lg ${isSelected ? 'bg-indigo-600/30 text-indigo-300' : 'bg-zinc-800 text-zinc-400'}`}>
                      {cmd.icon}
                    </span>
                    <div className="flex flex-col">
                      <span className="font-medium text-zinc-200">{cmd.title}</span>
                      <span className="text-[11px] text-zinc-500">{cmd.category}</span>
                    </div>
                  </div>
                  {cmd.shortcut && (
                    <kbd className="text-[10px] font-mono bg-zinc-800/80 border border-zinc-700/60 text-zinc-400 px-2 py-0.5 rounded">
                      {cmd.shortcut}
                    </kbd>
                  )}
                </div>
              );
            })
          )}
        </div>

        <div className="px-4 py-2.5 bg-zinc-950/70 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-500">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 font-mono">↑↓ Navigate</span>
            <span>•</span>
            <span className="flex items-center gap-1 font-mono">↵ Execute</span>
          </div>
          <span className="text-zinc-500">Fast Workflow Palette</span>
        </div>
      </div>
    </div>
  );
}
