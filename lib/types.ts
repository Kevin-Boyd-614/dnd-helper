export interface Campaign {
  id: string
  name: string
  setting?: string
  description?: string
  player_count?: number
  chapterCount: number
  created_at: string
}

export interface Chapter {
  id: string
  campaign_id: string
  name: string
  description?: string
  order_index: number
}

export interface Dungeon {
  id: string
  chapter_id: string
  name: string
  description?: string
  order_index: number
}

export interface Monster {
  id: string
  name: string
  type?: string
  cr?: string
  hp?: number
  ac?: number
  speed?: string
  notes?: string
}

export interface MonsterSkill {
  id: string
  monster_id: string
  name: string
  description?: string
  damage?: string
  damage_type?: string
  range?: string
  cooldown?: number
}

export interface Encounter {
  id: string
  dungeon_id: string
  name: string
  notes?: string
  status: 'planned' | 'active' | 'completed'
}

export interface EncounterMonster {
  id: string
  encounter_id: string
  monster_id: string
  current_hp: number
  initiative: number | null
  monster: Monster
}