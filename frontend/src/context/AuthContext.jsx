import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api from '../utils/api.js'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('tf_user')) } catch { return null }
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('tf_token')
    if (!token) { setLoading(false); return }
    api.get('/auth/me')
      .then(res => setUser(res.data.user))
      .catch(() => {
        localStorage.removeItem('tf_token')
        localStorage.removeItem('tf_user')
      })
      .finally(() => setLoading(false))
  }, [])

  const login = useCallback(async (email, password) => {
    const res = await api.post('/auth/login', { email, password })
    localStorage.setItem('tf_token', res.data.token)
    localStorage.setItem('tf_user', JSON.stringify(res.data.user))
    sessionStorage.setItem('tf_deadline_prompt', '1')
    setUser(res.data.user)
    return res.data
  }, [])

  const register = useCallback(async (name, email, password) => {
    const res = await api.post('/auth/register', { name, email, password })
    localStorage.setItem('tf_token', res.data.token)
    localStorage.setItem('tf_user', JSON.stringify(res.data.user))
    sessionStorage.setItem('tf_deadline_prompt', '1')
    setUser(res.data.user)
    return res.data
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('tf_token')
    localStorage.removeItem('tf_user')
    sessionStorage.removeItem('tf_deadline_prompt')
    setUser(null)
  }, [])

  const updateProfile = useCallback(async (payload) => {
    const res = await api.put('/auth/profile', payload)
    localStorage.setItem('tf_user', JSON.stringify(res.data.user))
    setUser(res.data.user)
    return res.data
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
