import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { generateDailyReport } from '../lib/api'
import AppShell from '../components/AppShell'
import type { ConversationLog, EmotionLabel } from '../lib/types'

const EMOTION_COLORS: Record<EmotionLabel, string> = {
  calm: '#80cc80',
  happy: '#80aacc',
  anxious: '#ccbb80',
  sad: '#cc9980',
  distressed: '#cc8080',
}

const ALL_EMOTIONS: EmotionLabel[] = ['calm', 'happy', 'anxious', 'sad', 'distressed']

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })
}

export default function DailyReport() {
  const { id } = useParams<{ id: string }>()
  const [logs, setLogs] = useState<ConversationLog[]>([])
  const [summary, setSummary] = useState('')
  const [loading, setLoading] = useState(true)

  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    async function load() {
      if (!id) return
      const start = `${today}T00:00:00`
      const end = `${today}T23:59:59`

      const { data } = await supabase
        .from('conversation_logs')
        .select('*')
        .eq('profile_id', id)
        .gte('created_at', start)
        .lte('created_at', end)
        .order('created_at', { ascending: true })

      if (data) setLogs(data)

      try {
        const result = await generateDailyReport(id, today)
        setSummary(result.summary)
      } catch {
        setSummary('')
      }

      setLoading(false)
    }
    load()
  }, [id, today])

  const hasSafetyFlag = logs.some(l => l.safety_flag)
  const emotionCounts: Record<EmotionLabel, number> = { calm: 0, happy: 0, anxious: 0, sad: 0, distressed: 0 }
  logs.forEach(l => { emotionCounts[l.emotion_label]++ })
  const total = logs.length || 1

  if (loading) {
    return (
      <AppShell back={`/profile/${id}`} title="Daily report">
        <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
          <div style={{ width: '20px', height: '20px', border: '1.5px solid #222', borderTopColor: '#f5f5f0', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell back={`/profile/${id}`} title="Daily report">
      {hasSafetyFlag && (
        <div style={{
          padding: '16px 20px',
          background: 'var(--danger)',
          border: '1px solid var(--danger-border)',
          borderRadius: '12px',
          marginBottom: '24px',
          color: 'var(--danger-text)',
          fontSize: '14px',
        }}>
          A safety alert was triggered during today&apos;s conversations. Check the Alert Center for details.
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '32px' }}>
        <div style={{ padding: '24px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px' }}>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>Conversations</p>
          <p style={{ fontFamily: 'var(--serif)', fontSize: '36px' }}>{logs.length}</p>
        </div>
        <div style={{ padding: '24px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', gridColumn: 'span 2' }}>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '16px' }}>Emotion breakdown</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {ALL_EMOTIONS.map(emotion => {
              const count = emotionCounts[emotion]
              const pct = Math.round((count / total) * 100)
              return (
                <div key={emotion} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ width: '70px', fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{emotion}</span>
                  <div style={{ flex: 1, height: '6px', background: 'var(--border)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: EMOTION_COLORS[emotion], borderRadius: '3px' }} />
                  </div>
                  <span style={{ width: '36px', fontSize: '12px', color: 'var(--text-muted)', textAlign: 'right' }}>{pct}%</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {summary && (
        <div style={{
          padding: '24px',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          marginBottom: '32px',
        }}>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>Summary</p>
          <p style={{ fontSize: '15px', lineHeight: 1.75, color: 'var(--text-secondary)' }}>{summary}</p>
        </div>
      )}

      <p style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '16px' }}>
        Timeline
      </p>
      {logs.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>No conversations recorded today.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {logs.map(log => (
            <div key={log.id} style={{
              padding: '20px',
              background: 'var(--surface)',
              border: log.safety_flag ? '1px solid var(--danger-border)' : '1px solid var(--border)',
              borderRadius: '12px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{formatTime(log.created_at)}</span>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'capitalize',
                }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: EMOTION_COLORS[log.emotion_label] }} />
                  {log.emotion_label}
                </span>
                {log.safety_flag && (
                  <span style={{ fontSize: '11px', color: 'var(--danger-text)', padding: '2px 8px', background: 'var(--danger)', borderRadius: '4px' }}>
                    Safety flag
                  </span>
                )}
              </div>
              <p style={{ fontSize: '14px', color: 'var(--text-primary)', lineHeight: 1.6, marginBottom: '8px' }}>
                {log.transcript.length > 120 ? log.transcript.slice(0, 120) + '...' : log.transcript}
              </p>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', fontStyle: 'italic', lineHeight: 1.5 }}>
                Mitra: {log.response.length > 100 ? log.response.slice(0, 100) + '...' : log.response}
              </p>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  )
}
