import React from 'react'

export default function ConfirmDialog({ title, message, confirmLabel, onConfirm, onCancel, danger }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm animate-fade-in"
      onClick={e => { if (e.target === e.currentTarget) onCancel() }}
    >
      <div className="bg-white rounded-2xl shadow-soft w-full max-w-sm p-6 animate-fade-up">
        <h3 className="font-semibold text-gray-800 text-base mb-2">{title}</h3>
        <p className="text-sm text-gray-500 mb-5">{message}</p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-all"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`flex-1 py-2.5 rounded-xl text-white text-sm font-medium transition-all hover:-translate-y-0.5 hover:shadow-soft
              ${danger ? 'bg-red-500 hover:bg-red-600' : ''}`}
            style={danger ? undefined : { background: 'linear-gradient(135deg,#6c47ff,#8b6dff)' }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
