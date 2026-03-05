"use client"

import { Campaign, Chapter, Dungeon } from '@/lib/types'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'

interface Props {
  campaign: Campaign
  chapters: Chapter[]
  dungeons: Dungeon[]
}

const inputStyle = {
  background: "var(--color-card)",
  border: "1px solid var(--color-border)",
  color: "var(--color-text)",
  padding: "10px 14px",
  fontSize: "14px",
  fontFamily: "inherit",
  outline: "none",
  transition: "border-color 0.2s",
  width: "100%",
  boxSizing: "border-box" as const,
}

const labelStyle = {
  display: "block" as const,
  fontSize: "11px",
  letterSpacing: "0.25em",
  textTransform: "uppercase" as const,
  color: "var(--color-text-dim)",
  marginBottom: "6px",
}

export default function CampaignClient({ campaign, chapters: initialChapters, dungeons: initialDungeons }: Props) {
  const router = useRouter()

  // Campaign edit state
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: campaign.name,
    setting: campaign.setting ?? '',
    description: campaign.description ?? '',
    player_count: campaign.player_count?.toString() ?? '',
  })

  // Chapters + dungeons state
  const [chapters, setChapters] = useState(initialChapters)
  const [dungeons, setDungeons] = useState(initialDungeons)
  const [expandedChapter, setExpandedChapter] = useState<string | null>(null)

  // New chapter state
  const [addingChapter, setAddingChapter] = useState(false)
  const [newChapterName, setNewChapterName] = useState('')
  const [savingChapter, setSavingChapter] = useState(false)

  // New dungeon state
  const [addingDungeonTo, setAddingDungeonTo] = useState<string | null>(null)
  const [newDungeonName, setNewDungeonName] = useState('')
  const [savingDungeon, setSavingDungeon] = useState(false)

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSaveCampaign() {
    setSaving(true)
    await supabase.from('campaigns').update({
      name: form.name.trim(),
      setting: form.setting.trim() || null,
      description: form.description.trim() || null,
      player_count: form.player_count ? parseInt(form.player_count) : null,
    }).eq('id', campaign.id)
    setSaving(false)
    setEditing(false)
  }

  async function handleAddChapter() {
    if (!newChapterName.trim()) return
    setSavingChapter(true)
    const { data } = await supabase.from('chapters').insert({
      name: newChapterName.trim(),
      campaign_id: campaign.id,
      order_index: chapters.length,
    }).select().single()
    if (data) setChapters(prev => [...prev, data as Chapter])
    setNewChapterName('')
    setAddingChapter(false)
    setSavingChapter(false)
  }

  async function handleAddDungeon(chapterId: string) {
    if (!newDungeonName.trim()) return
    setSavingDungeon(true)
    const chapterDungeons = dungeons.filter(d => d.chapter_id === chapterId)
    const { data } = await supabase.from('dungeons').insert({
      name: newDungeonName.trim(),
      chapter_id: chapterId,
      order_index: chapterDungeons.length,
    }).select().single()
    if (data) setDungeons(prev => [...prev, data as Dungeon])
    setNewDungeonName('')
    setAddingDungeonTo(null)
    setSavingDungeon(false)
  }

  function getDungeonsForChapter(chapterId: string) {
    return dungeons.filter(d => d.chapter_id === chapterId)
  }

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "48px 40px 80px" }}>

      {/* Back button */}
      <button
        onClick={() => router.push('/campaigns')}
        style={{
          background: "transparent", border: "none", color: "var(--color-text-dim)",
          cursor: "pointer", fontFamily: "inherit", fontSize: "13px",
          letterSpacing: "0.1em", padding: 0, marginBottom: "32px", display: "block",
        }}
        onMouseEnter={e => e.currentTarget.style.color = "var(--color-gold)"}
        onMouseLeave={e => e.currentTarget.style.color = "var(--color-text-dim)"}
      >
        ← All Campaigns
      </button>

      {/* Campaign header */}
      <div style={{ marginBottom: "48px" }}>
        <p style={{
          fontSize: "11px", letterSpacing: "0.4em", textTransform: "uppercase",
          color: "var(--color-gold-dark)", margin: "0 0 8px",
        }}>
          ✦ {form.setting || 'Campaign'}
        </p>

        {editing ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div>
              <label style={labelStyle}>Campaign Name</label>
              <input name="name" value={form.name} onChange={handleChange} style={{ ...inputStyle, fontSize: "24px", padding: "12px 16px" }}
                onFocus={e => e.currentTarget.style.borderColor = "var(--color-gold)"}
                onBlur={e => e.currentTarget.style.borderColor = "var(--color-border)"}
              />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div>
                <label style={labelStyle}>Setting</label>
                <input name="setting" value={form.setting} onChange={handleChange} style={inputStyle}
                  onFocus={e => e.currentTarget.style.borderColor = "var(--color-gold)"}
                  onBlur={e => e.currentTarget.style.borderColor = "var(--color-border)"}
                />
              </div>
              <div>
                <label style={labelStyle}>Players</label>
                <input name="player_count" type="number" value={form.player_count} onChange={handleChange} style={inputStyle}
                  onFocus={e => e.currentTarget.style.borderColor = "var(--color-gold)"}
                  onBlur={e => e.currentTarget.style.borderColor = "var(--color-border)"}
                />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Description</label>
              <textarea name="description" value={form.description} onChange={handleChange} rows={3}
                style={{ ...inputStyle, resize: "vertical" }}
                onFocus={e => e.currentTarget.style.borderColor = "var(--color-gold)"}
                onBlur={e => e.currentTarget.style.borderColor = "var(--color-border)"}
              />
            </div>
            <div style={{ display: "flex", gap: "12px" }}>
              <button onClick={handleSaveCampaign} disabled={saving} style={{
                background: "linear-gradient(135deg, var(--color-red), var(--color-red-dark))",
                border: "1px solid var(--color-gold)", color: "var(--color-gold)",
                padding: "10px 24px", fontSize: "11px", letterSpacing: "0.2em",
                textTransform: "uppercase", cursor: "pointer", fontFamily: "inherit",
              }}>
                {saving ? "Saving..." : "Save Changes"}
              </button>
              <button onClick={() => setEditing(false)} style={{
                background: "transparent", border: "1px solid var(--color-border)",
                color: "var(--color-text-muted)", padding: "10px 24px",
                fontSize: "11px", letterSpacing: "0.2em", textTransform: "uppercase",
                cursor: "pointer", fontFamily: "inherit",
              }}>
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px" }}>
              <h1 style={{ fontSize: "42px", fontWeight: "normal", color: "var(--color-text)", margin: "0 0 16px" }}>
                {form.name}
              </h1>
              <button onClick={() => setEditing(true)} style={{
                background: "transparent", border: "1px solid var(--color-border)",
                color: "var(--color-text-muted)", padding: "8px 20px",
                fontSize: "11px", letterSpacing: "0.2em", textTransform: "uppercase",
                cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s",
                whiteSpace: "nowrap" as const, marginTop: "8px",
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--color-gold)"; e.currentTarget.style.color = "var(--color-gold)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--color-border)"; e.currentTarget.style.color = "var(--color-text-muted)"; }}
              >
                ✎ Edit
              </button>
            </div>
            {form.description && (
              <p style={{ color: "var(--color-text-muted)", fontSize: "15px", lineHeight: 1.8, maxWidth: "600px", margin: "0 0 20px" }}>
                {form.description}
              </p>
            )}
            {form.player_count && (
              <div style={{ display: "inline-flex", gap: "6px", alignItems: "center" }}>
                <span style={{ fontSize: "11px", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--color-text-dim)" }}>Players:</span>
                <span style={{ color: "var(--color-gold)", fontSize: "14px" }}>{form.player_count}</span>
              </div>
            )}
          </div>
        )}
      </div>

      <div style={{ height: "1px", background: "var(--color-border)", marginBottom: "40px" }} />

      {/* Chapters section */}
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
          <h2 style={{
            fontSize: "12px", letterSpacing: "0.35em", textTransform: "uppercase",
            color: "var(--color-text-dim)", margin: 0,
          }}>
            ✦ Chapters ({chapters.length})
          </h2>
          <button
            onClick={() => setAddingChapter(true)}
            style={{
              background: "transparent", border: "1px solid var(--color-border)",
              color: "var(--color-text-muted)", padding: "6px 16px",
              fontSize: "11px", letterSpacing: "0.15em", textTransform: "uppercase",
              cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s",
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--color-gold)"; e.currentTarget.style.color = "var(--color-gold)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--color-border)"; e.currentTarget.style.color = "var(--color-text-muted)"; }}
          >
            + Add Chapter
          </button>
        </div>

        {/* Add chapter form */}
        {addingChapter && (
          <div style={{
            border: "1px solid var(--color-gold)", padding: "20px",
            marginBottom: "16px", display: "flex", gap: "12px", alignItems: "center",
          }}>
            <input
              value={newChapterName}
              onChange={e => setNewChapterName(e.target.value)}
              placeholder="Chapter name..."
              autoFocus
              onKeyDown={e => { if (e.key === 'Enter') handleAddChapter(); if (e.key === 'Escape') setAddingChapter(false); }}
              style={{ ...inputStyle, flex: 1 }}
              onFocus={e => e.currentTarget.style.borderColor = "var(--color-gold)"}
              onBlur={e => e.currentTarget.style.borderColor = "var(--color-border)"}
            />
            <button onClick={handleAddChapter} disabled={savingChapter} style={{
              background: "linear-gradient(135deg, var(--color-red), var(--color-red-dark))",
              border: "1px solid var(--color-gold)", color: "var(--color-gold)",
              padding: "10px 20px", fontSize: "11px", letterSpacing: "0.15em",
              textTransform: "uppercase", cursor: "pointer", fontFamily: "inherit",
            }}>
              {savingChapter ? "Saving..." : "Save"}
            </button>
            <button onClick={() => setAddingChapter(false)} style={{
              background: "transparent", border: "1px solid var(--color-border)",
              color: "var(--color-text-muted)", padding: "10px 20px",
              fontSize: "11px", letterSpacing: "0.15em", textTransform: "uppercase",
              cursor: "pointer", fontFamily: "inherit",
            }}>
              Cancel
            </button>
          </div>
        )}

        {/* Empty state */}
        {chapters.length === 0 && !addingChapter && (
          <div style={{
            textAlign: "center", padding: "48px",
            border: "1px dashed var(--color-border)", color: "var(--color-text-dim)",
          }}>
            <p style={{ letterSpacing: "0.2em", textTransform: "uppercase", fontSize: "12px" }}>
              No chapters yet
            </p>
          </div>
        )}

        {/* Chapter list */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {chapters.map((chapter, index) => {
            const isExpanded = expandedChapter === chapter.id
            const chapterDungeons = getDungeonsForChapter(chapter.id)

            return (
              <div key={chapter.id} style={{
                border: `1px solid ${isExpanded ? "rgba(201,168,76,0.4)" : "var(--color-border)"}`,
                transition: "border-color 0.2s",
              }}>
                {/* Chapter header */}
                <div
                  onClick={() => setExpandedChapter(isExpanded ? null : chapter.id)}
                  style={{
                    padding: "20px 24px",
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    cursor: "pointer",
                    background: isExpanded ? "var(--color-card-hover)" : "var(--color-card)",
                    transition: "background 0.2s",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    <span style={{ color: "var(--color-gold-dark)", fontSize: "12px", letterSpacing: "0.1em" }}>
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span style={{ fontSize: "18px", color: "var(--color-text)" }}>{chapter.name}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                    <span style={{ fontSize: "11px", color: "var(--color-text-dim)", letterSpacing: "0.1em" }}>
                      {chapterDungeons.length} {chapterDungeons.length === 1 ? 'dungeon' : 'dungeons'}
                    </span>
                    <span style={{
                      color: "var(--color-gold)", fontSize: "16px",
                      transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                      transition: "transform 0.2s", display: "inline-block",
                    }}>
                      ▾
                    </span>
                  </div>
                </div>

                {/* Expanded dungeons */}
                {isExpanded && (
                  <div style={{
                    borderTop: "1px solid var(--color-border)",
                    padding: "16px 24px 20px",
                    background: "rgba(0,0,0,0.2)",
                  }}>
                    {/* Dungeon list */}
                    {chapterDungeons.length > 0 && (
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px" }}>
                        {chapterDungeons.map(dungeon => (
                          <div key={dungeon.id} style={{
                            padding: "12px 16px",
                            border: "1px solid var(--color-border)",
                            background: "var(--color-card)",
                            display: "flex", alignItems: "center", gap: "12px",
                          }}>
                            <span style={{ color: "var(--color-gold)", fontSize: "12px" }}>⚔</span>
                            <span style={{ fontSize: "15px", color: "var(--color-text)" }}>{dungeon.name}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add dungeon form or button */}
                    {addingDungeonTo === chapter.id ? (
                      <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                        <input
                          value={newDungeonName}
                          onChange={e => setNewDungeonName(e.target.value)}
                          placeholder="Dungeon name..."
                          autoFocus
                          onKeyDown={e => { if (e.key === 'Enter') handleAddDungeon(chapter.id); if (e.key === 'Escape') setAddingDungeonTo(null); }}
                          style={{ ...inputStyle, flex: 1 }}
                          onFocus={e => e.currentTarget.style.borderColor = "var(--color-gold)"}
                          onBlur={e => e.currentTarget.style.borderColor = "var(--color-border)"}
                        />
                        <button onClick={() => handleAddDungeon(chapter.id)} disabled={savingDungeon} style={{
                          background: "linear-gradient(135deg, var(--color-red), var(--color-red-dark))",
                          border: "1px solid var(--color-gold)", color: "var(--color-gold)",
                          padding: "10px 16px", fontSize: "11px", letterSpacing: "0.15em",
                          textTransform: "uppercase", cursor: "pointer", fontFamily: "inherit",
                        }}>
                          {savingDungeon ? "..." : "Save"}
                        </button>
                        <button onClick={() => setAddingDungeonTo(null)} style={{
                          background: "transparent", border: "1px solid var(--color-border)",
                          color: "var(--color-text-muted)", padding: "10px 16px",
                          fontSize: "11px", cursor: "pointer", fontFamily: "inherit",
                        }}>
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setAddingDungeonTo(chapter.id); setNewDungeonName(''); }}
                        style={{
                          background: "transparent", border: "1px dashed var(--color-border)",
                          color: "var(--color-text-dim)", padding: "8px 16px",
                          fontSize: "11px", letterSpacing: "0.15em", textTransform: "uppercase",
                          cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s",
                        }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--color-gold)"; e.currentTarget.style.color = "var(--color-gold)"; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--color-border)"; e.currentTarget.style.color = "var(--color-text-dim)"; }}
                      >
                        + Add Dungeon
                      </button>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
