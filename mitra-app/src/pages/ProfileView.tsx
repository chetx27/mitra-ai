import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import AppShell from '../components/AppShell'
import type { Profile, ConversationLog, EmotionLabel } from '../lib/types'

const EMOTION_COLORS: Record<EmotionLabel, string> = {
  calm: '#80cc80',
  happy: '#80aacc',
  anxious: '#ccbb80',
  sad: '#cc9980',
  distressed: '#cc8080',
}

function NavCard({ title, description, onClick, accent }: { title: string; description: string; onClick: () => void; accent?: boolean }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--surface)',
        border: accent ? '1px solid var(--danger-border)' : '1px solid var(--border)',
        borderRadius: '16px',
        padding: '28px',
        cursor: 'pointer',
        transition: 'border-color 0.2s, background 0.2s',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-2)'; e.currentTarget.style.borderColor = 'var(--border-2)' }}
      onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface)'; e.currentTarget.style.borderColor = accent ? 'var(--danger-border)' : 'var(--border)' }}
    >
      <h3 style={{ fontFamily: 'var(--serif)', fontSize: '20px', fontWeight: 400, marginBottom: '8px' }}>{title}</h3>
      <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{description}</p>
    </div>
  )
}

export default function ProfileView() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [logs, setLogs] = useState<ConversationLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      if (!id) return
      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', id).single()
      if (profileData) setProfile(profileData)

      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      const { data: logData } = await supabase
        .from('conversation_logs')
        .select('*')
        .eq('profile_id', id)
        .gte('created_at', since)
        .order('created_at', { ascending: false })
        .limit(10)

      if (logData) setLogs(logData)
      setLoading(false)
    }
    load()
  }, [id])

  if (loading) {
    return (
      <AppShell back="/dashboard">
        <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
          <div style={{ width: '20px', height: '20px', border: '1.5px solid #222', borderTopColor: '#f5f5f0', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
        </div>
      </AppShell>
    )
  }

  if (!profile) {
    return (
      <AppShell back="/dashboard" title="Profile not found">
        <p style={{ color: 'var(--text-muted)' }}>This companion profile could not be loaded.</p>
      </AppShell>
    )
  }

  const emotionCounts: Partial<Record<EmotionLabel, number>> = {}
  logs.forEach(log => {
    emotionCounts[log.emotion_label] = (emotionCounts[log.emotion_label] || 0) + 1
  })

  return (
    <AppShell back="/dashboard" title={profile.companion_name}>
      <div style={{ marginBottom: '32px' }}>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
          {profile.age} years · {profile.language} · {profile.mode === 'elder' ? 'Elder mode' : 'Child mode'}
        </p>
        {profile.condition_notes && (
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '8px', lineHeight: 1.6 }}>
            {profile.condition_notes}
          </p>
        )}
      </div>

      {logs.length > 0 && (
        <div style={{
          padding: '24px',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          marginBottom: '32px',
        }}>
          <p style={{ fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '16px' }}>
            Last 24 hours
          </p>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {(Object.entries(emotionCounts) as [EmotionLabel, number][]).map(([emotion, count]) => (
              <span key={emotion} style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 14px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid var(--border)',
                borderRadius: '100px',
                fontSize: '13px',
                color: 'var(--text-secondary)',
              }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: EMOTION_COLORS[emotion] }} />
                {emotion} ({count})
              </span>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
        <NavCard
          title="Daily report"
          description="Emotion timeline, conversation logs, and daily summary."
          onClick={() => navigate(`/profile/${id}/report`)}
        />
        <NavCard
          title="Upload center"
          description="Photos, voice clips, and stories for Mitra to remember."
          onClick={() => navigate(`/profile/${id}/upload`)}
        />
        <NavCard
          title="Alert center"
          description="Safety alerts and crisis flags from conversations."
          onClick={() => navigate(`/profile/${id}/alerts`)}
          accent
        />
        <NavCard
          title="Device pairing"
          description="Link the Raspberry Pi device to this companion."
          onClick={() => navigate(`/pair/${id}`)}
        />
      </div>
    </AppShell>
  )
}
