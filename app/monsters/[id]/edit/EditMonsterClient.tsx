"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Monster, MonsterSkill } from '@/lib/types'

import { MONSTER_TYPES, DAMAGE_TYPES } from '@/lib/constants'

const inputStyle = {
  width: "100%", background: "var(--color-card)",
  border: "1px solid var(--color-border)", color: "var(--color-text)",
  padding: "12px 16px", fontSize: "15px", fontFamily: "inherit",
  outline: "none", boxSizing: "border-box" as const, transition: "border-color 0.2s",
  appearance: "none" as const,  
  height: "47px",      
}

const smallInputStyle = {
  ...inputStyle, padding: "10px 14px", fontSize: "14px", height: "43px",
}

const labelStyle = {
  display: "block" as const, fontSize: "11px", letterSpacing: "0.25em",
  textTransform: "uppercase" as const, color: "var(--color-text-dim)", marginBottom: "8px",
}

const smallLabelStyle = {
  ...labelStyle, fontSize: "10px", marginBottom: "6px",
}

const emptySkillForm = {
  name: '', description: '', damage: '', damage_type: '', range: '', cooldown: '',
}

interface Props {
  monster: Monster
  skills: MonsterSkill[]
}

export default function EditMonsterClient({ monster, skills: initialSkills }: Props) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    name: monster.name,
    type: monster.type ?? '',
    hp: monster.hp?.toString() ?? '',
    ac: monster.ac?.toString() ?? '',
    speed: monster.speed ?? '',
    notes: monster.notes ?? '',
  })

  const [skills, setSkills] = useState<MonsterSkill[]>(initialSkills)
  const [addingSkill, setAddingSkill] = useState(false)
  const [skillForm, setSkillForm] = useState(emptySkillForm)
  const [savingSkill, setSavingSkill] = useState(false)
  const [deletingSkill, setDeletingSkill] = useState<string | null>(null)
  const [expandedSkill, setExpandedSkill] = useState<string | null>(null)

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function handleSkillChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setSkillForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSave() {
    if (!form.name.trim()) { setError('Monster name is required.'); return }
    setSaving(true)
    setError(null)

    const { error } = await supabase.from('monsters').update({
      name: form.name.trim(),
      type: form.type || null,
      hp: form.hp ? parseInt(form.hp) : null,
      ac: form.ac ? parseInt(form.ac) : null,
      speed: form.speed.trim() || null,
      notes: form.notes.trim() || null,
    }).eq('id', monster.id)

    if (error) { setError(error.message); setSaving(false); return }
    router.push(`/monsters/${monster.id}`)
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
    <div style={{ maxWidth: "600px", margin: "0 auto", padding: "48px 40px 80px" }}>

      {/* Header */}
      <div style={{ marginBottom: "48px" }}>
        <button onClick={() => router.back()} style={{
          background: "transparent", border: "none", color: "var(--color-text-dim)",
          cursor: "pointer", fontFamily: "inherit", fontSize: "13px",
          letterSpacing: "0.1em", padding: 0, marginBottom: "24px", display: "block",
        }}
          onMouseEnter={e => e.currentTarget.style.color = "var(--color-gold)"}
          onMouseLeave={e => e.currentTarget.style.color = "var(--color-text-dim)"}
        >← Back</button>
        <p style={{
          fontSize: "11px", letterSpacing: "0.4em", textTransform: "uppercase",
          color: "var(--color-gold-dark)", margin: "0 0 8px",
        }}>✦ Edit Monster</p>
        <h1 style={{ fontSize: "36px", fontWeight: "normal", color: "var(--color-text)", margin: 0 }}>
          {monster.name}
        </h1>
      </div>

      <div style={{ height: "1px", background: "var(--color-border)", marginBottom: "40px" }} />

      {/* Monster fields */}
      <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
        <div>
          <label style={labelStyle}>Monster Name *</label>
          <input name="name" value={form.name} onChange={handleChange} style={inputStyle}
            onFocus={e => e.currentTarget.style.borderColor = "var(--color-gold)"}
            onBlur={e => e.currentTarget.style.borderColor = "var(--color-border)"}
          />
        </div>

        <div>
          <label style={labelStyle}>Type</label>
          <div style={{ position: "relative" }}>
            <select name="type" value={form.type} onChange={handleChange}
              style={{ ...inputStyle, cursor: "pointer", paddingRight: "36px" }}>              
              {MONSTER_TYPES.map(t => <option  style={{ backgroundColor: "#1a1410" }} key={t} value={t}>{t}</option>)}
            </select>           
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
          <div>
            <label style={labelStyle}>Hit Points</label>
            <input name="hp" type="number" min="1" value={form.hp} onChange={handleChange}
              placeholder="e.g. 120" style={inputStyle}
              onFocus={e => e.currentTarget.style.borderColor = "var(--color-gold)"}
              onBlur={e => e.currentTarget.style.borderColor = "var(--color-border)"}
            />
          </div>
          <div>
            <label style={labelStyle}>Armour Class</label>
            <input name="ac" type="number" min="1" value={form.ac} onChange={handleChange}
              placeholder="e.g. 16" style={inputStyle}
              onFocus={e => e.currentTarget.style.borderColor = "var(--color-gold)"}
              onBlur={e => e.currentTarget.style.borderColor = "var(--color-border)"}
            />
          </div>
          <div>
            <label style={labelStyle}>Speed</label>
            <input name="speed" value={form.speed} onChange={handleChange}
              placeholder="e.g. 30ft, fly 60ft" style={inputStyle}
              onFocus={e => e.currentTarget.style.borderColor = "var(--color-gold)"}
              onBlur={e => e.currentTarget.style.borderColor = "var(--color-border)"}
            />
          </div>
        </div>

        <div>
          <label style={labelStyle}>Notes</label>
          <textarea name="notes" value={form.notes} onChange={handleChange}
            placeholder="Special abilities, tactics, lore..."
            rows={3} style={{ ...inputStyle, resize: "vertical", height: "auto" }}
            onFocus={e => e.currentTarget.style.borderColor = "var(--color-gold)"}
            onBlur={e => e.currentTarget.style.borderColor = "var(--color-border)"}
          />
        </div>
      </div>

      <div style={{ height: "1px", background: "var(--color-border)", margin: "40px 0" }} />

      {/* Skills section */}
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
          <h2 style={{
            fontSize: "12px", letterSpacing: "0.35em", textTransform: "uppercase",
            color: "var(--color-text-dim)", margin: 0,
          }}>
            ✦ Skills & Abilities ({skills.length})
          </h2>
          {!addingSkill && (
            <button onClick={() => setAddingSkill(true)} style={{
              background: "transparent", border: "1px solid var(--color-border)",
              color: "var(--color-text-muted)", padding: "6px 16px",
              fontSize: "11px", letterSpacing: "0.15em", textTransform: "uppercase",
              cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s",
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--color-gold)"; e.currentTarget.style.color = "var(--color-gold)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--color-border)"; e.currentTarget.style.color = "var(--color-text-muted)"; }}
            >+ Add Skill</button>
          )}
        </div>

        {/* Add skill form */}
        {addingSkill && (
          <div style={{
            border: "1px solid var(--color-gold)", padding: "20px",
            marginBottom: "16px", display: "flex", flexDirection: "column", gap: "14px",
          }}>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "14px" }}>
              <div>
                <label style={smallLabelStyle}>Skill Name *</label>
                <input name="name" value={skillForm.name} onChange={handleSkillChange}
                  placeholder="e.g. Fire Breath" autoFocus style={smallInputStyle}
                  onFocus={e => e.currentTarget.style.borderColor = "var(--color-gold)"}
                  onBlur={e => e.currentTarget.style.borderColor = "var(--color-border)"}
                />
              </div>
              <div>
                <label style={smallLabelStyle}>Cooldown (rounds)</label>
                <input name="cooldown" type="number" min="0" value={skillForm.cooldown}
                  onChange={handleSkillChange} placeholder="e.g. 3" style={smallInputStyle}
                  onFocus={e => e.currentTarget.style.borderColor = "var(--color-gold)"}
                  onBlur={e => e.currentTarget.style.borderColor = "var(--color-border)"}
                />
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "14px" }}>
              <div>
                <label style={smallLabelStyle}>Damage</label>
                <input name="damage" value={skillForm.damage} onChange={handleSkillChange}
                  placeholder="e.g. 4d6" style={smallInputStyle}
                  onFocus={e => e.currentTarget.style.borderColor = "var(--color-gold)"}
                  onBlur={e => e.currentTarget.style.borderColor = "var(--color-border)"}
                />
              </div>
              <div>
                <label style={smallLabelStyle}>Damage Type</label>
                <div style={{ position: "relative" }}>
                  <select name="damage_type" value={skillForm.damage_type} onChange={handleSkillChange}
                    style={{ ...smallInputStyle, cursor: "pointer", paddingRight: "36px" }}>
                    
                    {DAMAGE_TYPES.map(t => <option style={{ backgroundColor: "#1a1410" }} key={t} value={t}>{t}</option>)}
                  </select>
                  <span style={{
                    position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)",
                    color: "var(--color-gold)", pointerEvents: "none", fontSize: "12px",
                  }}>▾</span>
                </div>
              </div>
              <div>
                <label style={smallLabelStyle}>Range</label>
                <input name="range" value={skillForm.range} onChange={handleSkillChange}
                  placeholder="e.g. 30ft cone" style={smallInputStyle}
                  onFocus={e => e.currentTarget.style.borderColor = "var(--color-gold)"}
                  onBlur={e => e.currentTarget.style.borderColor = "var(--color-border)"}
                />
              </div>
            </div>
            <div>
              <label style={smallLabelStyle}>Description</label>
              <textarea name="description" value={skillForm.description} onChange={handleSkillChange}
                placeholder="What does this skill do?" rows={2}
                style={{ ...smallInputStyle, resize: "vertical", height: "auto" }}
                onFocus={e => e.currentTarget.style.borderColor = "var(--color-gold)"}
                onBlur={e => e.currentTarget.style.borderColor = "var(--color-border)"}
              />
            </div>
            <div style={{ display: "flex", gap: "12px" }}>
              <button onClick={handleAddSkill} disabled={savingSkill} style={{
                background: "linear-gradient(135deg, var(--color-red), var(--color-red-dark))",
                border: "1px solid var(--color-gold)", color: "var(--color-gold)",
                padding: "10px 20px", fontSize: "11px", letterSpacing: "0.15em",
                textTransform: "uppercase", cursor: "pointer", fontFamily: "inherit",
              }}>{savingSkill ? "Saving..." : "Save Skill"}</button>
              <button onClick={() => { setAddingSkill(false); setSkillForm(emptySkillForm) }} style={{
                background: "transparent", border: "1px solid var(--color-border)",
                color: "var(--color-text-muted)", padding: "10px 20px",
                fontSize: "11px", letterSpacing: "0.15em", textTransform: "uppercase",
                cursor: "pointer", fontFamily: "inherit",
              }}>Cancel</button>
            </div>
          </div>
        )}

        {/* Empty state */}
        {skills.length === 0 && !addingSkill && (
          <div style={{
            textAlign: "center", padding: "40px",
            border: "1px dashed var(--color-border)", color: "var(--color-text-dim)",
            marginBottom: "24px",
          }}>
            <p style={{ letterSpacing: "0.2em", textTransform: "uppercase", fontSize: "12px", margin: 0 }}>
              No skills yet
            </p>
          </div>
        )}

        {/* Skills list */}
        {skills.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "24px" }}>
            {skills.map(skill => {
              const isExpanded = expandedSkill === skill.id
              return (
                <div key={skill.id} style={{
                  border: `1px solid ${isExpanded ? "rgba(201,168,76,0.4)" : "var(--color-border)"}`,
                  transition: "border-color 0.2s",
                }}>
                  <div
                    onClick={() => setExpandedSkill(isExpanded ? null : skill.id)}
                    style={{
                      padding: "14px 18px", display: "flex", alignItems: "center",
                      justifyContent: "space-between", cursor: "pointer",
                      background: isExpanded ? "var(--color-card-hover)" : "var(--color-card)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <span style={{ fontSize: "15px", color: "var(--color-text)" }}>{skill.name}</span>
                      {skill.damage && (
                        <span style={{
                          fontSize: "11px", color: "var(--color-gold)",
                          border: "1px solid rgba(201,168,76,0.3)", padding: "2px 8px",
                        }}>{skill.damage}{skill.damage_type ? ` ${skill.damage_type}` : ''}</span>
                      )}
                      {skill.range && (
                        <span style={{ fontSize: "11px", color: "var(--color-text-dim)" }}>{skill.range}</span>
                      )}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      {skill.cooldown ? (
                        <span style={{ fontSize: "11px", color: "var(--color-text-dim)" }}>
                          {skill.cooldown}r cooldown
                        </span>
                      ) : null}
                      <button
                        onClick={e => { e.stopPropagation(); handleDeleteSkill(skill.id) }}
                        disabled={deletingSkill === skill.id}
                        style={{
                          background: "transparent", border: "none", color: "var(--color-text-dim)",
                          cursor: "pointer", fontSize: "14px", padding: "4px", transition: "color 0.2s",
                        }}
                        onMouseEnter={e => { e.stopPropagation(); e.currentTarget.style.color = "#c06060" }}
                        onMouseLeave={e => e.currentTarget.style.color = "var(--color-text-dim)"}
                      >{deletingSkill === skill.id ? "..." : "✕"}</button>
                      <span style={{
                        color: "var(--color-gold)", fontSize: "16px",
                        transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                        transition: "transform 0.2s", display: "inline-block",
                      }}>▾</span>
                    </div>
                  </div>
                  {isExpanded && skill.description && (
                    <div style={{
                      borderTop: "1px solid var(--color-border)",
                      padding: "14px 18px", background: "rgba(0,0,0,0.2)",
                      color: "var(--color-text-muted)", fontSize: "13px", lineHeight: 1.8,
                    }}>
                      {skill.description}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div style={{ height: "1px", background: "var(--color-border)", margin: "8px 0 32px" }} />

      {error && <p style={{ color: "#c06060", fontSize: "13px", margin: "0 0 20px" }}>⚠ {error}</p>}

      {/* Actions */}
      <div style={{ display: "flex", gap: "16px" }}>
        <button onClick={handleSave} disabled={saving} style={{
          background: "linear-gradient(135deg, var(--color-red), var(--color-red-dark))",
          border: "1px solid var(--color-gold)", color: "var(--color-gold)",
          padding: "14px 36px", fontSize: "12px", letterSpacing: "0.2em",
          textTransform: "uppercase", cursor: saving ? "not-allowed" : "pointer",
          fontFamily: "inherit", opacity: saving ? 0.7 : 1, transition: "all 0.2s",
        }}
          onMouseEnter={e => { if (!saving) e.currentTarget.style.filter = "brightness(1.2)" }}
          onMouseLeave={e => { e.currentTarget.style.filter = "brightness(1)" }}
        >{saving ? "Saving..." : "Save Changes"}</button>
        <button onClick={() => router.back()} style={{
          background: "transparent", border: "1px solid var(--color-border)",
          color: "var(--color-text-muted)", padding: "14px 36px", fontSize: "12px",
          letterSpacing: "0.2em", textTransform: "uppercase", cursor: "pointer", fontFamily: "inherit",
        }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--color-gold)"; e.currentTarget.style.color = "var(--color-gold)"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--color-border)"; e.currentTarget.style.color = "var(--color-text-muted)"; }}
        >Cancel</button>
      </div>
    </div>
  )
}