import React, { useEffect, useState } from 'react';
import { FileText, Loader2 } from 'lucide-react';

interface FilePreviewProps {
  file: File | undefined;
  extension: string;
}

export function FilePreview({ file, extension }: FilePreviewProps) {
  const [content, setContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!file) return;
    
    const ext = extension.toLowerCase();
    if (!['.txt', '.md', '.json', '.csv'].includes(ext)) {
      return;
    }

    setLoading(true);
    file.text()
      .then(text => {
        // Limit preview size to avoid huge text rendering freezes
        const maxLength = 10000;
        if (text.length > maxLength) {
          setContent(text.substring(0, maxLength) + '\n\n... (preview truncated for large file)');
        } else {
          setContent(text);
        }
      })
      .catch(err => {
        console.error('Preview error', err);
        setError('Failed to read file preview.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [file, extension]);

  if (!file) return null;
  const ext = extension.toLowerCase();

  // Handle Image preview
  if (['.png', '.jpg', '.jpeg', '.svg', '.gif', '.webp'].includes(ext)) {
    const url = URL.createObjectURL(file);
    return (
      <div className="mt-4 pt-4 border-t border-zinc-800">
        <span className="block text-zinc-500 mb-2 text-xs uppercase tracking-wider">Preview</span>
        <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-2 flex items-center justify-center">
          <img src={url} alt="Preview" className="max-w-full max-h-64 object-contain rounded" onLoad={() => URL.revokeObjectURL(url)} />
        </div>
      </div>
    );
  }

  if (!['.txt', '.md', '.json', '.csv'].includes(ext)) return null;

  return (
    <div className="mt-4 pt-4 border-t border-zinc-800">
      <span className="block text-zinc-500 mb-2 text-xs uppercase tracking-wider flex items-center gap-1">
        <FileText className="w-3 h-3" /> File Preview
      </span>
      <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-zinc-300 text-xs font-mono whitespace-pre-wrap overflow-y-auto max-h-[300px] shadow-inner relative">
        {loading && (
          <div className="absolute inset-0 bg-zinc-950/80 flex items-center justify-center">
            <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
          </div>
        )}
        {error ? <span className="text-rose-400">{error}</span> : content}
      </div>
    </div>
  );
}
