import React, { useState } from 'react'
import { tipProps } from '../utils/tipProps.js'

const PRIORITY = { high: 'text-red-500', medium: 'text-yellow-500', low: 'text-green-500' }

export default function TaskRow({ task, onToggle, onToggleSubtask, onDelete, onEdit, onRestore, index, isTrash }) {
  const [hovered, setHovered] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const dueDate = task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : null
  const overdue = task.dueDate && !task.done && new Date(task.dueDate) < new Date()
  const subtasks = task.subtasks || []
  const doneSubs = subtasks.filter(s => s.done).length

  const handleDelete = () => onDelete(task._id)

  const handleRestore = async () => {
    if (onRestore) await onRestore(task._id)
  }

  return (
    <div
      className={`border-b border-gray-100 last:border-0 transition-all duration-150 rounded-lg animate-fade-up delay-${Math.min(index + 1, 6)}
        ${hovered ? 'bg-purple-50/50' : ''}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="flex items-center gap-3 px-1 py-3">
        <button
          onClick={() => onToggle(task._id, !task.done)}
          {...tipProps(task.done ? 'Mark as incomplete' : 'Mark as complete')}
          className={`rounded-md border-[1.5px] flex items-center justify-center shrink-0 transition-all
            ${task.done ? 'bg-teal-400 border-teal-400 animate-check' : 'border-gray-300 hover:border-teal-400'}`}
          style={{ width: '18px', height: '18px' }}
        >
          {task.done && (
            <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
              <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </button>

        <div className="flex-1 min-w-0">
          <span className={`text-sm leading-snug transition-colors ${task.done ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
            {task.text}
          </span>
          {subtasks.length > 0 && (
            <button
              type="button"
              onClick={() => setExpanded(e => !e)}
              className="ml-2 text-[10px] font-medium text-purple-600 hover:underline align-middle"
              {...tipProps(expanded ? 'Hide mini tasks' : 'Show mini tasks')}
            >
              {doneSubs}/{subtasks.length} mini
            </button>
          )}
        </div>

        {dueDate && (
          <span className={`text-[11px] shrink-0 font-medium ${overdue ? 'text-red-500' : 'text-gray-400'}`}>
            {overdue ? '⚠ ' : ''}{dueDate}
          </span>
        )}

        {task.important && (
          <span {...tipProps('Important')} className="text-yellow-400 shrink-0 text-xs">⭐</span>
        )}
        <span className={`text-xs shrink-0 ${PRIORITY[task.priority] || 'text-gray-300'}`} {...tipProps(`Priority: ${task.priority}`)}>●</span>

        <div className={`flex items-center gap-1 transition-opacity shrink-0 ${hovered ? 'opacity-100' : 'opacity-0'}`}>
          {isTrash && onRestore && (
            <button onClick={handleRestore}
                    {...tipProps('Restore')}
                    className="p-1 rounded-lg text-gray-400 hover:text-teal-600 hover:bg-teal-50 transition-colors">
              <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/>
              </svg>
            </button>
          )}
          {!isTrash && (
            <button onClick={() => onEdit(task)}
                    {...tipProps('Edit task')}
                    className="p-1 rounded-lg text-gray-400 hover:text-purple-600 hover:bg-purple-100 transition-colors">
              <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </button>
          )}
          <button onClick={handleDelete}
                  {...tipProps(isTrash ? 'Delete permanently' : 'Move to trash')}
                  className="p-1 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
            </svg>
          </button>
        </div>
      </div>

      {expanded && subtasks.length > 0 && !isTrash && (
        <div className="pl-8 pr-2 pb-3 space-y-1.5">
          {subtasks.map((s, i) => (
            <div key={s._id || i} className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onToggleSubtask?.(task._id, i, !s.done)}
                {...tipProps(s.done ? 'Mark incomplete' : 'Mark complete')}
                className={`rounded border flex items-center justify-center shrink-0 transition-all
                  ${s.done ? 'bg-teal-400 border-teal-400' : 'border-gray-300 hover:border-teal-400'}`}
                style={{ width: 14, height: 14 }}
              >
                {s.done && (
                  <svg width="8" height="6" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </button>
              <span className={`text-xs ${s.done ? 'text-gray-400 line-through' : 'text-gray-600'}`}>{s.text}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
