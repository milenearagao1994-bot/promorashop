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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      affiliate_events: {
        Row: {
          category_id: string | null
          created_at: string
          event_type: string
          id: string
          opportunity_id: string | null
          store_id: string | null
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          event_type: string
          id?: string
          opportunity_id?: string | null
          store_id?: string | null
        }
        Update: {
          category_id?: string | null
          created_at?: string
          event_type?: string
          id?: string
          opportunity_id?: string | null
          store_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_events_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_events_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "affiliate_opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_events_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_opportunities: {
        Row: {
          active: boolean
          affiliate_notes: string | null
          benefits: string | null
          caption: string | null
          category_id: string | null
          commission_highlight: boolean
          commission_info: string | null
          created_at: string
          description: string | null
          ends_at: string | null
          featured: boolean
          gallery: Json
          id: string
          image_url: string | null
          link_url: string
          promo_image_url: string | null
          sort_order: number
          starts_at: string | null
          store_id: string
          title: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          active?: boolean
          affiliate_notes?: string | null
          benefits?: string | null
          caption?: string | null
          category_id?: string | null
          commission_highlight?: boolean
          commission_info?: string | null
          created_at?: string
          description?: string | null
          ends_at?: string | null
          featured?: boolean
          gallery?: Json
          id?: string
          image_url?: string | null
          link_url: string
          promo_image_url?: string | null
          sort_order?: number
          starts_at?: string | null
          store_id: string
          title: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          active?: boolean
          affiliate_notes?: string | null
          benefits?: string | null
          caption?: string | null
          category_id?: string | null
          commission_highlight?: boolean
          commission_info?: string | null
          created_at?: string
          description?: string | null
          ends_at?: string | null
          featured?: boolean
          gallery?: Json
          id?: string
          image_url?: string | null
          link_url?: string
          promo_image_url?: string | null
          sort_order?: number
          starts_at?: string | null
          store_id?: string
          title?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_opportunities_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_opportunities_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_events: {
        Row: {
          anonymous_session_id: string | null
          event_type: Database["public"]["Enums"]["analytics_event_type"]
          id: string
          metadata: Json
          occurred_at: string
          product_id: string | null
          store_id: string | null
        }
        Insert: {
          anonymous_session_id?: string | null
          event_type: Database["public"]["Enums"]["analytics_event_type"]
          id?: string
          metadata?: Json
          occurred_at?: string
          product_id?: string | null
          store_id?: string | null
        }
        Update: {
          anonymous_session_id?: string | null
          event_type?: Database["public"]["Enums"]["analytics_event_type"]
          id?: string
          metadata?: Json
          occurred_at?: string
          product_id?: string | null
          store_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_events_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analytics_events_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      banners: {
        Row: {
          active: boolean
          autoplay: boolean
          created_at: string
          ends_at: string | null
          id: string
          image_url: string | null
          link_label: string | null
          link_url: string | null
          media: Json
          sort_order: number
          starts_at: string | null
          subtitle: string | null
          title: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          active?: boolean
          autoplay?: boolean
          created_at?: string
          ends_at?: string | null
          id?: string
          image_url?: string | null
          link_label?: string | null
          link_url?: string | null
          media?: Json
          sort_order?: number
          starts_at?: string | null
          subtitle?: string | null
          title: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          active?: boolean
          autoplay?: boolean
          created_at?: string
          ends_at?: string | null
          id?: string
          image_url?: string | null
          link_label?: string | null
          link_url?: string | null
          media?: Json
          sort_order?: number
          starts_at?: string | null
          subtitle?: string | null
          title?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: []
      }
      categories: {
        Row: {
          active: boolean
          created_at: string
          icon: string | null
          id: string
          name: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          icon?: string | null
          id?: string
          name: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          icon?: string | null
          id?: string
          name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      coupons: {
        Row: {
          active: boolean
          affiliate_url: string
          code: string | null
          conditions: string | null
          created_at: string
          description: string | null
          discount_label: string | null
          expires_at: string | null
          featured: boolean
          id: string
          image_url: string | null
          store_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          affiliate_url: string
          code?: string | null
          conditions?: string | null
          created_at?: string
          description?: string | null
          discount_label?: string | null
          expires_at?: string | null
          featured?: boolean
          id?: string
          image_url?: string | null
          store_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          affiliate_url?: string
          code?: string | null
          conditions?: string | null
          created_at?: string
          description?: string | null
          discount_label?: string | null
          expires_at?: string | null
          featured?: boolean
          id?: string
          image_url?: string | null
          store_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "coupons_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      editorial_reviews: {
        Row: {
          active: boolean
          body: string
          created_at: string
          id: string
          product_id: string
          published_at: string
          rating: number | null
          title: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          body: string
          created_at?: string
          id?: string
          product_id: string
          published_at?: string
          rating?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          body?: string
          created_at?: string
          id?: string
          product_id?: string
          published_at?: string
          rating?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "editorial_reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_relations: {
        Row: {
          created_at: string
          product_id: string
          related_product_id: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          product_id: string
          related_product_id: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          product_id?: string
          related_product_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_relations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_relations_related_product_id_fkey"
            columns: ["related_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_reviews: {
        Row: {
          author_name: string
          body: string
          created_at: string
          id: string
          photo_url: string | null
          product_id: string
          rating: number
          source: Database["public"]["Enums"]["review_source"]
          status: Database["public"]["Enums"]["review_status"]
          updated_at: string
        }
        Insert: {
          author_name: string
          body: string
          created_at?: string
          id?: string
          photo_url?: string | null
          product_id: string
          rating: number
          source?: Database["public"]["Enums"]["review_source"]
          status?: Database["public"]["Enums"]["review_status"]
          updated_at?: string
        }
        Update: {
          author_name?: string
          body?: string
          created_at?: string
          id?: string
          photo_url?: string | null
          product_id?: string
          rating?: number
          source?: Database["public"]["Enums"]["review_source"]
          status?: Database["public"]["Enums"]["review_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          active: boolean
          affiliate_url: string
          category_id: string | null
          coupon_code: string | null
          created_at: string
          currency: string
          description: string | null
          discount_mode: string
          discount_percent: number | null
          editorial_rating: number | null
          editorial_review: string | null
          entrega_super_rapida: boolean
          featured: boolean
          frete_gratis: boolean
          gallery: Json
          id: string
          image_url: string | null
          original_price: number | null
          price: number | null
          price_updated_at: string | null
          short_description: string | null
          slug: string
          sort_order: number
          specifications: Json
          store_id: string | null
          tags: string[]
          title: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          active?: boolean
          affiliate_url: string
          category_id?: string | null
          coupon_code?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          discount_mode?: string
          discount_percent?: number | null
          editorial_rating?: number | null
          editorial_review?: string | null
          entrega_super_rapida?: boolean
          featured?: boolean
          frete_gratis?: boolean
          gallery?: Json
          id?: string
          image_url?: string | null
          original_price?: number | null
          price?: number | null
          price_updated_at?: string | null
          short_description?: string | null
          slug: string
          sort_order?: number
          specifications?: Json
          store_id?: string | null
          tags?: string[]
          title: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          active?: boolean
          affiliate_url?: string
          category_id?: string | null
          coupon_code?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          discount_mode?: string
          discount_percent?: number | null
          editorial_rating?: number | null
          editorial_review?: string | null
          entrega_super_rapida?: boolean
          featured?: boolean
          frete_gratis?: boolean
          gallery?: Json
          id?: string
          image_url?: string | null
          original_price?: number | null
          price?: number | null
          price_updated_at?: string | null
          short_description?: string | null
          slug?: string
          sort_order?: number
          specifications?: Json
          store_id?: string | null
          tags?: string[]
          title?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          created_at: string
          key: string
          public: boolean
          updated_at: string
          value: Json
        }
        Insert: {
          created_at?: string
          key: string
          public?: boolean
          updated_at?: string
          value: Json
        }
        Update: {
          created_at?: string
          key?: string
          public?: boolean
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      stores: {
        Row: {
          accent_color: string | null
          active: boolean
          admin_notes: string | null
          affiliate_base_url: string | null
          created_at: string
          id: string
          logo_url: string | null
          name: string
          slug: string
          updated_at: string
          website_url: string | null
        }
        Insert: {
          accent_color?: string | null
          active?: boolean
          admin_notes?: string | null
          affiliate_base_url?: string | null
          created_at?: string
          id?: string
          logo_url?: string | null
          name: string
          slug: string
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          accent_color?: string | null
          active?: boolean
          admin_notes?: string | null
          affiliate_base_url?: string | null
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string
          slug?: string
          updated_at?: string
          website_url?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      analytics_event_type: "product_view" | "outbound_click"
      app_role: "admin" | "user"
      review_source: "admin" | "visitor"
      review_status: "pending" | "approved" | "rejected"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      analytics_event_type: ["product_view", "outbound_click"],
      app_role: ["admin", "user"],
      review_source: ["admin", "visitor"],
      review_status: ["pending", "approved", "rejected"],
    },
  },
} as const
