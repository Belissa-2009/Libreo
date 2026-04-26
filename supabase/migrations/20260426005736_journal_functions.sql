CREATE OR REPLACE FUNCTION create_journal_entry(
  p_book_id UUID,
  p_entry_date DATE,
  p_description TEXT,
  p_reference TEXT,
  p_currency_code TEXT,
  p_exchange_rate NUMERIC,
  p_lines JSONB
) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_entry_id UUID;
  v_line JSONB;
  v_pos INT := 0;
BEGIN
  IF NOT is_book_member(p_book_id, ARRAY['admin','editor']::member_role[]) THEN
    RAISE EXCEPTION 'Sin permisos para crear asientos en este libro';
  END IF;

  INSERT INTO journal_entries (book_id, entry_date, description, reference, currency_code, exchange_rate, created_by)
  VALUES (p_book_id, p_entry_date, p_description, p_reference, p_currency_code, p_exchange_rate, auth.uid())
  RETURNING id INTO v_entry_id;

  FOR v_line IN SELECT * FROM jsonb_array_elements(p_lines) LOOP
    v_pos := v_pos + 1;
    INSERT INTO journal_lines (entry_id, account_id, debit, credit, memo, position)
    VALUES (
      v_entry_id,
      (v_line->>'account_id')::UUID,
      COALESCE((v_line->>'debit')::NUMERIC, 0),
      COALESCE((v_line->>'credit')::NUMERIC, 0),
      v_line->>'memo',
      v_pos
    );
  END LOOP;

  RETURN v_entry_id;
END;
$$;

CREATE OR REPLACE FUNCTION update_journal_entry(
  p_entry_id UUID,
  p_entry_date DATE,
  p_description TEXT,
  p_reference TEXT,
  p_currency_code TEXT,
  p_exchange_rate NUMERIC,
  p_lines JSONB
) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_book_id UUID;
  v_line JSONB;
  v_pos INT := 0;
BEGIN
  SELECT book_id INTO v_book_id FROM journal_entries WHERE id = p_entry_id;
  IF v_book_id IS NULL THEN
    RAISE EXCEPTION 'Asiento no encontrado';
  END IF;

  IF NOT is_book_member(v_book_id, ARRAY['admin','editor']::member_role[]) THEN
    RAISE EXCEPTION 'Sin permisos para editar asientos en este libro';
  END IF;

  UPDATE journal_entries
  SET entry_date = p_entry_date,
      description = p_description,
      reference = p_reference,
      currency_code = p_currency_code,
      exchange_rate = p_exchange_rate
  WHERE id = p_entry_id;

  DELETE FROM journal_lines WHERE entry_id = p_entry_id;

  FOR v_line IN SELECT * FROM jsonb_array_elements(p_lines) LOOP
    v_pos := v_pos + 1;
    INSERT INTO journal_lines (entry_id, account_id, debit, credit, memo, position)
    VALUES (
      p_entry_id,
      (v_line->>'account_id')::UUID,
      COALESCE((v_line->>'debit')::NUMERIC, 0),
      COALESCE((v_line->>'credit')::NUMERIC, 0),
      v_line->>'memo',
      v_pos
    );
  END LOOP;
END;
$$;
