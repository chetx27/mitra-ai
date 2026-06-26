import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        setSuccess('Check your email to confirm your account.')
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg)',
      padding: '24px',
    }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        <h1 style={{ fontFamily: 'var(--serif)', fontSize: '32px', fontWeight: 400, marginBottom: '8px', letterSpacing: '-0.01em' }}>
          {mode === 'signin' ? 'Welcome back.' : 'Create account.'}
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '40px' }}>
          {mode === 'signin' ? 'Sign in to manage your companions.' : 'Set up Mitra for your family or school.'}
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
            minLength={8}
          />

          {error && <p style={{ fontSize: '13px', color: '#ff8080' }}>{error}</p>}
          {success && <p style={{ fontSize: '13px', color: '#80cc80' }}>{success}</p>}

          <button type="submit" disabled={loading} style={{
            padding: '14px',
            background: loading ? '#222' : 'var(--text-primary)',
            color: loading ? 'var(--text-muted)' : '#000',
            border: 'none',
            borderRadius: '10px',
            fontSize: '14px',
            fontWeight: 500,
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s',
            marginTop: '4px',
          }}>
            {loading ? 'Please wait...' : mode === 'signin' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <button onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(''); setSuccess('') }} style={{
          marginTop: '20px',
          background: 'none',
          border: 'none',
          fontSize: '13px',
          color: 'var(--text-muted)',
          cursor: 'pointer',
          textDecoration: 'underline',
          transition: 'color 0.2s',
        }}
        onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
        onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
        >
          {mode === 'signin' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
        </button>
      </div>
    </div>
  )
}
