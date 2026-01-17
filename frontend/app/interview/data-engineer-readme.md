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

## Tydzień 4: Python + S3 Podstawy (Integracja z aplikacją Volt)

Zadanie 1

Zbuduj Python pipeline do migracji danych komponentów elektrycznych z PostgreSQL do S3. Stwórz strukturę folderów: raw/components/, staging/components/, mart/components/.

Zadanie 2

Zaimplementuj migrację zdjęć komponentów z lokalnego storage (frontend/public/pictures/electricComponents/) do S3 bucket. Zachowaj nazewnictwo plików i dodaj metadane.

Zadanie 3

Stwórz system presigned URLs do bezpiecznego dostępu do zdjęć komponentów w S3. Zintegruj z istniejącym Node.js API Volt.



**Cel:** Zintegrowanie wszystkiego w działający end-to-end pipeline.

**Zadania:**
- [ ] **Pełny pipeline:** Postgres Volt + API → Pandas → Parquet → S3
- [ ] **Lambda trigger:** Automatyczna obróbka uploadów
- [ ] **Airflow orchestration:** DAG zarządzający całym procesem
- [ ] **Monitoring:** Logi, alerty, dashboard statusu

**Mini-projekt Volt:**
```
1. Pobierz nowe komponenty z Postgres Volt
2. Pobierz dodatkowe dane z API (np. ceny rynkowe)
3. Transformacja Pandas (oczyszczanie, agregacje)
4. Konwersja do Parquet
5. Upload do S3 z partycjonowaniem
6. Lambda walidacja i dodatkowe transformacje
7. Załadunek do analitycznej bazy danych
8. Monitoring i alerty
```

**Output:** Kompletny, produkcyjny pipeline dla aplikacji Volt!

---

## Implementacja - Szczegółowe instrukcje

### Dzień 1-2: Python + AWS S3 (boto3) - podstawy z Volt

**Cel:** Opanować boto3 i podstawowe operacje S3 używając danych z aplikacji Volt.

**Zadania:**
- [ ] **Instalacja boto3:** `pip install boto3`
- [ ] **Konfiguracja AWS:** `aws configure`, IAM role z uprawnieniami S3
- [ ] **Tworzenie bucketów:** Stwórz bucket `volt-data-lake`
- [ ] **Upload/download plików:** Prześlij przykładowe pliki CSV i zdjęcia z Volt
- [ ] **Presigned URLs:** Wygeneruj bezpieczne linki do zdjęć komponentów
- [ ] **Zarządzanie uprawnieniami:** Skonfiguruj IAM policies z least privilege

**Ćwiczenie praktyczne z Volt:**
```python
# Stwórz bucket → wgraj dane komponentów z PostgreSQL → pobierz je → usuń testowe pliki
from scripts.python.week4.volt_data_to_s3 import export_components_to_json, upload_components_to_s3
components = export_components_to_json()
upload_components_to_s3(components)
```

**Output:** Bucket S3 z przykładowymi danymi, działające presigned URLs.

---

### Dzień 3-4: Praca z danymi – CSV/JSON/Parquet + Volt

**Cel:** Nauczyć się transformacji danych używając rzeczywistych danych z aplikacji Volt.

**Zadania:**
- [ ] **Pandas basics:** `pip install pandas pyarrow`
- [ ] **Wczytywanie danych:** CSV/JSON z PostgreSQL Volt
- [ ] **Transformacje:** Czyszczenie, filtrowanie danych komponentów
- [ ] **Zapis Parquet:** Konwersja danych Volt do formatu Parquet
- [ ] **Upload do S3:** Przesyłanie przetworzonych danych

**Ćwiczenie z Volt:**
```python
# Pobierz dane komponentów z Postgres → Pandas → Parquet → S3
import pandas as pd
from scripts.python.week4.volt_data_to_s3 import get_postgres_connection

conn = get_postgres_connection()
df = pd.read_sql("SELECT * FROM electrical_components WHERE price > 0", conn)
df.to_parquet("volt_components.parquet")
# Upload do S3...
```

