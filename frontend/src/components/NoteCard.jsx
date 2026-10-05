import React, { useState } from 'react'
import { tipProps } from '../utils/tipProps.js'
import { fileUrl, formatFileSize } from '../utils/files.js'

function fileExt(name = '') {
  return name.split('.').pop()?.toLowerCase() || ''
}

export default function NoteCard({ note, onEdit, onDelete, index }) {
  const [hovered, setHovered] = useState(false)
  const created = note.createdAt
    ? new Date(note.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : null
  const attachments = note.attachments || []

  return (
    <div
      className={`relative bg-white rounded-2xl border border-gray-100 p-4 flex flex-col gap-2 transition-all duration-200 animate-fade-up delay-${Math.min(index + 1, 6)}
        ${hovered ? 'shadow-soft border-purple-100 -translate-y-0.5' : 'shadow-card'}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center shrink-0" {...tipProps('Note')}>
            <svg width="14" height="14" fill="none" stroke="#d97706" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
          </div>
          {note.important && <span className="text-xs shrink-0" {...tipProps('Important')}>⭐</span>}
          {attachments.length > 0 && (
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-purple-50 text-purple-600 shrink-0"
                  {...tipProps(`${attachments.length} attachment${attachments.length > 1 ? 's' : ''}`)}>
              {attachments.length} file{attachments.length > 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div className={`flex items-center gap-1 transition-opacity ${hovered ? 'opacity-100' : 'opacity-0'}`}>
          <button onClick={() => onEdit(note)}
                  {...tipProps('Edit note')}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-purple-600 hover:bg-purple-50 transition-colors">
            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
          <button onClick={() => onDelete(note._id)}
                  {...tipProps('Delete note')}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
            </svg>
          </button>
        </div>
      </div>

      <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap line-clamp-6">{note.text}</p>

      {attachments.length > 0 && (
        <ul className="flex flex-col gap-1 mt-1">
          {attachments.map(a => {
            const ext = fileExt(a.originalName)
            const badge = ext === 'pdf' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
            return (
              <li key={a.filename}>
                <a
                  href={fileUrl(a.url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  download={a.originalName}
                  {...tipProps(`Open ${a.originalName}`)}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-gray-50 hover:bg-purple-50 border border-transparent hover:border-purple-100 transition-colors group"
                  onClick={e => e.stopPropagation()}
                >
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${badge}`}>
                    {(ext || 'file').toUpperCase().slice(0, 4)}
                  </span>
                  <span className="text-xs text-gray-700 truncate flex-1 group-hover:text-purple-700">{a.originalName}</span>
                  <span className="text-[10px] text-gray-400 shrink-0">{formatFileSize(a.size)}</span>
                  <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
                       className="text-gray-300 group-hover:text-purple-500 shrink-0">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                </a>
              </li>
            )
          })}
        </ul>
      )}

      <div className="flex items-center justify-between mt-auto pt-1">
        {note.category && note.category !== 'General' ? (
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">{note.category}</span>
        ) : <span />}
        {created && <span className="text-[10px] text-gray-400">{created}</span>}
      </div>
    </div>
  )
}
