import React, { useState, useMemo } from 'react'
import { getMonthGrid, taskOnDate, scheduleOnDate, toDateKey, formatDateKey } from '../utils/taskHelpers.js'
import { tipProps } from '../utils/tipProps.js'

const WEEK_HEADERS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']
const WEEK_HEADERS_SHORT = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
const EVENT_DOT = { yellow: '#f5c842', blue: '#6c8eff', pink: '#f472b6', green: '#34d399' }

const isMeetingTask = (t) => t.category?.toLowerCase() === 'meetings'

export default function CalendarView({ tasks, schedules, loading, onEditTask, onSelectDate }) {
  const now = new Date()
  const [viewYear, setViewYear] = useState(now.getFullYear())
  const [viewMonth, setViewMonth] = useState(now.getMonth())
  const [picked, setPicked] = useState(() => toDateKey(new Date()))
  const [showDayPopup, setShowDayPopup] = useState(false)

  const monthLabel = new Date(viewYear, viewMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const monthLabelShort = new Date(viewYear, viewMonth).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  const cells = useMemo(() => getMonthGrid(viewYear, viewMonth), [viewYear, viewMonth])

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) }
    else setViewMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) }
    else setViewMonth(m => m + 1)
  }
  const goToday = () => {
    const t = new Date()
    setViewYear(t.getFullYear())
    setViewMonth(t.getMonth())
    const key = toDateKey(t)
    setPicked(key)
    onSelectDate?.(key)
  }

  const dayItems = useMemo(() => {
    const dayTasks = tasks.filter(t => taskOnDate(t, picked) && !isMeetingTask(t))
    const dayMeetings = tasks.filter(t => taskOnDate(t, picked) && isMeetingTask(t))
    const dayEvents = schedules.filter(s => scheduleOnDate(s, picked))
    return { dayTasks, dayMeetings, dayEvents }
  }, [tasks, schedules, picked])

  const { dayTasks, dayMeetings, dayEvents } = dayItems
  const hasAnything = dayTasks.length + dayMeetings.length + dayEvents.length > 0
  const totalCount = dayTasks.length + dayMeetings.length + dayEvents.length

  const handlePick = (iso) => {
    if (!iso) return
    setPicked(iso)
    onSelectDate?.(iso)
    setShowDayPopup(true)
  }

  const closePopup = () => setShowDayPopup(false)

  const openItem = (item) => {
    closePopup()
    onEditTask?.(item)
  }

  return (
    <div className="flex flex-col gap-4 sm:gap-6 w-full min-w-0">
      <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-100 overflow-hidden w-full">
        <div className="px-3 sm:px-5 py-3 sm:py-4 flex items-center justify-between gap-2 border-b border-gray-100">
          <h2 className="font-serif text-lg sm:text-xl text-gray-800 truncate">
            <span className="sm:hidden">{monthLabelShort}</span>
            <span className="hidden sm:inline">{monthLabel}</span>
          </h2>
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <button onClick={goToday} {...tipProps('Go to today')} className="text-[11px] sm:text-xs text-purple-600 hover:underline px-1.5 sm:px-2">Today</button>
            <button onClick={prevMonth} {...tipProps('Previous month')} className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg border border-gray-200 text-gray-500 hover:bg-purple-50 hover:text-purple-600 transition-all flex items-center justify-center">
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <button onClick={nextMonth} {...tipProps('Next month')} className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg border border-gray-200 text-gray-500 hover:bg-purple-50 hover:text-purple-600 transition-all flex items-center justify-center">
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12 sm:py-16">
            <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"/>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-7 border-b border-gray-100">
              {WEEK_HEADERS.map((h, idx) => (
                <div key={h + idx} className="py-1.5 sm:py-2 text-center text-[9px] sm:text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
                  <span className="sm:hidden">{WEEK_HEADERS_SHORT[idx]}</span>
                  <span className="hidden sm:inline">{h}</span>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {cells.map((cell, i) => {
                if (!cell) return <div key={`empty-${i}`} className="min-h-[48px] sm:min-h-[64px] md:min-h-[72px] border-b border-r border-gray-50 bg-gray-50/30"/>
                const dayAll = tasks.filter(t => taskOnDate(t, cell.iso))
                const tCount = dayAll.filter(t => !isMeetingTask(t)).length
                const mCount = dayAll.filter(t => isMeetingTask(t)).length
                const evts = schedules.filter(s => scheduleOnDate(s, cell.iso))
                const isToday = cell.iso === toDateKey(new Date())
                const selected = picked === cell.iso && showDayPopup
                return (
                  <button
                    key={cell.iso}
                    type="button"
                    onClick={() => handlePick(cell.iso)}
                    {...tipProps(formatDateKey(cell.iso, { weekday: 'long', month: 'long', day: 'numeric' }))}
                    className={`min-h-[48px] sm:min-h-[64px] md:min-h-[72px] p-1 sm:p-1.5 md:p-2 border-b border-r border-gray-50 text-left transition-colors duration-150
                      hover:bg-purple-100
                      ${isToday && !selected ? 'bg-purple-50 ring-1 sm:ring-2 ring-inset ring-purple-300' : ''}
                      ${selected ? 'bg-purple-100 ring-1 sm:ring-2 ring-inset ring-purple-400' : ''}`}
                  >
                    <span
                      className={`inline-flex w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 items-center justify-center rounded-full text-[10px] sm:text-xs font-semibold
                      ${isToday
                        ? 'text-white shadow-sm'
                        : selected
                          ? 'text-purple-700'
                          : 'text-gray-700'}`}
                      style={isToday ? { background: 'linear-gradient(135deg,#6c47ff,#8b6dff)' } : undefined}
                    >
                      {cell.day}
                    </span>
                    {isToday && (
                      <span className="hidden sm:block text-[8px] md:text-[9px] font-semibold text-purple-600 mt-0.5 tracking-wide">TODAY</span>
                    )}
                    <div className="flex flex-wrap gap-0.5 sm:gap-1 mt-0.5 sm:mt-1">
                      {tCount > 0 && (
                        <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-purple-500"/>
                      )}
                      {mCount > 0 && (
                        <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-violet-400"/>
                      )}
                      {evts.slice(0, 2).map((e, j) => (
                        <span key={e._id || j} className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full" style={{ background: EVENT_DOT[e.color] || EVENT_DOT.blue }}/>
                      ))}
                    </div>
                  </button>
                )
              })}
            </div>
          </>
        )}
      </div>

      {showDayPopup && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/20 backdrop-blur-sm animate-fade-in"
          onClick={e => { if (e.target === e.currentTarget) closePopup() }}
        >
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-soft w-full sm:max-w-md p-4 sm:p-6 animate-fade-up max-h-[85vh] sm:max-h-[85vh] overflow-y-auto">
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-gray-200 sm:hidden" />
            <div className="flex items-start justify-between gap-3 mb-1">
              <div className="min-w-0">
                <h3 className="font-serif text-xl sm:text-2xl text-gray-900 leading-tight">
                  {formatDateKey(picked, { weekday: 'short', month: 'short', day: 'numeric' })}
                  <span className="hidden sm:inline">
                    {`, ${formatDateKey(picked, { year: 'numeric' })}`}
                  </span>
                </h3>
                <p className="text-xs sm:text-sm text-gray-400 mt-1">
                  {hasAnything
                    ? `${totalCount} item${totalCount !== 1 ? 's' : ''} on this day`
                    : 'No tasks or meetings'}
                </p>
              </div>
              <button
                type="button"
                onClick={closePopup}
                {...tipProps('Close')}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors shrink-0"
              >
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            <div className="mt-4 sm:mt-5 flex flex-col gap-4 sm:gap-5">
              {!hasAnything ? (
                <p className="text-sm text-gray-400 text-center py-8">Nothing scheduled for this day.</p>
              ) : (
                <>
                  {dayTasks.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                        Tasks ({dayTasks.length})
                      </p>
                      <div className="flex flex-col gap-1.5">
                        {dayTasks.map(t => (
                          <button
                            key={t._id}
                            type="button"
                            onClick={() => openItem(t)}
                            className="flex items-center gap-2.5 text-left px-3 py-2.5 rounded-xl border border-gray-100 hover:border-purple-200 hover:bg-purple-50/60 transition-all"
                          >
                            <span className={`w-2 h-2 rounded-full shrink-0 ${t.done ? 'bg-teal-400' : 'bg-purple-500'}`}/>
                            <span className={`text-sm flex-1 min-w-0 break-words ${t.done ? 'text-gray-400 line-through' : 'text-gray-800'}`}>{t.text}</span>
                            {t.important && <span className="text-xs shrink-0">⭐</span>}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {dayMeetings.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                        Meetings ({dayMeetings.length})
                      </p>
                      <div className="flex flex-col gap-1.5">
                        {dayMeetings.map(t => (
                          <button
                            key={t._id}
                            type="button"
                            onClick={() => openItem(t)}
                            className="flex items-center gap-2.5 text-left px-3 py-2.5 rounded-xl border border-gray-100 hover:border-violet-200 hover:bg-violet-50/60 transition-all"
                          >
                            <span className="w-2 h-2 rounded-full shrink-0 bg-violet-500"/>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm truncate ${t.done ? 'text-gray-400 line-through' : 'text-gray-800'}`}>{t.text}</p>
                              {(t.startTime || t.location) && (
                                <p className="text-[11px] text-gray-400 mt-0.5 truncate">
                                  {[t.startTime, t.location].filter(Boolean).join(' · ')}
                                </p>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {dayEvents.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                        Schedule ({dayEvents.length})
                      </p>
                      <div className="flex flex-col gap-2">
                        {dayEvents.map(e => (
                          <div
                            key={e._id}
                            className="px-3 py-2.5 rounded-xl text-sm"
                            style={{ background: `${EVENT_DOT[e.color] || EVENT_DOT.blue}22` }}
                          >
                            <p className="font-medium text-gray-800">{e.title}</p>
                            {(e.startTime || e.endTime) && (
                              <p className="text-xs text-gray-500 mt-0.5">
                                {e.startTime}{e.startTime && e.endTime ? ' – ' : ''}{e.endTime}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
