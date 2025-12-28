# AWS Amplify Deployment Guide

Ten przewodnik opisuje jak zdeployować aplikację Volt do AWS Amplify.

## Struktura projektu

- **Frontend**: Next.js aplikacja w folderze `frontend/`
- **Backend**: Express.js serwer w folderze `server/`

## Konfiguracja AWS Amplify

### 1. Plik amplify.yml

Plik `amplify.yml` został już utworzony w głównym katalogu projektu. Zawiera konfigurację build dla frontendu.

### 2. Ustawienia w AWS Amplify Console

W AWS Amplify Console, w sekcji **App settings** → **Build settings**:

- **Build command**: Zostaw PUSTE (używamy amplify.yml)
- **Output directory**: Zostaw PUSTE (AWS Amplify automatycznie wykryje Next.js)
- **Base directory**: `frontend` (opcjonalnie)

**WAŻNE**: 
- AWS Amplify automatycznie wykrywa Next.js i używa odpowiedniej konfiguracji
- Nie ustawiaj ręcznie Output directory - Amplify automatycznie użyje struktury `.next`
- Plik `amplify.yml` jest już skonfigurowany poprawnie

### 3. Zmienne środowiskowe

W AWS Amplify Console, przejdź do **App settings** → **Environment variables** i dodaj:

```
NEXT_PUBLIC_API_URL=https://your-backend-url.com
```

Gdzie `your-backend-url.com` to URL Twojego backendu (patrz sekcja Backend poniżej).

## Backend - Opcje hostingu

Backend Express.js musi być hostowany osobno. Masz kilka opcji:

### Opcja 1: AWS App Runner (Rekomendowane)

AWS App Runner to proste rozwiązanie do hostowania kontenerów Docker lub aplikacji Node.js.

**Kroki:**
1. Stwórz plik `Dockerfile` w folderze `server/`:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["node", "server.js"]
```

2. W AWS App Runner:
   - Wybierz "Source code repository" lub "Container image"
   - Jeśli używasz Git, wskaż folder `server/`
   - Port: `5000`
   - Build command: `npm install`
   - Start command: `node server.js`

3. Po deploy, skopiuj URL i ustaw jako `NEXT_PUBLIC_API_URL` w Amplify

### Opcja 2: AWS Lambda Functions

Możesz przenieść backend do AWS Lambda functions. To wymaga refaktoryzacji kodu Express.js na funkcje Lambda.

**Alternatywa**: Użyj `serverless-http` aby uruchomić Express.js jako Lambda:

1. Zainstaluj `serverless-http`:
```bash
cd server
npm install serverless-http
```

2. Stwórz plik `server/lambda.js`:
```javascript
const serverless = require('serverless-http');
const app = require('./server');
module.exports.handler = serverless(app);
```

3. Deploy do AWS Lambda używając Serverless Framework lub AWS SAM

### Opcja 3: AWS Elastic Beanstalk

1. Zainstaluj AWS EB CLI
2. W folderze `server/` uruchom: `eb init`
3. Deploy: `eb deploy`

### Opcja 4: EC2/ECS

Możesz hostować backend na EC2 lub ECS, ale to bardziej skomplikowane rozwiązanie.

## Konfiguracja Next.js dla Amplify

**✅ ZROBIONE**: Plik `frontend/next.config.ts` został już zaktualizowany dla AWS Amplify:

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // AWS Amplify automatycznie wykrywa Next.js i używa odpowiedniej konfiguracji
  // Nie używamy distDir: 'dist' bo Amplify potrzebuje domyślnej struktury .next
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
```

**Ważne zmiany:**
- ✅ Usunięto `output: 'standalone'` (było dla Electron)
- ✅ Usunięto `distDir: 'dist'` - AWS Amplify używa domyślnej struktury `.next`
- ✅ API routes (`/api/proxy/[...path]`) będą działać jako serverless functions w Amplify
- ✅ AWS Amplify automatycznie obsługuje Next.js SSR/SSG bez dodatkowej konfiguracji

**Usunięto również pakiet specyficzny dla Windows:**
- ✅ Usunięto `@next/swc-win32-x64-msvc` z `package.json` (nie działa na Linux w Amplify)

## Proxy API Routes

Aplikacja używa Next.js API routes (`/api/proxy/[...path]`) do proxy do backendu. Te routes będą działać jako serverless functions w Amplify, ale wymagają ustawienia zmiennej środowiskowej `NEXT_PUBLIC_API_URL`.

## Sprawdzenie deploymentu

Po deploy:

1. Sprawdź czy frontend się buduje poprawnie
2. Sprawdź czy backend jest dostępny pod ustawionym URL
3. Sprawdź czy zmienna środowiskowa `NEXT_PUBLIC_API_URL` jest ustawiona
4. Przetestuj API calls w aplikacji

## Troubleshooting

### Problem: Build fails
- Sprawdź logi w AWS Amplify Console
- Upewnij się, że wszystkie zależności są w `package.json`
- Sprawdź czy Node.js version jest kompatybilny

### Problem: API calls nie działają
- Sprawdź czy `NEXT_PUBLIC_API_URL` jest ustawione
- Sprawdź CORS settings w backendzie
- Sprawdź czy backend jest dostępny publicznie

### Problem: Backend nie odpowiada
- Sprawdź czy backend jest uruchomiony
- Sprawdź security groups i network settings
- Sprawdź logi backendu

## Dodatkowe zasoby

- [AWS Amplify Documentation](https://docs.aws.amazon.com/amplify/)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [AWS App Runner](https://aws.amazon.com/apprunner/)
- [AWS Lambda](https://aws.amazon.com/lambda/)

