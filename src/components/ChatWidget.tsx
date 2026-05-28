'use client'

import { useState, useRef, useEffect } from 'react'

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

const FAQ_RESPONSES: Record<string, string> = {
  'wat kost': 'Een Classic Set kost €149 en een Volume Set €199. Allebei inclusief 3 uur behandeltijd, foto-reportage en aftercare kit. Refills: €79 (Classic) of €99 (Volume).',
  'hoe lang duurt': 'Reken op 3 uur. Chiva neemt de tijd voor een perfect resultaat — geen haast, geen compromissen.',
  'waar': 'LUXIQUE is gevestigd in [locatie]. Na je boeking ontvang je het exacte adres via WhatsApp.',
  'boeken': 'Je kunt direct online boeken via onze website! Ga naar de Behandeling pagina en klik op "Boek nu". Je ontvangt binnen 24 uur een bevestiging via WhatsApp.',
  'refill': 'Refills boeken we 2-3 weken na je eerste set. Prijs: €79 (Classic) of €99 (Volume).',
  'pijn': 'Nee, de meeste klanten vinden het ontspannen. Je ligt comfortabel en veel klanten vallen in slaap tijdens de behandeling.',
  'hoe lang blijft': 'Gemiddeld 4-6 weken met goede aftercare. Na 2-3 weken adviseren we een refill.',
  'annuleren': 'Gratis annuleren tot 24 uur van tevoren. Daarna rekenen we 50% van de behandelprijs.',
  'cursus': 'Onze online cursussen vind je op de Academy pagina. Je leert alles over lash technieken, oogvormen en het opbouwen van je eigen lash business.',
}

function findResponse(input: string): string {
  const lower = input.toLowerCase()
  for (const [key, response] of Object.entries(FAQ_RESPONSES)) {
    if (lower.includes(key)) return response
  }
  return 'Bedankt voor je bericht! Chiva neemt zo snel mogelijk contact met je op via WhatsApp. Voor directe vragen kun je ook een WhatsApp sturen naar +316...'
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hey! 👋 Heb je een vraag over onze lash behandelingen of cursussen? Stel je vraag en ik help je verder.' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = async (text: string) => {
    if (!text.trim()) return
    const userMsg: Message = { role: 'user', content: text }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    // Simulate typing delay
    await new Promise(r => setTimeout(r, 800 + Math.random() * 600))
    const response = findResponse(text)
    setMessages(prev => [...prev, { role: 'assistant', content: response }])
    setLoading(false)
  }

  return (
    <>
      {/* Chat button */}
      <button
        onClick={() => setOpen(!open)}
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
      </button>

      {/* Chat window */}
      {open && (
        <div style={{
          position: 'fixed', bottom: 96, right: 24, zIndex: 9999,
          width: 380, maxHeight: 520,
          background: '#14110C',
          border: '1px solid rgba(196,162,101,0.18)',
          borderRadius: 22,
          overflow: 'hidden',
          boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
          display: 'flex', flexDirection: 'column',
        }}>
          {/* Header */}
          <div style={{ padding: '18px 22px', borderBottom: '1px solid rgba(196,162,101,0.18)', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #C4A265, #1C1812)', flexShrink: 0 }} />
            <div>
              <div style={{ color: '#FAF8F4', fontSize: 14, fontWeight: 500 }}>LUXIQUE</div>
              <div style={{ color: '#C4A265', fontSize: 11, letterSpacing: '0.1em' }}>ONLINE</div>
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 14, maxHeight: 340 }}>
            {messages.map((msg, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '85%', padding: '12px 16px', borderRadius: 16,
                  background: msg.role === 'user' ? '#C4A265' : '#1C1812',
                  color: msg.role === 'user' ? '#0C0A07' : '#FAF8F4',
                  fontSize: 14, lineHeight: 1.5,
                  border: msg.role === 'assistant' ? '1px solid rgba(196,162,101,0.18)' : 'none',
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
          {messages.length <= 2 && (
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
            <button onClick={() => send(input)} style={{
              background: '#C4A265', color: '#0C0A07', border: 'none', borderRadius: 12,
              padding: '10px 16px', cursor: 'pointer', fontSize: 14, fontWeight: 500,
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
