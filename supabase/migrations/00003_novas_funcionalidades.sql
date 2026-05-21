-- ============================================
-- REDFIN — Migrate 00003: Novas Funcionalidades
-- 1. Adicionar start_date em fixed_bills
-- 2. Criar tabela bank_accounts
-- 3. Criar categoria "Desejo/Projeto"
-- ============================================

-- 1. Adicionar start_date em fixed_bills
ALTER TABLE public.fixed_bills
ADD COLUMN IF NOT EXISTS start_date DATE DEFAULT CURRENT_DATE;

COMMENT ON COLUMN public.fixed_bills.start_date IS 'Data a partir da qual a conta começa a aparecer no painel mensal';

-- 2. Criar tabela bank_accounts
CREATE TABLE IF NOT EXISTS public.bank_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID REFERENCES households(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  bank_name TEXT,
  account_type TEXT CHECK (account_type IN ('checking', 'savings', 'investment')),
  account_number TEXT,
  agency_number TEXT,
  color TEXT NOT NULL DEFAULT '#6B7C5C',
  current_balance NUMERIC(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para bank_accounts
CREATE INDEX IF NOT EXISTS idx_bank_accounts_household ON bank_accounts(household_id);

-- RLS para bank_accounts
ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Contas bancárias são filtradas por household" ON bank_accounts;
CREATE POLICY "Contas bancárias são filtradas por household" ON bank_accounts FOR ALL
USING (household_id = get_household_id());

GRANT ALL ON public.bank_accounts TO anon, authenticated, service_role;

-- 3. Criar categoria "Desejo/Projeto" para todos os households
INSERT INTO public.categories (household_id, name, type, color, icon)
SELECT id, 'Desejo/Projeto', 'expense', '#8E44AD', 'target'
FROM public.households
WHERE NOT EXISTS (
  SELECT 1 FROM public.categories
  WHERE household_id = households.id AND name = 'Desejo/Projeto'
);

-- 4. Garantir permissões
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;

COMMENT ON TABLE public.bank_accounts IS 'Contas bancárias do household';
COMMENT ON COLUMN public.bank_accounts.account_type IS 'checking=corrente, savings=poupança, investment=investimento';