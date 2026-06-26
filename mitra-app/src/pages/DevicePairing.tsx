import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import AppShell from '../components/AppShell'

function formatPairingCode(id: string) {
  return id.replace(/-/g, '').match(/.{1,4}/g)?.join(' ') || id
}

export default function DevicePairing() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [enteredCode, setEnteredCode] = useState('')
  const [confirmed, setConfirmed] = useState(false)

  const normalizedEntered = enteredCode.replace(/\s/g, '').toLowerCase()
  const normalizedId = (id || '').replace(/-/g, '').toLowerCase()
  const isMatch = normalizedEntered === normalizedId && normalizedEntered.length > 0

  function handleConfirm() {
    if (isMatch) setConfirmed(true)
  }

  const stepStyle: React.CSSProperties = {
    padding: '28px',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '16px',
    marginBottom: '16px',
  }

  return (
    <AppShell back="/dashboard" title="Device pairing">
      {confirmed ? (
        <div style={{
          textAlign: 'center',
          padding: '80px 24px',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '20px',
        }}>
          <h2 style={{ fontFamily: 'var(--serif)', fontSize: '28px', fontWeight: 400, marginBottom: '12px' }}>
            Pairing code confirmed.
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '32px', lineHeight: 1.6 }}>
            Enter this profile ID on your Raspberry Pi when running the setup script.
          </p>
          <code style={{
            display: 'block',
            padding: '16px 24px',
            background: '#111',
            border: '1px solid var(--border)',
            borderRadius: '10px',
            fontSize: '13px',
            color: 'var(--accent)',
            marginBottom: '32px',
            wordBreak: 'break-all',
          }}>
            {id}
          </code>
          <button onClick={() => navigate(`/profile/${id}`)} style={{
            padding: '12px 28px',
            background: 'var(--text-primary)',
            color: '#000',
            border: 'none',
            borderRadius: '100px',
            fontSize: '14px',
            fontWeight: 500,
            cursor: 'pointer',
          }}>
            Go to profile
          </button>
        </div>
      ) : (
        <>
          <div style={stepStyle}>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px' }}>Step 1</p>
            <h3 style={{ fontFamily: 'var(--serif)', fontSize: '20px', marginBottom: '12px' }}>Buy hardware</h3>
            <ul style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 2, paddingLeft: '20px' }}>
              <li>Raspberry Pi 4 (4GB RAM)</li>
              <li>ReSpeaker 2-Mic Pi HAT</li>
              <li>Small USB or Bluetooth speaker</li>
              <li>32GB microSD card + USB-C power supply</li>
            </ul>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '12px' }}>
              Estimated total: ₹4200
            </p>
          </div>

          <div style={stepStyle}>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px' }}>Step 2</p>
            <h3 style={{ fontFamily: 'var(--serif)', fontSize: '20px', marginBottom: '12px' }}>Flash and connect</h3>
            <ol style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 2, paddingLeft: '20px' }}>
              <li>Flash Raspberry Pi OS Lite to the microSD card</li>
              <li>Enable SSH and connect to your network</li>
              <li>SSH in and clone the Mitra device repository</li>
              <li>Copy your .env file with the pairing code below</li>
              <li>Run: python listener.py</li>
            </ol>
          </div>

          <div style={stepStyle}>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px' }}>Step 3</p>
            <h3 style={{ fontFamily: 'var(--serif)', fontSize: '20px', marginBottom: '16px' }}>Enter your pairing code</h3>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: 1.6 }}>
              Your pairing code (enter this on the device):
            </p>
            <code style={{
              display: 'block',
              padding: '16px 24px',
              background: '#111',
              border: '1px solid var(--border)',
              borderRadius: '10px',
              fontSize: '18px',
              color: 'var(--accent)',
              letterSpacing: '0.08em',
              marginBottom: '24px',
              fontFamily: 'monospace',
            }}>
              {formatPairingCode(id || '')}
            </code>
            <input
              value={enteredCode}
              onChange={e => setEnteredCode(e.target.value)}
              placeholder="Paste pairing code to confirm"
              style={{ marginBottom: '12px', fontFamily: 'monospace' }}
            />
            <button
              onClick={handleConfirm}
              disabled={!isMatch}
              style={{
                padding: '12px 24px',
                background: isMatch ? 'var(--text-primary)' : '#222',
                color: isMatch ? '#000' : 'var(--text-muted)',
                border: 'none',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: 500,
                cursor: isMatch ? 'pointer' : 'not-allowed',
              }}
            >
              Confirm pairing code
            </button>
          </div>

          <button
            onClick={() => navigate('/dashboard')}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '13px',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              textDecoration: 'underline',
              marginTop: '8px',
            }}
          >
            I&apos;ll do this later
          </button>
        </>
      )}
    </AppShell>
  )
}
