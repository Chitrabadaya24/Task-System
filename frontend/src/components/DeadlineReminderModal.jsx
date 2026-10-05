import React from 'react'

const BADGE_STYLES = {
  overdue: 'bg-red-50 text-red-600 border border-red-100',
  today: 'bg-amber-50 text-amber-700 border border-amber-100',
  soon: 'bg-blue-50 text-blue-700 border border-blue-100',
}

const BADGE_LABELS = {
  overdue: 'Overdue',
  today: 'Due today',
  soon: 'Within 7 days',
}

export default function DeadlineReminderModal({ items, onClose, onViewTasks }) {
  if (!items?.length) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm animate-fade-in"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-2xl shadow-soft w-full max-w-lg p-6 animate-fade-up">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-serif text-2xl text-gray-900">Deadline Reminders</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <p className="text-sm text-gray-500 mb-5">
          You have {items.length} task{items.length !== 1 ? 's' : ''} with upcoming or missed deadlines.
        </p>

        <div className="max-h-72 overflow-y-auto pr-1 space-y-2">
          {items.map(item => (
            <div key={item._id} className="rounded-xl border border-gray-100 p-3 bg-white">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm text-gray-800 font-medium">{item.text}</p>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${BADGE_STYLES[item.reminderType]}`}>
                  {BADGE_LABELS[item.reminderType]}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Due {new Date(item.dueDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
          ))}
        </div>

        <div className="flex gap-2 mt-5">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-all"
          >
            Dismiss
          </button>
          <button
            type="button"
            onClick={onViewTasks}
            className="flex-1 py-2.5 rounded-xl text-white text-sm font-medium transition-all hover:-translate-y-0.5 hover:shadow-soft"
            style={{ background: 'linear-gradient(135deg,#6c47ff,#8b6dff)' }}
          >
            View Tasks
          </button>
        </div>
      </div>
    </div>
  )
}
