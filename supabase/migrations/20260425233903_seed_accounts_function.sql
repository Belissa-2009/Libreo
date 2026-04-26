CREATE OR REPLACE FUNCTION seed_default_accounts(p_book_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_activo UUID; v_pasivo UUID; v_patrimonio UUID; v_ingresos UUID; v_gastos UUID;
  v_corriente UUID; v_no_corriente UUID;
BEGIN
  -- Activo
  INSERT INTO accounts (book_id, code, name, type) VALUES (p_book_id, '1', 'Activo', 'asset') RETURNING id INTO v_activo;
  INSERT INTO accounts (book_id, code, name, type, parent_id) VALUES (p_book_id, '1.1', 'Activo Corriente', 'asset', v_activo) RETURNING id INTO v_corriente;
  INSERT INTO accounts (book_id, code, name, type, parent_id) VALUES
    (p_book_id, '1.1.1', 'Caja', 'asset', v_corriente),
    (p_book_id, '1.1.2', 'Banco', 'asset', v_corriente),
    (p_book_id, '1.1.3', 'Cuentas por cobrar', 'asset', v_corriente);
  INSERT INTO accounts (book_id, code, name, type, parent_id) VALUES (p_book_id, '1.2', 'Activo No Corriente', 'asset', v_activo) RETURNING id INTO v_no_corriente;
  INSERT INTO accounts (book_id, code, name, type, parent_id) VALUES
    (p_book_id, '1.2.1', 'Mobiliario y equipo', 'asset', v_no_corriente);

  -- Pasivo
  INSERT INTO accounts (book_id, code, name, type) VALUES (p_book_id, '2', 'Pasivo', 'liability') RETURNING id INTO v_pasivo;
  INSERT INTO accounts (book_id, code, name, type, parent_id) VALUES
    (p_book_id, '2.1', 'Cuentas por pagar', 'liability', v_pasivo),
    (p_book_id, '2.2', 'Préstamos por pagar', 'liability', v_pasivo);

  -- Patrimonio
  INSERT INTO accounts (book_id, code, name, type) VALUES (p_book_id, '3', 'Patrimonio', 'equity') RETURNING id INTO v_patrimonio;
  INSERT INTO accounts (book_id, code, name, type, parent_id) VALUES
    (p_book_id, '3.1', 'Capital', 'equity', v_patrimonio),
    (p_book_id, '3.2', 'Resultados acumulados', 'equity', v_patrimonio);

  -- Ingresos
  INSERT INTO accounts (book_id, code, name, type) VALUES (p_book_id, '4', 'Ingresos', 'income') RETURNING id INTO v_ingresos;
  INSERT INTO accounts (book_id, code, name, type, parent_id) VALUES
    (p_book_id, '4.1', 'Ingresos por servicios', 'income', v_ingresos),
    (p_book_id, '4.2', 'Otros ingresos', 'income', v_ingresos);

  -- Gastos
  INSERT INTO accounts (book_id, code, name, type) VALUES (p_book_id, '5', 'Gastos', 'expense') RETURNING id INTO v_gastos;
  INSERT INTO accounts (book_id, code, name, type, parent_id) VALUES
    (p_book_id, '5.1', 'Gastos operativos', 'expense', v_gastos),
    (p_book_id, '5.2', 'Gastos por intereses', 'expense', v_gastos),
    (p_book_id, '5.3', 'Sueldos y salarios', 'expense', v_gastos),
    (p_book_id, '5.4', 'Servicios públicos', 'expense', v_gastos);
END;
$$;

-- Update create_book to also seed default accounts
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

  PERFORM seed_default_accounts(v_book_id);

  RETURN v_book_id;
END;
$$;
