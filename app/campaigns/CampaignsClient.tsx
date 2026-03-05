"use client"

import { Campaign } from '@/lib/types'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'

interface Props {
  campaigns: Campaign[]
}

export default function CampaignsClient({ campaigns: initial }: Props) {
  const router = useRouter()
  const [campaigns, setCampaigns] = useState(initial)
  const [hovered, setHovered] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  async function handleDelete(id: string) {
    if (!confirm('Delete this campaign? This will also delete all its chapters, dungeons and encounters.')) return
    setDeleting(id)
    await supabase.from('campaigns').delete().eq('id', id)
    setCampaigns(prev => prev.filter(c => c.id !== id))
    setDeleting(null)
  }

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "48px 40px 80px", position: "relative" }}>

      {/* Page header */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: "48px",
      }}>
        <div>
          <p style={{
            fontSize: "11px", letterSpacing: "0.4em", textTransform: "uppercase",
            color: "var(--color-gold-dark)", marginBottom: "8px", margin: "0 0 8px",
          }}>
            ✦ Your Adventures
          </p>
          <h1 style={{
            fontSize: "36px", fontWeight: "normal",
            color: "var(--color-text)", margin: 0,
          }}>
            Campaigns
          </h1>
        </div>
        <button
          onClick={() => router.push('/campaigns/new')}
          style={{
            background: "linear-gradient(135deg, var(--color-red), var(--color-red-dark))",
            border: "1px solid var(--color-gold)",
            color: "var(--color-gold)",
            padding: "12px 28px",
            fontSize: "12px",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            cursor: "pointer",
            fontFamily: "inherit",
            transition: "all 0.2s",
          }}
          onMouseEnter={e => { e.currentTarget.style.filter = "brightness(1.2)"; e.currentTarget.style.boxShadow = "0 0 20px rgba(139,26,26,0.5)"; }}
          onMouseLeave={e => { e.currentTarget.style.filter = "brightness(1)"; e.currentTarget.style.boxShadow = "none"; }}
        >
          + New Campaign
        </button>
      </div>

      {/* Divider */}
      <div style={{ height: "1px", background: "var(--color-border)", marginBottom: "32px" }} />

      {/* Empty state */}
      {campaigns.length === 0 && (
        <div style={{
          textAlign: "center", padding: "80px 40px",
          border: "1px dashed var(--color-border)",
          color: "var(--color-text-dim)",
        }}>
          <div style={{ fontSize: "40px", marginBottom: "16px" }}>⚔️</div>
          <p style={{ letterSpacing: "0.2em", textTransform: "uppercase", fontSize: "13px" }}>
            No campaigns yet
          </p>
          <p style={{ color: "var(--color-text-muted)", marginTop: "8px", fontSize: "14px" }}>
            Your legend is waiting to be written.
          </p>
        </div>
      )}

      {/* Campaign grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
        {campaigns.map(c => (
          <div
            key={c.id}
            onMouseEnter={() => setHovered(c.id)}
            onMouseLeave={() => setHovered(null)}
            style={{
              background: hovered === c.id ? "var(--color-card-hover)" : "var(--color-card)",
              border: `1px solid ${hovered === c.id ? "rgba(201,168,76,0.4)" : "var(--color-border)"}`,
              padding: "28px",
              transition: "all 0.2s",
              position: "relative",
            }}
          >
            {/* Setting tag */}
            {c.setting && (
              <div style={{
                fontSize: "10px", letterSpacing: "0.3em", textTransform: "uppercase",
                color: "var(--color-text-dim)", marginBottom: "10px",
              }}>
                {c.setting}
              </div>
            )}

            {/* Name */}
            <h3
              onClick={() => router.push(`/campaigns/${c.id}`)}
              style={{
                margin: "0 0 12px", fontSize: "22px", fontWeight: "normal",
                color: "var(--color-text)", cursor: "pointer",
              }}
              onMouseEnter={e => e.currentTarget.style.color = "var(--color-gold)"}
              onMouseLeave={e => e.currentTarget.style.color = "var(--color-text)"}
            >
              {c.name}
            </h3>

            {/* Description */}
            {c.description && (
              <p style={{
                fontSize: "13px", color: "var(--color-text-muted)",
                margin: "0 0 20px", lineHeight: 1.6,
                display: "-webkit-box", WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical", overflow: "hidden",
              }}>
                {c.description}
              </p>
            )}

            {/* Stats row */}
            <div style={{ display: "flex", gap: "24px", marginBottom: "20px" }}>
              <div>
                <div style={{ fontSize: "18px", color: "var(--color-gold)" }}>{c.chapterCount}</div>
                <div style={{ fontSize: "10px", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--color-text-dim)" }}>Chapters</div>
              </div>
              {c.player_count ? (
                <div>
                  <div style={{ fontSize: "18px", color: "var(--color-gold)" }}>{c.player_count}</div>
                  <div style={{ fontSize: "10px", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--color-text-dim)" }}>Players</div>
                </div>
              ) : null}
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: "12px" }}>
              <button
                onClick={() => router.push(`/campaigns/${c.id}/edit`)}
                style={{
                  background: "transparent", border: "1px solid var(--color-border)",
                  color: "var(--color-text-muted)", padding: "6px 16px",
                  fontSize: "11px", letterSpacing: "0.15em", textTransform: "uppercase",
                  cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s",
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--color-gold)"; e.currentTarget.style.color = "var(--color-gold)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--color-border)"; e.currentTarget.style.color = "var(--color-text-muted)"; }}
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(c.id)}
                disabled={deleting === c.id}
                style={{
                  background: "transparent", border: "1px solid transparent",
                  color: "var(--color-text-dim)", padding: "6px 16px",
                  fontSize: "11px", letterSpacing: "0.15em", textTransform: "uppercase",
                  cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s",
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(139,26,26,0.5)"; e.currentTarget.style.color = "#c06060"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "transparent"; e.currentTarget.style.color = "var(--color-text-dim)"; }}
              >
                {deleting === c.id ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
