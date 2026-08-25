import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({ 
  title, 
  message, 
  confirmText = 'Confirm', 
  cancelText = 'Cancel', 
  onConfirm, 
  onCancel 
}: ConfirmModalProps) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[99999] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-sm w-full shadow-2xl overflow-hidden text-center flex flex-col">
        <div className="p-6 pb-2">
          <div className="w-12 h-12 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="font-medium text-lg text-zinc-100 mb-2">{title}</h3>
          <p className="text-zinc-400 text-sm mb-6">{message}</p>
        </div>
        <div className="grid grid-cols-2 border-t border-zinc-800 bg-zinc-950/50">
          <button 
            onClick={onCancel} 
            className="p-3 text-sm font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 transition-colors border-r border-zinc-800"
          >
            {cancelText}
          </button>
          <button 
            onClick={onConfirm} 
            className="p-3 text-sm font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
