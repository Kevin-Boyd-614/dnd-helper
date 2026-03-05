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
  cr?: number
  hp?: number
  ac?: number
  notes?: string
}

export interface Encounter {
  id: string
  dungeon_id: string
  name: string
  notes?: string
  status: 'planned' | 'completed'
}