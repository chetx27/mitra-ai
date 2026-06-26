import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import type { User } from '@supabase/supabase-js'

import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Onboarding from './pages/Onboarding'
import ProfileView from './pages/ProfileView'
import DailyReport from './pages/DailyReport'
import UploadCenter from './pages/UploadCenter'
import AlertCenter from './pages/AlertCenter'
import DevicePairing from './pages/DevicePairing'

function Spinner() {
  return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '24px', height: '24px', border: '2px solid #222', borderTopColor: '#f5f5f0', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
    </div>
  )
}

export default function App() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  if (loading) return <Spinner />

  return (
    <Routes>
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" replace />} />
      <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/login" replace />} />
      <Route path="/onboarding" element={user ? <Onboarding /> : <Navigate to="/login" replace />} />
      <Route path="/profile/:id" element={user ? <ProfileView /> : <Navigate to="/login" replace />} />
      <Route path="/profile/:id/report" element={user ? <DailyReport /> : <Navigate to="/login" replace />} />
      <Route path="/profile/:id/upload" element={user ? <UploadCenter /> : <Navigate to="/login" replace />} />
      <Route path="/profile/:id/alerts" element={user ? <AlertCenter /> : <Navigate to="/login" replace />} />
      <Route path="/pair/:id" element={user ? <DevicePairing /> : <Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to={user ? '/dashboard' : '/login'} replace />} />
    </Routes>
  )
}
