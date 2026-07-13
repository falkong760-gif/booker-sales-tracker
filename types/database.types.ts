// Supabase Database Type Definitions
// TODO: Generate real database types from schema in Phase 2

export type Database = {
  public: {
    Tables: {
      entries: {
        Row: {
          id: string;
          created_at: string;
          booker_id: string;
          amount_sale: number;
          amount_deposit: number;
          status: 'pending' | 'reconciled';
        };
        Insert: {
          id?: string;
          created_at?: string;
          booker_id: string;
          amount_sale: number;
          amount_deposit: number;
          status?: 'pending' | 'reconciled';
        };
        Update: {
          id?: string;
          created_at?: string;
          booker_id?: string;
          amount_sale?: number;
          amount_deposit?: number;
          status?: 'pending' | 'reconciled';
        };
      };
    };
  };
};
