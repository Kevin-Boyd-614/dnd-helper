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

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({ username: '', password: '', confirm: '', email: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

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
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: form.username, password: form.password, email: form.email }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error || 'Something went wrong')
      setLoading(false)
      return
    }
    router.push('/')
    router.refresh()
  }

  return (
    <div style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px" }}>
      <div style={{ width: "100%", maxWidth: "420px" }}>

        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <p style={{ fontSize: "11px", letterSpacing: "0.4em", textTransform: "uppercase", color: "var(--color-gold-dark)", margin: "0 0 12px" }}>
            ✦ Welcome
          </p>
          <h1 style={{ fontSize: "32px", fontWeight: "normal", color: "var(--color-text)", margin: 0 }}>
            Create Account
          </h1>
        </div>

        <div style={{ border: "1px solid var(--color-border)", padding: "36px" }}>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

            <div>
              <label style={labelStyle}>Username</label>
              <input
                name="username" value={form.username} onChange={handleChange}
                placeholder="at least 3 characters" required autoFocus
                style={inputStyle}
                onFocus={e => e.currentTarget.style.borderColor = "var(--color-gold)"}
                onBlur={e => e.currentTarget.style.borderColor = "var(--color-border)"}
              />
            </div>

            <div>
              <label style={labelStyle}>Password</label>
              <input
                name="password" type="password" value={form.password} onChange={handleChange}
                placeholder="at least 6 characters" required
                style={inputStyle}
                onFocus={e => e.currentTarget.style.borderColor = "var(--color-gold)"}
                onBlur={e => e.currentTarget.style.borderColor = "var(--color-border)"}
              />
            </div>

            <div>
              <label style={labelStyle}>Confirm Password</label>
              <input
                name="confirm" type="password" value={form.confirm} onChange={handleChange}
                placeholder="repeat password" required
                style={{
                  ...inputStyle,
                  borderColor: form.confirm && form.confirm !== form.password ? "#c04040" : "var(--color-border)",
                }}
                onFocus={e => e.currentTarget.style.borderColor = form.confirm !== form.password ? "#c04040" : "var(--color-gold)"}
                onBlur={e => e.currentTarget.style.borderColor = form.confirm && form.confirm !== form.password ? "#c04040" : "var(--color-border)"}
              />
            </div>

            <div>
              <label style={labelStyle}>
                Email <span style={{ color: "var(--color-text-dim)", letterSpacing: "0.1em", fontSize: "10px" }}>(optional — for account recovery)</span>
              </label>
              <input
                name="email" type="email" value={form.email} onChange={handleChange}
                placeholder="your@email.com"
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
              textTransform: "uppercase", cursor: "pointer", fontFamily: "inherit",
              marginTop: "4px",
            }}>
              {loading ? "Creating..." : "Create Account"}
            </button>
          </form>
        </div>

        <p style={{ textAlign: "center", marginTop: "20px", fontSize: "13px", color: "var(--color-text-dim)" }}>
          Already have an account?{" "}
          <a href="/login" style={{ color: "var(--color-gold)", textDecoration: "none" }}>Sign in</a>
        </p>
      </div>
    </div>
  )
}
