-- ============================================
-- REDFIN — Migrate 00002: Correções Críticas e Médias
-- Execute no SQL Editor do Supabase Dashboard
-- ============================================

-- 1. CRÍTICA: Modificar trigger para criar household + categorias automaticamente no signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  new_household_id UUID;
BEGIN
  -- Criar household para o novo usuário
  INSERT INTO public.households (name)
  VALUES (
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.email
    ) || '''s Family'
  )
  RETURNING id INTO new_household_id;

  -- Criar perfil vinculado ao household e com nome
  INSERT INTO public.profiles (id, household_id, full_name)
  VALUES (
    NEW.id,
    new_household_id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  );

  -- Inserir categorias padrão para o novo household
  INSERT INTO public.categories (household_id, name, type, color, icon)
  SELECT new_household_id, name, type, color, icon
  FROM (VALUES
    ('Alimentação', 'both', '#D4860A', 'utensils'),
    ('Transporte', 'both', '#5B6E8C', 'car'),
    ('Saúde', 'expense', '#C0392B', 'heart'),
    ('Lazer', 'expense', '#8E44AD', 'gamepad'),
    ('Educação', 'expense', '#2980B9', 'book'),
    ('Moradia', 'expense', '#6B7C5C', 'home'),
    ('Vestuário', 'expense', '#E67E22', 'shirt'),
    ('Salário', 'income', '#2E7D5E', 'briefcase'),
    ('Freelance', 'income', '#16A085', 'laptop'),
    ('Investimentos', 'income', '#27AE60', 'trending-up'),
    ('Outros', 'both', '#7A7875', 'more-horizontal')
  ) AS defaults(name, type, color, icon);

  RETURN NEW;
END;
$$;

-- Recriar trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 2. MÉDIA: Adicionar household_id na tabela fixed_bill_payments para segurança extra
ALTER TABLE public.fixed_bill_payments
ADD COLUMN IF NOT EXISTS household_id UUID;

-- Atualizar registros existentes com household_id via join
UPDATE public.fixed_bill_payments fbp
SET household_id = fb.household_id
FROM public.fixed_bills fb
WHERE fb.id = fbp.fixed_bill_id
  AND fbp.household_id IS NULL;

-- Criar índice para household_id
CREATE INDEX IF NOT EXISTS idx_fixed_bill_payments_household
ON public.fixed_bill_payments(household_id);

-- Criar índice para fixed_bill_id (foreign key lookup)
CREATE INDEX IF NOT EXISTS idx_fixed_bill_payments_fixed_bill
ON public.fixed_bill_payments(fixed_bill_id);

-- Atualizar RLS policy para fixed_bill_payments com household_id direto
DROP POLICY IF EXISTS "Pagamentos são filtrados por household" ON fixed_bill_payments;
CREATE POLICY "Pagamentos são filtrados por household"
  ON fixed_bill_payments FOR ALL
  USING (household_id = get_household_id());

-- 3. Garantir que todas as permissões estão aplicadas
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;

-- 4. Comentários para documentação
COMMENT ON FUNCTION public.handle_new_user() IS 'Trigger que cria household, perfil e categorias padrão para novos usuários.';
COMMENT ON COLUMN public.fixed_bill_payments.household_id IS 'Adicionado para segurança extra - permite RLS direto sem depender de join com fixed_bills.';