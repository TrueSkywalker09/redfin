-- ============================================
-- REDFIN — Migrate 00005: household_id em installments
-- Adiciona household_id para Realtime + RLS direta
-- Execute no SQL Editor do Supabase Dashboard
-- ============================================

-- 1. Adicionar coluna household_id (nullable inicialmente)
ALTER TABLE public.installments
ADD COLUMN IF NOT EXISTS household_id UUID;

-- 2. Popular registros existentes via JOIN com credit_cards
UPDATE public.installments i
SET household_id = cc.household_id
FROM public.credit_cards cc
WHERE cc.id = i.card_id
  AND i.household_id IS NULL;

-- 3. Alterar para NOT NULL (após popular)
ALTER TABLE public.installments
ALTER COLUMN household_id SET NOT NULL;

-- 4. Adicionar foreign key
ALTER TABLE public.installments
ADD CONSTRAINT fk_installments_household
FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE;

-- 5. Índice para performance e Realtime
CREATE INDEX IF NOT EXISTS idx_installments_household
ON public.installments(household_id);

-- 6. Atualizar política RLS para usar household_id direto
DROP POLICY IF EXISTS "Parcelas são filtradas por household" ON public.installments;
CREATE POLICY "Parcelas são filtradas por household"
  ON public.installments FOR ALL
  USING (household_id = get_household_id());

-- 7. Garantir permissões
GRANT ALL ON public.installments TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;

-- 8. Comentário
COMMENT ON COLUMN public.installments.household_id IS 'Adicionado para suporte a Realtime subscriptions e RLS direta sem JOIN.';
