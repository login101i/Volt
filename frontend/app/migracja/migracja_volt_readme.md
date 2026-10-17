# Migracja Volt → Hetzner VPS + elektrykpoznan.online

**Dla agenta / operatora na VPS.**  
Czytaj ten plik od góry. Wykonuj **jeden etap naraz**. Po każdym etapie odhacz checkbox i dopiero idź dalej.

| | |
|---|---|
| **Aplikacja** | Volt / ELGEN (Next.js 15 + Express) |
| **Domena docelowa** | `https://elektrykpoznan.online` (+ `www`) |
| **Wzorzec sukcesu** | `opticut.pl` na Hetzner (Docker + Caddy + GitHub Actions) |
| **Data stanu** | 2026-10-17 |
| **UI checklisty** | `/migracja` (localStorage: `volt_migracja_checks`) |
| **Źródło architektury kodu** | `server/README.md`, root `AGENTS.md` |

---

## 0. Instrukcja dla drugiego agenta (VPS)

1. **Nie ruszaj Opticut.** Jeśli na maszynie jest `/opt/opticut` albo działa `www.opticut.pl` — to osobny projekt. Volt idzie do **`/opt/volt`**.
2. **Nie uruchamiaj** rootowego `docker-compose.yml` ani `.github/workflows/deploy-hetzner.yml` z tego repo w obecnym kształcie — to kopia Opticut (port `8000`, `/api/v1`, katalog `/opt/opticut`).
3. **Nie commituj** `server/.env`, haseł, kluczy SSH, dumpów z ofertami.
4. Po każdym etapie: krótki raport (co zrobione, IP, wynik `curl`, błędy).
5. Preferowany tryb: **osobny VPS** `volt-prod-01`. Współdzielenie z Opticut tylko gdy świadomie zmienisz porty Volta (Next ≠ 3000).
6. Hasło MySQL bierz z lokalnego `server/.env` operatora albo panelu Cyber Folks — **nie zapisuj go w tym pliku**.

---

## 1. Stan migracji (snapshot)

### Legenda

| Status | Znaczenie |
|--------|-----------|
| **BLOKER** | Bez tego produkcja nie wstanie / zniszczy Opticut |
| **TODO** | Do zrobienia na VPS / w DNS |
| **GOTOWE (częściowo)** | Zrobione lokalnie / w bazie; wymaga jeszcze konfiguracji z VPS |

### Tablica etapów

| # | Etap | Status | Notatka |
|---|------|--------|---------|
| 0 | Świadomość: pliki Opticut ≠ Volt | **BLOKER** | Compose + GHA w repo są złe dla Volta |
| 1 | Osobny VPS Hetzner | **TODO** | Nie zaczynaj od tego samego VPS co Opticut |
| 2 | Bezpieczeństwo (SSH, UFW, Fail2Ban) | **TODO** | Jak etap 2 Opticut |
| 3 | Docker + clone → `/opt/volt` | **TODO** | Osobny deploy key |
| 4 | Dockerfile + compose pod Volt | **BLOKER** | **Brak** `Dockerfile` w repo |
| 5 | `server/.env` na serwerze | **TODO** | Plik nie jest w gicie |
| 6 | MariaDB Cyber Folks | **GOTOWE (częściowo)** | Tabele + seed lokalnie; VPS musi mieć dostęp zdalny |
| 7 | Dane trwałe (`offers.json`, kalkulator) | **TODO** | `server/data/` w `.gitignore` |
| 8 | Caddy HTTPS + routing `/api` | **TODO** | Inny routing niż Opticut (`/api/media` → Next) |
| 9 | DNS A → IP VPS | **TODO** | Panel Cyber Folks; nie ruszaj MX |
| 10 | GitHub Actions pod Volta | **BLOKER** | Obecny workflow wdraża Opticut |
| 11 | Smoke test na domenie | **TODO** | Hub + health + komponenty + zapis oferty |
| 12 | Backup + monitoring | **TODO** | Oferty = jeden plik JSON |

