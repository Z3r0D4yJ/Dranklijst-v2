export type Role = 'lid' | 'leiding' | 'kas' | 'groepsleiding'
export type JoinRequestStatus = 'pending' | 'approved' | 'rejected'
export type PaymentStatus = 'unpaid' | 'pending' | 'paid'
export type ConsumptionCategory = 'alcoholisch' | 'niet-alcoholisch'

export interface Profile {
  id: string
  full_name: string
  role: Role
  avatar_url: string | null
  created_at: string
}

export interface Group {
  id: string
  name: string
  description: string | null
  created_at: string
}

export interface GroupMember {
  id: string
  user_id: string
  group_id: string
  joined_at: string
}

export interface JoinRequest {
  id: string
  user_id: string
  group_id: string
  status: JoinRequestStatus
  created_at: string
  resolved_at: string | null
  resolved_by: string | null
}

export interface Consumption {
  id: string
  name: string
  price: number
  category: ConsumptionCategory
  color: string | null
  icon: string | null
  is_active: boolean
  created_at: string
}

export interface GroupConsumption {
  id: string
  group_id: string
  consumption_id: string
  custom_price: number | null
  is_visible: boolean
}

export interface Period {
  id: string
  name: string
  started_at: string
  ended_at: string | null
  is_active: boolean
  created_by: string
}

export interface Transaction {
  id: string
  user_id: string
  consumption_id: string
  period_id: string
  quantity: number
  unit_price: number
  total_price: number
  created_at: string
}

export interface Payment {
  id: string
  user_id: string
  period_id: string
  amount_due: number
  amount_paid: number
  status: PaymentStatus
  paid_at: string | null
  confirmed_by: string | null
}

export interface PushSubscription {
  id: string
  user_id: string
  endpoint: string
  p256dh: string
  auth: string
  created_at: string
}

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: { id: string; full_name: string; role?: Role; avatar_url?: string | null }
        Update: { full_name?: string; role?: Role; avatar_url?: string | null }
        Relationships: []
      }
      groups: {
        Row: Group
        Insert: { name: string; description?: string | null }
        Update: { name?: string; description?: string | null }
        Relationships: []
      }
      group_members: {
        Row: GroupMember
        Insert: { user_id: string; group_id: string }
        Update: { user_id?: string; group_id?: string }
        Relationships: []
      }
      join_requests: {
        Row: JoinRequest
        Insert: { user_id: string; group_id: string; status?: JoinRequestStatus }
        Update: {
          status?: JoinRequestStatus
          resolved_at?: string | null
          resolved_by?: string | null
        }
        Relationships: []
      }
      consumptions: {
        Row: Consumption
        Insert: { name: string; price: number; category: ConsumptionCategory; color?: string | null; icon?: string | null; is_active?: boolean }
        Update: { name?: string; price?: number; category?: ConsumptionCategory; color?: string | null; icon?: string | null; is_active?: boolean }
        Relationships: []
      }
      group_consumptions: {
        Row: GroupConsumption
        Insert: { group_id: string; consumption_id: string; custom_price?: number | null; is_visible?: boolean }
        Update: { custom_price?: number | null; is_visible?: boolean }
        Relationships: []
      }
      periods: {
        Row: Period
        Insert: { name: string; is_active?: boolean; created_by?: string; ended_at?: string | null }
        Update: { name?: string; is_active?: boolean; ended_at?: string | null }
        Relationships: []
      }
      transactions: {
        Row: Transaction
        Insert: { user_id: string; consumption_id: string; period_id: string; quantity?: number; unit_price: number }
        Update: Record<string, never>
        Relationships: []
      }
      payments: {
        Row: Payment
        Insert: { user_id: string; period_id: string; amount_due: number; amount_paid?: number; status?: PaymentStatus }
        Update: { amount_paid?: number; status?: PaymentStatus; paid_at?: string | null; confirmed_by?: string | null }
        Relationships: []
      }
      push_subscriptions: {
        Row: PushSubscription
        Insert: { user_id: string; endpoint: string; p256dh: string; auth: string }
        Update: Record<string, never>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
