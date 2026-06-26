import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import AppShell from '../components/AppShell'
import type { Profile } from '../lib/types'

function ProfileCard({ profile }: { profile: Profile }) {
  const navigate = useNavigate()
  return (
    <div
      onClick={() => navigate(`/profile/${profile.id}`)}
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        padding: '28px',
        cursor: 'pointer',
        transition: 'border-color 0.2s, background 0.2s',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border-2)'; (e.currentTarget as HTMLDivElement).style.background = 'var(--surface-2)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLDivElement).style.background = 'var(--surface)' }}
    >
      <div style={{
        width: '44px', height: '44px',
        borderRadius: '50%',
        background: 'var(--surface-2)',
        border: '1px solid var(--border-2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'var(--serif)',
        fontSize: '18px',
        color: 'var(--text-secondary)',
      }}>
        {profile.companion_name[0]}
      </div>

      <div>
        <h3 style={{ fontFamily: 'var(--serif)', fontSize: '20px', fontWeight: 400, marginBottom: '4px' }}>
          {profile.companion_name}
        </h3>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          {profile.age} · {profile.language} · {profile.mode === 'elder' ? 'Elder mode' : 'Child mode'}
        </p>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginTop: '4px', flexWrap: 'wrap' }}>
        <span style={{
          padding: '4px 10px',
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid var(--border)',
          borderRadius: '100px',
          fontSize: '11px',
          color: 'var(--text-muted)',
        }}>
          {profile.mode === 'elder' ? 'Elder' : 'Child'}
        </span>
        <span style={{
          padding: '4px 10px',
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid var(--border)',
          borderRadius: '100px',
          fontSize: '11px',
          color: 'var(--text-muted)',
        }}>
          {profile.language}
        </span>
      </div>

      <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: 'auto' }}>
        View profile
      </p>
    </div>
  )
}

export default function Dashboard() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      if (!error && data) setProfiles(data)
      setLoading(false)
    }
    load()
  }, [])

  return (
    <AppShell title="Your companions">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div />
        <button onClick={() => navigate('/onboarding')} style={{
          padding: '10px 20px',
          background: 'var(--text-primary)',
          color: '#000',
          border: 'none',
          borderRadius: '100px',
          fontSize: '13px',
          fontWeight: 500,
          cursor: 'pointer',
        }}>
          + Add companion
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
          <div style={{ width: '20px', height: '20px', border: '1.5px solid #222', borderTopColor: '#f5f5f0', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
        </div>
      ) : profiles.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '100px 24px',
          border: '1px dashed var(--border)',
          borderRadius: '20px',
        }}>
          <h2 style={{ fontFamily: 'var(--serif)', fontSize: '28px', fontWeight: 400, marginBottom: '12px' }}>
            No companions yet.
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '32px', lineHeight: 1.6 }}>
            Set up Mitra for a family member or student.<br />It takes about 20 minutes.
          </p>
          <button onClick={() => navigate('/onboarding')} style={{
            padding: '12px 28px',
            background: 'var(--text-primary)',
            color: '#000',
            border: 'none',
            borderRadius: '100px',
            fontSize: '14px',
            fontWeight: 500,
            cursor: 'pointer',
          }}>
            Set up first companion
          </button>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '16px',
        }}>
          {profiles.map(p => <ProfileCard key={p.id} profile={p} />)}
        </div>
      )}
    </AppShell>
  )
}
