import React, { useState, useEffect } from 'react';
import { InventoryRow } from '../types';
import { File, FileImage } from 'lucide-react';

interface ThumbnailProps {
  fileInfo: InventoryRow;
  fileObjectsRef: React.MutableRefObject<Map<string, globalThis.File>>;
}

export function Thumbnail({ fileInfo, fileObjectsRef }: ThumbnailProps) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    const isImage = ['.png', '.jpg', '.jpeg', '.svg', '.gif', '.webp'].includes((fileInfo.extension || '').toLowerCase());
    if (isImage) {
      const file = fileObjectsRef.current.get(fileInfo.relative_path);
      if (file) {
        const objectUrl = URL.createObjectURL(file);
        setUrl(objectUrl);
        return () => URL.revokeObjectURL(objectUrl);
      }
    }
    setUrl(null);
  }, [fileInfo.relative_path, fileInfo.extension, fileObjectsRef]);

  if (url) {
    return (
      <div className="w-6 h-6 rounded overflow-hidden bg-zinc-900 border border-zinc-700 flex items-center justify-center shrink-0">
        <img src={url} alt={fileInfo.file_name} className="w-full h-full object-cover" />
      </div>
    );
  }

  return (
    <div className="w-6 h-6 rounded bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0 text-zinc-500">
      <File className="w-3.5 h-3.5" />
    </div>
  );
}
