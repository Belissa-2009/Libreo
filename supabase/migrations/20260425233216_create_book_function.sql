CREATE OR REPLACE FUNCTION create_book(p_name TEXT, p_base_currency TEXT)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_book_id UUID;
BEGIN
  INSERT INTO books (name, base_currency, owner_id)
  VALUES (p_name, p_base_currency, auth.uid())
  RETURNING id INTO v_book_id;

  INSERT INTO book_members (book_id, user_id, role)
  VALUES (v_book_id, auth.uid(), 'admin');

  RETURN v_book_id;
END;
$$;
