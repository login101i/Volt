export type MigrationStatus = 'ready' | 'todo' | 'blocker';

export type MigrationTask = {
  id: string;
  label: string;
};

export type MigrationStep = {
  id: string;
  number: string;
  title: string;
  status: MigrationStatus;
  goal: string;
  why: string;
  without: string;
  tasks: MigrationTask[];
  blocks: { title: string; code: string }[];
};

export const STATUS_LABEL: Record<MigrationStatus, string> = {
  ready: 'Masz to',
  todo: 'Do zrobienia',
  blocker: 'Blokuje start',
};

export const MIGRATION_STEPS: MigrationStep[] = [
  {
    id: 'gap',
    number: '0',
    title: 'Nie odpalaj plików Opticut',
    status: 'blocker',
    goal: 'Zrozumieć, że docker-compose.yml i workflow w tym repo nie wdrożą Volta.',
    why: 'Te pliki zostały skopiowane z działającego Opticut. Wskazują /opt/opticut, port 8000, Redis, /api/v1 i health www.opticut.pl. Volt to inna aplikacja: Next na 3000, Express na 5000, API pod /api, health pod /health. W repo nie ma Dockerfile.frontend ani Dockerfile.server.',
    without: 'Push na main uruchomiłby zły skrypt (albo padł), a na serwerze Opticut nadpisałby cudzy katalog. Domena elektrykpoznan.online dalej wskazywałaby hosting Cyber Folks.',
    tasks: [
      { id: 'gap-compose', label: 'Traktuj docker-compose.yml jako wzorzec Opticut, nie jako plik Volta' },
      { id: 'gap-gha', label: 'Nie ustawiaj sekretów Hetzner pod obecny deploy-hetzner.yml' },
      { id: 'gap-dockerfiles', label: 'Zaplanuj własne Dockerfile + compose + workflow (kroki 4 i 10)' },
    ],
    blocks: [
      {
        title: 'Co jest w plikach dziś (Opticut)',
        code: `frontend  127.0.0.1:3000   NEXT_PUBLIC_API_URL=/api/v1
server    127.0.0.1:8000   health /api/v1/health
katalog   /opt/opticut
domena    https://www.opticut.pl`,
      },
      {
        title: 'Czego potrzebuje Volt',
        code: `frontend  127.0.0.1:3000   NEXT_PUBLIC_API_URL=https://elektrykpoznan.online
server    127.0.0.1:5000   health /health
katalog   /opt/volt
domena    https://elektrykpoznan.online`,
      },
    ],
  },
  {
    id: 'vps',
    number: '1',
    title: 'VPS — osobna maszyna',
    status: 'todo',
    goal: 'Mieć serwer, na który wskazuje domena. Opticut zostaje nietknięty.',
    why: 'Na Hetznerze Opticut już słucha 127.0.0.1:3000 i :8000 oraz ma własny Caddy i deploy. Druga aplikacja na tym samym porcie się nie zmieści. Osobny, mniejszy VPS (np. CX22: 2 vCPU, 4 GB RAM) kopiuje sprawdzony układ i nie wywraca opticut.pl przy przebudowie obrazów.',
    without: 'Albo Volt nie wstanie (port zajęty), albo deploy jednej aplikacji zrestartuje drugą.',
    tasks: [
      { id: 'vps-account', label: 'Konto Hetzner — to samo co przy Opticut' },
      { id: 'vps-create', label: 'Nowy serwer, np. volt-prod-01, Ubuntu LTS, lokalizacja Niemcy' },
      { id: 'vps-ip', label: 'Zapisz IPv4 — to będzie rekord A domeny' },
      { id: 'vps-ssh', label: 'Wejście: ssh root@IP, potem użytkownik bez roota (jak maciej na Opticut)' },
    ],
    blocks: [
      {
        title: 'Ten sam VPS co Opticut — tylko gdy świadomie zmienisz porty',
        code: `Opticut zostaje:  127.0.0.1:3000 i :8000
Volt wtedy:       127.0.0.1:3100 (Next) i :5000 (Express)
Caddy rozróżnia strony po nazwie hosta, nie po porcie publicznym.`,
      },
    ],
  },
  {
    id: 'secure',
    number: '2',
    title: 'Bezpieczeństwo serwera',
    status: 'todo',
    goal: 'Zamknąć serwer zanim wstawisz aplikację. Ten sam schemat co etap 2 Opticut.',
    why: 'Świeży VPS ma otwartego roota i hasło z maila. Boty zgadują SSH w ciągu minut. Najpierw dom, potem meble.',
    without: 'Ktoś wejdzie na serwer, zanim postawisz Dockera.',
    tasks: [
      { id: 'sec-user', label: 'Użytkownik z sudo, klucz SSH, wyłączone logowanie hasłem i rootem' },
      { id: 'sec-ufw', label: 'UFW: zezwól 22, 80, 443. Porty 3000 i 5000 zostają tylko na 127.0.0.1' },
      { id: 'sec-fw', label: 'Firewall w panelu Hetzner: to samo (22/80/443)' },
      { id: 'sec-f2b', label: 'Fail2Ban na sshd + unattended-upgrades' },
    ],
    blocks: [],
  },
  {
    id: 'docker-git',
    number: '3',
    title: 'Docker i klon repo',
    status: 'todo',
    goal: 'Serwer umie budować kontenery i ściąga kod z GitHuba do /opt/volt.',
    why: 'Docker daje ten sam układ co na Opticut: przebudowa obrazu zamiast ręcznego npm na hoście. Osobny katalog oznacza, że git reset Volta nie rusza /opt/opticut.',
    without: 'Nie ma z czego zbudować aplikacji i każdy deploy miesza się z drugim projektem.',
    tasks: [
      { id: 'dg-docker', label: 'Docker Engine + plugin Compose' },
      { id: 'dg-key', label: 'Deploy key GitHub (osobny klucz, tylko to repo, read-only)' },
      { id: 'dg-clone', label: 'Klon do /opt/volt, gałąź main' },
    ],
    blocks: [
      {
        title: 'Katalog',
        code: `sudo mkdir -p /opt/volt /opt/volt-data
sudo chown "$USER":"$USER" /opt/volt /opt/volt-data
git clone git@github.com:<twoje-repo>.git /opt/volt`,
      },
    ],
  },
  {
    id: 'images',
    number: '4',
    title: 'Obrazy Docker pod Volt',
    status: 'blocker',
    goal: 'Napisać Dockerfile frontu, Dockerfile serwera i compose, które w ogóle budują tę aplikację.',
    why: 'Compose w repo woła pliki, których nie ma, i podnosi Redis oraz port 8000. Volt nie używa Redisa. Oferty żyją w pliku JSON, katalog komponentów w MariaDB.',
    without: 'docker compose build zakończy się błędem „Dockerfile not found” albo wstanie zła aplikacja.',
    tasks: [
      { id: 'img-fe', label: 'frontend/Dockerfile — Next standalone, ARG NEXT_PUBLIC_API_URL' },
      { id: 'img-be', label: 'server/Dockerfile — node, PORT 5000, health /health' },
      { id: 'img-compose', label: 'Nowy compose: porty tylko 127.0.0.1, bez Redisa, env_file server/.env' },
      { id: 'img-build', label: 'Na VPS: docker compose build && docker compose up -d' },
    ],
    blocks: [
      {
        title: 'Docelowe porty (osobny VPS)',
        code: `frontend:
  ports: ["127.0.0.1:3000:3000"]
  build args:
    NEXT_PUBLIC_API_URL: https://elektrykpoznan.online
server:
  ports: ["127.0.0.1:5000:5000"]
  env_file: ./server/.env
  volumes:
    - /opt/volt-data:/app/data`,
      },
    ],
  },
  {
    id: 'env',
    number: '5',
    title: 'Sekrety tylko na serwerze',
    status: 'todo',
    goal: 'Położyć server/.env w /opt/volt i nie commitować go.',
    why: 'Hasło MySQL i adres frontu czytane są przy starcie Expressa. Plik .env jest w gitignore — po git clone go nie będzie. To zamierzone.',
    without: 'Kontener wstanie bez hasła, katalog komponentów zwróci błąd, a przeglądarka dostanie blokadę CORS.',
    tasks: [
      { id: 'env-file', label: 'Utwórz /opt/volt/server/.env i chmod 600' },
      { id: 'env-cors', label: 'FRONTEND_URL i PRODUCTION_FRONTEND_URL = https://elektrykpoznan.online' },
      { id: 'env-mysql', label: 'MYSQL_* jak lokalnie: host s78.cyber-folks.pl, baza lxsxnvawhg_volt' },
      { id: 'env-port', label: 'PORT=5000 i HOST=0.0.0.0 (w kontenerze, nie na publicznym interfejsie hosta)' },
    ],
    blocks: [
      {
        title: 'Klucze (wartości uzupełnij na serwerze)',
        code: `PORT=5000
HOST=0.0.0.0
NODE_ENV=production
FRONTEND_URL=https://elektrykpoznan.online
PRODUCTION_FRONTEND_URL=https://elektrykpoznan.online
MYSQL_HOST=s78.cyber-folks.pl
MYSQL_PORT=3306
MYSQL_DATABASE=lxsxnvawhg_volt
MYSQL_USER=lxsxnvawhg_volt
MYSQL_PASSWORD=...`,
      },
    ],
  },
  {
    id: 'db',
    number: '6',
    title: 'Baza — na start zostaje w Cyber Folks',
    status: 'ready',
    goal: 'Aplikacja na VPS czyta electric_components i fuse_types z istniejącej MariaDB. Przenoszenie MySQL na Hetzner to osobny etap, tak jak u Opticut.',
    why: 'Tabele już są (albo właśnie je zakładasz seedem). Strona może działać w internecie, zanim nauczysz się dump/restore. Oferty i tak nie siedzą w SQL — są w offers.json.',
    without: 'Kalkulacja nie zobaczy komponentów i bezpieczników. Reszta API ofert nadal działa na pliku.',
    tasks: [
      { id: 'db-remote', label: 'W panelu Cyber Folks włącz zdalny MySQL i dopisz IP nowego VPS' },
      { id: 'db-port', label: 'Z internetu port to ten z .env (3306). 3308 jest tylko gdy aplikacja stoi na samym hostingu CF' },
      { id: 'db-seed', label: 'Seed ze zdjęć: server/sql/seed_from_images.sql już puszczony w phpMyAdmin' },
      { id: 'db-later', label: 'Później: kontener MySQL na VPS + dump. Nie rób tego w dniu przełączenia domeny' },
    ],
    blocks: [],
  },
  {
    id: 'data',
    number: '7',
    title: 'Oferty i katalog kalkulatora',
    status: 'todo',
    goal: 'Przetrwać restart kontenera: offers.json i electricalComponents.js leżą poza obrazem.',
    why: 'server/data/ jest w gitignore. Obraz Dockera go nie zawiera. Bez wolumenu pierwsza oferta zniknie przy kolejnym docker compose up --build. Kalkulator oferty importuje electricalComponents.js — bez tego pliku tworzenie oferty pada.',
    without: 'Strona się otwiera, ale zapis oferty ginie albo createOffer zwraca błąd importu.',
    tasks: [
      { id: 'data-vol', label: 'Wolumen /opt/volt-data zamontowany jako dane serwera' },
      { id: 'data-offers', label: 'Pusty offers.json albo kopia z komputera' },
      { id: 'data-calc', label: 'Wgraj electricalComponents.js (nie ma go w git)' },
      { id: 'data-img', label: 'Zdjęcia z frontend/public wpadają do obrazu Next. Nowe uploady lokalne potrzebują wolumenu albo S3' },
    ],
    blocks: [],
  },
  {
    id: 'caddy',
    number: '8',
    title: 'Caddy — HTTPS i podział ruchu',
    status: 'todo',
    goal: 'Świat widzi tylko 443. Next i Express słuchają localhost.',
    why: 'Tak działa opticut.pl: Caddy bierze certyfikat Let’s Encrypt i rozdziela ścieżki. U Volta jest haczyk, którego Opticut nie miał: /api/media i /api/proxy należą do Nexta (podpis S3), a /api/orders, /api/offers, /api/components do Expressa. Kolejność reguł ma znaczenie — media musi być przed ogólnym /api.',
    without: 'Albo brak kłódki, albo upload zdjęć trafia w Express i zwraca 404, albo cała strona idzie w API.',
    tasks: [
      { id: 'caddy-install', label: 'Caddy jako usługa systemu (nie w compose aplikacji)' },
      { id: 'caddy-site', label: 'Blok elektrykpoznan.online oraz www' },
      { id: 'caddy-order', label: 'Najpierw /api/media i /api/proxy → Next, potem /api i /health → Express' },
      { id: 'caddy-reload', label: 'caddy validate && systemctl reload caddy' },
    ],
    blocks: [
      {
        title: 'Caddyfile',
        code: `elektrykpoznan.online, www.elektrykpoznan.online {
	encode gzip
	handle /api/media* {
		reverse_proxy 127.0.0.1:3000
	}
	handle /api/proxy* {
		reverse_proxy 127.0.0.1:3000
	}
	handle /api/* {
		reverse_proxy 127.0.0.1:5000
	}
	handle /health {
		reverse_proxy 127.0.0.1:5000
	}
	handle {
		reverse_proxy 127.0.0.1:3000
	}
}`,
      },
    ],
  },
  {
    id: 'dns',
    number: '9',
    title: 'Domena elektrykpoznan.online',
    status: 'todo',
    goal: 'Rekord A w Cyber Folks wskazuje IP VPS. Poczta, jeśli jest, zostaje.',
    why: 'Domena już istnieje na Cyber Folks. Przenosisz tylko ruch WWW, tak jak opticut.pl: sklep (strona) na Hetzner, skrzynka zostaje u rejestratora. Caddy dostanie certyfikat dopiero, gdy DNS już widzi nowy adres — inaczej Let’s Encrypt nie dojdzie na port 80.',
    without: 'https://elektrykpoznan.online dalej otwiera stary hosting albo wisi na propagacji, a certyfikat się nie wystawi.',
    tasks: [
      { id: 'dns-a', label: 'Rekord A dla @ (sama domena) → IPv4 VPS' },
      { id: 'dns-www', label: 'Rekord A dla www → ten sam IP' },
      { id: 'dns-mx', label: 'Nie zmieniaj MX, SPF i poczty' },
      { id: 'dns-wait', label: 'Sprawdź: nslookup elektrykpoznan.online — ma pokazać IP VPS' },
      { id: 'dns-both', label: 'Jeśli używasz www, dopisz ten origin do CORS na serwerze' },
    ],
    blocks: [
      {
        title: 'Panel DNS Cyber Folks',
        code: `A     @     <IPv4 VPS>     TTL 300 na czas zmiany
A     www   <IPv4 VPS>
MX    ...   zostaw jak jest`,
      },
    ],
  },
  {
    id: 'actions',
    number: '10',
    title: 'GitHub Actions — push wdraża Volta',
    status: 'blocker',
    goal: 'Nowy workflow: SSH, katalog /opt/volt, build, health Volta.',
    why: 'Obecny deploy-hetzner.yml po pushu na main robi git reset w /opt/opticut i sprawdza https://www.opticut.pl/api/v1/health. Sekrety HETZNER_HOST, HETZNER_USER, HETZNER_SSH_KEY mogą być te same tylko wtedy, gdy to ten sam serwer — skrypt i tak musi iść do /opt/volt.',
    without: 'Każdy push albo psuje Opticut, albo nic nie wdraża, i produkcja rozjeżdża się z gitem.',
    tasks: [
      { id: 'gha-file', label: 'Osobny workflow (nie doklejaj kroków Opticut: Redis, moduły, /api/v1)' },
      { id: 'gha-secrets', label: 'Sekrety: host, user, klucz SSH nowego VPS' },
      { id: 'gha-health', label: 'Smoke: curl 127.0.0.1:5000/health oraz https://elektrykpoznan.online' },
      { id: 'gha-manual', label: 'Zostaw workflow_dispatch, żeby wdrożyć bez pustego commita' },
    ],
    blocks: [
      {
        title: 'Szkielet skryptu na serwerze',
        code: `cd /opt/volt
git fetch origin main
git reset --hard origin/main
docker compose build
docker compose up -d
curl -fI http://127.0.0.1:5000/health
curl -fI http://127.0.0.1:3000
curl -fI https://elektrykpoznan.online
curl -fI https://elektrykpoznan.online/health`,
      },
    ],
  },
  {
    id: 'prove',
    number: '11',
    title: 'Dowód, że strona żyje',
    status: 'todo',
    goal: 'Przejść aplikację na domenie tak, jak zrobiłby to klient.',
    why: 'Zielony kontener nie znaczy, że oferta się zapisuje. Trzeba przejść ścieżkę, która rusza Next, Express, bazę i plik JSON.',
    without: 'DNS wygląda dobrze, a kalkulacja albo zapis oferty pada po cichu.',
    tasks: [
      { id: 'prove-home', label: 'https://elektrykpoznan.online otwiera hub Volt' },
      { id: 'prove-health', label: 'https://elektrykpoznan.online/health zwraca OK' },
      { id: 'prove-components', label: 'Kalkulacja ładuje komponenty z MariaDB (zdjęcia z /pictures/...)' },
      { id: 'prove-offer', label: 'Nowa oferta zapisuje się i widać ją na liście po odświeżeniu' },
      { id: 'prove-cors', label: 'W konsoli przeglądarki brak błędów CORS i mixed content' },
    ],
    blocks: [],
  },
  {
    id: 'keep',
    number: '12',
    title: 'Backup i monitoring',
    status: 'todo',
    goal: 'Wiedzieć, że strona padła, i mieć z czego ją podnieść. U Opticut monitoring jest, backup jeszcze nie — tu zrób oba, bo oferty to jeden plik.',
    why: 'Awaria dysku albo zły deploy kasuje /opt/volt-data. Uptime Kuma (masz go przy Opticut) może dostać drugi check na elektrykpoznan.online i /health, bez wystawiania Grafany w internet.',
    without: 'Dowiadujesz się od klienta. Ofert nie ma z czego odtworzyć.',
    tasks: [
      { id: 'keep-json', label: 'Codzienny tar /opt/volt-data (offers.json + katalog kalkulatora)' },
      { id: 'keep-sql', label: 'Dump MariaDB z Cyber Folks (dopóki baza tam stoi)' },
      { id: 'keep-kuma', label: 'Check HTTPS strony i /health, alert tam gdzie Opticut (Discord)' },
      { id: 'keep-prune', label: 'Co jakiś czas docker builder prune — buildy Next zjadają dysk' },
    ],
    blocks: [],
  },
];
