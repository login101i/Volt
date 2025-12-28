# Naprawa 404 na AWS Amplify

## Problem
Po deploy na AWS Amplify dostajesz 404 na głównej stronie.

## Najczęstsze przyczyny

### 1. Framework nie jest ustawiony na Next.js (SSR) ⚠️ NAJWAŻNIEJSZE

**Sprawdź w AWS Amplify Console:**
1. Przejdź do: **App settings** → **General**
2. Szukaj sekcji **Framework** lub **Hosting**

**Musi być:**
- ✅ Framework: **Next.js (SSR)** lub **Next.js SSR**

**Jeśli widzisz:**
- ❌ Web app
- ❌ Static
- ❌ React
- ❌ (puste)

**→ To jest przyczyna 404!**

### Rozwiązanie:

**Opcja A: Utwórz nową aplikację Amplify (ZALECANE)**
1. Utwórz nową aplikację Amplify
2. Wybierz to samo repo GitHub
3. **NIE zmieniaj build settings** - zostaw wszystko puste
4. Amplify powinien automatycznie wykryć Next.js i ustawić Framework na "Next.js (SSR)"
5. Po utworzeniu, sprawdź czy Framework = Next.js (SSR)

**Opcja B: Spróbuj zmienić w istniejącej aplikacji**
1. App settings → General
2. Jeśli jest opcja zmiany Framework, zmień na "Next.js (SSR)"
3. ⚠️ Uwaga: Amplify nie zawsze pozwala zmienić Framework w istniejącej aplikacji

### 2. Sprawdź Build Settings

W **App settings** → **Build settings**:

- **Build command**: Zostaw PUSTE (używamy `amplify.yml`)
- **Output directory**: Zostaw PUSTE
- **Base directory**: `frontend` (opcjonalnie)

### 3. Sprawdź czy build się powiódł

1. Przejdź do **Deployments** w Amplify Console
2. Otwórz najnowszy deployment
3. Sprawdź logi buildu:
   - Czy build zakończył się sukcesem?
   - Czy widzisz informacje o `.next` folderze?
   - Czy są jakieś błędy?

### 4. Sprawdź artifacts

W logach buildu, sprawdź sekcję **artifacts**:
- Czy `baseDirectory: frontend/.next` jest poprawnie ustawione?
- Czy pliki są kopiowane?

## Co zostało naprawione w kodzie:

✅ `amplify.yml` - `baseDirectory: frontend/.next` (poprawne dla monorepo)
✅ `frontend/app/page.tsx` - istnieje i jest poprawny
✅ `frontend/next.config.ts` - bez `distDir`, używa domyślnej struktury `.next`

## Następne kroki:

1. **Sprawdź Framework w AWS Amplify Console** (najważniejsze!)
2. Jeśli Framework ≠ Next.js (SSR) → utwórz nową aplikację Amplify
3. Zcommituj zmiany i push:
   ```bash
   git add amplify.yml
   git commit -m "Fix amplify.yml for Next.js SSR monorepo"
   git push
   ```
4. Poczekaj na nowy build
5. Sprawdź czy aplikacja działa

## Jeśli nadal masz 404:

1. Sprawdź logi buildu w Amplify Console
2. Sprawdź czy folder `.next` jest tworzony podczas buildu
3. Sprawdź czy `baseDirectory` jest poprawne w artifacts
4. Możesz spróbować użyć `baseDirectory: .next` zamiast `frontend/.next` (jeśli build jest w folderze frontend)

