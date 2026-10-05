import React from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { tipProps } from '../utils/tipProps.js'

const NAV = [
  { key: 'today',     label: 'Today',     icon: <><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></> },
  { key: 'upcoming',  label: 'Upcoming',  icon: <><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></> },
  { key: 'calendar',  label: 'Calendar',  icon: <><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><rect x="7" y="14" width="3" height="3" rx="0.5"/><rect x="12" y="14" width="3" height="3" rx="0.5"/></> },
  { key: 'important', label: 'Important', icon: <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/> },
  { key: 'notes',     label: 'Notes',     icon: <><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></> },
  { key: 'links',     label: 'Links',     icon: <><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></> },
  { key: 'meetings',  label: 'Meetings',  icon: <><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></> },
  { key: 'habits',    label: 'Habits',    icon: <><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></> },
  { key: 'journal',   label: 'Journal',   icon: <><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/><line x1="8" y1="7" x2="16" y2="7"/><line x1="8" y1="11" x2="14" y2="11"/></> },
  { key: 'trash',     label: 'Trash',     icon: <><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/></> },
]

export default function Sidebar({ active, setActive, collapsed, onToggleCollapse, onLogout, onOpenProfile, badges = {}, showScheduleBtn, onOpenSchedule }) {
  const { user } = useAuth()
  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U'

  const navWithBadges = NAV.map(item => ({
    ...item,
    badge: badges[item.key] > 0 ? badges[item.key] : null,
  }))

  return (
    <aside
      className={`flex flex-col bg-white border-r border-gray-100 transition-all duration-300 shrink-0
        ${collapsed ? 'w-14' : 'w-14 md:w-56'}`}
    >
      {/* Brand row — click logo to expand/collapse */}
      <div className="shrink-0 border-b border-gray-100 px-2 h-[53px] flex items-center">
        <button
          type="button"
          onClick={onToggleCollapse}
          {...tipProps(collapsed ? 'Expand sidebar' : 'Collapse sidebar', 'right')}
          className={`flex items-center gap-2 w-full rounded-lg transition-colors hover:bg-purple-50/80
            ${collapsed ? 'justify-center p-1' : 'justify-center md:justify-start px-1 py-1.5'}`}
        >
          <img
            src="/logo.png"
            alt="TaskPilot"
            className="w-8 h-8 rounded-lg object-cover shrink-0 ring-1 ring-black/10"
          />
          {!collapsed && (
            <span className="hidden md:inline text-[13px] font-semibold tracking-tight leading-none truncate">
              <span className="text-gray-900">Task</span>
              <span
                className="bg-clip-text text-transparent"
                style={{ backgroundImage: 'linear-gradient(90deg,#6c47ff,#00b4d8)' }}
              >
                Pilot
              </span>
            </span>
          )}
        </button>
      </div>

      <div className="flex flex-col gap-0.5 px-2 flex-1 overflow-y-auto pt-1">
        {!collapsed && (
          <div className="hidden md:block text-[10px] font-semibold tracking-widest text-gray-400 uppercase px-3 py-2">
            Menu
          </div>
        )}
        {navWithBadges.map(item => (
          <NavItem
            key={item.key}
            item={item}
            active={active === item.key}
            collapsed={collapsed}
            onClick={() => setActive(item.key)}
          />
        ))}

        {showScheduleBtn && (
          <div className="lg:hidden">
            <NavItem
              item={{
                key: 'schedule',
                label: 'Schedule',
                icon: <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>,
              }}
              active={false}
              collapsed={collapsed}
              onClick={onOpenSchedule}
            />
          </div>
        )}
      </div>

      <div className="border-t border-gray-100 p-2 shrink-0">
        <button
          type="button"
          onClick={onOpenProfile}
          {...tipProps('Edit profile', collapsed ? 'right' : undefined)}
          className={`w-full flex items-center gap-2 px-2 py-2 rounded-xl transition-colors hover:bg-purple-50 group
            ${collapsed ? 'justify-center' : 'justify-center md:justify-start'}`}
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
            style={{ background: 'linear-gradient(135deg,#6c47ff,#00c9a7)' }}
          >{initials}</div>
          {!collapsed && (
            <div className="hidden md:block flex-1 min-w-0 text-left">
              <p className="text-xs font-medium text-gray-800 truncate">{user?.name || 'User'}</p>
              <p className="text-[10px] text-gray-400 truncate">{user?.email}</p>
            </div>
          )}
          {!collapsed && (
            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
                 className="hidden md:block text-gray-300 group-hover:text-purple-500 shrink-0">
              <path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/>
            </svg>
          )}
        </button>
        <button onClick={onLogout}
                {...tipProps('Logout', collapsed ? 'right' : undefined)}
                className={`w-full flex items-center gap-2 px-2 py-2 mt-0.5 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors
                  ${collapsed ? 'justify-center' : 'justify-center md:justify-start'}`}>
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="shrink-0">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          {!collapsed && <span className="hidden md:inline text-xs">Logout</span>}
        </button>
      </div>
    </aside>
  )
}

function NavItem({ item, active, collapsed, onClick }) {
  return (
    <button
      onClick={onClick}
      {...tipProps(item.label)}
      className={`relative flex items-center gap-2.5 w-full py-2 rounded-lg text-left text-sm transition-all
        ${active ? 'bg-purple-100 text-purple-700 font-medium' : 'text-gray-500 hover:bg-purple-50 hover:text-purple-600'}
        ${collapsed ? 'justify-center px-0' : 'justify-center md:justify-start px-0 md:px-3'}`}
    >
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
           className="shrink-0" strokeLinecap="round" strokeLinejoin="round">
        {item.icon}
      </svg>
      {!collapsed && <span className="hidden md:inline truncate">{item.label}</span>}
      {!collapsed && item.badge != null && (
        <span className="hidden md:inline ml-auto text-[10px] font-semibold bg-purple-600 text-white rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
          {item.badge}
        </span>
      )}
      {item.badge != null && (
        <span className={`absolute top-1 right-1 md:hidden text-[8px] font-bold bg-purple-600 text-white rounded-full min-w-[14px] h-3.5 px-0.5 flex items-center justify-center ${collapsed ? '' : 'md:hidden'}`}>
          {item.badge > 9 ? '9+' : item.badge}
        </span>
      )}
    </button>
  )
}
