# Naprawa lokalnego buildu - Błąd EPERM

## Problem
```
Error: EPERM: operation not permitted, open 'D:\Volt\frontend\.next\trace'
```

## Rozwiązanie

Folder `.next` jest zablokowany. Usuń go ręcznie:

### Metoda 1: PowerShell (jako Administrator)
```powershell
cd frontend
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
```

### Metoda 2: Eksplorator Windows
1. Zamknij wszystkie procesy Node.js/Next.js
2. Otwórz Eksplorator Windows
3. Przejdź do `D:\Volt\frontend`
4. Usuń folder `.next` (może wymagać uprawnień administratora)

### Metoda 3: Task Manager
1. Otwórz Task Manager (Ctrl+Shift+Esc)
2. Znajdź wszystkie procesy `node.exe`
3. Zakończ je wszystkie
4. Usuń folder `.next`

Po usunięciu folderu `.next`, uruchom build ponownie:
```bash
npm run build:frontend
```

