'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase-client'

export default function EmailConfirmHandler() {
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    // Supabase puts access_token & refresh_token in URL hash after email confirmation
    const hash = window.location.hash
    if (!hash) return

    const params = new URLSearchParams(hash.substring(1)) // remove #
    const accessToken = params.get('access_token')
    const refreshToken = params.get('refresh_token')
    const type = params.get('type')

    if (!accessToken || type !== 'signup') return

    // Exchange the tokens for a session
    supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken || '',
    }).then(({ error }) => {
      if (!error) {
        setShowModal(true)
        // Clean the URL hash so the modal doesn't reappear on refresh
        window.history.replaceState(null, '', window.location.pathname)
      }
    })
  }, [])

  if (!showModal) return null

  return (
    <div className="confirm-overlay" onClick={() => setShowModal(false)}>
      <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
        <button className="confirm-close" onClick={() => setShowModal(false)} aria-label="Sluiten">✕</button>

        <div className="confirm-icon">✓</div>
        <h2 className="confirm-title">Bedankt!</h2>
        <p className="confirm-text">
          Je account is bevestigd. Welkom bij LUXIQUE — je kunt nu direct aan de slag.
        </p>
        <button className="confirm-btn" onClick={() => setShowModal(false)}>
          Verder
        </button>
      </div>

      <style jsx>{`
        .confirm-overlay {
          position: fixed;
          inset: 0;
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(10, 8, 7, 0.6);
          backdrop-filter: blur(6px);
          padding: 20px;
        }
        .confirm-modal {
          position: relative;
          background: #FAF8F4;
          border-radius: 18px;
          padding: 48px 40px 40px;
          max-width: 400px;
          width: 100%;
          text-align: center;
          box-shadow: 0 24px 80px rgba(0,0,0,0.2);
        }
        .confirm-close {
          position: absolute;
          top: 14px;
          right: 16px;
          background: none;
          border: none;
          color: rgba(12, 10, 7, 0.35);
          font-size: 18px;
          cursor: pointer;
          padding: 4px 8px;
          transition: color 0.2s;
        }
        .confirm-close:hover { color: #0C0A07; }
        .confirm-icon {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: linear-gradient(135deg, #C4A265, #a8893f); color: #3D2E14;
          color: #FAF8F4;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          font-weight: 700;
          margin: 0 auto 20px;
        }
        .confirm-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 30px;
          font-weight: 600;
          color: #0C0A07;
          margin: 0 0 10px;
        }
        .confirm-text {
          font-family: 'Outfit', sans-serif;
          font-size: 15px;
          line-height: 1.6;
          color: #4a463e;
          margin: 0 0 28px;
        }
        .confirm-btn {
          background: linear-gradient(135deg, #C4A265, #a8893f); color: #3D2E14;
          border: none;
          border-radius: 10px;
          padding: 14px 40px;
          color: #0C0A07;
          font-family: 'Outfit', sans-serif;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: opacity 0.2s;
        }
        .confirm-btn:hover { opacity: 0.9; }
      `}</style>
    </div>
  )
}
