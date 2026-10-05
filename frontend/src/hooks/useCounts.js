import { useState, useEffect, useCallback } from 'react'
import api from '../utils/api.js'

export function useCounts(refreshKey = 0) {
  const [counts, setCounts] = useState({ today: 0, important: 0, meetings: 0, trash: 0, habits: 0 })

  const fetchCounts = useCallback(async () => {
    try {
      const [tasksRes, habitsRes] = await Promise.all([
        api.get('/tasks/counts'),
        api.get('/habits/counts').catch(() => ({ data: { pendingToday: 0 } })),
      ])
      setCounts({
        ...tasksRes.data,
        habits: habitsRes.data?.pendingToday || 0,
      })
    } catch { /* ignore */ }
  }, [])

  useEffect(() => { fetchCounts() }, [fetchCounts, refreshKey])

  return { counts, fetchCounts }
}
