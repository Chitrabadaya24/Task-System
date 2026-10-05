import React from 'react'
import { tipProps } from '../utils/tipProps.js'

const TYPE_LABEL = { task: 'Task', note: 'Note', link: 'Link', event: 'Event' }

export default function TrashItem({ item, kind = 'task', onRestore, onDelete, index }) {
  const typeKey = kind === 'event' ? 'event' : (item.type || 'task')
  const label = TYPE_LABEL[typeKey] || 'Item'
  const title = kind === 'event' ? item.title : item.text
  const sub = kind === 'link' && item.url ? item.url : null
  const deleted = item.deletedAt
    ? new Date(item.deletedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : null

  return (
    <div
      className={`flex items-center gap-3 px-1 py-3 border-b border-gray-100 last:border-0 rounded-lg animate-fade-up delay-${Math.min(index + 1, 6)}`}
    >
      <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-1 rounded-full bg-gray-100 text-gray-500 shrink-0 w-14 text-center">
        {label}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-800 truncate">{title}</p>
        {sub && <p className="text-[11px] text-gray-400 truncate">{sub}</p>}
      </div>
      {deleted && <span className="text-[10px] text-gray-400 shrink-0">{deleted}</span>}
      <div className="flex items-center gap-1 shrink-0">
        <button onClick={() => onRestore(item._id, kind)} {...tipProps('Restore')}
                className="p-1.5 rounded-lg text-gray-400 hover:text-teal-600 hover:bg-teal-50 transition-colors">
          <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/>
          </svg>
        </button>
        <button onClick={() => onDelete(item._id, kind)} {...tipProps('Delete permanently')}
                className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
          <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
          </svg>
        </button>
      </div>
    </div>
  )
}
