'use client'

import { useState, useRef, useEffect } from 'react'
import { usePathname } from 'next/navigation'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const QUICK_REPLIES = [
  'Wat kost een behandeling?',
  'Hoe lang duurt het?',
  'Waar zijn jullie gevestigd?',
  'Hoe kan ik boeken?',
]

const WELCOME_MESSAGE = 'Hoi! 👋 Ik ben Loenique, de assistent van LUXIQUE. Waarmee kan ik je helpen?'
const ERROR_MESSAGE = 'Sorry, ik ben er even niet. Mail ons op info@luxique.nl'

export default function ChatWidget() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const hideOnAcademy = pathname?.startsWith('/academy') ?? false

  useEffect(() => {
    const openChat = () => setOpen(true)
    window.addEventListener('open-loenique-chat', openChat)
    return () => window.removeEventListener('open-loenique-chat', openChat)
  }, [])
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: WELCOME_MESSAGE }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = async (text: string) => {
    if (!text.trim() || loading) return
    const userMsg: Message = { role: 'user', content: text }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      })
      const data = await res.json()
      setMessages(prev => [...prev, { role: 'assistant', content: data.content || data.error || ERROR_MESSAGE }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: ERROR_MESSAGE }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <style>{`
        @media (max-width: 480px) {
          .luxique-chat-window {
            bottom: 12px !important;
            right: 12px !important;
            left: 12px !important;
            width: calc(100vw - 24px) !important;
            max-height: 70vh !important;
            border-radius: 18px !important;
          }
          .luxique-chat-window .luxique-messages {
            max-height: calc(70vh - 180px) !important;
          }
          .luxique-chat-btn {
            bottom: 12px !important;
            right: 12px !important;
          }
        }
      `}</style>

      {/* Chat button */}
      {!hideOnAcademy && (<button
        className="luxique-chat-btn"
        onClick={() => setOpen(!open)}
        aria-label={open ? 'Chat sluiten' : 'Chat openen'}
        aria-expanded={open}
        style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
          width: 60, height: 60, borderRadius: '50%',
          background: open ? '#1C1812' : '#C4A265',
          color: open ? '#FAF8F4' : '#0C0A07',
          border: '1px solid rgba(196,162,101,0.3)',
          cursor: 'pointer', fontSize: 24,
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.3s',
        }}
      >
        {open ? '✕' : '💬'}
      </button>)}

      {/* Chat window */}
      {open && !hideOnAcademy && (
        <div
          className="luxique-chat-window"
          style={{
            position: 'fixed', bottom: 96, right: 24, zIndex: 9999,
            width: 380, maxHeight: 520,
            background: '#14110C',
            border: '1px solid rgba(196,162,101,0.18)',
            borderRadius: 22,
            overflow: 'hidden',
            boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
            display: 'flex', flexDirection: 'column',
          }}
        >
          {/* Header */}
          <div style={{ padding: '18px 22px', borderBottom: '1px solid rgba(196,162,101,0.18)', display: 'flex', alignItems: 'center', gap: 12 }}>
            <img src="https://osldoolmbpqayxhgmbum.supabase.co/storage/v1/render/image/public/images/chatbot-avatar.webp?width=100&quality=80&resize=contain" alt="Loenique" style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ color: '#FAF8F4', fontSize: 14, fontWeight: 500 }}>Loenique</div>
              <div style={{ color: '#C4A265', fontSize: 11, letterSpacing: '0.1em' }}>ONLINE</div>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Chat sluiten"
              style={{
                minWidth: 44, minHeight: 44, width: 44, height: 44,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(196,162,101,0.08)', border: '1px solid rgba(196,162,101,0.18)',
                borderRadius: 12, color: '#FAF8F4', fontSize: 20, cursor: 'pointer',
                flexShrink: 0, lineHeight: 1,
              }}
            >
              ✕
            </button>
          </div>

          {/* Messages */}
          <div
            className="luxique-messages"
            style={{ flex: 1, overflowY: 'auto', padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 14, maxHeight: 340 }}
          >
            {messages.map((msg, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '85%', padding: '12px 16px', borderRadius: 16,
                  background: msg.role === 'user' ? '#C4A265' : '#1C1812',
                  color: msg.role === 'user' ? '#0C0A07' : '#FAF8F4',
                  fontSize: 14, lineHeight: 1.5,
                  border: msg.role === 'assistant' ? '1px solid rgba(196,162,101,0.18)' : 'none',
                  whiteSpace: 'pre-wrap',
                }}>
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{ background: '#1C1812', border: '1px solid rgba(196,162,101,0.18)', padding: '12px 16px', borderRadius: 16, color: '#C4A265', fontSize: 14 }}>
                  aan het typen...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick replies */}
          {messages.length <= 2 && !loading && (
            <div style={{ padding: '0 22px 12px', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {QUICK_REPLIES.map((q, i) => (
                <button key={i} onClick={() => send(q)} style={{
                  background: 'rgba(196,162,101,0.08)', border: '1px solid rgba(196,162,101,0.2)',
                  color: '#C4A265', padding: '6px 12px', borderRadius: 999, fontSize: 12,
                  cursor: 'pointer', fontFamily: "'Outfit', sans-serif",
                }}>
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div style={{ padding: '14px 18px', borderTop: '1px solid rgba(196,162,101,0.18)', display: 'flex', gap: 10 }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send(input)}
              placeholder="Stel je vraag..."
              style={{
                flex: 1, background: '#1C1812', border: '1px solid rgba(196,162,101,0.18)',
                borderRadius: 12, padding: '10px 14px', color: '#FAF8F4', fontSize: 14,
                outline: 'none', fontFamily: "'Outfit', sans-serif",
              }}
            />
            <button onClick={() => send(input)} disabled={loading} style={{
              background: loading ? '#8B7445' : '#C4A265', color: '#3D2E14', border: 'none', borderRadius: 12,
              padding: '10px 16px', cursor: loading ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 500,
              fontFamily: "'Outfit', sans-serif",
            }}>
              →
            </button>
          </div>
        </div>
      )}
    </>
  )
}
