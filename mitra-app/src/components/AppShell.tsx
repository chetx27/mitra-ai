import { NavLink, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

interface Props {
  children: React.ReactNode
  title?: string
  back?: string
}

export default function AppShell({ children, title, back }: Props) {
  const navigate = useNavigate()

  async function handleSignOut() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      <aside style={{
        width: '220px',
        flexShrink: 0,
        borderRight: '1px solid var(--border)',
        padding: '24px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        position: 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        zIndex: 10,
      }}>
        <NavLink to="/dashboard" style={{ textDecoration: 'none' }}>
          <span style={{ fontFamily: 'var(--serif)', fontSize: '18px', color: 'var(--text-primary)', display: 'block', padding: '8px 12px', marginBottom: '16px' }}>
            Mitra
          </span>
        </NavLink>

        {[
          { to: '/dashboard', label: 'All companions' },
          { to: '/onboarding', label: 'Add new' },
        ].map(({ to, label }) => (
          <NavLink key={to} to={to} style={({ isActive }) => ({
            display: 'block',
            padding: '9px 12px',
            borderRadius: '8px',
            fontSize: '13px',
            color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
            background: isActive ? 'var(--surface-2)' : 'transparent',
            textDecoration: 'none',
            transition: 'background 0.15s, color 0.15s',
          })}>
            {label}
          </NavLink>
        ))}

        <div style={{ marginTop: 'auto' }}>
          <button onClick={handleSignOut} style={{
            width: '100%',
            padding: '9px 12px',
            background: 'none',
            border: 'none',
            textAlign: 'left',
            fontSize: '13px',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            borderRadius: '8px',
            transition: 'color 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
          >
            Sign out
          </button>
        </div>
      </aside>

      <main style={{ flex: 1, marginLeft: '220px', padding: '48px', minHeight: '100vh' }}>
        {(back || title) && (
          <div style={{ marginBottom: '40px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            {back && (
              <button onClick={() => navigate(back)} style={{
                background: 'none', border: '1px solid var(--border)', borderRadius: '8px',
                padding: '7px 14px', fontSize: '12px', color: 'var(--text-muted)',
                cursor: 'pointer', transition: 'color 0.15s, border-color 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.borderColor = 'var(--border-2)' }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border)' }}
              >
                Back
              </button>
            )}
            {title && (
              <h1 style={{ fontFamily: 'var(--serif)', fontSize: '28px', fontWeight: 400, letterSpacing: '-0.01em' }}>
                {title}
              </h1>
            )}
          </div>
        )}
        <div style={{ animation: 'fade-up 0.4s ease both' }}>
          {children}
        </div>
      </main>
    </div>
  )
}
