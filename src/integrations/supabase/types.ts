export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          operationName?: string
          query?: string
          variables?: Json
          extensions?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      
      price_tiers: {
        Row: {
          id: string;
          product_id: string[];
          min_tons: number;
          max_tons: number;
          multiplier: number;
          created_at: string;
        }
        Insert: {
          id?: string;
          product_id: string[];
          min_tons: number;
          max_tons?: number;
          multiplier: number;
          created_at?: string;
        }
        Update: {
          id?: string;
          product_id?: string[];
          min_tons?: number;
          max_tons?: number;
          multiplier?: number;
          created_at?: string;
        }
        Relationships: []
      }

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
      products: {
        Row: {
          application: string | null
          category: string | null
          color: string | null
          created_at: string | null
          description: string | null
          efficiency: string | null
          id: string
          image: string | null
          metadata: string | null
          name: string
          price: number
          size: string | null
          ton_yard_ratio: string | null
          zip_code_ratio: string | null
        }
        Insert: {
          application?: string | null
          category?: string | null
          color?: string | null
          created_at?: string | null
          description?: string | null
          efficiency?: string | null
          id?: string
          image?: string | null
          metadata?: string | null
          name: string
          price: number
          size?: string | null
          ton_yard_ratio?: string | null
          zip_code_ratio?: string | null
        }
        Update: {
          application?: string | null
          category?: string | null
          color?: string | null
          created_at?: string | null
          description?: string | null
          efficiency?: string | null
          id?: string
          image?: string | null
          metadata?: string | null
          name?: string
          price?: number
          size?: string | null
          ton_yard_ratio?: string | null
          zip_code_ratio?: string | null
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
      orders: {
        Row: {
          id: string
          order_id: string
          stripe_session_id: string | null
          stripe_payment_intent_id: string | null
          product_id: string
          unit: string
          unit_price: number
          total_price: number
          delivery_date: string | null
          delivery_street: string | null
          delivery_city: string | null
          delivery_state: string | null
          delivery_zip: string | null
          delivery_time_preference: string | null
          delivery_instructions: string | null
          delivery_phone: string | null
          delivery_name: string | null
          delivery_email: string | null
          status: string | null
          attachment_files: string[] | null
          created_at: string | null
          updated_at: string | null
          delivered_at: string | null
          supplier_id: string | null
          supplier_charges: number | null
          notes: string | null
          billing_name: string | null
          quantity: number | null
          billing_email: string | null
          zip_adjust: number | null
        }
        Insert: {
          id?: string
          order_id: string
          stripe_session_id?: string | null
          stripe_payment_intent_id?: string | null
          product_id: string
          unit: string
          unit_price: number
          total_price: number
          delivery_date?: string | null
          delivery_street?: string | null
          delivery_city?: string | null
          delivery_state?: string | null
          delivery_zip?: string | null
          delivery_time_preference?: string | null
          delivery_instructions?: string | null
          delivery_phone?: string | null
          delivery_name?: string | null
          delivery_email?: string | null
          status?: string | null
          attachment_files?: string[] | null
          created_at?: string | null
          updated_at?: string | null
          delivered_at?: string | null
          supplier_id?: string | null
          supplier_charges?: number | null
          notes?: string | null
          billing_name?: string | null
          quantity?: number | null
          billing_email?: string | null
          zip_adjust?: number | null
        }
        Update: {
          id?: string
          order_id?: string
          stripe_session_id?: string | null
          stripe_payment_intent_id?: string | null
          product_id?: string
          unit?: string
          unit_price?: number
          total_price?: number
          delivery_date?: string | null
          delivery_street?: string | null
          delivery_city?: string | null
          delivery_state?: string | null
          delivery_zip?: string | null
          delivery_time_preference?: string | null
          delivery_instructions?: string | null
          delivery_phone?: string | null
          delivery_name?: string | null
          delivery_email?: string | null
          status?: string | null
          attachment_files?: string[] | null
          created_at?: string | null
          updated_at?: string | null
          delivered_at?: string | null
          supplier_id?: string | null
          supplier_charges?: number | null
          notes?: string | null
          billing_name?: string | null
          quantity?: number | null
          billing_email?: string | null
          zip_adjust?: number | null
        }
        Relationships: []
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
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
