export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      boat_images: {
        Row: {
          boat_id: string
          category: string
          display_url: string | null
          id: string
          is_primary: boolean
          sort_order: number
          storage_path: string | null
        }
        Insert: {
          boat_id: string
          category?: string
          display_url?: string | null
          id?: string
          is_primary?: boolean
          sort_order?: number
          storage_path?: string | null
        }
        Update: {
          boat_id?: string
          category?: string
          display_url?: string | null
          id?: string
          is_primary?: boolean
          sort_order?: number
          storage_path?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "boat_images_boat_id_fkey"
            columns: ["boat_id"]
            isOneToOne: false
            referencedRelation: "boats"
            referencedColumns: ["id"]
          },
        ]
      }
      boat_specs: {
        Row: {
          boat_id: string
          category: string | null
          id: string
          label_en: string | null
          label_hr: string | null
          sort_order: number
          value: string | null
        }
        Insert: {
          boat_id: string
          category?: string | null
          id?: string
          label_en?: string | null
          label_hr?: string | null
          sort_order?: number
          value?: string | null
        }
        Update: {
          boat_id?: string
          category?: string | null
          id?: string
          label_en?: string | null
          label_hr?: string | null
          sort_order?: number
          value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "boat_specs_boat_id_fkey"
            columns: ["boat_id"]
            isOneToOne: false
            referencedRelation: "boats"
            referencedColumns: ["id"]
          },
        ]
      }
      boats: {
        Row: {
          base_price: number
          brand: string
          category: string
          created_at: string
          created_by: string | null
          currency: string
          description_en: string | null
          description_hr: string | null
          hero_image_url: string | null
          id: string
          model: string | null
          name: string
          status: string
          updated_at: string
          year: number | null
        }
        Insert: {
          base_price: number
          brand?: string
          category?: string
          created_at?: string
          created_by?: string | null
          currency?: string
          description_en?: string | null
          description_hr?: string | null
          hero_image_url?: string | null
          id?: string
          model?: string | null
          name: string
          status?: string
          updated_at?: string
          year?: number | null
        }
        Update: {
          base_price?: number
          brand?: string
          category?: string
          created_at?: string
          created_by?: string | null
          currency?: string
          description_en?: string | null
          description_hr?: string | null
          hero_image_url?: string | null
          id?: string
          model?: string | null
          name?: string
          status?: string
          updated_at?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "boats_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          address: string | null
          city: string | null
          client_category: string
          client_type: string
          country: string | null
          created_at: string
          created_by: string | null
          email: string | null
          id: string
          lead_source: string | null
          name: string
          notes: string | null
          phone: string | null
          postal_code: string | null
          preferred_currency: string
          preferred_language: string
          registration_number: string | null
          status: string
          tags: string[] | null
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          client_category?: string
          client_type?: string
          country?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          lead_source?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          postal_code?: string | null
          preferred_currency?: string
          preferred_language?: string
          registration_number?: string | null
          status?: string
          tags?: string[] | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          client_category?: string
          client_type?: string
          country?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          lead_source?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          postal_code?: string | null
          preferred_currency?: string
          preferred_language?: string
          registration_number?: string | null
          status?: string
          tags?: string[] | null
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "companies_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      company_settings: {
        Row: {
          address: string | null
          bank_name: string | null
          bic: string | null
          city: string | null
          default_currency: string
          default_language: string
          email: string | null
          iban: string | null
          id: string
          logo_url: string | null
          name: string | null
          oib: string | null
          phone: string | null
          postal_code: string | null
          terms_en: string | null
          terms_hr: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          bank_name?: string | null
          bic?: string | null
          city?: string | null
          default_currency?: string
          default_language?: string
          email?: string | null
          iban?: string | null
          id?: string
          logo_url?: string | null
          name?: string | null
          oib?: string | null
          phone?: string | null
          postal_code?: string | null
          terms_en?: string | null
          terms_hr?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          bank_name?: string | null
          bic?: string | null
          city?: string | null
          default_currency?: string
          default_language?: string
          email?: string | null
          iban?: string | null
          id?: string
          logo_url?: string | null
          name?: string | null
          oib?: string | null
          phone?: string | null
          postal_code?: string | null
          terms_en?: string | null
          terms_hr?: string | null
          website?: string | null
        }
        Relationships: []
      }
      contacts: {
        Row: {
          company_id: string
          created_at: string
          email: string | null
          full_name: string
          id: string
          is_primary: boolean
          phone: string | null
          position: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          is_primary?: boolean
          phone?: string | null
          position?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          is_primary?: boolean
          phone?: string | null
          position?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contacts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment_categories: {
        Row: {
          boat_id: string
          id: string
          name_en: string | null
          name_hr: string | null
          sort_order: number
        }
        Insert: {
          boat_id: string
          id?: string
          name_en?: string | null
          name_hr?: string | null
          sort_order?: number
        }
        Update: {
          boat_id?: string
          id?: string
          name_en?: string | null
          name_hr?: string | null
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "equipment_categories_boat_id_fkey"
            columns: ["boat_id"]
            isOneToOne: false
            referencedRelation: "boats"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment_items: {
        Row: {
          category_id: string
          currency: string
          description_en: string | null
          description_hr: string | null
          id: string
          is_discountable: boolean | null
          is_standard: boolean
          manufacturer_code: string | null
          name_en: string | null
          name_hr: string | null
          price: number
          sort_order: number
        }
        Insert: {
          category_id: string
          currency?: string
          description_en?: string | null
          description_hr?: string | null
          id?: string
          is_discountable?: boolean | null
          is_standard?: boolean
          manufacturer_code?: string | null
          name_en?: string | null
          name_hr?: string | null
          price?: number
          sort_order?: number
        }
        Update: {
          category_id?: string
          currency?: string
          description_en?: string | null
          description_hr?: string | null
          id?: string
          is_discountable?: boolean | null
          is_standard?: boolean
          manufacturer_code?: string | null
          name_en?: string | null
          name_hr?: string | null
          price?: number
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "equipment_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "equipment_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      pdf_templates: {
        Row: {
          configuration: Json | null
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          is_default: boolean
          name: string
          style: string
        }
        Insert: {
          configuration?: Json | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          is_default?: boolean
          name: string
          style: string
        }
        Update: {
          configuration?: Json | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          is_default?: boolean
          name?: string
          style?: string
        }
        Relationships: [
          {
            foreignKeyName: "pdf_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          is_active: boolean
          role: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          is_active?: boolean
          role?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          is_active?: boolean
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      quote_discounts: {
        Row: {
          description: string | null
          discount_level: string
          discount_type: string
          equipment_item_id: string | null
          id: string
          quote_id: string
          sort_order: number
          value: number
        }
        Insert: {
          description?: string | null
          discount_level: string
          discount_type: string
          equipment_item_id?: string | null
          id?: string
          quote_id: string
          sort_order?: number
          value: number
        }
        Update: {
          description?: string | null
          discount_level?: string
          discount_type?: string
          equipment_item_id?: string | null
          id?: string
          quote_id?: string
          sort_order?: number
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "quote_discounts_equipment_item_id_fkey"
            columns: ["equipment_item_id"]
            isOneToOne: false
            referencedRelation: "equipment_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_discounts_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_items: {
        Row: {
          category_name_en: string | null
          category_name_hr: string | null
          equipment_item_id: string | null
          id: string
          item_discount: number
          item_discount_type: string | null
          item_discount_value: number
          item_type: string
          name_en: string | null
          name_hr: string | null
          price: number
          quote_id: string
          sort_order: number
        }
        Insert: {
          category_name_en?: string | null
          category_name_hr?: string | null
          equipment_item_id?: string | null
          id?: string
          item_discount?: number
          item_discount_type?: string | null
          item_discount_value?: number
          item_type: string
          name_en?: string | null
          name_hr?: string | null
          price?: number
          quote_id: string
          sort_order?: number
        }
        Update: {
          category_name_en?: string | null
          category_name_hr?: string | null
          equipment_item_id?: string | null
          id?: string
          item_discount?: number
          item_discount_type?: string | null
          item_discount_value?: number
          item_type?: string
          name_en?: string | null
          name_hr?: string | null
          price?: number
          quote_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "quote_items_equipment_item_id_fkey"
            columns: ["equipment_item_id"]
            isOneToOne: false
            referencedRelation: "equipment_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_items_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_status_history: {
        Row: {
          changed_by: string | null
          created_at: string
          id: string
          new_status: string
          old_status: string | null
          quote_id: string
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          id?: string
          new_status: string
          old_status?: string | null
          quote_id: string
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          id?: string
          new_status?: string
          old_status?: string | null
          quote_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quote_status_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_status_history_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_template_group_boats: {
        Row: {
          boat_id: string
          group_id: string
          id: string
          special_price: number | null
        }
        Insert: {
          boat_id: string
          group_id: string
          id?: string
          special_price?: number | null
        }
        Update: {
          boat_id?: string
          group_id?: string
          id?: string
          special_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "quote_template_group_boats_boat_id_fkey"
            columns: ["boat_id"]
            isOneToOne: false
            referencedRelation: "boats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_template_group_boats_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "quote_template_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_template_group_discounts: {
        Row: {
          description: string | null
          discount_level: string
          discount_type: string
          group_id: string
          id: string
          value: number
        }
        Insert: {
          description?: string | null
          discount_level: string
          discount_type: string
          group_id: string
          id?: string
          value: number
        }
        Update: {
          description?: string | null
          discount_level?: string
          discount_type?: string
          group_id?: string
          id?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "quote_template_group_discounts_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "quote_template_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_template_group_equipment: {
        Row: {
          boat_id: string
          equipment_item_id: string
          group_id: string
          id: string
          special_price: number | null
        }
        Insert: {
          boat_id: string
          equipment_item_id: string
          group_id: string
          id?: string
          special_price?: number | null
        }
        Update: {
          boat_id?: string
          equipment_item_id?: string
          group_id?: string
          id?: string
          special_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "quote_template_group_equipment_boat_id_fkey"
            columns: ["boat_id"]
            isOneToOne: false
            referencedRelation: "boats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_template_group_equipment_equipment_item_id_fkey"
            columns: ["equipment_item_id"]
            isOneToOne: false
            referencedRelation: "equipment_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_template_group_equipment_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "quote_template_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_template_groups: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          name: string
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quote_template_groups_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      quotes: {
        Row: {
          accepted_at: string | null
          boat_base_price: number | null
          boat_discount: number
          boat_id: string | null
          company_id: string | null
          contact_id: string | null
          created_at: string
          created_by: string | null
          currency: string
          deposit_amount: number | null
          deposit_percentage: number | null
          equipment_discount: number
          equipment_subtotal: number
          id: string
          language: string
          notes: string | null
          quote_number: string
          rejected_at: string | null
          sent_at: string | null
          status: string
          template_group_id: string | null
          total_discount: number
          total_price: number | null
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          boat_base_price?: number | null
          boat_discount?: number
          boat_id?: string | null
          company_id?: string | null
          contact_id?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          deposit_amount?: number | null
          deposit_percentage?: number | null
          equipment_discount?: number
          equipment_subtotal?: number
          id?: string
          language?: string
          notes?: string | null
          quote_number: string
          rejected_at?: string | null
          sent_at?: string | null
          status?: string
          template_group_id?: string | null
          total_discount?: number
          total_price?: number | null
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          boat_base_price?: number | null
          boat_discount?: number
          boat_id?: string | null
          company_id?: string | null
          contact_id?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          deposit_amount?: number | null
          deposit_percentage?: number | null
          equipment_discount?: number
          equipment_subtotal?: number
          id?: string
          language?: string
          notes?: string | null
          quote_number?: string
          rejected_at?: string | null
          sent_at?: string | null
          status?: string
          template_group_id?: string | null
          total_discount?: number
          total_price?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quotes_boat_id_fkey"
            columns: ["boat_id"]
            isOneToOne: false
            referencedRelation: "boats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_template_group_id_fkey"
            columns: ["template_group_id"]
            isOneToOne: false
            referencedRelation: "quote_template_groups"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_quote_number: { Args: never; Returns: string }
      import_boat_from_pricelist: {
        Args: { payload: Json }
        Returns: Json
      }
      get_dashboard_stats: { Args: { p_date_from?: string }; Returns: Json }
      get_quote_status_counts: {
        Args: { p_template_group_id?: string }
        Returns: Json
      }
      get_template_group_quote_counts: { Args: never; Returns: Json }
      is_admin: { Args: never; Returns: boolean }
      set_primary_boat_image: {
        Args: { p_boat_id: string; p_image_id: string }
        Returns: undefined
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
