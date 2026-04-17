"use client"

import { Monster } from '@/lib/types'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'

interface Props {
  monsters: Monster[]
}

export default function MonstersClient({ monsters: initial }: Props) {
  const router = useRouter()
  const [monsters, setMonsters] = useState(initial)
  const [hovered, setHovered] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<string>('all')

  async function handleDelete(id: string) {
    if (!confirm('Delete this monster?')) return
    setDeleting(id)
    await supabase.from('monsters').delete().eq('id', id)
    setMonsters(prev => prev.filter(m => m.id !== id))
    setDeleting(null)
  }

  const filtered = monsters
    .filter(m => m.name.toLowerCase().includes(search.toLowerCase()))
    .filter(m => filterType === 'all' || m.type === filterType)

  const usedTypes = Array.from(new Set(monsters.map(m => m.type).filter(Boolean)))

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "48px 40px 80px" }}>

      {/* Page header */}
      <div style={{
        display: "flex", alignItems: "center",
        justifyContent: "space-between", marginBottom: "40px",
      }}>
        <div>
          <p style={{
            fontSize: "11px", letterSpacing: "0.4em", textTransform: "uppercase",
            color: "var(--color-gold-dark)", margin: "0 0 8px",
          }}>
            ✦ Your Bestiary
          </p>
          <h1 style={{ fontSize: "36px", fontWeight: "normal", color: "var(--color-text)", margin: 0 }}>
            Monsters
          </h1>
        </div>
        <button
          onClick={() => router.push('/monsters/new')}
          style={{
            background: "linear-gradient(135deg, var(--color-red), var(--color-red-dark))",
            border: "1px solid var(--color-gold)", color: "var(--color-gold)",
            padding: "12px 28px", fontSize: "12px", letterSpacing: "0.2em",
            textTransform: "uppercase", cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s",
          }}
          onMouseEnter={e => { e.currentTarget.style.filter = "brightness(1.2)"; e.currentTarget.style.boxShadow = "0 0 20px rgba(139,26,26,0.5)"; }}
          onMouseLeave={e => { e.currentTarget.style.filter = "brightness(1)"; e.currentTarget.style.boxShadow = "none"; }}
        >
          + New Monster
        </button>
      </div>

      {/* Search + filter bar */}
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
            color: "var(--color-text-dim)",
            padding: "10px 16px", fontSize: "13px", fontFamily: "inherit",
            outline: "none", cursor: "pointer", letterSpacing: "0.05em",
          }}
        >
          <option value="all">All Types</option>
          {usedTypes.map(t => <option key={t} value={t!}>{t}</option>)}
        </select>
      </div>

      <div style={{ height: "1px", background: "var(--color-border)", marginBottom: "32px" }} />

      {/* Empty state */}
      {filtered.length === 0 && (
        <div style={{
          textAlign: "center", padding: "80px 40px",
          border: "1px dashed var(--color-border)", color: "var(--color-text-dim)",
        }}>
          <div style={{ fontSize: "40px", marginBottom: "16px" }}>🐉</div>
          <p style={{ letterSpacing: "0.2em", textTransform: "uppercase", fontSize: "13px" }}>
            {search || filterType !== 'all' ? 'No monsters match your search' : 'No monsters yet'}
          </p>
        </div>
      )}

      {/* Monster table */}
      {filtered.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>

          {/* Table header */}
          <div style={{
            display: "grid", gridTemplateColumns: "2fr 1fr 80px 80px 100px 40px",
            padding: "10px 20px", gap: "16px",
          }}>
            {["Name", "Type", "HP", "AC", "Speed", ""].map(h => (
              <div key={h} style={{
                fontSize: "10px", letterSpacing: "0.25em",
                textTransform: "uppercase", color: "var(--color-text-dim)",
              }}>{h}</div>
            ))}
          </div>

          {filtered.map(m => (
            <div
              key={m.id}
              onMouseEnter={() => setHovered(m.id)}
              onMouseLeave={() => setHovered(null)}
              style={{
                display: "grid", gridTemplateColumns: "2fr 1fr 80px 80px 100px 40px",
                padding: "16px 20px", gap: "16px", alignItems: "center",
                background: hovered === m.id ? "var(--color-card-hover)" : "var(--color-card)",
                border: `1px solid ${hovered === m.id ? "rgba(201,168,76,0.4)" : "var(--color-border)"}`,
                transition: "all 0.2s", cursor: "pointer",
              }}
              onClick={() => router.push(`/monsters/${m.id}/edit`)}
            >
              <div style={{ fontSize: "16px", color: "var(--color-text)" }}>{m.name}</div>
              <div style={{
                fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase",
                color: "var(--color-text-dim)",
              }}>{m.type ?? '—'}</div>
              <div style={{ color: "var(--color-gold)", fontSize: "15px" }}>{m.hp ?? '—'}</div>
              <div style={{ color: "var(--color-gold)", fontSize: "15px" }}>{m.ac ?? '—'}</div>
              <div style={{ color: "var(--color-text-muted)", fontSize: "13px" }}>{m.speed ?? '—'}</div>
              <button
                onClick={e => { e.stopPropagation(); handleDelete(m.id) }}
                disabled={deleting === m.id}
                style={{
                  background: "transparent", border: "none", color: "var(--color-text-dim)",
                  cursor: "pointer", fontSize: "14px", padding: "4px", transition: "color 0.2s",
                }}
                onMouseEnter={e => { e.stopPropagation(); e.currentTarget.style.color = "#c06060"; }}
                onMouseLeave={e => e.currentTarget.style.color = "var(--color-text-dim)"}
              >
                {deleting === m.id ? "..." : "✕"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}