**Output:** Dane komponentów w formacie Parquet w S3, skrypt transformacji.

---

### Dzień 5: Eventy S3 + Lambda (Python) + Volt

**Cel:** Event-driven processing dla automatycznej obróbki danych z aplikacji Volt.

**Zadania:**
- [ ] **Lambda function:** Stwórz funkcję do konwersji CSV→Parquet
- [ ] **S3 events:** Skonfiguruj trigger na upload plików do S3
- [ ] **Testowanie lokalnie:** Użyj AWS SAM lub mocków boto3
- [ ] **Integracja z Volt:** Lambda wywołuje się przy uploadzie zdjęć

**Ćwiczenie z Volt:**
```python
# Upload zdjęcia komponentu → Lambda zmniejsza rozmiar → zapis do innego bucketu
# Użyj scripts/python/week5/lambda_csv_to_parquet.py jako template
```

**Output:** Lambda function reagująca na uploady plików z aplikacji Volt.

---

### Dzień 6-7: Integracja z API / Secrets Manager + Volt

**Cel:** Łączenie danych z aplikacji Volt z zewnętrznymi źródłami.

**Zadania:**
- [ ] **API Gateway:** REST API do pobierania danych
- [ ] **Secrets Manager:** Bezpieczne przechowywanie kluczy bazy danych
- [ ] **Łączenie danych:** API + PostgreSQL Volt + S3
- [ ] **Error handling:** Retry, timeout, logging błędów

**Ćwiczenie z Volt:**
```python
# Pobierz dane z zewnętrznego API → połącz z danymi komponentów → zapisz do S3 → log w Postgres
# Integracja z istniejącym Node.js API Volt
```

**Output:** Python API endpoints komunikujące się z aplikacją Volt.

---

## Tydzień 2: Pipeline'y i Airflow

---

### Tydzień 4: Python + S3 Podstawy - Implementacja

**Wymagania:**
- Python 3.8+
- AWS account z skonfigurowanym S3
- Dane połączenia do PostgreSQL (z tygodnia 2)
- Istniejąca aplikacja Volt (TypeScript/Node.js)

**Konfiguracja AWS:**
1. **Utwórz IAM User/Role** z uprawnieniami do S3:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:ListBucket",
        "s3:GetBucketLocation"
      ],
      "Resource": [
        "arn:aws:s3:::your-volt-bucket/*",
        "arn:aws:s3:::your-volt-bucket"
      ]
    }
  ]
}
```

2. **Skonfiguruj AWS credentials:**
```bash
aws configure
# lub użyj zmiennych środowiskowych
```

3. **Dodaj do .env:**
```env
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_DEFAULT_REGION=eu-central-1
S3_BUCKET_NAME=volt-data-lake
```

**Struktura projektu:**
```
scripts/python/week4/
├── s3_basics.py           # Podstawowe operacje S3
├── volt_data_to_s3.py     # Migracja danych z PostgreSQL do S3
├── volt_images_to_s3.py   # Migracja zdjęć do S3
├── presigned_urls.py      # Generator presigned URLs
├── requirements.txt       # Dodatkowe zależności
└── README.md              # Dokumentacja implementacji
```

**Kluczowe skrypty:**

1. **s3_basics.py** - podstawowe operacje:
```python
import boto3
import os
from dotenv import load_load

load_dotenv()

def get_s3_client():
    return boto3.client('s3',
        aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
        aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'),
        region_name=os.getenv('AWS_DEFAULT_REGION')
    )

def upload_file_to_s3(file_path, s3_key):
    s3 = get_s3_client()
    bucket = os.getenv('S3_BUCKET_NAME')

    with open(file_path, 'rb') as file:
        s3.put_object(
            Bucket=bucket,
            Key=s3_key,
            Body=file,
            Metadata={
                'uploaded_by': 'volt_app',
                'timestamp': str(datetime.now())
            }
        )
