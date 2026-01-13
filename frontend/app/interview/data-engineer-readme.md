# Data Engineer Roadmap Volt – praktyka na podstawie roadmapy (Node.js, Next.js API, Python)

## Cel projektu
Volt ewoluuje w realny projekt data engineeringowy – nie tylko teoria, ale wdrożenia hands-on! Stack: Node.js/Next.js API + Python + AWS.

---

## Tydzień 1: AWS & Architektura
Cel: rozumiesz, co gdzie stoi i dlaczego 

**Checklist:**
- [x] **VPC:** Izoluj zasoby AWS własną, prywatną siecią (stwórz VPC przez konsolę, Terraform lub AWS CLI). 
- [x] **public / private subnet:** Utwórz subnety i połącz je z VPC – backend w prywatnych, LB/API w publicznych (high-availability!).
- [x] **security groups:** Ustaw reguły dostępu: tylko niezbędne porty, backend/API – tylko swoje grupy/security references! 
- [x] **EC2 public + private:** Postaw EC2 (public jako bastion, prywatne pod backend/Python/ETL). 
- [x] **RDS (Postgres):** Postaw bazę (tylko w prywatnym subnetcie!) i połącz z Next.js API lub Python workerem, nie otwieraj do świata. 
- [x] **Route53:** Obsłuż routing domen (np. pod API, LB, backend, dev/prod środowiska). Testuj różne typy rekordów. 
- [x] **Reverse proxy (Caddy/Nginx):** Zarządzaj SSL, rozdziel ruchem do usług (np. /api → backend, /airflow → Airflow UI) na jednej maszynie/instancji. 

**Output:**
- diagram architektury (np. draw.io)
- README czemu tak (decyzje architektoniczne)

---

## Tydzień 2: SQL & Model Danych
Cel: myślisz jak Data Engineer, nie jak "SELECT *"

**Checklist:**
- [x] **Postgres / Redshift basics:** Postaw bazę, skonfiguruj połączenie z aplikacją, wykonaj inspekcję bazowych operacji CRUD przez Node/Python.
  - ✅ Utworzono skrypt Python: `scripts/python/postgres_crud.py`
  - ✅ Zobacz instrukcje poniżej w sekcji "Postgres / Redshift basics - Implementacja"
- [ ] **CTE:** Napisać kilka zapytań z CTE (`WITH`), oswoić się z refaktoryzacją zagnieżdżonych SELECTów.
- [ ] **window functions:** Zrób query z oknem (np. ranking, sumy ruchome) – przydatne w raportach!
- [ ] **indexing (teoria + praktyka):** Dodaj indeksy do tabel (po kluczach), sprawdź wydajność.
- [ ] **schema bazy: raw tables, staging, marts:** Zaprojektuj model warstwowy (surowe/staging/analityczne tabele); możesz podzielić schemat na pliki SQL/dbt.

## 🎯 Podsumowanie: Architektura Warstwowa Danych (Raw → Staging → Marts)

### Dlaczego w ogóle tworzymy warstwy?

**Cel: podział danych na różne poziomy "dojrzałości" i kontroli jakości.**

- **Raw (surowe)** – pełne kopie danych z systemu źródłowego, bez zmian.
  - Audyt, odzyskiwanie, powtarzalność ETL.
  - Można trzymać w dowolnym formacie (JSONB, CSV, logi).

- **Staging (przygotowane)** – dane już oczyszczone i ustrukturyzowane.
  - Casty typów, brak nulli w kluczowych kolumnach, standaryzacja.
  - Nadal blisko źródła, ale już można robić transformacje.

- **Msarts (analityczne / raportowe)** – dane gotowe do raportowania i analizy.
  - Agregacje, denormalizacja, obliczone kolumny (np. total_orders w naszym users_mart).
  - Tu zakłada się wysoką wydajność zapytań – indeksy, materializacje, partycje.

**Podsumowując:** każda warstwa daje kontrolę nad transformacją danych i ułatwia debugowanie: jeśli raport jest błędny, możesz sprawdzić raw → staging → mart krok po kroku.

