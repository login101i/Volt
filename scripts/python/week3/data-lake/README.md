# Data Lake Structure - Local Development

This local directory simulates a basic data lake structure for users and orders data.

## Local Structure

```
data-lake/
├── raw/                    # Dane surowe, niemodyfikowane
│   ├── source1/
│   │   ├── 2025/
│   │   │   ├── 01/
│   │   │   │   ├── data_2025-01-01.json
│   │   │   │   └── data_2025-01-02.json
│   │   └── 02/
│   └── source2/
├── staging/                # Dane wyczyszczone i przetworzone
│   ├── customers/
│   │   └── customers_cleaned.parquet
│   └── orders/
│       └── orders_staging.parquet
└── mart/                   # Dane gotowe do analizy biznesowej
    ├── customer_summary/
    │   └── customer_metrics.parquet
    └── sales_dashboard/
        └── monthly_sales.parquet
```

## Layer Descriptions

### Raw Layer
- Contains original, unmodified data
- Data is partitioned by source and date
- Files are in JSON format with original structure

### Staging Layer
- Contains cleaned and processed data
- Data is transformed and standardized
- Files are in parquet format for better performance

### Mart Layer
- Contains aggregated data ready for business analysis
- Optimized for reporting and dashboard consumption
- Files are in parquet format with pre-computed metrics

## Partycjonowanie po Dacie - Korzyści Wydajnościowe

### Dlaczego partycjonowanie po dacie poprawia wydajność?

**1. Skanowanie Mniejszej Ilości Danych**
- Zamiast skanować wszystkie dane (np. 10 lat), skanujesz tylko dane z konkretnego okresu
- Przykład: `WHERE date >= '2025-01-01' AND date < '2025-02-01'` czyta tylko folder `2025/01/`

**2. Optymalizacja Kosztów S3**
- Mniejsze koszty transferu danych
- Mniejsze koszty obliczeń (mniej danych do przetworzenia)
- Szybsze zapytania = niższe koszty

**3. Lepsza Kompresja**
- Dane z tego samego okresu mają podobną strukturę
- Lepszy współczynnik kompresji w Parquet
- Mniejsze pliki = szybsze odczyty

**4. Równoległe Przetwarzanie**
- Różne partycje mogą być przetwarzane równolegle
- Przykład: 12 partycji miesięcznych = 12x szybsze przetwarzanie na klastrze

**5. Zarządzanie Życiem Danych (Data Lifecycle)**
- Łatwe usuwanie starych danych (np. po 7 latach)
- Automatyczne przenoszenie do tańszego storage (Glacier)
- Zgodność z regulacjami (GDPR, retention policies)

### Struktura Partycji w Tym Data Lake

```
raw/source1/
├── 2025/
│   ├── 01/           # Partycja miesięczna
│   └── 02/           # Następna partycja miesięczna
```

**Zalecenia:**
- Partycjonuj po dacie jako pierwszej kolumnie w zapytaniach
- Używaj formatu `YYYY/MM/DD` dla optymalnej organizacji
- Unikaj partycjonowania po kolumnach z małą kardynalnością (np. status: active/inactive)

## Local Development

This is a local simulation of the S3 data lake structure for development and testing purposes.

To sync with actual S3 bucket, run:
```bash
python create_data_lake.py
```

## Usage

The local data lake structure is ready for development. You can:
- Test ETL pipelines locally
- Develop and debug data processing scripts
- Validate data transformations before deploying to production

All files in this directory are for local development only.
