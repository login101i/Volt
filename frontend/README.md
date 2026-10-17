# Volt Frontend (Next.js 15)

UI generatora ofert instalacji elektrycznych (**ELGEN / Volt**).

Pełna architektura, API i mapa plików: **[`../server/README.md`](../server/README.md)** oraz **[`../AGENTS.md`](../AGENTS.md)**.

## Setup

```bash
cp .env.example .env.local
# Ustaw NEXT_PUBLIC_API_URL=http://localhost:5000
# (opcjonalnie klucze AWS do uploadu S3)

npm install
npm run dev
```

Otwórz [http://localhost:3000](http://localhost:3000). Backend musi działać na porcie **5000**.

## Konieczne zmienne (`.env.local`)

| Zmienna | Wymagana | Opis |
|---------|----------|------|
| `NEXT_PUBLIC_API_URL` | **tak** | URL Express, np. `http://localhost:5000` |
| `ACCESS_KEY` | S3 | AWS access key → `/api/media` |
| `SECRET_KEY` | S3 | AWS secret |
| `REGION` | S3 | np. `eu-central-1` |
| `BUCKET_NAME` | S3 | Bucket na zdjęcia komponentów |

## Kluczowe pliki

- `lib/api.ts` — klient HTTP do backendu
- `app/offer/new/page.tsx` — kreator oferty
- `app/calculation/page.tsx` — kalkulacja rozdzielnicy
- `app/orders/page.tsx` — lista ofert
- `app/api/proxy/[...path]/route.ts` — proxy (ngrok)
- `app/api/media/route.ts` — signed upload S3
