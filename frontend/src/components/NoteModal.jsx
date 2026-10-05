import React, { useState, useEffect, useRef } from 'react'
import { tipProps } from '../utils/tipProps.js'
import api from '../utils/api.js'
import { formatFileSize } from '../utils/files.js'

const ACCEPT = '.pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document'
const MAX_FILES = 5
const MAX_SIZE = 10 * 1024 * 1024

function fileExt(name = '') {
  return name.split('.').pop()?.toLowerCase() || ''
}

export default function NoteModal({ note, onSave, onClose, saving }) {
  const isEdit = Boolean(note?._id)
  const inputRef = useRef(null)
  const [form, setForm] = useState({
    text: '',
    category: 'General',
    important: false,
    type: 'note',
    isToday: false,
  })
  const [attachments, setAttachments] = useState([])
  const [pendingFiles, setPendingFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (note) {
      setForm({
        text: note.text || '',
        category: note.category || 'General',
        important: note.important || false,
        type: 'note',
        isToday: false,
      })
      setAttachments(note.attachments || [])
    } else {
      setAttachments([])
    }
    setPendingFiles([])
    setError('')
  }, [note])

  const handle = e => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm(f => ({ ...f, [e.target.name]: val }))
  }

  const onPickFiles = e => {
    const picked = Array.from(e.target.files || [])
    e.target.value = ''
    if (!picked.length) return

    setError('')
    const total = attachments.length + pendingFiles.length + picked.length
    if (total > MAX_FILES) {
      setError(`You can attach up to ${MAX_FILES} files`)
      return
    }

    const next = []
    for (const file of picked) {
      const ext = fileExt(file.name)
      if (!['pdf', 'doc', 'docx'].includes(ext)) {
        setError('Only PDF and Word files (.pdf, .doc, .docx) are allowed')
        return
      }
      if (file.size > MAX_SIZE) {
        setError(`"${file.name}" is larger than 10MB`)
        return
      }
      next.push(file)
    }
    setPendingFiles(f => [...f, ...next])
  }

  const removeAttachment = (filename) => {
    setAttachments(list => list.filter(a => a.filename !== filename))
  }

  const removePending = (index) => {
    setPendingFiles(list => list.filter((_, i) => i !== index))
  }

  const submit = async e => {
    e.preventDefault()
    if (!form.text.trim()) {
      setError('Note text is required')
      return
    }

    setError('')
    let uploaded = []
    if (pendingFiles.length) {
      setUploading(true)
      try {
        const body = new FormData()
        pendingFiles.forEach(f => body.append('files', f))
        const { data } = await api.post('/uploads', body)
        uploaded = data.files || []
      } catch (err) {
        setError(err.response?.data?.message || 'Upload failed')
        setUploading(false)
        return
      }
      setUploading(false)
    }

    onSave({
      ...form,
      attachments: [...attachments, ...uploaded],
    })
  }

  const busy = saving || uploading

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm animate-fade-in"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-2xl shadow-soft w-full max-w-md p-6 animate-fade-up max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-gray-800 text-base">{isEdit ? 'Edit Note' : 'New Note'}</h3>
          <button onClick={onClose} {...tipProps('Close')} className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Note *</label>
            <textarea
              name="text"
              value={form.text}
              onChange={handle}
              placeholder="Write your note here…"
              rows={5}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all resize-none"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Category</label>
            <input
              name="category"
              value={form.category}
              onChange={handle}
              placeholder="General"
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:border-purple-400 transition-all"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-gray-500">Attachments</label>
              <span className="text-[10px] text-gray-400">PDF, DOC, DOCX · max 10MB</span>
            </div>

            <input
              ref={inputRef}
              type="file"
              accept={ACCEPT}
              multiple
              className="hidden"
              onChange={onPickFiles}
            />

            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={attachments.length + pendingFiles.length >= MAX_FILES}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-gray-200 text-sm text-gray-500 hover:border-purple-300 hover:text-purple-600 hover:bg-purple-50/50 transition-all disabled:opacity-50"
            >
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/>
              </svg>
              Upload document
            </button>

            {(attachments.length > 0 || pendingFiles.length > 0) && (
              <ul className="mt-2 space-y-1.5">
                {attachments.map(a => (
                  <li key={a.filename} className="flex items-center gap-2 px-2.5 py-2 rounded-xl bg-gray-50 border border-gray-100">
                    <FileBadge ext={fileExt(a.originalName)} />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-gray-700 truncate">{a.originalName}</p>
                      <p className="text-[10px] text-gray-400">{formatFileSize(a.size)}</p>
                    </div>
                    <button type="button" onClick={() => removeAttachment(a.filename)}
                            {...tipProps('Remove')}
                            className="text-gray-400 hover:text-red-500 p-1">
                      <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </button>
                  </li>
                ))}
                {pendingFiles.map((f, i) => (
                  <li key={`pending-${i}-${f.name}`} className="flex items-center gap-2 px-2.5 py-2 rounded-xl bg-purple-50 border border-purple-100">
                    <FileBadge ext={fileExt(f.name)} />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-gray-700 truncate">{f.name}</p>
                      <p className="text-[10px] text-purple-500">Ready to upload · {formatFileSize(f.size)}</p>
                    </div>
                    <button type="button" onClick={() => removePending(i)}
                            {...tipProps('Remove')}
                            className="text-gray-400 hover:text-red-500 p-1">
                      <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input type="checkbox" name="important" checked={form.important} onChange={handle}
                   className="w-4 h-4 rounded accent-yellow-500"/>
            <span className="text-sm text-gray-600">⭐ Mark as important</span>
          </label>

          {error && (
            <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose}
                    className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-all">
              Cancel
            </button>
            <button type="submit" disabled={busy}
                    className="flex-1 py-2.5 rounded-xl text-white text-sm font-medium transition-all hover:-translate-y-0.5 hover:shadow-soft disabled:opacity-60"
                    style={{ background: 'linear-gradient(135deg,#6c47ff,#8b6dff)' }}>
              {uploading ? 'Uploading…' : saving ? 'Saving…' : (isEdit ? 'Save Note' : 'Add Note')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function FileBadge({ ext }) {
  const label = (ext || 'file').toUpperCase().slice(0, 4)
  const color = ext === 'pdf' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
  return (
    <span className={`text-[9px] font-bold px-1.5 py-1 rounded-md shrink-0 ${color}`}>
      {label}
    </span>
  )
}
