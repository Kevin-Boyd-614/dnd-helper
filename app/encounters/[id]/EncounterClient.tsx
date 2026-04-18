"use client"

import { Encounter, EncounterMonster, EncounterMonsterAction, Monster, MonsterSkill } from '@/lib/types'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'

interface Props {
  encounter: Encounter
  dungeonName: string
  campaignId: string | null
  encounterMonsters: EncounterMonster[]
  allMonsters: Monster[]
  initialActions: EncounterMonsterAction[]
  monsterSkills: Record<string, MonsterSkill[]>
}

function crToNum(cr: string | undefined): number {
  if (!cr) return -1
  if (cr === '1/8') return 0.125
  if (cr === '1/4') return 0.25
  if (cr === '1/2') return 0.5
  return parseFloat(cr) || 0
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

const selectStyle = {
  background: "var(--color-card)",
  border: "1px solid var(--color-border)",
  padding: "10px 16px",
  fontSize: "13px",
  fontFamily: "inherit",
  outline: "none",
  cursor: "pointer",
  letterSpacing: "0.05em",
}

export default function EncounterClient({
  encounter,
  dungeonName,
  campaignId,
  encounterMonsters: initialEncounterMonsters,
  allMonsters,
  initialActions,
  monsterSkills,
}: Props) {
  const router = useRouter()

  const [status, setStatus] = useState<'planned' | 'active' | 'completed'>(encounter.status)
  const [name, setName] = useState(encounter.name)
  const [notes, setNotes] = useState(encounter.notes ?? '')
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const [encounterMonsters, setEncounterMonsters] = useState(initialEncounterMonsters)
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [crFilter, setCrFilter] = useState('')
  const [initiativeMode, setInitiativeMode] = useState(false)
  const [initiatives, setInitiatives] = useState<Record<string, string>>({})
  const [hpValues, setHpValues] = useState<Record<string, number>>(
    Object.fromEntries(initialEncounterMonsters.map(em => [em.id, em.current_hp]))
  )

  const [actions, setActions] = useState<EncounterMonsterAction[]>(initialActions)
  const [actionInputs, setActionInputs] = useState<Record<string, string>>({})
  const [currentTurn, setCurrentTurn] = useState(() =>
    initialActions.length === 0 ? 1 : Math.max(...initialActions.map(a => a.turn)) + 1
  )
  const [savingActions, setSavingActions] = useState(false)
  const [showLog, setShowLog] = useState(true)
  const [skillCooldowns, setSkillCooldowns] = useState<Record<string, number>>({})

  const availableTypes = [...new Set(allMonsters.map(m => m.type).filter(Boolean) as string[])].sort()
  const availableCRs = [...new Set(allMonsters.map(m => m.cr).filter(Boolean) as string[])].sort((a, b) => crToNum(a) - crToNum(b))

  const filteredMonsters = allMonsters.filter(m => {
    const matchesSearch = !searchQuery.trim() || m.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = !typeFilter || m.type === typeFilter
    const matchesCr = !crFilter || m.cr === crFilter
    return matchesSearch && matchesType && matchesCr
  })

  async function handleAddMonster(monster: Monster) {
    const { data } = await supabase
      .from('encounter_monsters')
      .insert({ encounter_id: encounter.id, monster_id: monster.id, current_hp: monster.hp ?? 0, initiative: null })
      .select('*, monster:monsters(*)')
      .single()
    if (data) {
      setEncounterMonsters(prev => [...prev, data as unknown as EncounterMonster])
      setHpValues(prev => ({ ...prev, [(data as { id: string }).id]: (data as { current_hp: number }).current_hp }))
    }
    setSearchQuery('')
  }

  async function handleRemoveMonster(id: string) {
    await supabase.from('encounter_monsters').delete().eq('id', id)
    setEncounterMonsters(prev => prev.filter(em => em.id !== id))
    setHpValues(prev => { const next = { ...prev }; delete next[id]; return next })
  }

  async function handleBeginCombat() {
    for (const em of encounterMonsters) {
      const init = parseInt(initiatives[em.id] ?? '') || 0
      await supabase.from('encounter_monsters').update({ initiative: init }).eq('id', em.id)
    }
    await supabase.from('encounters').update({ status: 'active' }).eq('id', encounter.id)
    setEncounterMonsters(prev =>
      prev.map(em => ({ ...em, initiative: parseInt(initiatives[em.id] ?? '') || 0 }))
    )
    setStatus('active')
    setInitiativeMode(false)
  }

  async function handleHpChange(id: string, newHp: number) {
    const clamped = Math.max(0, newHp)
    setHpValues(prev => ({ ...prev, [id]: clamped }))
    await supabase.from('encounter_monsters').update({ current_hp: clamped }).eq('id', id)
  }

  async function handleCompleteEncounter() {
    await supabase.from('encounters').update({ status: 'completed' }).eq('id', encounter.id)
    setStatus('completed')
  }

  async function handleSave() {
    setSaving(true)
    await supabase.from('encounters').update({ name: name.trim(), notes: notes.trim() || null }).eq('id', encounter.id)
    setSaving(false)
    setEditing(false)
  }

  async function handleDelete() {
    setDeleting(true)
    await supabase.from('encounters').delete().eq('id', encounter.id)
    router.push(campaignId ? `/campaigns/${campaignId}` : '/campaigns')
  }

  async function handleNextRound() {
    const toSave = Object.entries(actionInputs).filter(([, action]) => action.trim())
    if (toSave.length > 0) {
      setSavingActions(true)
      const rows = toSave.map(([encounter_monster_id, action]) => ({
        encounter_monster_id,
        encounter_id: encounter.id,
        action: action.trim(),
        turn: currentTurn,
      }))
      const { data } = await supabase.from('encounter_monster_actions').insert(rows).select()
      if (data) setActions(prev => [...prev, ...(data as EncounterMonsterAction[])])
      setSavingActions(false)
    }
    setActionInputs({})
    setCurrentTurn(prev => prev + 1)
  }

  function handleUseSkill(em: EncounterMonster, skill: MonsterSkill) {
    const key = `${em.id}_${skill.id}`
    setSkillCooldowns(prev => ({ ...prev, [key]: currentTurn }))
    setActionInputs(prev => ({
      ...prev,
      [em.id]: prev[em.id]?.trim() ? `${prev[em.id]}, ${skill.name}` : skill.name,
    }))
  }

  function getSkillCooldownRemaining(emId: string, skill: MonsterSkill): number {
    if (!skill.cooldown) return 0
    const turnUsed = skillCooldowns[`${emId}_${skill.id}`]
    if (turnUsed === undefined) return 0
    return Math.max(0, skill.cooldown - (currentTurn - turnUsed))
  }

  const sortedByInit = [...encounterMonsters].sort((a, b) => (b.initiative ?? 0) - (a.initiative ?? 0))

  const statusColor = status === 'active' ? "#4a9eff" : status === 'completed' ? "var(--color-gold)" : "var(--color-text-dim)"
  const statusBorder = status === 'active' ? "rgba(74,158,255,0.4)" : status === 'completed' ? "rgba(201,168,76,0.4)" : "var(--color-border)"
  const statusBg = status === 'active' ? "rgba(74,158,255,0.08)" : status === 'completed' ? "rgba(201,168,76,0.08)" : "transparent"

  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "48px 40px 80px" }}>

      {/* Back */}
      <button
        onClick={() => router.push(campaignId ? `/campaigns/${campaignId}` : '/campaigns')}
        style={{
          background: "transparent", border: "none", color: "var(--color-text-dim)",
          cursor: "pointer", fontFamily: "inherit", fontSize: "13px",
          letterSpacing: "0.1em", padding: 0, marginBottom: "32px", display: "block",
        }}
        onMouseEnter={e => e.currentTarget.style.color = "var(--color-gold)"}
        onMouseLeave={e => e.currentTarget.style.color = "var(--color-text-dim)"}
      >
        ← Back to Campaign
      </button>

      {/* Breadcrumb */}
      <p style={{ fontSize: "11px", letterSpacing: "0.4em", textTransform: "uppercase", color: "var(--color-gold-dark)", margin: "0 0 8px" }}>
        ⚔ {dungeonName || 'Dungeon'}
      </p>

      {/* Header */}
      <div style={{ marginBottom: "32px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px", marginBottom: "16px" }}>
          {editing ? (
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              style={{ ...inputStyle, fontSize: "36px", padding: "12px 16px", flex: 1 }}
              onFocus={e => e.currentTarget.style.borderColor = "var(--color-gold)"}
              onBlur={e => e.currentTarget.style.borderColor = "var(--color-border)"}
            />
          ) : (
            <h1 style={{ fontSize: "42px", fontWeight: "normal", color: "var(--color-text)", margin: 0 }}>{name}</h1>
          )}
          {!editing && status === 'planned' && (
            <button onClick={() => setEditing(true)} style={{
              background: "transparent", border: "1px solid var(--color-border)", color: "var(--color-text-muted)",
              padding: "8px 20px", fontSize: "11px", letterSpacing: "0.2em", textTransform: "uppercase",
              cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s", whiteSpace: "nowrap" as const, marginTop: "8px",
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--color-gold)"; e.currentTarget.style.color = "var(--color-gold)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--color-border)"; e.currentTarget.style.color = "var(--color-text-muted)"; }}
            >✎ Edit</button>
          )}
        </div>

        <span style={{
          fontSize: "10px", letterSpacing: "0.25em", textTransform: "uppercase",
          color: statusColor, padding: "3px 10px", border: `1px solid ${statusBorder}`, background: statusBg,
        }}>
          {status === 'active' ? '⚡ Active' : status}
        </span>
      </div>

      <div style={{ height: "1px", background: "var(--color-border)", marginBottom: "32px" }} />

      {/* ── PLANNED: edit + monster management ── */}
      {status === 'planned' && !initiativeMode && (
        <>
          {/* Edit form */}
          {editing && (
            <div style={{ marginBottom: "32px" }}>
              <label style={labelStyle}>Notes</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={5}
                placeholder="Terrain, objectives, DM notes..."
                style={{ ...inputStyle, resize: "vertical", lineHeight: 1.7, marginBottom: "16px" }}
                onFocus={e => e.currentTarget.style.borderColor = "var(--color-gold)"}
                onBlur={e => e.currentTarget.style.borderColor = "var(--color-border)"}
              />
              <div style={{ display: "flex", gap: "12px" }}>
                <button onClick={handleSave} disabled={saving} style={{
                  background: "linear-gradient(135deg, var(--color-red), var(--color-red-dark))",
                  border: "1px solid var(--color-gold)", color: "var(--color-gold)",
                  padding: "10px 24px", fontSize: "11px", letterSpacing: "0.2em",
                  textTransform: "uppercase", cursor: "pointer", fontFamily: "inherit",
                }}>{saving ? "Saving..." : "Save Changes"}</button>
                <button onClick={() => { setEditing(false); setName(encounter.name); setNotes(encounter.notes ?? ''); }} style={{
                  background: "transparent", border: "1px solid var(--color-border)", color: "var(--color-text-muted)",
                  padding: "10px 24px", fontSize: "11px", letterSpacing: "0.2em", textTransform: "uppercase",
                  cursor: "pointer", fontFamily: "inherit",
                }}>Cancel</button>
              </div>
            </div>
          )}

          {/* Notes read-only */}
          {!editing && notes && (
            <div style={{ marginBottom: "32px" }}>
              <label style={labelStyle}>Notes</label>
              <p style={{ color: "var(--color-text-muted)", fontSize: "15px", lineHeight: 1.8, margin: 0, whiteSpace: "pre-wrap" }}>{notes}</p>
            </div>
          )}

          {/* Split screen: lineup left, browser right */}
          <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: "20px", alignItems: "start" }}>

            {/* LEFT: encounter lineup */}
            <div style={{ border: "1px solid var(--color-border)", display: "flex", flexDirection: "column" }}>
              <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--color-border)", background: "var(--color-card)" }}>
                <span style={{ fontSize: "11px", letterSpacing: "0.3em", textTransform: "uppercase", color: "var(--color-text-dim)" }}>
                  Encounter ({encounterMonsters.length})
                </span>
              </div>

              <div style={{ minHeight: "160px", maxHeight: "480px", overflowY: "auto" }}>
                {encounterMonsters.length === 0 ? (
                  <div style={{ padding: "32px 16px", textAlign: "center", color: "var(--color-text-dim)", fontSize: "12px", letterSpacing: "0.15em" }}>
                    Add monsters →
                  </div>
                ) : (
                  encounterMonsters.map((em, i) => (
                    <div key={em.id} style={{
                      padding: "10px 14px", borderBottom: "1px solid var(--color-border)",
                      display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px",
                      background: i % 2 === 0 ? "var(--color-card)" : "transparent",
                    }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: "14px", color: "var(--color-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {em.monster?.name}
                        </div>
                        {em.monster?.hp != null && (
                          <div style={{ fontSize: "11px", color: "var(--color-text-dim)" }}>HP {em.monster.hp}</div>
                        )}
                      </div>
                      <button
                        onClick={() => handleRemoveMonster(em.id)}
                        style={{ background: "transparent", border: "none", color: "var(--color-text-dim)", cursor: "pointer", fontSize: "18px", lineHeight: 1, padding: "0 2px", flexShrink: 0 }}
                        onMouseEnter={e => e.currentTarget.style.color = "#c04040"}
                        onMouseLeave={e => e.currentTarget.style.color = "var(--color-text-dim)"}
                      >×</button>
                    </div>
                  ))
                )}
              </div>

              {encounterMonsters.length > 0 && (
                <div style={{ padding: "14px 16px", borderTop: "1px solid var(--color-border)", background: "var(--color-card)" }}>
                  <button
                    onClick={() => setInitiativeMode(true)}
                    style={{
                      width: "100%", background: "linear-gradient(135deg, var(--color-red), var(--color-red-dark))",
                      border: "1px solid var(--color-gold)", color: "var(--color-gold)",
                      padding: "10px", fontSize: "11px", letterSpacing: "0.2em",
                      textTransform: "uppercase", cursor: "pointer", fontFamily: "inherit",
                    }}
                  >Start Encounter →</button>
                </div>
              )}
            </div>

            {/* RIGHT: monster browser */}
            <div>
              {/* Filters */}
              <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
                <input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search monsters..."
                  style={{ ...inputStyle, flex: 1 }}
                  onFocus={e => e.currentTarget.style.borderColor = "var(--color-gold)"}
                  onBlur={e => e.currentTarget.style.borderColor = "var(--color-border)"}
                />
                <select
                  value={typeFilter}
                  onChange={e => setTypeFilter(e.target.value)}
                  style={{ ...selectStyle, color: "var(--color-text-dim)" }}
                >
                  <option value="">All Types</option>
                  {availableTypes.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                {availableCRs.length > 0 && (
                  <select
                    value={crFilter}
                    onChange={e => setCrFilter(e.target.value)}
                    style={{ ...selectStyle, color: "var(--color-text-dim)" }}
                  >
                    <option value="">All CR</option>
                    {availableCRs.map(cr => <option key={cr} value={cr}>CR {cr}</option>)}
                  </select>
                )}
              </div>

              {/* Table header */}
              <div style={{
                display: "grid", gridTemplateColumns: "1fr 100px 52px 52px 52px 36px",
                padding: "6px 12px", background: "var(--color-card)", borderBottom: "1px solid var(--color-border)",
                border: "1px solid var(--color-border)",
                fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--color-text-dim)",
              }}>
                <span>Name</span><span>Type</span><span>HP</span><span>AC</span><span>CR</span><span />
              </div>

              {/* Table body */}
              <div style={{ maxHeight: "480px", overflowY: "auto", border: "1px solid var(--color-border)", borderTop: "none" }}>
                {filteredMonsters.length === 0 ? (
                  <div style={{ padding: "32px", textAlign: "center", color: "var(--color-text-dim)", fontSize: "12px", letterSpacing: "0.15em" }}>
                    No monsters match
                  </div>
                ) : (
                  filteredMonsters.map((monster, i) => (
                    <div
                      key={monster.id}
                      style={{
                        display: "grid", gridTemplateColumns: "1fr 100px 52px 52px 52px 36px",
                        alignItems: "center", padding: "9px 12px",
                        borderBottom: "1px solid var(--color-border)",
                        background: i % 2 === 0 ? "var(--color-card)" : "transparent",
                        transition: "background 0.15s",
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = "var(--color-card-hover)"}
                      onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? "var(--color-card)" : "transparent"}
                    >
                      <span style={{ fontSize: "14px", color: "var(--color-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{monster.name}</span>
                      <span style={{ fontSize: "12px", color: "var(--color-text-dim)" }}>{monster.type ?? '—'}</span>
                      <span style={{ fontSize: "12px", color: "var(--color-text-dim)" }}>{monster.hp ?? '—'}</span>
                      <span style={{ fontSize: "12px", color: "var(--color-text-dim)" }}>{monster.ac ?? '—'}</span>
                      <span style={{ fontSize: "12px", color: "var(--color-text-dim)" }}>{monster.cr ?? '—'}</span>
                      <button
                        onClick={() => handleAddMonster(monster)}
                        style={{
                          background: "transparent", border: "1px solid var(--color-border)", color: "var(--color-gold)",
                          width: "28px", height: "28px", cursor: "pointer", fontFamily: "inherit", fontSize: "16px",
                          display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s",
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = "rgba(201,168,76,0.15)"; e.currentTarget.style.borderColor = "var(--color-gold)"; }}
                        onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "var(--color-border)"; }}
                      >+</button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── INITIATIVE SETUP ── */}
      {status === 'planned' && initiativeMode && (
        <div>
          <h2 style={{ fontSize: "12px", letterSpacing: "0.35em", textTransform: "uppercase", color: "var(--color-text-dim)", margin: "0 0 24px" }}>
            ✦ Roll Initiative
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "32px" }}>
            {encounterMonsters.map(em => (
              <div key={em.id} style={{
                display: "flex", alignItems: "center", gap: "16px",
                padding: "12px 16px", border: "1px solid var(--color-border)", background: "var(--color-card)",
              }}>
                <span style={{ flex: 1, fontSize: "15px", color: "var(--color-text)" }}>{em.monster?.name}</span>
                <label style={{ ...labelStyle, marginBottom: 0, whiteSpace: "nowrap" }}>Initiative</label>
                <input
                  type="number"
                  placeholder="0"
                  value={initiatives[em.id] ?? ''}
                  onChange={e => setInitiatives(prev => ({ ...prev, [em.id]: e.target.value }))}
                  style={{ ...inputStyle, width: "80px", textAlign: "center" }}
                  onFocus={e => e.currentTarget.style.borderColor = "var(--color-gold)"}
                  onBlur={e => e.currentTarget.style.borderColor = "var(--color-border)"}
                />
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: "12px" }}>
            <button onClick={handleBeginCombat} style={{
              background: "linear-gradient(135deg, var(--color-red), var(--color-red-dark))",
              border: "1px solid var(--color-gold)", color: "var(--color-gold)",
              padding: "12px 28px", fontSize: "12px", letterSpacing: "0.25em",
              textTransform: "uppercase", cursor: "pointer", fontFamily: "inherit",
            }}>⚡ Begin Combat</button>
            <button onClick={() => setInitiativeMode(false)} style={{
              background: "transparent", border: "1px solid var(--color-border)", color: "var(--color-text-muted)",
              padding: "12px 24px", fontSize: "11px", letterSpacing: "0.2em", textTransform: "uppercase",
              cursor: "pointer", fontFamily: "inherit",
            }}>Cancel</button>
          </div>
        </div>
      )}

      {/* ── ACTIVE: COMBAT TRACKER ── */}
      {status === 'active' && (
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
            <h2 style={{ fontSize: "12px", letterSpacing: "0.35em", textTransform: "uppercase", color: "var(--color-text-dim)", margin: 0 }}>
              ✦ Combat Tracker
            </h2>
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <span style={{ fontSize: "12px", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--color-gold)", border: "1px solid rgba(201,168,76,0.4)", padding: "4px 12px" }}>
                Round {currentTurn}
              </span>
              <button onClick={handleNextRound} disabled={savingActions} style={{
                background: "transparent", border: "1px solid var(--color-border)", color: "var(--color-text-muted)",
                padding: "6px 16px", fontSize: "11px", letterSpacing: "0.15em", textTransform: "uppercase",
                cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s",
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--color-gold)"; e.currentTarget.style.color = "var(--color-gold)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--color-border)"; e.currentTarget.style.color = "var(--color-text-muted)"; }}
              >{savingActions ? "Saving..." : "Next Round →"}</button>
            </div>
          </div>

          {/* Column headers */}
          <div style={{
            display: "grid", gridTemplateColumns: "60px 1fr 200px 60px",
            padding: "6px 16px", marginBottom: "4px",
            fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--color-text-dim)",
          }}>
            <span>Init</span>
            <span>Monster</span>
            <span style={{ textAlign: "center" }}>HP</span>
            <span style={{ textAlign: "center" }}>AC</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginBottom: "32px" }}>
            {sortedByInit.map(em => {
              const hp = hpValues[em.id] ?? 0
              const maxHp = em.monster?.hp ?? 0
              const defeated = hp <= 0
              const hpPct = maxHp > 0 ? Math.max(0, hp / maxHp) : 0
              const hpColor = hpPct > 0.5 ? "#4a9eff" : hpPct > 0.25 ? "#f0a030" : "#c04040"

              return (
                <div key={em.id} style={{
                  border: `1px solid ${defeated ? "rgba(192,64,64,0.3)" : "var(--color-border)"}`,
                  background: defeated ? "rgba(192,64,64,0.05)" : "var(--color-card)",
                  opacity: defeated ? 0.6 : 1,
                  transition: "all 0.2s",
                }}>
                  <div style={{
                    display: "grid", gridTemplateColumns: "60px 1fr 200px 60px",
                    alignItems: "center", padding: "14px 16px",
                  }}>
                    {/* Initiative */}
                    <span style={{ fontSize: "18px", fontWeight: "bold", color: "var(--color-gold-dark)" }}>
                      {em.initiative ?? 0}
                    </span>

                    {/* Name */}
                    <div>
                      <span style={{
                        fontSize: "15px", color: "var(--color-text)",
                        textDecoration: defeated ? "line-through" : "none",
                      }}>{em.monster?.name}</span>
                      {em.monster?.type && (
                        <span style={{ display: "block", fontSize: "11px", color: "var(--color-text-dim)", letterSpacing: "0.1em", marginTop: "2px" }}>
                          {em.monster.type}
                        </span>
                      )}
                      {defeated && (
                        <span style={{ fontSize: "10px", letterSpacing: "0.15em", textTransform: "uppercase", color: "#c04040" }}>
                          Defeated
                        </span>
                      )}
                    </div>

                    {/* HP controls */}
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <button
                          onClick={() => handleHpChange(em.id, hp - 1)}
                          disabled={defeated}
                          style={{
                            width: "28px", height: "28px", background: "var(--color-card-hover)",
                            border: "1px solid var(--color-border)", color: "var(--color-text)",
                            cursor: "pointer", fontFamily: "inherit", fontSize: "16px", lineHeight: 1,
                            display: "flex", alignItems: "center", justifyContent: "center",
                          }}
                        >−</button>
                        <input
                          type="number"
                          value={hp}
                          onChange={e => setHpValues(prev => ({ ...prev, [em.id]: Math.max(0, parseInt(e.target.value) || 0) }))}
                          onBlur={() => handleHpChange(em.id, hpValues[em.id] ?? 0)}
                          style={{
                            ...inputStyle, width: "54px", textAlign: "center",
                            padding: "4px 6px", fontSize: "16px", fontWeight: "bold",
                            color: defeated ? "#c04040" : hpColor,
                            borderColor: defeated ? "rgba(192,64,64,0.4)" : "var(--color-border)",
                          }}
                          onFocus={e => e.currentTarget.style.borderColor = "var(--color-gold)"}
                        />
                        <button
                          onClick={() => handleHpChange(em.id, hp + 1)}
                          style={{
                            width: "28px", height: "28px", background: "var(--color-card-hover)",
                            border: "1px solid var(--color-border)", color: "var(--color-text)",
                            cursor: "pointer", fontFamily: "inherit", fontSize: "16px", lineHeight: 1,
                            display: "flex", alignItems: "center", justifyContent: "center",
                          }}
                        >+</button>
                        <span style={{ fontSize: "12px", color: "var(--color-text-dim)" }}>/ {maxHp}</span>
                      </div>
                      <div style={{ width: "100%", height: "3px", background: "var(--color-border)", borderRadius: "2px" }}>
                        <div style={{
                          height: "100%", width: `${hpPct * 100}%`,
                          background: hpColor, borderRadius: "2px", transition: "width 0.2s, background 0.2s",
                        }} />
                      </div>
                    </div>

                    {/* AC */}
                    <span style={{ fontSize: "15px", color: "var(--color-text-dim)", textAlign: "center" }}>
                      {em.monster?.ac ?? '—'}
                    </span>
                  </div>

                  {/* Action input */}
                  <div style={{ borderTop: "1px dashed rgba(255,255,255,0.06)", padding: "8px 16px", display: "flex", gap: "8px", alignItems: "center" }}>
                    <span style={{ fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--color-text-dim)", whiteSpace: "nowrap" as const }}>
                      R{currentTurn}
                    </span>
                    <input
                      placeholder={`What did ${em.monster?.name ?? 'this monster'} do?`}
                      value={actionInputs[em.id] ?? ''}
                      onChange={e => setActionInputs(prev => ({ ...prev, [em.id]: e.target.value }))}
                      style={{ ...inputStyle, fontSize: "13px", height: "34px", padding: "6px 12px" }}
                      onFocus={e => e.currentTarget.style.borderColor = "var(--color-gold)"}
                      onBlur={e => e.currentTarget.style.borderColor = "var(--color-border)"}
                    />
                  </div>

                  {/* Skill buttons */}
                  {(monsterSkills[em.monster_id] ?? []).length > 0 && (
                    <div style={{ borderTop: "1px dashed rgba(255,255,255,0.06)", padding: "8px 16px", display: "flex", flexWrap: "wrap" as const, gap: "6px" }}>
                      {(monsterSkills[em.monster_id] ?? []).map(skill => {
                        const remaining = getSkillCooldownRemaining(em.id, skill)
                        const onCooldown = remaining > 0
                        return (
                          <button
                            key={skill.id}
                            onClick={() => !onCooldown && handleUseSkill(em, skill)}
                            disabled={onCooldown}
                            title={skill.description ?? skill.name}
                            style={{
                              background: onCooldown ? "transparent" : "rgba(201,168,76,0.08)",
                              border: `1px solid ${onCooldown ? "var(--color-border)" : "rgba(201,168,76,0.4)"}`,
                              color: onCooldown ? "var(--color-text-dim)" : "var(--color-gold)",
                              padding: "4px 10px", fontSize: "11px", letterSpacing: "0.1em",
                              cursor: onCooldown ? "not-allowed" : "pointer",
                              fontFamily: "inherit", transition: "all 0.2s", opacity: onCooldown ? 0.5 : 1,
                            }}
                            onMouseEnter={e => { if (!onCooldown) e.currentTarget.style.background = "rgba(201,168,76,0.18)" }}
                            onMouseLeave={e => { if (!onCooldown) e.currentTarget.style.background = "rgba(201,168,76,0.08)" }}
                          >
                            {skill.name}{onCooldown ? ` (${remaining}r)` : ''}
                            {skill.damage ? ` · ${skill.damage}` : ''}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Action log */}
          {actions.length > 0 && (
            <div style={{ marginBottom: "32px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                <span style={{ fontSize: "11px", letterSpacing: "0.3em", textTransform: "uppercase", color: "var(--color-text-dim)" }}>
                  ✦ Action Log
                </span>
                <button onClick={() => setShowLog(p => !p)} style={{
                  background: "transparent", border: "none", color: "var(--color-text-dim)",
                  cursor: "pointer", fontFamily: "inherit", fontSize: "11px", letterSpacing: "0.1em", padding: 0,
                }}
                  onMouseEnter={e => e.currentTarget.style.color = "var(--color-gold)"}
                  onMouseLeave={e => e.currentTarget.style.color = "var(--color-text-dim)"}
                >{showLog ? "Hide" : "Show"}</button>
              </div>
              {showLog && (() => {
                const byTurn = actions.reduce((acc, a) => {
                  if (!acc[a.turn]) acc[a.turn] = []
                  acc[a.turn].push(a)
                  return acc
                }, {} as Record<number, EncounterMonsterAction[]>)
                return Object.entries(byTurn).sort(([a], [b]) => Number(a) - Number(b)).map(([turn, turnActions]) => (
                  <div key={turn} style={{ marginBottom: "12px" }}>
                    <div style={{ fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--color-gold-dark)", marginBottom: "6px" }}>
                      Round {turn}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      {turnActions.map(a => {
                        const em = encounterMonsters.find(m => m.id === a.encounter_monster_id)
                        return (
                          <div key={a.id} style={{
                            padding: "8px 14px", background: "var(--color-card)",
                            border: "1px solid var(--color-border)", fontSize: "13px",
                            display: "flex", gap: "12px",
                          }}>
                            <span style={{ color: "var(--color-text-dim)", minWidth: "120px", fontSize: "12px" }}>
                              {em?.monster?.name ?? '—'}
                            </span>
                            <span style={{ color: "var(--color-text-muted)" }}>{a.action}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))
              })()}
            </div>
          )}

          <div style={{ display: "flex", gap: "12px" }}>
            <button onClick={handleCompleteEncounter} style={{
              background: "transparent", border: "1px solid var(--color-gold)", color: "var(--color-gold)",
              padding: "12px 28px", fontSize: "12px", letterSpacing: "0.25em",
              textTransform: "uppercase", cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s",
            }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(201,168,76,0.08)"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >Complete Encounter ✓</button>
          </div>
        </div>
      )}

      {/* ── COMPLETED ── */}
      {status === 'completed' && (
        <div>
          <h2 style={{ fontSize: "12px", letterSpacing: "0.35em", textTransform: "uppercase", color: "var(--color-text-dim)", margin: "0 0 20px" }}>
            ✦ Results
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "32px" }}>
            {sortedByInit.map(em => {
              const hp = hpValues[em.id] ?? 0
              const maxHp = em.monster?.hp ?? 0
              const defeated = hp <= 0
              return (
                <div key={em.id} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "12px 16px", border: "1px solid var(--color-border)", background: "var(--color-card)",
                }}>
                  <span style={{
                    fontSize: "15px", color: "var(--color-text)",
                    textDecoration: defeated ? "line-through" : "none",
                    opacity: defeated ? 0.5 : 1,
                  }}>{em.monster?.name}</span>
                  <span style={{ fontSize: "12px", color: defeated ? "#c04040" : "var(--color-text-dim)" }}>
                    {defeated ? "Defeated" : `${hp} / ${maxHp} HP`}
                  </span>
                </div>
              )
            })}
          </div>

          {notes && (
            <div style={{ marginBottom: "32px" }}>
              <label style={labelStyle}>Notes</label>
              <p style={{ color: "var(--color-text-muted)", fontSize: "15px", lineHeight: 1.8, margin: 0, whiteSpace: "pre-wrap" }}>{notes}</p>
            </div>
          )}

          {actions.length > 0 && (
            <div>
              <div style={{ fontSize: "11px", letterSpacing: "0.3em", textTransform: "uppercase", color: "var(--color-text-dim)", marginBottom: "16px" }}>
                ✦ Action Log
              </div>
              {(() => {
                const byTurn = actions.reduce((acc, a) => {
                  if (!acc[a.turn]) acc[a.turn] = []
                  acc[a.turn].push(a)
                  return acc
                }, {} as Record<number, EncounterMonsterAction[]>)
                return Object.entries(byTurn).sort(([a], [b]) => Number(a) - Number(b)).map(([turn, turnActions]) => (
                  <div key={turn} style={{ marginBottom: "12px" }}>
                    <div style={{ fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--color-gold-dark)", marginBottom: "6px" }}>
                      Round {turn}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      {turnActions.map(a => {
                        const em = encounterMonsters.find(m => m.id === a.encounter_monster_id)
                        return (
                          <div key={a.id} style={{
                            padding: "8px 14px", background: "var(--color-card)",
                            border: "1px solid var(--color-border)", fontSize: "13px",
                            display: "flex", gap: "12px",
                          }}>
                            <span style={{ color: "var(--color-text-dim)", minWidth: "120px", fontSize: "12px" }}>
                              {em?.monster?.name ?? '—'}
                            </span>
                            <span style={{ color: "var(--color-text-muted)" }}>{a.action}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))
              })()}
            </div>
          )}
        </div>
      )}

      {/* ── DELETE ── */}
      {status !== 'active' && (
        <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: "32px", marginTop: "16px" }}>
          {confirmDelete ? (
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>Delete this encounter?</span>
              <button onClick={handleDelete} disabled={deleting} style={{
                background: "transparent", border: "1px solid #8b2020", color: "#c04040",
                padding: "8px 20px", fontSize: "11px", letterSpacing: "0.15em", textTransform: "uppercase",
                cursor: "pointer", fontFamily: "inherit",
              }}>{deleting ? "Deleting..." : "Confirm Delete"}</button>
              <button onClick={() => setConfirmDelete(false)} style={{
                background: "transparent", border: "1px solid var(--color-border)", color: "var(--color-text-muted)",
                padding: "8px 20px", fontSize: "11px", letterSpacing: "0.15em", textTransform: "uppercase",
                cursor: "pointer", fontFamily: "inherit",
              }}>Cancel</button>
            </div>
          ) : (
            <button onClick={() => setConfirmDelete(true)} style={{
              background: "transparent", border: "none", color: "var(--color-text-dim)", padding: 0,
              fontSize: "12px", letterSpacing: "0.1em", cursor: "pointer", fontFamily: "inherit",
            }}
              onMouseEnter={e => e.currentTarget.style.color = "#c04040"}
              onMouseLeave={e => e.currentTarget.style.color = "var(--color-text-dim)"}
            >Delete Encounter</button>
          )}
        </div>
      )}
    </div>
  )
}