### Co już jest zrobione lokalnie (nie na VPS)

- [x] Stack działa lokalnie: frontend `:3000`, Express `:5000`
- [x] MariaDB `lxsxnvawhg_volt` na Cyber Folks `s78`
- [x] DDL: `server/sql/create_tables.sql` (`electric_components`, `fuse_types`)
- [x] Seed komponentów ze zdjęć: `server/sql/seed_from_images.sql` (54 pozycje + fuse types)
- [x] Strona przewodnika: `frontend/app/migracja/page.tsx` + dane `frontend/lib/migrationGuide.ts`
- [x] Referencja Opticut (nauka, nie uruchamiać 1:1): `databaseMigration_Hetzner_readme.md`, `docker-compose.yml`, `.github/workflows/deploy-hetzner.yml`

### Czego brakuje w repo (blokery kodu)

- [ ] `frontend/Dockerfile` (Next standalone)
- [ ] `server/Dockerfile` (Express, port 5000)
- [ ] `docker-compose.yml` **dla Volta** (obecny plik = Opticut)
- [ ] `Caddyfile` przykład w repo (opcjonalnie; na VPS jako usługa systemowa)
- [ ] `.github/workflows/deploy-volt.yml` (lub przebudowa starego pod `/opt/volt`)
- [ ] Trwały packing `electricalComponents.js` (dziś poza gitem) — albo dokumentacja skąd go wziąć na VPS

---

## 2. Architektura docelowa

```
Internet
   │
   ▼
DNS Cyber Folks  (A @ / www → IPv4 VPS)
   │
   ▼
Caddy :80/:443   (Let's Encrypt, jedyny publiczny entry)
   │
   ├── /api/media*  /api/proxy*  →  127.0.0.1:3000  (Next)
   ├── /api/*       /health      →  127.0.0.1:5000  (Express)
   └── /*                        →  127.0.0.1:3000  (Next)
                                      │
                                      ▼
                               Express :5000
                                      │
                    ┌─────────────────┼─────────────────┐
                    ▼                 ▼                 ▼
           MariaDB Cyber Folks   /opt/volt-data    (opcjonalnie S3)
           electric_components   offers.json       upload zdjęć
           fuse_types            electricalComponents.js
```

### Porty (osobny VPS)

| Usługa | Bind na hoście | Publicznie |
|--------|----------------|------------|
| Caddy | `0.0.0.0:80`, `:443` | tak |
| Next | `127.0.0.1:3000` | nie |
| Express | `127.0.0.1:5000` | nie |

### Różnice vs Opticut (krytyczne)

| | Opticut (działa) | Volt (cel) |
|--|------------------|------------|
| Katalog na VPS | `/opt/opticut` | `/opt/volt` |
| API Express | `:8000`, prefix `/api/v1` | `:5000`, prefix `/api` |
| Health | `/api/v1/health` | `/health` |
| Redis | tak | **nie** |
| Moduły / deploy-flags | tak | **nie** |
| Oferty | (u nich DB/app) | plik `offers.json` |
| Komponenty | ich MySQL | MariaDB CF `electric_components` |
| Domena | `www.opticut.pl` | `elektrykpoznan.online` |

---

## 3. Kroki po kolei (wykonuj w tej kolejności)

### Etap 0 — STOP: nie odpalaj plików Opticut

**Status: BLOKER (świadomość)**

- [ ] Przeczytaj różnice w tabeli powyżej
- [ ] Oznacz obecny `docker-compose.yml` jako „wzorzec Opticut, nie produkcja Volt”
- [ ] Nie ustawiaj sekretów GitHub pod obecny `deploy-hetzner.yml` dla tego repo, dopóki skrypt nie wskazuje `/opt/volt`

**Gdy to zignorujesz:** `git push` może przebudować Opticut albo padnie na brakujących Dockerfile; domena Volt dalej wskaże stary hosting.

---

### Etap 1 — VPS

**Status: TODO**

