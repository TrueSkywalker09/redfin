-- ============================================
-- REDFIN — Migrate 00004: Funcionalidades
-- 1. Novas colunas em transactions
-- 2. Categoria "Ajuste de Saldo"
-- ============================================

-- 1. Adicionar colunas em transactions
ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS bank_account_id UUID REFERENCES bank_accounts(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS installment_id UUID REFERENCES installments(id) ON DELETE SET NULL;

-- 2. Criar categoria "Ajuste de Saldo" para todos os households
INSERT INTO public.categories (household_id, name, type, color, icon)
SELECT id, 'Ajuste de Saldo', 'both', '#7A7875', 'sliders'
FROM public.households
WHERE NOT EXISTS (
  SELECT 1 FROM public.categories
  WHERE household_id = households.id AND name = 'Ajuste de Saldo'
);

-- 3. Índices para performance
CREATE INDEX IF NOT EXISTS idx_transactions_bank_account ON transactions(bank_account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_installment ON transactions(installment_id);

-- 4. Garantir permissões
GRANT ALL ON public.transactions TO anon, authenticated, service_role;
GRANT ALL ON public.categories TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;

-- 5. Comentários para documentação
COMMENT ON COLUMN public.transactions.bank_account_id IS 'Conta bancária relacionada à transação';
COMMENT ON COLUMN public.transactions.installment_id IS 'Parcela de cartão de crédito vinculada (pagamento)';