```

2. **volt_data_to_s3.py** - eksport danych z PostgreSQL do S3:
```python
import psycopg2
import json
import pandas as pd
from s3_basics import upload_file_to_s3

def export_components_to_s3():
    # Połącz z PostgreSQL
    conn = psycopg2.connect(
        host=os.getenv('POSTGRES_HOST'),
        database=os.getenv('POSTGRES_DB'),
        user=os.getenv('POSTGRES_USER'),
        password=os.getenv('POSTGRES_PASSWORD')
    )

    # Pobierz dane komponentów
    query = "SELECT * FROM electrical_components"
    df = pd.read_sql_query(query, conn)

    # Zapisz jako JSON do S3
    json_data = df.to_json(orient='records', date_format='iso')
    s3_key = f"raw/components/{datetime.now().strftime('%Y-%m-%d')}/components.json"

    # Upload do S3
    s3 = boto3.client('s3')
    s3.put_object(
        Bucket=os.getenv('S3_BUCKET_NAME'),
        Key=s3_key,
        Body=json_data,
        ContentType='application/json'
    )

    conn.close()
    return s3_key
```

3. **volt_images_to_s3.py** - migracja zdjęć:
```python
import os
import glob
from s3_basics import upload_file_to_s3

def migrate_images_to_s3():
    # Ścieżka do lokalnych zdjęć
    local_images_path = "../../frontend/public/pictures/electricComponents/*.jpg"

    uploaded_files = []

    for image_path in glob.glob(local_images_path):
        filename = os.path.basename(image_path)
        component_id = filename.split('.')[0]  # nazwa_pliku.jpg → nazwa_pliku

        # Struktura w S3: images/components/{component_id}/{filename}
        s3_key = f"images/components/{component_id}/{filename}"

        try:
            upload_file_to_s3(image_path, s3_key)
            uploaded_files.append({
                'component_id': component_id,
                's3_key': s3_key,
                'local_path': image_path
            })
        except Exception as e:
            print(f"Error uploading {filename}: {e}")

    return uploaded_files
```

**Uruchomienie:**
```bash
cd scripts/python/week4
python volt_data_to_s3.py    # Eksport danych do S3
python volt_images_to_s3.py  # Migracja zdjęć do S3
```

---

### Tydzień 5: Zaawansowane S3 + Pipeline'y - Implementacja

**Wymagania:**
- Wszystko z tygodnia 4
- AWS Lambda, Glue, CloudWatch
- Apache Airflow (lokalnie lub MWAA)

**Konfiguracja eventów S3:**

1. **Lambda function** do automatycznej konwersji CSV→Parquet:
```python
import boto3
import pandas as pd
import pyarrow as pa
import pyarrow.parquet as pq
from io import BytesIO

def lambda_handler(event, context):
    s3 = boto3.client('s3')

    # Pobierz informacje o pliku z eventu
    bucket = event['Records'][0]['s3']['bucket']['name']
    key = event['Records'][0]['s3']['object']['key']

    # Sprawdź czy to CSV w folderze raw
    if not (key.startswith('raw/') and key.endswith('.csv')):
        return

    # Pobierz plik CSV
    response = s3.get_object(Bucket=bucket, Key=key)
    csv_data = pd.read_csv(BytesIO(response['Body'].read()))

    # Konwertuj do Parquet
    buffer = BytesIO()
    table = pa.Table.from_pandas(csv_data)
    pq.write_table(table, buffer)

    # Zapisz w folderze staging jako Parquet
    parquet_key = key.replace('raw/', 'staging/').replace('.csv', '.parquet')
    s3.put_object(
        Bucket=bucket,
        Key=parquet_key,
        Body=buffer.getvalue()
    )

    return {
        'statusCode': 200,
        'body': f'Converted {key} to {parquet_key}'
    }
```

2. **Airflow DAG** dla end-to-end pipeline:
```python
from airflow import DAG
from airflow.operators.python import PythonOperator
from datetime import datetime, timedelta
import sys
import os

