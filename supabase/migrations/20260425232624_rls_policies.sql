-- ============================================================
-- HABILITAR RLS
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE book_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE exchange_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE loan_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE loan_payments ENABLE ROW LEVEL SECURITY;
-- currencies queda sin RLS (catálogo público)

-- ============================================================
-- HELPER: is_book_member
-- ============================================================
CREATE OR REPLACE FUNCTION is_book_member(
  p_book_id UUID,
  required_roles member_role[] DEFAULT ARRAY['admin','editor','viewer']::member_role[]
)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM book_members
    WHERE book_id = p_book_id
      AND user_id = auth.uid()
      AND role = ANY(required_roles)
  );
$$;

-- ============================================================
-- POLÍTICAS: profiles
-- ============================================================
CREATE POLICY profiles_select ON profiles FOR SELECT
  USING (
    id = auth.uid()
    OR id IN (
      SELECT user_id FROM book_members
      WHERE book_id IN (
        SELECT book_id FROM book_members WHERE user_id = auth.uid()
      )
    )
  );
CREATE POLICY profiles_update ON profiles FOR UPDATE USING (id = auth.uid());

-- ============================================================
-- POLÍTICAS: books
-- ============================================================
CREATE POLICY books_select ON books FOR SELECT
  USING (id IN (SELECT book_id FROM book_members WHERE user_id = auth.uid()));
CREATE POLICY books_insert ON books FOR INSERT WITH CHECK (owner_id = auth.uid());
CREATE POLICY books_update ON books FOR UPDATE
  USING (is_book_member(id, ARRAY['admin']::member_role[]));
CREATE POLICY books_delete ON books FOR DELETE USING (owner_id = auth.uid());

-- ============================================================
-- POLÍTICAS: book_members
-- ============================================================
CREATE POLICY members_select ON book_members FOR SELECT
  USING (book_id IN (SELECT book_id FROM book_members WHERE user_id = auth.uid()));
CREATE POLICY members_write ON book_members FOR ALL
  USING (is_book_member(book_id, ARRAY['admin']::member_role[]))
  WITH CHECK (is_book_member(book_id, ARRAY['admin']::member_role[]));

-- ============================================================
-- POLÍTICAS: invitations
-- ============================================================
CREATE POLICY invitations_select ON invitations FOR SELECT
  USING (is_book_member(book_id));
CREATE POLICY invitations_write ON invitations FOR ALL
  USING (is_book_member(book_id, ARRAY['admin']::member_role[]))
  WITH CHECK (is_book_member(book_id, ARRAY['admin']::member_role[]));

-- ============================================================
-- POLÍTICAS: exchange_rates
-- ============================================================
CREATE POLICY exchange_rates_select ON exchange_rates FOR SELECT
  USING (is_book_member(book_id));
CREATE POLICY exchange_rates_write ON exchange_rates FOR ALL
  USING (is_book_member(book_id, ARRAY['admin','editor']::member_role[]))
  WITH CHECK (is_book_member(book_id, ARRAY['admin','editor']::member_role[]));

-- ============================================================
-- POLÍTICAS: accounts
-- ============================================================
CREATE POLICY accounts_select ON accounts FOR SELECT
  USING (is_book_member(book_id));
CREATE POLICY accounts_write ON accounts FOR ALL
  USING (is_book_member(book_id, ARRAY['admin','editor']::member_role[]))
  WITH CHECK (is_book_member(book_id, ARRAY['admin','editor']::member_role[]));

-- ============================================================
-- POLÍTICAS: periods
-- ============================================================
CREATE POLICY periods_select ON periods FOR SELECT
  USING (is_book_member(book_id));
CREATE POLICY periods_write ON periods FOR ALL
  USING (is_book_member(book_id, ARRAY['admin']::member_role[]))
  WITH CHECK (is_book_member(book_id, ARRAY['admin']::member_role[]));

-- ============================================================
-- POLÍTICAS: journal_entries
-- ============================================================
CREATE POLICY journal_entries_select ON journal_entries FOR SELECT
  USING (is_book_member(book_id));
CREATE POLICY journal_entries_write ON journal_entries FOR ALL
  USING (is_book_member(book_id, ARRAY['admin','editor']::member_role[]))
  WITH CHECK (is_book_member(book_id, ARRAY['admin','editor']::member_role[]));

