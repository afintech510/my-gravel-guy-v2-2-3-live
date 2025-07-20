export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      blog_categories: {
        Row: {
          created_at: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          author: string | null
          category_id: string | null
          content: string
          created_at: string | null
          excerpt: string
          featured_image: string | null
          id: string
          is_featured: boolean | null
          meta_description: string | null
          meta_title: string | null
          published_at: string | null
          slug: string
          title: string
        }
        Insert: {
          author?: string | null
          category_id?: string | null
          content: string
          created_at?: string | null
          excerpt: string
          featured_image?: string | null
          id?: string
          is_featured?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          published_at?: string | null
          slug: string
          title: string
        }
        Update: {
          author?: string | null
          category_id?: string | null
          content?: string
          created_at?: string | null
          excerpt?: string
          featured_image?: string | null
          id?: string
          is_featured?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          published_at?: string | null
          slug?: string
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
          admin_response: string | null
          admin_response_date: string | null
          content: string
          created_at: string | null
          helpful_votes: number | null
          id: string
          product_id: string | null
          product_name: string | null
          rating: number
          title: string
          user_name: string
          verified_purchase: boolean | null
        }
        Insert: {
          admin_response?: string | null
          admin_response_date?: string | null
          content: string
          created_at?: string | null
          helpful_votes?: number | null
          id?: string
          product_id?: string | null
          product_name?: string | null
          rating: number
          title: string
          user_name: string
          verified_purchase?: boolean | null
        }
        Update: {
          admin_response?: string | null
          admin_response_date?: string | null
          content?: string
          created_at?: string | null
          helpful_votes?: number | null
          id?: string
          product_id?: string | null
          product_name?: string | null
          rating?: number
          title?: string
          user_name?: string
          verified_purchase?: boolean | null
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
      customers: {
        Row: {
          assigned_salesperson: string | null
          bid_credit_balance: number | null
          created_at: string | null
          email: string | null
          id: string
          name: string
          phone: string | null
          tags: string[] | null
          updated_at: string | null
        }
        Insert: {
          assigned_salesperson?: string | null
          bid_credit_balance?: number | null
          created_at?: string | null
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Update: {
          assigned_salesperson?: string | null
          bid_credit_balance?: number | null
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      delivery_locations: {
        Row: {
          city: string
          created_at: string | null
          description: string | null
          id: string
          lat: number
          lng: number
          product_name: string | null
          region: string | null
          slug: string | null
          state: string
          title: string | null
        }
        Insert: {
          city: string
          created_at?: string | null
          description?: string | null
          id?: string
          lat: number
          lng: number
          product_name?: string | null
          region?: string | null
          slug?: string | null
          state: string
          title?: string | null
        }
        Update: {
          city?: string
          created_at?: string | null
          description?: string | null
          id?: string
          lat?: number
          lng?: number
          product_name?: string | null
          region?: string | null
          slug?: string | null
          state?: string
          title?: string | null
        }
        Relationships: []
      }
      location_search: {
        Row: {
          city: string | null
          created_at: string | null
          id: string
          ip_address: string | null
          search_text: string
          state: string | null
          user_agent: string | null
          zipcode: string | null
        }
        Insert: {
          city?: string | null
          created_at?: string | null
          id?: string
          ip_address?: string | null
          search_text: string
          state?: string | null
          user_agent?: string | null
          zipcode?: string | null
        }
        Update: {
          city?: string | null
          created_at?: string | null
          id?: string
          ip_address?: string | null
          search_text?: string
          state?: string | null
          user_agent?: string | null
          zipcode?: string | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          body: string | null
          created_at: string | null
          customer_name: string | null
          direction: string
          id: string
          is_read: boolean | null
          media_urls: string[] | null
          order_id: string | null
          phone_number: string
          status: string | null
          twilio_sid: string | null
          updated_at: string | null
          user_email: string | null
        }
        Insert: {
          body?: string | null
          created_at?: string | null
          customer_name?: string | null
          direction: string
          id?: string
          is_read?: boolean | null
          media_urls?: string[] | null
          order_id?: string | null
          phone_number: string
          status?: string | null
          twilio_sid?: string | null
          updated_at?: string | null
          user_email?: string | null
        }
        Update: {
          body?: string | null
          created_at?: string | null
          customer_name?: string | null
          direction?: string
          id?: string
          is_read?: boolean | null
          media_urls?: string[] | null
          order_id?: string | null
          phone_number?: string
          status?: string | null
          twilio_sid?: string | null
          updated_at?: string | null
          user_email?: string | null
        }
        Relationships: []
      }
      order_status_history: {
        Row: {
          change_reason: string | null
          changed_by: string | null
          created_at: string | null
          id: string
          new_status: string
          old_status: string | null
          order_item_id: string | null
        }
        Insert: {
          change_reason?: string | null
          changed_by?: string | null
          created_at?: string | null
          id?: string
          new_status: string
          old_status?: string | null
          order_item_id?: string | null
        }
        Update: {
          change_reason?: string | null
          changed_by?: string | null
          created_at?: string | null
          id?: string
          new_status?: string
          old_status?: string | null
          order_item_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_status_history_order_item_id_fkey"
            columns: ["order_item_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          attachment_files: string[] | null
          billing_email: string | null
          billing_name: string | null
          created_at: string | null
          delivered_at: string | null
          delivery_city: string | null
          delivery_date: string | null
          delivery_email: string | null
          delivery_instructions: string | null
          delivery_name: string | null
          delivery_phone: string | null
          delivery_state: string | null
          delivery_street: string | null
          delivery_time_preference: string | null
          delivery_zip: string | null
          fulfillment_eta: string | null
          fulfillment_status:
            | Database["public"]["Enums"]["fulfillment_status_enum"]
            | null
          id: string
          notes: string | null
          order_id: string
          product_id: string
          quantity: number | null
          quote_converted: boolean | null
          sales_person: string | null
          status: string | null
          stripe_payment_intent_id: string | null
          stripe_session_id: string | null
          supplier_charges: number | null
          supplier_id: string | null
          tags: string[] | null
          total_price: number
          unit: string
          unit_price: number
          updated_at: string | null
          zip_adjust: number | null
        }
        Insert: {
          attachment_files?: string[] | null
          billing_email?: string | null
          billing_name?: string | null
          created_at?: string | null
          delivered_at?: string | null
          delivery_city?: string | null
          delivery_date?: string | null
          delivery_email?: string | null
          delivery_instructions?: string | null
          delivery_name?: string | null
          delivery_phone?: string | null
          delivery_state?: string | null
          delivery_street?: string | null
          delivery_time_preference?: string | null
          delivery_zip?: string | null
          fulfillment_eta?: string | null
          fulfillment_status?:
            | Database["public"]["Enums"]["fulfillment_status_enum"]
            | null
          id?: string
          notes?: string | null
          order_id: string
          product_id: string
          quantity?: number | null
          quote_converted?: boolean | null
          sales_person?: string | null
          status?: string | null
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          supplier_charges?: number | null
          supplier_id?: string | null
          tags?: string[] | null
          total_price: number
          unit: string
          unit_price: number
          updated_at?: string | null
          zip_adjust?: number | null
        }
        Update: {
          attachment_files?: string[] | null
          billing_email?: string | null
          billing_name?: string | null
          created_at?: string | null
          delivered_at?: string | null
          delivery_city?: string | null
          delivery_date?: string | null
          delivery_email?: string | null
          delivery_instructions?: string | null
          delivery_name?: string | null
          delivery_phone?: string | null
          delivery_state?: string | null
          delivery_street?: string | null
          delivery_time_preference?: string | null
          delivery_zip?: string | null
          fulfillment_eta?: string | null
          fulfillment_status?:
            | Database["public"]["Enums"]["fulfillment_status_enum"]
            | null
          id?: string
          notes?: string | null
          order_id?: string
          product_id?: string
          quantity?: number | null
          quote_converted?: boolean | null
          sales_person?: string | null
          status?: string | null
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          supplier_charges?: number | null
          supplier_id?: string | null
          tags?: string[] | null
          total_price?: number
          unit?: string
          unit_price?: number
          updated_at?: string | null
          zip_adjust?: number | null
        }
        Relationships: []
      }
      price_lookup_table: {
        Row: {
          created_at: string | null
          id: number
          product_name: string
          quantity: number
          unit: string
          unit_price: number
        }
        Insert: {
          created_at?: string | null
          id?: never
          product_name: string
          quantity: number
          unit: string
          unit_price: number
        }
        Update: {
          created_at?: string | null
          id?: never
          product_name?: string
          quantity?: number
          unit?: string
          unit_price?: number
        }
        Relationships: []
      }
      price_tiers: {
        Row: {
          _ext: string[] | null
          created_at: string | null
          id: string
          product_name: string
          quantity: number
          unit: string
          unit_price: number | null
        }
        Insert: {
          _ext?: string[] | null
          created_at?: string | null
          id?: string
          product_name: string
          quantity: number
          unit: string
          unit_price?: number | null
        }
        Update: {
          _ext?: string[] | null
          created_at?: string | null
          id?: string
          product_name?: string
          quantity?: number
          unit?: string
          unit_price?: number | null
        }
        Relationships: []
      }
      products: {
        Row: {
          application: string | null
          category: string | null
          color: string | null
          created_at: string | null
          description: string | null
          id: string
          images: string[] | null
          metadata: string | null
          name: string
          price: number
          pricing_a: number | null
          pricing_b: number | null
          pricing_c: number | null
          short_description: string | null
          size: string | null
          slug: string | null
          ton_yard_ratio: string | null
          unit: string | null
          zip_code_ratio: string | null
        }
        Insert: {
          application?: string | null
          category?: string | null
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          images?: string[] | null
          metadata?: string | null
          name: string
          price: number
          pricing_a?: number | null
          pricing_b?: number | null
          pricing_c?: number | null
          short_description?: string | null
          size?: string | null
          slug?: string | null
          ton_yard_ratio?: string | null
          unit?: string | null
          zip_code_ratio?: string | null
        }
        Update: {
          application?: string | null
          category?: string | null
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          images?: string[] | null
          metadata?: string | null
          name?: string
          price?: number
          pricing_a?: number | null
          pricing_b?: number | null
          pricing_c?: number | null
          short_description?: string | null
          size?: string | null
          slug?: string | null
          ton_yard_ratio?: string | null
          unit?: string | null
          zip_code_ratio?: string | null
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          client_id: string
          created_at: string | null
          function_name: string
          id: string
        }
        Insert: {
          client_id: string
          created_at?: string | null
          function_name: string
          id?: string
        }
        Update: {
          client_id?: string
          created_at?: string | null
          function_name?: string
          id?: string
        }
        Relationships: []
      }
      service_zip_codes: {
        Row: {
          city: string | null
          county_fips: string | null
          county_fips_all: string | null
          county_name: string | null
          county_names_all: string | null
          created_at: string | null
          density: number | null
          id: string
          lat: number | null
          lng: number | null
          population: number | null
          price_adjustment: number | null
          state_id: string | null
          state_name: string | null
          timezone: string | null
          zip: string
        }
        Insert: {
          city?: string | null
          county_fips?: string | null
          county_fips_all?: string | null
          county_name?: string | null
          county_names_all?: string | null
          created_at?: string | null
          density?: number | null
          id?: string
          lat?: number | null
          lng?: number | null
          population?: number | null
          price_adjustment?: number | null
          state_id?: string | null
          state_name?: string | null
          timezone?: string | null
          zip: string
        }
        Update: {
          city?: string | null
          county_fips?: string | null
          county_fips_all?: string | null
          county_name?: string | null
          county_names_all?: string | null
          created_at?: string | null
          density?: number | null
          id?: string
          lat?: number | null
          lng?: number | null
          population?: number | null
          price_adjustment?: number | null
          state_id?: string | null
          state_name?: string | null
          timezone?: string | null
          zip?: string
        }
        Relationships: []
      }
      suppliers: {
        Row: {
          active: boolean | null
          address: Json | null
          created_at: string | null
          email: string | null
          id: string
          materials: string[] | null
          name: string
          phone: string | null
          service_areas: string[] | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          address?: Json | null
          created_at?: string | null
          email?: string | null
          id?: string
          materials?: string[] | null
          name: string
          phone?: string | null
          service_areas?: string[] | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          address?: Json | null
          created_at?: string | null
          email?: string | null
          id?: string
          materials?: string[] | null
          name?: string
          phone?: string | null
          service_areas?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_rate_limit: {
        Args: {
          p_identifier: string
          p_function_name: string
          p_max_requests?: number
          p_window_minutes?: number
        }
        Returns: boolean
      }
      check_user_admin_status: {
        Args: { user_email: string }
        Returns: boolean
      }
      get_tables: {
        Args: Record<PropertyKey, never>
        Returns: {
          table_name: string
          table_schema: string
        }[]
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
    }
    Enums: {
      fulfillment_status_enum:
        | "Quote Needed"
        | "Quote Sent"
        | "New Order"
        | "Pending"
        | "Assigned"
        | "Scheduled"
        | "Delivered"
        | "Cancelled"
        | "Refunded"
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
    Enums: {
      fulfillment_status_enum: [
        "Quote Needed",
        "Quote Sent",
        "New Order",
        "Pending",
        "Assigned",
        "Scheduled",
        "Delivered",
        "Cancelled",
        "Refunded",
      ],
    },
  },
} as const
