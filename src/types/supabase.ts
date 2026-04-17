export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type UserRole = 'super_admin' | 'group_admin' | 'member'
export type PeriodStatus = 'active' | 'closed'
export type SyncStatus = 'pending' | 'syncing' | 'synced' | 'failed' | 'expired'
export type MembershipStatus = 'pending' | 'active' | 'removed'

export interface Database {
  public: {
    Tables: {
      groups: {
        Row: {
          id: string
          name: string
          invite_code: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          invite_code?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          invite_code?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          id: string
          display_name: string
          role: UserRole
          group_id: string | null
          membership_status: MembershipStatus
          joined_group_at: string | null
          pin_hash: string | null
          biometric_enabled: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          display_name: string
          role?: UserRole
          group_id?: string | null
          membership_status?: MembershipStatus
          joined_group_at?: string | null
          pin_hash?: string | null
          biometric_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          display_name?: string
          role?: UserRole
          group_id?: string | null
          membership_status?: MembershipStatus
          joined_group_at?: string | null
          pin_hash?: string | null
          biometric_enabled?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'users_group_id_fkey'
            columns: ['group_id']
            isOneToOne: false
            referencedRelation: 'groups'
            referencedColumns: ['id']
          }
        ]
      }
      products: {
        Row: {
          id: string
          name: string
          icon: string
          sort_order: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          icon: string
          sort_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          icon?: string
          sort_order?: number
          is_active?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      group_products: {
        Row: {
          id: string
          group_id: string
          product_id: string
          price: number
          is_active: boolean
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          group_id: string
          product_id: string
          price: number
          is_active?: boolean
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          price?: number
          is_active?: boolean
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'group_products_group_id_fkey'
            columns: ['group_id']
            isOneToOne: false
            referencedRelation: 'groups'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'group_products_product_id_fkey'
            columns: ['product_id']
            isOneToOne: false
            referencedRelation: 'products'
            referencedColumns: ['id']
          }
        ]
      }
      periods: {
        Row: {
          id: string
          group_id: string
          name: string
          status: PeriodStatus
          started_at: string
          closed_at: string | null
          closed_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          group_id: string
          name: string
          status?: PeriodStatus
          started_at?: string
          closed_at?: string | null
          closed_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          status?: PeriodStatus
          closed_at?: string | null
          closed_by?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'periods_group_id_fkey'
            columns: ['group_id']
            isOneToOne: false
            referencedRelation: 'groups'
            referencedColumns: ['id']
          }
        ]
      }
      consumptions: {
        Row: {
          id: string
          local_uuid: string
          user_id: string
          group_id: string
          group_product_id: string
          period_id: string
          quantity: number
          unit_price: number
          registered_at: string
          deleted_at: string | null
          is_late_sync: boolean
          created_at: string
        }
        Insert: {
          id?: string
          local_uuid: string
          user_id: string
          group_id: string
          group_product_id: string
          period_id: string
          quantity: number
          unit_price: number
          registered_at?: string
          deleted_at?: string | null
          is_late_sync?: boolean
          created_at?: string
        }
        Update: {
          deleted_at?: string | null
          is_late_sync?: boolean
        }
        Relationships: [
          {
            foreignKeyName: 'consumptions_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'consumptions_group_id_fkey'
            columns: ['group_id']
            isOneToOne: false
            referencedRelation: 'groups'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'consumptions_period_id_fkey'
            columns: ['period_id']
            isOneToOne: false
            referencedRelation: 'periods'
            referencedColumns: ['id']
          }
        ]
      }
      payments: {
        Row: {
          id: string
          user_id: string
          period_id: string
          amount: number
          confirmed_by: string | null
          confirmed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          period_id: string
          amount: number
          confirmed_by?: string | null
          confirmed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          confirmed_by?: string | null
          confirmed_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'payments_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'payments_period_id_fkey'
            columns: ['period_id']
            isOneToOne: false
            referencedRelation: 'periods'
            referencedColumns: ['id']
          }
        ]
      }
    }
    Views: {
      leaderboard: {
        Row: {
          user_id: string
          period_id: string
          display_name: string
          total_quantity: number
          total_amount: number
        }
        Relationships: []
      }
    }
    Functions: {
      is_super_admin: {
        Args: Record<string, never>
        Returns: boolean
      }
      is_group_admin: {
        Args: { group_uuid: string }
        Returns: boolean
      }
      current_user_group: {
        Args: Record<string, never>
        Returns: string | null
      }
    }
    Enums: {
      user_role: UserRole
      period_status: PeriodStatus
      membership_status: MembershipStatus
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
