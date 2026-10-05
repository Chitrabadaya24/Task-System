import { useState, useEffect, useCallback } from 'react'
import api from '../utils/api.js'
import { useToast } from '../context/ToastContext.jsx'

export function useTasks(navActive) {
  const { toast } = useToast()
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const buildParams = useCallback(() => {
    const params = {}
    if (navActive === 'trash') {
      params.trash = 'true'
    } else if (navActive === 'important') {
      params.important = 'true'
    } else if (navActive === 'meetings') {
      params.category = 'Meetings'
    } else if (navActive === 'notes') {
      params.type = 'note'
    } else if (navActive === 'links') {
      params.type = 'link'
    }
    return params
  }, [navActive])

  const fetchTasks = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/tasks', { params: buildParams() })
      setTasks(data)
    } catch (e) {
      toast(e.response?.data?.message || 'Failed to load tasks')
    } finally {
      setLoading(false)
    }
  }, [buildParams, toast])

  useEffect(() => { fetchTasks() }, [fetchTasks])

  const handleSave = async (form, editId) => {
    setSaving(true)
    try {
      const isNote = form.type === 'note'
      const isLink = form.type === 'link'
      const label = isNote ? 'Note' : isLink ? 'Link' : 'Task'
      if (editId) {
        const { data } = await api.put(`/tasks/${editId}`, form)
        setTasks(ts => ts.map(t => t._id === data._id ? data : t))
        toast(`${label} updated`, 'success')
      } else {
        const { data } = await api.post('/tasks', form)
        setTasks(ts => [data, ...ts])
        toast(`${label} created`, 'success')
      }
      return true
    } catch (e) {
      toast(e.response?.data?.message || 'Error saving')
      return false
    } finally {
      setSaving(false)
    }
  }

  const handleToggle = async (id, done) => {
    try {
      const { data } = await api.put(`/tasks/${id}`, { done })
      setTasks(ts => ts.map(t => t._id === data._id ? data : t))
    } catch (e) {
      toast(e.response?.data?.message || 'Error updating task')
    }
  }

  const handleToggleSubtask = async (taskId, index, done) => {
    try {
      const task = tasks.find(t => t._id === taskId)
      if (!task) return
      const subtasks = (task.subtasks || []).map((s, i) =>
        i === index ? { text: s.text, done } : { text: s.text, done: Boolean(s.done) }
      )
      const allDone = subtasks.length > 0 && subtasks.every(s => s.done)
      const { data } = await api.put(`/tasks/${taskId}`, {
        subtasks,
        ...(allDone ? { done: true } : {}),
      })
      setTasks(ts => ts.map(t => t._id === data._id ? data : t))
    } catch (e) {
      toast(e.response?.data?.message || 'Error updating mini task')
    }
  }

  const handleDelete = async (id, permanent = false) => {
    try {
      await api.delete(`/tasks/${id}`, { params: permanent ? { permanent: 'true' } : {} })
      setTasks(ts => ts.filter(t => t._id !== id))
      toast(permanent ? 'Permanently deleted' : 'Moved to trash', 'success')
    } catch (e) {
      toast(e.response?.data?.message || 'Error deleting')
    }
  }

  const handleRestore = async (id) => {
    try {
      const { data } = await api.put(`/tasks/${id}/restore`)
      setTasks(ts => ts.filter(t => t._id !== id))
      toast('Task restored', 'success')
      return data
    } catch (e) {
      toast(e.response?.data?.message || 'Error restoring task')
    }
  }

  const handleEmptyTrash = async () => {
    try {
      await api.delete('/tasks/trash')
      setTasks([])
      toast('Trash emptied', 'success')
      return true
    } catch (e) {
      toast(e.response?.data?.message || 'Error emptying trash')
      return false
    }
  }

  const handleSaveMeeting = async (form, editId) => {
    setSaving(true)
    try {
      const { addToSchedule, memberNames, ...taskFields } = form
      const payload = {
        text: taskFields.text,
        priority: taskFields.priority,
        dueDate: taskFields.dueDate || undefined,
        startTime: taskFields.startTime,
        endTime: taskFields.endTime,
        location: taskFields.location,
        meetingLink: taskFields.meetingLink,
        attendees: taskFields.attendees || [],
        important: taskFields.important,
        category: 'Meetings',
        type: 'task',
        isToday: false,
      }

      let saved
      if (editId) {
        const { data } = await api.put(`/tasks/${editId}`, payload)
        saved = data
        setTasks(ts => ts.map(t => t._id === data._id ? data : t))
      } else {
        const { data } = await api.post('/tasks', payload)
        saved = data
        setTasks(ts => [data, ...ts])
      }

      if (addToSchedule && form.dueDate) {
        const schedPayload = {
          title: form.text,
          date: form.dueDate,
          startTime: form.startTime || '',
          endTime: form.endTime || '',
          color: 'blue',
          members: form.attendees || [],
          taskId: saved._id,
        }
        if (saved.scheduleId) {
          await api.put(`/schedule/${saved.scheduleId}`, schedPayload)
        } else {
          const { data: sched } = await api.post('/schedule', schedPayload)
          const { data: updated } = await api.put(`/tasks/${saved._id}`, { scheduleId: sched._id })
          if (editId) setTasks(ts => ts.map(t => t._id === updated._id ? updated : t))
          else setTasks(ts => ts.map(t => t._id === saved._id ? updated : t))
        }
      } else if (saved.scheduleId) {
        await api.delete(`/schedule/${saved.scheduleId}`, { params: { permanent: 'true' } })
        const { data: updated } = await api.put(`/tasks/${saved._id}`, { scheduleId: null })
        setTasks(ts => ts.map(t => t._id === updated._id ? updated : t))
      }

      toast(editId ? 'Meeting updated' : 'Meeting scheduled', 'success')
      return true
    } catch (e) {
      toast(e.response?.data?.message || 'Error saving meeting')
      return false
    } finally {
      setSaving(false)
    }
  }

  return { tasks, loading, saving, fetchTasks, handleSave, handleSaveMeeting, handleToggle, handleToggleSubtask, handleDelete, handleRestore, handleEmptyTrash }
}
