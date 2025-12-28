# Porównanie z Amplify Next.js Template

## Różnice między template a Twoim projektem

### Template Amplify (Next.js w root):
```
repo/
├── app/
├── next.config.ts
├── package.json
├── tsconfig.json
└── amplify.yml
```

### Twój projekt (monorepo):
```
repo/
├── frontend/
│   ├── app/
│   ├── next.config.ts
│   ├── package.json
│   └── tsconfig.json
├── server/
└── amplify.yml (w root)
```

## Co zostało dostosowane:

### ✅ 1. `frontend/tsconfig.json`
Zaktualizowano zgodnie z template Amplify:
- `target: "es5"` (było `ES2017`)
- `include` zaktualizowane: `["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"]`
- `exclude` dodane: `["node_modules", "amplify"]`
- `paths` pozostaje `{ "@/*": ["./*"] }` (poprawne dla frontend/)

### ✅ 2. `amplify.yml`
Dostosowane dla monorepo:
- `cd frontend` przed buildem
- `baseDirectory: frontend/.next` (zamiast `.next` jak w template)
- Cache paths dostosowane: `frontend/.next/cache/**/*`

### ✅ 3. `frontend/next.config.ts`
- Bez `distDir` - używa domyślnego `.next`
- `images.unoptimized: true` - dla Amplify

## Ważne różnice dla monorepo:

### Template Amplify:
```yaml
baseDirectory: .next  # Next.js w root
```

### Twój projekt:
```yaml
baseDirectory: frontend/.next  # Next.js w frontend/
```

## Co musisz zrobić:

### 1. Usuń stary folder `dist/` (jeśli istnieje)
```powershell
cd frontend
Remove-Item -Recurse -Force dist -ErrorAction SilentlyContinue
```

### 2. Upewnij się że Next.js buduje do `.next` a nie `dist`
Sprawdź `frontend/next.config.ts` - nie powinno być `distDir: 'dist'`

### 3. W AWS Amplify Console:

**App settings → Build settings:**
- **Build command**: Zostaw PUSTE (używamy `amplify.yml`)
- **Output directory**: Zostaw PUSTE
- **Base directory**: `frontend` (opcjonalnie)

**App settings → General:**
- **Framework**: Musi być **Next.js (SSR)**

### 4. Zcommituj zmiany:
```bash
git add frontend/tsconfig.json amplify.yml
git commit -m "Update config to match Amplify Next.js template (monorepo)"
git push
```

## Sprawdzenie:

Po buildzie w Amplify, sprawdź logi:
1. Czy build zakończył się sukcesem?
2. Czy widzisz folder `.next` w artifacts?
3. Czy `baseDirectory: frontend/.next` jest poprawne?

## Jeśli nadal masz 404:

1. **Sprawdź Framework** w Amplify Console → App settings → General
   - Musi być: **Next.js (SSR)**
   - Jeśli nie → utwórz nową aplikację Amplify

2. **Sprawdź logi buildu**:
   - Czy `.next` folder jest tworzony?
   - Czy artifacts są kopiowane z `frontend/.next`?

3. **Sprawdź czy `frontend/app/page.tsx` istnieje** (strona główna)

