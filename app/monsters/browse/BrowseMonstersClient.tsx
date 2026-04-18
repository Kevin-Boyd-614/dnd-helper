"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Monster, PrivacyType } from '@/lib/types'
import { MONSTER_TYPES } from '@/lib/constants'

interface Props {
  monsters: Monster[]
  userId: string
}

export default function BrowseMonstersClient({ monsters, userId }: Props) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [copying, setCopying] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const [hovered, setHovered] = useState<string | null>(null)

  const filtered = monsters
    .filter(m => m.name.toLowerCase().includes(search.toLowerCase()))
    .filter(m => filterType === 'all' || m.type === filterType)

  const usedTypes = Array.from(new Set(monsters.map(m => m.type).filter(Boolean)))

  async function handleCopy(monster: Monster) {
    setCopying(monster.id)

    const { data: skills } = await supabase
      .from('monster_skills')
      .select('*')
      .eq('monster_id', monster.id)

    const { data: newMonster, error } = await supabase
      .from('monsters')
      .insert({
        name: monster.name,
        type: monster.type ?? null,
        cr: monster.cr ?? null,
        hp: monster.hp ?? null,
        ac: monster.ac ?? null,
        speed: monster.speed ?? null,
        notes: monster.notes ?? null,
        privacy: PrivacyType.Copied,
        user_id: userId,
      })
      .select()
      .single()

    if (error || !newMonster) { setCopying(null); return }

    if (skills && skills.length > 0) {
      await supabase.from('monster_skills').insert(
        skills.map(({ id: _id, monster_id: _mid, ...rest }) => ({
          ...rest,
          monster_id: newMonster.id,
        }))
      )
    }

    setCopying(null)
    setCopied(monster.id)
    setTimeout(() => router.push(`/monsters/${newMonster.id}`), 600)
  }

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "48px 40px 80px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "40px" }}>
        <div>
          <button onClick={() => router.push('/monsters')} style={{
            background: "transparent", border: "none", color: "var(--color-text-dim)",
            cursor: "pointer", fontFamily: "inherit", fontSize: "13px",
            letterSpacing: "0.1em", padding: 0, marginBottom: "16px", display: "block",
          }}
            onMouseEnter={e => e.currentTarget.style.color = "var(--color-gold)"}
            onMouseLeave={e => e.currentTarget.style.color = "var(--color-text-dim)"}
          >← Back to Bestiary</button>
          <p style={{ fontSize: "11px", letterSpacing: "0.4em", textTransform: "uppercase", color: "var(--color-gold-dark)", margin: "0 0 8px" }}>
            ✦ Public Bestiary
          </p>
          <h1 style={{ fontSize: "36px", fontWeight: "normal", color: "var(--color-text)", margin: 0 }}>
            Browse Monsters
          </h1>
        </div>
      </div>

      <div style={{ display: "flex", gap: "12px", marginBottom: "32px" }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search monsters..."
          style={{
            flex: 1, background: "var(--color-card)", border: "1px solid var(--color-border)",
            color: "var(--color-text)", padding: "10px 16px", fontSize: "14px",
            fontFamily: "inherit", outline: "none",
          }}
          onFocus={e => e.currentTarget.style.borderColor = "var(--color-gold)"}
          onBlur={e => e.currentTarget.style.borderColor = "var(--color-border)"}
        />
        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
          style={{
            background: "var(--color-card)", border: "1px solid var(--color-border)",
            color: "var(--color-text-dim)", padding: "10px 16px", fontSize: "13px",
            fontFamily: "inherit", outline: "none", cursor: "pointer", letterSpacing: "0.05em",
            appearance: "none" as const,
          }}
        >
          <option value="all">All Types</option>
          {usedTypes.map(t => <option key={t} value={t!}>{t}</option>)}
        </select>
      </div>

      <div style={{ height: "1px", background: "var(--color-border)", marginBottom: "32px" }} />

      {filtered.length === 0 && (
        <div style={{
          textAlign: "center", padding: "80px 40px",
          border: "1px dashed var(--color-border)", color: "var(--color-text-dim)",
        }}>
          <div style={{ fontSize: "40px", marginBottom: "16px" }}>🐉</div>
          <p style={{ letterSpacing: "0.2em", textTransform: "uppercase", fontSize: "13px" }}>
            {search || filterType !== 'all' ? 'No monsters match your search' : 'No public monsters available'}
          </p>
        </div>
      )}

      {filtered.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 80px 80px 100px 120px", padding: "10px 20px", gap: "16px" }}>
            {["Name", "Type", "HP", "AC", "Speed", ""].map(h => (
              <div key={h} style={{ fontSize: "10px", letterSpacing: "0.25em", textTransform: "uppercase", color: "var(--color-text-dim)" }}>{h}</div>
            ))}
          </div>

          {filtered.map(m => {
            const isCopying = copying === m.id
            const isCopied = copied === m.id
            const isHovered = hovered === m.id

            return (
              <div
                key={m.id}
                onMouseEnter={() => setHovered(m.id)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  display: "grid", gridTemplateColumns: "2fr 1fr 80px 80px 100px 120px",
                  padding: "16px 20px", gap: "16px", alignItems: "center",
                  background: isHovered ? "var(--color-card-hover)" : "var(--color-card)",
                  border: `1px solid ${isHovered ? "rgba(201,168,76,0.4)" : "var(--color-border)"}`,
                  transition: "all 0.2s",
                }}
              >
                <div style={{ fontSize: "16px", color: "var(--color-text)" }}>{m.name}</div>
                <div style={{ fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-text-dim)" }}>
                  {m.type ?? '—'}
                </div>
                <div style={{ color: "var(--color-gold)", fontSize: "15px" }}>{m.hp ?? '—'}</div>
                <div style={{ color: "var(--color-gold)", fontSize: "15px" }}>{m.ac ?? '—'}</div>
                <div style={{ color: "var(--color-text-muted)", fontSize: "13px" }}>{m.speed ?? '—'}</div>
                <button
                  onClick={() => handleCopy(m)}
                  disabled={isCopying || isCopied}
                  style={{
                    background: isCopied
                      ? "transparent"
                      : "linear-gradient(135deg, var(--color-red), var(--color-red-dark))",
                    border: `1px solid ${isCopied ? "var(--color-border)" : "var(--color-gold)"}`,
                    color: isCopied ? "var(--color-text-dim)" : "var(--color-gold)",
                    padding: "6px 14px", fontSize: "10px", letterSpacing: "0.15em",
                    textTransform: "uppercase", cursor: isCopying || isCopied ? "not-allowed" : "pointer",
                    fontFamily: "inherit", transition: "all 0.2s",
                    opacity: isCopying ? 0.7 : 1,
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