### 2️⃣ Co możemy robić na każdej warstwie

| Warstwa | Co robimy | Przykłady |
|---------|-----------|-----------|
| **Raw** | Archiwizacja, audyt | Trzymanie JSONów z API, pełnych dumpów, logów. |
| **Staging** | Czyszczenie, typy, walidacja | CAST JSON → kolumny, usunięcie duplikatów, normalizacja nazw. |
| **Marts** | Analiza, raporty, agregacje | Liczenie sum, ranking użytkowników, ostatnie zamówienie, liczba zamówień, widoki do BI. |

### 3️⃣ Korzyści z takiego podejścia

- **Bezpieczeństwo i audyt** – surowe dane pozostają nienaruszone.
- **Łatwość debugowania** – jeśli coś jest źle w raporcie, sprawdzasz krok po kroku: raw → staging → mart.
- **Skalowalność** – w miarę rozrostu danych, możesz przetwarzać tylko staging/marts zamiast od nowa całych danych.
- **Przygotowanie pod ETL / ELT / BI** – warstwy idealnie współgrają z narzędziami typu dbt, Airflow, Looker, Power BI.
- **Wydajność** – w marts możesz dodawać indeksy, partycje, materializowane widoki, żeby raporty działały szybko.

### 4️⃣ Przykłady pytań rekrutacyjnych i co odpowiedzieć

**"Dlaczego używamy warstw raw → staging → marts?"**
→ Bo chcemy mieć kontrolę nad transformacją danych, łatwo debugować, trzymać surowe kopie dla audytu i mieć wydajne tabele do raportów.

**"Co przechowujemy w każdej warstwie?"**
- Raw → nienaruszone dane z systemu źródłowego (JSON, CSV, logi).
- Staging → dane oczyszczone, znormalizowane, gotowe do transformacji.
- Marts → dane agregowane i denormalizowane, przygotowane do raportów i analizy.

**"Czy raw i staging muszą być w osobnych schematach?"**
→ Nie, to kwestia organizacyjna. Schematy pomagają w separacji i bezpieczeństwie, ale można trzymać wszystkie tabele w public.

**"Co możesz zrobić w marts, czego nie robisz w raw?"**
→ Agregacje, ranking użytkowników (ROW_NUMBER()), sumy zamówień, materializowane widoki, indeksy pod raporty.

**"Jakie problemy rozwiązują mart tables?"**
→ Wydajność zapytań analitycznych, przygotowanie danych do BI, spójność danych po transformacjach.

### 5️⃣ Dodatkowe tipy do rozmowy

- Warto wspomnieć o dbt – świetne narzędzie do warstwowania:
  - Raw → source
  - Staging → stg_ modele
  - Mart → fct_, dim_ modele

- Możesz wspomnieć o incremental loads: w raw wrzucamy wszystko, w staging i marts tylko nowe dane.

- Materialized views w marts → przyspieszają raporty i można je odświeżać co np. godzinę.

**Output:**
- schema bazy: raw tables, staging, marts (np. w formie pliku .sql lub diagramu)

### Postgres / Redshift basics - Implementacja

**Wymagania:**
- Python 3.8+
- PostgreSQL na AWS RDS (lub lokalnie)
- Dane połączenia do bazy danych

**Kroki:**

1. **Instalacja zależności Python:**
```bash
cd scripts/python
pip install -r requirements.txt
```

2. **Konfiguracja połączenia:**
   
   Utwórz plik `.env` w głównym katalogu projektu z danymi połączenia:
```env
POSTGRES_HOST=your-rds-endpoint.xxxxx.eu-central-1.rds.amazonaws.com
POSTGRES_PORT=5432
POSTGRES_DB=postgres
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_secure_password
```

   **Gdzie znaleźć dane połączenia RDS:**
   - AWS Console → RDS → Databases → wybierz swoją bazę
   - Endpoint (host): `your-db-name.xxxxx.region.rds.amazonaws.com`
   - Port: domyślnie 5432 dla PostgreSQL
   - Database name: nazwa bazy (np. `postgres`)
   - Master username: użytkownik główny
   - Password: hasło ustawione przy tworzeniu