- [ ] Hetzner Cloud → nowy serwer, np. `volt-prod-01`
- [ ] Ubuntu LTS, lokalizacja DE (jak Opticut)
- [ ] Rekomendacja: CX22 / CPX22 (2 vCPU, 4 GB RAM) — Next build + Docker potrzebują zapasu
- [ ] Zapisz **IPv4** — potrzebny do DNS i allowlist MySQL
- [ ] `ssh root@<IP>` → utwórz użytkownika z sudo (wzór: `maciej` na Opticut)

**Alternatywa (niezalecana na start):** ten sam VPS co Opticut → Volt Next na `127.0.0.1:3100`, Express `127.0.0.1:5000`, Caddy rozdziela po `Host`.

**Kryterium ukończenia:** logujesz się kluczem SSH na nową maszynę, znasz IP.

---

### Etap 2 — Bezpieczeństwo

**Status: TODO** (wzór: Opticut etap 2)

- [ ] Klucz SSH, wyłączone logowanie hasłem
- [ ] Wyłączony login `root` po SSH (po sprawdzeniu, że user z sudo działa)
- [ ] UFW: allow `22`, `80`, `443` → enable
- [ ] Firewall w panelu Hetzner: to samo
- [ ] Fail2Ban (jail `sshd`)
- [ ] `unattended-upgrades`

**Kryterium:** z internetu widać tylko 22/80/443; `3000` i `5000` nie są otwarte publicznie.

---

### Etap 3 — Docker + Git

**Status: TODO**

```bash
# na VPS (jako user z sudo)
sudo mkdir -p /opt/volt /opt/volt-data
sudo chown "$USER":"$USER" /opt/volt /opt/volt-data

# Docker Engine + Compose plugin (oficjalna instalacja Docker)
# Deploy key GitHub (read-only) → ~/.ssh/...  Host github.com

git clone git@github.com:<ORG_LUB_USER>/<REPO_VOLT>.git /opt/volt
cd /opt/volt
git checkout main
```

- [ ] Docker działa: `docker run --rm hello-world`
- [ ] Repo w `/opt/volt`
- [ ] Katalog danych `/opt/volt-data` istnieje

**Kryterium:** `ls /opt/volt/frontend /opt/volt/server` działa.

---

### Etap 4 — Obrazy Docker (BLOKER — najpierw kod w repo)

**Status: BLOKER**

W repo **nie ma** jeszcze Dockerfile Volta. Agent lokalny / ten sam agent musi dodać pliki do gita, potem na VPS:

- [ ] `frontend/Dockerfile` — Next **standalone**, `ARG NEXT_PUBLIC_API_URL=https://elektrykpoznan.online`
- [ ] `server/Dockerfile` — Node, listen `PORT=5000`, health `GET /health`
- [ ] Nowy `docker-compose.yml` Volta:
  - **bez** Redis
  - frontend: `127.0.0.1:3000:3000`
  - server: `127.0.0.1:5000:5000`, `env_file: ./server/.env`
  - volume: `/opt/volt-data:/app/data` (dopasuj ścieżkę w kontenerze do tego, gdzie Express czyta `data/`)
- [ ] Na VPS: `docker compose build && docker compose up -d`

**Docelowy szkic compose (do napisania, nie uruchamiać obecnego pliku Opticut):**

```yaml
services:
  frontend:
    restart: unless-stopped
    build:
      context: ./frontend
      dockerfile: Dockerfile
      args:
        NEXT_PUBLIC_API_URL: https://elektrykpoznan.online
    ports:
      - "127.0.0.1:3000:3000"
    depends_on:
      - server
    environment:
      - NODE_ENV=production

  server:
    restart: unless-stopped
    build:
      context: ./server
      dockerfile: Dockerfile
    ports:
      - "127.0.0.1:5000:5000"
    env_file:
      - ./server/.env
    volumes:
      - /opt/volt-data:/app/data
```

