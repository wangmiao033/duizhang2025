import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { ApiError } from '@/lib/api/client'
import {
  authMe,
  changeMyPassword,
  loginPassword,
  logout as apiLogout,
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

  const signInWithPassword = useCallback(async (account, password) => {
    const me = await loginPassword(account, password)
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
      signInWithPassword,
      signOut,
      updateMyPassword
    }),
    [user, loading, refreshMe, signInWithPassword, signOut, updateMyPassword]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
