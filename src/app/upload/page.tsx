'use client'

import { useState, useCallback } from 'react'

const SUPABASE_URL = 'https://osldoolmbpqayxhgmbum.supabase.co'
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9zbGRvb2xtYnBxYXl4aGdtYnVtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzQ1MTk5OCwiZXhwIjoyMDkzMDI3OTk4fQ.l5uXV9U4zs9dQHjVFiwCtndUETda0uVTSXbOc7Fba4U'

export default function UploadPage() {
  const [uploads, setUploads] = useState<{ name: string; status: string }[]>([])
  const [dragOver, setDragOver] = useState(false)

  const uploadFile = useCallback(async (file: File) => {
    const entry = { name: file.name, status: 'uploading...' }
    setUploads(prev => [...prev, entry])

    try {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'mp4'
      const name = `reel-upload-${Date.now()}-${Math.random().toString(36).slice(2, 6)}.${ext}`
      const contentType = file.type || 'video/mp4'

      const res = await fetch(`${SUPABASE_URL}/storage/v1/object/videos/reels/${name}`, {
        method: 'POST',
        headers: {
          'apikey': SERVICE_KEY,
          'Authorization': `Bearer ${SERVICE_KEY}`,
          'Content-Type': contentType,
        },
        body: file,
      })

      const data = await res.json()
      if (data.Key) {
        setUploads(prev => prev.map(u => u.name === file.name ? { ...u, status: `✅ ${data.Key}` } : u))
      } else {
        setUploads(prev => prev.map(u => u.name === file.name ? { ...u, status: `❌ ${data.message || 'failed'}` } : u))
      }
    } catch {
      setUploads(prev => prev.map(u => u.name === file.name ? { ...u, status: `❌ error` } : u))
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    Array.from(e.dataTransfer.files).forEach(uploadFile)
  }, [uploadFile])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    Array.from(e.target.files || []).forEach(uploadFile)
  }, [uploadFile])

  return (
    <div style={{ maxWidth: 600, margin: '80px auto', padding: 20, fontFamily: 'system-ui' }}>
      <h1 style={{ fontSize: 24, marginBottom: 8 }}>📤 LUXIQUE Video Upload</h1>
      <p style={{ color: '#888', marginBottom: 24 }}>Sleep video&apos;s hierheen of klik om te selecteren</p>
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => document.getElementById('file-input')?.click()}
        style={{
          border: `2px dashed ${dragOver ? '#C4A265' : '#444'}`,
          borderRadius: 16,
          padding: '60px 20px',
          textAlign: 'center',
          cursor: 'pointer',
          background: dragOver ? '#1C2318' : '#111',
          transition: 'all 0.2s',
        }}
      >
        <div style={{ fontSize: 40, marginBottom: 12 }}>🎬</div>
        <div style={{ color: '#aaa' }}>Drop video&apos;s here — MP4, MOV, any size</div>
        <input id="file-input" type="file" multiple accept="video/*" onChange={handleChange} style={{ display: 'none' }} />
      </div>
      <div style={{ marginTop: 24 }}>
        {uploads.map((u, i) => (
          <div key={i} style={{ padding: '8px 0', borderBottom: '1px solid #222', color: u.status.startsWith('✅') ? '#4ade80' : u.status.startsWith('❌') ? '#f87171' : '#888', fontSize: 13 }}>
            <strong>{u.name}</strong> — {u.status}
          </div>
        ))}
      </div>
    </div>
  )
}