**Kryterium:**  
`curl -fI http://127.0.0.1:5000/health` oraz `curl -fI http://127.0.0.1:3000` lokalnie na VPS = OK.

---

### Etap 5 — Sekrety (`server/.env`)

**Status: TODO**

```bash
nano /opt/volt/server/.env
chmod 600 /opt/volt/server/.env
```

Szablon produkcyjny (hasło uzupełnij ręcznie):

```env
PORT=5000
HOST=0.0.0.0
NODE_ENV=production

FRONTEND_URL=https://elektrykpoznan.online
PRODUCTION_FRONTEND_URL=https://elektrykpoznan.online
# opcjonalnie jeśli używasz www:
# FRONTEND_URL=https://www.elektrykpoznan.online

MYSQL_HOST=s78.cyber-folks.pl
# Port: lokalnie / HeidiSQL często 3308.
# Z VPS sprawdź, który port przyjmuje Cyber Folks dla remote MySQL (3306 lub 3308).
MYSQL_PORT=3308
MYSQL_DATABASE=lxsxnvawhg_volt
MYSQL_USER=lxsxnvawhg_volt
MYSQL_PASSWORD=<HASLO_Z_PANELU_CF>
```

- [ ] Plik istnieje, `chmod 600`
- [ ] CORS wskazuje domenę produkcyjną
- [ ] Test połączenia z VPS do MySQL (np. kontener tymczasowy `mysql` client albo logi Express)

**Kryterium:** `GET /api/components` przez Express na VPS zwraca listę (nie błąd połączenia).

---

### Etap 6 — Baza danych (Cyber Folks)

**Status: GOTOWE częściowo**

Już lokalnie / w CF:

- [x] Tabele `electric_components`, `fuse_types`
- [x] Seed `server/sql/seed_from_images.sql`

Na VPS / w panelu CF:

- [ ] Włącz **Remote MySQL**
- [ ] Allowlist: **IPv4 nowego VPS**
- [ ] Zweryfikuj port (`3308` vs `3306`) z VPS
- [ ] **Nie** migruj MySQL na Hetzner w dniu przełączenia DNS (osobny etap, jak u Opticut)

Oferty **nie** są w SQL — plik JSON (etap 7).

**Kryterium:** z VPS: zapytanie do `electric_components` działa; `SELECT COUNT(*) FROM fuse_types` > 0.

---

### Etap 7 — Dane trwałe

**Status: TODO**

`server/data/` jest w `.gitignore`. Po clone / w obrazie Dockera **nie będzie**:

- `offers.json`
- `electricalComponents.js` (wymagany przez `offerCalculator.js`)

- [ ] Volume `/opt/volt-data` zamontowany w kontenerze server
- [ ] Utwórz / skopiuj `offers.json` (może być `[]` na start)
- [ ] Wgraj `electricalComponents.js` z maszyny deweloperskiej (backup lokalny operatora)
- [ ] Zdjęcia katalogu: są w `frontend/public/pictures/electricComponents/` → wejdą do obrazu Next przy buildzie. Nowe uploady: wolumen albo S3 (`/api/media`)

**Kryterium:** utworzenie oferty przez API nie pada na `Cannot find module ... electricalComponents`; po `docker compose up -d --build` oferty nadal są na dysku.

---

### Etap 8 — Caddy

**Status: TODO**

Caddy jako **usługa systemowa** (nie w compose aplikacji) — jak Opticut.

```caddyfile
elektrykpoznan.online, www.elektrykpoznan.online {
	encode gzip

	# Next (S3 signed URL + proxy ngrok-style) — MUSI być przed /api/*
	handle /api/media* {
		reverse_proxy 127.0.0.1:3000
	}
	handle /api/proxy* {
		reverse_proxy 127.0.0.1:3000
	}

	# Express
	handle /api/* {
		reverse_proxy 127.0.0.1:5000
	}
	handle /health {
		reverse_proxy 127.0.0.1:5000
	}

	# Reszta UI
	handle {
		reverse_proxy 127.0.0.1:3000
	}
}
```

