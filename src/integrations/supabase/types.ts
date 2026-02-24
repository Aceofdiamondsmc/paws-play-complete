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
      admin_users: {
        Row: {
          created_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          user_id?: string
        }
        Relationships: []
      }
      care_history: {
        Row: {
          category: string | null
          completed_at: string | null
          id: string
          notes: string | null
          reminder_id: string | null
          status: string | null
          task_details: string | null
          user_id: string | null
        }
        Insert: {
          category?: string | null
          completed_at?: string | null
          id?: string
          notes?: string | null
          reminder_id?: string | null
          status?: string | null
          task_details?: string | null
          user_id?: string | null
        }
        Update: {
          category?: string | null
          completed_at?: string | null
          id?: string
          notes?: string | null
          reminder_id?: string | null
          status?: string | null
          task_details?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "walk_history_reminder_id_fkey"
            columns: ["reminder_id"]
            isOneToOne: false
            referencedRelation: "care_reminders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "walk_history_reminder_id_fkey"
            columns: ["reminder_id"]
            isOneToOne: false
            referencedRelation: "missed_medications"
            referencedColumns: ["reminder_id"]
          },
        ]
      }
      care_reminder_sent_log: {
        Row: {
          id: string
          reminder_id: string
          sent_at: string
          sent_date: string
        }
        Insert: {
          id?: string
          reminder_id: string
          sent_at?: string
          sent_date?: string
        }
        Update: {
          id?: string
          reminder_id?: string
          sent_at?: string
          sent_date?: string
        }
        Relationships: []
      }
      care_reminders: {
        Row: {
          category: string | null
          created_at: string | null
          icon_name: string | null
          id: string
          is_enabled: boolean | null
          is_recurring: boolean | null
          recurrence_pattern: string
          reminder_time: string
          snoozed_until: string | null
          task_details: string | null
          user_id: string | null
          user_timezone: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          icon_name?: string | null
          id?: string
          is_enabled?: boolean | null
          is_recurring?: boolean | null
          recurrence_pattern?: string
          reminder_time: string
          snoozed_until?: string | null
          task_details?: string | null
          user_id?: string | null
          user_timezone?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          icon_name?: string | null
          id?: string
          is_enabled?: boolean | null
          is_recurring?: boolean | null
          recurrence_pattern?: string
          reminder_time?: string
          snoozed_until?: string | null
          task_details?: string | null
          user_id?: string | null
          user_timezone?: string | null
        }
        Relationships: []
      }
      cleanup_logs: {
        Row: {
          detected_at: string
          id: number
          orphaned_file_name: string
        }
        Insert: {
          detected_at?: string
          id?: number
          orphaned_file_name: string
        }
        Update: {
          detected_at?: string
          id?: number
          orphaned_file_name?: string
        }
        Relationships: []
      }
      conversations: {
        Row: {
          created_at: string | null
          id: string
          last_message_at: string | null
          participant_1_id: string
          participant_2_id: string
          playdate_request_id: string | null
          status: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_message_at?: string | null
          participant_1_id: string
          participant_2_id: string
          playdate_request_id?: string | null
          status?: string
        }
        Update: {
          created_at?: string | null
          id?: string
          last_message_at?: string | null
          participant_1_id?: string
          participant_2_id?: string
          playdate_request_id?: string | null
          status?: string
        }
        Relationships: []
      }
      dogs: {
        Row: {
          age_years: number | null
          avatar_url: string | null
          bio: string | null
          breed: string | null
          created_at: string | null
          energy_level: string | null
          health_notes: string | null
          id: string
          is_public: boolean | null
          name: string
          owner_city: string | null
          owner_id: string
          owner_latitude: number | null
          owner_longitude: number | null
          owner_state: string | null
          play_style: string[] | null
          size: string | null
          updated_at: string | null
          weight_lbs: number | null
        }
        Insert: {
          age_years?: number | null
          avatar_url?: string | null
          bio?: string | null
          breed?: string | null
          created_at?: string | null
          energy_level?: string | null
          health_notes?: string | null
          id?: string
          is_public?: boolean | null
          name: string
          owner_city?: string | null
          owner_id?: string
          owner_latitude?: number | null
          owner_longitude?: number | null
          owner_state?: string | null
          play_style?: string[] | null
          size?: string | null
          updated_at?: string | null
          weight_lbs?: number | null
        }
        Update: {
          age_years?: number | null
          avatar_url?: string | null
          bio?: string | null
          breed?: string | null
          created_at?: string | null
          energy_level?: string | null
          health_notes?: string | null
          id?: string
          is_public?: boolean | null
          name?: string
          owner_city?: string | null
          owner_id?: string
          owner_latitude?: number | null
          owner_longitude?: number | null
          owner_state?: string | null
          play_style?: string[] | null
          size?: string | null
          updated_at?: string | null
          weight_lbs?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "dogs_owner_fk"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dogs_owner_fk"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      friendships: {
        Row: {
          addressee_id: string
          created_at: string | null
          id: string
          requester_id: string
          status: string
          updated_at: string | null
        }
        Insert: {
          addressee_id: string
          created_at?: string | null
          id?: string
          requester_id: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          addressee_id?: string
          created_at?: string | null
          id?: string
          requester_id?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "friendships_addressee_id_fkey"
            columns: ["addressee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "friendships_addressee_id_fkey"
            columns: ["addressee_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "friendships_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "friendships_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string | null
          id: string
          read_at: string | null
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string | null
          id?: string
          read_at?: string | null
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string | null
          id?: string
          read_at?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string
          created_at: string | null
          data: Json | null
          id: string
          read: boolean | null
          sent_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string | null
          data?: Json | null
          id?: string
          read?: boolean | null
          sent_at?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string | null
          data?: Json | null
          id?: string
          read?: boolean | null
          sent_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      oauth_authorizations: {
        Row: {
          created_at: string | null
          id: string
          provider: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          provider: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          provider?: string
          user_id?: string
        }
        Relationships: []
      }
      parks: {
        Row: {
          added_by: string | null
          address: string | null
          city: string | null
          created_at: string | null
          description: string | null
          gemini_summary: string | null
          geo: unknown
          geom: string | null
          has_agility_equipment: boolean | null
          has_grass_surface: boolean | null
          has_large_dog_area: boolean | null
          has_parking: boolean | null
          has_small_dog_area: boolean | null
          has_water_station: boolean | null
          Id: number
          image_url: string | null
          is_dog_friendly: boolean | null
          is_fully_fenced: boolean | null
          last_image_check: string | null
          latitude: number | null
          longitude: number | null
          name: string | null
          place_id: string | null
          rating: number | null
          state: string | null
          updated_at: string | null
          user_rating_total: number | null
        }
        Insert: {
          added_by?: string | null
          address?: string | null
          city?: string | null
          created_at?: string | null
          description?: string | null
          gemini_summary?: string | null
          geo?: unknown
          geom?: string | null
          has_agility_equipment?: boolean | null
          has_grass_surface?: boolean | null
          has_large_dog_area?: boolean | null
          has_parking?: boolean | null
          has_small_dog_area?: boolean | null
          has_water_station?: boolean | null
          Id: number
          image_url?: string | null
          is_dog_friendly?: boolean | null
          is_fully_fenced?: boolean | null
          last_image_check?: string | null
          latitude?: number | null
          longitude?: number | null
          name?: string | null
          place_id?: string | null
          rating?: number | null
          state?: string | null
          updated_at?: string | null
          user_rating_total?: number | null
        }
        Update: {
          added_by?: string | null
          address?: string | null
          city?: string | null
          created_at?: string | null
          description?: string | null
          gemini_summary?: string | null
          geo?: unknown
          geom?: string | null
          has_agility_equipment?: boolean | null
          has_grass_surface?: boolean | null
          has_large_dog_area?: boolean | null
          has_parking?: boolean | null
          has_small_dog_area?: boolean | null
          has_water_station?: boolean | null
          Id?: number
          image_url?: string | null
          is_dog_friendly?: boolean | null
          is_fully_fenced?: boolean | null
          last_image_check?: string | null
          latitude?: number | null
          longitude?: number | null
          name?: string | null
          place_id?: string | null
          rating?: number | null
          state?: string | null
          updated_at?: string | null
          user_rating_total?: number | null
        }
        Relationships: []
      }
      playdate_feedback: {
        Row: {
          behavior_tags: string[] | null
          compatibility_rating: number
          created_at: string | null
          dog_id: string
          id: string
          notes: string | null
          playdate_request_id: string
          reviewer_id: string
          would_meet_again: boolean
        }
        Insert: {
          behavior_tags?: string[] | null
          compatibility_rating: number
          created_at?: string | null
          dog_id: string
          id?: string
          notes?: string | null
          playdate_request_id: string
          reviewer_id: string
          would_meet_again?: boolean
        }
        Update: {
          behavior_tags?: string[] | null
          compatibility_rating?: number
          created_at?: string | null
          dog_id?: string
          id?: string
          notes?: string | null
          playdate_request_id?: string
          reviewer_id?: string
          would_meet_again?: boolean
        }
        Relationships: []
      }
      playdate_requests: {
        Row: {
          created_at: string | null
          id: string
          location_name: string | null
          receiver_dog_id: string | null
          request_message: string | null
          requested_date: string | null
          requested_time: string | null
          requester_id: string | null
          sender_dog_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          location_name?: string | null
          receiver_dog_id?: string | null
          request_message?: string | null
          requested_date?: string | null
          requested_time?: string | null
          requester_id?: string | null
          sender_dog_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          location_name?: string | null
          receiver_dog_id?: string | null
          request_message?: string | null
          requested_date?: string | null
          requested_time?: string | null
          requester_id?: string | null
          sender_dog_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      playdate_schedules: {
        Row: {
          created_at: string | null
          id: string
          location_lat: number | null
          location_lng: number | null
          location_name: string
          playdate_request_id: string
          proposed_by: string
          proposed_date: string
          status: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          location_lat?: number | null
          location_lng?: number | null
          location_name: string
          playdate_request_id: string
          proposed_by: string
          proposed_date: string
          status?: string
        }
        Update: {
          created_at?: string | null
          id?: string
          location_lat?: number | null
          location_lng?: number | null
          location_name?: string
          playdate_request_id?: string
          proposed_by?: string
          proposed_date?: string
          status?: string
        }
        Relationships: []
      }
      post_access: {
        Row: {
          granted_at: string | null
          post_id: string
          user_id: string
        }
        Insert: {
          granted_at?: string | null
          post_id: string
          user_id: string
        }
        Update: {
          granted_at?: string | null
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_access_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_access_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_access_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "public_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_comments: {
        Row: {
          author_id: string
          body: string
          created_at: string | null
          id: string
          post_id: string
          updated_at: string | null
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string | null
          id?: string
          post_id: string
          updated_at?: string | null
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string | null
          id?: string
          post_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "public_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_image_comments: {
        Row: {
          author_id: string
          body: string
          created_at: string
          id: string
          post_image_id: string
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string
          id?: string
          post_image_id: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          id?: string
          post_image_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_image_comments_post_image_id_fkey"
            columns: ["post_image_id"]
            isOneToOne: false
            referencedRelation: "post_images"
            referencedColumns: ["id"]
          },
        ]
      }
      post_images: {
        Row: {
          caption: string | null
          created_at: string | null
          id: string
          image_path: string
          post_id: string | null
          updated_at: string
          user_id: string | null
          visibility: string
        }
        Insert: {
          caption?: string | null
          created_at?: string | null
          id?: string
          image_path: string
          post_id?: string | null
          updated_at?: string
          user_id?: string | null
          visibility?: string
        }
        Update: {
          caption?: string | null
          created_at?: string | null
          id?: string
          image_path?: string
          post_id?: string | null
          updated_at?: string
          user_id?: string | null
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_images_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_images_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_images_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "public_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: {
        Row: {
          created_at: string | null
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "public_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          author_display_name: string | null
          author_id: string
          comments_count: number
          content: string
          created_at: string | null
          dog_id: string | null
          id: string
          image_url: string | null
          likes_count: number
          pup_name: string | null
          updated_at: string
          video_url: string | null
          visibility: Database["public"]["Enums"]["post_visibility"]
        }
        Insert: {
          author_display_name?: string | null
          author_id: string
          comments_count?: number
          content: string
          created_at?: string | null
          dog_id?: string | null
          id?: string
          image_url?: string | null
          likes_count?: number
          pup_name?: string | null
          updated_at?: string
          video_url?: string | null
          visibility?: Database["public"]["Enums"]["post_visibility"]
        }
        Update: {
          author_display_name?: string | null
          author_id?: string
          comments_count?: number
          content?: string
          created_at?: string | null
          dog_id?: string | null
          id?: string
          image_url?: string | null
          likes_count?: number
          pup_name?: string | null
          updated_at?: string
          video_url?: string | null
          visibility?: Database["public"]["Enums"]["post_visibility"]
        }
        Relationships: [
          {
            foreignKeyName: "posts_dog_id_fkey"
            columns: ["dog_id"]
            isOneToOne: false
            referencedRelation: "dogs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_dog_id_fkey"
            columns: ["dog_id"]
            isOneToOne: false
            referencedRelation: "dogs_discovery"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          "Body (HTML)": string | null
          created_at: string | null
          description: string | null
          id: string
          "Image Src": string | null
          image_url: string | null
          name: string | null
          price: number | null
          Title: string
          user_id: string | null
          "Variant Price": number | null
        }
        Insert: {
          "Body (HTML)"?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          "Image Src"?: string | null
          image_url?: string | null
          name?: string | null
          price?: number | null
          Title: string
          user_id?: string | null
          "Variant Price"?: number | null
        }
        Update: {
          "Body (HTML)"?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          "Image Src"?: string | null
          image_url?: string | null
          name?: string | null
          price?: number | null
          Title?: string
          user_id?: string | null
          "Variant Price"?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          city: string | null
          created_at: string | null
          display_name: string | null
          fcm_token: string | null
          id: string
          is_public: boolean
          latitude: number | null
          location_public: boolean
          longitude: number | null
          onboarding_completed: boolean | null
          onesignal_player_id: string | null
          state: string | null
          updated_at: string | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          created_at?: string | null
          display_name?: string | null
          fcm_token?: string | null
          id: string
          is_public?: boolean
          latitude?: number | null
          location_public?: boolean
          longitude?: number | null
          onboarding_completed?: boolean | null
          onesignal_player_id?: string | null
          state?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          created_at?: string | null
          display_name?: string | null
          fcm_token?: string | null
          id?: string
          is_public?: boolean
          latitude?: number | null
          location_public?: boolean
          longitude?: number | null
          onboarding_completed?: boolean | null
          onesignal_player_id?: string | null
          state?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
      service_submissions: {
        Row: {
          address: string
          approval_status: string
          approved_at: string | null
          approved_by: string | null
          business_name: string
          category: string
          city: string
          created_at: string | null
          description: string | null
          email: string
          id: string
          image_url: string | null
          latitude: number | null
          longitude: number | null
          payment_status: string
          phone: string | null
          rejection_reason: string | null
          state: string
          stripe_customer_id: string | null
          stripe_session_id: string | null
          stripe_subscription_id: string | null
          submitter_id: string | null
          submitter_name: string
          subscription_tier: string | null
          subscription_valid_until: string | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          address: string
          approval_status?: string
          approved_at?: string | null
          approved_by?: string | null
          business_name: string
          category: string
          city: string
          created_at?: string | null
          description?: string | null
          email: string
          id?: string
          image_url?: string | null
          latitude?: number | null
          longitude?: number | null
          payment_status?: string
          phone?: string | null
          rejection_reason?: string | null
          state: string
          stripe_customer_id?: string | null
          stripe_session_id?: string | null
          stripe_subscription_id?: string | null
          submitter_id?: string | null
          submitter_name: string
          subscription_tier?: string | null
          subscription_valid_until?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          address?: string
          approval_status?: string
          approved_at?: string | null
          approved_by?: string | null
          business_name?: string
          category?: string
          city?: string
          created_at?: string | null
          description?: string | null
          email?: string
          id?: string
          image_url?: string | null
          latitude?: number | null
          longitude?: number | null
          payment_status?: string
          phone?: string | null
          rejection_reason?: string | null
          state?: string
          stripe_customer_id?: string | null
          stripe_session_id?: string | null
          stripe_subscription_id?: string | null
          submitter_id?: string | null
          submitter_name?: string
          subscription_tier?: string | null
          subscription_valid_until?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      services: {
        Row: {
          category: string
          created_at: string
          description: string | null
          distance: string | null
          enriched_description: string | null
          enrichment_status: string | null
          flag_reason: string | null
          geo: unknown
          google_place_id: string | null
          id: number
          image_url: string
          is_featured: boolean
          is_flagged: boolean | null
          is_verified: boolean | null
          latitude: number | null
          longitude: number | null
          name: string
          original_description: string | null
          phone: string | null
          photo_reference: string | null
          price: string
          rating: number
          suggested_category: string | null
          updated_at: string | null
          verified_address: string | null
          verified_latitude: number | null
          verified_longitude: number | null
          website: string | null
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          distance?: string | null
          enriched_description?: string | null
          enrichment_status?: string | null
          flag_reason?: string | null
          geo?: unknown
          google_place_id?: string | null
          id?: number
          image_url: string
          is_featured?: boolean
          is_flagged?: boolean | null
          is_verified?: boolean | null
          latitude?: number | null
          longitude?: number | null
          name: string
          original_description?: string | null
          phone?: string | null
          photo_reference?: string | null
          price: string
          rating: number
          suggested_category?: string | null
          updated_at?: string | null
          verified_address?: string | null
          verified_latitude?: number | null
          verified_longitude?: number | null
          website?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          distance?: string | null
          enriched_description?: string | null
          enrichment_status?: string | null
          flag_reason?: string | null
          geo?: unknown
          google_place_id?: string | null
          id?: number
          image_url?: string
          is_featured?: boolean
          is_flagged?: boolean | null
          is_verified?: boolean | null
          latitude?: number | null
          longitude?: number | null
          name?: string
          original_description?: string | null
          phone?: string | null
          photo_reference?: string | null
          price?: string
          rating?: number
          suggested_category?: string | null
          updated_at?: string | null
          verified_address?: string | null
          verified_latitude?: number | null
          verified_longitude?: number | null
          website?: string | null
        }
        Relationships: []
      }
      spatial_ref_sys: {
        Row: {
          auth_name: string | null
          auth_srid: number | null
          proj4text: string | null
          srid: number
          srtext: string | null
        }
        Insert: {
          auth_name?: string | null
          auth_srid?: number | null
          proj4text?: string | null
          srid: number
          srtext?: string | null
        }
        Update: {
          auth_name?: string | null
          auth_srid?: number | null
          proj4text?: string | null
          srid?: number
          srtext?: string | null
        }
        Relationships: []
      }
      user_blocks: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string
          id: string
          reason: string | null
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string
          id?: string
          reason?: string | null
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string
          id?: string
          reason?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: string
          user_id: string
        }
        Insert: {
          id?: string
          role: string
          user_id: string
        }
        Update: {
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string | null
          email: string
          full_name: string
          id: string
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name: string
          id: string
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
        }
        Relationships: []
      }
      vaccination_records: {
        Row: {
          created_at: string | null
          document_url: string | null
          dog_id: string
          expiry_date: string
          id: string
          status: string
          vaccination_type: string
          verified_date: string | null
        }
        Insert: {
          created_at?: string | null
          document_url?: string | null
          dog_id: string
          expiry_date: string
          id?: string
          status?: string
          vaccination_type: string
          verified_date?: string | null
        }
        Update: {
          created_at?: string | null
          document_url?: string | null
          dog_id?: string
          expiry_date?: string
          id?: string
          status?: string
          vaccination_type?: string
          verified_date?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      dogs_discovery: {
        Row: {
          age_years: number | null
          avatar_url: string | null
          bio: string | null
          breed: string | null
          created_at: string | null
          energy_level: string | null
          id: string | null
          name: string | null
          owner_avatar_url: string | null
          owner_city: string | null
          owner_display_name: string | null
          owner_id: string | null
          owner_latitude: number | null
          owner_longitude: number | null
          owner_state: string | null
          play_style: string[] | null
          size: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dogs_owner_fk"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dogs_owner_fk"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      geography_columns: {
        Row: {
          coord_dimension: number | null
          f_geography_column: unknown
          f_table_catalog: unknown
          f_table_name: unknown
          f_table_schema: unknown
          srid: number | null
          type: string | null
        }
        Relationships: []
      }
      geometry_columns: {
        Row: {
          coord_dimension: number | null
          f_geometry_column: unknown
          f_table_catalog: string | null
          f_table_name: unknown
          f_table_schema: unknown
          srid: number | null
          type: string | null
        }
        Insert: {
          coord_dimension?: number | null
          f_geometry_column?: unknown
          f_table_catalog?: string | null
          f_table_name?: unknown
          f_table_schema?: unknown
          srid?: number | null
          type?: string | null
        }
        Update: {
          coord_dimension?: number | null
          f_geometry_column?: unknown
          f_table_catalog?: string | null
          f_table_name?: unknown
          f_table_schema?: unknown
          srid?: number | null
          type?: string | null
        }
        Relationships: []
      }
      missed_medications: {
        Row: {
          reminder_id: string | null
          reminder_time: string | null
          task_details: string | null
          user_id: string | null
        }
        Insert: {
          reminder_id?: string | null
          reminder_time?: string | null
          task_details?: string | null
          user_id?: string | null
        }
        Update: {
          reminder_id?: string | null
          reminder_time?: string | null
          task_details?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      park_counts: {
        Row: {
          total_parks: number | null
        }
        Relationships: []
      }
      posts_public: {
        Row: {
          author_display_id: string | null
          author_short_id: string | null
          content: string | null
          created_at: string | null
          id: string | null
        }
        Insert: {
          author_display_id?: never
          author_short_id?: never
          content?: string | null
          created_at?: string | null
          id?: string | null
        }
        Update: {
          author_display_id?: never
          author_short_id?: never
          content?: string | null
          created_at?: string | null
          id?: string | null
        }
        Relationships: []
      }
      products_public: {
        Row: {
          description: string | null
          id: string | null
          name: string | null
          price: number | null
        }
        Insert: {
          description?: string | null
          id?: string | null
          name?: string | null
          price?: number | null
        }
        Update: {
          description?: string | null
          id?: string | null
          name?: string | null
          price?: number | null
        }
        Relationships: []
      }
      public_posts: {
        Row: {
          author_avatar_url: string | null
          author_display_name: string | null
          author_id: string | null
          comments_count: number | null
          content: string | null
          created_at: string | null
          dog_id: string | null
          id: string | null
          image_url: string | null
          likes_count: number | null
          pup_name: string | null
          updated_at: string | null
          video_url: string | null
          visibility: Database["public"]["Enums"]["post_visibility"] | null
        }
        Relationships: [
          {
            foreignKeyName: "posts_dog_id_fkey"
            columns: ["dog_id"]
            isOneToOne: false
            referencedRelation: "dogs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_dog_id_fkey"
            columns: ["dog_id"]
            isOneToOne: false
            referencedRelation: "dogs_discovery"
            referencedColumns: ["id"]
          },
        ]
      }
      public_profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          city: string | null
          created_at: string | null
          display_name: string | null
          id: string | null
          state: string | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          city?: never
          created_at?: string | null
          display_name?: string | null
          id?: string | null
          state?: never
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          city?: never
          created_at?: string | null
          display_name?: string | null
          id?: string | null
          state?: never
          username?: string | null
        }
        Relationships: []
      }
      services_explore: {
        Row: {
          category: string | null
          description: string | null
          enriched_description: string | null
          id: number | null
          is_verified: boolean | null
          latitude: number | null
          longitude: number | null
          name: string | null
          verified_latitude: number | null
          verified_longitude: number | null
        }
        Insert: {
          category?: string | null
          description?: string | null
          enriched_description?: string | null
          id?: number | null
          is_verified?: boolean | null
          latitude?: number | null
          longitude?: number | null
          name?: string | null
          verified_latitude?: number | null
          verified_longitude?: number | null
        }
        Update: {
          category?: string | null
          description?: string | null
          enriched_description?: string | null
          id?: number | null
          is_verified?: boolean | null
          latitude?: number | null
          longitude?: number | null
          name?: string | null
          verified_latitude?: number | null
          verified_longitude?: number | null
        }
        Relationships: []
      }
      view_post_comment_counts: {
        Row: {
          comment_count: number | null
          post_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "public_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      view_post_like_counts: {
        Row: {
          like_count: number | null
          post_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "public_posts"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      _postgis_deprecate: {
        Args: { newname: string; oldname: string; version: string }
        Returns: undefined
      }
      _postgis_index_extent: {
        Args: { col: string; tbl: unknown }
        Returns: unknown
      }
      _postgis_pgsql_version: { Args: never; Returns: string }
      _postgis_scripts_pgsql_version: { Args: never; Returns: string }
      _postgis_selectivity: {
        Args: { att_name: string; geom: unknown; mode?: string; tbl: unknown }
        Returns: number
      }
      _postgis_stats: {
        Args: { ""?: string; att_name: string; tbl: unknown }
        Returns: string
      }
      _st_3dintersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_containsproperly: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_coveredby:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_covers:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_crosses: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_dwithin: {
        Args: {
          geog1: unknown
          geog2: unknown
          tolerance: number
          use_spheroid?: boolean
        }
        Returns: boolean
      }
      _st_equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_intersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_linecrossingdirection: {
        Args: { line1: unknown; line2: unknown }
        Returns: number
      }
      _st_longestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      _st_maxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      _st_orderingequals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_sortablehash: { Args: { geom: unknown }; Returns: number }
      _st_touches: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_voronoi: {
        Args: {
          clip?: unknown
          g1: unknown
          return_polygons?: boolean
          tolerance?: number
        }
        Returns: unknown
      }
      _st_within: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      addauth: { Args: { "": string }; Returns: boolean }
      addgeometrycolumn:
        | {
            Args: {
              catalog_name: string
              column_name: string
              new_dim: number
              new_srid_in: number
              new_type: string
              schema_name: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              column_name: string
              new_dim: number
              new_srid: number
              new_type: string
              schema_name: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              column_name: string
              new_dim: number
              new_srid: number
              new_type: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
      block_user_and_decline_requests: {
        Args: { p_blocked: string; p_blocker: string }
        Returns: undefined
      }
      check_user_blocked: {
        Args: { p_receiver_owner: string; p_requester: string }
        Returns: boolean
      }
      delete_storage_object: {
        Args: { object_path: string }
        Returns: undefined
      }
      disablelongtransactions: { Args: never; Returns: string }
      dropgeometrycolumn:
        | {
            Args: {
              catalog_name: string
              column_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
        | {
            Args: {
              column_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
        | { Args: { column_name: string; table_name: string }; Returns: string }
      dropgeometrytable:
        | {
            Args: {
              catalog_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
        | { Args: { schema_name: string; table_name: string }; Returns: string }
        | { Args: { table_name: string }; Returns: string }
      enablelongtransactions: { Args: never; Returns: string }
      equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      geometry: { Args: { "": string }; Returns: unknown }
      geometry_above: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_below: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_cmp: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_contained_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_contains_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_distance_box: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_distance_centroid: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_eq: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_ge: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_gt: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_le: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_left: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_lt: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overabove: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overbelow: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overlaps_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overleft: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overright: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_right: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_same: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_same_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_within: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geomfromewkt: { Args: { "": string }; Returns: unknown }
      get_current_user_role: { Args: never; Returns: string }
      get_nearby_dogs: {
        Args: { limit_count?: number; user_lat: number; user_lng: number }
        Returns: {
          age_years: number
          avatar_url: string
          bio: string
          breed: string
          created_at: string
          distance_meters: number
          energy_level: string
          id: string
          name: string
          owner_avatar_url: string
          owner_city: string
          owner_display_name: string
          owner_id: string
          owner_state: string
          play_style: string[]
          size: string
        }[]
      }
      get_nearby_parks: {
        Args: { radius_meters?: number; user_lat: number; user_lng: number }
        Returns: {
          added_by: string
          address: string
          city: string
          created_at: string
          description: string
          distance_meters: number
          gemini_summary: string
          geom: string
          has_agility_equipment: boolean
          has_grass_surface: boolean
          has_large_dog_area: boolean
          has_parking: boolean
          has_small_dog_area: boolean
          has_water_station: boolean
          id: number
          image_url: string
          is_dog_friendly: boolean
          is_fully_fenced: boolean
          latitude: number
          longitude: number
          name: string
          place_id: string
          rating: number
          state: string
          updated_at: string
          user_ratings_total: number
        }[]
      }
      get_nearby_services: {
        Args: {
          filter_category?: string
          radius_meters?: number
          user_lat: number
          user_lng: number
        }
        Returns: {
          category: string
          description: string
          distance_meters: number
          enriched_description: string
          enrichment_status: string
          id: number
          image_url: string
          is_featured: boolean
          is_flagged: boolean
          is_verified: boolean
          latitude: number
          longitude: number
          name: string
          phone: string
          photo_reference: string
          price: string
          rating: number
          verified_latitude: number
          verified_longitude: number
          website: string
        }[]
      }
      get_parks_nearby: {
        Args: {
          page_offset?: number
          page_size?: number
          radius_meters?: number
          user_lat: number
          user_lng: number
        }
        Returns: {
          added_by: string
          address: string
          city: string
          created_at: string
          description: string
          distance_meters: number
          gemini_summary: string
          geom: string
          has_agility_equipment: boolean
          has_grass_surface: boolean
          has_large_dog_area: boolean
          has_parking: boolean
          has_small_dog_area: boolean
          has_water_station: boolean
          id: number
          image_url: string
          is_dog_friendly: boolean
          is_fully_fenced: boolean
          latitude: number
          longitude: number
          name: string
          place_id: string
          rating: number
          state: string
          updated_at: string
          user_ratings_total: number
        }[]
      }
      gettransactionid: { Args: never; Returns: unknown }
      is_admin: { Args: never; Returns: boolean }
      longtransactionsenabled: { Args: never; Returns: boolean }
      mark_all_notifications_as_read: { Args: never; Returns: undefined }
      populate_geometry_columns:
        | { Args: { tbl_oid: unknown; use_typmod?: boolean }; Returns: number }
        | { Args: { use_typmod?: boolean }; Returns: string }
      postgis_constraint_dims: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: number
      }
      postgis_constraint_srid: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: number
      }
      postgis_constraint_type: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: string
      }
      postgis_extensions_upgrade: { Args: never; Returns: string }
      postgis_full_version: { Args: never; Returns: string }
      postgis_geos_version: { Args: never; Returns: string }
      postgis_lib_build_date: { Args: never; Returns: string }
      postgis_lib_revision: { Args: never; Returns: string }
      postgis_lib_version: { Args: never; Returns: string }
      postgis_libjson_version: { Args: never; Returns: string }
      postgis_liblwgeom_version: { Args: never; Returns: string }
      postgis_libprotobuf_version: { Args: never; Returns: string }
      postgis_libxml_version: { Args: never; Returns: string }
      postgis_proj_version: { Args: never; Returns: string }
      postgis_scripts_build_date: { Args: never; Returns: string }
      postgis_scripts_installed: { Args: never; Returns: string }
      postgis_scripts_released: { Args: never; Returns: string }
      postgis_svn_version: { Args: never; Returns: string }
      postgis_type_name: {
        Args: {
          coord_dimension: number
          geomname: string
          use_new_name?: boolean
        }
        Returns: string
      }
      postgis_version: { Args: never; Returns: string }
      postgis_wagyu_version: { Args: never; Returns: string }
      realtime_can_read_topic: { Args: { topic: string }; Returns: boolean }
      refresh_mv: { Args: { views?: string[] }; Returns: Json }
      st_3dclosestpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3ddistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_3dintersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_3dlongestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3dmakebox: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3dmaxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_3dshortestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_addpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_angle:
        | { Args: { line1: unknown; line2: unknown }; Returns: number }
        | {
            Args: { pt1: unknown; pt2: unknown; pt3: unknown; pt4?: unknown }
            Returns: number
          }
      st_area:
        | { Args: { geog: unknown; use_spheroid?: boolean }; Returns: number }
        | { Args: { "": string }; Returns: number }
      st_asencodedpolyline: {
        Args: { geom: unknown; nprecision?: number }
        Returns: string
      }
      st_asewkt: { Args: { "": string }; Returns: string }
      st_asgeojson:
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | {
            Args: {
              geom_column?: string
              maxdecimaldigits?: number
              pretty_bool?: boolean
              r: Record<string, unknown>
            }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_asgml:
        | {
            Args: {
              geog: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
            }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
        | {
            Args: {
              geog: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
              version: number
            }
            Returns: string
          }
        | {
            Args: {
              geom: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
              version: number
            }
            Returns: string
          }
      st_askml:
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; nprefix?: string }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; nprefix?: string }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_aslatlontext: {
        Args: { geom: unknown; tmpl?: string }
        Returns: string
      }
      st_asmarc21: { Args: { format?: string; geom: unknown }; Returns: string }
      st_asmvtgeom: {
        Args: {
          bounds: unknown
          buffer?: number
          clip_geom?: boolean
          extent?: number
          geom: unknown
        }
        Returns: unknown
      }
      st_assvg:
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; rel?: number }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; rel?: number }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_astext: { Args: { "": string }; Returns: string }
      st_astwkb:
        | {
            Args: {
              geom: unknown
              prec?: number
              prec_m?: number
              prec_z?: number
              with_boxes?: boolean
              with_sizes?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              geom: unknown[]
              ids: number[]
              prec?: number
              prec_m?: number
              prec_z?: number
              with_boxes?: boolean
              with_sizes?: boolean
            }
            Returns: string
          }
      st_asx3d: {
        Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
        Returns: string
      }
      st_azimuth:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: number }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
      st_boundingdiagonal: {
        Args: { fits?: boolean; geom: unknown }
        Returns: unknown
      }
      st_buffer:
        | {
            Args: { geom: unknown; options?: string; radius: number }
            Returns: unknown
          }
        | {
            Args: { geom: unknown; quadsegs: number; radius: number }
            Returns: unknown
          }
      st_centroid: { Args: { "": string }; Returns: unknown }
      st_clipbybox2d: {
        Args: { box: unknown; geom: unknown }
        Returns: unknown
      }
      st_closestpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_collect: { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
      st_concavehull: {
        Args: {
          param_allow_holes?: boolean
          param_geom: unknown
          param_pctconvex: number
        }
        Returns: unknown
      }
      st_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_containsproperly: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_coorddim: { Args: { geometry: unknown }; Returns: number }
      st_coveredby:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_covers:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_crosses: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_curvetoline: {
        Args: { flags?: number; geom: unknown; tol?: number; toltype?: number }
        Returns: unknown
      }
      st_delaunaytriangles: {
        Args: { flags?: number; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_difference: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_disjoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_distance:
        | {
            Args: { geog1: unknown; geog2: unknown; use_spheroid?: boolean }
            Returns: number
          }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
      st_distancesphere:
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
        | {
            Args: { geom1: unknown; geom2: unknown; radius: number }
            Returns: number
          }
      st_distancespheroid: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_dwithin: {
        Args: {
          geog1: unknown
          geog2: unknown
          tolerance: number
          use_spheroid?: boolean
        }
        Returns: boolean
      }
      st_equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_expand:
        | { Args: { box: unknown; dx: number; dy: number }; Returns: unknown }
        | {
            Args: { box: unknown; dx: number; dy: number; dz?: number }
            Returns: unknown
          }
        | {
            Args: {
              dm?: number
              dx: number
              dy: number
              dz?: number
              geom: unknown
            }
            Returns: unknown
          }
      st_force3d: { Args: { geom: unknown; zvalue?: number }; Returns: unknown }
      st_force3dm: {
        Args: { geom: unknown; mvalue?: number }
        Returns: unknown
      }
      st_force3dz: {
        Args: { geom: unknown; zvalue?: number }
        Returns: unknown
      }
      st_force4d: {
        Args: { geom: unknown; mvalue?: number; zvalue?: number }
        Returns: unknown
      }
      st_generatepoints:
        | { Args: { area: unknown; npoints: number }; Returns: unknown }
        | {
            Args: { area: unknown; npoints: number; seed: number }
            Returns: unknown
          }
      st_geogfromtext: { Args: { "": string }; Returns: unknown }
      st_geographyfromtext: { Args: { "": string }; Returns: unknown }
      st_geohash:
        | { Args: { geog: unknown; maxchars?: number }; Returns: string }
        | { Args: { geom: unknown; maxchars?: number }; Returns: string }
      st_geomcollfromtext: { Args: { "": string }; Returns: unknown }
      st_geometricmedian: {
        Args: {
          fail_if_not_converged?: boolean
          g: unknown
          max_iter?: number
          tolerance?: number
        }
        Returns: unknown
      }
      st_geometryfromtext: { Args: { "": string }; Returns: unknown }
      st_geomfromewkt: { Args: { "": string }; Returns: unknown }
      st_geomfromgeojson:
        | { Args: { "": Json }; Returns: unknown }
        | { Args: { "": Json }; Returns: unknown }
        | { Args: { "": string }; Returns: unknown }
      st_geomfromgml: { Args: { "": string }; Returns: unknown }
      st_geomfromkml: { Args: { "": string }; Returns: unknown }
      st_geomfrommarc21: { Args: { marc21xml: string }; Returns: unknown }
      st_geomfromtext: { Args: { "": string }; Returns: unknown }
      st_gmltosql: { Args: { "": string }; Returns: unknown }
      st_hasarc: { Args: { geometry: unknown }; Returns: boolean }
      st_hausdorffdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_hexagon: {
        Args: { cell_i: number; cell_j: number; origin?: unknown; size: number }
        Returns: unknown
      }
      st_hexagongrid: {
        Args: { bounds: unknown; size: number }
        Returns: Record<string, unknown>[]
      }
      st_interpolatepoint: {
        Args: { line: unknown; point: unknown }
        Returns: number
      }
      st_intersection: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_intersects:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_isvaliddetail: {
        Args: { flags?: number; geom: unknown }
        Returns: Database["public"]["CompositeTypes"]["valid_detail"]
        SetofOptions: {
          from: "*"
          to: "valid_detail"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      st_length:
        | { Args: { geog: unknown; use_spheroid?: boolean }; Returns: number }
        | { Args: { "": string }; Returns: number }
      st_letters: { Args: { font?: Json; letters: string }; Returns: unknown }
      st_linecrossingdirection: {
        Args: { line1: unknown; line2: unknown }
        Returns: number
      }
      st_linefromencodedpolyline: {
        Args: { nprecision?: number; txtin: string }
        Returns: unknown
      }
      st_linefromtext: { Args: { "": string }; Returns: unknown }
      st_linelocatepoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_linetocurve: { Args: { geometry: unknown }; Returns: unknown }
      st_locatealong: {
        Args: { geometry: unknown; leftrightoffset?: number; measure: number }
        Returns: unknown
      }
      st_locatebetween: {
        Args: {
          frommeasure: number
          geometry: unknown
          leftrightoffset?: number
          tomeasure: number
        }
        Returns: unknown
      }
      st_locatebetweenelevations: {
        Args: { fromelevation: number; geometry: unknown; toelevation: number }
        Returns: unknown
      }
      st_longestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makebox2d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makeline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makevalid: {
        Args: { geom: unknown; params: string }
        Returns: unknown
      }
      st_maxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_minimumboundingcircle: {
        Args: { inputgeom: unknown; segs_per_quarter?: number }
        Returns: unknown
      }
      st_mlinefromtext: { Args: { "": string }; Returns: unknown }
      st_mpointfromtext: { Args: { "": string }; Returns: unknown }
      st_mpolyfromtext: { Args: { "": string }; Returns: unknown }
      st_multilinestringfromtext: { Args: { "": string }; Returns: unknown }
      st_multipointfromtext: { Args: { "": string }; Returns: unknown }
      st_multipolygonfromtext: { Args: { "": string }; Returns: unknown }
      st_node: { Args: { g: unknown }; Returns: unknown }
      st_normalize: { Args: { geom: unknown }; Returns: unknown }
      st_offsetcurve: {
        Args: { distance: number; line: unknown; params?: string }
        Returns: unknown
      }
      st_orderingequals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_perimeter: {
        Args: { geog: unknown; use_spheroid?: boolean }
        Returns: number
      }
      st_pointfromtext: { Args: { "": string }; Returns: unknown }
      st_pointm: {
        Args: {
          mcoordinate: number
          srid?: number
          xcoordinate: number
          ycoordinate: number
        }
        Returns: unknown
      }
      st_pointz: {
        Args: {
          srid?: number
          xcoordinate: number
          ycoordinate: number
          zcoordinate: number
        }
        Returns: unknown
      }
      st_pointzm: {
        Args: {
          mcoordinate: number
          srid?: number
          xcoordinate: number
          ycoordinate: number
          zcoordinate: number
        }
        Returns: unknown
      }
      st_polyfromtext: { Args: { "": string }; Returns: unknown }
      st_polygonfromtext: { Args: { "": string }; Returns: unknown }
      st_project: {
        Args: { azimuth: number; distance: number; geog: unknown }
        Returns: unknown
      }
      st_quantizecoordinates: {
        Args: {
          g: unknown
          prec_m?: number
          prec_x: number
          prec_y?: number
          prec_z?: number
        }
        Returns: unknown
      }
      st_reduceprecision: {
        Args: { geom: unknown; gridsize: number }
        Returns: unknown
      }
      st_relate: { Args: { geom1: unknown; geom2: unknown }; Returns: string }
      st_removerepeatedpoints: {
        Args: { geom: unknown; tolerance?: number }
        Returns: unknown
      }
      st_segmentize: {
        Args: { geog: unknown; max_segment_length: number }
        Returns: unknown
      }
      st_setsrid:
        | { Args: { geog: unknown; srid: number }; Returns: unknown }
        | { Args: { geom: unknown; srid: number }; Returns: unknown }
      st_sharedpaths: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_shortestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_simplifypolygonhull: {
        Args: { geom: unknown; is_outer?: boolean; vertex_fraction: number }
        Returns: unknown
      }
      st_split: { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
      st_square: {
        Args: { cell_i: number; cell_j: number; origin?: unknown; size: number }
        Returns: unknown
      }
      st_squaregrid: {
        Args: { bounds: unknown; size: number }
        Returns: Record<string, unknown>[]
      }
      st_srid:
        | { Args: { geog: unknown }; Returns: number }
        | { Args: { geom: unknown }; Returns: number }
      st_subdivide: {
        Args: { geom: unknown; gridsize?: number; maxvertices?: number }
        Returns: unknown[]
      }
      st_swapordinates: {
        Args: { geom: unknown; ords: unknown }
        Returns: unknown
      }
      st_symdifference: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_symmetricdifference: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_tileenvelope: {
        Args: {
          bounds?: unknown
          margin?: number
          x: number
          y: number
          zoom: number
        }
        Returns: unknown
      }
      st_touches: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_transform:
        | {
            Args: { from_proj: string; geom: unknown; to_proj: string }
            Returns: unknown
          }
        | {
            Args: { from_proj: string; geom: unknown; to_srid: number }
            Returns: unknown
          }
        | { Args: { geom: unknown; to_proj: string }; Returns: unknown }
      st_triangulatepolygon: { Args: { g1: unknown }; Returns: unknown }
      st_union:
        | { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
        | {
            Args: { geom1: unknown; geom2: unknown; gridsize: number }
            Returns: unknown
          }
      st_voronoilines: {
        Args: { extend_to?: unknown; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_voronoipolygons: {
        Args: { extend_to?: unknown; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_within: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_wkbtosql: { Args: { wkb: string }; Returns: unknown }
      st_wkttosql: { Args: { "": string }; Returns: unknown }
      st_wrapx: {
        Args: { geom: unknown; move: number; wrap: number }
        Returns: unknown
      }
      toggle_post_like: {
        Args: { target_post_id: string; target_user_id: string }
        Returns: undefined
      }
      unlockrows: { Args: { "": string }; Returns: number }
      updategeometrysrid: {
        Args: {
          catalogn_name: string
          column_name: string
          new_srid_in: number
          schema_name: string
          table_name: string
        }
        Returns: string
      }
    }
    Enums: {
      enrichment_status: "pending" | "processing" | "complete" | "error"
      post_visibility: "public" | "private"
    }
    CompositeTypes: {
      geometry_dump: {
        path: number[] | null
        geom: unknown
      }
      valid_detail: {
        valid: boolean | null
        reason: string | null
        location: unknown
      }
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
      enrichment_status: ["pending", "processing", "complete", "error"],
      post_visibility: ["public", "private"],
    },
  },
} as const
