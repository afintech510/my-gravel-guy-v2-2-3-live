
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      admin_users: {
        Row: {
          id: string
          user_id: string
          email: string
          role: 'super_admin' | 'admin' | 'manager' | 'viewer'
          permissions: Json
          is_active: boolean
          created_at: string
          updated_at: string
          created_by: string | null
          last_login_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          email: string
          role: 'super_admin' | 'admin' | 'manager' | 'viewer'
          permissions?: Json
          is_active?: boolean
          created_at?: string
          updated_at?: string
          created_by?: string | null
          last_login_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          email?: string
          role?: 'super_admin' | 'admin' | 'manager' | 'viewer'
          permissions?: Json
          is_active?: boolean
          created_at?: string
          updated_at?: string
          created_by?: string | null
          last_login_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_users_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_users_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      audit_logs: {
        Row: {
          id: string
          admin_user_id: string | null
          user_email: string | null
          action: string
          resource_type: string
          resource_id: string | null
          old_values: Json | null
          new_values: Json | null
          ip_address: string | null
          user_agent: string | null
          session_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          admin_user_id?: string | null
          user_email?: string | null
          action: string
          resource_type: string
          resource_id?: string | null
          old_values?: Json | null
          new_values?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          session_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          admin_user_id?: string | null
          user_email?: string | null
          action?: string
          resource_type?: string
          resource_id?: string | null
          old_values?: Json | null
          new_values?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          session_id?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_admin_user_id_fkey"
            columns: ["admin_user_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          }
        ]
      }
      blog_categories: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          author: string
          category_id: string | null
          content: string
          created_at: string
          excerpt: string | null
          featured_image: string | null
          id: string
          meta_description: string | null
          published_at: string | null
          read_time: number | null
          seo_keywords: string[] | null
          slug: string
          status: string
          title: string
        }
        Insert: {
          author: string
          category_id?: string | null
          content: string
          created_at?: string
          excerpt?: string | null
          featured_image?: string | null
          id?: string
          meta_description?: string | null
          published_at?: string | null
          read_time?: number | null
          seo_keywords?: string[] | null
          slug: string
          status?: string
          title: string
        }
        Update: {
          author?: string
          category_id?: string | null
          content?: string
          created_at?: string
          excerpt?: string | null
          featured_image?: string | null
          id?: string
          meta_description?: string | null
          published_at?: string | null
          read_time?: number | null
          seo_keywords?: string[] | null
          slug?: string
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_posts_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "blog_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_reviews: {
        Row: {
          created_at: string
          customer_email: string | null
          customer_name: string
          id: string
          product_id: string | null
          rating: number
          review_text: string | null
        }
        Insert: {
          created_at?: string
          customer_email?: string | null
          customer_name: string
          id?: string
          product_id?: string | null
          rating: number
          review_text?: string | null
        }
        Update: {
          created_at?: string
          customer_email?: string | null
          customer_name?: string
          id?: string
          product_id?: string | null
          rating?: number
          review_text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_locations: {
        Row: {
          city: string
          created_at: string
          id: string
          is_active: boolean
          state: string
          zip_code: string
        }
        Insert: {
          city: string
          created_at?: string
          id?: string
          is_active?: boolean
          state: string
          zip_code: string
        }
        Update: {
          city?: string
          created_at?: string
          id?: string
          is_active?: boolean
          state?: string
          zip_code?: string
        }
        Relationships: []
      }
      location_search: {
        Row: {
          city: string
          county: string
          created_at: string
          id: string
          lat: number
          lng: number
          state: string
          zip_code: string
        }
        Insert: {
          city: string
          county: string
          created_at?: string
          id?: string
          lat: number
          lng: number
          state: string
          zip_code: string
        }
        Update: {
          city?: string
          county?: string
          created_at?: string
          id?: string
          lat?: number
          lng?: number
          state?: string
          zip_code?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          id: string
          order_id: string
          stripe_session_id: string
          stripe_payment_intent_id: string
          product_id: string
          unit: string
          unit_price: number
          total_price: number
          delivery_date: string
          delivery_address: string
          delivery_city: string
          delivery_state: string
          delivery_zip: string
          customer_name: string
          customer_email: string
          customer_phone: string
          instructions: string | null
          status: string
          created_at: string
          updated_at: string
          supplier_id: string | null
          supplier_name: string | null
          supplier_price: number | null
          supplier_confirmed: boolean
          supplier_notes: string | null
          tons: number
          zip_adjust: number
        }
        Insert: {
          id?: string
          order_id: string
          stripe_session_id: string
          stripe_payment_intent_id: string
          product_id: string
          unit: string
          unit_price: number
          total_price: number
          delivery_date: string
          delivery_address: string
          delivery_city: string
          delivery_state: string
          delivery_zip: string
          customer_name: string
          customer_email: string
          customer_phone: string
          instructions?: string | null
          status?: string
          created_at?: string
          updated_at?: string
          supplier_id?: string | null
          supplier_name?: string | null
          supplier_price?: number | null
          supplier_confirmed?: boolean
          supplier_notes?: string | null
          tons: number
          zip_adjust: number
        }
        Update: {
          id?: string
          order_id?: string
          stripe_session_id?: string
          stripe_payment_intent_id?: string
          product_id?: string
          unit?: string
          unit_price?: number
          total_price?: number
          delivery_date?: string
          delivery_address?: string
          delivery_city?: string
          delivery_state?: string
          delivery_zip?: string
          customer_name?: string
          customer_email?: string
          customer_phone?: string
          instructions?: string | null
          status?: string
          created_at?: string
          updated_at?: string
          supplier_id?: string | null
          supplier_name?: string | null
          supplier_price?: number | null
          supplier_confirmed?: boolean
          supplier_notes?: string | null
          tons?: number
          zip_adjust?: number
        }
        Relationships: []
      }
      price_tiers: {
        Row: {
          created_at: string
          id: string
          max_tons: number
          min_tons: number
          multiplier: number
          product_id: string[]
        }
        Insert: {
          created_at?: string
          id?: string
          max_tons?: number
          min_tons: number
          multiplier: number
          product_id: string[]
        }
        Update: {
          created_at?: string
          id?: string
          max_tons?: number
          min_tons?: number
          multiplier?: number
          product_id?: string[]
        }
        Relationships: []
      }
      products: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          name: string
          price_per_ton: number
          slug: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          price_per_ton: number
          slug: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          price_per_ton?: number
          slug?: string
        }
        Relationships: []
      }
      service_zip_codes: {
        Row: {
          city: string
          created_at: string
          id: string
          is_active: boolean
          price_adjustment: number
          state: string
          zip_code: string
        }
        Insert: {
          city: string
          created_at?: string
          id?: string
          is_active?: boolean
          price_adjustment?: number
          state: string
          zip_code: string
        }
        Update: {
          city?: string
          created_at?: string
          id?: string
          is_active?: boolean
          price_adjustment?: number
          state?: string
          zip_code?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_current_admin_user: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          email: string
          role: string
          permissions: Json
          last_login_at: string | null
        }[]
      }
      is_admin_with_role: {
        Args: {
          required_role?: string
        }
        Returns: boolean
      }
      log_admin_action: {
        Args: {
          p_action: string
          p_resource_type: string
          p_resource_id?: string
          p_old_values?: Json
          p_new_values?: Json
        }
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

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