- [ ] UFW pozwala 80/443
- [ ] `caddy validate` + `systemctl reload caddy`
- [ ] Certyfikat dopiero **po** poprawnym DNS (etap 9)

**Kryterium:** lokalnie na VPS przez Caddy (po DNS) HTTPS działa; `/api/components` → Express, `/` → Next.

---

### Etap 9 — DNS (Cyber Folks)

**Status: TODO**

| Rekord | Host | Wartość |
|--------|------|---------|
| A | `@` | `<IPv4 VPS>` |
| A | `www` | `<IPv4 VPS>` |
| MX / poczta | — | **nie zmieniaj** |

- [ ] TTL krótki (np. 300) na czas migracji
- [ ] `nslookup elektrykpoznan.online` → IP VPS
- [ ] Jeśli używasz `www`, dodaj origin do CORS w Express

**Kolejność:** DNS najpierw (lub równolegle z Caddy), potem czekaj na certyfikat LE.  
**Kryterium:** `curl -fI https://elektrykpoznan.online` z Twojego PC.

---

### Etap 10 — GitHub Actions (BLOKER)

**Status: BLOKER**

Obecny `.github/workflows/deploy-hetzner.yml`:

- `cd /opt/opticut`
- buduje Redis + server `:8000`
- health: `https://www.opticut.pl/api/v1/health`

Potrzebny **nowy** workflow, np. `deploy-volt.yml`:

```bash
cd /opt/volt
git fetch origin main
git reset --hard origin/main
docker compose build
docker compose up -d
curl -fI http://127.0.0.1:5000/health
curl -fI http://127.0.0.1:3000
curl -fI https://elektrykpoznan.online
curl -fI https://elektrykpoznan.online/health
```

- [ ] Sekrety: `HETZNER_HOST` / `USER` / `SSH_KEY` **nowego** VPS (albo osobne nazwy `VOLT_*`)
- [ ] `workflow_dispatch` + push na `main`
- [ ] **Nie** kopiuj logiki Modules / Redis / `/api/v1` z Opticut

**Kryterium:** ręczny dispatch zielony; Opticut nadal działa niezależnie.

---

### Etap 11 — Dowód działania

**Status: TODO**

- [ ] `https://elektrykpoznan.online` → hub / landing Volt
- [ ] `https://elektrykpoznan.online/health` → OK
- [ ] `/calculation` ładuje komponenty + zdjęcia `/pictures/electricComponents/...`
- [ ] Nowa oferta → widać na `/orders` po odświeżeniu
- [ ] DevTools: brak CORS / mixed content

---

### Etap 12 — Backup i monitoring

**Status: TODO**

- [ ] Cron: `tar` `/opt/volt-data` codziennie (oferty + kalkulator)
- [ ] Dump MariaDB z CF (dopóki baza tam jest)
- [ ] Uptime Kuma: check domeny + `/health` (można dodać do istniejącej instalacji Opticut przez SSH tunnel)
- [ ] Okresowo: `docker builder prune` (cache Next zjada dysk)

---

## 4. Pliki w tym repo — mapa dla agenta

| Plik | Rola przy migracji |
|------|--------------------|
| `frontend/app/migracja/migracja_volt_readme.md` | **Ten dokument** — stan + kroki |
| `frontend/app/migracja/page.tsx` | UI checklisty w aplikacji |
| `frontend/lib/migrationGuide.ts` | Treść kroków UI |
| `server/README.md` | Architektura API / env |
| `AGENTS.md` | Skrót dla agentów |
| `server/sql/create_tables.sql` | DDL |
| `server/sql/seed_from_images.sql` | Seed 54 komponentów + fuse |
| `docker-compose.yml` | ⚠️ **Opticut** — nie używać dla Volta |
| `.github/workflows/deploy-hetzner.yml` | ⚠️ **Opticut** — nie używać dla Volta |
| `databaseMigration_Hetzner_readme.md` | Notatki nauki z Opticut (długie) |

