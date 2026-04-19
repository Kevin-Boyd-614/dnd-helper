"use client"

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

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

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [form, setForm] = useState({ otp: '', password: '', confirm: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!token) router.replace('/forgot-password')
  }, [token, router])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setError('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (form.password !== form.confirm) {
      setError('Passwords do not match')
      return
    }
    setLoading(true)
    setError('')

    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, otp: form.otp, newPassword: form.password }),
    })
    const data = await res.json()

    if (!res.ok) {
      setError(data.error || 'Something went wrong')
      setLoading(false)
      return
    }

    setSuccess(true)
    setTimeout(() => router.push('/login'), 2500)
  }

  if (success) {
    return (
      <div style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px" }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: "11px", letterSpacing: "0.4em", textTransform: "uppercase", color: "var(--color-gold-dark)", margin: "0 0 12px" }}>
            ✦ Success
          </p>
          <h1 style={{ fontSize: "28px", fontWeight: "normal", color: "var(--color-text)", margin: "0 0 12px" }}>
            Password Updated
          </h1>
          <p style={{ color: "var(--color-text-dim)", fontSize: "14px" }}>Redirecting you to login...</p>
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
            Reset Password
          </h1>
        </div>

        <div style={{ border: "1px solid var(--color-border)", padding: "36px" }}>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

            <div>
              <label style={labelStyle}>Recovery Code</label>
              <input
                name="otp"
                value={form.otp}
                onChange={handleChange}
                placeholder="6-digit code from the original screen"
                required
                autoFocus
                maxLength={6}
                style={ inputStyle}
                onFocus={e => e.currentTarget.style.borderColor = "var(--color-gold)"}
                onBlur={e => e.currentTarget.style.borderColor = "var(--color-border)"}
              />
            </div>

            <div>
              <label style={labelStyle}>New Password</label>
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                placeholder="at least 8 characters"
                required
                style={inputStyle}
                onFocus={e => e.currentTarget.style.borderColor = "var(--color-gold)"}
                onBlur={e => e.currentTarget.style.borderColor = "var(--color-border)"}
              />
            </div>

            <div>
              <label style={labelStyle}>Confirm Password</label>
              <input
                name="confirm"
                type="password"
                value={form.confirm}
                onChange={handleChange}
                placeholder="repeat new password"
                required
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
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  )
}
