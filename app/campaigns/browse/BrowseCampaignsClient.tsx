"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PrivacyType } from '@/lib/types'

interface BrowseCampaign {
  id: string
  name: string
  setting?: string
  description?: string
  player_count?: number
  chapterCount: number
}

interface Props {
  campaigns: BrowseCampaign[]
  userId: string
}

export default function BrowseCampaignsClient({ campaigns, userId }: Props) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [copying, setCopying] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const [hovered, setHovered] = useState<string | null>(null)

  const filtered = campaigns.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.setting ?? '').toLowerCase().includes(search.toLowerCase())
  )

  async function handleCopy(campaign: BrowseCampaign) {
    setCopying(campaign.id)

    const res = await fetch('/api/campaigns/copy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ campaignId: campaign.id }),
    })
    const data = await res.json()

    setCopying(null)
    if (data.id) {
      setCopied(campaign.id)
      setTimeout(() => router.push(`/campaigns/${data.id}`), 600)
    }
  }

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "48px 40px 80px" }}>
      <div style={{ marginBottom: "40px" }}>
        <button
          onClick={() => router.push('/campaigns')}
          style={{
            background: "transparent", border: "none", color: "var(--color-text-dim)",
            cursor: "pointer", fontFamily: "inherit", fontSize: "13px",
            letterSpacing: "0.1em", padding: 0, marginBottom: "16px", display: "block",
          }}
          onMouseEnter={e => e.currentTarget.style.color = "var(--color-gold)"}
          onMouseLeave={e => e.currentTarget.style.color = "var(--color-text-dim)"}
        >← Back to Campaigns</button>
        <p style={{ fontSize: "11px", letterSpacing: "0.4em", textTransform: "uppercase", color: "var(--color-gold-dark)", margin: "0 0 8px" }}>
          ✦ Community Adventures
        </p>
        <h1 style={{ fontSize: "36px", fontWeight: "normal", color: "var(--color-text)", margin: 0 }}>
          Browse Campaigns
        </h1>
      </div>

      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search by name or setting..."
        style={{
          width: "100%", background: "var(--color-card)", border: "1px solid var(--color-border)",
          color: "var(--color-text)", padding: "10px 16px", fontSize: "14px",
          fontFamily: "inherit", outline: "none", boxSizing: "border-box" as const,
          marginBottom: "32px",
        }}
        onFocus={e => e.currentTarget.style.borderColor = "var(--color-gold)"}
        onBlur={e => e.currentTarget.style.borderColor = "var(--color-border)"}
      />

      <div style={{ height: "1px", background: "var(--color-border)", marginBottom: "32px" }} />

      {filtered.length === 0 && (
        <div style={{
          textAlign: "center", padding: "80px 40px",
          border: "1px dashed var(--color-border)", color: "var(--color-text-dim)",
        }}>
          <div style={{ fontSize: "40px", marginBottom: "16px" }}>⚔️</div>
          <p style={{ letterSpacing: "0.2em", textTransform: "uppercase", fontSize: "13px" }}>
            {search ? 'No campaigns match your search' : 'No public campaigns available'}
          </p>
        </div>
      )}

      {filtered.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {filtered.map(c => {
            const isCopying = copying === c.id
            const isCopied = copied === c.id
            const isHovered = hovered === c.id

            return (
              <div
                key={c.id}
                onMouseEnter={() => setHovered(c.id)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  background: isHovered ? "var(--color-card-hover)" : "var(--color-card)",
                  border: `1px solid ${isHovered ? "rgba(201,168,76,0.4)" : "var(--color-border)"}`,
                  padding: "24px 28px",
                  transition: "all 0.2s",
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  gap: "24px",
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  {c.setting && (
                    <div style={{
                      fontSize: "10px", letterSpacing: "0.3em", textTransform: "uppercase",
                      color: "var(--color-text-dim)", marginBottom: "6px",
                    }}>
                      {c.setting}
                    </div>
                  )}
                  <div style={{ fontSize: "20px", color: "var(--color-text)", marginBottom: "8px" }}>
                    {c.name}
                  </div>
                  {c.description && (
                    <p style={{
                      fontSize: "13px", color: "var(--color-text-muted)", margin: "0 0 12px",
                      lineHeight: 1.6, display: "-webkit-box", WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical", overflow: "hidden",
                    }}>
                      {c.description}
                    </p>
                  )}
                  <div style={{ display: "flex", gap: "24px" }}>
                    <div>
                      <span style={{ fontSize: "16px", color: "var(--color-gold)" }}>{c.chapterCount}</span>
                      <span style={{ fontSize: "10px", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--color-text-dim)", marginLeft: "6px" }}>Chapters</span>
                    </div>
                    {c.player_count ? (
                      <div>
                        <span style={{ fontSize: "16px", color: "var(--color-gold)" }}>{c.player_count}</span>
                        <span style={{ fontSize: "10px", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--color-text-dim)", marginLeft: "6px" }}>Players</span>
                      </div>
                    ) : null}
                  </div>
                </div>

                <button
                  onClick={() => handleCopy(c)}
                  disabled={isCopying || isCopied}
                  style={{
                    flexShrink: 0,
                    background: isCopied
                      ? "transparent"
                      : "linear-gradient(135deg, var(--color-red), var(--color-red-dark))",
                    border: `1px solid ${isCopied ? "var(--color-border)" : "var(--color-gold)"}`,
                    color: isCopied ? "var(--color-text-dim)" : "var(--color-gold)",
                    padding: "8px 20px", fontSize: "11px", letterSpacing: "0.15em",
                    textTransform: "uppercase", cursor: isCopying || isCopied ? "not-allowed" : "pointer",
                    fontFamily: "inherit", transition: "all 0.2s",
                    opacity: isCopying ? 0.7 : 1,
                    alignSelf: "center",
                  }}
                  onMouseEnter={e => { if (!isCopying && !isCopied) e.currentTarget.style.filter = "brightness(1.2)" }}
                  onMouseLeave={e => { e.currentTarget.style.filter = "brightness(1)" }}
                >
                  {isCopied ? "Copied ✓" : isCopying ? "Copying..." : "Copy"}
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
