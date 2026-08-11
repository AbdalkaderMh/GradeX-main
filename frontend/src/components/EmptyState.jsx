import React from 'react';

export default function EmptyState({ icon, title, message, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center animate-in fade-in duration-500">
      <div className="w-20 h-20 bg-surface-container-high rounded-full flex items-center justify-center mb-6 text-outline/40">
        <span className="material-symbols-outlined text-4xl">{icon || 'inventory_2'}</span>
      </div>
      <h3 className="text-xl font-bold text-on-surface mb-2">{title}</h3>
      <p className="text-on-surface-variant max-w-xs text-sm leading-relaxed mb-8">{message}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="px-6 py-2 bg-primary text-white rounded-xl font-bold text-sm shadow-lg hover:bg-primary-dim transition-all active:scale-95"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
