# My Smart Desk

Full-stack Supabase app with Finance, Document, and Policy trackers plus OpenAI-powered extraction.

## Features
- Authenticated Supabase-backed API and React client (email/password sign-in only).
- Finance tracker with manual entry, AI receipt/text extraction, filters, and insight charts.
- Document tracker for expiry dates with optional weekly reminder emails.
- Policy tracker with AI ingestion from images/PDFs and upcoming payment insights.

## Setup
1) Install dependencies
```bash
npm install
cd client && npm install
```

2) Backend `.env` (root)
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` (preferred) or `SUPABASE_ANON_KEY`
- `SUPABASE_TABLE_NAME` (default `transactions`)
- `SUPABASE_BUDGETS_TABLE_NAME` (default `budgets`)
- `SUPABASE_DOCUMENTS_TABLE_NAME` (default `documents`)
- `SUPABASE_POLICIES_TABLE_NAME` (default `policies`)
- `OPENAI_API_KEY` and optional `OPENAI_MODEL` (default `gpt-4o-mini`)
- `DOCUMENT_EXPIRY_MONTHS` (optional, default `8`)
- SMTP for reminders: `NOTIFY_SMTP_HOST`, `NOTIFY_SMTP_PORT`, `NOTIFY_SMTP_USER`, `NOTIFY_SMTP_PASS`, `NOTIFY_FROM_EMAIL`, `NOTIFY_TO_EMAIL`
- `PORT` (optional, default `3000`)

3) Client `.env` (`client/.env`)
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_API_BASE` (optional; defaults to proxying `/api` to `localhost:3000` in dev)

4) Supabase tables (adjust names if you override)
```sql
create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  amount numeric not null,
  currency text not null,
  category text not null,
  payment_method text not null,
  description text,
  source text default 'Manual',
  created_at timestamptz default now()
);

create table public.budgets (
  id uuid primary key default gen_random_uuid(),
  category text not null unique,
  monthly_limit numeric not null,
  created_at timestamptz default now()
);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  doc_type text,
  expiration_date date not null,
  document_number text,
  notes text,
  source text default 'Manual',
  email text,
  created_at timestamptz default now()
);

create table public.policies (
  id uuid primary key default gen_random_uuid(),
  policy_name text not null,
  provider text not null,
  policy_type text,
  policy_number text,
  premium_amount numeric default 0,
  currency text default 'USD',
  payment_frequency text default 'Monthly',
  start_date date,
  end_date date,
  next_payment_date date not null,
  notes text,
  source text default 'Manual',
  created_at timestamptz default now()
);

alter table public.transactions enable row level security;
alter table public.budgets enable row level security;
alter table public.documents enable row level security;
alter table public.policies enable row level security;
-- Dev-only policy; tighten for production
create policy "Allow all for authenticated" on public.transactions for all using (true) with check (true);
create policy "Allow all for authenticated" on public.budgets for all using (true) with check (true);
create policy "Allow all for authenticated" on public.documents for all using (true) with check (true);
create policy "Allow all for authenticated" on public.policies for all using (true) with check (true);
```

## Run
- Development
  ```bash
  npm run dev
  ```
  API on `http://localhost:3000`, Vite client on `http://localhost:5173` (proxies `/api`).

- Production
  ```bash
  npm run build   # builds client
  npm start       # serves dist assets + API via Express
  ```
  The weekly document reminder runs every Monday at 09:00 server time when both Supabase and SMTP env vars are set; it is skipped otherwise.

## Notes
- OpenAI features require a valid `OPENAI_API_KEY`; image/PDF extraction is disabled when the key is missing.
- API endpoints expect a Supabase access token in `Authorization: Bearer <token>`; the client uses Supabase Auth directly.
