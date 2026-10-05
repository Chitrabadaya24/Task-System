import React, { useState, useMemo, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import Sidebar from '../components/Sidebar.jsx'
import TaskRow from '../components/TaskRow.jsx'
import TaskModal from '../components/TaskModal.jsx'
import SchedulePanel from '../components/SchedulePanel.jsx'
import CalendarView from '../components/CalendarView.jsx'
import NoteCard from '../components/NoteCard.jsx'
import NoteModal from '../components/NoteModal.jsx'
import LinkCard from '../components/LinkCard.jsx'
import LinkModal from '../components/LinkModal.jsx'
import MeetingCard from '../components/MeetingCard.jsx'
import MeetingModal from '../components/MeetingModal.jsx'
import SearchBar from '../components/SearchBar.jsx'
import TrashItem from '../components/TrashItem.jsx'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import DeadlineReminderModal from '../components/DeadlineReminderModal.jsx'
import ProfileModal from '../components/ProfileModal.jsx'
import HabitTracker from '../components/HabitTracker.jsx'
import JournalTracker from '../components/JournalTracker.jsx'
import { useTasks } from '../hooks/useTasks.js'
import { useSchedule } from '../hooks/useSchedule.js'
import { useCounts } from '../hooks/useCounts.js'
import { isTaskToday, isTaskUpcoming, isTaskOverdue, getWeekDays, scheduleOnDate, sortTasks, buildDeadlineItems } from '../utils/taskHelpers.js'
import { tipProps } from '../utils/tipProps.js'
import { useToast } from '../context/ToastContext.jsx'
import api from '../utils/api.js'

const NAV_TITLES = {
  today: 'Today Tasks',
  upcoming: 'Upcoming Tasks',
  calendar: 'Calendar',
  important: 'Important Tasks',
  notes: 'My Notes',
  links: 'My Links',
  meetings: 'Meetings',
  habits: 'Habit Tracker',
  journal: 'Dear Future Self',
  trash: 'Trash',
}

export default function Dashboard() {
  const { user, logout, updateProfile } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [navActive, setNavActive] = useState('today')
  const [activeFilter, setFilter] = useState('all')
  const [sortBy, setSortBy] = useState('created')
  const [sidebarCollapsed, setSC] = useState(false)
  const [modal, setModal] = useState(null)
  const [showNotif, setShowNotif] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [countsRefresh, setCountsRefresh] = useState(0)
  const [deadlineItems, setDeadlineItems] = useState([])
  const [showDeadlineModal, setShowDeadlineModal] = useState(false)
  const [showMobileSchedule, setShowMobileSchedule] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)
  const [habitCreateSignal, setHabitCreateSignal] = useState(0)
  const [habitBadge, setHabitBadge] = useState(0)

  const weekDays = useMemo(() => getWeekDays(), [])
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = weekDays.find(d => d.today)
    return today?.iso || weekDays[0]?.iso
  })

  const { tasks, loading, saving, handleSave, handleSaveMeeting, handleToggle, handleToggleSubtask, handleDelete, handleRestore, handleEmptyTrash } = useTasks(navActive)
  const { schedules, trashSchedules, loading: schedLoading, handleAdd, handleDelete: handleDeleteSchedule, handleRestore: handleRestoreSchedule, fetchSchedules, clearTrashSchedules } = useSchedule(navActive)
  const { counts, fetchCounts } = useCounts(countsRefresh)

  const bumpCounts = useCallback(() => {
    setCountsRefresh(k => k + 1)
    fetchCounts()
  }, [fetchCounts])
  const isCalendar = navActive === 'calendar'
  const isNotes = navActive === 'notes'
  const isLinks = navActive === 'links'
  const isMeetings = navActive === 'meetings'
  const isHabits = navActive === 'habits'
  const isJournal = navActive === 'journal'
  const showSchedule = !isCalendar && !isNotes && !isLinks && !isMeetings && !isHabits && !isJournal

  useEffect(() => {
    setShowMobileSchedule(false)
  }, [navActive])
  const isTrash = navActive === 'trash'
  const isTodayView = navActive === 'today'
  const isUpcomingView = navActive === 'upcoming'
  const daySchedules = schedules.filter(s => scheduleOnDate(s, selectedDate))

  const activeTasks = tasks.filter(t => !t.deletedAt)
  const pendingCount = activeTasks.filter(t => !t.done).length

  const todayTasks = tasks.filter(t => isTaskToday(t) && t.type !== 'note' && t.type !== 'link')
  const upcomingTasks = tasks.filter(t => isTaskUpcoming(t) && t.type !== 'note' && t.type !== 'link')

  const applyFilter = (list) => {
    if (isTrash) return list
    return list.filter(t => {
      if (activeFilter === 'important') return t.important
      return t.type !== 'note' && t.type !== 'link'
    })
  }

  const applyStatusAndSort = (list) => sortTasks(applyFilter(list), sortBy)

  const filteredToday = (() => {
    const list = applyStatusAndSort(todayTasks)
    // Keep overdue incomplete tasks at the top of Today
    return [...list].sort((a, b) => Number(isTaskOverdue(b)) - Number(isTaskOverdue(a)))
  })()
  const filteredUpcoming = applyStatusAndSort(upcomingTasks)
  const filteredAll = applyStatusAndSort(tasks)

  const doneCount = todayTasks.filter(t => t.done).length

  const pageTitle = NAV_TITLES[navActive] || 'Tasks'
  const isNoteModal = modal === 'new-note' || (modal && modal !== 'new' && modal !== 'new-link' && modal !== 'new-meeting' && modal.type === 'note')
  const isLinkModal = modal === 'new-link' || (modal && modal !== 'new' && modal !== 'new-note' && modal !== 'new-meeting' && modal.type === 'link')
  const isMeetingModal = modal === 'new-meeting' || (modal && modal !== 'new' && modal !== 'new-note' && modal !== 'new-link' && modal.category?.toLowerCase() === 'meetings' && modal.type !== 'note' && modal.type !== 'link')
  const isTaskModal = modal && !isNoteModal && !isLinkModal && !isMeetingModal

  const onSave = async (form) => {
    const editId = modal && modal !== 'new' && modal !== 'new-note' && modal !== 'new-link' && modal !== 'new-meeting' ? modal._id : null
    const ok = await handleSave(form, editId)
    if (ok) { setModal(null); bumpCounts() }
  }

  const onSaveMeeting = async (form) => {
    const editId = modal && modal !== 'new-meeting' ? modal._id : null
    const ok = await handleSaveMeeting(form, editId)
    if (ok) {
      setModal(null)
      bumpCounts()
      fetchSchedules()
    }
  }

  const onDeleteRequest = (id, kind = 'task') => {
    setConfirmDelete({
      id,
      kind,
      permanent: false,
      message: 'This will be moved to trash. You can restore it later from the Trash bin.',
    })
  }

  const onScheduleDeleteRequest = (id) => onDeleteRequest(id, 'event')

  const onTrashDeleteRequest = (id, kind = 'task') => {
    setConfirmDelete({
      id,
      kind,
      permanent: true,
      message: 'This will be permanently deleted and cannot be recovered.',
    })
  }

  const onConfirmDelete = async () => {
    if (!confirmDelete) return
    const { id, kind, permanent, emptyAll } = confirmDelete
    if (emptyAll) {
      const ok = await handleEmptyTrash()
      if (ok) {
        clearTrashSchedules()
        bumpCounts()
      }
    } else if (kind === 'event') {
      await handleDeleteSchedule(id, permanent)
      bumpCounts()
    } else {
      await handleDelete(id, permanent)
      setDeadlineItems(prev => prev.filter(t => String(t._id) !== String(id)))
      bumpCounts()
    }
    setConfirmDelete(null)
  }

  const onRestore = async (id, kind = 'task') => {
    if (kind === 'event') {
      await handleRestoreSchedule(id)
    } else {
      await handleRestore(id)
    }
    bumpCounts()
  }

  const onToggle = async (id, done) => {
    await handleToggle(id, done)
    if (done) {
      setDeadlineItems(prev => prev.filter(t => String(t._id) !== String(id)))
    }
    bumpCounts()
  }

  const onEmptyTrashRequest = () => {
    setConfirmDelete({
      emptyAll: true,
      permanent: true,
      message: 'All items in trash will be permanently deleted. This cannot be undone.',
    })
  }

  const trashEntries = isTrash
    ? [
        ...tasks.map(item => ({ item, kind: item.type || 'task' })),
        ...trashSchedules.map(item => ({ item, kind: 'event' })),
      ].sort((a, b) => new Date(b.item.deletedAt || 0) - new Date(a.item.deletedAt || 0))
    : []

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleSaveProfile = async (payload) => {
    setSavingProfile(true)
    try {
      await updateProfile(payload)
      toast('Profile updated', 'success')
      setShowProfile(false)
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to update profile')
    } finally {
      setSavingProfile(false)
    }
  }

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  const displayList = isTodayView ? null : isUpcomingView ? filteredUpcoming : filteredAll

  const sidebarBadges = {
    today: counts.today,
    important: counts.important,
    meetings: counts.meetings,
    habits: habitBadge || counts.habits,
    trash: counts.trash,
  }

  const handleSearchSelect = (item) => {
    if (item.category?.toLowerCase() === 'meetings') setModal(item)
    else if (item.type === 'note' || item.type === 'link') setModal(item)
    else setModal(item)
  }

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) {
        e.preventDefault()
        document.querySelector('[data-search-input]')?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    const THIRTY_MIN = 30 * 60 * 1000
    const LAST_SHOWN_KEY = 'deadline-last-shown'
    let cancelled = false

    const maybeShowDeadlines = async (force = false) => {
      const lastShown = Number(localStorage.getItem(LAST_SHOWN_KEY) || 0)
      if (!force && Date.now() - lastShown < THIRTY_MIN) return

      try {
        const { data } = await api.get('/tasks')
        if (cancelled) return
        const tagged = buildDeadlineItems(data || [])
        if (!tagged.length) {
          setDeadlineItems([])
          setShowDeadlineModal(false)
          return
        }
        setDeadlineItems(tagged)
        setShowDeadlineModal(true)
        localStorage.setItem(LAST_SHOWN_KEY, String(Date.now()))
      } catch {
        /* ignore popup fetch errors */
      }
    }

    // Show on login once; otherwise only if 30 minutes have passed
    const justLoggedIn = sessionStorage.getItem('tf_deadline_prompt') === '1'
    if (justLoggedIn) sessionStorage.removeItem('tf_deadline_prompt')
    maybeShowDeadlines(justLoggedIn)

    // Recheck every 30 minutes while the dashboard stays open
    const timer = setInterval(() => maybeShowDeadlines(false), THIRTY_MIN)
    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [])

  // Drop completed/deleted tasks from the open reminder list
  useEffect(() => {
    if (loading) return
    setDeadlineItems(prev => {
      if (!prev.length) return prev
      const liveById = new Map(tasks.map(t => [String(t._id), t]))
      const hasFullList = !['trash', 'important', 'meetings', 'notes', 'links'].includes(navActive)
      let changed = false
      const next = []
      for (const item of prev) {
        const live = liveById.get(String(item._id))
        if (live) {
          if (live.done || live.deletedAt) {
            changed = true
            continue
          }
          const tagged = buildDeadlineItems([live])[0]
          if (!tagged) {
            changed = true
            continue
          }
          next.push(tagged)
        } else if (hasFullList) {
          changed = true
        } else {
          next.push(item)
        }
      }
      return changed ? next : prev
    })
  }, [tasks, navActive, loading])

  useEffect(() => {
    if (showDeadlineModal && deadlineItems.length === 0) {
      setShowDeadlineModal(false)
    }
  }, [showDeadlineModal, deadlineItems])

  const dismissDeadlineModal = () => {
    localStorage.setItem('deadline-last-shown', String(Date.now()))
    setShowDeadlineModal(false)
  }

  const viewDeadlineTasks = () => {
    dismissDeadlineModal()
    setNavActive('today')
  }

  return (
    <div className="flex h-[100dvh] bg-[#f4f3f8] overflow-hidden">
      <Sidebar
        active={navActive}
        setActive={setNavActive}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSC(c => !c)}
        onLogout={handleLogout}
        onOpenProfile={() => setShowProfile(true)}
        badges={sidebarBadges}
        showScheduleBtn={showSchedule}
        onOpenSchedule={() => setShowMobileSchedule(true)}
      />

      <div className="flex-1 min-w-0 flex flex-col lg:flex-row overflow-hidden">
      <main className="flex-1 min-w-0 overflow-y-auto flex flex-col">
        <div className="sticky top-0 z-20 bg-white/80 backdrop-blur border-b border-gray-100 px-3 sm:px-6 py-3 flex items-center gap-2 sm:gap-0 sm:justify-between">
          <SearchBar onSelect={handleSearchSelect} onNavigate={setNavActive} />

          <div className="relative shrink-0">
            <button onClick={() => setShowNotif(s => !s)}
                    {...tipProps('Notifications', 'below')}
                    className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-purple-50 hover:text-purple-600 hover:border-transparent transition-all">
              <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 01-3.46 0"/>
              </svg>
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-purple-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                {pendingCount}
              </span>
            </button>
            {showNotif && (
              <div className="absolute right-0 top-12 w-56 sm:w-64 bg-white rounded-2xl shadow-soft border border-gray-100 p-3 z-50 animate-fade-up">
                <p className="text-xs font-semibold text-gray-500 mb-2">Pending Tasks</p>
                {activeTasks.filter(t => !t.done).slice(0, 4).map(t => (
                  <div key={t._id} className="py-1.5 border-b border-gray-50 last:border-0">
                    <p className="text-xs text-gray-700 truncate">{t.text}</p>
                  </div>
                ))}
                {pendingCount === 0 && <p className="text-xs text-gray-400">All done! 🎉</p>}
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 p-3 sm:p-6 flex flex-col gap-4 sm:gap-6 min-w-0">
          {!isJournal && (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <h1 className="font-serif text-2xl sm:text-3xl text-gray-900 truncate">{pageTitle}</h1>
              <p className="text-xs sm:text-sm text-gray-400 mt-1">
                {isTodayView ? `${today} · ${doneCount} of ${todayTasks.length} done`
                  : isCalendar ? 'Tasks & events by date'
                  : isNotes ? `${tasks.length} note${tasks.length !== 1 ? 's' : ''}`
                  : isLinks ? `${tasks.length} link${tasks.length !== 1 ? 's' : ''}`
                  : isMeetings ? `${tasks.length} meeting${tasks.length !== 1 ? 's' : ''}`
                  : isHabits ? 'Build streaks · track consistency · grow daily'
                  : isTrash ? `${trashEntries.length} item${trashEntries.length !== 1 ? 's' : ''} in trash`
                  : `${filteredAll.length} tasks`}
              </p>
            </div>
            {!isTrash && (
              <button
                onClick={() => {
                  if (isHabits) setHabitCreateSignal(k => k + 1)
                  else if (isNotes) setModal('new-note')
                  else if (isLinks) setModal('new-link')
                  else if (isMeetings) setModal('new-meeting')
                  else setModal('new')
                }}
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-medium transition-all hover:-translate-y-0.5 hover:shadow-soft w-full sm:w-auto shrink-0"
                style={{ background: 'linear-gradient(135deg,#6c47ff,#8b6dff)' }}
              >
                <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                {isNotes ? 'New Note' : isLinks ? 'New Link' : isMeetings ? 'New Meeting' : isHabits ? 'New Habit' : 'New Task'}
              </button>
            )}
          </div>
          )}

          {!isTrash && !isCalendar && !isNotes && !isLinks && !isMeetings && !isHabits && !isJournal && (
            <TaskControls
              activeFilter={activeFilter}
              sortBy={sortBy}
              onFilterChange={setFilter}
              onSortChange={setSortBy}
            />
          )}

          {isJournal ? (
            <JournalTracker />
          ) : isHabits ? (
            <HabitTracker
              createSignal={habitCreateSignal}
              onCountsChange={({ pendingToday }) => setHabitBadge(pendingToday || 0)}
            />
          ) : isCalendar ? (
            <CalendarView
              tasks={tasks}
              schedules={schedules}
              loading={loading || schedLoading}
              onEditTask={t => setModal(t)}
              onSelectDate={setSelectedDate}
            />
          ) : isNotes ? (
            loading ? <TaskSpinner /> : tasks.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 py-16 text-center">
                <p className="text-3xl mb-3">📝</p>
                <p className="text-sm text-gray-400 mb-4">No notes yet. Start writing!</p>
                <button onClick={() => setModal('new-note')}
                        className="text-sm text-purple-600 hover:underline">Create your first note</button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {tasks.map((n, i) => (
                  <NoteCard key={n._id} note={n} index={i}
                            onEdit={n => setModal(n)} onDelete={onDeleteRequest}/>
                ))}
              </div>
            )
          ) : isLinks ? (
            loading ? <TaskSpinner /> : tasks.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 py-16 text-center">
                <p className="text-3xl mb-3">🔗</p>
                <p className="text-sm text-gray-400 mb-4">No saved links yet.</p>
                <button onClick={() => setModal('new-link')}
                        className="text-sm text-purple-600 hover:underline">Save your first link</button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {tasks.map((l, i) => (
                  <LinkCard key={l._id} link={l} index={i}
                            onEdit={l => setModal(l)} onDelete={onDeleteRequest}/>
                ))}
              </div>
            )
          ) : isMeetings ? (
            loading ? <TaskSpinner /> : tasks.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 py-16 text-center">
                <p className="text-3xl mb-3">👥</p>
                <p className="text-sm text-gray-400 mb-4">No meetings scheduled yet.</p>
                <button onClick={() => setModal('new-meeting')}
                        className="text-sm text-purple-600 hover:underline">Schedule your first meeting</button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {tasks.map((m, i) => (
                  <MeetingCard key={m._id} meeting={m} index={i}
                               onToggle={onToggle} onEdit={m => setModal(m)} onDelete={onDeleteRequest}/>
                ))}
              </div>
            )
          ) : isTrash ? (
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              {loading || schedLoading ? <TaskSpinner /> : trashEntries.length === 0 ? (
                <EmptyState message="Trash is empty." />
              ) : (
                <>
                  <div className="px-5 py-3 border-b border-gray-100 flex justify-end">
                    <button onClick={onEmptyTrashRequest}
                            className="text-xs text-red-500 hover:text-red-600 hover:underline font-medium">
                      Empty trash
                    </button>
                  </div>
                  <div className="px-5 py-2">
                    {trashEntries.map(({ item, kind }, i) => (
                      <TrashItem
                        key={`${kind}-${item._id}`}
                        item={item}
                        kind={kind}
                        index={i}
                        onRestore={onRestore}
                        onDelete={onTrashDeleteRequest}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          ) : isTodayView ? (
            <>
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="px-5 pt-4 pb-2 flex items-center justify-between border-b border-gray-100">
                  <span className="text-xs text-gray-400">{filteredToday.length} tasks</span>
                  {todayTasks.length > 0 && (
                    <div className="h-1.5 rounded-full bg-gray-100 w-28 overflow-hidden">
                      <div className="h-full rounded-full bg-teal-400 transition-all duration-500"
                           style={{ width: `${(doneCount / Math.max(todayTasks.length, 1)) * 100}%` }}/>
                    </div>
                  )}
                </div>

                {loading ? <TaskSpinner /> : filteredToday.length === 0 ? (
                  <EmptyState message="No tasks for today. Add one!" />
                ) : (
                  <div className="px-5 py-2">
                    {filteredToday.map((t, i) => (
                      <TaskRow key={t._id} task={t} index={i}
                               onToggle={onToggle} onToggleSubtask={handleToggleSubtask}
                               onDelete={onDeleteRequest} onEdit={t => setModal(t)}/>
                    ))}
                  </div>
                )}

                <button onClick={() => setModal('new')}
                        className="flex items-center gap-2 w-full px-5 py-3 text-sm text-gray-400 hover:text-purple-600 hover:bg-purple-50/50 transition-all border-t border-gray-100">
                  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                  Add a task
                </button>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-serif text-xl text-gray-800">Upcoming Tasks</h2>
                  <button onClick={() => setNavActive('upcoming')} className="text-xs text-purple-600 cursor-pointer hover:underline">See all</button>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                  {loading ? <TaskSpinner /> : filteredUpcoming.length === 0 ? (
                    <EmptyState message="No upcoming tasks." compact />
                  ) : (
                    <div className="px-5 py-2">
                      {filteredUpcoming.map((t, i) => (
                        <TaskRow key={t._id} task={t} index={i}
                                 onToggle={onToggle} onToggleSubtask={handleToggleSubtask}
                                 onDelete={onDeleteRequest} onEdit={t => setModal(t)}/>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              {loading ? <TaskSpinner /> : displayList.length === 0 ? (
                <EmptyState message="No tasks here." />
              ) : (
                <div className="px-5 py-2">
                  {displayList.map((t, i) => (
                    <TaskRow key={t._id} task={t} index={i}
                             onToggle={onToggle} onToggleSubtask={handleToggleSubtask}
                             onDelete={onDeleteRequest} onEdit={t => setModal(t)}/>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {showSchedule && (
        <div className="hidden lg:flex h-full shrink-0">
          <SchedulePanel
            schedules={daySchedules}
            loading={schedLoading}
            weekDays={weekDays}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            onAdd={handleAdd}
            onDelete={onScheduleDeleteRequest}
          />
        </div>
      )}
      </div>

      {showSchedule && showMobileSchedule && (
        <div className="lg:hidden fixed inset-0 z-40 flex flex-col justify-end">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Close schedule"
            onClick={() => setShowMobileSchedule(false)}
          />
          <div className="relative z-10 max-h-[85dvh] overflow-y-auto rounded-t-2xl bg-white shadow-xl animate-slide-up">
            <SchedulePanel
              schedules={daySchedules}
              loading={schedLoading}
              weekDays={weekDays}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
              onAdd={handleAdd}
              onDelete={onScheduleDeleteRequest}
              onClose={() => setShowMobileSchedule(false)}
            />
          </div>
        </div>
      )}

      {modal && isNoteModal ? (
        <NoteModal
          note={modal === 'new-note' ? null : modal}
          saving={saving}
          onSave={onSave}
          onClose={() => setModal(null)}
        />
      ) : modal && isLinkModal ? (
        <LinkModal
          link={modal === 'new-link' ? null : modal}
          saving={saving}
          onSave={onSave}
          onClose={() => setModal(null)}
        />
      ) : modal && isMeetingModal ? (
        <MeetingModal
          meeting={modal === 'new-meeting' ? null : modal}
          saving={saving}
          onSave={onSaveMeeting}
          onClose={() => setModal(null)}
        />
      ) : isTaskModal && (
        <TaskModal
          task={modal === 'new' ? null : modal}
          saving={saving}
          onSave={onSave}
          onClose={() => setModal(null)}
        />
      )}

      {confirmDelete && (
        <ConfirmDialog
          title={confirmDelete.emptyAll ? 'Empty trash?' : confirmDelete.permanent ? 'Delete permanently?' : 'Move to trash?'}
          message={confirmDelete.message}
          confirmLabel={confirmDelete.emptyAll ? 'Empty trash' : confirmDelete.permanent ? 'Delete forever' : 'Move to trash'}
          danger={confirmDelete.permanent || confirmDelete.emptyAll}
          onConfirm={onConfirmDelete}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

      {showDeadlineModal && (
        <DeadlineReminderModal
          items={deadlineItems}
          onClose={dismissDeadlineModal}
          onViewTasks={viewDeadlineTasks}
        />
      )}

      {showProfile && (
        <ProfileModal
          user={user}
          saving={savingProfile}
          onSave={handleSaveProfile}
          onClose={() => setShowProfile(false)}
        />
      )}

      {showNotif && <div className="fixed inset-0 z-10" onClick={() => setShowNotif(false)}/>}
    </div>
  )
}

function TaskSpinner() {
  return (
    <div className="flex justify-center py-12">
      <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"/>
    </div>
  )
}

function EmptyState({ message, compact }) {
  return (
    <div className={`text-center text-sm text-gray-400 ${compact ? 'py-8' : 'py-12'}`}>
      {!compact && <p className="text-2xl mb-2">✅</p>}
      {message}
    </div>
  )
}

const TABS = [
  { key: 'all', label: 'All', icon: (
    <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
    </svg>
  )},
  { key: 'important', label: 'Important', icon: (
    <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
    </svg>
  )},
]

function TaskControls({ activeFilter, sortBy, onFilterChange, onSortChange }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <FilterTabs active={activeFilter} onChange={onFilterChange} />
      <select value={sortBy} onChange={e => onSortChange(e.target.value)}
              {...tipProps('Sort tasks')}
              className="px-3 py-1.5 rounded-xl border border-gray-100 bg-white text-xs text-gray-600 outline-none focus:border-purple-400 shadow-card">
        <option value="created">Newest first</option>
        <option value="dueDate">Due date</option>
        <option value="priority">Priority</option>
        <option value="name">Name</option>
      </select>
    </div>
  )
}

function FilterTabs({ active, onChange }) {
  return (
    <div className="flex items-center gap-1.5 bg-white border border-gray-100 rounded-2xl p-1 shadow-card w-fit">
      {TABS.map(tab => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          {...tipProps(tab.label)}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all duration-200
            ${active === tab.key
              ? 'bg-purple-600 text-white shadow-soft'
              : 'text-gray-500 hover:text-purple-600 hover:bg-purple-50'
            }`}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </div>
  )
}
