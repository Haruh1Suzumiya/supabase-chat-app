export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username: string
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          user_id: string
          content: string
          parent_id: string | null
          thread_id: string | null
          created_at: string
          updated_at: string
          deleted_at: string | null
          edited: boolean
        }
        Insert: {
          id?: string
          user_id: string
          content: string
          parent_id?: string | null
          thread_id?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
          edited?: boolean
        }
        Update: {
          id?: string
          user_id?: string
          content?: string
          parent_id?: string | null
          thread_id?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
          edited?: boolean
        }
      }
      reactions: {
        Row: {
          id: string
          message_id: string
          user_id: string
          emoji: string
          created_at: string
        }
        Insert: {
          id?: string
          message_id: string
          user_id: string
          emoji: string
          created_at?: string
        }
        Update: {
          id?: string
          message_id?: string
          user_id?: string
          emoji?: string
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

export type Message = Database['public']['Tables']['messages']['Row'] & {
  profiles?: Database['public']['Tables']['profiles']['Row']
  reactions?: Reaction[]
  reply_count?: number
}

export type Reaction = Database['public']['Tables']['reactions']['Row'] & {
  profiles?: Database['public']['Tables']['profiles']['Row']
}

export type Profile = Database['public']['Tables']['profiles']['Row']