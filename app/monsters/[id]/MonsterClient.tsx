"use client"

import { Monster, MonsterSkill } from '@/lib/types'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'

interface Props {
  monster: Monster
  skills: MonsterSkill[]
}

const DAMAGE_TYPES = ['Slashing', 'Piercing', 'Bludgeoning', 'Fire', 'Cold', 'Lightning', 'Thunder', 'Poison', 'Acid', 'Psychic', 'Radiant', 'Necrotic', 'Force']

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
  fontSize: "10px",
  letterSpacing: "0.25em",
  textTransform: "uppercase" as const,
  color: "var(--color-text-dim)",
  marginBottom: "6px",
}

const emptySkillForm = {
  name: '', description: '', damage: '',
  damage_type: '', range: '', cooldown: '',
}

export default function MonsterClient({ monster, skills: initialSkills }: Props) {
  const router = useRouter()
  const [skills, setSkills] = useState(initialSkills)
  const [addingSkill, setAddingSkill] = useState(false)
  const [skillForm, setSkillForm] = useState(emptySkillForm)
  const [savingSkill, setSavingSkill] = useState(false)
  const [deletingSkill, setDeletingSkill] = useState<string | null>(null)
  const [expandedSkill, setExpandedSkill] = useState<string | null>(null)

  function handleSkillChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setSkillForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleAddSkill() {
    if (!skillForm.name.trim()) return
    setSavingSkill(true)
    const { data } = await supabase.from('monster_skills').insert({
      monster_id: monster.id,
      name: skillForm.name.trim(),
      description: skillForm.description.trim() || null,
      damage: skillForm.damage.trim() || null,
      damage_type: skillForm.damage_type || null,
      range: skillForm.range.trim() || null,
      cooldown: skillForm.cooldown ? parseInt(skillForm.cooldown) : null,
    }).select().single()
    if (data) setSkills(prev => [...prev, data as MonsterSkill])
    setSkillForm(emptySkillForm)
    setAddingSkill(false)
    setSavingSkill(false)
  }

  async function handleDeleteSkill(id: string) {
    if (!confirm('Delete this skill?')) return
    setDeletingSkill(id)
    await supabase.from('monster_skills').delete().eq('id', id)
    setSkills(prev => prev.filter(s => s.id !== id))
    setDeletingSkill(null)
  }

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "48px 40px 80px" }}>

      {/* Back */}
      <button
        onClick={() => router.push('/monsters')}
        style={{
          background: "transparent", border: "none", color: "var(--color-text-dim)",
          cursor: "pointer", fontFamily: "inherit", fontSize: "13px",
          letterSpacing: "0.1em", padding: 0, marginBottom: "32px", display: "block",
        }}
        onMouseEnter={e => e.currentTarget.style.color = "var(--color-gold)"}
        onMouseLeave={e => e.currentTarget.style.color = "var(--color-text-dim)"}
      >
        ← All Monsters
      </button>

      {/* Monster header */}
      <div style={{ marginBottom: "40px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            {monster.type && (
              <p style={{
                fontSize: "11px", letterSpacing: "0.4em", textTransform: "uppercase",
                color: "var(--color-gold-dark)", margin: "0 0 8px",
              }}>
                ✦ {monster.type}
              </p>
            )}
            <h1 style={{ fontSize: "42px", fontWeight: "normal", color: "var(--color-text)", margin: "0 0 24px" }}>
              {monster.name}
            </h1>
          </div>
          <button
            onClick={() => router.push(`/monsters/${monster.id}`)}
            style={{
              background: "transparent", border: "1px solid var(--color-border)",
              color: "var(--color-text-muted)", padding: "8px 20px",
              fontSize: "11px", letterSpacing: "0.2em", textTransform: "uppercase",
              cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s", marginTop: "8px",
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--color-gold)"; e.currentTarget.style.color = "var(--color-gold)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--color-border)"; e.currentTarget.style.color = "var(--color-text-muted)"; }}
          >
            ✎ Edit
          </button>
        </div>

        {/* Stat pills */}
        <div style={{ display: "flex", gap: "24px", flexWrap: "wrap" as const }}>
          {[
            { label: "HP", value: monster.hp },
            { label: "AC", value: monster.ac },
            { label: "Speed", value: monster.speed },
          ].filter(s => s.value).map(s => (
            <div key={s.label} style={{
              border: "1px solid var(--color-border)",
              padding: "12px 20px", textAlign: "center" as const,
            }}>
              <div style={{ fontSize: "20px", color: "var(--color-gold)", fontWeight: "bold" }}>{s.value}</div>
              <div style={{ fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--color-text-dim)", marginTop: "4px" }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Notes */}
        {monster.notes && (
          <p style={{
            marginTop: "24px", color: "var(--color-text-muted)",
            fontSize: "14px", lineHeight: 1.8, maxWidth: "600px",
            borderLeft: "2px solid var(--color-border)", paddingLeft: "16px",
          }}>
            {monster.notes}
          </p>
        )}
      </div>

      <div style={{ height: "1px", background: "var(--color-border)", marginBottom: "40px" }} />

      {/* Skills section */}
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
          <h2 style={{
            fontSize: "12px", letterSpacing: "0.35em", textTransform: "uppercase",
            color: "var(--color-text-dim)", margin: 0,
          }}>
            ✦ Skills & Abilities ({skills.length})
          </h2>
          <button
            onClick={() => setAddingSkill(true)}
            style={{
              background: "transparent", border: "1px solid var(--color-border)",
              color: "var(--color-text-muted)", padding: "6px 16px",
              fontSize: "11px", letterSpacing: "0.15em", textTransform: "uppercase",
              cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s",
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--color-gold)"; e.currentTarget.style.color = "var(--color-gold)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--color-border)"; e.currentTarget.style.color = "var(--color-text-muted)"; }}
          >
            + Add Skill
          </button>
        </div>

        {/* Add skill form */}
        {addingSkill && (
          <div style={{
            border: "1px solid var(--color-gold)", padding: "24px",
            marginBottom: "16px", display: "flex", flexDirection: "column", gap: "16px",
          }}>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "16px" }}>
              <div>
                <label style={labelStyle}>Skill Name *</label>
                <input name="name" value={skillForm.name} onChange={handleSkillChange}
                  placeholder="e.g. Fire Breath" autoFocus style={inputStyle}
                  onFocus={e => e.currentTarget.style.borderColor = "var(--color-gold)"}
                  onBlur={e => e.currentTarget.style.borderColor = "var(--color-border)"}
                />
              </div>
              <div>
                <label style={labelStyle}>Cooldown (rounds)</label>
                <input name="cooldown" type="number" min="0" value={skillForm.cooldown}
                  onChange={handleSkillChange} placeholder="e.g. 3" style={inputStyle}
                  onFocus={e => e.currentTarget.style.borderColor = "var(--color-gold)"}
                  onBlur={e => e.currentTarget.style.borderColor = "var(--color-border)"}
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
              <div>
                <label style={labelStyle}>Damage</label>
                <input name="damage" value={skillForm.damage} onChange={handleSkillChange}
                  placeholder="e.g. 4d6" style={inputStyle}
                  onFocus={e => e.currentTarget.style.borderColor = "var(--color-gold)"}
                  onBlur={e => e.currentTarget.style.borderColor = "var(--color-border)"}
                />
              </div>
              <div>
                <label style={labelStyle}>Damage Type</label>
                <select name="damage_type" value={skillForm.damage_type} onChange={handleSkillChange}
                  style={{ ...inputStyle, cursor: "pointer" }}>
                  <option value="">Select...</option>
                  {DAMAGE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Range</label>
                <input name="range" value={skillForm.range} onChange={handleSkillChange}
                  placeholder="e.g. 30ft cone" style={inputStyle}
                  onFocus={e => e.currentTarget.style.borderColor = "var(--color-gold)"}
                  onBlur={e => e.currentTarget.style.borderColor = "var(--color-border)"}
                />
              </div>
            </div>

            <div>
              <label style={labelStyle}>Description</label>
              <textarea name="description" value={skillForm.description} onChange={handleSkillChange}
                placeholder="What does this skill do?" rows={3}
                style={{ ...inputStyle, resize: "vertical" }}
                onFocus={e => e.currentTarget.style.borderColor = "var(--color-gold)"}
                onBlur={e => e.currentTarget.style.borderColor = "var(--color-border)"}
              />
            </div>

            <div style={{ display: "flex", gap: "12px" }}>
              <button onClick={handleAddSkill} disabled={savingSkill} style={{
                background: "linear-gradient(135deg, var(--color-red), var(--color-red-dark))",
                border: "1px solid var(--color-gold)", color: "var(--color-gold)",
                padding: "10px 24px", fontSize: "11px", letterSpacing: "0.15em",
                textTransform: "uppercase", cursor: "pointer", fontFamily: "inherit",
              }}>
                {savingSkill ? "Saving..." : "Save Skill"}
              </button>
              <button onClick={() => { setAddingSkill(false); setSkillForm(emptySkillForm) }} style={{
                background: "transparent", border: "1px solid var(--color-border)",
                color: "var(--color-text-muted)", padding: "10px 24px",
                fontSize: "11px", letterSpacing: "0.15em", textTransform: "uppercase",
                cursor: "pointer", fontFamily: "inherit",
              }}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Empty state */}
        {skills.length === 0 && !addingSkill && (
          <div style={{
            textAlign: "center", padding: "48px",
            border: "1px dashed var(--color-border)", color: "var(--color-text-dim)",
          }}>
            <p style={{ letterSpacing: "0.2em", textTransform: "uppercase", fontSize: "12px" }}>
              No skills yet
            </p>
          </div>
        )}

        {/* Skills list */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {skills.map(skill => {
            const isExpanded = expandedSkill === skill.id
            return (
              <div key={skill.id} style={{
                border: `1px solid ${isExpanded ? "rgba(201,168,76,0.4)" : "var(--color-border)"}`,
                transition: "border-color 0.2s",
              }}>
                {/* Skill header row */}
                <div
                  onClick={() => setExpandedSkill(isExpanded ? null : skill.id)}
                  style={{
                    padding: "16px 20px", display: "flex", alignItems: "center",
                    justifyContent: "space-between", cursor: "pointer",
                    background: isExpanded ? "var(--color-card-hover)" : "var(--color-card)",
                    transition: "background 0.2s",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    <span style={{ fontSize: "16px", color: "var(--color-text)" }}>{skill.name}</span>
                    {skill.damage && (
                      <span style={{
                        fontSize: "12px", color: "var(--color-gold)",
                        border: "1px solid rgba(201,168,76,0.3)", padding: "2px 8px",
                      }}>
                        {skill.damage}{skill.damage_type ? ` ${skill.damage_type}` : ''}
                      </span>
                    )}
                    {skill.range && (
                      <span style={{ fontSize: "12px", color: "var(--color-text-dim)" }}>
                        {skill.range}
                      </span>
                    )}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    {skill.cooldown ? (
                      <span style={{ fontSize: "11px", color: "var(--color-text-dim)", letterSpacing: "0.1em" }}>
                        {skill.cooldown} round cooldown
                      </span>
                    ) : null}
                    <button
                      onClick={e => { e.stopPropagation(); handleDeleteSkill(skill.id) }}
                      disabled={deletingSkill === skill.id}
                      style={{
                        background: "transparent", border: "none", color: "var(--color-text-dim)",
                        cursor: "pointer", fontSize: "14px", padding: "4px", transition: "color 0.2s",
                      }}
                      onMouseEnter={e => { e.stopPropagation(); e.currentTarget.style.color = "#c06060"; }}
                      onMouseLeave={e => e.currentTarget.style.color = "var(--color-text-dim)"}
                    >
                      {deletingSkill === skill.id ? "..." : "✕"}
                    </button>
                    <span style={{
                      color: "var(--color-gold)", fontSize: "16px",
                      transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                      transition: "transform 0.2s", display: "inline-block",
                    }}>▾</span>
                  </div>
                </div>

                {/* Expanded description */}
                {isExpanded && skill.description && (
                  <div style={{
                    borderTop: "1px solid var(--color-border)",
                    padding: "16px 20px", background: "rgba(0,0,0,0.2)",
                    color: "var(--color-text-muted)", fontSize: "14px", lineHeight: 1.8,
                  }}>
                    {skill.description}
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