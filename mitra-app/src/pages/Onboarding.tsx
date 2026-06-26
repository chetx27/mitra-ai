import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ingestProfile } from '../lib/api'
import AppShell from '../components/AppShell'
import type { CompanionMode, FamilyMember, Schedule } from '../lib/types'

const LANGUAGES = ['Kannada', 'Hindi', 'Tamil', 'Telugu', 'Bengali', 'Marathi', 'Gujarati', 'Malayalam', 'Punjabi', 'Odia', 'Assamese', 'English']

const STEPS = ['Basic info', 'Mode & language', 'Favourite topics', 'Family', 'Triggers & comfort', 'Schedule & review']

const TOPIC_PLACEHOLDERS = [
  'Old Kannada film songs from the 1970s',
  'Stories about her grandson Rohan',
  'Her shop in Shivajinagar',
  'Diwali celebrations with family',
  'The air force stories from her youth',
]

export default function Onboarding() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [companionName, setCompanionName] = useState('')
  const [age, setAge] = useState('')
  const [conditionNotes, setConditionNotes] = useState('')
  const [mode, setMode] = useState<CompanionMode>('elder')
  const [language, setLanguage] = useState('Kannada')
  const [favouriteTopics, setFavouriteTopics] = useState(['', '', '', '', ''])
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([{ name: '', relationship: '', note: '' }])
  const [triggers, setTriggers] = useState([''])
  const [comfortPatterns, setComfortPatterns] = useState([''])
  const [schedule, setSchedule] = useState<Schedule>({ morning: true, evening: true })

  function validateStep(): boolean {
    setError('')
    if (step === 0) {
      if (!companionName.trim()) { setError('Name is required'); return false }
      if (!age || Number(age) < 1) { setError('Valid age is required'); return false }
    }
    if (step === 1) {
      if (!language) { setError('Language is required'); return false }
    }
    if (step === 2) {
      const filled = favouriteTopics.filter(t => t.trim()).length
      if (filled < 1) { setError('Add at least one favourite topic'); return false }
    }
    if (step === 3) {
      const valid = familyMembers.some(m => m.name.trim() && m.relationship.trim())
      if (!valid) { setError('Add at least one family member with name and relationship'); return false }
    }
    return true
  }

  function handleContinue() {
    if (!validateStep()) return
    if (step < 5) setStep(step + 1)
  }

  async function handleSubmit() {
    if (!validateStep()) return
    setSubmitting(true)
    setError('')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const profile = {
        user_id: user.id,
        companion_name: companionName.trim(),
        age: Number(age),
        language,
        mode,
        condition_notes: conditionNotes.trim(),
        favourite_topics: favouriteTopics.filter(t => t.trim()),
        family_members: familyMembers.filter(m => m.name.trim()),
        triggers: triggers.filter(t => t.trim()),
        comfort_patterns: comfortPatterns.filter(c => c.trim()),
        schedule,
      }

      const { data, error: insertError } = await supabase
        .from('profiles')
        .insert(profile)
        .select()
        .single()

      if (insertError) throw insertError

      try {
        await ingestProfile(data.id)
      } catch {
      }

      navigate(`/pair/${data.id}`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create profile')
    } finally {
      setSubmitting(false)
    }
  }

  const labelStyle: React.CSSProperties = {
    fontSize: '12px',
    color: 'var(--text-muted)',
    marginBottom: '8px',
    display: 'block',
  }

  return (
    <AppShell title="Add companion" back="/dashboard">
      <div style={{ maxWidth: '560px' }}>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '48px', flexWrap: 'wrap' }}>
          {STEPS.map((s, i) => (
            <span key={s} style={{
              padding: '6px 14px',
              borderRadius: '100px',
              fontSize: '11px',
              background: i === step ? 'var(--text-primary)' : i < step ? 'var(--surface-2)' : 'transparent',
              color: i === step ? '#000' : i < step ? 'var(--text-primary)' : 'var(--text-muted)',
              border: i <= step ? 'none' : '1px solid var(--border)',
            }}>
              {i + 1}. {s}
            </span>
          ))}
        </div>

        {step === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h2 style={{ fontFamily: 'var(--serif)', fontSize: '24px', fontWeight: 400 }}>
              Who is Mitra for?
            </h2>
            <div>
              <label style={labelStyle}>Full name</label>
              <input value={companionName} onChange={e => setCompanionName(e.target.value)} placeholder="Ramaiah" />
            </div>
            <div>
              <label style={labelStyle}>Age</label>
              <input type="number" value={age} onChange={e => setAge(e.target.value)} placeholder="78" min={1} />
            </div>
            <div>
              <label style={labelStyle}>Condition or context (optional)</label>
              <textarea value={conditionNotes} onChange={e => setConditionNotes(e.target.value)} rows={3} placeholder="Lives alone since spouse passed. Mild hearing loss." />
            </div>
          </div>
        )}

        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <h2 style={{ fontFamily: 'var(--serif)', fontSize: '24px', fontWeight: 400 }}>
              Choose companion <em style={{ fontStyle: 'italic', color: 'var(--accent)' }}>mode.</em>
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {(['elder', 'child'] as CompanionMode[]).map(m => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  style={{
                    padding: '28px 20px',
                    background: mode === m ? 'var(--surface-2)' : 'var(--surface)',
                    border: mode === m ? '1px solid var(--text-primary)' : '1px solid var(--border)',
                    borderRadius: '16px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    color: 'var(--text-primary)',
                  }}
                >
                  <p style={{ fontFamily: 'var(--serif)', fontSize: '18px', marginBottom: '8px' }}>
                    {m === 'elder' ? 'Elder mode' : 'Child mode'}
                  </p>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    {m === 'elder'
                      ? 'Slower pace, long-term memories, gentle follow-ups.'
                      : 'Short sentences, warm affirmations, follows their lead.'}
                  </p>
                </button>
              ))}
            </div>
            <div>
              <label style={labelStyle}>Primary language</label>
              <select value={language} onChange={e => setLanguage(e.target.value)}>
                {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
          </div>
        )}

        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h2 style={{ fontFamily: 'var(--serif)', fontSize: '24px', fontWeight: 400 }}>
              Favourite topics & memories
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Five things Mitra can always return to in conversation.
            </p>
            {favouriteTopics.map((topic, i) => (
              <div key={i}>
                <label style={labelStyle}>Topic {i + 1}</label>
                <input
                  value={topic}
                  onChange={e => {
                    const next = [...favouriteTopics]
                    next[i] = e.target.value
                    setFavouriteTopics(next)
                  }}
                  placeholder={TOPIC_PLACEHOLDERS[i]}
                />
              </div>
            ))}
          </div>
        )}

        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h2 style={{ fontFamily: 'var(--serif)', fontSize: '24px', fontWeight: 400 }}>
              Family members
            </h2>
            {familyMembers.map((member, i) => (
              <div key={i} style={{
                padding: '20px',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}>
                <input value={member.name} onChange={e => {
                  const next = [...familyMembers]
                  next[i] = { ...next[i], name: e.target.value }
                  setFamilyMembers(next)
                }} placeholder="Name" />
                <input value={member.relationship} onChange={e => {
                  const next = [...familyMembers]
                  next[i] = { ...next[i], relationship: e.target.value }
                  setFamilyMembers(next)
                }} placeholder="Relationship (grandson, daughter)" />
                <input value={member.note} onChange={e => {
                  const next = [...familyMembers]
                  next[i] = { ...next[i], note: e.target.value }
                  setFamilyMembers(next)
                }} placeholder="Note (visits every Diwali)" />
                {familyMembers.length > 1 && (
                  <button type="button" onClick={() => setFamilyMembers(familyMembers.filter((_, j) => j !== i))} style={{
                    background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '12px', cursor: 'pointer', textAlign: 'left',
                  }}>
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button type="button" onClick={() => setFamilyMembers([...familyMembers, { name: '', relationship: '', note: '' }])} style={{
              padding: '10px 16px',
              background: 'none',
              border: '1px dashed var(--border)',
              borderRadius: '10px',
              color: 'var(--text-secondary)',
              fontSize: '13px',
              cursor: 'pointer',
            }}>
              + Add family member
            </button>
          </div>
        )}

        {step === 4 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <div>
              <h2 style={{ fontFamily: 'var(--serif)', fontSize: '24px', fontWeight: 400, marginBottom: '8px' }}>
                Things to avoid
              </h2>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                Topics or phrases that upset or confuse them.
              </p>
              {triggers.map((trigger, i) => (
                <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                  <input value={trigger} onChange={e => {
                    const next = [...triggers]
                    next[i] = e.target.value
                    setTriggers(next)
                  }} placeholder="Mentioning finances" />
                  {triggers.length > 1 && (
                    <button type="button" onClick={() => setTriggers(triggers.filter((_, j) => j !== i))} style={{
                      background: 'none', border: '1px solid var(--border)', borderRadius: '8px', padding: '0 12px', color: 'var(--text-muted)', cursor: 'pointer',
                    }}>×</button>
                  )}
                </div>
              ))}
              <button type="button" onClick={() => setTriggers([...triggers, ''])} style={{
                padding: '8px 14px', background: 'none', border: '1px dashed var(--border)', borderRadius: '8px', color: 'var(--text-secondary)', fontSize: '12px', cursor: 'pointer',
              }}>+ Add trigger</button>
            </div>
            <div>
              <h2 style={{ fontFamily: 'var(--serif)', fontSize: '24px', fontWeight: 400, marginBottom: '8px' }}>
                Things that calm them
              </h2>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                Comfort patterns Mitra can use when they seem distressed.
              </p>
              {comfortPatterns.map((pattern, i) => (
                <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                  <input value={pattern} onChange={e => {
                    const next = [...comfortPatterns]
                    next[i] = e.target.value
                    setComfortPatterns(next)
                  }} placeholder="Stories about elephants" />
                  {comfortPatterns.length > 1 && (
                    <button type="button" onClick={() => setComfortPatterns(comfortPatterns.filter((_, j) => j !== i))} style={{
                      background: 'none', border: '1px solid var(--border)', borderRadius: '8px', padding: '0 12px', color: 'var(--text-muted)', cursor: 'pointer',
                    }}>×</button>
                  )}
                </div>
              ))}
              <button type="button" onClick={() => setComfortPatterns([...comfortPatterns, ''])} style={{
                padding: '8px 14px', background: 'none', border: '1px dashed var(--border)', borderRadius: '8px', color: 'var(--text-secondary)', fontSize: '12px', cursor: 'pointer',
              }}>+ Add comfort pattern</button>
            </div>
          </div>
        )}

        {step === 5 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <h2 style={{ fontFamily: 'var(--serif)', fontSize: '24px', fontWeight: 400 }}>
              Daily schedule
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {(['morning', 'evening'] as const).map(period => (
                <label key={period} style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '16px 20px',
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  cursor: 'pointer',
                }}>
                  <input
                    type="checkbox"
                    checked={schedule[period]}
                    onChange={e => setSchedule({ ...schedule, [period]: e.target.checked })}
                    style={{ width: 'auto' }}
                  />
                  <span style={{ fontSize: '14px', textTransform: 'capitalize' }}>
                    {period} check-in
                  </span>
                </label>
              ))}
            </div>

            <div style={{
              padding: '24px',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '16px',
              marginTop: '16px',
            }}>
              <p style={{ fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '16px' }}>
                Review
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                <p><strong style={{ color: 'var(--text-primary)' }}>{companionName}</strong>, age {age}</p>
                <p>{mode === 'elder' ? 'Elder mode' : 'Child mode'} · {language}</p>
                {conditionNotes && <p>{conditionNotes}</p>}
                <p>{favouriteTopics.filter(t => t.trim()).length} favourite topics</p>
                <p>{familyMembers.filter(m => m.name.trim()).length} family members</p>
                <p>{triggers.filter(t => t.trim()).length} triggers · {comfortPatterns.filter(c => c.trim()).length} comfort patterns</p>
                <p>Check-ins: {[schedule.morning && 'morning', schedule.evening && 'evening'].filter(Boolean).join(', ') || 'none'}</p>
              </div>
            </div>
          </div>
        )}

        {error && <p style={{ fontSize: '13px', color: '#ff8080', marginTop: '24px' }}>{error}</p>}

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '40px', gap: '12px' }}>
          <button
            type="button"
            onClick={() => step > 0 ? setStep(step - 1) : navigate('/dashboard')}
            style={{
              padding: '12px 24px',
              background: 'none',
              border: '1px solid var(--border)',
              borderRadius: '10px',
              color: 'var(--text-secondary)',
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            {step === 0 ? 'Cancel' : 'Back'}
          </button>
          {step < 5 ? (
            <button type="button" onClick={handleContinue} style={{
              padding: '12px 28px',
              background: 'var(--text-primary)',
              color: '#000',
              border: 'none',
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
            }}>
              Continue
            </button>
          ) : (
            <button type="button" onClick={handleSubmit} disabled={submitting} style={{
              padding: '12px 28px',
              background: submitting ? '#222' : 'var(--text-primary)',
              color: submitting ? 'var(--text-muted)' : '#000',
              border: 'none',
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: 500,
              cursor: submitting ? 'not-allowed' : 'pointer',
            }}>
              {submitting ? 'Creating...' : 'Create companion'}
            </button>
          )}
        </div>
      </div>
    </AppShell>
  )
}
