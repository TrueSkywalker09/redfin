# Redfin — Controle Financeiro Familiar

Aplicativo web de controle financeiro para famílias/casais. React + Vite + Supabase + Tailwind CSS.

🔗 **Online:** [https://redfin.vercel.app](https://redfin.vercel.app)

## Funcionalidades

- **Dashboard**: Resumo financeiro com gráficos (entradas vs saídas, gastos por categoria), contas a vencer
- **Transações**: CRUD completo, filtros (tipo, categoria, data), busca, ordenação, paginação, export CSV
- **Contas Fixas**: Contas recorrentes, painel mensal, marcar como pago com débito em conta
- **Cartões de Crédito**: CRUD, parcelamento, progresso de pagamento
- **Contas Bancárias**: Saldo atualizado automaticamente, ajuste manual de saldo
- **Projetos**: Metas financeiras com aportes e barra de progresso
- **Categorias**: Gerenciamento no módulo de configurações
- **Máscara de Moeda**: Input monetário nativo com `Intl.NumberFormat` (formato BRL)
- **Paginação**: Navegação com 25 registros por página
- **Real-time Sync**: Atualização automática via Supabase Realtime subscriptions
- **Autenticação**: Login, cadastro, recuperação de senha (Supabase Auth)

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | React 19 + Vite 8 |
| Estilo | Tailwind CSS 3 |
| Ícones | Lucide React |
| Estado | Zustand |
| Formulários | React Hook Form + Zod |
| Gráficos | Recharts |
| Backend/DB | Supabase (PostgreSQL) |
| Deploy | Vercel |

## Acessibilidade (WCAG 2.1 AA)

- Focus trap + ARIA roles em modais
- `aria-sort` + teclado (Enter/Space) na tabela ordenável
- `aria-invalid` + `aria-describedby` + `role="alert"` em todos os erros de formulário
- `role="img"` + `aria-label` nos gráficos
- Contraste de cores ajustado para 4.5:1+
- Link "Pular para conteúdo" + `aria-label` na navegação
- Região `aria-live="polite"` para feedback assíncrono
- Foco gerenciado ao navegar entre rotas

## Responsividade Mobile

- Sidebar oculta em mobile (`hidden lg:flex`), navegação inferior (`MobileNav`)
- Tabela com colunas escondidas em telas pequenas
- Filtros em grid responsivo (1 col mobile → 4 col desktop)
- Gráficos com altura adaptativa (250px mobile, 300px desktop)
- Modal com scroll vertical para formulários longos
- Paginação com labels compactos (só ícones no mobile)
- Todos formulários com `w-full`

## Pré-requisitos

- Node.js 18+
- npm 9+
- Conta gratuita no [Supabase](https://supabase.com)

## Setup

```bash
# 1. Instalar dependências
npm install

# 2. Configurar variáveis de ambiente
cp .env.example .env
# Edite .env com as credenciais do seu projeto Supabase

# 3. Aplicar migrations no Supabase
# Execute no SQL Editor do Supabase Dashboard em ordem:
# - supabase/migrations/00001_schema.sql
# - supabase/migrations/00002_correcoes_criticas.sql
# - supabase/migrations/00003_novas_funcionalidades.sql
# - supabase/migrations/00004_funcionalidades.sql

# 4. Iniciar desenvolvimento
npm run dev
```

## Variáveis de ambiente

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=chave-anon-publica-do-seu-projeto
```

## Configuração do Supabase

1. Crie uma conta em [supabase.com](https://supabase.com)
2. Crie um novo projeto
3. Vá em **SQL Editor** e execute os 4 arquivos de migration em ordem:
   - `supabase/migrations/00001_schema.sql`
   - `supabase/migrations/00002_correcoes_criticas.sql`
   - `supabase/migrations/00003_novas_funcionalidades.sql`
   - `supabase/migrations/00004_funcionalidades.sql`
4. Vá em **Authentication > Settings** e habilite "Email + Password" como provedor
5. Em **Authentication > Settings > Redirect URLs**, adicione:
   - `http://localhost:5173/**`
   - `https://seu-app.vercel.app/**`
6. Vá em **Database > Replication** e ative Realtime para as tabelas:
   - `transactions`, `fixed_bills`, `credit_cards`, `bank_accounts`, `projects`
7. Copie as credenciais de **Settings > API** para o `.env`

## Scripts

```bash
npm run dev      # Desenvolvimento
npm run build    # Build de produção
npm run preview  # Preview da build
npm run lint     # ESLint
```

## Estrutura

```
src/
├── components/     # Componentes globais
│   ├── layout/     # AppLayout, Sidebar, MobileNav
│   └── ui/         # Modal, DataTable, CurrencyInput, Pagination, etc.
├── lib/            # Supabase client, formatadores, types, hooks
├── store/          # Zustand stores (auth, ui)
├── modules/
│   ├── auth/       # Login, cadastro, recuperação de senha
│   ├── dashboard/  # Resumo financeiro, gráficos, contas a vencer
│   ├── transactions/ # Entradas e saídas com filtros e paginação
│   ├── fixed/      # Contas fixas recorrentes
│   ├── cards/      # Cartões de crédito e parcelas
│   ├── bank-accounts/ # Contas bancárias e ajuste de saldo
│   ├── projects/   # Projetos e aportes
│   └── settings/   # Gerenciamento de categorias
└── supabase/
    └── migrations/ # SQL migrations (4 arquivos)
```

## Deploy na Vercel

```bash
# Instalar CLI da Vercel
npm i -g vercel

# Deploy
vercel

# Configure as variáveis de ambiente no dashboard da Vercel:
# - VITE_SUPABASE_URL
# - VITE_SUPABASE_ANON_KEY
```

Ou conecte o repositório GitHub em [vercel.com/new](https://vercel.com/new) — a Vercel detecta o framework automaticamente.
