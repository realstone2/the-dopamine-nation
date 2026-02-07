// Supabase DB 타입 정의 (수동 작성, 추후 supabase gen types로 자동 생성 가능)

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          kakao_id: string | null;
          nickname: string;
          avatar_url: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          kakao_id?: string | null;
          nickname: string;
          avatar_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          kakao_id?: string | null;
          nickname?: string;
          avatar_url?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      stations: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          image_url: string | null;
          invite_code: string;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          image_url?: string | null;
          invite_code?: string;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          image_url?: string | null;
          invite_code?: string;
          created_by?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'stations_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      station_members: {
        Row: {
          station_id: string;
          user_id: string;
          role: string;
          joined_at: string;
        };
        Insert: {
          station_id: string;
          user_id: string;
          role?: string;
          joined_at?: string;
        };
        Update: {
          station_id?: string;
          user_id?: string;
          role?: string;
          joined_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'station_members_station_id_fkey';
            columns: ['station_id'];
            isOneToOne: false;
            referencedRelation: 'stations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'station_members_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      game_types: {
        Row: {
          id: number;
          name: string;
          slug: string;
          description: string | null;
          config: Json;
        };
        Insert: {
          id?: number;
          name: string;
          slug: string;
          description?: string | null;
          config?: Json;
        };
        Update: {
          id?: number;
          name?: string;
          slug?: string;
          description?: string | null;
          config?: Json;
        };
        Relationships: [];
      };
      game_sessions: {
        Row: {
          id: string;
          station_id: string;
          game_type_id: number;
          bet_amount: number;
          status: string;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          station_id: string;
          game_type_id: number;
          bet_amount: number;
          status?: string;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          station_id?: string;
          game_type_id?: number;
          bet_amount?: number;
          status?: string;
          created_by?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'game_sessions_station_id_fkey';
            columns: ['station_id'];
            isOneToOne: false;
            referencedRelation: 'stations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'game_sessions_game_type_id_fkey';
            columns: ['game_type_id'];
            isOneToOne: false;
            referencedRelation: 'game_types';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'game_sessions_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      game_participants: {
        Row: {
          id: string;
          session_id: string;
          user_id: string;
          result: string | null;
          dopamine_change: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          user_id: string;
          result?: string | null;
          dopamine_change?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          user_id?: string;
          result?: string | null;
          dopamine_change?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'game_participants_session_id_fkey';
            columns: ['session_id'];
            isOneToOne: false;
            referencedRelation: 'game_sessions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'game_participants_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      manual_entries: {
        Row: {
          id: string;
          station_id: string;
          from_user: string;
          to_user: string;
          amount: number;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          station_id: string;
          from_user: string;
          to_user: string;
          amount: number;
          description?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          station_id?: string;
          from_user?: string;
          to_user?: string;
          amount?: number;
          description?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'manual_entries_station_id_fkey';
            columns: ['station_id'];
            isOneToOne: false;
            referencedRelation: 'stations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'manual_entries_from_user_fkey';
            columns: ['from_user'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'manual_entries_to_user_fkey';
            columns: ['to_user'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
