# Redfin — Controle Financeiro Familiar

Aplicativo web de controle financeiro para famílias/casais. React + Vite + Supabase + Tailwind CSS.

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
# Abra o arquivo supabase/migrations/00001_schema.sql
# Cole no SQL Editor do seu projeto Supabase e execute

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
3. Vá em **SQL Editor** e execute o conteúdo de `supabase/migrations/00001_schema.sql`
4. Vá em **Authentication > Settings** e habilite "Email + Password" como provedor
5. Em **Authentication > Settings > Redirect URLs**, adicione: `http://localhost:5173/**`
6. Copie as credenciais de **Settings > API** para o `.env`

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
├── components/     # Componentes globais (layout + ui)
├── lib/            # Supabase client, formatadores, types
├── store/          # Zustand stores (auth, ui)
├── modules/
│   ├── auth/       # Login, cadastro, recuperação
│   ├── dashboard/  # Resumo financeiro, gráficos
│   ├── transactions/ # Entradas e saídas
│   ├── fixed/      # Contas fixas
│   ├── cards/      # Cartões de crédito
│   ├── projects/   # Projetos e desejos
│   └── settings/   # Categorias
└── supabase/
    └── migrations/ # SQL migrations
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