# Dodaj ścieżkę do własnych skryptów
sys.path.append('/opt/airflow/scripts')

from week4.volt_data_to_s3 import export_components_to_s3
from week5.glue_etl import run_glue_job

default_args = {
    'owner': 'volt_data_team',
    'depends_on_past': False,
    'start_date': datetime(2024, 1, 1),
    'email_on_failure': True,
    'email_on_retry': False,
    'retries': 1,
    'retry_delay': timedelta(minutes=5)
}

dag = DAG(
    'volt_data_pipeline',
    default_args=default_args,
    description='Volt data pipeline: PostgreSQL → S3 → Glue → Redshift',
    schedule_interval='@daily',
    catchup=False
)

extract_to_s3 = PythonOperator(
    task_id='extract_volt_data_to_s3',
    python_callable=export_components_to_s3,
    dag=dag
)

run_etl = PythonOperator(
    task_id='run_glue_etl_job',
    python_callable=run_glue_job,
    dag=dag
)

# Kolejność zadań
extract_to_s3 >> run_etl
```

**Konfiguracja Lifecycle Policies:**
```json
{
  "Rules": [
    {
      "ID": "Move raw data to Glacier after 30 days",
      "Status": "Enabled",
      "Prefix": "raw/",
      "Transitions": [
        {
          "Days": 30,
          "StorageClass": "GLACIER"
        }
      ]
    },
    {
      "ID": "Delete staging data after 7 days",
      "Status": "Enabled",
      "Prefix": "staging/",
      "Expiration": {
        "Days": 7
      }
    }
  ]
}
```

**Struktura projektu week5:**
```
scripts/python/week5/
├── lambda_csv_to_parquet.py    # Lambda function
├── glue_etl_job.py            # Glue ETL job
├── airflow_dag.py             # Airflow DAG
├── s3_lifecycle.py            # Skrypt do konfiguracji lifecycle
├── partitioning_utils.py      # Utilities do partycjonowania
└── README.md                  # Szczegółowa dokumentacja
```

**Uruchomienie:**
```bash
cd scripts/python/week5
python s3_lifecycle.py        # Skonfiguruj lifecycle policies
# Deploy Lambda przez AWS Console lub SAM
# Skonfiguruj Glue job przez AWS Console
# Uruchom Airflow DAG lokalnie lub w MWAA
```

---


### Dzień 8-9: Airflow + S3 + Volt

**Cel:** Orkiestracja pipeline'ów danych dla aplikacji Volt.

**Zadania:**
- [ ] **Instalacja Airflow:** `pip install apache-airflow`
- [ ] **Podstawy DAG:** Directed Acyclic Graphs
- [ ] **Operatorzy:** S3Hook, PythonOperator, PostgresOperator
- [ ] **Monitoring:** Logi, alerty, status zadań

**Ćwiczenie z Volt:**
```python
# DAG: Pobierz nowe komponenty z Postgres → transform Pandas → upload do S3
# Użyj danych z aplikacji Volt jako przykład
```

**Output:** Działaący DAG Airflow przetwarzający dane z Volt.

---

### Dzień 10-11: Redshift/Athena (opcjonalnie Postgres) + Volt

**Cel:** Analiza danych z S3 używając różnych narzędzi.

**Zadania:**
- [ ] **Schematy w Postgres:** Tabele analityczne dla danych Volt
- [ ] **COPY z S3:** Ładowanie danych Parquet do Postgres
- [ ] **Query danych:** Agregacje, JOIN z oryginalnymi danymi Volt
- [ ] **Athena:** Query bezpośrednio na S3 (bez kopiowania)

**Ćwiczenie z Volt:**
```python
# Z S3 wrzuć dane komponentów → Postgres → zapytanie o top komponenty → wynik do S3
# Połącz z istniejącą tabelą electrical_components
```

**Output:** Analityczna baza danych z danymi z aplikacji Volt.

---

### Dzień 12: Transformacje i automatyzacja + Volt

**Cel:** Zaawansowane transformacje danych z aplikacji Volt.

**Zadania:**
- [ ] **Pandas transformacje:** Zaawansowane operacje na danych
- [ ] **Walidacja danych:** Sprawdzenie poprawności danych Volt
- [ ] **Filtrowanie:** Usuwanie błędnych/duplikatów komponentów
- [ ] **Testowanie:** Unit tests dla funkcji transformacji

**Ćwiczenie z Volt:**
```python
# Walidacja danych komponentów: cena > 0, nazwa nie pusta, prawidłowe typy
# Transformacje: normalizacja nazw, kategorie, obliczone kolumny
```

**Output:** Czysty, przetworzony dataset z aplikacji Volt.

---

### Dzień 13: Monitoring i logowanie + Volt

**Cel:** Monitoring pipeline'ów przetwarzających dane z aplikacji Volt.

**Zadania:**
- [ ] **CloudWatch:** Logi dla Lambda i S3 (jeśli AWS)
- [ ] **Python logging:** Szczegółowe logi operacji
- [ ] **Airflow monitoring:** Status DAG, alerty błędów
- [ ] **Metrics:** Czas wykonania, liczba przetworzonych rekordów

**Ćwiczenie z Volt:**
```python
# Logowanie każdej operacji na danych komponentów
# Alert przy błędzie w pipeline Volt → S3
```

**Output:** Kompletny monitoring pipeline'ów Volt.

---

### Dzień 14: Mini-projekt końcowy - Pełny Pipeline Volt


### Przygotowanie środowiska dla wszystkich tygodni

**Wymagania:**
- Python 3.8+
- AWS account z dostępem do S3
- PostgreSQL z danymi aplikacji Volt
- Node.js aplikacja Volt (do testowania integracji)

**Instalacja zależności:**
```bash
cd scripts/python
pip install -r requirements.txt
# Dodatkowo dla pełnego programu:
pip install pandas pyarrow tenacity requests apache-airflow
```

**Konfiguracja AWS:**
```bash
aws configure
# Ustaw region, access key, secret key
```

**Zmienne środowiskowe (.env):**
```env
# AWS S3
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_DEFAULT_REGION=eu-central-1
S3_BUCKET_NAME=volt-data-lake

