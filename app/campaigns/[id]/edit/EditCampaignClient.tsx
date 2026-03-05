"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface Campaign {
  id: string
  name: string
  setting?: string
  description?: string
  player_count?: number
}

const inputStyle = {
  width: "100%",
  background: "var(--color-card)",
  border: "1px solid var(--color-border)",
  color: "var(--color-text)",
  padding: "12px 16px",
  fontSize: "15px",
  fontFamily: "inherit",
  outline: "none",
  boxSizing: "border-box" as const,
  transition: "border-color 0.2s",
}

const labelStyle = {
  display: "block" as const,
  fontSize: "11px",
  letterSpacing: "0.25em",
  textTransform: "uppercase" as const,
  color: "var(--color-text-dim)",
  marginBottom: "8px",
}

export default function EditCampaignClient({ campaign }: { campaign: Campaign }) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: campaign.name,
    setting: campaign.setting ?? '',
    description: campaign.description ?? '',
    player_count: campaign.player_count?.toString() ?? '',
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit() {
    if (!form.name.trim()) {
      setError('Campaign name is required.')
      return
    }
    setSaving(true)
    setError(null)

    const { error } = await supabase
      .from('campaigns')
      .update({
        name: form.name.trim(),
        setting: form.setting.trim() || null,
        description: form.description.trim() || null,
        player_count: form.player_count ? parseInt(form.player_count) : null,
      })
      .eq('id', campaign.id)

    if (error) {
      setError(error.message)
      setSaving(false)
      return
    }

    router.push(`/campaigns/${campaign.id}`)
  }

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto", padding: "48px 40px 80px" }}>

      {/* Header */}
      <div style={{ marginBottom: "48px" }}>
        <button
          onClick={() => router.back()}
          style={{
            background: "transparent", border: "none", color: "var(--color-text-dim)",
            cursor: "pointer", fontFamily: "inherit", fontSize: "13px",
            letterSpacing: "0.1em", padding: 0, marginBottom: "24px", display: "block",
          }}
          onMouseEnter={e => e.currentTarget.style.color = "var(--color-gold)"}
          onMouseLeave={e => e.currentTarget.style.color = "var(--color-text-dim)"}
        >
          ← Back
        </button>
        <p style={{
          fontSize: "11px", letterSpacing: "0.4em", textTransform: "uppercase",
          color: "var(--color-gold-dark)", margin: "0 0 8px",
        }}>
          ✦ Edit Campaign
        </p>
        <h1 style={{ fontSize: "36px", fontWeight: "normal", color: "var(--color-text)", margin: 0 }}>
          {campaign.name}
        </h1>
      </div>

      <div style={{ height: "1px", background: "var(--color-border)", marginBottom: "40px" }} />

      {/* Form */}
      <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
        <div>
          <label style={labelStyle}>Campaign Name *</label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            style={inputStyle}
            onFocus={e => e.currentTarget.style.borderColor = "var(--color-gold)"}
            onBlur={e => e.currentTarget.style.borderColor = "var(--color-border)"}
          />
        </div>

        <div>
          <label style={labelStyle}>Setting</label>
          <input
            name="setting"
            value={form.setting}
            onChange={handleChange}
            placeholder="e.g. Forgotten Realms, Barovia, Custom"
            style={inputStyle}
            onFocus={e => e.currentTarget.style.borderColor = "var(--color-gold)"}
            onBlur={e => e.currentTarget.style.borderColor = "var(--color-border)"}
          />
        </div>

        <div>
          <label style={labelStyle}>Description</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="A brief overview of your campaign..."
            rows={4}
            style={{ ...inputStyle, resize: "vertical" }}
            onFocus={e => e.currentTarget.style.borderColor = "var(--color-gold)"}
            onBlur={e => e.currentTarget.style.borderColor = "var(--color-border)"}
          />
        </div>

        <div>
          <label style={labelStyle}>Number of Players</label>
          <input
            name="player_count"
            type="number"
            min="1"
            max="20"
            value={form.player_count}
            onChange={handleChange}
            placeholder="e.g. 4"
            style={{ ...inputStyle, width: "120px" }}
            onFocus={e => e.currentTarget.style.borderColor = "var(--color-gold)"}
            onBlur={e => e.currentTarget.style.borderColor = "var(--color-border)"}
          />
        </div>

        {error && (
          <p style={{ color: "#c06060", fontSize: "13px", margin: 0 }}>⚠ {error}</p>
        )}

        <div style={{ display: "flex", gap: "16px", paddingTop: "8px" }}>
          <button
            onClick={handleSubmit}
            disabled={saving}
            style={{
              background: "linear-gradient(135deg, var(--color-red), var(--color-red-dark))",
              border: "1px solid var(--color-gold)",
              color: "var(--color-gold)",
              padding: "14px 36px",
              fontSize: "12px",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              cursor: saving ? "not-allowed" : "pointer",
              fontFamily: "inherit",
              transition: "all 0.2s",
              opacity: saving ? 0.7 : 1,
            }}
            onMouseEnter={e => { if (!saving) e.currentTarget.style.filter = "brightness(1.2)" }}
            onMouseLeave={e => { e.currentTarget.style.filter = "brightness(1)" }}
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
          <button
            onClick={() => router.back()}
            style={{
              background: "transparent",
              border: "1px solid var(--color-border)",
              color: "var(--color-text-muted)",
              padding: "14px 36px",
              fontSize: "12px",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              cursor: "pointer",
              fontFamily: "inherit",
              transition: "all 0.2s",
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--color-gold)"; e.currentTarget.style.color = "var(--color-gold)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--color-border)"; e.currentTarget.style.color = "var(--color-text-muted)"; }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
