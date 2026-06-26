export type CompanionMode = 'elder' | 'child'
export type EmotionLabel = 'calm' | 'happy' | 'anxious' | 'sad' | 'distressed'
export type AlertSeverity = 'emergency' | 'moderate' | 'info'
export type SourceType = 'photo_description' | 'voice_transcript' | 'story' | 'life_event' | 'family_member' | 'profile_data'

export interface FamilyMember {
  name: string
  relationship: string
  note: string
}

export interface Schedule {
  morning: boolean
  evening: boolean
}

export interface Profile {
  id: string
  user_id: string
  companion_name: string
  age: number
  language: string
  mode: CompanionMode
  condition_notes: string
  favourite_topics: string[]
  family_members: FamilyMember[]
  triggers: string[]
  comfort_patterns: string[]
  schedule: Schedule
  created_at: string
  last_conversation_at?: string
}

export interface ConversationLog {
  id: string
  profile_id: string
  turn_index: number
  transcript: string
  response: string
  emotion_label: EmotionLabel
  emotion_confidence: number
  safety_flag: boolean
  created_at: string
}

export interface Alert {
  id: string
  profile_id: string
  severity: AlertSeverity
  transcript_excerpt: string
  emotion_label: EmotionLabel
  resolved: boolean
  created_at: string
}

export interface Memory {
  id: string
  profile_id: string
  content: string
  source_type: SourceType
  source_file_url?: string
  created_at: string
}