3. **Uruchomienie skryptu CRUD:**
```bash
# Z głównego katalogu projektu
python scripts/python/postgres_crud.py
```

**Co robi skrypt:**
- ✅ **CREATE:** Tworzy tabelę testową `volt_test_users`
- ✅ **INSERT:** Wstawia przykładowe dane użytkowników
- ✅ **SELECT:** Odczytuje wszystkie rekordy i pokazuje wyniki
- ✅ **UPDATE:** Aktualizuje wybrany rekord
- ✅ **DELETE:** Usuwa przykładowy rekord
- ✅ Pokazuje wyniki każdej operacji w konsoli

**Struktura skryptu:**
```
scripts/python/
├── postgres_crud.py      # Główny skrypt z operacjami CRUD
└── requirements.txt      # Zależności Python (psycopg2-binary, python-dotenv)
```

**Bezpieczeństwo:**
- Użyj `.env` dla danych połączenia (nie commituj `.env` do git!)
- `.env` jest już w `.gitignore`
- Skrypt używa parametrówzowanych zapytań (zapobiega SQL injection)

**Rozszerzenia (opcjonalne):**
- Dodaj więcej operacji (JOIN, GROUP BY, agregacje)
- Połącz z Node.js API (dodaj endpoint do server/routes)
- Stwórz bardziej złożone zapytania z CTE i window functions

---

## Tydzień 3: S3 jako Data Lake
Cel: separacja storage vs compute

**Checklist:**
- [ ] **bucket: raw/, staging/, mart/:** Stwórz strukturę folderów w S3 (raw, staging, mart) pod różne etapy przetwarzania danych.
- [ ] **format: CSV → Parquet:** Dodaj w projekcie migrację plików CSV → Parquet (np. przez Pandas/Python) – przetestuj upload i odczyt Parquet.
- [ ] **S3 lifecycle policies:** Dodaj polityki automatycznego czyszczenia/przenoszenia danych (np. raw po 30 dniach → Glacier, staging → kasowanie po tygodniu).
- [ ] **partycjonowanie:** Dodaj partycjonowanie po dacie (dt=YYYY-MM-DD) w strukturze folderów.
- [ ] **integracja:** Pokaż jak dane płyną z S3 do Postgres marts.

**Output:**
- dane lądują w S3, README "data lake layout"
- partycjonowanie zaimplementowane
- lifecycle policies skonfigurowane
- przykładowy kod konwersji CSV→Parquet

---

Zadanie 1

Zbuduj data lake w S3 z podziałem na raw/staging/mart dla danych użytkowników.

Zadanie 2

Dodaj partycjonowanie po dacie i pokaż, dlaczego to poprawia wydajność.

Zadanie 3

Zaimplementuj lifecycle policy i opisz decyzje kosztowe w README.

## Tydzień 4: Python ETL (bez Airflow)
Cel: czysty, testowalny ETL

**Checklist:**
- [ ] **Python: requests:** Pobranie danych z wybranego API do Pythona.
- [ ] **retry:** Zaimplementuj retry (np. z biblioteką `tenacity`), niech ETL radzi sobie z awariami sieci.
- [ ] **pagination:** Obsługa API ze stronicowaniem.
- [ ] **auth:** Obsługa API z autoryzacją/tokenami.
- [ ] **rate limits:** Zaimplementuj sleep/throttle na api i loguj nadmiarowe wywołania.
- [ ] **ETL: API → S3:** Zbuduj mini-task, który pobierze dane i zapisze je jako plik do S3 (możesz użyć boto3 lub SDK AWS).
- [ ] **logi:** Każdy krok pipeline powinien mieć logi (console/log file).
- [ ] **obsługa błędów:** ETL musi obsłużyć błędy z API/sieci – testuj! 

**Output:**
- repo folder `etl/`, README + diagram przepływu danych

---

**Wskazówka:** utrzymuj checklistę i podsumowania tydzień po tygodniu; kopiuj praktyczne notatki do wybranego folderu/projektu. Każde zadanie odhaczane = realny progres z praktycznej roadmapy!
