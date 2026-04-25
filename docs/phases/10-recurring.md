# Fase 10 — Asientos recurrentes

## Goal
Permitir guardar plantillas de asientos (ej: "Pago de renta mensual") y programar su ejecución automática (semanal, mensual, trimestral, anual). Una Edge Function corre diariamente y crea los asientos cuyas plantillas vencieron.

## Prerequisites
- Fase 06 completada (asientos).

## Steps

### 1. CRUD de plantillas

`src/features/templates/api.ts`:
- `listTemplates(bookId)` con sus líneas y schedule asociado.
- `createTemplate(input)` → inserta `templates` y `template_lines`.
- `updateTemplate(id, input)`.
- `deleteTemplate(id)`.
- `setSchedule(templateId, { frequency, next_run_date, end_date })` → upsert en `recurring_schedules`.
- `clearSchedule(templateId)` → deactivate.
- `runNow(templateId)` → genera el asiento ya, sin esperar.

### 2. Función SQL para procesar una plantilla

Genera con `supabase migration new recurring_functions` y agrega:

```sql
CREATE OR REPLACE FUNCTION run_template(p_template_id UUID, p_entry_date DATE)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_template templates%ROWTYPE;
  v_lines JSONB;
BEGIN
  SELECT * INTO v_template FROM templates WHERE id = p_template_id;

  SELECT jsonb_agg(jsonb_build_object(
    'account_id', account_id,
    'debit', debit,
    'credit', credit,
    'memo', memo
  ) ORDER BY position)
  INTO v_lines
  FROM template_lines WHERE template_id = p_template_id;

  RETURN create_journal_entry(
    v_template.book_id, p_entry_date,
    '[Recurrente] ' || v_template.name,
    NULL, v_template.currency_code, 1, v_lines
  );
END;
$$;
```

### 3. Función de procesamiento batch

```sql
CREATE OR REPLACE FUNCTION process_due_recurring()
RETURNS INT LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  r RECORD;
  v_count INT := 0;
  v_next DATE;
BEGIN
  FOR r IN
    SELECT s.*, t.book_id
    FROM recurring_schedules s
    JOIN templates t ON t.id = s.template_id
    WHERE s.active AND s.next_run_date <= CURRENT_DATE
      AND (s.end_date IS NULL OR s.next_run_date <= s.end_date)
  LOOP
    PERFORM run_template(r.template_id, r.next_run_date);

    -- calcular próxima fecha
    v_next := CASE r.frequency
      WHEN 'weekly'    THEN r.next_run_date + INTERVAL '1 week'
      WHEN 'monthly'   THEN r.next_run_date + INTERVAL '1 month'
      WHEN 'quarterly' THEN r.next_run_date + INTERVAL '3 months'
      WHEN 'yearly'    THEN r.next_run_date + INTERVAL '1 year'
    END;

    UPDATE recurring_schedules
      SET next_run_date = v_next,
          active = (r.end_date IS NULL OR v_next <= r.end_date)
      WHERE id = r.id;

    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$;
```

### 4. Edge Function

`supabase/functions/process-recurring/index.ts`:

```ts
import { createClient } from 'jsr:@supabase/supabase-js@2';

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );
  const { data, error } = await supabase.rpc('process_due_recurring');
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  return new Response(JSON.stringify({ processed: data }), { headers: { 'content-type': 'application/json' } });
});
```

Despliega:
```bash
supabase functions deploy process-recurring
```

### 5. pg_cron diario

En Supabase Dashboard → Database → Extensions, habilita `pg_cron`. Luego en SQL Editor:

```sql
SELECT cron.schedule(
  'process-recurring-daily',
  '0 6 * * *',  -- 06:00 UTC todos los días
  $$
  SELECT net.http_post(
    url:='https://<project-ref>.supabase.co/functions/v1/process-recurring',
    headers:=jsonb_build_object('Authorization', 'Bearer ' || current_setting('app.cron_secret'))
  );
  $$
);
```

> Necesita la extensión `pg_net`. El `app.cron_secret` lo configuras como `service_role` key vía `ALTER DATABASE postgres SET app.cron_secret = '...'`.

Alternativa más simple si pg_cron complica: usa **GitHub Actions** o **Vercel Cron** apuntando al endpoint público de la Edge Function (con header de seguridad).

### 6. UI

#### Lista `src/pages/templates/TemplatesPage.tsx`
- Cards: nombre, descripción, próxima ejecución, frecuencia.
- Acciones: editar, ejecutar ahora, pausar/activar, borrar.

#### Form `src/pages/templates/TemplateFormPage.tsx`
- Reutiliza `JournalEntryForm` pero sin `entry_date` (el monto y cuentas son la plantilla).
- Sección "Programar":
  - Switch "Activar recurrencia"
  - Si activo: select de frecuencia, date picker de próxima ejecución, date picker opcional de fecha fin.

### 7. Filtro en listado de asientos

En la lista de asientos generados por recurrentes, marcarlos visualmente (badge "Recurrente") detectando el prefijo `[Recurrente]` en `description` — o agregar un campo `template_id` opcional a `journal_entries` (recomendado para joins limpios).

> Si vas a agregar `template_id`: nueva migration que añade la columna y FK, actualiza `run_template` para setearla.

## Files created/modified

- `supabase/migrations/<timestamp>_recurring_functions.sql`
- `supabase/functions/process-recurring/index.ts`
- `src/features/templates/api.ts`
- `src/features/templates/components/{TemplateCard,ScheduleConfig}.tsx`
- `src/pages/templates/{Templates,TemplateForm}Page.tsx`
- `src/routes/index.tsx`
- (Opcional) `supabase/migrations/<timestamp>_journal_template_link.sql`

## Verification

1. Crear template "Renta mensual": Gastos operativos 800 / Caja 800.
2. Configurar schedule mensual con próxima ejecución = ayer.
3. Ejecutar manualmente la Edge Function (`curl https://<ref>.supabase.co/functions/v1/process-recurring -H "Authorization: Bearer <service-role>"`) → respuesta `{ processed: 1 }`.
4. Verificar en `/journal` que aparece el asiento "[Recurrente] Renta mensual" con la fecha de ayer.
5. Verificar que `next_run_date` avanzó un mes.
6. Probar "Ejecutar ahora" desde la UI → genera asiento extra.
7. Programar recurrencia con `end_date` en el pasado → no se ejecuta.

## Definition of Done

- [ ] Los 7 escenarios pasan.
- [ ] La Edge Function deployada y respondiendo.
- [ ] El cron diario configurado (o método alternativo documentado).
- [ ] Commit: `feat(phase-10): asientos recurrentes con plantillas y ejecución automática`.

## Notas

- Esta fase es **post-MVP** (puede saltarse para publicar antes).
- Si la app no se abre en días, la próxima vez la Edge Function generará todos los asientos pendientes en una sola corrida.
- Considera enviar notificación push o email cuando se generan asientos recurrentes (post-MVP).
