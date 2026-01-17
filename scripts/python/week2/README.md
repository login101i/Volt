# Week 2: SQL & Model Danych + Component Management

Ten folder zawiera zadania z **Tygodnia 2** roadmapy Data Engineer oraz **zarządzanie komponentami elektrycznymi** dla aplikacji Volt.

## Zawartość folderu

### Pliki główne:
- `postgres_crud.py` - Podstawowe operacje CRUD na PostgreSQL
- `create_volt_schema.py` - Tworzenie schematu bazy danych dla aplikacji Volt
- `migrate_volt_data.py` - Migracja danych między systemami
- `volt_components_data.py` - **Zarządzanie komponentami elektrycznymi**

## 🆕 Component Management System

### Plik `volt_components_data.py`

Kompletny system do zarządzania komponentami elektrycznymi w bazie danych PostgreSQL.

#### Funkcjonalności:
- ✅ **Połączenie z PostgreSQL** - Automatyczne łączenie z bazą
- ✅ **Tworzenie tabeli** - Automatyczne tworzenie struktury `electric_components`
- ✅ **Wsadowe wstawianie** - Import wszystkich komponentów z `REQUIRED_COMPONENTS`
- ✅ **Aktualizacja danych** - UPSERT (INSERT OR UPDATE) dla istniejących rekordów
- ✅ **Statystyki** - Liczenie i analiza komponentów
- ✅ **Eksport do JSON** - Eksport danych do pliku JSON

#### Dane komponentów:
- **120+ komponentów** elektrycznych z aplikacji Next.js
- **Kategorie**: zabezpieczenia, automatyka, pomiary, kable, itp.
- **Pola**: id, nazwa, liczba pól, opis, cena, obraz

### Jak uruchomić:

```bash
# 1. Przejdź do folderu week2
cd scripts/python/week2

# 2. Uruchom skrypt zarządzania komponentami
python volt_components_data.py
```

#### Wyniki działania:
```
🔌 Volt Components Data Management
Zarządzanie komponentami elektrycznymi w PostgreSQL
============================================================
✅ Połączono z bazą danych PostgreSQL
✅ Tabela electric_components została utworzona/zaktualizowana
✅ Wsadowo wstawiono/zaktualizowano 120 komponentów

📊 Statystyki:
   • Łączna liczba komponentów: 120
   • Komponenty 2-polowe: 25 szt.
   • Komponenty 4-polowe: 15 szt.

✅ Wyeksportowano 120 komponentów do pliku electric_components_export.json
✅ Wszystkie operacje zostały wykonane pomyślnie!
```

## Zadania z Tygodnia 2

Na podstawie [data-engineer-readme.md](../../frontend/app/interview/data-engineer-readme.md):

### ✅ Zaimplementowane:
- **Postgres / Redshift basics** - `postgres_crud.py`
  - Operacje CREATE, INSERT, SELECT, UPDATE, DELETE
  - Połączenie z bazą PostgreSQL na AWS RDS
  - Parametryzowane zapytania dla bezpieczeństwa

- **Component Data Management** - `volt_components_data.py`
  - Zarządzanie danymi komponentów elektrycznych
  - Integracja z aplikacją Next.js

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

### 3. Zarządzanie komponentami elektrycznymi
```bash
python volt_components_data.py
```

### 4. Tworzenie schematu bazy
```bash
python create_volt_schema.py
```

### 5. Migracja danych
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

## Integracja z Next.js

Dane komponentów elektrycznych są teraz dostępne w bazie danych PostgreSQL i mogą być używane przez API Next.js:

```javascript
// Przykład użycia w API route
const components = await query('SELECT * FROM electric_components WHERE fields = $1', [2]);
```

## Następne kroki

Po ukończeniu Tygodnia 2 przejdź do:
- **Tydzień 3**: S3 jako Data Lake (folder `../week3/`)
- Implementacja ETL pipeline'ów
- Połączenie danych komponentów z frontendem
- Integracja z AWS usługami