# PostgreSQL (z aplikacji Volt)
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=volt_db
POSTGRES_USER=volt_user
POSTGRES_PASSWORD=your_password
```

### Przydatne skrypty startowe:

**Test połączenia z S3:**
```python
from scripts.python.week4.s3_config import s3_config
s3_config.test_connection()
```

**Szybki upload danych z Volt:**
```python
from scripts.python.week4.volt_data_to_s3 import export_components_to_json, upload_components_to_s3
data = export_components_to_json()
upload_components_to_s3(data)
```

**Test presigned URL:**
```python
from scripts.python.week4.presigned_urls import generate_component_image_url
url_data = generate_component_image_url("123", expiration_hours=24)
print(url_data['presigned_url'])
```

### Setup Airflow (Dzień 8-9):

```bash
pip install apache-airflow
airflow db init
airflow users create --username admin --password admin --firstname Admin --lastname User --role Admin --email admin@example.com
```

**Podstawowy DAG dla Volt:**
```python
from airflow import DAG
from airflow.operators.python import PythonOperator
from datetime import datetime

from scripts.python.week4.volt_data_to_s3 import export_components_to_json, upload_components_to_s3

def volt_etl():
    data = export_components_to_json()
    return upload_components_to_s3(data)

dag = DAG('volt_data_pipeline', start_date=datetime(2024, 1, 1), schedule_interval='@daily')

etl_task = PythonOperator(
    task_id='extract_transform_load',
    python_callable=volt_etl,
    dag=dag
)
```

---

**Wskazówka:** Każdego dnia oznaczaj wykonane zadania ✓ i zapisuj notatki z problemami/rozwiązaniami. Na koniec dnia zrób krótkie podsumowanie tego, czego się nauczyłeś. To będzie świetna dokumentacja Twojej nauki!
