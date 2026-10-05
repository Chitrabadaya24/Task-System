import React, { useState } from 'react'
import { getLinkHref, getLinkDomain, normalizeUrl } from '../utils/linkHelpers.js'
import { tipProps } from '../utils/tipProps.js'

export default function LinkCard({ link, onEdit, onDelete, index }) {
  const [hovered, setHovered] = useState(false)
  const [copied, setCopied] = useState(false)
  const href = getLinkHref(link)
  const domain = href ? getLinkDomain(href) : null

  const handleCopy = async (e) => {
    e.stopPropagation()
    if (!href) return
    try {
      await navigator.clipboard.writeText(href)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch { /* ignore */ }
  }

  const handleOpen = (e) => {
    e.stopPropagation()
    if (href) window.open(href, '_blank', 'noopener,noreferrer')
  }

  return (
    <div
      className={`relative bg-white rounded-2xl border border-gray-100 p-4 flex flex-col gap-3 transition-all duration-200 animate-fade-up delay-${Math.min(index + 1, 6)}
        ${hovered ? 'shadow-soft border-purple-100 -translate-y-0.5' : 'shadow-card'}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0 text-sm font-bold text-blue-600"
               {...tipProps('Saved link')}>
            {domain ? domain.charAt(0).toUpperCase() : '🔗'}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-800 truncate">{link.text}</p>
            {domain && <p className="text-[11px] text-gray-400 truncate">{domain}</p>}
          </div>
        </div>
        {link.important && <span className="text-xs shrink-0" {...tipProps('Important')}>⭐</span>}
      </div>

      {href && (
        <p className="text-xs text-purple-600 truncate bg-purple-50/50 px-2.5 py-1.5 rounded-lg">{normalizeUrl(link.url || link.text)}</p>
      )}

      <div className="flex items-center justify-between mt-auto">
        <div className="flex items-center gap-1">
          {href && (
            <>
              <button onClick={handleOpen}
                      {...tipProps('Open in new tab')}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-purple-600 hover:bg-purple-50 transition-colors">
                <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
                  <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                </svg>
                Open
              </button>
              <button onClick={handleCopy}
                      {...tipProps('Copy URL')}
                      className="px-2.5 py-1 rounded-lg text-xs text-gray-500 hover:bg-gray-50 transition-colors">
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </>
          )}
        </div>
        <div className={`flex items-center gap-1 transition-opacity ${hovered ? 'opacity-100' : 'opacity-0'}`}>
          <button onClick={() => onEdit(link)}
                  {...tipProps('Edit link')}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-purple-600 hover:bg-purple-50 transition-colors">
            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
          <button onClick={() => onDelete(link._id)}
                  {...tipProps('Delete link')}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
            </svg>
          </button>
        </div>
      </div>

      {link.category && link.category !== 'General' && (
        <span className="absolute top-3 right-3 text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">{link.category}</span>
      )}
    </div>
  )
}
