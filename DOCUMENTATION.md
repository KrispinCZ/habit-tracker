# Habit Tracker — Projektová dokumentace

> Načti tento soubor na začátku každé session pro rychlé zorientování.

## Co appka dělá

Webová aplikace pro sledování denních, týdenních a měsíčních zvyků. Každý zvyk lze sdílet read-only odkazem — příjemce nemusí být přihlášen.

## Stack

| Vrstva | Technologie |
|--------|-------------|
| Frontend | Next.js 15 (App Router) + TypeScript |
| Styling | Tailwind CSS v4 — tmavý design (`bg-gray-950`) |
| Databáze | Supabase (PostgreSQL) |
| Deploy | Vercel |

## Repozitář a deploy

- **GitHub:** https://github.com/KrispinCZ/habit-tracker
- **Vercel projekt:** `krispinczs-projects/habit-tracker`
- **Produkční URL:** https://habit-tracker-one-blush.vercel.app
- **Vercel dashboard:** https://vercel.com/krispinczs-projects/habit-tracker

## Databáze

### DEV projekt (lokální vývoj)
- URL: `https://caozomczkezwcjevmbdb.supabase.co`
- Credentials: v `.env.local` (není v gitu)

### PROD projekt
- Credentials: v Vercel Environment Variables (`Settings → Environment Variables`)
- ⚠ PROD projekt potřebuje stejný SQL jako DEV — viz `migrations/001_initial.sql`

### Schéma

```sql
CREATE TYPE habit_frequency AS ENUM ('daily', 'weekly', 'monthly');
CREATE TYPE habit_status AS ENUM ('done', 'missed');

CREATE TABLE habits (
  id          integer generated always as identity primary key,
  user_id     uuid references auth.users(id),
  title       text not null,
  frequency   habit_frequency not null,
  target_day  integer,        -- NULL pro daily; 1–7 ISO dow pro weekly; 1–31 pro monthly
  share_token text unique not null default gen_random_uuid()::text,
  deleted_at  timestamptz,    -- soft delete: NULL = aktivní
  created_at  timestamptz not null default now()
);

CREATE TABLE habit_logs (
  id         integer generated always as identity primary key,
  habit_id   integer not null references habits(id) on delete cascade,
  log_date   date not null,
  status     habit_status not null,
  created_at timestamptz not null default now(),
  UNIQUE (habit_id, log_date)
);
```

RLS je zapnuté na obou tabulkách s permissive policy (`USING (true)`). Po přidání auth zpřísnit na `auth.uid() = user_id`.

## Struktura projektu

```
src/
  app/
    page.tsx                  # Homepage — server component, fetchuje habits + logs
    layout.tsx                # Root layout, tmavý design
    share/[token]/page.tsx    # Read-only sdílecí stránka (server component)
  components/
    AddHabitForm.tsx          # Formulář pro přidání zvyku ('use client')
    HabitCard.tsx             # Karta zvyku — sbalená/rozbalená, logování ('use client')
    HabitList.tsx             # Seznam zvyků
    YearGrid.tsx              # Roční analytics grid, GitHub-style (server component)
  lib/
    supabase.ts               # createClient() — browser client (pro 'use client')
    supabase-server.ts        # createServerClient() — server client (s cookies)
    types.ts                  # TypeScript typy: Habit, HabitLog, HabitWithLogs
    utils.ts                  # Pure funkce: formatFrequency, isExpectedDay,
                              #   buildYearGrid, getMonthLabels, todayISO, ...
migrations/
  001_initial.sql             # Celé schéma — spusť v Supabase SQL Editoru
```

## Klíčové implementační rozhodnutí

- **Soft delete** — `habits.deleted_at`: smazané zvyky se nezobrazují, data zůstávají v DB
- **Share token** — `gen_random_uuid()::text`: read-only URL bez auth, bezpečnost pouze na app vrstvě (RLS povoluje vše)
- **Dva Supabase klienti** — `supabase.ts` (browser) a `supabase-server.ts` (server s cookies) jsou oddělené soubory, protože `next/headers` nesmí být v client bundlu
- **Logování zvyků** — explicitní akce (klik "Splněno" / "Nesplněno"), ne implicitní. UNIQUE constraint na `(habit_id, log_date)` brání duplicitám
- **YearGrid** — buňky `w-2 h-2` (8px), 53 sloupců, vejde se bez posuvníku do `max-w-3xl`

## Co funguje (hotové features)

- [x] Přidání zvyku (denně/týdně/měsíčně + cílový den)
- [x] Označení splněno/nesplněno pro dnešek (s loading state, bez race condition)
- [x] 30denní grid na každé kartě zvyku
- [x] Sbalené karty na dashboardu, rozbalení kliknutím
- [x] Sdílení zvyku přes token URL (`/share/<token>`)
- [x] Sdílecí stránka: statistiky (% úspěšnost, počty) + 30denní grid
- [x] Soft delete s potvrzením
- [x] Roční analytics grid (GitHub-style) na dashboardu
- [x] Tmavý design

## Backlog (GitHub issues)

- [#2](https://github.com/KrispinCZ/habit-tracker/issues/2) Email / push notifikace a připomínky
- [#3](https://github.com/KrispinCZ/habit-tracker/issues/3) Více dnů v týdnu najednou (3× týdně)
- [#4](https://github.com/KrispinCZ/habit-tracker/issues/4) Statistiky a analytics dashboard (rozšíření)
- [#5](https://github.com/KrispinCZ/habit-tracker/issues/5) Multi-user / týmové sdílení
- [#6](https://github.com/KrispinCZ/habit-tracker/issues/6) Import/export dat
- [#7](https://github.com/KrispinCZ/habit-tracker/issues/7) YearGrid: vizuální nápověda pro mobilní horizontal scroll

## Known issues / věci k řešení

- **Timezone**: `todayISO()` počítá lokální čas serveru (UTC na Vercelu). Pro uživatele v CE(S)T může okolo půlnoci zobrazit špatný den.
- **RLS security**: Anon key je veřejný; s `USING (true)` policy může kdokoli se znalostí Supabase URL číst všechna data přes API. Share URL zabezpečuje jen app vrstva. Před produkcí: zpřísnit na `auth.uid() = user_id`.
- **Auth**: `user_id` sloupec je připraven, ale auth není implementovaná. Všechna data jsou přístupná bez přihlášení.

## Lokální vývoj

```bash
npm install
npm run dev          # http://localhost:3000
```

Potřebuješ `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://caozomczkezwcjevmbdb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key z DEV projektu>
```

## Workflow pro nové features

```
/hack-feature     # vytvoří branch feat/<N>-<nazev>, implementuje, pushne PR
/hack-review      # Critic projde diff
                  # Mergni PR na GitHubu → Vercel auto-deployne
```
