import { useEffect, useState, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ingestFile } from '../lib/api'
import AppShell from '../components/AppShell'
import type { Memory, SourceType } from '../lib/types'

function MemoryItem({ item, onDelete }: { item: Memory; onDelete: () => void }) {
  return (
    <div style={{
      padding: '16px',
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: '12px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: '16px',
    }}>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '8px' }}>
          {item.content.length > 80 ? item.content.slice(0, 80) + '...' : item.content}
        </p>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{
            padding: '3px 8px',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid var(--border)',
            borderRadius: '4px',
            fontSize: '10px',
            color: 'var(--text-muted)',
          }}>
            {item.source_type.replace('_', ' ')}
          </span>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            {new Date(item.created_at).toLocaleDateString('en-IN')}
          </span>
        </div>
      </div>
      <button onClick={onDelete} style={{
        background: 'none',
        border: '1px solid var(--border)',
        borderRadius: '6px',
        padding: '6px 12px',
        fontSize: '12px',
        color: 'var(--text-muted)',
        cursor: 'pointer',
      }}>
        Delete
      </button>
    </div>
  )
}

export default function UploadCenter() {
  const { id } = useParams<{ id: string }>()
  const [memories, setMemories] = useState<Memory[]>([])
  const [storyText, setStoryText] = useState('')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const photoRef = useRef<HTMLInputElement>(null)
  const audioRef = useRef<HTMLInputElement>(null)

  async function loadMemories() {
    if (!id) return
    const { data } = await supabase
      .from('memories')
      .select('*')
      .eq('profile_id', id)
      .order('created_at', { ascending: false })
    if (data) setMemories(data)
  }

  useEffect(() => { loadMemories() }, [id])

  async function uploadFile(file: File, folder: string, sourceType: SourceType) {
    if (!id) return
    setUploading(true)
    setError('')
    try {
      const path = `${id}/${folder}/${Date.now()}_${file.name}`
      const { error: uploadError } = await supabase.storage.from('memories').upload(path, file)
      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage.from('memories').getPublicUrl(path)
      await ingestFile(id, urlData.publicUrl, sourceType)
      await loadMemories()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  async function saveStory() {
    if (!id || !storyText.trim()) return
    setUploading(true)
    setError('')
    try {
      await ingestFile(id, storyText.trim(), 'story')
      setStoryText('')
      await loadMemories()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setUploading(false)
    }
  }

  async function deleteMemory(item: Memory) {
    if (!id) return
    if (item.source_file_url) {
      const path = item.source_file_url.split('/memories/')[1]
      if (path) await supabase.storage.from('memories').remove([path])
    }
    await supabase.from('memories').delete().eq('id', item.id)
    await loadMemories()
  }

  const byType = (type: SourceType) => memories.filter(m => m.source_type === type)

  const sectionStyle: React.CSSProperties = {
    padding: '28px',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '16px',
    marginBottom: '24px',
  }

  return (
    <AppShell back={`/profile/${id}`} title="Upload center">
      {error && <p style={{ fontSize: '13px', color: '#ff8080', marginBottom: '16px' }}>{error}</p>}

      <div style={sectionStyle}>
        <h3 style={{ fontFamily: 'var(--serif)', fontSize: '18px', marginBottom: '8px' }}>Photos</h3>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px', lineHeight: 1.6 }}>
          Family photos are described by AI and stored as searchable memories.
        </p>
        <input
          ref={photoRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={e => {
            const file = e.target.files?.[0]
            if (file) uploadFile(file, 'photos', 'photo_description')
            e.target.value = ''
          }}
        />
        <button
          onClick={() => photoRef.current?.click()}
          disabled={uploading}
          style={{
            padding: '10px 20px',
            background: 'var(--text-primary)',
            color: '#000',
            border: 'none',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: 500,
            cursor: uploading ? 'not-allowed' : 'pointer',
            marginBottom: '16px',
          }}
        >
          {uploading ? 'Uploading...' : 'Upload photo'}
        </button>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {byType('photo_description').map(item => (
            <MemoryItem key={item.id} item={item} onDelete={() => deleteMemory(item)} />
          ))}
        </div>
      </div>

      <div style={sectionStyle}>
        <h3 style={{ fontFamily: 'var(--serif)', fontSize: '18px', marginBottom: '8px' }}>Voice clips</h3>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px', lineHeight: 1.6 }}>
          Recordings are transcribed and stored as text memories.
        </p>
        <input
          ref={audioRef}
          type="file"
          accept="audio/*"
          style={{ display: 'none' }}
          onChange={e => {
            const file = e.target.files?.[0]
            if (file) uploadFile(file, 'audio', 'voice_transcript')
            e.target.value = ''
          }}
        />
        <button
          onClick={() => audioRef.current?.click()}
          disabled={uploading}
          style={{
            padding: '10px 20px',
            background: 'var(--text-primary)',
            color: '#000',
            border: 'none',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: 500,
            cursor: uploading ? 'not-allowed' : 'pointer',
            marginBottom: '16px',
          }}
        >
          {uploading ? 'Uploading...' : 'Upload voice clip'}
        </button>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {byType('voice_transcript').map(item => (
            <MemoryItem key={item.id} item={item} onDelete={() => deleteMemory(item)} />
          ))}
        </div>
      </div>

      <div style={sectionStyle}>
        <h3 style={{ fontFamily: 'var(--serif)', fontSize: '18px', marginBottom: '8px' }}>Written stories</h3>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px', lineHeight: 1.6 }}>
          Type a memory, story, or letter for Mitra to remember.
        </p>
        <textarea
          value={storyText}
          onChange={e => setStoryText(e.target.value)}
          rows={5}
          placeholder="Ramaiah opened his shop in Shivajinagar in 1962. Every Diwali he would..."
          style={{ marginBottom: '12px' }}
        />
        <button
          onClick={saveStory}
          disabled={uploading || !storyText.trim()}
          style={{
            padding: '10px 20px',
            background: storyText.trim() && !uploading ? 'var(--text-primary)' : '#222',
            color: storyText.trim() && !uploading ? '#000' : 'var(--text-muted)',
            border: 'none',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: 500,
            cursor: storyText.trim() && !uploading ? 'pointer' : 'not-allowed',
            marginBottom: '16px',
          }}
        >
          Save story
        </button>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {byType('story').map(item => (
            <MemoryItem key={item.id} item={item} onDelete={() => deleteMemory(item)} />
          ))}
        </div>
      </div>
    </AppShell>
  )
}
