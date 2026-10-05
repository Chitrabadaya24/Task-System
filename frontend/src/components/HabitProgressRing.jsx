import React from 'react'

/** Circular progress ring — SVG based, no extra deps */
export default function HabitProgressRing({
  value = 0,
  size = 72,
  stroke = 7,
  color = '#6c47ff',
  trackColor = '#f3f0ff',
  label,
  sublabel,
}) {
  const pct = Math.max(0, Math.min(100, value))
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const offset = c - (pct / 100) * c

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="habit-ring-spin -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={trackColor} strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-sm font-semibold text-gray-800 leading-none">{label ?? `${pct}%`}</span>
        {sublabel && <span className="text-[9px] text-gray-400 mt-0.5">{sublabel}</span>}
      </div>
    </div>
  )
}
