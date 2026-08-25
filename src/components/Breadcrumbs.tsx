import React from 'react';
import { ChevronRight, Folder } from 'lucide-react';

interface BreadcrumbsProps {
  path: string;
  onNavigate: (path: string) => void;
}

export function Breadcrumbs({ path, onNavigate }: BreadcrumbsProps) {
  if (!path) return null;

  const parts = path.split('/').filter(Boolean);
  
  return (
    <div className="flex items-center gap-1.5 text-sm text-zinc-500 overflow-x-auto whitespace-nowrap pb-1 scrollbar-hide">
      <button 
        onClick={() => onNavigate('')}
        className="flex items-center gap-1.5 hover:text-zinc-300 transition-colors"
      >
        <Folder className="w-4 h-4" />
        <span>Root</span>
      </button>
      
      {parts.map((part, index) => {
        const cumulativePath = parts.slice(0, index + 1).join('/');
        const isLast = index === parts.length - 1;
        
        return (
          <React.Fragment key={cumulativePath}>
            <ChevronRight className="w-3.5 h-3.5 flex-shrink-0 opacity-50" />
            <button
              onClick={() => !isLast && onNavigate(cumulativePath)}
              disabled={isLast}
              className={`transition-colors ${isLast ? 'text-zinc-200 font-medium cursor-default' : 'hover:text-zinc-300'}`}
            >
              {part}
            </button>
          </React.Fragment>
        );
      })}
    </div>
  );
}
