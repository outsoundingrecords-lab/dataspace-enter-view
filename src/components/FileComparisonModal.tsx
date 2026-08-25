import React, { useEffect, useState } from 'react';
import { X, FileText, ArrowRightLeft, Spline } from 'lucide-react';
import { InventoryRow } from '../types';
import { formatBytes } from '../utils';
import { FilePreview } from './FilePreview';
import { diffLines, Change } from 'diff';

interface FileComparisonModalProps {
  files: InventoryRow[];
  fileObjects: Map<string, File>;
  onClose: () => void;
}

export function FileComparisonModal({ files, fileObjects, onClose }: FileComparisonModalProps) {
  if (files.length !== 2) return null;
  const [f1, f2] = files;
  
  const obj1 = fileObjects.get(f1.relative_path);
  const obj2 = fileObjects.get(f2.relative_path);

  const [showDiff, setShowDiff] = useState(false);
  const [diffResult, setDiffResult] = useState<Change[] | null>(null);

  const isTextLike = (mime: string = '') => mime.startsWith('text/') || mime === 'application/json' || mime === 'application/javascript';
  const canDiff = obj1 && obj2 && isTextLike(f1.mime_type) && isTextLike(f2.mime_type);

  useEffect(() => {
    if (showDiff && canDiff && !diffResult) {
      Promise.all([obj1.text(), obj2.text()]).then(([t1, t2]) => {
        setDiffResult(diffLines(t1, t2));
      }).catch(err => {
        console.error('Failed to diff files:', err);
      });
    }
  }, [showDiff, canDiff, obj1, obj2]);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-6xl max-h-[90vh] flex flex-col shadow-2xl">
        <div className="px-6 py-4 border-b border-zinc-800 bg-zinc-900 flex justify-between items-center shrink-0">
          <h3 className="font-medium text-zinc-100 flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5 text-indigo-400" />
            Compare Files
          </h3>
          <div className="flex items-center gap-4">
            {canDiff && (
              <button
                onClick={() => setShowDiff(!showDiff)}
                className={`text-sm px-3 py-1.5 rounded-lg flex items-center gap-2 transition-colors ${showDiff ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'bg-zinc-800/50 text-zinc-300 border border-zinc-700/50 hover:bg-zinc-700/50'}`}
              >
                <Spline className="w-4 h-4" />
                {showDiff ? 'Show Previews' : 'Show Text Diff'}
              </button>
            )}
            <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {showDiff && diffResult ? (
          <div className="flex-1 overflow-y-auto p-6 bg-zinc-950/80">
            <div className="font-mono text-sm leading-relaxed whitespace-pre-wrap rounded-lg border border-zinc-800 bg-zinc-900 overflow-hidden">
              {diffResult.map((part, index) => (
                <div 
                  key={index} 
                  className={`px-4 py-1 ${part.added ? 'bg-emerald-500/10 text-emerald-400' : part.removed ? 'bg-rose-500/10 text-rose-400 line-through opacity-70' : 'text-zinc-400'}`}
                >
                  <span className="select-none inline-block w-8 text-zinc-600 border-r border-zinc-800/50 mr-4 text-xs">{part.added ? '+' : part.removed ? '-' : ' '}</span>
                  <span>{part.value}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 grid grid-cols-2 gap-6">
            {/* File 1 */}
            <div className="flex flex-col gap-4">
              <div className="bg-zinc-950/80 p-4 rounded-lg border border-zinc-800">
                <h4 className="text-indigo-400 font-medium mb-3 truncate" title={f1.relative_path}>{f1.file_name}</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="block text-zinc-500 text-xs uppercase mb-0.5">Path</span>
                    <span className="text-zinc-300 break-all">{f1.relative_path}</span>
                  </div>
                  <div>
                    <span className="block text-zinc-500 text-xs uppercase mb-0.5">Size</span>
                    <span className="text-zinc-300">{formatBytes(f1.size_bytes)}</span>
                  </div>
                  <div>
                    <span className="block text-zinc-500 text-xs uppercase mb-0.5">Type</span>
                    <span className="text-zinc-300">{f1.mime_type || 'Unknown'}</span>
                  </div>
                  <div>
                    <span className="block text-zinc-500 text-xs uppercase mb-0.5">Modified</span>
                    <span className="text-zinc-300">{new Date(f1.modified_utc).toLocaleString()}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="block text-zinc-500 text-xs uppercase mb-0.5">SHA-256 Hash</span>
                    <span className="text-zinc-300 font-mono text-xs break-all">{f1.sha256 || 'N/A'}</span>
                  </div>
                </div>
              </div>
              {obj1 && (
                <div className="flex-1 bg-zinc-950/80 p-4 rounded-lg border border-zinc-800 flex flex-col min-h-[300px]">
                  <FilePreview file={obj1} extension={f1.extension || ''} />
                </div>
              )}
            </div>

            {/* File 2 */}
            <div className="flex flex-col gap-4">
              <div className="bg-zinc-950/80 p-4 rounded-lg border border-zinc-800">
                <h4 className="text-sky-400 font-medium mb-3 truncate" title={f2.relative_path}>{f2.file_name}</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="block text-zinc-500 text-xs uppercase mb-0.5">Path</span>
                    <span className="text-zinc-300 break-all">{f2.relative_path}</span>
                  </div>
                  <div>
                    <span className="block text-zinc-500 text-xs uppercase mb-0.5">Size</span>
                    <span className="text-zinc-300">
                      {formatBytes(f2.size_bytes)}
                      {f2.size_bytes !== f1.size_bytes && (
                        <span className="ml-2 text-rose-400 text-xs">
                          ({f2.size_bytes > f1.size_bytes ? '+' : '-'}{formatBytes(Math.abs(f2.size_bytes - f1.size_bytes))})
                        </span>
                      )}
                    </span>
                  </div>
                  <div>
                    <span className="block text-zinc-500 text-xs uppercase mb-0.5">Type</span>
                    <span className="text-zinc-300">{f2.mime_type || 'Unknown'}</span>
                  </div>
                  <div>
                    <span className="block text-zinc-500 text-xs uppercase mb-0.5">Modified</span>
                    <span className="text-zinc-300">{new Date(f2.modified_utc).toLocaleString()}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="block text-zinc-500 text-xs uppercase mb-0.5">SHA-256 Hash</span>
                    <span className={`font-mono text-xs break-all ${f2.sha256 === f1.sha256 ? 'text-emerald-400' : 'text-zinc-300'}`}>
                      {f2.sha256 || 'N/A'}
                      {f2.sha256 === f1.sha256 && f2.sha256 && ' (Match)'}
                    </span>
                  </div>
                </div>
              </div>
              {obj2 && (
                <div className="flex-1 bg-zinc-950/80 p-4 rounded-lg border border-zinc-800 flex flex-col min-h-[300px]">
                  <FilePreview file={obj2} extension={f2.extension || ''} />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
