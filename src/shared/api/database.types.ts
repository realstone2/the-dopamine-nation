// Supabase DB 타입 정의 (수동 작성, 추후 supabase gen types로 자동 생성 가능)

export interface Database {
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
      };
      station_members: {
        Row: {
          station_id: string;
          user_id: string;
          role: 'owner' | 'member';
          joined_at: string;
        };
        Insert: {
          station_id: string;
          user_id: string;
          role?: 'owner' | 'member';
          joined_at?: string;
        };
        Update: {
          station_id?: string;
          user_id?: string;
          role?: 'owner' | 'member';
          joined_at?: string;
        };
      };
      game_types: {
        Row: {
          id: number;
          name: string;
          slug: string;
          description: string | null;
          config: Record<string, unknown>;
        };
        Insert: {
          id?: number;
          name: string;
          slug: string;
          description?: string | null;
          config?: Record<string, unknown>;
        };
        Update: {
          id?: number;
          name?: string;
          slug?: string;
          description?: string | null;
          config?: Record<string, unknown>;
        };
      };
      game_sessions: {
        Row: {
          id: string;
          station_id: string;
          game_type_id: number;
          bet_amount: number;
          status: 'pending' | 'playing' | 'completed';
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          station_id: string;
          game_type_id: number;
          bet_amount: number;
          status?: 'pending' | 'playing' | 'completed';
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          station_id?: string;
          game_type_id?: number;
          bet_amount?: number;
          status?: 'pending' | 'playing' | 'completed';
          created_by?: string | null;
          created_at?: string;
        };
      };
      game_participants: {
        Row: {
          id: string;
          session_id: string;
          user_id: string;
          result: 'win' | 'lose' | null;
          dopamine_change: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          user_id: string;
          result?: 'win' | 'lose' | null;
          dopamine_change?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          user_id?: string;
          result?: 'win' | 'lose' | null;
          dopamine_change?: number;
          created_at?: string;
        };
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
      };
    };
  };
}
