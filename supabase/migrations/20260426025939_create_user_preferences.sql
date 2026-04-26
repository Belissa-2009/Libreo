-- Tabla de preferencias del usuario
-- Una fila por usuario; se crea lazily la primera vez que el usuario accede al perfil.
CREATE TABLE user_preferences (
  user_id               UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  default_currency_code TEXT NOT NULL DEFAULT 'DOP' REFERENCES currencies(code),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_preferences_select" ON user_preferences
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "user_preferences_insert" ON user_preferences
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_preferences_update" ON user_preferences
  FOR UPDATE USING (user_id = auth.uid());

-- Actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_user_preferences_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_user_preferences_updated_at();