---

## 5. Smoke commands (kopiuj na VPS)

```bash
# Kontenery
cd /opt/volt && docker compose ps
docker compose logs --tail=80 server
docker compose logs --tail=80 frontend

# Lokalnie na hoście
curl -fI http://127.0.0.1:5000/health
curl -fI http://127.0.0.1:3000
curl -sf http://127.0.0.1:5000/api/components | head -c 200

# Po DNS + Caddy
curl -fI https://elektrykpoznan.online
curl -fI https://elektrykpoznan.online/health
curl -sf https://elektrykpoznan.online/api/components | head -c 200
```

---

## 6. Pułapki (z Opticut + Volt)

1. **Commit ≠ deploy.** Lokalny commit nic nie wdraża, dopóki nie ma push + Actions (albo ręcznego pull na VPS).
2. **Obecny compose/workflow = Opticut.** Uruchomienie = ryzyko zniszczenia `/opt/opticut`.
3. **`server/data/` poza gitem.** Bez volume oferty znikają przy rebuildzie; bez `electricalComponents.js` pada tworzenie oferty.
4. **Kolejność Caddy:** `/api/media` przed `/api/*`, inaczej upload/S3 idzie w Express → 404.
5. **Port MySQL:** lokalnie często `3308`; z VPS potwierdź remote port w panelu CF i allowlist IP.
6. **CORS:** `FRONTEND_URL` / `PRODUCTION_FRONTEND_URL` muszą być dokładnym originem przeglądarki (`https://…` bez slash na końcu, zgodny z www lub bez).
7. **`NEXT_PUBLIC_API_URL`:** wbudowywany przy **buildzie** frontu. Na produkcji zwykle pełna domena lub relative — jeśli ustawisz `http://localhost:5000` w obrazie produkcyjnym, przeglądarka klienta nie dotrze do API.
8. **Docker Build Cache** zjada dysk — `docker builder prune` gdy dysk > ~70%.
9. **Nie migruj bazy i DNS tego samego dnia** jeśli nie musisz — najpierw app na VPS + remote MySQL, DNS na końcu.

---

## 7. Minimalna ścieżka „strona w internecie” (MVP)

Żeby **elektrykpoznan.online** w ogóle żyło, wystarczy w tej kolejności:

1. Etap 1–3 (VPS + security + Docker/clone)  
2. Etap 4–5 (Dockerfile/compose + `.env`) ← **najpierw kod w repo**  
3. Etap 6–7 (remote MySQL + volume z danymi)  
4. Etap 8–9 (Caddy + DNS)  
5. Etap 11 (smoke)  

Etapy 10 i 12 (Actions, backup) domykają produkcję jak u Opticut, ale nie blokują pierwszego HTTPS.

---

## 8. Log postępów (wypełniaj podczas pracy na VPS)

| Data | Etap | Kto | Wynik | IP / uwagi |
|------|------|-----|-------|------------|
| 2026-10-17 | — | lokalnie | README + UI `/migracja`; seed SQL; brak Dockerfile Volt | — |
| | 1 | | | |
| | 2 | | | |
| | 3 | | | |
| | 4 | | | |
| | 5 | | | |
| | 6 | | | |
| | 7 | | | |
| | 8 | | | |
| | 9 | | | |
| | 10 | | | |
| | 11 | | | |
| | 12 | | | |

---

## 9. Definicja „migracja zakończona”

- [ ] `https://elektrykpoznan.online` serwuje Volt (nie stary hosting CF)
- [ ] HTTPS ważny (Caddy / LE)
- [ ] `/health` OK
- [ ] Katalog komponentów z MariaDB działa
- [ ] Oferta zapisuje się i przeżywa restart kontenerów
- [ ] Deploy z gita nie rusza Opticut
- [ ] Jest backup `/opt/volt-data` + alert uptime

Dopóki którykolwiek punkt powyżej jest nieoznaczony — migracja **nie jest** zakończona.
