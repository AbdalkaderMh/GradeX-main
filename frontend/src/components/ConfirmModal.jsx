import React from 'react';

export default function ConfirmModal({ isOpen, onClose, onConfirm, title, message, confirmText = "تأكيد", cancelText = "إلغاء", type = "danger" }) {
  if (!isOpen) return null;

  const colorClass = type === "danger" ? "bg-error text-white hover:bg-error-dim" : "bg-primary text-white hover:bg-primary-dim";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-on-surface/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-surface-container-lowest rounded-[2rem] oceanic-shadow w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-8 text-right">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 ${type === 'danger' ? 'bg-error/10 text-error' : 'bg-primary/10 text-primary'}`}>
            <span className="material-symbols-outlined text-2xl">
              {type === 'danger' ? 'warning' : 'help'}
            </span>
          </div>
          <h3 className="text-2xl font-black text-on-surface mb-2">{title}</h3>
          <p className="text-on-surface-variant font-bold leading-relaxed">{message}</p>
        </div>
        <div className="p-6 bg-surface-container-low flex gap-4">
          <button
            onClick={onClose}
            className="flex-1 py-3 font-bold text-on-surface-variant hover:bg-surface-container-high rounded-xl transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={() => { onConfirm(); onClose(); }}
            className={`flex-[2] py-3 font-bold rounded-xl shadow-lg transition-all active:scale-95 ${colorClass}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
