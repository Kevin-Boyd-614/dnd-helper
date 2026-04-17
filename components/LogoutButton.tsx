"use client"

import { useRouter } from 'next/navigation'

export default function LogoutButton({ username }: { username: string }) {
  const router = useRouter()

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
      <span style={{ fontSize: "12px", letterSpacing: "0.1em", color: "var(--color-text-dim)", textTransform: "uppercase" }}>
        {username}
      </span>
      <button
        onClick={handleLogout}
        style={{
          background: "transparent", border: "1px solid var(--color-border)",
          color: "var(--color-text-dim)", padding: "6px 14px",
          fontSize: "11px", letterSpacing: "0.15em", textTransform: "uppercase",
          cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s",
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--color-gold)"; e.currentTarget.style.color = "var(--color-gold)"; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--color-border)"; e.currentTarget.style.color = "var(--color-text-dim)"; }}
      >
        Sign Out
      </button>
    </div>
  )
}
