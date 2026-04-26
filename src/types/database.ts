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
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
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
      accounts: {
        Row: {
          book_id: string
          code: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          parent_id: string | null
          type: Database["public"]["Enums"]["account_type"]
        }
        Insert: {
          book_id: string
          code: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          parent_id?: string | null
          type: Database["public"]["Enums"]["account_type"]
        }
        Update: {
          book_id?: string
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          parent_id?: string | null
          type?: Database["public"]["Enums"]["account_type"]
        }
        Relationships: [
          {
            foreignKeyName: "accounts_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounts_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounts_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "v_trial_balance"
            referencedColumns: ["account_id"]
          },
        ]
      }
      book_members: {
        Row: {
          book_id: string
          joined_at: string
          role: Database["public"]["Enums"]["member_role"]
          user_id: string
        }
        Insert: {
          book_id: string
          joined_at?: string
          role: Database["public"]["Enums"]["member_role"]
          user_id: string
        }
        Update: {
          book_id?: string
          joined_at?: string
          role?: Database["public"]["Enums"]["member_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "book_members_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "book_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      books: {
        Row: {
          base_currency: string
          created_at: string
          id: string
          name: string
          owner_id: string
        }
        Insert: {
          base_currency?: string
          created_at?: string
          id?: string
          name: string
          owner_id: string
        }
        Update: {
          base_currency?: string
          created_at?: string
          id?: string
          name?: string
          owner_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "books_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      currencies: {
        Row: {
          code: string
          name: string
          symbol: string
        }
        Insert: {
          code: string
          name: string
          symbol: string
        }
        Update: {
          code?: string
          name?: string
          symbol?: string
        }
        Relationships: []
      }
      exchange_rates: {
        Row: {
          book_id: string
          from_currency: string
          rate: number
          rate_date: string
          to_currency: string
        }
        Insert: {
          book_id: string
          from_currency: string
          rate: number
          rate_date: string
          to_currency: string
        }
        Update: {
          book_id?: string
          from_currency?: string
          rate?: number
          rate_date?: string
          to_currency?: string
        }
        Relationships: [
          {
            foreignKeyName: "exchange_rates_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exchange_rates_from_currency_fkey"
            columns: ["from_currency"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "exchange_rates_to_currency_fkey"
            columns: ["to_currency"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["code"]
          },
        ]
      }
      invitations: {
        Row: {
          accepted_at: string | null
          book_id: string
          created_at: string
          email: string
          expires_at: string
          id: string
          role: Database["public"]["Enums"]["member_role"]
          token: string
        }
        Insert: {
          accepted_at?: string | null
          book_id: string
          created_at?: string
          email: string
          expires_at: string
          id?: string
          role: Database["public"]["Enums"]["member_role"]
          token: string
        }
        Update: {
          accepted_at?: string | null
          book_id?: string
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          role?: Database["public"]["Enums"]["member_role"]
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "invitations_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_entries: {
        Row: {
          book_id: string
          created_at: string
          created_by: string
          currency_code: string
          description: string
          entry_date: string
          exchange_rate: number
          id: string
          reference: string | null
        }
        Insert: {
          book_id: string
          created_at?: string
          created_by: string
          currency_code: string
          description: string
          entry_date: string
          exchange_rate?: number
          id?: string
          reference?: string | null
        }
        Update: {
          book_id?: string
          created_at?: string
          created_by?: string
          currency_code?: string
          description?: string
          entry_date?: string
          exchange_rate?: number
          id?: string
          reference?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "journal_entries_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_entries_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_entries_currency_code_fkey"
            columns: ["currency_code"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["code"]
          },
        ]
      }
      journal_lines: {
        Row: {
          account_id: string
          credit: number
          debit: number
          entry_id: string
          id: string
          memo: string | null
          position: number
        }
        Insert: {
          account_id: string
          credit?: number
          debit?: number
          entry_id: string
          id?: string
          memo?: string | null
          position: number
        }
        Update: {
          account_id?: string
          credit?: number
          debit?: number
          entry_id?: string
          id?: string
          memo?: string | null
          position?: number
        }
        Relationships: [
          {
            foreignKeyName: "journal_lines_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_lines_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "v_trial_balance"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "journal_lines_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      loan_payments: {
        Row: {
          amount: number
          applied_to_installment_id: string | null
          created_at: string
          created_by: string
          id: string
          journal_entry_id: string | null
          loan_id: string
          notes: string | null
          payment_date: string
          strategy: Database["public"]["Enums"]["payment_strategy"] | null
          type: Database["public"]["Enums"]["payment_type"]
        }
        Insert: {
          amount: number
          applied_to_installment_id?: string | null
          created_at?: string
          created_by: string
          id?: string
          journal_entry_id?: string | null
          loan_id: string
          notes?: string | null
          payment_date: string
          strategy?: Database["public"]["Enums"]["payment_strategy"] | null
          type: Database["public"]["Enums"]["payment_type"]
        }
        Update: {
          amount?: number
          applied_to_installment_id?: string | null
          created_at?: string
          created_by?: string
          id?: string
          journal_entry_id?: string | null
          loan_id?: string
          notes?: string | null
          payment_date?: string
          strategy?: Database["public"]["Enums"]["payment_strategy"] | null
          type?: Database["public"]["Enums"]["payment_type"]
        }
        Relationships: [
          {
            foreignKeyName: "loan_payments_applied_to_installment_id_fkey"
            columns: ["applied_to_installment_id"]
            isOneToOne: false
            referencedRelation: "loan_schedule"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loan_payments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loan_payments_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loan_payments_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loans"
            referencedColumns: ["id"]
          },
        ]
      }
      loan_schedule: {
        Row: {
          balance_after: number
          due_date: string
          id: string
          installment_number: number
          interest_portion: number
          journal_entry_id: string | null
          loan_id: string
          principal_portion: number
          status: Database["public"]["Enums"]["schedule_status"]
          version: number
        }
        Insert: {
          balance_after: number
          due_date: string
          id?: string
          installment_number: number
          interest_portion: number
          journal_entry_id?: string | null
          loan_id: string
          principal_portion: number
          status?: Database["public"]["Enums"]["schedule_status"]
          version?: number
        }
        Update: {
          balance_after?: number
          due_date?: string
          id?: string
          installment_number?: number
          interest_portion?: number
          journal_entry_id?: string | null
          loan_id?: string
          principal_portion?: number
          status?: Database["public"]["Enums"]["schedule_status"]
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "loan_schedule_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loan_schedule_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loans"
            referencedColumns: ["id"]
          },
        ]
      }
      loans: {
        Row: {
          annual_rate: number
          asset_account_id: string | null
          book_id: string
          cash_account_id: string
          counterparty: string
          created_at: string
          frequency: Database["public"]["Enums"]["loan_frequency"]
          id: string
          interest_account_id: string
          liability_account_id: string | null
          method: Database["public"]["Enums"]["loan_method"]
          notes: string | null
          principal: number
          start_date: string
          term_months: number
          type: Database["public"]["Enums"]["loan_type"]
        }
        Insert: {
          annual_rate: number
          asset_account_id?: string | null
          book_id: string
          cash_account_id: string
          counterparty: string
          created_at?: string
          frequency?: Database["public"]["Enums"]["loan_frequency"]
          id?: string
          interest_account_id: string
          liability_account_id?: string | null
          method?: Database["public"]["Enums"]["loan_method"]
          notes?: string | null
          principal: number
          start_date: string
          term_months: number
          type: Database["public"]["Enums"]["loan_type"]
        }
        Update: {
          annual_rate?: number
          asset_account_id?: string | null
          book_id?: string
          cash_account_id?: string
          counterparty?: string
          created_at?: string
          frequency?: Database["public"]["Enums"]["loan_frequency"]
          id?: string
          interest_account_id?: string
          liability_account_id?: string | null
          method?: Database["public"]["Enums"]["loan_method"]
          notes?: string | null
          principal?: number
          start_date?: string
          term_months?: number
          type?: Database["public"]["Enums"]["loan_type"]
        }
        Relationships: [
          {
            foreignKeyName: "loans_asset_account_id_fkey"
            columns: ["asset_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loans_asset_account_id_fkey"
            columns: ["asset_account_id"]
            isOneToOne: false
            referencedRelation: "v_trial_balance"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "loans_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loans_cash_account_id_fkey"
            columns: ["cash_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loans_cash_account_id_fkey"
            columns: ["cash_account_id"]
            isOneToOne: false
            referencedRelation: "v_trial_balance"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "loans_interest_account_id_fkey"
            columns: ["interest_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loans_interest_account_id_fkey"
            columns: ["interest_account_id"]
            isOneToOne: false
            referencedRelation: "v_trial_balance"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "loans_liability_account_id_fkey"
            columns: ["liability_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loans_liability_account_id_fkey"
            columns: ["liability_account_id"]
            isOneToOne: false
            referencedRelation: "v_trial_balance"
            referencedColumns: ["account_id"]
          },
        ]
      }
      periods: {
        Row: {
          book_id: string
          closed_at: string | null
          closed_by: string | null
          month: number
          status: Database["public"]["Enums"]["period_status"]
          year: number
        }
        Insert: {
          book_id: string
          closed_at?: string | null
          closed_by?: string | null
          month: number
          status?: Database["public"]["Enums"]["period_status"]
          year: number
        }
        Update: {
          book_id?: string
          closed_at?: string | null
          closed_by?: string | null
          month?: number
          status?: Database["public"]["Enums"]["period_status"]
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "periods_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "periods_closed_by_fkey"
            columns: ["closed_by"]
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
          full_name: string
          id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name: string
          id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          id?: string
        }
        Relationships: []
      }
      recurring_schedules: {
        Row: {
          active: boolean
          created_at: string
          end_date: string | null
          frequency: Database["public"]["Enums"]["recurring_frequency"]
          id: string
          next_run_date: string
          template_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          end_date?: string | null
          frequency: Database["public"]["Enums"]["recurring_frequency"]
          id?: string
          next_run_date: string
          template_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          end_date?: string | null
          frequency?: Database["public"]["Enums"]["recurring_frequency"]
          id?: string
          next_run_date?: string
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recurring_schedules_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "templates"
            referencedColumns: ["id"]
          },
        ]
      }
      template_lines: {
        Row: {
          account_id: string
          credit: number
          debit: number
          id: string
          memo: string | null
          position: number
          template_id: string
        }
        Insert: {
          account_id: string
          credit?: number
          debit?: number
          id?: string
          memo?: string | null
          position: number
          template_id: string
        }
        Update: {
          account_id?: string
          credit?: number
          debit?: number
          id?: string
          memo?: string | null
          position?: number
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "template_lines_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "template_lines_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "v_trial_balance"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "template_lines_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "templates"
            referencedColumns: ["id"]
          },
        ]
      }
      templates: {
        Row: {
          book_id: string
          created_at: string
          currency_code: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          book_id: string
          created_at?: string
          currency_code: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          book_id?: string
          created_at?: string
          currency_code?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "templates_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "templates_currency_code_fkey"
            columns: ["currency_code"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["code"]
          },
        ]
      }
    }
    Views: {
      v_ledger: {
        Row: {
          account_id: string | null
          book_id: string | null
          credit: number | null
          debit: number | null
          description: string | null
          entry_date: string | null
          line_id: string | null
          memo: string | null
          reference: string | null
        }
        Relationships: [
          {
            foreignKeyName: "journal_entries_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_lines_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_lines_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "v_trial_balance"
            referencedColumns: ["account_id"]
          },
        ]
      }
      v_trial_balance: {
        Row: {
          account_id: string | null
          balance: number | null
          book_id: string | null
          code: string | null
          name: string | null
          total_credit: number | null
          total_debit: number | null
          type: Database["public"]["Enums"]["account_type"] | null
        }
        Relationships: [
          {
            foreignKeyName: "accounts_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      create_book: {
        Args: { p_base_currency: string; p_name: string }
        Returns: string
      }
      is_book_member: {
        Args: {
          p_book_id: string
          required_roles?: Database["public"]["Enums"]["member_role"][]
        }
        Returns: boolean
      }
      seed_default_accounts: { Args: { p_book_id: string }; Returns: undefined }
    }
    Enums: {
      account_type: "asset" | "liability" | "equity" | "income" | "expense"
      loan_frequency: "monthly" | "biweekly" | "weekly"
      loan_method: "french" | "german" | "american"
      loan_type: "received" | "given"
      member_role: "admin" | "editor" | "viewer"
      payment_strategy: "reduce_term" | "reduce_installment"
      payment_type: "regular" | "extra"
      period_status: "open" | "closed"
      recurring_frequency: "weekly" | "monthly" | "quarterly" | "yearly"
      schedule_status: "pending" | "paid" | "cancelled"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      account_type: ["asset", "liability", "equity", "income", "expense"],
      loan_frequency: ["monthly", "biweekly", "weekly"],
      loan_method: ["french", "german", "american"],
      loan_type: ["received", "given"],
      member_role: ["admin", "editor", "viewer"],
      payment_strategy: ["reduce_term", "reduce_installment"],
      payment_type: ["regular", "extra"],
      period_status: ["open", "closed"],
      recurring_frequency: ["weekly", "monthly", "quarterly", "yearly"],
      schedule_status: ["pending", "paid", "cancelled"],
    },
  },
} as const
