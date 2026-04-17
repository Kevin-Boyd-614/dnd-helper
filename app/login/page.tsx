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

export default function LoginPage() {
  const router = useRouter()
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setError('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
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
            ✦ Welcome Back
          </p>
          <h1 style={{ fontSize: "32px", fontWeight: "normal", color: "var(--color-text)", margin: 0 }}>
            Sign In
          </h1>
        </div>

        <div style={{ border: "1px solid var(--color-border)", padding: "36px" }}>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

            <div>
              <label style={labelStyle}>Username</label>
              <input
                name="username" value={form.username} onChange={handleChange}
                placeholder="your username" required autoFocus
                style={inputStyle}
                onFocus={e => e.currentTarget.style.borderColor = "var(--color-gold)"}
                onBlur={e => e.currentTarget.style.borderColor = "var(--color-border)"}
              />
            </div>

            <div>
              <label style={labelStyle}>Password</label>
              <input
                name="password" type="password" value={form.password} onChange={handleChange}
                placeholder="your password" required
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
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
        </div>

        <p style={{ textAlign: "center", marginTop: "20px", fontSize: "13px", color: "var(--color-text-dim)" }}>
          Don&apos;t have an account?{" "}
          <a href="/register" style={{ color: "var(--color-gold)", textDecoration: "none" }}>Create one</a>
        </p>
      </div>
    </div>
  )
}
