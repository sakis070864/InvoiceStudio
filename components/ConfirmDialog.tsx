import React from 'react';
import { X, AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  message: string;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({ isOpen, onConfirm, onCancel, title, message }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity"
      aria-labelledby="dialog-title"
      role="dialog"
      aria-modal="true"
      onClick={onCancel}
    >
      <div 
        className="bg-sidebar rounded-xl border border-border shadow-2xl w-full max-w-md m-4 p-6 transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-full bg-danger/10 sm:h-8 sm:w-8">
              <AlertTriangle className="h-5 w-5 text-danger" aria-hidden="true" />
            </div>
            <h3 className="text-lg font-semibold text-primary" id="dialog-title">
              {title}
            </h3>
          </div>
          <button onClick={onCancel} className="p-1 rounded-full text-secondary hover:bg-border">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="mt-4">
          <p className="text-sm text-secondary">
            {message}
          </p>
        </div>
        <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-3 space-y-2 space-y-reverse sm:space-y-0">
          <button
            type="button"
            className="w-full sm:w-auto justify-center rounded-md border border-border px-4 py-2 text-sm font-medium text-primary shadow-sm hover:bg-border transition-colors"
            onClick={onCancel}
          >
            Ακύρωση
          </button>
          <button
            type="button"
            className="w-full sm:w-auto justify-center rounded-md border border-transparent bg-danger px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 transition-colors"
            onClick={onConfirm}
          >
            Διαγραφή
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;