import React, { useMemo } from 'react'
import { tipProps } from '../utils/tipProps.js'
import { buildHeatmapWeeks, aggregateDailyCompletions } from '../utils/habitHelpers.js'

function levelClass(count, max) {
  if (!count) return 'bg-gray-100'
  const ratio = max ? count / max : 0
  if (ratio <= 0.25) return 'bg-purple-200'
  if (ratio <= 0.5) return 'bg-purple-300'
  if (ratio <= 0.75) return 'bg-purple-500'
  return 'bg-purple-700'
}

export default function HabitHeatmap({ habits }) {
  const map = useMemo(() => aggregateDailyCompletions(habits), [habits])
  const weeks = useMemo(() => buildHeatmapWeeks(map, 14), [map])
  const max = useMemo(() => Math.max(1, ...Object.values(map)), [map])

  return (
    <div className="habit-glass rounded-2xl border border-white/60 p-4 shadow-card">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold text-gray-800">Activity heatmap</h3>
          <p className="text-[11px] text-gray-400 mt-0.5">Last 14 weeks of completions</p>
        </div>
        <div className="flex items-center gap-1 text-[9px] text-gray-400">
          <span>Less</span>
          {[0, 1, 2, 3, 4].map(i => (
            <span
              key={i}
              className={`w-2.5 h-2.5 rounded-sm ${i === 0 ? 'bg-gray-100' : levelClass(i, 4)}`}
            />
          ))}
          <span>More</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="inline-flex gap-[3px] min-w-0">
          {weeks.map((col, wi) => (
            <div key={wi} className="flex flex-col gap-[3px]">
              {col.map(cell => (
                <div
                  key={cell.iso}
                  {...tipProps(cell.future ? cell.iso : `${cell.iso}: ${cell.count} completion${cell.count !== 1 ? 's' : ''}`)}
                  className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-sm transition-transform hover:scale-125
                    ${cell.future ? 'bg-transparent' : levelClass(cell.count, max)}
                    ${cell.today ? 'ring-1 ring-purple-600' : ''}`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
