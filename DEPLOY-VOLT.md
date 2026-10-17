# Volt na Hetzner — pierwszy deploy na tym samym VPS co Opticut

Volt używa osobnego katalogu `/opt/volt`, osobnego Compose project `volt` i portów lokalnych `3100` (Next) oraz `5000` (Express). Opticut pozostaje w `/opt/opticut` na portach `3000` i `8000`. Nie używaj dla Volta głównego `docker-compose.yml` ani workflow `deploy-hetzner.yml` — są konfiguracją Opticut.

## Konfiguracja przygotowana w tym repo

- `frontend/Dockerfile` — buduje Next.js 15.
- `server/Dockerfile` — uruchamia Express przez `tsx` na porcie 5000.
- `docker-compose.volt.yml` — Volt na `127.0.0.1:3100` i `127.0.0.1:5000`, dane w `/opt/volt-data`.
- `deploy/Caddyfile.volt.example` — osobna witryna Caddy dla `elektrykpoznan.online` i `www`.
- `.github/workflows/deploy-volt.yml` — deploy wyłącznie z `/opt/volt`; osobne sekrety `VOLT_HOST`, `VOLT_USER`, `VOLT_SSH_KEY`.

## Przed pierwszym uruchomieniem

1. Na VPS sprawdź zasoby i wolne porty: `free -h`, `df -h /`, `docker ps --format 'table {{.Names}}\t{{.Ports}}'`. Budowa Next zużywa pamięć; nie uruchamiaj builda, jeśli VPS jest już pod presją pamięci lub dysku.
2. Upewnij się, że repo Volta jest sklonowane do `/opt/volt`, a użytkownik deployu może wejść przez SSH. Na VPS skonfiguruj osobny klucz tylko do odczytu repozytorium GitHub.
3. Utwórz trwały katalog danych: `sudo mkdir -p /opt/volt-data && sudo chown maciej:maciej /opt/volt-data` (jeśli deploy wykonuje inny użytkownik, ustaw jego właściciela).
4. Skopiuj `server/data/electricalComponents.js` z lokalnego projektu do `/opt/volt-data/electricalComponents.js`. Backend importuje ten plik przy starcie, a `server/data` jest pomijany przez Git. Oferty w `offers.json` są danymi klientów: nie kopiuj ich na serwer bez świadomej decyzji; jeśli nie zostaną skopiowane, Volt utworzy pustą listę przy pierwszym użyciu.
5. Utwórz `/opt/volt/server/.env` z `PORT=5000`, `HOST=0.0.0.0`, `NODE_ENV=production`, `FRONTEND_URL=https://elektrykpoznan.online`, `PRODUCTION_FRONTEND_URL=https://elektrykpoznan.online`, `MYSQL_HOST=s78.cyber-folks.pl`, `MYSQL_PORT=3308`, `MYSQL_DATABASE=lxsxnvawhg_volt`, `MYSQL_USER=lxsxnvawhg_volt`, `MYSQL_PASSWORD=...`. Hasło wpisz wyłącznie na VPS; plik nie może trafić do Git.
6. W panelu Cyber Folks włącz zdalny MySQL i dodaj publiczny IPv4 VPS do allowlisty. Nie zmieniaj rekordów MX domeny.
7. Zweryfikuj Compose bez uruchamiania kontenerów: `cd /opt/volt && docker compose -p volt -f docker-compose.volt.yml config --quiet`.
8. Uruchom pierwszy build i kontenery ręcznie jako użytkownik deployu:
   `docker compose -p volt -f docker-compose.volt.yml build`
   `docker compose -p volt -f docker-compose.volt.yml up -d`
9. Sprawdź lokalnie na VPS: `curl -f http://127.0.0.1:5000/health` i `curl -I http://127.0.0.1:3100`.
10. Dopiero gdy aplikacja przechodzi te testy, dodaj blok z `deploy/Caddyfile.volt.example` do istniejącego `/etc/caddy/Caddyfile`, zweryfikuj `sudo caddy validate --config /etc/caddy/Caddyfile`, a następnie `sudo systemctl reload caddy`.
11. Skieruj rekordy A dla `@` i `www` na IPv4 VPS. Nie zmieniaj MX. Po propagacji sprawdź `https://elektrykpoznan.online`, `/health` i `/api/components`.
12. Dodaj w GitHub Actions sekrety `VOLT_HOST`, `VOLT_USER`, `VOLT_SSH_KEY`. Workflow jest na razie ręczny (`workflow_dispatch`), żeby merge konfiguracji nie próbował deployu przed przygotowaniem VPS. Po udanym pierwszym wdrożeniu można dodać automatyczny trigger push na `main`.

## Ważne

- Workflow wykonuje `git reset --hard origin/main` wyłącznie w `/opt/volt` i buduje Compose z `docker-compose.volt.yml`.
- `/opt/volt-data` nie jest częścią obrazu ani repozytorium, więc przetrwa przebudowę kontenerów.
- Upload przez Next `/api/media` trafia do Next, a `/api/*` do Express. Reguły z przykładowego Caddyfile zachowują tę kolejność.
- Publiczne porty powinny pozostać tylko 22, 80 i 443. Porty 3100 i 5000 są związane z `127.0.0.1`.
- W tym folderze źródłowym nie ma katalogu `.git`; zanim użyjesz push, sprawdź, czy właściwe repozytorium GitHub jest podłączone. Nie inicjalizuj repozytorium ani nie dodawaj zdalnego origin bez ustalenia właściwego adresu.
