# Week 2: SQL & Model Danych

Ten folder zawiera zadania z **Tygodnia 2** roadmapy Data Engineer w projekcie Volt.

## Zawartość folderu

### Pliki główne:
- `postgres_crud.py` - Podstawowe operacje CRUD na PostgreSQL
- `create_volt_schema.py` - Tworzenie schematu bazy danych dla aplikacji Volt
- `migrate_volt_data.py` - Migracja danych między systemami

## Zadania z Tygodnia 2

Na podstawie [data-engineer-readme.md](../../frontend/app/interview/data-engineer-readme.md):

### ✅ Zaimplementowane:
- **Postgres / Redshift basics** - `postgres_crud.py`
  - Operacje CREATE, INSERT, SELECT, UPDATE, DELETE
  - Połączenie z bazą PostgreSQL na AWS RDS
  - Parametryzowane zapytania dla bezpieczeństwa

### 🔄 Do zaimplementowania:
- **CTE (Common Table Expressions)** - Zapytania z `WITH`
- **Window functions** - Funkcje okna (ranking, sumy ruchome)
- **Indexing** - Optymalizacja wydajności zapytań
- **Schema bazy: raw tables, staging, marts** - Architektura warstwowa danych

## Architektura Warstwowa Danych

### Raw Layer (surowe dane)
- Pełne kopie danych z systemu źródłowego
- Audyt, odzyskiwanie, powtarzalność ETL
- Format: JSON, CSV, logi

### Staging Layer (oczyszczone dane)
- Dane po transformacji i walidacji
- Casty typów, standaryzacja, brak nulli
- Przygotowane do dalszego przetwarzania

### Marts Layer (dane analityczne)
- Dane gotowe do raportowania i analizy
- Agregacje, denormalizacja, obliczone kolumny
- Optymalizacja pod wydajność zapytań

## Jak używać

### 1. Konfiguracja środowiska
```bash
# Zainstaluj zależności
pip install -r ../requirements.txt

# Skonfiguruj plik .env z danymi połączenia do PostgreSQL
cp .env.example .env
# Edytuj .env z właściwymi danymi RDS
```

### 2. Uruchomienie operacji CRUD
```bash
python postgres_crud.py
```

### 3. Tworzenie schematu bazy
```bash
python create_volt_schema.py
```

### 4. Migracja danych
```bash
python migrate_volt_data.py
```

## Wymagania

- Python 3.8+
- PostgreSQL (AWS RDS lub lokalny)
- Zainstalowane biblioteki z `requirements.txt`
- Skonfigurowane połączenie z bazą danych w pliku `.env`

## Bezpieczeństwo

- Używaj pliku `.env` dla danych połączenia (nie commituj do git!)
- Parametryzowane zapytania zapobiegają SQL injection
- Dane wrażliwe są chronione zmiennymi środowiskowymi

## Następne kroki

Po ukończeniu Tygodnia 2 przejdź do:
- **Tydzień 3**: S3 jako Data Lake (folder `../week3/`)
- Implementacja ETL pipeline'ów
- Integracja z AWS usługami