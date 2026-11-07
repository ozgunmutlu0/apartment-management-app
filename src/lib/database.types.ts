export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      announcements: {
        Row: {
          author_id: string | null
          body: string
          building_id: string
          category: string
          created_at: string
          id: string
          pinned: boolean
          title: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          body?: string
          building_id: string
          category?: string
          created_at?: string
          id?: string
          pinned?: boolean
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          body?: string
          building_id?: string
          category?: string
          created_at?: string
          id?: string
          pinned?: boolean
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'announcements_author_id_fkey'
            columns: ['author_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'announcements_building_id_fkey'
            columns: ['building_id']
            isOneToOne: false
            referencedRelation: 'buildings'
            referencedColumns: ['id']
          },
        ]
      }
      buildings: {
        Row: {
          address: string | null
          created_at: string
          id: string
          name: string
          timezone: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          id?: string
          name: string
          timezone?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          id?: string
          name?: string
          timezone?: string
        }
        Relationships: []
      }
      common_areas: {
        Row: {
          building_id: string
          capacity: number | null
          close_time: string
          created_at: string
          description: string | null
          id: string
          name: string
          open_time: string
        }
        Insert: {
          building_id: string
          capacity?: number | null
          close_time?: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          open_time?: string
        }
        Update: {
          building_id?: string
          capacity?: number | null
          close_time?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          open_time?: string
        }
        Relationships: [
          {
            foreignKeyName: 'common_areas_building_id_fkey'
            columns: ['building_id']
            isOneToOne: false
            referencedRelation: 'buildings'
            referencedColumns: ['id']
          },
        ]
      }
      dues: {
        Row: {
          amount: number
          created_at: string
          due_date: string
          id: string
          period: string
          status: Database['public']['Enums']['due_status']
          unit_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          due_date: string
          id?: string
          period: string
          status?: Database['public']['Enums']['due_status']
          unit_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          due_date?: string
          id?: string
          period?: string
          status?: Database['public']['Enums']['due_status']
          unit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'dues_unit_id_fkey'
            columns: ['unit_id']
            isOneToOne: false
            referencedRelation: 'units'
            referencedColumns: ['id']
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          data: Json
          id: string
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          data?: Json
          id?: string
          read_at?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          data?: Json
          id?: string
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'notifications_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          due_id: string
          id: string
          method: string
          paid_at: string
          recorded_by: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          due_id: string
          id?: string
          method?: string
          paid_at?: string
          recorded_by?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          due_id?: string
          id?: string
          method?: string
          paid_at?: string
          recorded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'payments_due_id_fkey'
            columns: ['due_id']
            isOneToOne: false
            referencedRelation: 'dues'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'payments_recorded_by_fkey'
            columns: ['recorded_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      profiles: {
        Row: {
          building_id: string | null
          created_at: string
          expo_push_token: string | null
          full_name: string
          id: string
          locale: string
          phone: string | null
          role: Database['public']['Enums']['user_role']
          unit_id: string | null
          updated_at: string
        }
        Insert: {
          building_id?: string | null
          created_at?: string
          expo_push_token?: string | null
          full_name?: string
          id: string
          locale?: string
          phone?: string | null
          role?: Database['public']['Enums']['user_role']
          unit_id?: string | null
          updated_at?: string
        }
        Update: {
          building_id?: string | null
          created_at?: string
          expo_push_token?: string | null
          full_name?: string
          id?: string
          locale?: string
          phone?: string | null
          role?: Database['public']['Enums']['user_role']
          unit_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'profiles_building_id_fkey'
            columns: ['building_id']
            isOneToOne: false
            referencedRelation: 'buildings'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'profiles_unit_id_fkey'
            columns: ['unit_id']
            isOneToOne: false
            referencedRelation: 'units'
            referencedColumns: ['id']
          },
        ]
      }
      reservations: {
        Row: {
          area_id: string
          created_at: string
          ends_at: string
          id: string
          starts_at: string
          status: Database['public']['Enums']['reservation_status']
          user_id: string
        }
        Insert: {
          area_id: string
          created_at?: string
          ends_at: string
          id?: string
          starts_at: string
          status?: Database['public']['Enums']['reservation_status']
          user_id: string
        }
        Update: {
          area_id?: string
          created_at?: string
          ends_at?: string
          id?: string
          starts_at?: string
          status?: Database['public']['Enums']['reservation_status']
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'reservations_area_id_fkey'
            columns: ['area_id']
            isOneToOne: false
            referencedRelation: 'common_areas'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'reservations_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      ticket_events: {
        Row: {
          actor_id: string | null
          assignee_id: string | null
          created_at: string
          event_type: string
          from_status: Database['public']['Enums']['ticket_status'] | null
          id: string
          note: string | null
          ticket_id: string
          to_status: Database['public']['Enums']['ticket_status']
        }
        Insert: {
          actor_id?: string | null
          assignee_id?: string | null
          created_at?: string
          event_type?: string
          from_status?: Database['public']['Enums']['ticket_status'] | null
          id?: string
          note?: string | null
          ticket_id: string
          to_status: Database['public']['Enums']['ticket_status']
        }
        Update: {
          actor_id?: string | null
          assignee_id?: string | null
          created_at?: string
          event_type?: string
          from_status?: Database['public']['Enums']['ticket_status'] | null
          id?: string
          note?: string | null
          ticket_id?: string
          to_status?: Database['public']['Enums']['ticket_status']
        }
        Relationships: [
          {
            foreignKeyName: 'ticket_events_actor_id_fkey'
            columns: ['actor_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'ticket_events_assignee_id_fkey'
            columns: ['assignee_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'ticket_events_ticket_id_fkey'
            columns: ['ticket_id']
            isOneToOne: false
            referencedRelation: 'tickets'
            referencedColumns: ['id']
          },
        ]
      }
      ticket_photos: {
        Row: {
          created_at: string
          id: string
          storage_path: string
          ticket_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          storage_path: string
          ticket_id: string
        }
        Update: {
          created_at?: string
          id?: string
          storage_path?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'ticket_photos_ticket_id_fkey'
            columns: ['ticket_id']
            isOneToOne: false
            referencedRelation: 'tickets'
            referencedColumns: ['id']
          },
        ]
      }
      tickets: {
        Row: {
          assigned_to: string | null
          building_id: string
          category: Database['public']['Enums']['ticket_category']
          created_at: string
          created_by: string
          description: string
          id: string
          priority: Database['public']['Enums']['ticket_priority']
          resolved_at: string | null
          status: Database['public']['Enums']['ticket_status']
          title: string
          unit_id: string | null
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          building_id: string
          category?: Database['public']['Enums']['ticket_category']
          created_at?: string
          created_by: string
          description?: string
          id?: string
          priority?: Database['public']['Enums']['ticket_priority']
          resolved_at?: string | null
          status?: Database['public']['Enums']['ticket_status']
          title: string
          unit_id?: string | null
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          building_id?: string
          category?: Database['public']['Enums']['ticket_category']
          created_at?: string
          created_by?: string
          description?: string
          id?: string
          priority?: Database['public']['Enums']['ticket_priority']
          resolved_at?: string | null
          status?: Database['public']['Enums']['ticket_status']
          title?: string
          unit_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'tickets_assigned_to_fkey'
            columns: ['assigned_to']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'tickets_building_id_fkey'
            columns: ['building_id']
            isOneToOne: false
            referencedRelation: 'buildings'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'tickets_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'tickets_unit_id_fkey'
            columns: ['unit_id']
            isOneToOne: false
            referencedRelation: 'units'
            referencedColumns: ['id']
          },
        ]
      }
      units: {
        Row: {
          block: string
          building_id: string
          created_at: string
          floor: number | null
          id: string
          number: string
        }
        Insert: {
          block?: string
          building_id: string
          created_at?: string
          floor?: number | null
          id?: string
          number: string
        }
        Update: {
          block?: string
          building_id?: string
          created_at?: string
          floor?: number | null
          id?: string
          number?: string
        }
        Relationships: [
          {
            foreignKeyName: 'units_building_id_fkey'
            columns: ['building_id']
            isOneToOne: false
            referencedRelation: 'buildings'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_ticket_note: {
        Args: { p_ticket_id: string; p_note: string }
        Returns: Database['public']['Tables']['ticket_events']['Row']
      }
      assign_ticket: {
        Args: { p_ticket_id: string; p_technician_id: string | null; p_note?: string }
        Returns: Database['public']['Tables']['tickets']['Row']
      }
      can_add_ticket_photo: {
        Args: { p_ticket_id: string }
        Returns: boolean
      }
      current_building_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      current_unit_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: Database['public']['Enums']['user_role']
      }
      storage_ticket_id: {
        Args: { p_name: string }
        Returns: string
      }
      update_ticket_status: {
        Args: {
          p_ticket_id: string
          p_status: Database['public']['Enums']['ticket_status']
          p_note?: string
        }
        Returns: Database['public']['Tables']['tickets']['Row']
      }
    }
    Enums: {
      due_status: 'unpaid' | 'paid' | 'overdue'
      reservation_status: 'confirmed' | 'cancelled'
      ticket_category:
        | 'elevator'
        | 'plumbing'
        | 'electrical'
        | 'cleaning'
        | 'common_area'
        | 'heating'
        | 'other'
      ticket_priority: 'low' | 'normal' | 'high' | 'urgent'
      ticket_status: 'pending' | 'in_review' | 'in_progress' | 'resolved'
      user_role: 'resident' | 'manager' | 'technician'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        Database[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      Database[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] &
        DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      due_status: ['unpaid', 'paid', 'overdue'],
      reservation_status: ['confirmed', 'cancelled'],
      ticket_category: [
        'elevator',
        'plumbing',
        'electrical',
        'cleaning',
        'common_area',
        'heating',
        'other',
      ],
      ticket_priority: ['low', 'normal', 'high', 'urgent'],
      ticket_status: ['pending', 'in_review', 'in_progress', 'resolved'],
      user_role: ['resident', 'manager', 'technician'],
    },
  },
} as const
