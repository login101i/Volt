# AGENTS.md — kontekst dla Cursor / dalszych sesji

Przed zmianami w kodzie przeczytaj **`server/README.md`** (pełna architektura, API, env, kluczowe pliki).

## Stack

- **frontend/** — Next.js 15 App Router, React 18, Tailwind, `lib/api.ts` = klient HTTP
- **server/** — Express + tsx, API `/api/*`, oferty w JSON, komponenty w **MariaDB** (`mysql2`)
- Porty: frontend `3000`, backend **`5000`** (nie 5005)
- Domena: **elektrykpoznan.online** (Cyber Folks `s78`)

## Env (wymagane lokalnie)

| Gdzie | Plik | Kluczowe zmienne |
|-------|------|------------------|
| server | `.env` | `PORT`, `FRONTEND_URL`, `MYSQL_*` (`MYSQL_PASSWORD`!) |
| frontend | `.env.local` | `NEXT_PUBLIC_API_URL`; AWS tylko dla S3 |

## DB (Cyber Folks)

- Host: `s78.cyber-folks.pl:3308` (HeidiSQL / lokalnie) lub `127.0.0.1:3308` (na hostingu)
- Baza / user: `lxsxnvawhg_volt`
- DDL: **`server/sql/create_tables.sql`**
- Tabele API: **`electric_components`**, **`fuse_types`**

## Gdzie jest logika

| Temat | Plik |
|-------|------|
| Entry Express | `server/server.ts`, `server/app.ts` |
| Oferty CRUD + kalkulacja | `server/controllers/offersController.js`, `server/utils/offerCalculator.js` |
| Lista „orders” | `server/controllers/ordersController.js` ← czyta `offers.json` |
| Katalog komponentów | `server/controllers/componentsController.js` ← MariaDB |
| Klient API FE | `frontend/lib/api.ts` |
| Kreator oferty | `frontend/app/offer/new/page.tsx` |
| Kalkulacja UI | `frontend/app/calculation/page.tsx` |
| Proxy ngrok | `frontend/app/api/proxy/[...path]/route.ts` |
| S3 signed URL | `frontend/app/api/media/route.ts` |

## Pułapki

1. `server/data/` jest gitignore — po clone brak `electricalComponents.js` / `offers.json`.
2. Dwa uploady obrazków: S3 (Next `/api/media`) vs lokalny Express `/api/upload`.
3. Zmiana portu wymaga sync: `server/.env` + `frontend/.env.local` + Electron.
4. Skrypty Python week2 = stary Postgres — nie używaj na MariaDB CF.

## Zasady zmian

- Nowe endpointy → router + controller + wpis w `lib/api.ts` + `server/README.md`
- Wycena / dobór rozdzielnicy → `offerCalculator.js`, nie rozpraszać po UI
- Nie commituj `.env` / `.env.local`
