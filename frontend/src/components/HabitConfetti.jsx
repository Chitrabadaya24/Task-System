import React, { useEffect, useState } from 'react'

/** Lightweight confetti burst when all today's habits are done */
export default function HabitConfetti({ active, onDone }) {
  const [pieces, setPieces] = useState([])

  useEffect(() => {
    if (!active) {
      setPieces([])
      return
    }
    const colors = ['#6c47ff', '#00c9a7', '#00b4d8', '#f59e0b', '#ec4899', '#8b5cf6']
    const next = Array.from({ length: 36 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 0.4,
      duration: 1.4 + Math.random() * 0.8,
      color: colors[i % colors.length],
      rotate: Math.random() * 360,
      size: 6 + Math.random() * 6,
    }))
    setPieces(next)
    const t = setTimeout(() => {
      setPieces([])
      onDone?.()
    }, 2400)
    return () => clearTimeout(t)
  }, [active, onDone])

  if (!pieces.length) return null

  return (
    <div className="pointer-events-none fixed inset-0 z-[60] overflow-hidden" aria-hidden>
      {pieces.map(p => (
        <span
          key={p.id}
          className="habit-confetti absolute top-0 rounded-sm"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size * 1.4,
            background: p.color,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            transform: `rotate(${p.rotate}deg)`,
          }}
        />
      ))}
    </div>
  )
}
