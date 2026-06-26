import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import AppShell from '../components/AppShell'
import type { Alert, EmotionLabel } from '../lib/types'

const EMOTION_COLORS: Record<EmotionLabel, string> = {
  calm: '#80cc80',
  happy: '#80aacc',
  anxious: '#ccbb80',
  sad: '#cc9980',
  distressed: '#cc8080',
}

const SEVERITY_STYLES = {
  emergency: { bg: 'rgba(255,70,70,0.12)', border: 'rgba(255,70,70,0.25)', text: '#ff8080' },
  moderate: { bg: 'rgba(255,180,70,0.12)', border: 'rgba(255,180,70,0.25)', text: '#ffaa60' },
  info: { bg: 'rgba(255,255,255,0.04)', border: 'var(--border)', text: 'var(--text-muted)' },
}

function formatDate(iso: string) {
  const date = new Date(iso)
  const now = new Date()
  const isToday = date.toDateString() === now.toDateString()
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  const isYesterday = date.toDateString() === yesterday.toDateString()
  const time = date.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })
  if (isToday) return `Today ${time}`
  if (isYesterday) return `Yesterday ${time}`
  return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }) + ' ' + time
}

export default function AlertCenter() {
  const { id } = useParams<{ id: string }>()
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [tab, setTab] = useState<'unresolved' | 'resolved'>('unresolved')
  const [loading, setLoading] = useState(true)

  async function loadAlerts() {
    if (!id) return
    const { data } = await supabase
      .from('alerts')
      .select('*')
      .eq('profile_id', id)
      .order('created_at', { ascending: false })
    if (data) setAlerts(data)
    setLoading(false)
  }

  useEffect(() => { loadAlerts() }, [id])

  async function resolveAlert(alertId: string) {
    await supabase.from('alerts').update({ resolved: true }).eq('id', alertId)
    await loadAlerts()
  }

  const unresolved = alerts.filter(a => !a.resolved)
  const resolved = alerts.filter(a => a.resolved)
  const displayed = tab === 'unresolved' ? unresolved : resolved

  if (loading) {
    return (
      <AppShell back={`/profile/${id}`} title="Alert center">
        <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
          <div style={{ width: '20px', height: '20px', border: '1.5px solid #222', borderTopColor: '#f5f5f0', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell back={`/profile/${id}`} title="Alert center">
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        {(['unresolved', 'resolved'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: '8px 16px',
              background: tab === t ? 'var(--surface-2)' : 'transparent',
              border: tab === t ? '1px solid var(--border-2)' : '1px solid var(--border)',
              borderRadius: '8px',
              fontSize: '13px',
              color: tab === t ? 'var(--text-primary)' : 'var(--text-muted)',
              cursor: 'pointer',
              textTransform: 'capitalize',
            }}
          >
            {t} ({t === 'unresolved' ? unresolved.length : resolved.length})
          </button>
        ))}
      </div>

      {displayed.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
          {tab === 'unresolved' ? 'No unresolved alerts.' : 'No resolved alerts.'}
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {displayed.map(alert => {
            const style = SEVERITY_STYLES[alert.severity]
            return (
              <div key={alert.id} style={{
                padding: '24px',
                background: style.bg,
                border: `1px solid ${style.border}`,
                borderRadius: '16px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <span style={{
                    padding: '4px 10px',
                    background: 'rgba(0,0,0,0.2)',
                    borderRadius: '4px',
                    fontSize: '11px',
                    color: style.text,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}>
                    {alert.severity}
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{formatDate(alert.created_at)}</span>
                </div>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', fontStyle: 'italic', lineHeight: 1.6, marginBottom: '12px' }}>
                  &ldquo;{alert.transcript_excerpt}&rdquo;
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                    fontSize: '12px', color: 'var(--text-muted)', textTransform: 'capitalize',
                  }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: EMOTION_COLORS[alert.emotion_label] }} />
                    {alert.emotion_label}
                  </span>
                  {!alert.resolved && (
                    <button onClick={() => resolveAlert(alert.id)} style={{
                      padding: '8px 16px',
                      background: 'none',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      fontSize: '12px',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer',
                    }}>
                      Mark as resolved
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </AppShell>
  )
}
