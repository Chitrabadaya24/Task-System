import React, { useState } from 'react'
import { tipProps } from '../utils/tipProps.js'

const PRIORITY = { high: 'text-red-500', medium: 'text-yellow-500', low: 'text-green-500' }

export default function MeetingCard({ meeting, onToggle, onEdit, onDelete, index }) {
  const [hovered, setHovered] = useState(false)
  const dueDate = meeting.dueDate
    ? new Date(meeting.dueDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    : null
  const overdue = meeting.dueDate && !meeting.done && new Date(meeting.dueDate) < new Date()
  const timeRange = meeting.startTime
    ? `${meeting.startTime}${meeting.endTime ? ` – ${meeting.endTime}` : ''}`
    : null
  const attendees = meeting.attendees || []

  return (
    <div
      className={`relative bg-white rounded-2xl border border-gray-100 p-4 flex flex-col gap-3 transition-all duration-200 animate-fade-up delay-${Math.min(index + 1, 6)}
        ${hovered ? 'shadow-soft border-purple-100 -translate-y-0.5' : 'shadow-card'}
        ${meeting.done ? 'opacity-75' : ''}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            onClick={() => onToggle(meeting._id, !meeting.done)}
            {...tipProps(meeting.done ? 'Mark as incomplete' : 'Mark as complete')}
            className={`rounded-md border-[1.5px] flex items-center justify-center shrink-0 transition-all
              ${meeting.done ? 'bg-teal-400 border-teal-400' : 'border-gray-300 hover:border-teal-400'}`}
            style={{ width: '18px', height: '18px' }}
          >
            {meeting.done && (
              <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </button>
          <div className="w-8 h-8 rounded-xl bg-violet-50 flex items-center justify-center shrink-0" {...tipProps('Meeting')}>
            <svg width="14" height="14" fill="none" stroke="#7c3aed" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
            </svg>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {meeting.scheduleId && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600" {...tipProps('On schedule')}>📅</span>
          )}
          {meeting.important && <span className="text-xs" {...tipProps('Important')}>⭐</span>}
          <span className={`text-xs ${PRIORITY[meeting.priority] || 'text-gray-300'}`} {...tipProps(`Priority: ${meeting.priority}`)}>●</span>
        </div>
      </div>

      <p className={`text-sm font-medium leading-snug ${meeting.done ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
        {meeting.text}
      </p>

      {(timeRange || dueDate) && (
        <p className={`text-xs font-medium ${overdue ? 'text-red-500' : 'text-gray-500'}`}>
          {overdue && '⚠ '}{timeRange || dueDate}
          {timeRange && dueDate && <span className="text-gray-400 font-normal"> · {dueDate}</span>}
        </p>
      )}

      {meeting.location && (
        <p className="text-xs text-gray-500 truncate">📍 {meeting.location}</p>
      )}

      {meeting.meetingLink && (
        <a href={meeting.meetingLink.startsWith('http') ? meeting.meetingLink : `https://${meeting.meetingLink}`}
           target="_blank" rel="noopener noreferrer"
           onClick={e => e.stopPropagation()}
           className="text-xs text-purple-600 truncate hover:underline">
          🔗 Join meeting
        </a>
      )}

      {attendees.length > 0 && (
        <div className="flex items-center gap-1 flex-wrap">
          {attendees.slice(0, 4).map((a, i) => (
            <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{a.name}</span>
          ))}
          {attendees.length > 4 && (
            <span className="text-[10px] text-gray-400">+{attendees.length - 4}</span>
          )}
        </div>
      )}

      <div className="flex items-center justify-end mt-auto gap-2">
        <div className={`flex items-center gap-1 transition-opacity shrink-0 ${hovered ? 'opacity-100' : 'opacity-0'}`}>
          <button onClick={() => onEdit(meeting)}
                  {...tipProps('Edit meeting')}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-purple-600 hover:bg-purple-50 transition-colors">
            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
          <button onClick={() => onDelete(meeting._id)}
                  {...tipProps('Delete meeting')}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
