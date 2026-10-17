# Volt — Developer Context (Server + Frontend)

> **Źródło prawdy dla dalszego developmentu.**  
> Czytaj ten plik przed zmianami w `server/` lub `frontend/`.  
> Skrót dla agenta: także `AGENTS.md` w katalogu głównym repo.

Aplikacja **ELGEN / Volt** — generator ofert instalacji elektrycznych (rozdzielnice, obwody, komponenty, kalkulacja cen). Stack: **Next.js 15 (frontend)** + **Express/TypeScript (server)** + opcjonalnie **Electron** + **MariaDB/MySQL** (katalog komponentów, Cyber Folks) + **AWS S3** (upload zdjęć).

**Domena produkcyjna:** [elektrykpoznan.online](https://elektrykpoznan.online) (Cyber Folks `s78`, easy_SSL).

---

## Szybki start (lokalnie)

```bash
# 1) Env
cp server/.env.example server/.env
cp frontend/.env.example frontend/.env.local
# Uzupełnij MYSQL_PASSWORD (i ewentualnie klucze AWS)

# 2) Zależności
cd server && npm install && cd ..
cd frontend && npm install && cd ..

# 3) Uruchomienie (dwa terminale)
cd server && npm run dev          # http://localhost:5000
cd frontend && npm run dev        # http://localhost:3000
```

Healthcheck: `GET http://localhost:5000/health`

---

## Architektura (high level)

```
Browser / Electron
        │
        ▼
┌───────────────────┐     NEXT_PUBLIC_API_URL      ┌────────────────────┐
│  frontend (Next)  │ ───────────────────────────► │  server (Express)  │
│  :3000            │                              │  :5000             │
│                   │   /api/proxy/* (ngrok)       │                    │
│  /api/media → S3  │◄─────────────────────────────│  /api/*            │
└───────────────────┘                              └─────────┬──────────┘
                                                             │
                              ┌──────────────────────────────┼──────────────┐
                              ▼                              ▼              ▼
                     MariaDB Cyber Folks            server/data/       local disk
                     electric_components            offers.json        (upload →
                     fuse_types                                        frontend/public)
```

### Warstwy odpowiedzialności

| Warstwa | Rola |
|--------|------|
| **Frontend pages** | UI flow oferty, kalkulacja, lista ofert, narzędzia (dobór kabli, EleQuicz) |
| **`frontend/lib/api.ts`** | Jedyny klient HTTP do backendu; przy ngrok przełącza na `/api/proxy` |
| **Next API routes** | `proxy` = mostek do Express; `media` = signed URL S3 (klucze tylko po stronie serwera Next) |
| **Express `app.ts`** | CORS, montowanie routerów `/api/*` |
| **Express `server.ts`** | Listen, `/health`, 404, error handler |
| **Controllers** | Logika biznesowa / I/O |
| **`offerCalculator.js`** | Dobór komponentów rozdzielnicy + wycena oferty |

---

## Zmienne środowiskowe

### Server (`server/.env`) — konieczne

| Zmienna | Wymagana | Domyślna / przykład | Użycie |
|---------|----------|---------------------|--------|
| `PORT` | **tak** | `5000` | Port Express (musi = `NEXT_PUBLIC_API_URL`) |
| `HOST` | nie | `0.0.0.0` | Bind address |
| `NODE_ENV` | nie | `development` | Stack trace w errorach |
| `FRONTEND_URL` | **tak** (CORS) | `http://localhost:3000` | Dozwolony origin |
| `PRODUCTION_FRONTEND_URL` | nie | `https://elektrykpoznan.online` | CORS produkcja |
| `NGROK_FRONTEND_URL` | nie | — | Extra origin przy tunelu |
| `MYSQL_HOST` | **tak** dla `/api/components` | `s78.cyber-folks.pl` | Pool `mysql2` |
| `MYSQL_PORT` | **tak** | `3308` | |
| `MYSQL_DATABASE` | **tak** | `lxsxnvawhg_volt` | |
| `MYSQL_USER` | **tak** | `lxsxnvawhg_volt` | |
| `MYSQL_PASSWORD` | **tak** | — | **Hasło z panelu CF** |

Bez DB: reszta API (offers/orders na pliku JSON) działa; katalog komponentów z DB nie.

### Frontend (`frontend/.env.local`) — konieczne

| Zmienna | Wymagana | Przykład | Użycie |
|---------|----------|----------|--------|
| `NEXT_PUBLIC_API_URL` | **tak** | `http://localhost:5000` | `lib/api.ts` + proxy |
| `ACCESS_KEY` | tylko S3 | — | `/api/media` signed upload |
| `SECRET_KEY` | tylko S3 | — | |
| `REGION` | tylko S3 | `eu-central-1` | |
| `BUCKET_NAME` | tylko S3 | — | |
| `DATABASE_URL` | nie | — | Tylko strona interview |

---

## Server — logika i kluczowe pliki

### Bootstrap

| Plik | Znaczenie |
|------|-----------|
| `server.ts` | Entry: `PORT`/`HOST`, `/health`, 404, global error |
| `app.ts` | Express app: CORS (localhost + env + ngrok), `express.json()`, mount `/api/*` |

### API (prefix `/api`)

| Route | Controller | Persystencja | Opis |
|-------|------------|--------------|------|
| `/api/offers` CRUD | `offersController.js` | `server/data/offers.json` | Tworzenie oferty → `offerCalculator` → zapis JSON |
| `/api/orders` GET | `ordersController.js` | ten sam `offers.json` | Oferty zmapowane do „orders” na liście |
| `/api/components` | `componentsController.js` | **PostgreSQL** `electric_components` | Katalog produktów (cena, pola, kategorie, fuse types) |
| `/api/upload/component-image` | `uploadController.js` | dysk → `frontend/public/pictures/electricComponents` | Multer + Sharp; lokalny upload (alternatywa do S3) |
| `/api/example` | `exampleController.js` | — | Placeholder |

### Domain: kalkulacja oferty

- **`utils/offerCalculator.js`** — rdzeń biznesowy:
  - zlicza obwody (16A/10A/20A/25A, 3φ) z `circuits` lub fallback `rooms`
  - dobiera komponenty rozdzielnicy / bezpieczniki
  - liczy rozmiar rozdzielnicy + pricing (VAT, punkty, przewody…)
  - importuje katalog z **`data/electricalComponents.js`**

### Znana luka po clone z GitHub

- Katalog `server/data/` jest w `.gitignore` → **nie ma w repo** `offers.json` ani `electricalComponents.js`.
- `offersController` tworzy pusty `offers.json` przy pierwszym requestcie.
- **`electricalComponents.js` trzeba odtworzyć / przywrócić** — bez niego `createOffer` padnie na imporcie calculadora.
- MariaDB: wymagane tabele poniżej + plik `server/sql/create_tables.sql`.

### Scripts

```bash
npm run dev      # tsx watch server.ts
npm run build    # tsc → dist/
npm start        # node dist/server.js
```

---

## Hosting / domena (Cyber Folks)

| Pozycja | Wartość |
|---------|---------|
| Serwer | `s78.cyber-folks.pl` |
| Domena | **elektrykpoznan.online** (12 mies.) |
| SSL | easy_SSL (12 mies.) → `https://elektrykpoznan.online` |
| Silnik DB | **MariaDB 10.11** (Instancja MySQL) |
| Host DB (HeidiSQL / lokalnie) | `s78.cyber-folks.pl` **port `3308`** |
| Host DB (na hostingu / SSH) | `127.0.0.1` **port `3308`** |
| Nazwa bazy | `lxsxnvawhg_volt` |
| Użytkownik | `lxsxnvawhg_volt` |
| Hasło | tylko w `server/.env` → `MYSQL_PASSWORD` (nie commituj) |

---

## Baza danych (MariaDB / MySQL)

Połączenie: `controllers/componentsController.js` (pool **`mysql2`**).  
Oferty / orders **nie** są w SQL — plik `server/data/offers.json`.

### Utworzenie tabel (pierwszy setup)

1. Zaloguj się do phpMyAdmin / HeidiSQL na bazę `lxsxnvawhg_volt`.
2. Uruchom cały skrypt: **`server/sql/create_tables.sql`**.

Skrót DDL:

```sql
CREATE TABLE IF NOT EXISTS `electric_components` (
  `id`           VARCHAR(100)  NOT NULL,
  `name`         VARCHAR(255)  NOT NULL,
  `fields`       INT           NOT NULL DEFAULT 0,
  `description`  TEXT          NULL,
  `price`        DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `image`        VARCHAR(500)  NULL,
  `category`     VARCHAR(100)  NULL,
  `subcategory`  VARCHAR(100)  NULL,
  `created_at`   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_components_name` (`name`),
  KEY `idx_components_category` (`category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `fuse_types` (
  `id`          INT          NOT NULL AUTO_INCREMENT,
  `fuse_type`   VARCHAR(20)  NOT NULL,
  `phase_type`  VARCHAR(10)  NOT NULL,
  `created_at`  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_fuse_phase` (`fuse_type`, `phase_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

(pełny plik zawiera też seed `fuse_types` + indeksy).

### Tabele używane przez Express API

| Tabela | Endpointy |
|--------|-----------|
| **`electric_components`** | `GET /api/components`, `/search`, `/categories`, `/category/:c`, `/:id` |
| **`fuse_types`** | `GET /api/components/fuse-types` |

#### `electric_components`

| Kolumna | Typ | Opis |
|---------|-----|------|
| `id` | `VARCHAR(100)` PK | Identyfikator |
| `name` | `VARCHAR(255)` | Nazwa |
| `fields` | `INT` | Liczba pól/modułów |
| `description` | `TEXT` | Opis |
| `price` | `DECIMAL(10,2)` | Cena |
| `image` | `VARCHAR(500)` | URL / ścieżka |
| `category` | `VARCHAR(100)` | Kategoria |
| `subcategory` | `VARCHAR(100)` | Podkategoria |
| `created_at` / `updated_at` | `TIMESTAMP` | |

#### `fuse_types`

| Kolumna | Typ | Opis |
|---------|-----|------|
| `id` | `INT` AI PK | |
| `fuse_type` | `VARCHAR(20)` | np. `10A`, `16A` |
| `phase_type` | `VARCHAR(10)` | `1φ` lub `3φ` |
| `created_at` | `TIMESTAMP` | |

### Persystencja poza SQL

| Storage | Zawartość |
|---------|-----------|
| `server/data/offers.json` | Oferty + „orders” |
| `server/data/electricalComponents.js` | Katalog do `offerCalculator` |
| `frontend/public/pictures/electricComponents/` | Lokalne uploady |
| AWS S3 (`BUCKET_NAME`) | Upload przez Next `/api/media` |

> Skrypty Python w `scripts/python/week2` były pod **PostgreSQL** — nie uruchamiaj ich na tej bazie CF bez przepisania na MySQL. Źródłem prawdy DDL jest teraz `server/sql/create_tables.sql`.

---

## Frontend — logika i kluczowe pliki

### Flow główny (oferta)

```
/ (dashboard)
  → /offer/new          dane klienta, pokoje, obwody (localStorage: volt_offer_draft)
  → /calculation        obwody, komponenty z API, wycena UI
  → /offer/summary      podsumowanie
  → /offer/visualization
  → POST /api/offers    zapis po stronie serwera
  → /orders             lista (GET /api/orders)
```

### Strony (App Router)

| Ścieżka | Rola |
|---------|------|
| `app/page.tsx` | Hub: Nowa Oferta, Lista, Kalkulacja, EleQuicz, Dobór kabli |
| `app/offer/new/page.tsx` | Kreator oferty (pokoje/obwody), draft w `localStorage` |
| `app/calculation/page.tsx` | Duży ekran kalkulacji rozdzielnicy/obwodów; pobiera `/api/components` |
| `app/offer/summary/page.tsx` | Podsumowanie oferty |
| `app/offer/visualization/page.tsx` | Wizualizacja |
| `app/orders/page.tsx` | Lista zapisanych ofert |
| `app/dobor-kabli/page.tsx` | Narzędzie doboru kabli (osobny flow) |
| `app/elequicz/page.tsx` | Q&A instalacje |
| `app/protocol-odbioru/page.tsx` | Protokół odbioru |
| `app/interview/*` | Materiał interview (poza core produktu) |

### Shared / infra

| Plik | Znaczenie |
|------|-----------|
| `lib/api.ts` | **Centralny klient API** — orders, offers, upload (S3 via `/api/media`) |
| `lib/theme.ts` | Klasy przycisków / theme helpers |
| `app/api/proxy/[...path]/route.ts` | Proxy browser→Express (tryb ngrok: relative URL) |
| `app/api/media/route.ts` | AWS S3 `getSignedUrl` (PUT) |
| `components/CircuitConfig.tsx` | Konfiguracja obwodu |
| `components/AddRoomPopup.tsx` | Dodawanie pokoi |
| `components/SearchComponent.tsx` | Szukanie komponentów |
| `components/GlobalPopup.tsx` | Popup globalny |
| `components/LightingConfigPopup.tsx` | Oświetlenie |

### Konwencje frontendu

- Client components (`"use client"`) dla interaktywnych flow.
- Draft oferty: klucz `volt_offer_draft` w `localStorage`.
- Port backendu: zawsze `5000` lokalnie (nie 5005).
- Upload obrazków komponentów: preferowana ścieżka UI to S3 (`/api/media`); serwer ma też lokalny `/api/upload/component-image`.

---

## Kontrakt API (skrót)

```
GET    /health
GET    /api/orders
GET    /api/orders/:id
POST   /api/offers
GET    /api/offers
GET    /api/offers/:id
PUT    /api/offers/:id
DELETE /api/offers/:id
GET    /api/components
GET    /api/components/search?q=
GET    /api/components/categories
GET    /api/components/category/:category
GET    /api/components/fuse-types
GET    /api/components/:id
POST   /api/upload/component-image
```

---

## Electron / ngrok / deploy (kontekst)

- Root `package.json`: `electron:dev`, `dist:win`, skrypty ngrok.
- Electron ustawia `PORT=5000` i `NEXT_PUBLIC_API_URL=http://localhost:5000`.
- Szczegóły: `NGROK-SETUP.md`, `QUICK-START.md`, `AMPLIFY-DEPLOY.md`, `README-EXE.md`.

---

## Priorytety przy dalszym developmentcie

1. **Nie rozjeżdżać portów** — server + frontend + Electron = `5000`.
2. **Zmiany API** → aktualizuj `lib/api.ts` i ten README.
3. **Nowa logika wyceny** → `offerCalculator.js` (+ katalog `electricalComponents`), nie w kontrolerze.
4. **Komponenty katalogowe** → Postgres (`componentsController`), nie hardcode w UI (UI może mieć fallbacki).
5. **Sekrety** tylko w `.env` / `.env.local` (nigdy w git); commituj wyłącznie `.env.example`.
6. Oferty = plik JSON (prosty storage); migracja do DB to świadoma decyzja architektoniczna.

---

## Checklist po świeżym clone

- [ ] `server/.env` + `frontend/.env.local` utworzone i uzupełnione
- [ ] `MYSQL_PASSWORD` w `server/.env`; uruchomione `server/sql/create_tables.sql` (tabele **`electric_components`** + **`fuse_types`**)
- [ ] Przywrócony `server/data/electricalComponents.js` (lub odtworzony katalog)
- [ ] `npm install` w `server` i `frontend`
- [ ] `curl localhost:5000/health` → OK
- [ ] Frontend `localhost:3000` łączy się z API
