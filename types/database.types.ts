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
      bookers: {
        Row: {
          id: string
          name: string
          phone: string | null
          email: string
          status: 'active' | 'inactive'
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          phone?: string | null
          email: string
          status?: 'active' | 'inactive'
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          phone?: string | null
          email?: string
          status?: 'active' | 'inactive'
          created_at?: string
        }
        Relationships: []
      }
      daily_entries: {
        Row: {
          id: string
          booker_id: string
          entry_date: string
          sale_amount: number
          deposit_amount: number
          shortfall: number
          remarks: string | null
          created_at: string
        }
        Insert: {
          id?: string
          booker_id: string
          entry_date: string
          sale_amount?: number
          deposit_amount?: number
          remarks?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          booker_id?: string
          entry_date?: string
          sale_amount?: number
          deposit_amount?: number
          remarks?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_entries_booker_id_fkey"
            columns: ["booker_id"]
            referencedRelation: "bookers"
            referencedColumns: ["id"]
          }
        ]
      }
      users: {
        Row: {
          id: string
          role: 'owner' | 'booker'
          booker_id: string | null
          created_at: string
        }
        Insert: {
          id: string
          role: 'owner' | 'booker'
          booker_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          role?: 'owner' | 'booker'
          booker_id?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_booker_id_fkey"
            columns: ["booker_id"]
            referencedRelation: "bookers"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_user_booker_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
