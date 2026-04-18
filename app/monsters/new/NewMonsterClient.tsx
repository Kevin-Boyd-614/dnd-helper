"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { MonsterSkill, PrivacyType } from '@/lib/types'
import { MONSTER_TYPES, DAMAGE_TYPES } from '@/lib/constants'

const inputStyle = {
  width: "100%", background: "var(--color-card)",
  border: "1px solid var(--color-border)", color: "var(--color-text)",
  padding: "12px 16px", fontSize: "15px", fontFamily: "inherit",
  outline: "none", boxSizing: "border-box" as const, transition: "border-color 0.2s",
  appearance: "none" as const, height: "47px",
}

const smallInputStyle = { ...inputStyle, padding: "10px 14px", fontSize: "14px", height: "43px" }

const labelStyle = {
  display: "block" as const, fontSize: "11px", letterSpacing: "0.25em",
  textTransform: "uppercase" as const, color: "var(--color-text-dim)", marginBottom: "8px",
}

const smallLabelStyle = { ...labelStyle, fontSize: "10px", marginBottom: "6px" }

const emptySkillForm = { name: '', description: '', damage: '', damage_type: '', range: '', cooldown: '' }

type PendingSkill = Omit<MonsterSkill, 'id' | 'monster_id'>

export default function NewMonsterClient({ userId }: { userId: string }) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', type: '', hp: '', ac: '', speed: '', notes: '', privacy: PrivacyType.Public })
  const [skills, setSkills] = useState<PendingSkill[]>([])
  const [addingSkill, setAddingSkill] = useState(false)
  const [skillForm, setSkillForm] = useState(emptySkillForm)
  const [expandedSkill, setExpandedSkill] = useState<number | null>(null)

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function handleSkillChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setSkillForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function handleAddSkill() {
    if (!skillForm.name.trim()) return
    setSkills(prev => [...prev, {
      name: skillForm.name.trim(),
      description: skillForm.description.trim() || undefined,
      damage: skillForm.damage.trim() || undefined,
      damage_type: skillForm.damage_type || undefined,
      range: skillForm.range.trim() || undefined,
      cooldown: skillForm.cooldown ? parseInt(skillForm.cooldown) : undefined,
    }])
    setSkillForm(emptySkillForm)
    setAddingSkill(false)
  }

  function handleRemoveSkill(index: number) {
    setSkills(prev => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit() {
    if (!form.name.trim()) { setError('Monster name is required.'); return }
    setSaving(true)
    setError(null)

    const { data: monster, error: monsterError } = await supabase
      .from('monsters')
      .insert({
        name: form.name.trim(),
        type: form.type || null,
        hp: form.hp ? parseInt(form.hp) : null,
        ac: form.ac ? parseInt(form.ac) : null,
        speed: form.speed.trim() || null,
        notes: form.notes.trim() || null,
        privacy: form.privacy,
        user_id: userId,
      })
      .select()
      .single()

    if (monsterError || !monster) {
      setError(monsterError?.message ?? 'Failed to save monster.')
      setSaving(false)
      return
    }

    if (skills.length > 0) {
      const { error: skillsError } = await supabase
        .from('monster_skills')
        .insert(skills.map(s => ({ ...s, monster_id: monster.id })))
      if (skillsError) { setError(skillsError.message); setSaving(false); return }
    }

    router.push(`/monsters/${monster.id}`)
  }

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto", padding: "48px 40px 80px" }}>
      <div style={{ marginBottom: "48px" }}>
        <button onClick={() => router.back()} style={{
          background: "transparent", border: "none", color: "var(--color-text-dim)",
          cursor: "pointer", fontFamily: "inherit", fontSize: "13px",
          letterSpacing: "0.1em", padding: 0, marginBottom: "24px", display: "block",
        }}
          onMouseEnter={e => e.currentTarget.style.color = "var(--color-gold)"}
          onMouseLeave={e => e.currentTarget.style.color = "var(--color-text-dim)"}
        >← Back</button>
        <p style={{ fontSize: "11px", letterSpacing: "0.4em", textTransform: "uppercase", color: "var(--color-gold-dark)", margin: "0 0 8px" }}>
          ✦ Add to Bestiary
        </p>
        <h1 style={{ fontSize: "36px", fontWeight: "normal", color: "var(--color-text)", margin: 0 }}>New Monster</h1>
      </div>

      <div style={{ height: "1px", background: "var(--color-border)", marginBottom: "40px" }} />

      <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
        <div>
          <label style={labelStyle}>Monster Name *</label>
          <input name="name" value={form.name} onChange={handleChange} placeholder="e.g. Ancient Red Dragon" style={inputStyle}
            onFocus={e => e.currentTarget.style.borderColor = "var(--color-gold)"}
            onBlur={e => e.currentTarget.style.borderColor = "var(--color-border)"} />
        </div>
        <div>
          <label style={labelStyle}>Type</label>
          <select name="type" value={form.type} onChange={handleChange} style={{ ...inputStyle, cursor: "pointer", color: "var(--color-text)", background: "var(--color-card)" }}>
            {MONSTER_TYPES.map(t => <option style={{ backgroundColor: "#1a1410" }} key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
          <div>
            <label style={labelStyle}>Hit Points</label>
            <input name="hp" type="number" min="1" value={form.hp} onChange={handleChange} placeholder="e.g. 120" style={inputStyle}
              onFocus={e => e.currentTarget.style.borderColor = "var(--color-gold)"}
              onBlur={e => e.currentTarget.style.borderColor = "var(--color-border)"} />
          </div>
          <div>
            <label style={labelStyle}>Armour Class</label>
            <input name="ac" type="number" min="1" value={form.ac} onChange={handleChange} placeholder="e.g. 16" style={inputStyle}
              onFocus={e => e.currentTarget.style.borderColor = "var(--color-gold)"}
              onBlur={e => e.currentTarget.style.borderColor = "var(--color-border)"} />
          </div>
          <div>
            <label style={labelStyle}>Speed</label>
            <input name="speed" value={form.speed} onChange={handleChange} placeholder="e.g. 30ft, fly 60ft" style={inputStyle}
              onFocus={e => e.currentTarget.style.borderColor = "var(--color-gold)"}
              onBlur={e => e.currentTarget.style.borderColor = "var(--color-border)"} />
          </div>
        </div>
        <div>
          <label style={labelStyle}>Notes</label>
          <textarea name="notes" value={form.notes} onChange={handleChange} placeholder="Special abilities, tactics, lore..."
            rows={3} style={{ ...inputStyle, resize: "vertical", height: "auto", minHeight: "80px" }}
            onFocus={e => e.currentTarget.style.borderColor = "var(--color-gold)"}
            onBlur={e => e.currentTarget.style.borderColor = "var(--color-border)"} />
        </div>
        <div>
          <label style={labelStyle}>Visibility</label>
          <select
            value={form.privacy}
            onChange={e => setForm(prev => ({ ...prev, privacy: parseInt(e.target.value) as PrivacyType }))}
            style={{ ...inputStyle, cursor: "pointer", color: "var(--color-text)", background: "var(--color-card)" }}
          >
            <option style={{ backgroundColor: "#1a1410" }} value={PrivacyType.Public}>Public</option>
            <option style={{ backgroundColor: "#1a1410" }} value={PrivacyType.Private}>Private</option>
          </select>
        </div>
      </div>

      <div style={{ height: "1px", background: "var(--color-border)", margin: "40px 0" }} />

      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
          <h2 style={{ fontSize: "12px", letterSpacing: "0.35em", textTransform: "uppercase", color: "var(--color-text-dim)", margin: 0 }}>
            ✦ Skills & Abilities ({skills.length})
          </h2>
          {!addingSkill && (
            <button onClick={() => setAddingSkill(true)} style={{
              background: "transparent", border: "1px solid var(--color-border)", color: "var(--color-text-muted)",
              padding: "6px 16px", fontSize: "11px", letterSpacing: "0.15em", textTransform: "uppercase",
              cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s",
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--color-gold)"; e.currentTarget.style.color = "var(--color-gold)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--color-border)"; e.currentTarget.style.color = "var(--color-text-muted)"; }}
            >+ Add Skill</button>
          )}
        </div>

        {addingSkill && (
          <div style={{ border: "1px solid var(--color-gold)", padding: "20px", marginBottom: "16px", display: "flex", flexDirection: "column", gap: "14px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "14px" }}>
              <div>
                <label style={smallLabelStyle}>Skill Name *</label>
                <input name="name" value={skillForm.name} onChange={handleSkillChange} placeholder="e.g. Fire Breath" autoFocus style={smallInputStyle}
                  onFocus={e => e.currentTarget.style.borderColor = "var(--color-gold)"}
                  onBlur={e => e.currentTarget.style.borderColor = "var(--color-border)"} />
              </div>
              <div>
                <label style={smallLabelStyle}>Cooldown (rounds)</label>
                <input name="cooldown" type="number" min="0" value={skillForm.cooldown} onChange={handleSkillChange} placeholder="e.g. 3" style={smallInputStyle}
                  onFocus={e => e.currentTarget.style.borderColor = "var(--color-gold)"}
                  onBlur={e => e.currentTarget.style.borderColor = "var(--color-border)"} />
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "14px" }}>
              <div>
                <label style={smallLabelStyle}>Damage</label>
                <input name="damage" value={skillForm.damage} onChange={handleSkillChange} placeholder="e.g. 4d6" style={smallInputStyle}
                  onFocus={e => e.currentTarget.style.borderColor = "var(--color-gold)"}
                  onBlur={e => e.currentTarget.style.borderColor = "var(--color-border)"} />
              </div>
              <div>
                <label style={smallLabelStyle}>Damage Type</label>
                <select name="damage_type" value={skillForm.damage_type} onChange={handleSkillChange}
                  style={{ ...smallInputStyle, cursor: "pointer", color: "var(--color-text-dim)" }}>
                  {DAMAGE_TYPES.map(t => <option style={{ backgroundColor: "#1a1410" }} key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label style={smallLabelStyle}>Range</label>
                <input name="range" value={skillForm.range} onChange={handleSkillChange} placeholder="e.g. 30ft cone" style={smallInputStyle}
                  onFocus={e => e.currentTarget.style.borderColor = "var(--color-gold)"}
                  onBlur={e => e.currentTarget.style.borderColor = "var(--color-border)"} />
              </div>
            </div>
            <div>
              <label style={smallLabelStyle}>Description</label>
              <textarea name="description" value={skillForm.description} onChange={handleSkillChange} placeholder="What does this skill do?" rows={2}
                style={{ ...smallInputStyle, resize: "vertical" }}
                onFocus={e => e.currentTarget.style.borderColor = "var(--color-gold)"}
                onBlur={e => e.currentTarget.style.borderColor = "var(--color-border)"} />
            </div>
            <div style={{ display: "flex", gap: "12px" }}>
              <button onClick={handleAddSkill} style={{
                background: "linear-gradient(135deg, var(--color-red), var(--color-red-dark))",
                border: "1px solid var(--color-gold)", color: "var(--color-gold)",
                padding: "10px 20px", fontSize: "11px", letterSpacing: "0.15em",
                textTransform: "uppercase", cursor: "pointer", fontFamily: "inherit",
              }}>Add Skill</button>
              <button onClick={() => { setAddingSkill(false); setSkillForm(emptySkillForm) }} style={{
                background: "transparent", border: "1px solid var(--color-border)", color: "var(--color-text-muted)",
                padding: "10px 20px", fontSize: "11px", letterSpacing: "0.15em",
                textTransform: "uppercase", cursor: "pointer", fontFamily: "inherit",
              }}>Cancel</button>
            </div>
          </div>
        )}

        {skills.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "24px" }}>
            {skills.map((skill, index) => {
              const isExpanded = expandedSkill === index
              return (
                <div key={index} style={{ border: `1px solid ${isExpanded ? "rgba(201,168,76,0.4)" : "var(--color-border)"}`, transition: "border-color 0.2s" }}>
                  <div onClick={() => setExpandedSkill(isExpanded ? null : index)} style={{
                    padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between",
                    cursor: "pointer", background: isExpanded ? "var(--color-card-hover)" : "var(--color-card)",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <span style={{ fontSize: "15px", color: "var(--color-text)" }}>{skill.name}</span>
                      {skill.damage && (
                        <span style={{ fontSize: "11px", color: "var(--color-gold)", border: "1px solid rgba(201,168,76,0.3)", padding: "2px 8px" }}>
                          {skill.damage}{skill.damage_type ? ` ${skill.damage_type}` : ''}
                        </span>
                      )}
                      {skill.range && <span style={{ fontSize: "11px", color: "var(--color-text-dim)" }}>{skill.range}</span>}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      {skill.cooldown ? <span style={{ fontSize: "11px", color: "var(--color-text-dim)" }}>{skill.cooldown}r cooldown</span> : null}
                      <button onClick={e => { e.stopPropagation(); handleRemoveSkill(index) }} style={{
                        background: "transparent", border: "none", color: "var(--color-text-dim)",
                        cursor: "pointer", fontSize: "14px", padding: "4px", transition: "color 0.2s",
                      }}
                        onMouseEnter={e => { e.stopPropagation(); e.currentTarget.style.color = "#c06060" }}
                        onMouseLeave={e => e.currentTarget.style.color = "var(--color-text-dim)"}
                      >✕</button>
                      <span style={{ color: "var(--color-gold)", fontSize: "16px", transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s", display: "inline-block" }}>▾</span>
                    </div>
                  </div>
                  {isExpanded && skill.description && (
                    <div style={{ borderTop: "1px solid var(--color-border)", padding: "14px 18px", background: "rgba(0,0,0,0.2)", color: "var(--color-text-muted)", fontSize: "13px", lineHeight: 1.8 }}>
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

      <div style={{ display: "flex", gap: "16px" }}>
        <button onClick={handleSubmit} disabled={saving} style={{
          background: "linear-gradient(135deg, var(--color-red), var(--color-red-dark))",
          border: "1px solid var(--color-gold)", color: "var(--color-gold)",
          padding: "14px 36px", fontSize: "12px", letterSpacing: "0.2em",
          textTransform: "uppercase", cursor: saving ? "not-allowed" : "pointer",
          fontFamily: "inherit", opacity: saving ? 0.7 : 1, transition: "all 0.2s",
        }}
          onMouseEnter={e => { if (!saving) e.currentTarget.style.filter = "brightness(1.2)" }}
          onMouseLeave={e => { e.currentTarget.style.filter = "brightness(1)" }}
        >{saving ? "Saving..." : `Add Monster${skills.length > 0 ? ` & ${skills.length} Skill${skills.length > 1 ? 's' : ''}` : ''}`}</button>
        <button onClick={() => router.back()} style={{
          background: "transparent", border: "1px solid var(--color-border)", color: "var(--color-text-muted)",
          padding: "14px 36px", fontSize: "12px", letterSpacing: "0.2em",
          textTransform: "uppercase", cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s",
        }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--color-gold)"; e.currentTarget.style.color = "var(--color-gold)"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--color-border)"; e.currentTarget.style.color = "var(--color-text-muted)"; }}
        >Cancel</button>
      </div>
    </div>
  )
}
