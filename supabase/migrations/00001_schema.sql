-- ============================================
-- REDFIN — Schema Completo
-- Pode executar múltiplas vezes sem erro
-- ============================================

-- Extensão necessária
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Famílias/Casais
CREATE TABLE IF NOT EXISTS households (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Perfis de usuário (vinculado ao auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  household_id UUID REFERENCES households(id) ON DELETE SET NULL,
  full_name TEXT,
  avatar_url TEXT
);

-- 3. Categorias
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID REFERENCES households(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('income', 'expense', 'both')) NOT NULL,
  color TEXT,
  icon TEXT
);

-- 4. Transações
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID REFERENCES households(id) ON DELETE CASCADE,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  type TEXT CHECK (type IN ('income', 'expense')) NOT NULL,
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  description TEXT,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  is_recurring BOOLEAN DEFAULT FALSE,
  recurrence TEXT CHECK (recurrence IN ('weekly', 'monthly', 'yearly')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Contas Fixas
CREATE TABLE IF NOT EXISTS fixed_bills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID REFERENCES households(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  due_day INTEGER CHECK (due_day BETWEEN 1 AND 31) NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT TRUE
);

-- 6. Pagamentos de contas fixas
CREATE TABLE IF NOT EXISTS fixed_bill_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fixed_bill_id UUID REFERENCES fixed_bills(id) ON DELETE CASCADE,
  reference_month DATE NOT NULL,
  paid_at TIMESTAMPTZ,
  transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
  UNIQUE(fixed_bill_id, reference_month)
);

-- 7. Cartões de crédito
CREATE TABLE IF NOT EXISTS credit_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID REFERENCES households(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  credit_limit NUMERIC(12,2),
  closing_day INTEGER CHECK (closing_day BETWEEN 1 AND 31),
  due_day INTEGER CHECK (due_day BETWEEN 1 AND 31)
);

-- 8. Parcelas de cartão
CREATE TABLE IF NOT EXISTS installments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id UUID REFERENCES credit_cards(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  total_amount NUMERIC(12,2) NOT NULL CHECK (total_amount > 0),
  total_installments INTEGER NOT NULL CHECK (total_installments > 0),
  current_installment INTEGER DEFAULT 1 CHECK (current_installment >= 1),
  first_charge_date DATE NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL
);

-- 9. Projetos
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID REFERENCES households(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  target_amount NUMERIC(12,2) NOT NULL CHECK (target_amount > 0),
  current_amount NUMERIC(12,2) DEFAULT 0 CHECK (current_amount >= 0),
  target_date DATE,
  priority TEXT CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
  status TEXT CHECK (status IN ('active', 'paused', 'completed')) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Aportes em projetos
CREATE TABLE IF NOT EXISTS project_contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  note TEXT,
  contributed_at DATE NOT NULL
);

-- ============================================
-- Índices
-- ============================================
CREATE INDEX IF NOT EXISTS idx_transactions_household ON transactions(household_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_fixed_bills_household ON fixed_bills(household_id);
CREATE INDEX IF NOT EXISTS idx_fixed_bill_payments_month ON fixed_bill_payments(reference_month);
CREATE INDEX IF NOT EXISTS idx_credit_cards_household ON credit_cards(household_id);
CREATE INDEX IF NOT EXISTS idx_installments_card ON installments(card_id);
CREATE INDEX IF NOT EXISTS idx_projects_household ON projects(household_id);
CREATE INDEX IF NOT EXISTS idx_project_contributions_project ON project_contributions(project_id);
CREATE INDEX IF NOT EXISTS idx_categories_household ON categories(household_id);

-- ============================================
-- Row Level Security
-- ============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE households ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE fixed_bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE fixed_bill_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE installments ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_contributions ENABLE ROW LEVEL SECURITY;

-- Helper: função para obter o household_id do perfil do usuário
CREATE OR REPLACE FUNCTION get_household_id()
RETURNS UUID
LANGUAGE SQL
STABLE
AS $$
  SELECT household_id FROM profiles WHERE id = auth.uid()
$$;

-- Policies: perfis
DROP POLICY IF EXISTS "Usuários veem apenas seus próprios perfis" ON profiles;
CREATE POLICY "Usuários veem apenas seus próprios perfis"
  ON profiles FOR ALL
  USING (id = auth.uid());

-- Policies: households
DROP POLICY IF EXISTS "Membros da família veem o household" ON households;
CREATE POLICY "Membros da família veem o household"
  ON households FOR ALL
  USING (id IN (
    SELECT household_id FROM profiles WHERE id = auth.uid()
  ));

-- Policies: categorias
DROP POLICY IF EXISTS "Categorias são filtradas por household" ON categories;
CREATE POLICY "Categorias são filtradas por household"
  ON categories FOR ALL
  USING (household_id = get_household_id());

-- Policies: transações
DROP POLICY IF EXISTS "Transações são filtradas por household" ON transactions;
CREATE POLICY "Transações são filtradas por household"
  ON transactions FOR ALL
  USING (household_id = get_household_id());

-- Policies: contas fixas
DROP POLICY IF EXISTS "Contas fixas são filtradas por household" ON fixed_bills;
CREATE POLICY "Contas fixas são filtradas por household"
  ON fixed_bills FOR ALL
  USING (household_id = get_household_id());

-- Policies: pagamentos de contas fixas
DROP POLICY IF EXISTS "Pagamentos são filtrados por household" ON fixed_bill_payments;
CREATE POLICY "Pagamentos são filtrados por household"
  ON fixed_bill_payments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM fixed_bills
      WHERE fixed_bills.id = fixed_bill_payments.fixed_bill_id
      AND fixed_bills.household_id = get_household_id()
    )
  );

-- Policies: cartões de crédito
DROP POLICY IF EXISTS "Cartões são filtrados por household" ON credit_cards;
CREATE POLICY "Cartões são filtrados por household"
  ON credit_cards FOR ALL
  USING (household_id = get_household_id());

-- Policies: parcelas
DROP POLICY IF EXISTS "Parcelas são filtradas por household" ON installments;
CREATE POLICY "Parcelas são filtradas por household"
  ON installments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM credit_cards
      WHERE credit_cards.id = installments.card_id
      AND credit_cards.household_id = get_household_id()
    )
  );

-- Policies: projetos
DROP POLICY IF EXISTS "Projetos são filtrados por household" ON projects;
CREATE POLICY "Projetos são filtrados por household"
  ON projects FOR ALL
  USING (household_id = get_household_id());

-- Policies: aportes
DROP POLICY IF EXISTS "Aportes são filtrados por household" ON project_contributions;
CREATE POLICY "Aportes são filtrados por household"
  ON project_contributions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_contributions.project_id
      AND projects.household_id = get_household_id()
    )
  );

-- ============================================
-- Permissões (essenciais para o 403 sumir)
-- ============================================
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO anon, authenticated, service_role;

-- ============================================
-- Trigger: criar perfil automaticamente no signup
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
