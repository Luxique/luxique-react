'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase-client'

interface AuthModalProps {
  open: boolean
  onClose: () => void
  onAuthSuccess: (user: { id: string; email: string }) => void
}

export default function AuthModal({ open, onClose, onAuthSuccess }: AuthModalProps) {
  const [tab, setTab] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const getPasswordStrength = (pw: string): { valid: boolean; hint: string } => {
    if (pw.length === 0) return { valid: false, hint: '' }
    if (pw.length < 8) return { valid: false, hint: 'Minimaal 8 tekens nodig' }
    const hasLetter = /[a-zA-Z]/.test(pw)
    const hasNumber = /[0-9]/.test(pw)
    if (!hasLetter || !hasNumber) return { valid: false, hint: 'Gebruik letters én cijfers' }
    return { valid: true, hint: 'Wachtwoord sterk genoeg ✓' }
  }

  if (!open) return null

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setLoading(true)

    try {
      if (tab === 'login') {
        const { data, error: err } = await supabase.auth.signInWithPassword({ email, password })
        if (err) throw err
        if (data.user) {
          onAuthSuccess({ id: data.user.id, email: data.user.email ?? email })
        }
      } else {
        // Registration validations
        if (!getPasswordStrength(password).valid) {
          setError('Wachtwoord is niet sterk genoeg.')
          setLoading(false)
          return
        }
        if (password !== confirmPassword) {
          setError('Wachtwoorden komen niet overeen.')
          setLoading(false)
          return
        }
        if (!termsAccepted) {
          setError('Je moet akkoord gaan met de voorwaarden.')
          setLoading(false)
          return
        }
        const { data, error: err } = await supabase.auth.signUp({ email, password })
        if (err) throw err
        if (data.user) {
          // Check if email confirmation is required
          if (data.session) {
            onAuthSuccess({ id: data.user.id, email: data.user.email ?? email })
          } else {
            setMessage('Check je email om je account te bevestigen.')
          }
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      setError(msg === 'Invalid login credentials' ? 'Ongeldig email of wachtwoord' : msg)
    } finally {
      setLoading(false)
    }
  }

  const handleSocialLogin = async (provider: 'google' | 'apple') => {
    setError(null)
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/cursus` },
    })
    if (err) {
      setError(`${provider === 'google' ? 'Google' : 'Apple'} login niet beschikbaar. Probeer email.`)
    }
  }

  const pwStrength = getPasswordStrength(password)

  const close = () => {
    setError(null)
    setMessage(null)
    setEmail('')
    setPassword('')
    setConfirmPassword('')
    setTermsAccepted(false)
    onClose()
  }

  return (
    <div className="auth-overlay" onClick={close}>
      <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
        <button className="auth-close" onClick={close} aria-label="Sluiten">✕</button>

        <h2 className="auth-title">
          {tab === 'login' ? 'Welkom terug' : 'Account aanmaken'}
        </h2>
        <p className="auth-subtitle">
          {tab === 'login' ? 'Log in om verder te gaan' : 'Maak een account om te starten'}
        </p>

        {/* Tabs */}
        <div className="auth-tabs">
          <button
            className={`auth-tab ${tab === 'login' ? 'active' : ''}`}
            onClick={() => { setTab('login'); setError(null); setMessage(null) }}
          >
            Inloggen
          </button>
          <button
            className={`auth-tab ${tab === 'register' ? 'active' : ''}`}
            onClick={() => { setTab('register'); setError(null); setMessage(null) }}
          >
            Registreren
          </button>
        </div>

        {/* Social buttons */}
        <div className="auth-social-row">
          <button className="auth-social-btn" onClick={() => handleSocialLogin('google')}>
            <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            Google
          </button>
          <button className="auth-social-btn" onClick={() => handleSocialLogin('apple')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
            Apple
          </button>
        </div>

        <div className="auth-divider">
          <span>of</span>
        </div>

        {/* Email form */}
        <form onSubmit={handleEmailAuth} className="auth-form">
          <label className="auth-label">
            Email
            <input
              type="email"
              className="auth-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="jouw@email.nl"
              autoComplete="email"
            />
          </label>
          <label className="auth-label">
            Wachtwoord
            <input
              type="password"
              className="auth-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              placeholder="Minimaal 8 tekens, letters + cijfers"
              autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
            />
            {tab === 'register' && password.length > 0 && (
              <span className={`auth-pw-hint ${pwStrength.valid ? 'valid' : 'invalid'}`}>
                {pwStrength.hint}
              </span>
            )}
          </label>

          {tab === 'register' && (
            <label className="auth-label">
              Wachtwoord bevestigen
              <input
                type="password"
                className={`auth-input ${confirmPassword && confirmPassword !== password ? 'input-error' : ''}`}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                placeholder="Herhaal je wachtwoord"
                autoComplete="new-password"
              />
              {confirmPassword && confirmPassword !== password && (
                <span className="auth-pw-hint invalid">Wachtwoorden komen niet overeen</span>
              )}
            </label>
          )}

          {tab === 'register' && (
            <label className="auth-checkbox-label">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="auth-checkbox"
              />
              <span>
                Ik ga akkoord met de{' '}
                <a href="/voorwaarden" target="_blank" rel="noopener noreferrer" className="auth-link">
                  algemene voorwaarden
                </a>{' '}
                en{' '}
                <a href="/privacy" target="_blank" rel="noopener noreferrer" className="auth-link">
                  privacyverklaring
                </a>
              </span>
            </label>
          )}

          {error && <div className="auth-error">{error}</div>}
          {message && <div className="auth-message">{message}</div>}

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? 'Even wachten...' : tab === 'login' ? 'Inloggen' : 'Account aanmaken'}
          </button>
        </form>
      </div>

      <style jsx>{`
        .auth-overlay {
          position: fixed;
          inset: 0;
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(10, 8, 7, 0.85);
          backdrop-filter: blur(8px);
          padding: 20px;
        }
        .auth-modal {
          position: relative;
          background: rgba(26, 22, 18, 0.95);
          border: 1px solid rgba(196, 162, 101, 0.2);
          border-radius: 16px;
          padding: 40px 36px 36px;
          max-width: 420px;
          width: 100%;
          box-shadow: 0 24px 80px rgba(0,0,0,0.6);
        }
        .auth-close {
          position: absolute;
          top: 16px;
          right: 16px;
          background: none;
          border: none;
          color: rgba(250, 248, 244, 0.5);
          font-size: 18px;
          cursor: pointer;
          padding: 4px 8px;
          transition: color 0.2s;
        }
        .auth-close:hover { color: #FAF8F4; }
        .auth-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 28px;
          font-weight: 600;
          color: #FAF8F4;
          margin: 0 0 4px;
        }
        .auth-subtitle {
          font-family: 'Outfit', sans-serif;
          font-size: 14px;
          color: rgba(250, 248, 244, 0.5);
          margin: 0 0 24px;
        }
        .auth-tabs {
          display: flex;
          gap: 0;
          margin-bottom: 24px;
          border-bottom: 1px solid rgba(196, 162, 101, 0.15);
        }
        .auth-tab {
          flex: 1;
          background: none;
          border: none;
          padding: 10px 0;
          font-family: 'Outfit', sans-serif;
          font-size: 14px;
          color: rgba(250, 248, 244, 0.4);
          cursor: pointer;
          border-bottom: 2px solid transparent;
          transition: all 0.2s;
        }
        .auth-tab.active {
          color: #C4A265;
          border-bottom-color: #C4A265;
        }
        .auth-tab:hover:not(.active) {
          color: rgba(250, 248, 244, 0.7);
        }
        .auth-social-row {
          display: flex;
          gap: 12px;
        }
        .auth-social-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 11px 16px;
          background: rgba(250, 248, 244, 0.05);
          border: 1px solid rgba(250, 248, 244, 0.1);
          border-radius: 10px;
          color: #FAF8F4;
          font-family: 'Outfit', sans-serif;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .auth-social-btn:hover {
          background: rgba(250, 248, 244, 0.1);
          border-color: rgba(250, 248, 244, 0.2);
        }
        .auth-divider {
          text-align: center;
          margin: 20px 0;
          position: relative;
        }
        .auth-divider::before,
        .auth-divider::after {
          content: '';
          position: absolute;
          top: 50%;
          width: calc(50% - 20px);
          height: 1px;
          background: rgba(196, 162, 101, 0.15);
        }
        .auth-divider::before { left: 0; }
        .auth-divider::after { right: 0; }
        .auth-divider span {
          background: rgba(26, 22, 18, 0.95);
          padding: 0 12px;
          font-family: 'Outfit', sans-serif;
          font-size: 12px;
          color: rgba(250, 248, 244, 0.3);
        }
        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .auth-label {
          display: flex;
          flex-direction: column;
          gap: 6px;
          font-family: 'Outfit', sans-serif;
          font-size: 13px;
          color: rgba(250, 248, 244, 0.6);
        }
        .auth-input {
          background: rgba(250, 248, 244, 0.05);
          border: 1px solid rgba(196, 162, 101, 0.15);
          border-radius: 10px;
          padding: 12px 16px;
          color: #FAF8F4;
          font-family: 'Outfit', sans-serif;
          font-size: 15px;
          outline: none;
          transition: border-color 0.2s;
        }
        .auth-input::placeholder {
          color: rgba(250, 248, 244, 0.25);
        }
        .auth-input:focus {
          border-color: rgba(196, 162, 101, 0.4);
        }
        .auth-error {
          background: rgba(220, 38, 38, 0.1);
          border: 1px solid rgba(220, 38, 38, 0.2);
          border-radius: 8px;
          padding: 10px 14px;
          font-family: 'Outfit', sans-serif;
          font-size: 13px;
          color: #fca5a5;
        }
        .auth-message {
          background: rgba(196, 162, 101, 0.1);
          border: 1px solid rgba(196, 162, 101, 0.2);
          border-radius: 8px;
          padding: 10px 14px;
          font-family: 'Outfit', sans-serif;
          font-size: 13px;
          color: #C4A265;
        }
        .auth-submit {
          background: linear-gradient(135deg, #C4A265, #a8893f);
          border: none;
          border-radius: 10px;
          padding: 14px;
          color: #0A0807;
          font-family: 'Outfit', sans-serif;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: opacity 0.2s;
          margin-top: 4px;
        }
        .auth-submit:hover:not(:disabled) { opacity: 0.9; }
        .auth-submit:disabled { opacity: 0.5; cursor: not-allowed; }
        .auth-pw-hint {
          font-family: 'Outfit', sans-serif;
          font-size: 12px;
          margin-top: 2px;
        }
        .auth-pw-hint.valid { color: #34A853; }
        .auth-pw-hint.invalid { color: #fca5a5; }
        .auth-input.input-error {
          border-color: rgba(220, 38, 38, 0.4);
        }
        .auth-checkbox-label {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          font-family: 'Outfit', sans-serif;
          font-size: 13px;
          color: rgba(250, 248, 244, 0.6);
          cursor: pointer;
          line-height: 1.5;
        }
        .auth-checkbox {
          accent-color: #C4A265;
          width: 16px;
          height: 16px;
          margin-top: 2px;
          flex-shrink: 0;
          cursor: pointer;
        }
        .auth-link {
          color: #C4A265;
          text-decoration: underline;
          text-underline-offset: 2px;
        }
        .auth-link:hover {
          color: #d4b87a;
        }
      `}</style>
    </div>
  )
}
