import { useState, useEffect, useCallback } from 'react'
import api from '../utils/api.js'
import { useToast } from '../context/ToastContext.jsx'

export function useSchedule(navActive) {
  const { toast } = useToast()
  const [schedules, setSchedules] = useState([])
  const [trashSchedules, setTrashSchedules] = useState([])
  const [loading, setLoading] = useState(true)

  const isTrash = navActive === 'trash'

  const fetchSchedules = useCallback(async () => {
    setLoading(true)
    try {
      if (isTrash) {
        const { data } = await api.get('/schedule', { params: { trash: 'true' } })
        setTrashSchedules(data)
      } else {
        const { data } = await api.get('/schedule')
        setSchedules(data)
        setTrashSchedules([])
      }
    } catch (e) {
      toast(e.response?.data?.message || 'Failed to load schedule')
    } finally {
      setLoading(false)
    }
  }, [isTrash, toast])

  useEffect(() => { fetchSchedules() }, [fetchSchedules])

  const handleAdd = async (form) => {
    try {
      const { data } = await api.post('/schedule', form)
      setSchedules(s => [...s, data])
      toast('Event added', 'success')
    } catch (e) {
      toast(e.response?.data?.message || 'Error adding event')
    }
  }

  const handleDelete = async (id, permanent = false) => {
    try {
      await api.delete(`/schedule/${id}`, { params: permanent ? { permanent: 'true' } : {} })
      if (permanent || isTrash) {
        setTrashSchedules(s => s.filter(x => x._id !== id))
      } else {
        setSchedules(s => s.filter(x => x._id !== id))
      }
      toast(permanent ? 'Event permanently deleted' : 'Event moved to trash', 'success')
    } catch (e) {
      toast(e.response?.data?.message || 'Error removing event')
    }
  }

  const handleRestore = async (id) => {
    try {
      await api.put(`/schedule/${id}/restore`)
      setTrashSchedules(s => s.filter(x => x._id !== id))
      toast('Event restored', 'success')
    } catch (e) {
      toast(e.response?.data?.message || 'Error restoring event')
    }
  }

  return {
    schedules,
    trashSchedules,
    loading,
    handleAdd,
    handleDelete,
    handleRestore,
    fetchSchedules,
    clearTrashSchedules: () => setTrashSchedules([]),
  }
}