-- ============================================================
-- POLÍTICAS: journal_lines (sin book_id directo)
-- ============================================================
CREATE POLICY journal_lines_select ON journal_lines FOR SELECT
  USING (
    entry_id IN (
      SELECT id FROM journal_entries WHERE is_book_member(book_id)
    )
  );
CREATE POLICY journal_lines_write ON journal_lines FOR ALL
  USING (
    entry_id IN (
      SELECT id FROM journal_entries
      WHERE is_book_member(book_id, ARRAY['admin','editor']::member_role[])
    )
  )
  WITH CHECK (
    entry_id IN (
      SELECT id FROM journal_entries
      WHERE is_book_member(book_id, ARRAY['admin','editor']::member_role[])
    )
  );

-- ============================================================
-- POLÍTICAS: templates
-- ============================================================
CREATE POLICY templates_select ON templates FOR SELECT
  USING (is_book_member(book_id));
CREATE POLICY templates_write ON templates FOR ALL
  USING (is_book_member(book_id, ARRAY['admin','editor']::member_role[]))
  WITH CHECK (is_book_member(book_id, ARRAY['admin','editor']::member_role[]));

-- ============================================================
-- POLÍTICAS: template_lines
-- ============================================================
CREATE POLICY template_lines_select ON template_lines FOR SELECT
  USING (
    template_id IN (
      SELECT id FROM templates WHERE is_book_member(book_id)
    )
  );
CREATE POLICY template_lines_write ON template_lines FOR ALL
  USING (
    template_id IN (
      SELECT id FROM templates
      WHERE is_book_member(book_id, ARRAY['admin','editor']::member_role[])
    )
  )
  WITH CHECK (
    template_id IN (
      SELECT id FROM templates
      WHERE is_book_member(book_id, ARRAY['admin','editor']::member_role[])
    )
  );

-- ============================================================
-- POLÍTICAS: recurring_schedules
-- ============================================================
CREATE POLICY recurring_schedules_select ON recurring_schedules FOR SELECT
  USING (
    template_id IN (
      SELECT id FROM templates WHERE is_book_member(book_id)
    )
  );
CREATE POLICY recurring_schedules_write ON recurring_schedules FOR ALL
  USING (
    template_id IN (
      SELECT id FROM templates
      WHERE is_book_member(book_id, ARRAY['admin','editor']::member_role[])
    )
  )
  WITH CHECK (
    template_id IN (
      SELECT id FROM templates
      WHERE is_book_member(book_id, ARRAY['admin','editor']::member_role[])
    )
  );

-- ============================================================
-- POLÍTICAS: loans
-- ============================================================
CREATE POLICY loans_select ON loans FOR SELECT
  USING (is_book_member(book_id));
CREATE POLICY loans_write ON loans FOR ALL
  USING (is_book_member(book_id, ARRAY['admin','editor']::member_role[]))
  WITH CHECK (is_book_member(book_id, ARRAY['admin','editor']::member_role[]));

-- ============================================================
-- POLÍTICAS: loan_schedule
-- ============================================================
CREATE POLICY loan_schedule_select ON loan_schedule FOR SELECT
  USING (
    loan_id IN (
      SELECT id FROM loans WHERE is_book_member(book_id)
    )
  );
CREATE POLICY loan_schedule_write ON loan_schedule FOR ALL
  USING (
    loan_id IN (
      SELECT id FROM loans
      WHERE is_book_member(book_id, ARRAY['admin','editor']::member_role[])
    )
  )
  WITH CHECK (
    loan_id IN (
      SELECT id FROM loans
      WHERE is_book_member(book_id, ARRAY['admin','editor']::member_role[])
    )
  );

-- ============================================================
-- POLÍTICAS: loan_payments
-- ============================================================
CREATE POLICY loan_payments_select ON loan_payments FOR SELECT
  USING (
    loan_id IN (
      SELECT id FROM loans WHERE is_book_member(book_id)
    )
  );
CREATE POLICY loan_payments_write ON loan_payments FOR ALL
  USING (
    loan_id IN (
      SELECT id FROM loans
      WHERE is_book_member(book_id, ARRAY['admin','editor']::member_role[])
    )
  )
  WITH CHECK (
    loan_id IN (
      SELECT id FROM loans
      WHERE is_book_member(book_id, ARRAY['admin','editor']::member_role[])
    )
  );
