# Migracja bazy / wdrożenie Opticut na Hetzner

#reminder  - proszę aby ddodając  wyjaśnienia etpaów abyś koncentrował sie na wyjaśnieniu mi zrobionych rzeczy w sposób prosty, intyuicyjny (tak aby dizecko zrozumialo) to co zostało zrobione w każdym kroki. Interesuje mnie dlaczego coś zostało zrobione i czemu to słuzy i co byłoby gdyby tego nie było ustawionego.

Plan przeniesienia produkcji (baza + aplikacja) z Cyberfolks na Hetzner Cloud.
**Źródło prawdy roadmapy:** sekcja „Roadmap wdrożenia Opticut” (13 etapów) poniżej.
Mapa na `/settings/databaseMigrationHetzner` powtarza te etapy + checklisty.

**Uzupełnienie 16.10.2026:** [Dev, produkcja i wersje klientów](#dev-produkcja-i-wersje-klientów) — plan środowiska testowego, zatwierdzania wdrożeń, cofania wersji i funkcji tylko dla Decorum. Status: **do wdrożenia**. Strona pokazuje go osobno od licznika 13 etapów (dane: `constants/releasePlanning.ts` — nowe tracki/kroki dodajesz tam, strona je renderuje automatycznie).

Status: **czerwony** = do zrobienia, **zielony** = zrobione.
Strona: filary DevOps u góry · najazd/klik → przewodnik (⅘ ekranu) · Draw Tool → `IntegrationDrawTool`.

Źródło bazy: MySQL Cyberfolks `cxdmqycbnn_docker_catcat` (host `s72.cyber-folks.pl`).
Cel: MySQL 8 na VPS Hetzner + Docker (Next.js, Express, Caddy), osobny user DB (nie root).

Data startu: **07.10.2026** · VPS: `opticut-prod-01` · IP: `178.104.192.131`

## Skrót statusu (13 etapów)

| Etap | Temat | Status |
|------|--------|--------|
| 1 | Przygotowanie serwera | zielony (dzień 1 · 7.10) |
| 2 | Bezpieczeństwo | zielony (6/6 · Fail2Ban + auto-updates 9.10) |
| 3 | Docker | zielony (dzień 3 · 9.10) |
| 4 | Git | zielony (+ ręczny deploy push→pull→build · 10.10) |
| 5 | MySQL | czerwony (backend łączy się z Cyberfolks) |
| 6 | Backend | zielony (healthy · Cyberfolks + Redis · 9.10) |
| 7 | Frontend | zielony (lean + rebuild po pull · produkcja HTTPS) |
| 8 | Reverse Proxy (Caddy) | zielony (Caddy+HTTPS · 10.10 · www.opticut.pl) |
| 9 | GitHub Actions | zielony (deploy-hetzner.yml · push → SSH · 11.10) |
| 10 | Domena | częściowo (opticut.pl + www OK · clientN później) |
| 11 | Monitoring | zielony (Kuma + Prometheus + Grafana · 11.10) |
| 12 | Backup | czerwony — **następny krok** |
| 13 | Skalowanie | czerwony |

## Filary DevOps (dlaczego nie kończymy na „app działa”)

Wdrożenie aplikacji to tylko część pracy. Stopniowo dokładamy:

- **Bezpieczeństwo** — kto i jak może zalogować się na serwer
- **Niezawodność** — co gdy aplikacja się zawiesi
- **Automatyzacja** — nowa wersja jednym `git push`
- **Monitoring** — skąd wiemy, że serwer działa poprawnie
- **Backupy** — jak odzyskać dane po awarii
- **Skalowanie** — więcej klientów bez przebudowy całej infrastruktury

Na końcu: działający Opticut + zrozumienie, dlaczego produkcja wygląda właśnie tak.

## Wskazówki dla użytkownika (CHATBOT HINTS)

- Roadmapa 13 etapów Opticut na Hetzner: /settings/databaseMigrationHetzner.
- Etapy 1–4, 6–9, 11 zielone; 10 częściowo. Publicznie: https://www.opticut.pl/panel
- Deploy: `git push` → Actions (`deploy-hetzner.yml`) → pull+build na VPS. Awaryjnie: ręczny pull+build.
- Obecny deploy dotyczy `push` na `main`; sam commit lokalny nie wdraża kodu. Model `develop` → dev → akceptacja → produkcja jest dopiero planem opisanym poniżej.
- Monitoring `/opt/opticut/monitoring`: Kuma :3001, Grafana :3002 — tylko SSH tunnel. Discord webhook = sekret.
- Lekcje: commit≠push; handle≠handle_path; `$`→`$$`; Docker Build Cache → `docker builder prune`.
- **Następny: Etap 12 Backup.** GuideDrawer day5 = monitoring.


------- dodatek z pierwszego dnia wdrożenia ------------
# Opticut Production - Wdrożenie na Hetzner Cloud

Autor: Maciej Kruszyniak

Data rozpoczęcia: 07.10.2026

---

# Cel projektu

Celem jest zbudowanie nowoczesnego środowiska produkcyjnego dla aplikacji Opticut opartej o:

- Next.js
- Node.js (Express)
- MySQL 8
- Docker
- Docker Compose
- Caddy
- GitHub Actions
- Ubuntu Server
- Hetzner Cloud

Docelowo aplikacja ma obsługiwać wielu klientów:

- client1.opticut.pl
- client2.opticut.pl
- client3.opticut.pl

bez konieczności stawiania kolejnych serwerów.

---

# Architektura (docelowa)

Internet

↓

Caddy (HTTPS + Reverse Proxy)

↓

Next.js

↓

Node.js (Express API)

↓

MySQL 8

Całość uruchomiona w Docker Compose.

---

# Co zrobiliśmy dzisiaj

## 1. Założenie konta Hetzner

Założyłem konto w Hetzner Cloud.

Dodałem metodę płatności.

Zweryfikowałem konto.

Doładowałem konto kwotą 25 EUR.

Saldo będzie wykorzystywane do opłacania serwerów.

---

## 2. Utworzenie projektu

Utworzyłem projekt:

Opticut Production

Projekt jest kontenerem organizacyjnym.

W projekcie znajdują się później:

- serwery
- firewalle
- sieci
- backupy
- adresy IP

Projekt nie jest serwerem.

---

## 3. Utworzenie VPS

Utworzyłem pierwszy VPS.

Nazwa:

opticut-prod-01

Parametry:

- Nuremberg
- Ubuntu LTS
- CPX22
- 2 vCPU
- 4 GB RAM
- 80 GB SSD

Adres IPv4:

178.104.192.131

---

## Dlaczego wybrałem CPX22?

2 GB RAM byłoby wystarczające na start.

Jednak moja aplikacja korzysta z:

- Next.js
- Node.js
- Docker
- MySQL
- Caddy

Dlatego 4 GB RAM daje większy zapas i lepszą stabilność.

---

## 4. Pierwsze logowanie

Połączyłem się z serwerem:

ssh root@178.104.192.131

---

## 5. Aktualizacja systemu

Wykonałem:

apt update

apt upgrade -y

Po aktualizacji wykonałem restart serwera.

---

## 6. Restart kernela

Po aktualizacji został zainstalowany nowy kernel.

Uruchomiłem:

reboot

Po ponownym zalogowaniu:

uname -r

Potwierdziło nową wersję kernela.

---

## 7. Utworzenie użytkownika

Utworzyłem użytkownika:

maciej

Następnie dodałem go do grupy sudo.

Od tej chwili nie pracuję już jako root.

---

## 8. SSH

Wygenerowałem klucz:

ssh-keygen -t ed25519

Klucz publiczny dodałem do Hetzner Cloud.

Następnie skopiowałem authorized_keys do użytkownika maciej.

Sprawdziłem logowanie:

ssh maciej@178.104.192.131

Logowanie działa bez hasła.

---

# Plan na jutro

- zabezpieczenie SSH
- wyłączenie logowania root
- firewall
- Docker
- Docker Compose
- Git
- Caddy
- MySQL
- GitHub Actions
- wdrożenie Opticut

---

# Najważniejsze pojęcia

## VPS

Virtual Private Server.

Jest to wirtualny komputer działający w centrum danych.

W praktyce:

To właśnie na tym komputerze będzie działał Opticut.

---

## Hetzner Cloud

Dostawca serwerów VPS.

To odpowiednik AWS, Azure czy DigitalOcean.

Wybraliśmy go ze względu na świetny stosunek ceny do wydajności.

---

## Ubuntu Server

System operacyjny Linux.

Na nim instalujemy wszystkie usługi.

Można go traktować jak Windows Server, ale znacznie popularniejszy w świecie DevOps.

---

## SSH

Secure Shell.

Bezpieczny sposób logowania do serwera przez Internet.

W naszym projekcie:

PowerShell

↓

SSH

↓

Ubuntu

Od tej chwili wszystkie polecenia wykonujemy na serwerze.

---

## SSH Key

Klucz prywatny i publiczny.

To znacznie bezpieczniejsza metoda logowania niż hasło.

W naszym projekcie:

mój komputer posiada klucz prywatny,

serwer posiada klucz publiczny.

Jeżeli oba do siebie pasują,

serwer wpuszcza mnie bez wpisywania hasła.

---

## Root

Najwyższy administrator Linux.

Ma pełne prawa.

Będziemy wyłączać możliwość logowania jako root, ponieważ jest to jedna z podstawowych zasad bezpieczeństwa.

---

## User

Normalny użytkownik systemu.

W naszym projekcie jest nim:

maciej

Na co dzień będziemy pracować właśnie na tym koncie.

---

## sudo

Polecenie pozwalające zwykłemu użytkownikowi wykonać jedną komendę jako administrator.

Przykład:

sudo apt update

Nie musimy logować się jako root.

To zwiększa bezpieczeństwo.

---

## Kernel

Jądro systemu Linux.

To ono komunikuje się bezpośrednio ze sprzętem.

Po aktualizacji kernela konieczny był restart serwera.

---

## RAM

Pamięć operacyjna.

Node.js, MySQL i Docker wykorzystują RAM podczas pracy.

Dlatego wybraliśmy 4 GB.

---

## CPU

Procesor.

Obsługuje obliczenia wykonywane przez aplikację.

Wybraliśmy 2 vCPU.

---

## Docker

Jeszcze nie instalowaliśmy.

Docker pozwala uruchamiać aplikacje w izolowanych kontenerach.

Dzięki temu łatwo wdraża się nowe wersje aplikacji.

---

## Docker Compose

Jeszcze nie instalowaliśmy.

Pozwala uruchomić wiele kontenerów jednym poleceniem.

U nas będą to między innymi:

- Next.js
- Node.js
- MySQL
- Caddy

---

## Caddy

Nowoczesny serwer WWW.

Będzie:

- obsługiwał HTTPS
- automatycznie odnawiał certyfikaty SSL
- kierował ruch do Next.js

---

## GitHub Actions

Automatyczne wdrażanie aplikacji.

Po wysłaniu zmian do GitHub:

git push

↓

GitHub Actions

↓

Docker

↓

Nowa wersja Opticut

bez ręcznego kopiowania plików.

---

# Co już umiem po pierwszym dniu

✔ założyć konto Hetzner

✔ utworzyć projekt

✔ utworzyć VPS

✔ połączyć się przez SSH

✔ wygenerować klucz SSH

✔ zaktualizować Ubuntu

✔ zrestartować kernel

✔ utworzyć użytkownika

✔ pracować na serwerze Linux

---

# Cel końcowy

Chcę posiadać własną infrastrukturę produkcyjną dla Opticut opartą o nowoczesne technologie DevOps.

Nie chcę tylko umieć uruchomić aplikacji.

Chcę rozumieć, dlaczego każda technologia została użyta oraz jakie rozwiązuje problemy.





---

# Najważniejsze komendy z pierwszego dnia

> Ta sama lista jest w `constants/day1Commands.ts` i w przewodniku UI (Etap 1).

## Logowanie przez SSH

```bash
ssh root@178.104.192.131
```

lub

```bash
ssh maciej@178.104.192.131
```

### Co robi?

Łączy nasz komputer z serwerem Linux.

To polecenie będę wykonywał praktycznie codziennie.

---

## Generowanie klucza SSH (PowerShell)

```powershell
ssh-keygen -t ed25519 -C "maciej@opticut"
```

### Co robi?

Tworzy:

- klucz prywatny
- klucz publiczny

Dzięki nim mogę logować się na serwer bez hasła.

---

## Wyświetlenie klucza publicznego

```powershell
type $env:USERPROFILE\.ssh\id_ed25519.pub
```

### Co robi?

Pokazuje klucz publiczny, który dodaliśmy do Hetzner Cloud.

---

## Aktualizacja listy pakietów

```bash
sudo apt update
```

### Co robi?

Pobiera listę najnowszych wersji programów dostępnych w repozytoriach Ubuntu.

Nie instaluje jeszcze żadnych aktualizacji.

---

## Instalacja aktualizacji

```bash
sudo apt upgrade -y
```

### Co robi?

Instaluje wszystkie dostępne aktualizacje systemu.

Opcja **-y** automatycznie potwierdza instalację.

---

## Restart serwera

```bash
sudo reboot
```

lub

```bash
reboot
```

### Co robi?

Uruchamia serwer ponownie.

Najczęściej wykonuje się go po aktualizacji kernela.

---

## Sprawdzenie wersji kernela

```bash
uname -r
```

### Co robi?

Pokazuje aktualnie uruchomioną wersję jądra Linux.

Po restarcie sprawdziliśmy, czy działa już nowa wersja.

---

## Tworzenie użytkownika

```bash
sudo adduser maciej
```

### Co robi?

Tworzy nowego użytkownika systemu Linux.

Nie pracujemy na co dzień jako root.

---

## Nadanie uprawnień administratora

```bash
sudo usermod -aG sudo maciej
```

### Co robi?

Dodaje użytkownika do grupy administratorów.

Od tej chwili może używać polecenia:

```bash
sudo
```

---

## Sprawdzenie grup użytkownika

```bash
groups maciej
```

### Co robi?

Pokazuje, do jakich grup należy użytkownik.

Sprawdziliśmy, czy znajduje się w grupie **sudo**.

---

## Utworzenie katalogu

```bash
mkdir -p /home/maciej/.ssh
```

### Co robi?

Tworzy katalog.

Opcja **-p** oznacza:

"utwórz również brakujące katalogi i nie zgłaszaj błędu, jeśli już istnieją".

---

## Kopiowanie pliku

```bash
cp /root/.ssh/authorized_keys /home/maciej/.ssh/
```

### Co robi?

Kopiuje plik.

Tutaj skopiowaliśmy listę autoryzowanych kluczy SSH.

---

## Zmiana właściciela

```bash
chown -R maciej:maciej /home/maciej/.ssh
```

### Co robi?

Zmienia właściciela plików.

Opcja **-R** oznacza rekurencyjnie.

---

## Nadanie uprawnień katalogowi

```bash
chmod 700 /home/maciej/.ssh
```

### Co robi?

Nadaje odpowiednie prawa katalogowi.

SSH wymaga bardzo restrykcyjnych uprawnień.

---

## Nadanie uprawnień plikowi

```bash
chmod 600 /home/maciej/.ssh/authorized_keys
```

### Co robi?

Pozwala właścicielowi odczytywać i zapisywać plik.

Nikt inny nie ma dostępu.

---

# Co warto zapamiętać z pierwszego dnia

Nie chodzi o zapamiętanie wszystkich komend.

Ważniejsze jest zrozumienie kolejności pracy.

Typowy administrator Linux wykonuje mniej więcej taki proces:

1. Łączy się z serwerem przez SSH.

2. Aktualizuje system.

3. Restartuje serwer, jeśli zaktualizował się kernel.

4. Tworzy zwykłego użytkownika.

5. Nadaje mu uprawnienia administratora.

6. Konfiguruje logowanie przez SSH.

7. Dopiero wtedy zaczyna instalować aplikacje.

---

# Polecenia, które będę używał niemal codziennie

```bash
ssh
```

Logowanie do serwera.

---

```bash
sudo
```

Uruchamianie poleceń jako administrator.

---

```bash
cd
```

Przechodzenie między katalogami.

---

```bash
ls
```

Wyświetlenie zawartości katalogu.

---

```bash
pwd
```

Pokazuje, w jakim katalogu obecnie się znajduję.

---

```bash
cp
```

Kopiowanie plików.

---

```bash
mv
```

Przenoszenie lub zmiana nazwy plików.

---

```bash
rm
```

Usuwanie plików.

---

```bash
nano
```

Edycja plików tekstowych.

---

```bash
cat
```

Wyświetlenie zawartości pliku.

---

```bash
systemctl
```

Uruchamianie, zatrzymywanie i sprawdzanie usług systemowych.

---

```bash
apt
```

Instalacja i aktualizacja programów.

---

```bash
docker
```

Zarządzanie kontenerami Docker.

(Będziemy używać od jutra.)

---

# Najważniejsza lekcja z pierwszego dnia

Najpierw przygotowuje się bezpieczny serwer, a dopiero później instaluje aplikację.

To właśnie odróżnia profesjonalne środowisko produkcyjne od szybkiego "wrzucenia plików na serwer".

---

# Roadmap wdrożenia Opticut

> Ta sekcja jest źródłem prawdy dla strony `/settings/databaseMigrationHetzner`
> (komponenty czytają odpowiednik w `constants/deploymentGuide.ts`).

## Etap 1 — Przygotowanie serwera ✅

- [x] Konto Hetzner
- [x] Projekt
- [x] VPS
- [x] Ubuntu
- [x] SSH
- [x] Aktualizacja systemu
- [x] Użytkownik maciej

Cel:
Mamy bezpieczny serwer gotowy do dalszej konfiguracji.

---

## Etap 2 — Bezpieczeństwo

- [x] Wyłączenie logowania root (8.10.2026)
- [x] Konfiguracja SSH (8.10.2026)
- [x] Firewall UFW (8.10.2026)
- [x] Hetzner Firewall `opticut-firewall` (8.10.2026)
- [x] Fail2Ban (9.10.2026) — jail sshd, bantime 1h / maxretry 5
- [x] Automatyczne aktualizacje bezpieczeństwa (9.10.2026) — unattended-upgrades

Dlaczego?

Zanim postawimy aplikację, zabezpieczamy serwer przed atakami z Internetu.
Etap 2 domknięty 9.10: najpierw dom (bezpieczeństwo), potem meble (Docker, app, Caddy).

Czego się nauczę?

- bezpieczeństwo Linux
- SSH
- firewalle
- ochrona przed brute-force

---

## Etap 3 — Docker

- [x] Instalacja Docker (9.10.2026 · 29.9.0)
- [x] Docker Compose (9.10 · v5.6.0 · uproszczony compose)
- [x] Pierwszy kontener (`hello-world`)
- [x] Sieci Docker (`redis://redis:6379`)
- [x] Volumes (`redis-data`; MySQL volume później)

Dlaczego?

Docker pozwala uruchamiać aplikacje identycznie na każdym serwerze.

Czego się nauczę?

- kontenery
- obrazy Docker
- docker compose
- volumes
- bridge network

---

## Etap 4 — Git

- [x] Instalacja Git (9.10 · 2.53.0)
- [x] Połączenie z GitHub (Deploy Key)
- [x] SSH do GitHub (`~/.ssh/opticut_github`)
- [x] Clone repozytorium (`/opt/opticut` · main)
- [x] Ręczny łańcuch wdrożenia (10.10 · push → pull → build → up)

Dlaczego?

Serwer pobiera kod z GitHub. Sprawdzony produkcyjny sposób aktualizacji frontendu (zanim GHA).

Czego się nauczę?

- Git / GitHub / SSH
- git push vs pull
- rebuild kontenera na produkcji

---

## Etap 5 — MySQL

- [ ] Kontener MySQL
- [ ] Import bazy z Cyberfolks
- [ ] Backup
- [ ] Restore

Dlaczego?

Przenosimy produkcyjną bazę danych.

Czego się nauczę?

- MySQL
- backup
- restore
- dump
- użytkownicy bazy

---

## Etap 6 — Backend

- [x] Docker dla Express (9.10 · Up healthy)
- [x] ENV (`server/.env`, chmod 600; MySQL → Cyberfolks)
- [x] Test API (`curl` 404 na `/` = OK; `/api/v1/health`; maxMemoryUsage 98)
- [x] Logi (`docker compose logs` · stack UP)

Dlaczego?

Backend działa jako osobny kontener z Redisem i bazą Cyberfolks.

Czego się nauczę?

- Node.js production
- ENV
- Docker networking
- healthcheck

---

## Etap 7 — Frontend

- [x] Docker dla Next.js (standalone · `CMD node server.js` · bez `|| true`)
- [x] Build production (lean OFF + `max-old-space-size=3072` · sukces 9.10)
- [x] Test (`curl -I :3000` → 200 · Ready · healthy)

Dlaczego?

Frontend odseparowany od backendu. Przełom: lean build + uczciwy Dockerfile + heap 3072 → działa lokalnie na VPS. GHA nadal plan na wygodny CI.

Czego się nauczę?

- Next.js production / standalone
- lean build (`NEXT_PUBLIC_ENABLE_*`)
- diagnoza OOM

---

## Etap 8 — Reverse Proxy

- [x] Caddy 2.6.2 (usługa systemowa · UFW 80/443 · 10.10)
- [x] HTTPS + certyfikat SSL (Let’s Encrypt auto · certificate obtained)
- [x] Reverse Proxy (`handle /api/v1/*` → :8000, reszta → :3000)

Dlaczego?

Recepcja przed kontenerami — publicznie tylko Caddy. App na localhost; świat wchodzi przez https://www.opticut.pl.

Czego się nauczę?

- SSL
- HTTPS
- reverse proxy
- domeny

---

## Etap 9 — GitHub Actions

Uzupełnienie do zaplanowania: osobny deploy dev, akceptacja konkretnego wydania produkcji i rollback — patrz „Dev, produkcja i wersje klientów”. Poniższe ukończone punkty opisują obecny automat, a nie gotowy podział dev/produkcja.

- [x] Workflow `.github/workflows/deploy-hetzner.yml` (push main → SSH → pull + build + up)
- [x] Deploy (automatyczny + awaryjny ręczny)
- [x] Restart kontenerów / smoke HTTPS

Dlaczego?

`git push` wdraża produkcję bez ręcznego wpisywania komend na VPS.

Czego się nauczę?

- CI/CD / sekrety SSH / workflow_dispatch

---

## Etap 10 — Domena

Uzupełnienie do zaplanowania: DNS `dev.opticut.pl`, HTTPS i dostęp tylko dla testerów — patrz „Dev, produkcja i wersje klientów”.

- [x] opticut.pl + www → A 178.104.192.131 (CyberFolks · 10.10; poczta nietknięta)
- [x] API na domenie (`https://www.opticut.pl/api/v1` — bez osobnej api.* na razie)
- [ ] client1.opticut.pl / client2… (multi-tenant — później)

Dlaczego?

Sklep na Hetzner, skrzynka pocztowa zostaje w CyberFolks. Subdomeny klientów dołożymy przy skalowaniu.

Czego się nauczę?

- DNS / rekordy A / www
- propagacja i cache DNS
- rozdział „strona” vs „poczta”

---

## Etap 11 — Monitoring

- [x] Uptime Kuma + Discord (www + /api/v1/health · 60s · retries 3 · SSH :3001)
- [x] Prometheus + Grafana + Node Exporter + cAdvisor (dashboard Opticut Monitoring · :9090 / :3002)
- [x] Dysk + `docker builder prune` (cache ~30 GB → dysk 57%→25%)

Dlaczego?

Nie zgadujemy w terminalu — wiemy czy strona żyje i ile RAM/CPU/dysku zjada stack.

Czego się nauczę?

- Uptime Kuma / alerting
- Prometheus / Grafana / exporters
- SSH tunnel (panele niepubliczne)
- sprzątanie Docker Build Cache

---

## Etap 12 — Backup ← **następny krok**

Uzupełnienie do zaplanowania: próba odtworzenia oraz cofnięcia kodu bez utraty nowych zamówień — patrz „Dev, produkcja i wersje klientów”. Backup bazy nie zastępuje zachowania poprzednich obrazów aplikacji.

- [ ] Backup MySQL
- [ ] Backup aplikacji
- [ ] Automatyczny harmonogram

Dlaczego?

Monitoring jest. Teraz: po awarii odzyskać dane w kilka minut.

Czego się nauczę?

- backup
- disaster recovery

---

## Etap 13 — Skalowanie

Uzupełnienie do zaplanowania: flagi funkcji klienta, moduły dedykowane i decyzja, czy Decorum potrzebuje osobnej instancji do niezależnego cofania wersji — patrz „Dev, produkcja i wersje klientów”.

- [ ] client1.opticut.pl
- [ ] client2.opticut.pl
- [ ] client3.opticut.pl
- [ ] kolejne instancje

Dlaczego?

Jedna infrastruktura będzie obsługiwała wielu klientów.

Czego się nauczę?

- architektura multi-tenant
- Docker Compose
- zarządzanie wieloma instancjami


------- dodatek z drugiego dnia wdrożenia (8.10.2026) ------------

# Notatka z migracji Opticut na Hetzner

## Data

8 października 2026

## Etap 2 — Bezpieczeństwo

Dzisiaj wykonaliśmy i sprawdziliśmy następujące punkty:

- [x] Wyłączenie logowania root
- [x] Konfiguracja SSH
- [x] Firewall UFW
- [x] Hetzner Firewall
- [x] Fail2Ban (domknięte 9.10 — patrz `security-fail2ban-auto-updates-summary.md`)
- [x] Automatyczne aktualizacje bezpieczeństwa (domknięte 9.10)

---

## Jak to zrozumieć (jak w szkole)

- **Root off** — drzwi „Dyrektor” zamknięte na ulicę; wchodzisz jako maciej, czasem prosisz o `sudo`.
- **Tylko klucz SSH** — hasło można zgadywać; klucz to brelok, bez którego drzwi się nie otworzą.
- **UFW** — portier w holu: domyślnie nikogo nie wpuszcza, tylko drzwi 22 (SSH).
- **Hetzner Firewall** — portier przed bramą osiedla (22, 80, 443, ping). Dwie warstwy ochrony.
- **Fail2Ban** — ochroniarz przy drzwiach: po wielu błędnych próbach banuje IP na chwilę.
- **Auto-updates** — regularne zamykanie okien: krytyczne łatki security same się instalują.

---

## 1. Wyłączenie logowania root

Na serwerze zmieniono konfigurację SSH tak, aby użytkownik `root` nie mógł logować się bezpośrednio przez SSH.

W pliku:

```bash
/etc/ssh/sshd_config
```

ustawiono:

```bash
PermitRootLogin no
```

Po zmianie konfiguracja została sprawdzona i SSH zostało zrestartowane.

Najważniejszy sens tej zmiany:

- konto `root` jest najczęściej atakowanym kontem na serwerach,
- wyłączenie logowania root zmniejsza ryzyko włamania,
- administracja odbywa się przez zwykłego użytkownika `maciej`,
- uprawnienia administratora uzyskujemy dopiero przez `sudo`.

---

## 2. Konfiguracja SSH

Sprawdziliśmy aktywną konfigurację SSH poleceniem:

```bash
sudo sshd -T | grep -E '^(permitrootlogin|pubkeyauthentication|passwordauthentication|kbdinteractiveauthentication) '
```

Finalny wynik:

```bash
permitrootlogin no
pubkeyauthentication yes
passwordauthentication no
kbdinteractiveauthentication no
```

Oznacza to:

- `permitrootlogin no` — root nie może logować się przez SSH,
- `pubkeyauthentication yes` — logowanie kluczem SSH jest włączone,
- `passwordauthentication no` — logowanie hasłem jest wyłączone,
- `kbdinteractiveauthentication no` — dodatkowe interaktywne logowanie hasłem jest wyłączone.

To jest bezpieczna konfiguracja, ponieważ do serwera można wejść tylko przez klucz SSH.

---

## 3. Firewall UFW na serwerze

Włączyliśmy lokalny firewall Ubuntu: `ufw`.

Ustawienia:

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow OpenSSH
sudo ufw enable
```

Sprawdzenie:

```bash
sudo ufw status verbose
```

Finalny stan:

```bash
Status: active
Default: deny (incoming), allow (outgoing), disabled (routed)

22/tcp (OpenSSH)           ALLOW IN    Anywhere
22/tcp (OpenSSH (v6))      ALLOW IN    Anywhere (v6)
```

Oznacza to:

- ruch przychodzący jest domyślnie blokowany,
- SSH na porcie `22` jest dozwolone,
- ruch wychodzący z serwera jest dozwolony,
- serwer nadal pozwala zalogować się użytkownikowi `maciej`.

Bardzo ważna zasada:

Przed włączeniem firewalla zawsze trzeba dopuścić SSH, inaczej można samemu zablokować sobie dostęp do serwera.

---

## 4. Hetzner Firewall

Utworzyliśmy firewall w panelu Hetzner Cloud:

```text
opticut-firewall
```

Firewall ma:

```text
4 rules
1 server
```

Reguły inbound:

```text
SSH    TCP   22    Any IPv4, Any IPv6
HTTP   TCP   80    Any IPv4, Any IPv6
HTTPS  TCP   443   Any IPv4, Any IPv6
ICMP   ICMP        Any IPv4, Any IPv6
```

Reguły outbound zostawiliśmy puste.

To oznacza, że:

- z Internetu można wejść tylko na dozwolone porty,
- SSH działa na porcie `22`,
- HTTP `80` i HTTPS `443` są przygotowane pod stronę/aplikację i certyfikaty SSL,
- `ICMP` pozwala na ping,
- ruch wychodzący z serwera jest domyślnie dozwolony.

Hetzner Firewall działa na poziomie infrastruktury Hetznera, zanim ruch dotrze do Ubuntu. UFW działa już wewnątrz samego serwera. Razem tworzą dwie warstwy ochrony.

---

## Najważniejsze komendy do zapamiętania

Połączenie z serwerem:

```bash
ssh maciej@178.104.192.131
```

Edycja konfiguracji SSH:

```bash
sudo nano /etc/ssh/sshd_config
```

Sprawdzenie, czy plik SSH nie ma błędów:

```bash
sudo sshd -t
```

Restart SSH:

```bash
sudo systemctl restart ssh
```

Sprawdzenie aktywnych ustawień SSH:

```bash
sudo sshd -T | grep -E '^(permitrootlogin|pubkeyauthentication|passwordauthentication|kbdinteractiveauthentication) '
```

Sprawdzenie statusu SSH:

```bash
sudo systemctl status ssh
```

Sprawdzenie statusu UFW:

```bash
sudo ufw status verbose
```

Pokazanie reguł UFW z numerami:

```bash
sudo ufw status numbered
```

Dodanie dostępu SSH w UFW:

```bash
sudo ufw allow OpenSSH
```

Włączenie UFW:

```bash
sudo ufw enable
```

---

## Ważne zasady na przyszłość

Nie zamykać obecnej sesji SSH podczas zmian w SSH lub firewallu.

Po każdej zmianie SSH najpierw sprawdzić konfigurację:

```bash
sudo sshd -t
```

Dopiero potem restartować SSH:

```bash
sudo systemctl restart ssh
```

Po zmianach w firewallu zawsze testować nowe połączenie z drugiego okna PowerShell:

```bash
ssh maciej@178.104.192.131
```

Nie logować się jako `root`. Pracować jako:

```bash
maciej
```

A komendy administracyjne wykonywać przez:

```bash
sudo
```

---

## Następny krok (stan po dniu 2)

W dniu 2 zostawiliśmy Fail2Ban i auto-updates na później.
**9.10.2026 — domknięte** (Etap 2 = 6/6). Szczegóły: `security-fail2ban-auto-updates-summary.md`.

------- dodatek z trzeciego dnia wdrozenia (9.10.2026) ------------

# Migracja Opticut na Hetzner - dzien pracy: Docker, Git i decyzja o GitHub Actions

Data: 9 pazdziernika 2026

## Cel dnia

Dzisiaj chcielismy przejsc od przygotowanego i zabezpieczonego serwera do pierwszego uruchomienia aplikacji Opticut w Dockerze.

Najprostszy plan wygladal tak:

1. Zainstalowac Docker i Docker Compose.
2. Zainstalowac Git.
3. Dac serwerowi dostep do prywatnego repozytorium GitHub.
4. Sklonowac projekt na serwer.
5. Przygotowac `docker-compose.yml`.
6. Przygotowac `server/.env`.
7. Zbudowac i uruchomic kontenery.

Czesc z tych rzeczy udala sie bardzo dobrze. Najwieksza trudnosc pojawila sie przy buildzie frontendu Next.js.

## Co udalo sie zrobic

### 1. Docker i Docker Compose

Zainstalowalismy Docker z oficjalnego repozytorium Dockera.

Sprawdzone wersje:

```bash
docker --version
docker compose version
```

Wynik:

```text
Docker version 29.9.0
Docker Compose version v5.6.0
```

Uruchomilismy test:

```bash
sudo docker run hello-world
```

Potem dodalismy uzytkownika `maciej` do grupy `docker`, zeby Docker dzialal bez `sudo`:

```bash
sudo usermod -aG docker maciej
newgrp docker
docker run hello-world
```

Efekt:

```text
Hello from Docker!
```

To znaczy, ze Docker dziala poprawnie.

Po co to robimy?

Docker jest jak pudelko na aplikacje. Do pudelka pakujemy aplikacje, jej zaleznosci i sposob uruchomienia. Dzieki temu serwer nie musi "zgadywac", jak aplikacja ma dzialac.

Przyklad z zycia:

Bez Dockera to jak przeprowadzka luzem: ubrania w jednej torbie, kable w drugiej, dokumenty w trzeciej i potem trzeba zgadywac, co gdzie jest.

Z Dockerem to jak przeprowadzka w podpisanych pudelkach: `frontend`, `backend`, `redis`. Kazde pudelko wie, co ma w srodku i jak ma dzialac.

Co byloby, gdybysmy tego nie zrobili?

Musielibysmy recznie instalowac Node, paczki, Redis, ustawienia systemu i pilnowac wersji. To szybko robi sie kruche i trudne do odtworzenia.

## 2. Git

Git byl juz zainstalowany:

```bash
git --version
```

Wynik:

```text
git version 2.53.0
```

Ustawilismy dane Gita:

```bash
git config --global user.name "Maciej Kruszyniak"
git config --global user.email "maciejkruszyniak@gmail.com"
git config --global --list
```

Wynik:

```text
user.name=Maciej Kruszyniak
user.email=maciejkruszyniak@gmail.com
```

Po co to robimy?

Git pozwala serwerowi pobrac kod aplikacji z GitHuba. To jest jak zeszyt historii projektu: wiemy, jaka wersja kodu jest na serwerze i mozemy ja aktualizowac.

Co byloby, gdybysmy tego nie zrobili?

Trzeba byloby kopiowac pliki recznie. To latwo pomylic, nadpisac albo zapomniec o jakims pliku.

## 3. Dostep serwera do prywatnego repozytorium GitHub

Repozytorium Opticut jest prywatne, wiec serwer nie mogl go pobrac bez autoryzacji.

Na serwerze utworzylismy osobny klucz SSH tylko do GitHuba:

```bash
ssh-keygen -t ed25519 -C "opticut-hetzner-github" -f ~/.ssh/opticut_github
```

Publiczny klucz dodalismy w GitHub jako Deploy Key.

Potem utworzylismy konfiguracje SSH:

```bash
nano ~/.ssh/config
```

Zawartosc:

```sshconfig
Host github.com
  HostName github.com
  User git
  IdentityFile ~/.ssh/opticut_github
  IdentitiesOnly yes
```

Test polaczenia:

```bash
ssh -T git@github.com
```

Poprawny wynik:

```text
You've successfully authenticated, but GitHub does not provide shell access.
```

Po co to robimy?

Serwer dostal swoj "klucz do drzwi" GitHuba. Nie jest to haslo do calego konta, tylko ograniczony klucz do repozytorium.

Przyklad z zycia:

To jak dac kurierowi kod do paczkomatu tylko do jednej skrytki, a nie klucze do calego domu.

## 4. Katalog aplikacji na serwerze

Przygotowalismy katalog:

```bash
sudo mkdir -p /opt/opticut
sudo chown -R maciej:maciej /opt/opticut
cd /opt/opticut
```

Sklonowalismy repozytorium:

```bash
git clone git@github.com:login101i/F6.git .
```

Sprawdzilismy:

```bash
git remote -v
git branch --show-current
```

Wynik:

```text
origin git@github.com:login101i/F6.git
main
```

Po co to robimy?

`/opt/opticut` to stale miejsce na aplikacje produkcyjna. Dzieki temu wiemy, gdzie jest kod i skad beda startowac kontenery.

## 5. Plik server/.env

Po sklonowaniu repo okazalo sie, ze `server/.env` nie istnieje na serwerze. To normalne, bo pliki `.env` zwykle sa w `.gitignore` i nie powinny trafic do repozytorium.

Utworzylismy:

```bash
nano server/.env
```

Wazne zmienne:

```env
NODE_ENV=production
HOSTING=hetzner
CLUSTER=false
PORT=8000

FRONTEND_ORIGIN=https://opticut.pl
PUBLIC_FRONTEND_URL=https://opticut.pl
CORS_ALLOWED_ORIGINS=https://opticut.pl,https://www.opticut.pl

MYSQL_HOST=s78.cyber-folks.pl
MYSQL_PORT=3308
MYSQL_DATABASE=...
MYSQL_USER=...
MYSQL_PASSWORD=...

ACCESS_TOKEN=...
REFRESH_TOKEN=...
ACTIVATION_SECRET=...

REDIS_URL=redis://redis:6379
OPENAI_API_KEY=
SKIP_RAG_STARTUP=true
```

Ustawilismy bezpieczniejsze uprawnienia:

```bash
chmod 600 server/.env
```

Po co to robimy?

Kod aplikacji nie powinien zawierac hasel. Plik `.env` to taki prywatny notes serwera z konfiguracja.

Przyklad z zycia:

Kod aplikacji to przepis na ciasto. `.env` to karteczka z informacja, gdzie stoi piekarnik i jaki jest kod do kuchni. Przepisu mozna pokazac zespolowi, ale kodu do kuchni nie.

Wazna uwaga:

Podczas pracy przypadkowo wklejone zostaly sekrety do rozmowy/logow. Nalezy potraktowac je jako ujawnione i pozniej zrotowac:

- haslo uzytkownika MySQL,
- `ACCESS_TOKEN`,
- `REFRESH_TOKEN`,
- `ACTIVATION_SECRET`,
- ewentualny Redis URL, jesli byl prawdziwy.

## 6. docker-compose.yml

Stary `docker-compose.yml` byl dlugo nieuzywany. Mial m.in. stara sciezke:

```text
frontend_13.11.2024
```

a faktyczny katalog to:

```text
frontend
```

Przygotowalismy prostszy compose:

```yaml
services:
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.frontend
      args:
        NEXT_PUBLIC_API_URL: /api/v1
    ports:
      - "127.0.0.1:3000:3000"
    depends_on:
      - server
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_API_URL=/api/v1

  redis:
    image: redis:alpine
    volumes:
      - redis-data:/data
    command: redis-server --appendonly yes

  server:
    build:
      context: ./server
      dockerfile: Dockerfile.server
    ports:
      - "127.0.0.1:8000:8000"
    env_file:
      - ./server/.env
    environment:
      - REDIS_URL=redis://redis:6379
    depends_on:
      - redis

volumes:
  redis-data:
```

Sprawdzenie:

```bash
docker compose config
```

Po co porty sa na `127.0.0.1`?

Bo aplikacja nie ma byc wystawiona bezposrednio na Internet. Pozniej Caddy bedzie stal z przodu, robil HTTPS i przekazywal ruch do:

```text
127.0.0.1:3000 - frontend
127.0.0.1:8000 - backend
```

Przyklad z zycia:

Caddy bedzie jak recepcja w budynku. Ludzie z zewnatrz rozmawiaja z recepcja, a recepcja kieruje ich do odpowiedniego pokoju. Nie otwieramy wszystkim drzwi bezposrednio do kazdego pokoju.

## 7. Backend uruchomil sie poprawnie

Backend zbudowal sie i uruchomil.

Logi pokazaly:

```text
POLACZYLEM SIE Z BAZA
HOST: s78.cyber-folks.pl:3308
Server listening
Redis is READY and connected
```

To znaczy:

- backend dziala,
- polaczenie z baza CyberFolks dziala,
- Redis w Dockerze dziala,
- `.env` jest czytany poprawnie.

Test backendu:

```bash
curl -I http://127.0.0.1:8000
```

Wynik byl `404`, ale to nie byl blad infrastruktury. Backend odpowiedzial, tylko endpoint `/` nie istnieje. To normalne.

## 8. Problem z frontendem Next.js

Frontend okazal sie najtrudniejszy.

Poczatkowo Dockerfile mial:

```dockerfile
RUN npm run build || true
```

To bylo niebezpieczne, bo oznaczalo:

```text
Jesli build sie wysypie, udawaj sukces.
```

Efekt:

- Docker image sie budowal,
- ale `.next` byl niepelny,
- brakowalo `.next/BUILD_ID`,
- brakowalo `.next/standalone/server.js`,
- frontend startowal i od razu padal.

Blad:

```text
Could not find a production build in the '.next' directory
```

Naprawilismy Dockerfile tak, zeby nie udawal sukcesu:

```dockerfile
RUN npm run build && ...
```

Potem dodalismy sprawdzenia:

```text
.next/BUILD_ID
.next/standalone/server.js
```

To pozwolilo zobaczyc prawdziwy problem:

```text
FATAL ERROR: Ineffective mark-compacts near heap limit
Allocation failed - JavaScript heap out of memory
```

Czyli frontend Next.js jest zbyt ciezki, zeby stabilnie budowac go na VPS z 4 GB RAM.

## 9. Swap 4 GB

Dodaliśmy swap, czyli awaryjna pamiec na dysku:

```bash
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
free -h
```

Wynik:

```text
Swap: 4.0Gi
```

Zapisalismy swap na stale:

```bash
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
tail -5 /etc/fstab
```

Po co swap?

Swap to jak awaryjny magazyn. Jesli RAM to biurko, a build rozklada za duzo papierow, swap pozwala odlozyc czesc papierow na podloge. Jest wolniej, ale czasem ratuje sytuacje.

Co byloby, gdybysmy go nie dodali?

Serwer szybciej zabijalby procesy przy braku pamieci. Swap poprawia stabilnosc, ale nie jest cudownym lekarstwem na bardzo ciezki build.

## 10. Restart serwera

Podczas prob builda SSH przestal odpowiadac. Serwer odpowiadal na ping, ale port 22 nie odpowiadal:

```text
PingSucceeded: True
TcpTestSucceeded: False
```

W Hetzner Cloud Console zrobilismy bezpieczny restart przez:

```text
Shutdown -> Power on
```

Po restarcie SSH wrocilo.

Wazna lekcja:

Ciezki build na malym VPS moze tak obciazyc system, ze SSH bedzie chwilowo niedostepne. Dlatego produkcyjny serwer nie powinien byc miejscem do ciezkich buildow frontendu.

## 11. Diagnoza z Cursor / analiza projektu

Cursor przeanalizowal problem i potwierdzil:

```text
Next.js nie ignoruje output: 'standalone'.
Build nie dochodzi do etapu tworzenia .next/standalone.
Brak BUILD_ID oznacza, ze build urywa sie przed koncem.
```

Najwazniejszy wniosek:

```text
Problemem jest pamiec podczas fazy Collecting page data.
```

Probowalismy:

- `--max-old-space-size=2048`,
- `NODE_OPTIONS=--max-old-space-size=3072`,
- swap 4 GB,
- zatrzymanie kontenerow przed buildem.

Nadal build konczyl sie bledem pamieci.

## Decyzja techniczna

Nie warto dalej meczyc VPS-a buildem frontendu.

Lepsze docelowe rozwiazanie:

```text
GitHub Actions buduje obraz Dockera
GitHub Container Registry przechowuje obraz
Hetzner pobiera gotowy obraz
Docker Compose uruchamia gotowe kontenery
```

Schemat:

```text
Kod lokalnie
  -> git push
  -> GitHub Actions
  -> docker build
  -> GitHub Container Registry
  -> Hetzner docker pull
  -> docker compose up -d
```

Po co to robimy?

Bo VPS ma uruchamiac aplikacje, a nie meczyc sie kompilowaniem ogromnego frontendu.

Przyklad z zycia:

Serwer produkcyjny to restauracja, ktora ma wydawac dania klientom. GitHub Actions to kuchnia przygotowawcza. Lepiej przygotowac skladniki i dania w kuchni, a restauracja ma je sprawnie podac. Nie chcemy, zeby kelner przy stoliku mielil make, wyrabial ciasto i dopiero potem robil pizze.

## Status po dzisiejszym dniu

Zrobione:

```text
[x] Docker
[x] Docker Compose
[x] Git
[x] Dostep serwera do prywatnego GitHub repo
[x] Repo sklonowane do /opt/opticut
[x] server/.env utworzony
[x] Backend uruchomiony i polaczony z baza
[x] Redis uruchomiony w Dockerze
[x] docker-compose.yml uproszczony i dostosowany
[x] Swap 4 GB dodany
[x] Zdiagnozowany problem builda frontendu
```

Pozniej (po przełomie lean — patrz dodatek poniżej):

```text
[x] Frontend dzialajacy w Dockerze na serwerze (lean + standalone · healthy)
[ ] GitHub Actions build/deploy
[ ] GitHub Container Registry
[ ] Caddy  ← nastepny krok
[ ] Domena opticut.pl na Hetzner
```

## Najwazniejsze komendy z dzisiaj

Docker:

```bash
docker --version
docker compose version
docker run hello-world
docker compose config
docker compose build frontend
docker compose up -d
docker compose ps
docker compose logs server --tail=80
docker compose logs frontend --tail=100
```

Git:

```bash
git --version
git remote -v
git branch --show-current
git pull origin main
git log -1 --oneline
git stash push -m "server manual docker edits" frontend/Dockerfile.frontend frontend/package.json
git stash list
```

SSH / GitHub:

```bash
ssh-keygen -t ed25519 -C "opticut-hetzner-github" -f ~/.ssh/opticut_github
cat ~/.ssh/opticut_github.pub
nano ~/.ssh/config
chmod 600 ~/.ssh/config
ssh -T git@github.com
```

Pamiec:

```bash
free -h
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
tail -5 /etc/fstab
```

Test sieci:

```powershell
ping 178.104.192.131
Test-NetConnection 178.104.192.131 -Port 22
ssh maciej@178.104.192.131
```

## Co robimy jutro

Jutro najlepszy nastepny krok:

```text
GitHub Actions + GitHub Container Registry + deploy na Hetzner
```

Plan:

1. Przygotowac Dockerfile tak, zeby budowal sie w GitHub Actions.
2. Przygotowac workflow `.github/workflows/deploy.yml`.
3. Dodac sekrety w GitHub:
   - SSH host,
   - SSH user,
   - SSH private key,
   - registry token, jesli potrzebny.
4. Zbudowac obrazy w GitHub Actions.
5. Wypchnac obrazy do GitHub Container Registry.
6. Na Hetznerze zrobic `docker pull` i `docker compose up -d`.
7. Dopiero potem przejsc do Caddy i domeny `opticut.pl`.

## Najwazniejsza lekcja

Dzisiejsza praca nie byla porazka. To byla dobra diagnoza.

Udalo sie potwierdzic:

- backend dziala,
- baza dziala,
- Redis dziala,
- Docker dziala,
- GitHub dostep dziala,
- problem jest konkretnie w buildzie frontendu Next.js na VPS.

To jest cenna informacja, bo dzieki niej nie bedziemy zgadywac. Zamiast powiekszac serwer na slepo albo walczyc z `nano`, przechodzimy na bardziej profesjonalny model wdrozen:

```text
build poza serwerem
uruchamianie na serwerze
```

To jest kierunek produkcyjny.

------- dodatek: Etap 2 domknięty (Fail2Ban + auto-updates · 9.10.2026) ------------

Pełna notatka: `security-fail2ban-auto-updates-summary.md`.

```text
[x] Fail2Ban
[x] Automatyczne aktualizacje bezpieczenstwa
```

Te dwa punkty domknęły Etap 2. Najpierw zabezpieczamy dom, dopiero potem wnosimy meble (Docker, aplikacja, baza, Caddy, domena).

**Fail2Ban:** jail `sshd`, `bantime=1h`, `findtime=10m`, `maxretry=5`, `backend=systemd`. Status: active, Currently banned: 0.

**unattended-upgrades:** już zainstalowane i enabled; `20auto-upgrades` = Update + Unattended-Upgrade `"1"`; dry-run → `upgrade result: True`.

------- dodatek: Przełom — Opticut lokalnie w Dockerze na Hetzner (9.10.2026) ------------

# Przelom: Opticut uruchomiony lokalnie w Dockerze na Hetzner

Data: 9 pazdziernika 2026

## Cel

Doprowadzic do dzialajacego stacku na VPS (zanim Caddy i domena):

```text
frontend Next.js -> Docker -> 127.0.0.1:3000
backend Node/Express -> Docker -> 127.0.0.1:8000
Redis -> Docker
```

## Problem

Build Next.js: `FATAL ERROR: Ineffective mark-compacts… heap out of memory`.
Stary Dockerfile: `npm run build || true` — udawal sukces bez BUILD_ID / standalone.

## Co zmienilismy

1. **Lean build** — ciezkie moduly OFF (`heavyBuildModules.ts`, `page.tsx` → stub, `page.impl.tsx`, `NEXT_PUBLIC_ENABLE_*`; UI: `/settings/modules` czarne flagi).
2. **Dockerfile.frontend** — bez `|| true`; wymagane BUILD_ID + standalone; `CMD ["node","server.js"]`.
3. **Heap** — `package.json` build: `max-old-space-size` 2048 → **3072** (wczesniej Docker NODE_OPTIONS=3072, ale skrypt wymuszal 2048).

## Wynik

```text
Build completed successfully - standalone server found
Image opticut-frontend Built
```

```bash
docker compose up -d
docker compose ps
```

```text
opticut-frontend-1   Up (healthy)   127.0.0.1:3000->3000/tcp
opticut-server-1     Up (healthy)   127.0.0.1:8000->8000/tcp
opticut-redis-1      Up             6379/tcp
```

Testy:

- `curl -I http://127.0.0.1:3000` → **200 OK** (Ready in 83ms)
- `curl -I http://127.0.0.1:8000` → 404 (OK, brak root)
- Logi BE: POLACZYLEM SIE Z BAZA (Cyberfolks) · Redis READY · Server listening
- Health: `/api/v1/health` — `maxMemoryUsage` 90→**98** w `server/healthcheck.js` → server healthy

## Status

```text
[x] frontend standalone + healthy
[x] backend + Cyberfolks + Redis + healthy
[x] aplikacja lokalnie na VPS
[ ] Caddy / HTTPS / domena opticut.pl
[ ] publiczne wejscie
[ ] GitHub Actions (plan — nie blokuje lokalnego stacku)
```

## Dalej = Caddy

```text
uzytkownik -> opticut.pl -> Caddy -> frontend 127.0.0.1:3000
uzytkownik -> opticut.pl/api/v1 -> Caddy -> backend 127.0.0.1:8000
```

Szybki check: `caddy version` · `systemctl status caddy`

## Lekcja

Problem nie byl „w Hetznerze”, tylko w ciezkim froncie + klamliwym Dockerfile.
Po poprawkach: build nie klamie, lean wylacza ciezkie, heap 3072, kontenery dzialaja.
Fundament Dockera na Hetznerze jest gotowy — nastepna recepcja to Caddy.

------- dodatek: Caddy, DNS i HTTPS — publiczny Opticut (10.10.2026) ------------

# Caddy, DNS i HTTPS - Opticut na Hetzner

Data: 10 pazdziernika 2026

## Cel

Wystawic dzialajace kontenery na publiczna domene:

```text
https://www.opticut.pl
```

Wczesniej tylko lokalnie: FE :3000, BE :8000. Internet nie powinien pukac bezposrednio do pokoi — tylko do recepcji (Caddy).

## Jak w szkole

- **Caddy** = recepcja: gość z ulicy mówi do recepcji, ona kieruje do pokoju 3000 (sklep) albo 8000 (kuchnia API).
- **UFW 80/443** = drzwi wejściowe do holu (22 = drzwi serwisowe SSH).
- **HTTPS** = zamykana koperta zamiast otwartej kartki w autobusie.
- **DNS A** = tabliczka na skrzyżowaniu „do sklepu → Hetzner”; skrzynka pocztowa (MX…) zostaje w CyberFolks.
- **handle vs handle_path** = handle zostawia cały adres `/api/v1/health`; handle_path urywa początek nożyczkami i kuchnia dostaje samo `/health` — gubi się.
- **`$` w Compose** = Compose myśli, że `$` to zmienna; w `.env` piszemy `$$`, żeby zostało prawdziwe `$` w haśle.
- **unless-stopped** = po wyłączeniu prądu w szkole dzieci same wracają do ławek (kontenery wstają same).

## Co zrobione

```text
[x] Caddy 2.6.2 active (running)
[x] UFW 22 + 80 + 443
[x] Test po IP → Caddy → frontend (200)
[x] handle /api/v1/* → backend (nie handle_path)
[x] DNS A opticut.pl + www → 178.104.192.131
[x] HTTPS / Let’s Encrypt (certificate obtained)
[x] https://www.opticut.pl + /api/v1/health → 200
[x] Logowanie /panel działa
[x] CORS + $$ w haśle MySQL
[x] restart: unless-stopped (frontend, server, redis)
```

Caddyfile (skrót):

```caddyfile
opticut.pl, www.opticut.pl {
	handle /api/v1/* {
		reverse_proxy 127.0.0.1:8000
	}
	handle {
		reverse_proxy 127.0.0.1:3000
	}
}
```

## Do pozniej

```text
[ ] www ↔ bez www redirect
[ ] CORS bez IP testowego
[ ] GitHub Actions
[ ] Backup/restore bazy
[ ] clientN.opticut.pl
```

## Najwazniejsze komendy

```bash
caddy version
sudo systemctl status caddy
sudo caddy validate --config /etc/caddy/Caddyfile
sudo systemctl reload caddy
sudo ufw allow 80/tcp && sudo ufw allow 443/tcp
sudo journalctl -u caddy --no-pager -n 80
```

```powershell
nslookup -type=A www.opticut.pl 8.8.8.8
curl.exe -I https://www.opticut.pl
curl.exe -I https://www.opticut.pl/api/v1/health
```

Publiczny deployment: **https://www.opticut.pl/panel**

------- dodatek: Git pull, rebuild frontendu, odswiezenie produkcji (10.10.2026) ------------

# Git pull, rebuild frontendu i odswiezenie produkcji

Data: 10 pazdziernika 2026 · Status: **DONE** (ręczny łańcuch)

## Cel

```text
lokalny projekt -> GitHub -> Hetzner -> Docker -> https://www.opticut.pl
```

## Jak w szkole

- **Commit bez push** = napisać instrukcję i zostawić na biurku — sklep jej nie zobaczy.
- **Push** = wrzucić kartkę do wspólnego segregatora (GitHub).
- **git pull na Hetzner** = sklep bierze kartkę z segregatora.
- **docker compose build** = budowa nowej wystawy na zapleczu (kilka minut; stary sklep nadal działa).
- **up -d frontend** = podmiana wystawy na sali (kilka sekund przerwy).
- Bez tego łańcucha aktualizacja = noszenie plików w reklamówce.

## Przepływ

Lokalnie:

```bash
git status
git add .
git commit --trailer "Co-authored-by: Cursor <cursoragent@cursor.com>" -m "…"
git push -u origin main
```

Na serwerze:

```bash
cd /opt/opticut
git pull origin main
docker compose build frontend
docker compose up -d frontend
docker compose ps
curl -I https://www.opticut.pl
curl -I https://www.opticut.pl/api/v1/health
```

Oczekiwane: Build completed successfully · frontend/server healthy · HTTP/2 200 Server: Caddy.

## Co dalej

1. GitHub Actions (zamiast ręcznego pull+build)
2. www vs bez www
3. Backup/restore
4. MySQL: CyberFolks vs Hetzner

Krok w roadmapie: **4-5**, powiązane **7-2/7-3**, **9-2/9-3**.

------- dodatek: Monitoring — Uptime Kuma, Prometheus, Grafana (11.10.2026) ------------

# Monitoring Opticut - Uptime Kuma, Prometheus i Grafana

Data: 11 pazdziernika 2026 · Status: **DONE** (podstawowy + techniczny)

## Cel

Po `GitHub Actions -> Docker -> Caddy -> https://www.opticut.pl` odpowiadamy tez:

```text
Czy strona / API dziala?
Ile RAM / CPU / dysku?
Ktory kontener zjada pamiec?
Czy Docker cache znowu zjada dysk?
```

## Jak w szkole

- **Uptime Kuma** = ochroniarz pukajacy do drzwi sklepu co minute; po 3 niewudanych — Discord.
- **Prometheus** = zeszyt pomiarow co ~15 s.
- **Grafana** = deska rozdzielcza w samochodzie.
- **Node Exporter** = automatyczny `free` / `df` / `top`.
- **cAdvisor** = `docker stats` z historia.
- **SSH tunnel** = prywatny korytarz do panelu (nie wystawiamy na ulice).
- **Webhook Discord** = klucz do kanalu — sekret, nie do README.
- **builder prune** = sprzata smieci na strychu po wielu buildach (nie kasuje dzialajacych kontenerow).

## Stack

```text
/opt/opticut/monitoring/docker-compose.yml
Uptime Kuma     127.0.0.1:3001
Prometheus      127.0.0.1:9090
Grafana         127.0.0.1:3002
Node Exporter + cAdvisor
```

Monitory Kuma: www.opticut.pl + /api/v1/health · Heartbeat 60s · Retries 3.

## Dostep (Windows)

```powershell
ssh -L 3001:127.0.0.1:3001 maciej@178.104.192.131
ssh -L 3002:127.0.0.1:3002 maciej@178.104.192.131
```

Potem: http://127.0.0.1:3001 (Kuma) · http://127.0.0.1:3002 (Grafana).

## Lekcja dysku

```text
df ~57% uzycia · Build Cache ~30 GB
docker builder prune -f → ~25% · ~55 GB wolne
```

## Dalej

```text
Etap 12 — Backup
opcjonalnie: alerty Grafany, Loki, status.opticut.pl z auth
```


------------ notes  13.10.2026 ----------------

Konfiguracja poczty SMTP - CyberFolks + Hetzner

Data: 14 pazdziernika 2026

## Cel etapu

Celem bylo podlaczenie produkcyjnej poczty Opticut do backendu dzialajacego na Hetznerze.

Chodzi o to, zeby aplikacja mogla wysylac maile z adresu:

```text
zamowienia@opticut.pl
```

Przyklady maili:

```text
potwierdzenie zamowienia
reset hasla
powiadomienia systemowe
```

## Co bylo przygotowane w CyberFolks

Na CyberFolks utworzone zostalo konto pocztowe:

```text
zamowienia@opticut.pl
```

To konto jest uzywane jako nadawca maili systemowych Opticut.

Adres techniczny / nadawca:

```text
SMTP_MAIL=zamowienia@opticut.pl
SMTP_USER=zamowienia@opticut.pl
SMTP_FROM=zamowienia@opticut.pl
SMTP_FROM_EMAIL=zamowienia@opticut.pl
SMTP_FROM_NAME=OptiCut
```

Haslo do SMTP jest sekretem i nie zapisujemy go w repozytorium ani w README.

## Gdzie wpisalismy konfiguracje

Konfiguracja SMTP zostala wpisana na serwerze Hetzner w prawdziwym pliku:

```text
/opt/opticut/server/.env
```

Nie wpisujemy hasla SMTP do:

```text
.env.example
GitHub
README
czatu
```

To jest sekret produkcyjny.

## Pierwsza konfiguracja

Poczatkowo probowalismy uzyc portu:

```env
SMTP_PORT=465
SMTP_SECURE=true
```

To jest klasyczny tryb SMTP SSL.

Ale aplikacja pokazala blad:

```text
Connection timeout (code: ETIMEDOUT)
```

Znaczenie:

```text
backend probowal polaczyc sie z SMTP,
ale polaczenie nie dochodzilo do skutku.
```

To zwykle oznacza problem sieciowy, port albo blokade, a nie zle haslo.

## Test portow SMTP z Hetznera

Na serwerze sprawdzilismy porty:

```bash
nc -vz -w 10 s78.cyber-folks.pl 587
nc -vz -w 10 s78.cyber-folks.pl 465
```

Wynik:

```text
587 succeeded
465 timed out
```

Interpretacja:

```text
port 587 dziala z Hetznera
port 465 nie odpowiada / timeout
```

Dlatego przeszlismy z portu 465 na port 587.

## Poprawna konfiguracja produkcyjna

Poprawna konfiguracja SMTP dla CyberFolks na Hetznerze:

```env
SMTP_HOST=s78.cyber-folks.pl
SMTP_PORT=587
SMTP_SECURE=false

SMTP_MAIL=zamowienia@opticut.pl
SMTP_USER=zamowienia@opticut.pl
SMTP_PASSWORD=TU_JEST_HASLO_NA_SERWERZE

SMTP_FROM_EMAIL=zamowienia@opticut.pl
SMTP_FROM=zamowienia@opticut.pl
SMTP_FROM_NAME=OptiCut
```

Wazne:

```text
SMTP_PORT=587
SMTP_SECURE=false
```

Port `587` uzywa STARTTLS.

To znaczy:

```text
najpierw aplikacja laczy sie zwykle,
potem przechodzi na szyfrowanie.
```

Port `465` uzywa SSL od pierwszej sekundy.

## Blad wrong version number

Po zmianie portu na 587 pojawil sie blad:

```text
wrong version number
code: ESOCKET
```

Przyczyna:

```text
kontener nadal mial SMTP_SECURE=true,
czyli probowal SSL jak dla portu 465,
ale laczyl sie z portem 587, ktory oczekuje STARTTLS.
```

To jest jak proba wejscia przez drzwi z niewlasciwym kluczem:

```text
port 465 = od razu zamknieta koperta SSL
port 587 = najpierw rozmowa, potem szyfrowanie STARTTLS
```

Dla portu 587 musi byc:

```env
SMTP_SECURE=false
```

## Restart backendu

Po poprawieniu pliku:

```text
/opt/opticut/server/.env
```

odtworzylismy kontener backendu:

```bash
docker compose up -d --force-recreate server
```

To bylo potrzebne, bo kontener czyta zmienne `.env` przy starcie.

Bez restartu backend dalej widzialby stare wartosci.

## Sprawdzenie konfiguracji w kontenerze

Sprawdzilismy, co backend naprawde widzi w srodku kontenera:

```bash
docker compose exec server printenv SMTP_PORT
docker compose exec server printenv SMTP_SECURE
docker compose exec server sh -c 'test -n "$SMTP_PASSWORD" && echo hasPassword=true || echo hasPassword=false'
```

Dobry wynik:

```text
587
false
hasPassword=true
```

To potwierdza:

```text
backend ma port 587
backend ma SMTP_SECURE=false
backend widzi haslo SMTP
```

## Czego sie nauczylismy

Najwazniejsze lekcje:

```text
ETIMEDOUT = zwykle problem z polaczeniem / portem / blokada
ESOCKET wrong version number = zwykle zly tryb TLS dla portu
465 = secure true
587 = secure false + STARTTLS
```

W JavaScript trzeba tez uwazac na wartosc:

```text
"false"
```

Bo tekst `"false"` nadal jest tekstem, a nie booleanem.

Poprawna logika w kodzie powinna interpretowac:

```ts
secure: process.env.SMTP_SECURE === "true"
```

a nie:

```ts
secure: Boolean(process.env.SMTP_SECURE)
```

bo:

```js
Boolean("false") === true
```

## Co osiagnelismy

Udalo sie:

```text
dodac konto pocztowe CyberFolks
dodac SMTP do server/.env na Hetznerze
wykryc, ze port 465 timeoutuje
potwierdzic, ze port 587 dziala
przestawic SMTP na STARTTLS
zrestartowac backend
potwierdzic konfiguracje w kontenerze
```

Status konfiguracji:

```text
SMTP_PORT=587
SMTP_SECURE=false
hasPassword=true
```

## Jak testowac poczte

Najprostszy test:

```text
zlozyc testowe zamowienie
sprawdzic, czy aplikacja nie pokazuje ostrzezenia o mailu
sprawdzic, czy mail doszedl do odbiorcy
sprawdzic spam
```

Podglad logow backendu:

```bash
cd /opt/opticut
docker compose logs -f server
```

Przerwanie logow:

```text
Ctrl + C
```

Jesli mail nie dojdzie, sprawdzamy:

```text
logi backendu
logi SMTP Out w CyberFolks dla konta zamowienia@opticut.pl
czy haslo SMTP jest poprawne
czy FROM jest zgodny z kontem
```

## Szybka sciaga

Sprawdzenie portow:

```bash
nc -vz -w 10 s78.cyber-folks.pl 587
nc -vz -w 10 s78.cyber-folks.pl 465
```

Sprawdzenie zmiennych w kontenerze:

```bash
docker compose exec server printenv SMTP_PORT
docker compose exec server printenv SMTP_SECURE
docker compose exec server sh -c 'test -n "$SMTP_PASSWORD" && echo hasPassword=true || echo hasPassword=false'
```

Restart backendu po zmianie `.env`:

```bash
docker compose up -d --force-recreate server
```

Podglad logow:

```bash
docker compose logs -f server
```

## Status etapu

Status:

```text
DONE - konfiguracja SMTP poprawiona na port 587 STARTTLS
```

Do potwierdzenia testem biznesowym:

```text
czy mail z zamowienia / resetu hasla dochodzi do odbiorcy
```



------ 

# Storage uploadow - Hetzner VPS teraz, Object Storage pozniej

Data: 14 pazdziernika 2026

## Cel etapu

Celem jest zaplanowanie miejsca na pliki aplikacji Opticut:

```text
zdjecia materialow
zdjecia produktow
zalaczniki klientow
pliki do zamowien
dokumenty techniczne
projekty / rysunki / PDF
```

Obecnie projekt uzywa m.in. Cloudinary / FTP w wybranych miejscach.

Po migracji na Hetzner chcemy miec bardziej kontrolowany model:

```text
aplikacja Opticut -> backend -> storage plikow
```

Na start storage moze byc lokalny na VPS.

Docelowo, za rok lub dwa, mozemy przeniesc pliki do:

```text
Hetzner Object Storage
```

czyli S3-compatible bucket.

## Decyzja na teraz

Na teraz wybieramy:

```text
STORAGE_DRIVER=local
```

czyli pliki trzymane lokalnie na Hetzner VPS.

Przyklad katalogu:

```text
/opt/opticut-data/uploads
```

Nie trzymamy uploadow w repozytorium Git.

Nie trzymamy uploadow w katalogu kodu aplikacji.

Dlaczego?

```text
kod aplikacji = przepis
uploady klientow = dane produkcyjne
```

Przepis mozna pobrac z GitHub.

Dane produkcyjne trzeba backupowac i chronic osobno.

## Decyzja docelowa

Docelowo chcemy miec mozliwosc przejscia na:

```text
STORAGE_DRIVER=s3
```

czyli np.:

```text
Hetzner Object Storage
```

Wtedy pliki beda w bucket, a VPS bedzie tylko uruchamial aplikacje.

Przyklad:

```text
Opticut backend -> S3 bucket -> plik
MySQL -> metadata pliku
```

To jest bardziej produkcyjny model dla wiekszej liczby klientow.

## Dlaczego nie FTP jako glowny storage

FTP CyberFolks moze istniec i moze byc uzyteczny do recznych operacji.

Ale nie jest najlepszym glownym storage dla aplikacji, ktora ma obslugiwac uploady klientow.

FTP jest bardziej jak:

```text
reczny dostep do folderu na hostingu
```

A aplikacja potrzebuje raczej:

```text
API do zapisu, odczytu, usuwania, podpisanych linkow i kontroli dostepu
```

Dlatego:

```text
FTP = awaryjnie / recznie / migracyjnie
local VPS = dobry start
S3/Object Storage = najlepszy kierunek docelowy
```

## Dlaczego nie od razu Object Storage

Hetzner Object Storage jest dodatkowo platny.

Nie jest wliczony w VPS.

Dlatego na start mozemy nie generowac dodatkowego kosztu i uzyc dysku VPS.

Warunek:

```text
musimy miec backup uploadow
musimy pilnowac miejsca na dysku
musimy miec limity uploadu
```

Kiedy przejsc na Object Storage?

```text
gdy plikow bedzie duzo
gdy pojawia sie realni klienci
gdy subdomeny typu decorum.opticut.pl beda aktywne produkcyjnie
gdy backup lokalnego dysku stanie sie ryzykowny
gdy bedziemy chcieli oddzielic pliki od VPS
```

## Proponowana architektura

W kodzie nie chcemy pisac logiki typu:

```text
wyslij zawsze do /uploads
```

albo:

```text
wyslij zawsze do Cloudinary
```

Lepiej stworzyc jedna warstwe:

```text
StorageService
```

Przykladowe funkcje:

```text
uploadFile()
deleteFile()
getPublicUrl()
getSignedUrl()
getFileMetadata()
```

Wtedy backend nie musi wiedziec, czy plik jest na dysku VPS, w Cloudinary, FTP czy S3.

Backend pyta tylko:

```text
StorageService, zapisz ten plik.
```

A StorageService decyduje:

```text
local albo s3
```

## Zmienne srodowiskowe

Na start:

```env
STORAGE_DRIVER=local
UPLOADS_ROOT=/opt/opticut-data/uploads
UPLOADS_PUBLIC_BASE_URL=https://www.opticut.pl/uploads
MAX_UPLOAD_MB=25
```

Docelowo dla S3:

```env
STORAGE_DRIVER=s3
S3_ENDPOINT=...
S3_BUCKET=opticut-prod
S3_ACCESS_KEY_ID=...
S3_SECRET_ACCESS_KEY=...
S3_REGION=...
S3_PUBLIC_BASE_URL=...
MAX_UPLOAD_MB=25
```

Sekrety S3 nie moga trafic do GitHub ani README.

## Struktura katalogow lokalnych

Na VPS:

```text
/opt/opticut-data/uploads
```

Proponowana struktura:

```text
/opt/opticut-data/uploads/
  tenants/
    default/
      materials/
      products/
      orders/
    decorum/
      materials/
      products/
      orders/
```

Przyklad:

```text
/opt/opticut-data/uploads/tenants/decorum/orders/12345/attachments/projekt.pdf
/opt/opticut-data/uploads/tenants/decorum/materials/plyta-dab.jpg
```

Dlaczego `tenants`?

Bo docelowo moga byc subdomeny:

```text
decorum.opticut.pl
client1.opticut.pl
client2.opticut.pl
```

Pliki klientow nie powinny byc wymieszane w jednym plaskim folderze.

## Metadata w bazie danych

Plik nie powinien istniec tylko jako plik na dysku.

W MySQL warto trzymac metadata:

```text
id
tenant_id
owner_type
owner_id
file_key
original_name
mime_type
size_bytes
storage_driver
visibility
created_by
created_at
deleted_at
```

Przyklad:

```text
owner_type = order
owner_id = 12345
file_key = tenants/decorum/orders/12345/attachments/projekt.pdf
storage_driver = local
visibility = private
```

Dzieki temu aplikacja wie:

```text
do czego nalezy plik
kto go dodal
czy jest publiczny
czy prywatny
gdzie fizycznie lezy
```

## Publiczne i prywatne pliki

Nie wszystkie pliki powinny byc publiczne.

Publiczne:

```text
zdjecia materialow
zdjecia produktow
grafiki katalogowe
```

Prywatne:

```text
zalaczniki klientow
pliki zamowien
projekty produkcyjne
dokumenty techniczne
pliki z danymi osobowymi
```

Zasada:

```text
publiczne pliki moga byc pod /uploads/public
prywatne pliki powinny isc przez backend i autoryzacje
```

Przyklad publicznego URL:

```text
https://www.opticut.pl/uploads/public/materials/plyta-dab.jpg
```

Przyklad prywatnego pobrania:

```text
GET /api/v1/files/:id/download
```

Backend sprawdza:

```text
czy uzytkownik ma prawo do tego pliku
```

i dopiero wtedy zwraca plik.

## Caddy i publiczne uploady

Jesli mamy publiczne uploady na dysku VPS, Caddy moze je wystawiac jako static files.

Przyklad docelowej idei:

```text
/uploads/public/* -> /opt/opticut-data/uploads/public/*
```

Ale prywatnych zalacznikow nie wystawiamy bezposrednio przez Caddy.

Prywatne pliki powinny isc przez backend:

```text
/api/v1/files/:id/download
```

## Docker volume / bind mount

Kontener backendu musi widziec katalog uploadow.

W `docker-compose.yml` mozna dodac bind mount:

```yaml
server:
  volumes:
    - /opt/opticut-data/uploads:/app/uploads
```

Wtedy aplikacja w kontenerze zapisuje do:

```text
/app/uploads
```

a na hoście pliki sa w:

```text
/opt/opticut-data/uploads
```

To wazne, bo kontener moze byc usuniety i odtworzony.

Pliki musza zostac poza kontenerem.

## Limity uploadu

Trzeba ustawic limity, zeby klient przypadkiem nie zapchal dysku.

Propozycja:

```text
MAX_UPLOAD_MB=25
dozwolone typy: jpg, jpeg, png, webp, pdf, dxf, dwg, zip
blokowane: exe, bat, sh, php, js jako upload klienta
```

Przyklad:

```text
zdjecie materialu: max 5-10 MB
zalacznik zamowienia: max 25 MB
archiwum projektu: max 50 MB tylko dla admina
```

## Bezpieczenstwo uploadow

Minimalne zasady:

```text
nie ufac nazwie pliku od klienta
generowac wlasna nazwe / file_key
sprawdzac MIME type
sprawdzac rozszerzenie
ustawic limit rozmiaru
nie wykonywac uploadowanych plikow
prywatne pliki dawac przez backend z autoryzacja
logowac kto dodal plik
```

Zla praktyka:

```text
/uploads/faktura.php
```

Dobra praktyka:

```text
tenants/decorum/orders/12345/attachments/2026-10-14_abc123.pdf
```

## Backup

Jesli uploady sa na VPS, backup jest obowiazkowy.

Do backupu musza trafic:

```text
/opt/opticut-data/uploads
/opt/opticut/server/.env
/etc/caddy/Caddyfile
MySQL dump
monitoring config
```

Bez backupu uploadow sytuacja wyglada tak:

```text
GitHub odtworzy kod
Docker odtworzy kontenery
ale pliki klientow przepadaja
```

Dlatego Etap 12 Backup musi uwzglednic uploady.

## Monitoring storage

Poniewaz uploady beda rosly, musimy monitorowac dysk.

Juz mamy Grafane i panel:

```text
Root disk usage %
```

Warto dodac tez alert:

```text
dysk > 80% -> ostrzezenie
dysk > 90% -> pilny alarm
```

Komendy awaryjne:

```bash
df -h
du -sh /opt/opticut-data/uploads
docker system df
```

## Etapy integracji

### Krok 1 - decyzja storage

Na start:

```text
STORAGE_DRIVER=local
UPLOADS_ROOT=/opt/opticut-data/uploads
```

Docelowo:

```text
STORAGE_DRIVER=s3
```

### Krok 2 - katalog na VPS

Utworzyc:

```bash
sudo mkdir -p /opt/opticut-data/uploads
sudo chown -R maciej:docker /opt/opticut-data
```

### Krok 3 - Docker mount

Dopisac do `docker-compose.yml` dla backendu:

```yaml
volumes:
  - /opt/opticut-data/uploads:/app/uploads
```

### Krok 4 - zmienne `.env`

Dopisac:

```env
STORAGE_DRIVER=local
UPLOADS_ROOT=/app/uploads
UPLOADS_PUBLIC_BASE_URL=https://www.opticut.pl/uploads
MAX_UPLOAD_MB=25
```

### Krok 5 - StorageService w backendzie

Dodac wspolna warstwe:

```text
StorageService
LocalStorageProvider
S3StorageProvider pozniej
```

### Krok 6 - upload endpoint

Dodac endpoint:

```text
POST /api/v1/files/upload
```

albo osobne:

```text
POST /api/v1/materials/:id/images
POST /api/v1/orders/:id/attachments
```

### Krok 7 - metadata w MySQL

Dodac tabele plikow / zalacznikow.

Przyklad:

```text
files
order_attachments
material_images
```

### Krok 8 - publiczne URL i prywatne pobieranie

Publiczne materialy:

```text
https://www.opticut.pl/uploads/public/...
```

Prywatne zalaczniki:

```text
/api/v1/files/:id/download
```

### Krok 9 - backup uploadow

Dodac do planu backupu:

```text
/opt/opticut-data/uploads
```

### Krok 10 - migracja do Object Storage w przyszlosci

Kiedy bedzie potrzeba:

```text
utworzyc bucket
dodac S3 credentials
dodac S3StorageProvider
zmienic STORAGE_DRIVER=s3
przeniesc pliki rclone/aws cli
zaktualizowac file_key/public URLs
```

## Co byloby, gdybysmy tego nie zaplanowali

Bez planu storage:

```text
pliki trafiaja przypadkowo do roznych miejsc
czesc do Cloudinary
czesc na FTP
czesc na VPS
czesc do kontenera i przepada po rebuildzie
backup nie obejmuje wszystkiego
przy wielu klientach dane sie mieszaja
```

To jest jak trzymanie dokumentow firmy:

```text
troche w szufladzie
troche w aucie
troche u ksiegowej
troche w mailu
```

Na poczatku dziala.

Po roku nikt nie wie, gdzie jest najwazniejszy plik.

Dlatego robimy jedna warstwe storage i jeden porzadek katalogow.

## Rekomendacja koncowa

Na teraz:

```text
local uploads na Hetzner VPS
```

Ale kod piszemy tak, zeby pozniej przelaczyc na:

```text
Hetzner Object Storage / S3
```

bez przebudowy calej aplikacji.

Najwazniejsze zasady:

```text
uploady poza repo
uploady poza kontenerem
metadata w MySQL
publiczne i prywatne pliki rozdzielone
backup uploadow obowiazkowy
monitoring dysku obowiazkowy
StorageService jako warstwa abstrakcji
```

## Status etapu

Status:

```text
PLAN GOTOWY
```

Nastepny praktyczny krok:

```text
utworzyc /opt/opticut-data/uploads
dodac mount do docker-compose
dodac zmienne STORAGE_DRIVER/UPLOADS_ROOT
zaprojektowac tabele files i endpoint uploadu
```





# Local uploads na Hetzner VPS - wykonanie i kolejne kroki w aplikacji

Data: 14 pazdziernika 2026

## Cel etapu

Celem bylo przygotowanie produkcyjnego miejsca na pliki aplikacji Opticut na serwerze Hetzner VPS.

Chodzi o pliki takie jak:

```text
zdjecia materialow
zdjecia produktow
zalaczniki klientow
pliki zamowien
PDF / rysunki / dokumenty techniczne
```

Do tej pory projekt uzywal m.in. FTP / Cloudinary w wybranych miejscach.

Teraz przygotowalismy fundament pod lokalny storage na VPS:

```text
Hetzner VPS -> /opt/opticut-data/uploads
backend Docker -> /app/uploads
Caddy -> publiczne pliki pod /uploads/public/*,
```

## Co zrobilismy na serwerze

### 1. Utworzylismy magazyn plikow poza repo i poza kontenerem

Na serwerze powstal katalog:

```text
/opt/opticut-data/uploads
```

To jest wazne, bo:

```text
repo Git = kod aplikacji
kontener Docker = uruchomiona aplikacja
/opt/opticut-data/uploads = dane produkcyjne uzytkownikow
```

Pliki klientow nie powinny byc w repozytorium Git.

Pliki klientow nie powinny byc zapisane tylko wewnatrz kontenera, bo kontener mozna przebudowac/usunac.

## Uprawnienia

Katalog zostal ustawiony tak, aby aplikacja mogla do niego pisac:

```bash
sudo chown -R maciej:docker /opt/opticut-data
sudo chmod -R 775 /opt/opticut-data
```

Po pierwszym uruchomieniu backendu okazalo sie, ze kontener nie mogl zapisac katalogu:

```text
EACCES: permission denied, mkdir '/app/uploads/ragindexed'
```

Backend dzialal jako uzytkownik wewnatrz kontenera, ktory nie pasowal do uprawnien katalogu.

Na szybko odblokowalismy zapis:

```bash
sudo chmod -R 777 /opt/opticut-data/uploads
```

To przywrocilo backend do dzialania.

Notatka techniczna:

```text
777 jest szybka naprawa produkcyjna.
Docelowo warto ustalic UID/GID uzytkownika backendu w kontenerze i dac precyzyjniejsze uprawnienia.
```

## Struktura katalogow

Utworzone katalogi:

```text
/opt/opticut-data/uploads/materials
/opt/opticut-data/uploads/tenants/opticut/materials
/opt/opticut-data/uploads/tenants/decorum/materials
/opt/opticut-data/uploads/tenants/decorum/orders
/opt/opticut-data/uploads/public/materials
/opt/opticut-data/uploads/private/orders
```

Najwazniejszy kierunek docelowy:

```text
/opt/opticut-data/uploads/tenants/{tenantSlug}/...
```

Przyklady:

```text
tenants/opticut/materials/plyta-dab.jpg
tenants/decorum/materials/blat-bialy.jpg
tenants/decorum/orders/12345/attachments/projekt.pdf
```

Dlaczego tak?

Bo docelowo moga byc subdomeny:

```text
opticut.pl
decorum.opticut.pl
client1.opticut.pl
```

Kazdy klient/tenant powinien miec logicznie oddzielone pliki.

## Public i private

Przyjelismy bezpieczny podzial:

```text
uploads/public  -> pliki publiczne, np. zdjecia materialow
uploads/private -> pliki prywatne, np. zalaczniki klientow
```

Publiczne pliki moga byc czytane przez przegladarke.

Prywatne pliki nie powinny byc wystawione bezposrednio przez Caddy.

Prywatne pliki powinny isc przez backend:

```text
GET /api/v1/files/:id/download
```

Backend wtedy sprawdza:

```text
czy uzytkownik ma prawo pobrac ten plik
```

## Docker mount

Do `docker-compose.yml` w sekcji `server` dodalismy mount:

```yaml
volumes:
  - /opt/opticut-data/uploads:/app/uploads
```

Dzieki temu:

```text
backend widzi /app/uploads
host trzyma pliki w /opt/opticut-data/uploads
```

Po odtworzeniu backendu:

```bash
docker compose up -d --force-recreate server
```

sprawdzilismy, ze kontener widzi katalog:

```bash
docker compose exec server sh -c 'ls -la /app/uploads && ls -la /app/uploads/tenants'
```

## Test zapisu z kontenera

Z kontenera backendu utworzylismy plik:

```bash
docker compose exec server sh -c 'echo "upload mount ok" > /app/uploads/tenants/opticut/materials/test.txt'
```

Na hoście sprawdzilismy:

```bash
cat /opt/opticut-data/uploads/tenants/opticut/materials/test.txt
```

Wynik:

```text
upload mount ok
```

To potwierdza:

```text
backend moze zapisywac do /app/uploads
plik fizycznie zostaje na VPS poza kontenerem
```

## Zmienne srodowiskowe storage

Do `/opt/opticut/server/.env` dodalismy:

```env
STORAGE_DRIVER=local
UPLOADS_ROOT=/app/uploads
UPLOADS_PUBLIC_BASE_URL=https://www.opticut.pl/uploads
MAX_UPLOAD_MB=25
```

Sprawdzenie w kontenerze:

```bash
docker compose exec server sh -c 'node -e "console.log({
  STORAGE_DRIVER: process.env.STORAGE_DRIVER,
  UPLOADS_ROOT: process.env.UPLOADS_ROOT,
  UPLOADS_PUBLIC_BASE_URL: process.env.UPLOADS_PUBLIC_BASE_URL,
  MAX_UPLOAD_MB: process.env.MAX_UPLOAD_MB
})"'
```

Dobry wynik:

```text
STORAGE_DRIVER: 'local'
UPLOADS_ROOT: '/app/uploads'
UPLOADS_PUBLIC_BASE_URL: 'https://www.opticut.pl/uploads'
MAX_UPLOAD_MB: '25'
```

## Caddy - publiczne uploady

Zmienilismy Caddy tak, aby wystawial tylko publiczne uploady.

Caddyfile:

```caddyfile
opticut.pl, www.opticut.pl {
        handle /api/v1/* {
                reverse_proxy 127.0.0.1:8000
        }

        handle /uploads/public/* {
                root * /opt/opticut-data
                file_server
        }

        handle {
                reverse_proxy 127.0.0.1:3000
        }
}
```

Wazne:

```text
/uploads/public/* jest publiczne
/uploads/private/* nie jest publiczne
```

Po edycji Caddy:

```bash
sudo caddy validate --config /etc/caddy/Caddyfile
sudo caddy fmt --overwrite /etc/caddy/Caddyfile
sudo systemctl reload caddy
```

## Test publicznego pliku

Utworzylismy plik:

```bash
echo "public upload ok" > /opt/opticut-data/uploads/public/materials/test.txt
```

Test:

```bash
curl -i https://www.opticut.pl/uploads/public/materials/test.txt
```

Dobry wynik:

```text
HTTP/2 200
public upload ok
```

To potwierdza, ze publiczne pliki dzialaja.

## Test prywatnego pliku

Utworzylismy plik:

```bash
echo "private should not be public" > /opt/opticut-data/uploads/private/orders/secret-test.txt
```

Test:

```bash
curl -i https://www.opticut.pl/uploads/private/orders/secret-test.txt
```

Wynik:

```text
HTTP/2 404
```

I nie pojawila sie tresc:

```text
private should not be public
```

To potwierdza, ze prywatne pliki nie sa wystawione publicznie.

## Monitoring zadzialal

Podczas pierwszego podpiecia mounta backend wpadl w restart loop przez blad uprawnien.

Uptime Kuma wykryla, ze:

```text
Opticut API health bylo offline
```

Po naprawie uprawnien i restarcie backendu Discord pokazal:

```text
Your service Opticut API health is up!
Downtime Duration: 38m
```

To potwierdza, ze monitoring ma sens i dziala w praktyce.

## Co trzeba teraz zmienic w aplikacji

Serwer jest gotowy.

Teraz trzeba dostosowac kod aplikacji, zeby zamiast FTP / Cloudinary dla materialow mogl uzywac lokalnego storage.

Najlepszy kierunek:

```text
nie przepisywac wszystkiego "na sztywno"
tylko dodac StorageService
```

## Krok aplikacji 1 - znalezc obecny kod FTP/Cloudinary

W projekcie trzeba znalezc miejsca, ktore uzywaja:

```text
FTP_HOST
FTP_PORT
FTP_USER
FTP_PASSWORD
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
```

Przykladowe szukania:

```bash
rg "FTP_|Cloudinary|cloudinary|CLOUDINARY|upload" server
rg "materials" server/controllers
```

Cel:

```text
ustalic, ktore endpointy zapisuja zdjecia materialow
ustalic, gdzie baza zapisuje URL obrazka
ustalic, czy frontend oczekuje pelnego URL, czy sciezki
```

## Krok aplikacji 2 - dodac StorageService

Dodac wspolny serwis, np.:

```text
server/services/storage/storage.service.ts
```

Interfejs:

```ts
export interface StoredFile {
  key: string;
  url?: string;
  originalName: string;
  mimeType: string;
  size: number;
}

export interface StorageService {
  uploadFile(input: {
    tenantSlug: string;
    category: 'materials' | 'products' | 'orders';
    visibility: 'public' | 'private';
    file: Express.Multer.File;
  }): Promise<StoredFile>;

  deleteFile(key: string): Promise<void>;
  getPublicUrl(key: string): string;
}
```

Na start implementacja:

```text
LocalStorageService
```

Docelowo pozniej:

```text
S3StorageService
```

## Krok aplikacji 3 - local storage provider

Local provider powinien zapisywac publiczne materialy np. do:

```text
/app/uploads/public/tenants/{tenantSlug}/materials/{filename}
```

URL publiczny:

```text
https://www.opticut.pl/uploads/public/tenants/{tenantSlug}/materials/{filename}
```

Dla prywatnych zalacznikow:

```text
/app/uploads/private/tenants/{tenantSlug}/orders/{orderId}/attachments/{filename}
```

Te pliki nie powinny miec publicznego URL.

## Krok aplikacji 4 - nazwy plikow

Nie uzywac bezposrednio nazw od klienta jako finalnej nazwy pliku.

Zla praktyka:

```text
../../plik.jpg
faktura.php
plyta dab *****.jpg
```

Dobra praktyka:

```text
2026-10-14_8f3a2c_plyta-dab.jpg
uuid.webp
```

Trzeba:

```text
oczyscic nazwe
dodac losowy ID / UUID
zachowac oryginalna nazwe w bazie
```

## Krok aplikacji 5 - walidacja uploadu

Backend powinien sprawdzac:

```text
rozmiar pliku
typ MIME
rozszerzenie
czy uzytkownik ma uprawnienie
czy tenant jest poprawny
```

Przykladowe limity:

```text
MAX_UPLOAD_MB=25
zdjecia materialow: jpg, jpeg, png, webp
zalaczniki zamowien: pdf, jpg, png, zip, dxf, dwg
blokowane: exe, sh, bat, php
```

## Krok aplikacji 6 - metadata w MySQL

W bazie warto trzymac informacje o plikach.

Przyklad tabeli:

```text
files
```

Kolumny:

```text
id
tenant_slug
owner_type
owner_id
visibility
storage_driver
file_key
public_url
original_name
mime_type
size_bytes
created_by
created_at
deleted_at
```

Dla zdjec materialow mozna tez miec:

```text
material_images
```

albo dopisac `image_url` w tabeli materialow, jesli obecny model jest prosty.

Najlepiej:

```text
baza trzyma URL albo file_key
plik fizycznie lezy w /opt/opticut-data/uploads
```

## Krok aplikacji 7 - endpoint uploadu materialow

Docelowo endpoint moze wygladac np.:

```text
POST /api/v1/materials/:id/images
```

Backend:

```text
odbiera plik przez multer
sprawdza limity
wybiera tenantSlug
zapisuje plik przez StorageService
zapisuje metadata / URL w MySQL
zwraca URL do frontendu
```

Przykladowa odpowiedz:

```json
{
  "success": true,
  "file": {
    "key": "public/tenants/opticut/materials/abc123.webp",
    "url": "https://www.opticut.pl/uploads/public/tenants/opticut/materials/abc123.webp"
  }
}
```

## Krok aplikacji 8 - frontend

Frontend powinien wyswietlac URL zwrocony przez backend.

Jesli obrazki sa publiczne:

```text
<img src="https://www.opticut.pl/uploads/public/..." />
```

Albo sciezka relatywna:

```text
<img src="/uploads/public/..." />
```

Wazne:

```text
przegladarka pobiera tylko obrazy wskazane przez aktualny widok
nie pobiera calego folderu 100 MB
```

Ale trzeba uwazac:

```text
lista 200 obrazkow naraz = przegladarka moze pobrac 200 obrazkow
miniatura 200x200 nie powinna byc plikiem 8 MB
```

Docelowo warto:

```text
loading="lazy"
miniatury webp
oryginal tylko po kliknieciu / w szczegolach
```

## Krok aplikacji 9 - miniatury

Na start mozna zapisac oryginalny obraz.

Docelowo lepiej generowac:

```text
original
thumb
medium
```

Przyklad:

```text
public/tenants/opticut/materials/original/plyta.jpg
public/tenants/opticut/materials/thumb/plyta.webp
```

Na listach materialow uzywac:

```text
thumb
```

W szczegolach:

```text
medium/original
```

## Krok aplikacji 10 - migracja z FTP

Trzeba ustalic obecne zrodlo prawdy FTP:

```text
gdzie sa pliki na FTP
jakie URL-e sa zapisane w bazie
czy baza trzyma pelny URL, czy sama nazwe pliku
```

Migracja moze wygladac tak:

```text
1. pobrac pliki z FTP
2. wgrac do /opt/opticut-data/uploads/public/tenants/opticut/materials
3. zaktualizowac URL-e w MySQL
4. sprawdzic frontend
5. zostawic FTP jako fallback na czas testow
```

Nie robic migracji "w ciemno".

Najpierw trzeba zinwentaryzowac:

```text
ile plikow
jakie rozmiary
gdzie w bazie sa referencje
czy sa duplikaty
```

## Krok aplikacji 11 - backup uploadow

Od teraz backup musi obejmowac:

```text
/opt/opticut-data/uploads
```

Bez tego:

```text
GitHub odtworzy kod
Docker odtworzy kontenery
ale pliki materialow i klientow przepadna
```

To musi wejsc do Etapu 12 Backup.

## Krok aplikacji 12 - przyszle przejscie na Object Storage

Jesli za rok/dwa przejdziemy na Hetzner Object Storage:

```text
STORAGE_DRIVER=s3
```

Kod nie powinien sie rozsypac, jesli od poczatku bedzie StorageService.

Wtedy zmieniamy provider:

```text
LocalStorageService -> S3StorageService
```

Pliki migrujemy:

```text
/opt/opticut-data/uploads -> bucket S3
```

a baza nadal trzyma:

```text
file_key
metadata
visibility
```

## Czego nie robic

Nie robic:

```text
uploadow do repo Git
uploadow tylko do kontenera
wystawiania calego /uploads jako publiczne
prywatnych zalacznikow przez Caddy
zapisywania plikow bez limitu rozmiaru
uzywania oryginalnej nazwy klienta bez oczyszczania
```

## Szybka sciaga komend

Status backendu:

```bash
docker compose ps
```

Logi backendu:

```bash
docker compose logs server --tail=80
```

Sprawdzenie mounta:

```bash
docker compose exec server sh -c 'ls -la /app/uploads'
```

Test zapisu:

```bash
docker compose exec server sh -c 'echo "upload mount ok" > /app/uploads/tenants/opticut/materials/test.txt'
cat /opt/opticut-data/uploads/tenants/opticut/materials/test.txt
```

Test publicznego pliku:

```bash
curl -i https://www.opticut.pl/uploads/public/materials/test.txt
```

Test prywatnego pliku:

```bash
curl -i https://www.opticut.pl/uploads/private/orders/secret-test.txt
```

## Status etapu

Status infrastruktury:

```text
DONE
```

Zrobione:

```text
katalog uploadow na VPS
struktura tenants/public/private
mount do backendu
test zapisu z kontenera
zmienne STORAGE_DRIVER/UPLOADS_ROOT
Caddy dla /uploads/public/*
test public/private
```

Status aplikacji (materialy):

```text
DONE (14.10.2026) — upload + odczyt zdjec materialow na VPS
```

Pozostalo (poza materialami):

```text
zalaczniki formatek/zamowien → nadal FTP (TODO)
backup /opt/opticut-data/uploads (Etap 12)
metadata tabela files (opcjonalnie)
STORAGE_DRIVER=s3 w przyszlosci
```

## Aktualizacja 14.10.2026 — upload zdjęć materiałów działa (PO CO to robiliśmy)

**Cel:** zdjęcia materiałów mają przeżyć rebuild/deploy Dockera i działać na www.opticut.pl bez FTP/Cloudinary.

**Dlaczego mount:** pliki poza kontenerem (`/opt/opticut-data/uploads` → `/app/uploads`). Rebuild `server` nie kasuje szafy z dysku VPS.

**Dlaczego deploy ≠ zdjęcia:** `git push` wdraża kod. Obrazy trzeba wgrać na produkcji (Settings → Storage) albo skopiować na host — localhost ma inny dysk.

**Dlaczego chown 1001:** proces w kontenerze to UID `1001` / GID `65533`. Katalog `public` był UID `1000` → `EACCES` przy `mkdir` → pusta lista VPS mimo „działającego” API.

- Potwierdzony mount: `/opt/opticut-data/uploads:/app/uploads` (także w Git `docker-compose.yml`).
- Backend: `STORAGE_DRIVER=local`, `UPLOADS_ROOT=/app/uploads`.
- Ścieżka: `…/public/tenants/opticut/materials` (host = kontener).

Skuteczna naprawa na VPS:

```bash
sudo mkdir -p /opt/opticut-data/uploads/public/tenants/opticut/materials
sudo chown 1001:65533 /opt/opticut-data/uploads/public/tenants/opticut/materials
sudo chmod 755 /opt/opticut-data/uploads/public/tenants /opt/opticut-data/uploads/public/tenants/opticut /opt/opticut-data/uploads/public/tenants/opticut/materials
```

Po naprawie upload przez Settings → Storage działa (bez restartu). Roadmapa UI: Etap 12 kroki 12-4/12-5 ✔, 12-6 w toku (załączniki).

---

## Dev, produkcja i wersje klientów

Aktualizacja: **16.10.2026 · propozycja do wdrożenia i rozważenia**. Ta sekcja oraz panel w `page.tsx` uzupełniają istniejące 13 etapów. Nie oznaczają, że DNS, VPS, workflow lub obsługa tenantów zostały już skonfigurowane.

### 1. Jak to rozumieć najprościej?

Dev to kuchnia, w której próbujesz nowego przepisu. Produkcja to danie podane klientom. Dopiero po sprawdzeniu przepisu wybierasz, kiedy go podać. Nadal może zdarzyć się błąd — dlatego potrzebujemy także monitoringu i możliwości powrotu do poprzedniego wydania.

| Miejsce | Do czego służy | Dane i odbiorcy |
| --- | --- | --- |
| Komputer lokalny | Pisanie kodu i szybkie próby | Programista, lokalne dane |
| `dev.opticut.pl` | Testowanie kandydata do wydania w warunkach zbliżonych do produkcji | Testerzy, osobne dane testowe |
| `opticut.pl` / `www.opticut.pl` | Stabilna usługa produkcyjna | Użytkownicy i prawdziwe dane |
| `decorum.opticut.pl` | Docelowy adres jednego klienta produkcyjnego | Dane i uprawnienia firmy Decorum |

`dev.opticut.pl` może pełnić rolę **staging**, czyli ostatniej próby przed produkcją. Uruchamiamy tam produkcyjny build Next.js, a nie serwer `next dev`. Nazwa subdomeny nie narzuca sposobu uruchomienia aplikacji. Tenant oznacza firmę korzystającą z systemu; tenant i środowisko to dwie różne rzeczy. Na dev możemy mieć testowego tenanta Decorum bez połączenia z jego prawdziwymi danymi.

### 2. Co mamy obecnie — na podstawie plików

- `.github/workflows/deploy-hetzner.yml` reaguje na `push` do `main` oraz uruchomienie ręczne. Na VPS ustawia kod na `origin/main`, buduje backend, pobiera flagi modułów, buduje frontend i restartuje usługi. Nie ma osobnego zadania dev ani bramki akceptacji produkcji.
- `docker-compose.yml` używa portów hosta `127.0.0.1:3000` i `127.0.0.1:8000`, pliku `server/.env` i katalogu `/opt/opticut-data/uploads`. Druga kopia z tymi samymi ustawieniami kolidowałaby z produkcją lub korzystała z jej danych.
- Frontend jest budowany z flagami pobranymi z `/api/v1/modules/deploy-flags` i tabeli `Modules`. To wybór zawartości obrazu, a nie dowód, że istnieją uprawnienia per tenant.
- README wskazuje VPS 4 GB i wcześniejsze problemy z pamięcią podczas budowania. Nie potwierdzono tu aktualnej wolnej pamięci, konfiguracji DNS ani gotowej izolacji klientów w aplikacji.

**Wniosek:** dopisanie rekordu DNS albo nazwanie gałęzi `develop` nie zmieni dotychczasowego wdrażania produkcji. Potrzebna jest zmiana infrastruktury i workflow. Przed jej wdrożeniem push na `main` nadal uruchamia dotychczasowy automat.

### 3. Czy subdomena może być w Cyberfolks, a aplikacja na Hetzner?

Tak. Domena jest adresem, a VPS miejscem, do którego ten adres prowadzi. Jeśli aktywne serwery DNS domeny są w Cyberfolks, dodajemy tam rekord **A** o nazwie `dev`, wskazujący publiczny IPv4 serwera testowego. Gdy aktywna strefa DNS jest u innego operatora, rekord dodajemy u niego. Nie trzeba przenosić poczty ani całej domeny.

Najpierw wybieramy serwer testowy. Dla tego projektu zalecam osobny VPS dev: błąd, build lub brak RAM na dev ma wtedy mniejszy wpływ na produkcję. Drugi VPS to dodatkowy koszt; rozmiar dobieramy po pomiarze użycia zasobów. Wariant oszczędny na jednym VPS jest możliwy, ale dzieli RAM, CPU, dysk i ryzyko awarii z produkcją.

Po ustawieniu DNS trzeba skonfigurować Caddy, routing do testowych usług i HTTPS. Sprawdzamy też, czy istniejący rekord AAAA nie prowadzi do innego serwera. Sam DNS nie tworzy aplikacji ani certyfikatu. Dev zabezpieczamy dostępem dla testerów, np. VPN lub uwierzytelnianiem przed aplikacją. `noindex` ogranicza indeksowanie, lecz nie ogranicza dostępu.

Instrukcja operatora: [edycja rekordów DNS w Cyberfolks](https://cyberfolks.pl/pomoc/jak-zmienic-rekordy-dns/).

### 4. Co musi być osobne, żeby test nie zepsuł produkcji?

| Element | Plan izolacji | Co grozi bez tego |
| --- | --- | --- |
| Baza | Osobna baza i użytkownik DB bez dostępu do produkcji; dane syntetyczne lub zanonimizowane | Test usuwa albo zmienia prawdziwe zamówienia |
| Pliki | Osobny katalog/volume, np. `/opt/opticut-dev-data/uploads` | Test nadpisuje zdjęcia i załączniki klientów |
| Redis, sesje, kolejki | Osobna instancja dev i osobne zadania w tle | Dev obsługuje produkcyjne zadania lub sesje |
| Sekrety i integracje | Osobne klucze sesji/JWT, testowe konta płatności, skrzynka przechwytująca e-maile | Test pobiera pieniądze lub wysyła wiadomości klientom |
| Logowanie | Osobne cookies, bez wspólnego zakresu `.opticut.pl`; osobne callbacki OAuth i dozwolone originy | Sesje mieszają się między środowiskami |
| Kontenery | Osobny projekt Compose i sieć, np. `opticut-dev` | Deploy dev restartuje produkcję |
| Porty i routing | Na wspólnym hoście inne porty lokalne, np. 3100/8100 po sprawdzeniu ich dostępności | Kolizja portów lub ruch do złej aplikacji |
| Wdrożenia | Osobne konta/uprawnienia wdrożeniowe i sekrety dev/prod | Automat dev może nadpisać produkcję |

Osobna nazwa projektu Compose pomaga rozdzielić zasoby, ale **nie zmienia sama** wpisanych na sztywno portów, ścieżek hosta, plików ENV ani współdzielonych zasobów zewnętrznych. Trzeba przejrzeć konfigurację każdego z nich. Dokumentacja: [nazwy projektów Compose](https://docs.docker.com/compose/how-tos/project-name/), [Compose na produkcji](https://docs.docker.com/compose/how-tos/production/).

### 5. Czy każdy commit będzie trafiał na dev?

**Commit** zapisuje wersję na komputerze. **Push** wysyła ją do GitHub. Dopiero reguła GitHub Actions decyduje, co wdrożyć. Proponowany prosty model:

1. Tworzysz zmianę na gałęzi `feature/nazwa-zmiany`, robisz commity i push. Uruchamiają się kontrole; produkcja się nie zmienia.
2. Pull Request, czyli propozycja połączenia kodu, trafia do `develop`. Po połączeniu automat sprawdza kod, buduje wydanie i wdraża je na `dev.opticut.pl`.
3. Sprawdzasz tę wersję na dev. Zapisujesz numer wydania, SHA commita, identyfikatory obrazów frontendu/API, zestaw flag builda i wynik testów. Kolejny push może zmienić dev, więc nie zatwierdzamy po prostu „tego, co akurat jest na develop”.
4. Otwierasz PR z `develop` do `main`. Sprawdzasz zakres zmian i wyniki testów, akceptujesz, a potem łączysz kod. Jeśli pojawiła się nowa zmiana albo konflikt zmienił kod, kandydat wymaga ponownego sprawdzenia na dev.
5. Osobne, ręcznie uruchamiane wdrożenie produkcji przyjmuje identyfikator **konkretnego przetestowanego wydania**. Weryfikuje jego powiązanie z zaakceptowanym kodem w `main` i wdraża zapisane obrazy. Nie pobiera bezwarunkowo najnowszego `origin/main`.
6. Automat sprawdza frontend, API i najważniejsze operacje. Ty obserwujesz monitoring i potwierdzasz wydanie albo uruchamiasz powrót.

Akceptacja PR i uruchomienie wdrożenia to dwie decyzje: „ten kod przyjmuję” oraz „tę wersję publikuję teraz”. Gdy pracujesz sam, obie podejmujesz Ty. Należy ograniczyć bezpośrednie push do `main` i ustawić wymagane kontrole w zakresie dostępnym dla planu repozytorium.

GitHub Environments może zapewnić dodatkowe zatwierdzanie wdrożenia. Dostępność zależy od planu i widoczności repozytorium; nie zakładamy, że opcja jest dostępna w prywatnym repo. Alternatywą organizacyjną jest ręczny `workflow_dispatch` uruchamiany przez uprawnioną osobę po przyjęciu PR. Sam ręczny przycisk nie zastępuje ograniczeń dostępu. Dokumentacja: [środowiska i reguły wdrożeń GitHub](https://docs.github.com/en/actions/reference/workflows-and-actions/deployments-and-environments).

**Pilna zmiana po uruchomieniu dev:** obecny automatyczny deploy produkcji na push do `main` trzeba zastąpić powyższymi regułami. Samo dołożenie drugiego workflow bez zmiany starego nadal publikowałoby kod bez osobnej decyzji o wydaniu.

### 6. Co dokładnie przenosimy z dev na produkcję?

Przenosimy sprawdzone **wydanie aplikacji**, a nie testowe zamówienia ani całą bazę. Docelowo obraz Dockera budujemy raz, zapisujemy w rejestrze z niezmiennym identyfikatorem (digest) i uruchamiamy ten sam zestaw obrazów na dev oraz produkcji. Oddzielna konfiguracja środowiska dostarcza połączenia do właściwej bazy, sekrety i integracje.

W tym projekcie trzeba najpierw rozwiązać ważny szczegół: `NEXT_PUBLIC_*` w Next.js jest utrwalane podczas builda. Sam restart ze zmienną ENV nie zmieni wartości w przeglądarce. Obecne `/api/v1` pomaga korzystać z API pod tym samym adresem środowiska, ale pozostałe flagi `NEXT_PUBLIC_ENABLE_*` też należą do konkretnego builda. Dokumentacja: [zmienne środowiskowe Next.js 14](https://nextjs.org/docs/14/app/building-your-application/configuring/environment-variables).

Dlatego zapisujemy flagi razem z wydaniem i unikamy adresów dev utrwalonych w obrazie. Jeżeli produkcja musi mieć inny build, ten dokładny artefakt również trzeba przetestować przed publikacją. Aktualny model „najpierw nowy backend na produkcji, potem odczyt flag i build frontendu” nie jest jeszcze takim procesem i może pozostawić niepasujące wersje po błędzie. Docelowo budujemy i weryfikujemy komplet przed zmianą usług produkcyjnych. Przy promocji nie odczytujemy ponownie zmiennych flag z bieżącej bazy.

### 7. Jak cofnąć wersję, gdy coś pójdzie nie tak?

Wyobraź sobie, że działa `v1`, a po wdrożeniu `v2` przestaje działać zapis zamówienia. Rollback oznacza uruchomienie zachowanych obrazów frontendu i API z `v1` wraz ze zgodną konfiguracją. Nie polega na kasowaniu ostatnich danych klienta.

Przed każdym wdrożeniem zapisujemy: bieżące i poprzednie identyfikatory obrazów, konfigurację wydania bez ujawniania sekretów, wersję schematu bazy i migracje oraz dostępny backup bazy i uploadów. Obrazy pozostają dostępne przez ustalony okres; sprzątanie rejestru/dysku nie może usunąć ostatniej działającej wersji.

Procedura awaryjna do przygotowania i przećwiczenia:

1. Zatrzymaj kolejne wdrożenia. Ustal, czy problem dotyczy nowej funkcji, całego kodu, danych czy usługi zewnętrznej.
2. Jeśli to pojedyncza funkcja, wyłącz jej flagę dla objętej firmy, o ile to wystarczy i nie doszło do uszkodzenia danych.
3. Wybierz poprzednie zgodne wydanie z rejestru. Sprawdź zgodność ze schematem DB i działającymi zadaniami w tle.
4. Uruchom poprzedni zestaw obrazów, sprawdź zdrowie usług oraz logowanie, odczyt i zapis zamówienia, upload i izolację klientów.
5. Zapisz wynik i przygotuj poprawkę jako nowe wydanie. W Git można zrobić `revert`, aby odwrócenie błędu znalazło się też w historii kolejnych wydań. Sam `revert` bez push i wdrożenia nie zmienia działającej usługi.

**Baza danych wymaga osobnego planu.** Dodanie opcjonalnej kolumny zwykle łatwiej pogodzić ze starszym kodem niż jej usunięcie. Stosujemy stopniowe migracje: dodaj nowe pole → kod obsługujący okres przejściowy → przenieś dane → usuń stare pole dopiero po zakończeniu okresu możliwego rollbacku. Bez zgodności starszego kodu może być potrzebna poprawka naprzód albo kontrolowana przerwa.

Odtworzenie backupu to procedura odzyskiwania danych, nie zwykły rollback kodu. Backup z 10:00 nie zawiera zamówień z 10:15. Przed odtworzeniem trzeba zatrzymać zapisy, zabezpieczyć aktualny stan, ustalić skutki utraty zmian i spójność z uploadami. Test odbioru na dev: po aktualizacji utworzyć zamówienie, cofnąć kod i potwierdzić, że zamówienie nadal istnieje.

### 8. Czy mogę cofnąć tylko `decorum.opticut.pl`?

To zależy od sposobu uruchomienia aplikacji. Subdomena sama nie tworzy oddzielnej kopii kodu.

| Model | Funkcja tylko dla Decorum | Cofnięcie kodu tylko dla Decorum | Konsekwencja |
| --- | --- | --- | --- |
| Wspólny frontend i API dla wielu firm | Tak, przez flagi i autoryzację tenantów | Nie; zmiana wspólnego procesu dotyczy wszystkich | Mniej instancji do utrzymania, wspólna wersja kodu |
| Oddzielna instancja frontendu i API Decorum | Tak, z tego samego repozytorium | Tak, jeśli dane i migracje są zgodne | Więcej zasobów, monitoringu i konfiguracji |

Jeżeli niezależny rollback jest rzeczywistym wymaganiem, planujemy dla Decorum osobną instancję frontendu **i** API, routing Caddy, osobne zasoby oraz najlepiej osobną bazę/użytkownika DB i uploady. Instancje mogą działać na jednym VPS, ale nadal dzielą jego awarie i zasoby. Wspólna baza ze wspólnymi migracjami nadal może uniemożliwić użycie starszego kodu, nawet przy osobnych kontenerach. Pozostałe firmy pozostają na swoich obrazach; sprawdzamy to w próbie odbioru.

Nie potrzebujemy stałej gałęzi Git dla każdego klienta. Jedno repozytorium i numerowane wydania mogą obsługiwać wiele instancji z różnymi ustawieniami. Trzeba ustalić okres wspierania starszych wersji, aby klient nie pozostawał bez poprawek bezpieczeństwa.

### 9. Jak dodać wyjątkową funkcję tylko dla Decorum?

Na początek proponuję **flagę funkcji per tenant** oraz moduł w zwykłym kodzie repozytorium. Przykład przyszłej konfiguracji, a nie działający obecnie format:

```json
{
  "tenantId": "decorum",
  "features": { "dedicatedExport": true },
  "modules": { "orderExport": "decorum-export-v1" }
}
```

Inne firmy mają tę flagę wyłączoną. Backend ustala tenant na podstawie zatwierdzonego mapowania domeny i sprawdza członkostwo zalogowanego użytkownika. Nie ufa samemu `tenantId` z formularza, parametru URL ani dowolnemu nagłówkowi. Każdy odczyt/zapis danych, plików i cache musi zachowywać zakres firmy. Również bezpośrednie wywołanie API innej firmy ma zostać odrzucone.

Frontend pokazuje odpowiedni przycisk po pobraniu dozwolonych możliwości, a backend niezależnie kontroluje dostęp i wykonuje moduł z listy znanych implementacji. Flagę można wyłączyć bez cofania całej aplikacji. Zmiany ustawień rejestrujemy: kto, kiedy, dla jakiej firmy i co włączył. Testujemy również firmę bez funkcji, żeby wykryć przypadkowe udostępnienie.

**Obecne `Modules.IncludeInDeploy` nie zastępuje tego mechanizmu.** Określa, co trafia do obrazu. Jeśli jeden wspólny obraz ma obsłużyć Decorum, kod funkcji musi być w nim obecny, ale dostęp kontrolujemy osobno dla każdego tenanta w czasie działania API. Sekrety ani prywatne dane klienta nie trafiają do publicznego pakietu JavaScript.

### 10. A skrypt ze ścieżki w zmiennej i folder klienta na VPS?

Folder klienta jest dobrym miejscem na jego **dane, szablony i ustawienia**. Zmienna może wskazywać kontrolowany katalog konfiguracji. To jednak nie zapewnia izolacji wykonywanego kodu: skrypt załadowany do backendu dziedziczy jego dostęp do bazy, plików i sekretów.

Dlatego na start wybieramy znane ID modułu, np. `decorum-export-v1`, mapowane na sprawdzony kod w repozytorium. Nie przyjmujemy ścieżki do dowolnego `.js`/`.sh` z żądania, uploadu ani ustawienia edytowanego przez klienta. Nieznane ID jest odrzucane. Dzięki temu kod przechodzi testy na dev, ma wersję i można ustalić, co działało przed awarią. Ręczna poprawka pliku na VPS omija ten proces i komplikuje rollback.

Jeśli przyszła integracja rzeczywiście wymaga niezależnego programu, projektujemy osobną usługę/worker: wersjonowany obraz, wąskie API, własne ograniczone poświadczenia, limity czasu i zasobów, ograniczony dostęp do sieci i plików. Nie montujemy socketu Dockera ani katalogów innych firm. Sama ścieżka `TENANT_SCRIPT_PATH` i sam kontener nie zapewniają wszystkich tych ograniczeń. Wersję takiej usługi zapisujemy w konfiguracji wydania i obejmujemy monitoringiem oraz procedurą cofania.

### 11. Kolejność wdrożenia i warunki odbioru

Poniższe zadania pozostają **niezrealizowane**. Są też pokazane w skrócie na stronie jako osobny plan; nie zmieniają historycznych statusów 13 etapów.

- [ ] **Etap 12, najpierw:** wykonać backup DB i uploadów oraz przećwiczyć odtworzenie w odizolowanym miejscu. Ustalić dopuszczalną utratę danych i czas odzyskania.
- [ ] **Etapy 3, 5–8:** wybrać osobny VPS dev lub świadomie zaakceptować wspólne zasoby; utworzyć osobne kontenery, bazę, Redis, katalogi i sekrety. Potwierdzić, że zmiana danych/upload na dev nie zmienia produkcji.
- [ ] **Etap 10:** skonfigurować `dev.opticut.pl`, HTTPS i dostęp testerów. Sprawdzić routing frontend/API oraz oddzielenie sesji, OAuth i integracji testowych.
- [ ] **Etapy 4 i 9:** przygotować `develop`, kontrole PR i automat dev. Usunąć automatyczny deploy produkcji na push `main` w ramach przejścia na zatwierdzane wydania. Potwierdzić, że push na dev nie restartuje produkcji.
- [ ] **Etap 9:** budować i przechowywać obrazy, manifest wydania (SHA, digests, flagi, wersje migracji) oraz historię poprzednich wydań. Sprawdzić zgodność buildów Next.js i obecnego mechanizmu Modules.
- [ ] **Etapy 9 i 11:** dodać ręczną promocję konkretnego sprawdzonego wydania. Zweryfikować, że nowszy push nie podmienia wybranych obrazów. Sprawdzić logowanie, zapis/odczyt zamówienia, upload i używane integracje po wdrożeniu.
- [ ] **Etapy 9 i 12:** wykonać próbę rollbacku na dev wraz z migracjami i nowym zamówieniem. Potwierdzić zachowanie danych i dostępność poprzednich obrazów.
- [ ] **Etap 13:** zinwentaryzować obecną obsługę tenantów; dodać flagi i autoryzację firmy w API. Test: Decorum korzysta z funkcji, inna firma nie może użyć jej także przez bezpośrednie żądanie API.
- [ ] **Etapy 8 i 13:** ustalić, czy Decorum potrzebuje niezależnej wersji. Jeśli tak, przygotować osobną instancję i zgodne dane; w próbie cofnąć Decorum i potwierdzić, że wersje pozostałych firm się nie zmieniły.
- [ ] **Etapy 2, 12 i 13:** wybrać moduły z repozytorium; foldery tenantów przeznaczyć na dane i konfigurację. Jeśli potrzebna będzie usługa dedykowana, osobno zaprojektować jej uprawnienia, wersjonowanie i odzyskiwanie.

**Codzienna praca po wdrożeniu planu:** piszę zmianę → wysyłam do `develop` przez PR → testuję wydanie na dev → akceptuję kod do `main` → ręcznie publikuję wybrane wydanie → sprawdzam usługę. Funkcję klienta włączam flagą po jego testach. Przy problemie wyłączam funkcję albo uruchamiam poprzednie zgodne wydanie.
