"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const inputStyle = {
  background: "var(--color-card)",
  border: "1px solid var(--color-border)",
  color: "var(--color-text)",
  padding: "12px 16px",
  fontSize: "14px",
  fontFamily: "inherit",
  outline: "none",
  width: "100%",
  boxSizing: "border-box" as const,
  transition: "border-color 0.2s",
}

const labelStyle = {
  display: "block" as const,
  fontSize: "11px",
  letterSpacing: "0.25em",
  textTransform: "uppercase" as const,
  color: "var(--color-text-dim)",
  marginBottom: "6px",
}

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const clientOtp = generateOtp()

    const res = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp: clientOtp }),
    })
    const data = await res.json()

    if (!res.ok) {
      setError(data.error || 'Something went wrong')
      setLoading(false)
      return
    }

    // Show OTP from local state only — never from the server response
    if (data.success) setOtp(clientOtp)
    setLoading(false)
  }

  if (otp) {
    return (
      <div style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px" }}>
        <div style={{ width: "100%", maxWidth: "420px", textAlign: "center" }}>
          <p style={{ fontSize: "11px", letterSpacing: "0.4em", textTransform: "uppercase", color: "var(--color-gold-dark)", margin: "0 0 12px" }}>
            ✦ Recovery Initiated
          </p>
          <h1 style={{ fontSize: "28px", fontWeight: "normal", color: "var(--color-text)", margin: "0 0 32px" }}>
            Check Your Email
          </h1>

          <div style={{ border: "1px solid var(--color-border)", padding: "36px", marginBottom: "24px" }}>
            <p style={{ color: "var(--color-text-dim)", fontSize: "13px", margin: "0 0 24px", lineHeight: 1.7 }}>
              A recovery link has been sent. When you open it, enter this code:
            </p>
            <div style={{
              fontSize: "48px", letterSpacing: "0.3em", color: "var(--color-gold)",
              fontFamily: "monospace", margin: "0 0 24px",
              border: "1px solid rgba(201,168,76,0.3)", padding: "16px",
              background: "rgba(201,168,76,0.05)",
            }}>
              {otp}
            </div>
            <p style={{ color: "var(--color-text-dim)", fontSize: "12px", margin: 0, letterSpacing: "0.05em" }}>
              This code expires in <strong style={{ color: "var(--color-text)" }}>5 minutes</strong>.
              Keep this page open.
            </p>
          </div>

          <button onClick={() => router.push('/login')} style={{
            background: "transparent", border: "none", color: "var(--color-text-dim)",
            cursor: "pointer", fontFamily: "inherit", fontSize: "13px", letterSpacing: "0.1em", padding: 0,
          }}
            onMouseEnter={e => e.currentTarget.style.color = "var(--color-gold)"}
            onMouseLeave={e => e.currentTarget.style.color = "var(--color-text-dim)"}
          >← Back to login</button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px" }}>
      <div style={{ width: "100%", maxWidth: "420px" }}>

        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <p style={{ fontSize: "11px", letterSpacing: "0.4em", textTransform: "uppercase", color: "var(--color-gold-dark)", margin: "0 0 12px" }}>
            ✦ Account Recovery
          </p>
          <h1 style={{ fontSize: "32px", fontWeight: "normal", color: "var(--color-text)", margin: 0 }}>
            Forgot Password
          </h1>
        </div>

        <div style={{ border: "1px solid var(--color-border)", padding: "36px" }}>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div>
              <label style={labelStyle}>Email Address</label>
              <input
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); setError('') }}
                placeholder="your@email.com"
                required
                autoFocus
                style={inputStyle}
                onFocus={e => e.currentTarget.style.borderColor = "var(--color-gold)"}
                onBlur={e => e.currentTarget.style.borderColor = "var(--color-border)"}
              />
            </div>

            {error && (
              <p style={{ color: "#c04040", fontSize: "13px", margin: 0, letterSpacing: "0.05em" }}>{error}</p>
            )}

            <button type="submit" disabled={loading} style={{
              background: "linear-gradient(135deg, var(--color-red), var(--color-red-dark))",
              border: "1px solid var(--color-gold)", color: "var(--color-gold)",
              padding: "13px", fontSize: "12px", letterSpacing: "0.25em",
              textTransform: "uppercase", cursor: loading ? "not-allowed" : "pointer",
              fontFamily: "inherit", opacity: loading ? 0.7 : 1,
            }}>
              {loading ? "Sending..." : "Send Recovery Link"}
            </button>
          </form>
        </div>

        <p style={{ textAlign: "center", marginTop: "20px", fontSize: "13px", color: "var(--color-text-dim)" }}>
          <a href="/login" style={{ color: "var(--color-gold)", textDecoration: "none" }}>← Back to login</a>
        </p>
      </div>
    </div>
  )
}
