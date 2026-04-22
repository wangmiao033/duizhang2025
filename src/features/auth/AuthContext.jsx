import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { ApiError } from '@/lib/api/client'
import {
  authMe,
  changeMyPassword,
  loginOtp,
  loginPassword,
  logout as apiLogout,
  sendOtp
} from '@/features/auth/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const refreshMe = useCallback(async () => {
    setLoading(true)
    try {
      const me = await authMe()
      setUser(me)
    } catch (err) {
      setUser(null)
      if (!(err instanceof ApiError) || err.status !== 401) {
        console.error(err)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshMe()
  }, [refreshMe])

  const requestOtp = useCallback(async (email) => {
    return sendOtp(email)
  }, [])

  const signInWithOtp = useCallback(async (email, code) => {
    const me = await loginOtp(email, code)
    setUser(me)
    return me
  }, [])

  const signInWithPassword = useCallback(async (email, password) => {
    const me = await loginPassword(email, password)
    setUser(me)
    return me
  }, [])

  const signOut = useCallback(async () => {
    try {
      await apiLogout()
    } catch (err) {
      console.error(err)
    } finally {
      setUser(null)
    }
  }, [])

  const updateMyPassword = useCallback(async (currentPassword, newPassword) => {
    return changeMyPassword(currentPassword, newPassword)
  }, [])

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: !!user,
      isAdmin: user?.role === 'admin',
      refreshMe,
      requestOtp,
      signInWithOtp,
      signInWithPassword,
      signOut,
      updateMyPassword
    }),
    [user, loading, refreshMe, requestOtp, signInWithOtp, signInWithPassword, signOut, updateMyPassword]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
