export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      Boards: {
        Row: {
          created_at: string;
          id: number;
          name: string;
          owner: string | null;
        };
        Insert: {
          created_at?: string;
          id?: number;
          name?: string;
          owner?: string | null;
        };
        Update: {
          created_at?: string;
          id?: number;
          name?: string;
          owner?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'public_Boards_owner_fkey';
            columns: ['owner'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      Items: {
        Row: {
          created_at: string;
          deadline: string | null;
          id: number;
          lane: number | null;
          name: string;
        };
        Insert: {
          created_at?: string;
          deadline?: string | null;
          id?: number;
          lane?: number | null;
          name?: string;
        };
        Update: {
          created_at?: string;
          deadline?: string | null;
          id?: number;
          lane?: number | null;
          name?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'public_Items_lane_fkey';
            columns: ['lane'];
            isOneToOne: false;
            referencedRelation: 'Lanes';
            referencedColumns: ['id'];
          },
        ];
      };
      Lanes: {
        Row: {
          board: number | null;
          created_at: string;
          id: number;
          name: string;
        };
        Insert: {
          board?: number | null;
          created_at?: string;
          id?: number;
          name?: string;
        };
        Update: {
          board?: number | null;
          created_at?: string;
          id?: number;
          name?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'public_Lanes_board_fkey';
            columns: ['board'];
            isOneToOne: false;
            referencedRelation: 'Boards';
            referencedColumns: ['id'];
          },
        ];
      };
      Logs: {
        Row: {
          created_at: string;
          id: number;
          item: number | null;
          started_at: string | null;
          stopped_at: string | null;
        };
        Insert: {
          created_at?: string;
          id?: number;
          item?: number | null;
          started_at?: string | null;
          stopped_at?: string | null;
        };
        Update: {
          created_at?: string;
          id?: number;
          item?: number | null;
          started_at?: string | null;
          stopped_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'public_Logs_item_fkey';
            columns: ['item'];
            isOneToOne: false;
            referencedRelation: 'Items';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database['public']['Tables'] & Database['public']['Views'])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions['schema']]['Tables'] &
        Database[PublicTableNameOrOptions['schema']]['Views'])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions['schema']]['Tables'] &
      Database[PublicTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (Database['public']['Tables'] &
        Database['public']['Views'])
    ? (Database['public']['Tables'] &
        Database['public']['Views'])[PublicTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  PublicTableNameOrOptions extends keyof Database['public']['Tables'] | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions['schema']]['Tables']
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof Database['public']['Tables']
    ? Database['public']['Tables'][PublicTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  PublicTableNameOrOptions extends keyof Database['public']['Tables'] | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions['schema']]['Tables']
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof Database['public']['Tables']
    ? Database['public']['Tables'][PublicTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  PublicEnumNameOrOptions extends keyof Database['public']['Enums'] | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions['schema']]['Enums'][EnumName]
  : PublicEnumNameOrOptions extends keyof Database['public']['Enums']
    ? Database['public']['Enums'][PublicEnumNameOrOptions]
    : never;
