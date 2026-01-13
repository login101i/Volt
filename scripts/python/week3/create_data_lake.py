#!/usr/bin/env python3
"""
Data Lake Structure Creator for Week 3 - Local + AWS S3 Version
Creates a basic data lake structure for users and orders data locally and in S3

Uruchomienie w konsoli:
    python create_data_lake.py
    lub
    python3 create_data_lake.py

Wymagania:
- Python 3.8+
- Opcjonalne: Skonfigurowane credentials AWS (aws configure lub zmienne środowiskowe)
- Opcjonalne: Uprawnienia do S3 (s3:PutObject, s3:CreateBucket jeśli bucket nie istnieje)
- Zainstalowane biblioteki: pip install boto3 (dla operacji S3)

Skrypt utworzy strukturę katalogów data lake:
- LOKALNIE: w folderze data-lake/ (zawsze działa)
- W S3: w bucketcie voltappbucket (wymaga skonfigurowanych credentials AWS)

Obie struktury zawierają przykładowe dane i dokumentację.
"""

import os
import json
import boto3
from botocore.exceptions import ClientError, NoCredentialsError
import io

# Configuration
BUCKET_NAME = "voltappbucket"  # Change this to your desired S3 bucket name


def create_s3_bucket_if_not_exists(bucket_name: str):
    """Create S3 bucket if it doesn't exist"""

    try:
        s3_client = boto3.client('s3')

        # Check if bucket exists
        try:
            s3_client.head_bucket(Bucket=bucket_name)
            print(f"Bucket '{bucket_name}' already exists")
        except ClientError as e:
            error_code = e.response['Error']['Code']
            if error_code == '404':
                # Bucket doesn't exist, create it
                try:
                    # For us-east-1, don't specify LocationConstraint
                    s3_client.create_bucket(Bucket=bucket_name)
                    print(f"Created bucket: '{bucket_name}'")
                except ClientError as create_error:
                    print(f"Error creating bucket '{bucket_name}': {create_error}")
                    return False
            else:
                print(f"Error checking bucket '{bucket_name}': {e}")
                return False

        return True

    except NoCredentialsError:
        print("AWS credentials not found. Please configure AWS CLI or set environment variables.")
        return False
    except Exception as e:
        print(f"Error creating/checking bucket: {e}")
        return False


def create_local_directory_structure(base_path: str):
    """Create the basic data lake directory structure locally"""

    directories = [
        "raw/source1/2025/01",
        "raw/source1/2025/02",
        "raw/source2",
        "staging/customers",
        "staging/orders",
        "mart/customer_summary",
        "mart/sales_dashboard"
    ]

    for directory in directories:
        full_path = os.path.join(base_path, directory)
        os.makedirs(full_path, exist_ok=True)
        print(f"Created local directory: {full_path}")


def create_directory_structure_info():
    """Display information about the data lake directory structure (S3 doesn't use real directories)"""

    # Struktura partycjonowana po dacie dla optymalnej wydajności
    # Format: rok/miesiąc/dzień pozwala na efektywne filtrowanie danych
    directories = [
        "raw/source1/2025/01/",  # Partycja: styczeń 2025 - tylko dane z tego miesiąca
        "raw/source1/2025/02/",  # Partycja: luty 2025 - osobna partycja dla lepszej wydajności
        "raw/source2/",          # Źródło bez partycjonowania datą (jeśli dane nie są datowane)
        "staging/customers/",    # Warstwa staging - dane po oczyszczeniu
        "staging/orders/",       # Staging dla zamówień
        "mart/customer_summary/", # Marts - dane zagregowane dla analizy klientów
        "mart/sales_dashboard/"   # Marts - dane dla dashboardów sprzedażowych
    ]

    print("Data Lake directory structure (S3 prefixes):")
    for directory in directories:
        print(f"  s3://{BUCKET_NAME}/{directory}")
    print()


def create_local_sample_raw_data(base_path: str):
    """Create sample raw data files locally"""

    # Sample user data
    users_data = [
        {
            "user_id": "user_001",
            "name": "Jan Kowalski",
            "email": "jan.kowalski@example.com",
            "registration_date": "2025-01-01",
            "country": "Poland",
            "status": "active"
        },
        {
            "user_id": "user_002",
            "name": "Anna Nowak",
            "email": "anna.nowak@example.com",
            "registration_date": "2025-01-01",
            "country": "Poland",
            "status": "active"
        },
        {
            "user_id": "user_003",
            "name": "Piotr Wiśniewski",
            "email": "piotr.wisniewski@example.com",
            "registration_date": "2025-01-02",
            "country": "Poland",
            "status": "inactive"
        }
    ]

    # Sample orders data
    orders_data = [
        {
            "order_id": "order_001",
            "user_id": "user_001",
            "order_date": "2025-01-01",
            "total_amount": 150.00,
            "currency": "PLN",
            "status": "completed",
            "items": [
                {"product_id": "prod_001", "quantity": 2, "price": 50.00},
                {"product_id": "prod_002", "quantity": 1, "price": 50.00}
            ]
        },
        {
            "order_id": "order_002",
            "user_id": "user_002",
            "order_date": "2025-01-02",
            "total_amount": 75.00,
            "currency": "PLN",
            "status": "completed",
            "items": [
                {"product_id": "prod_003", "quantity": 1, "price": 75.00}
            ]
        }
    ]

    # Partycjonowanie danych po dacie - kluczowa optymalizacja wydajności!
    # Dane są dzielone na partycje miesięczne (2025/01/), co pozwala na:
    # - Szybsze zapytania (tylko jeden miesiąc zamiast wszystkich danych)
    # - Mniejsze koszty S3 (mniej danych do przeskanowania)
    # - Równoległe przetwarzanie różnych partycji
    users_jan_01 = [user for user in users_data if user["registration_date"] == "2025-01-01"]
    users_jan_02 = [user for user in users_data if user["registration_date"] == "2025-01-02"]

    orders_jan_01 = [order for order in orders_data if order["order_date"] == "2025-01-01"]
    orders_jan_02 = [order for order in orders_data if order["order_date"] == "2025-01-02"]

    # Create raw data files locally
    raw_path = os.path.join(base_path, "raw")

    # Source1 data for January 1st and 2nd
    source1_path = os.path.join(raw_path, "source1", "2025", "01")

    # Pliki są organizowane w strukturze partycjonowanej: raw/source1/2025/01/
    # Każdy plik zawiera dane tylko z jednego dnia w ramach partycji miesięcznej
    data_files = [
        (os.path.join(source1_path, "data_2025-01-01.json"), {
            "users": users_jan_01,
            "orders": orders_jan_01,
            "source": "source1",
            "date": "2025-01-01"
        }),
        (os.path.join(source1_path, "data_2025-01-02.json"), {
            "users": users_jan_02,
            "orders": orders_jan_02,
            "source": "source1",
            "date": "2025-01-02"
        })
    ]

    for file_path, data in data_files:
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        print(f"Created local raw data file: {file_path}")


def create_sample_raw_data(bucket_name: str):
    """Create sample raw data files in S3"""

    try:
        s3_client = boto3.client('s3')

        # Sample user data
        users_data = [
            {
                "user_id": "user_001",
                "name": "Jan Kowalski",
                "email": "jan.kowalski@example.com",
                "registration_date": "2025-01-01",
                "country": "Poland",
                "status": "active"
            },
            {
                "user_id": "user_002",
                "name": "Anna Nowak",
                "email": "anna.nowak@example.com",
                "registration_date": "2025-01-01",
                "country": "Poland",
                "status": "active"
            },
            {
                "user_id": "user_003",
                "name": "Piotr Wiśniewski",
                "email": "piotr.wisniewski@example.com",
                "registration_date": "2025-01-02",
                "country": "Poland",
                "status": "inactive"
            }
        ]

        # Sample orders data
        orders_data = [
            {
                "order_id": "order_001",
                "user_id": "user_001",
                "order_date": "2025-01-01",
                "total_amount": 150.00,
                "currency": "PLN",
                "status": "completed",
                "items": [
                    {"product_id": "prod_001", "quantity": 2, "price": 50.00},
                    {"product_id": "prod_002", "quantity": 1, "price": 50.00}
                ]
            },
            {
                "order_id": "order_002",
                "user_id": "user_002",
                "order_date": "2025-01-02",
                "total_amount": 75.00,
                "currency": "PLN",
                "status": "completed",
                "items": [
                    {"product_id": "prod_003", "quantity": 1, "price": 75.00}
                ]
            }
        ]

        # Partycjonowanie danych po dacie - kluczowa optymalizacja wydajności!
        # Dane są dzielone na partycje miesięczne (2025/01/), co pozwala na:
        # - Szybsze zapytania (tylko jeden miesiąc zamiast wszystkich danych)
        # - Mniejsze koszty S3 (mniej danych do przeskanowania)
        # - Równoległe przetwarzanie różnych partycji
        users_jan_01 = [user for user in users_data if user["registration_date"] == "2025-01-01"]
        users_jan_02 = [user for user in users_data if user["registration_date"] == "2025-01-02"]

        orders_jan_01 = [order for order in orders_data if order["order_date"] == "2025-01-01"]
        orders_jan_02 = [order for order in orders_data if order["order_date"] == "2025-01-02"]

        # Pliki są organizowane w strukturze partycjonowanej: raw/source1/2025/01/
        # Każdy plik zawiera dane tylko z jednego dnia w ramach partycji miesięcznej
        data_files = [
            ("raw/source1/2025/01/data_2025-01-01.json", {
                "users": users_jan_01,
                "orders": orders_jan_01,
                "source": "source1",
                "date": "2025-01-01"
            }),
            ("raw/source1/2025/01/data_2025-01-02.json", {
                "users": users_jan_02,
                "orders": orders_jan_02,
                "source": "source1",
                "date": "2025-01-02"
            })
        ]

        for s3_key, data in data_files:
            # Convert data to JSON string
            json_data = json.dumps(data, indent=2, ensure_ascii=False)

            # Upload to S3
            s3_client.put_object(
                Bucket=bucket_name,
                Key=s3_key,
                Body=json_data,
                ContentType='application/json'
            )
            print(f"Uploaded raw data file: s3://{bucket_name}/{s3_key}")

        return True

    except NoCredentialsError:
        print("AWS credentials not found. Please configure AWS CLI or set environment variables.")
        return False
    except ClientError as e:
        print(f"Error uploading to S3: {e}")
        return False
    except Exception as e:
        print(f"Unexpected error: {e}")
        return False


def create_local_placeholder_parquet_files(base_path: str):
    """Create placeholder parquet files locally (empty for now, would contain processed data)"""

    parquet_files = [
        "staging/customers/customers_cleaned.parquet",
        "staging/orders/orders_staging.parquet",
        "mart/customer_summary/customer_metrics.parquet",
        "mart/sales_dashboard/monthly_sales.parquet"
    ]

    # Placeholder content for parquet files
    placeholder_content = """# Placeholder for parquet file
# In real scenario, this would be a binary parquet file
# containing processed data
# This is just a text marker for demonstration purposes
"""

    for parquet_file in parquet_files:
        file_path = os.path.join(base_path, parquet_file)
        with open(file_path, 'w') as f:
            f.write(placeholder_content)
        print(f"Created local placeholder parquet file: {file_path}")


def create_placeholder_parquet_files(bucket_name: str):
    """Create placeholder parquet files in S3 (empty for now, would contain processed data)"""

    try:
        s3_client = boto3.client('s3')

        parquet_files = [
            "staging/customers/customers_cleaned.parquet",
            "staging/orders/orders_staging.parquet",
            "mart/customer_summary/customer_metrics.parquet",
            "mart/sales_dashboard/monthly_sales.parquet"
        ]

        # Placeholder content for parquet files
        placeholder_content = """# Placeholder for parquet file
# In real scenario, this would be a binary parquet file
# containing processed data
# This is just a text marker for demonstration purposes
"""

        for parquet_file in parquet_files:
            # Upload placeholder to S3
            s3_client.put_object(
                Bucket=bucket_name,
                Key=parquet_file,
                Body=placeholder_content,
                ContentType='application/octet-stream'
            )
            print(f"Created placeholder parquet file: s3://{bucket_name}/{parquet_file}")

        return True

    except NoCredentialsError:
        print("AWS credentials not found. Please configure AWS CLI or set environment variables.")
        return False
    except ClientError as e:
        print(f"Error uploading parquet placeholder to S3: {e}")
        return False
    except Exception as e:
        print(f"Unexpected error: {e}")
        return False


def create_local_readme(base_path: str):
    """Create a README file explaining the data lake structure locally"""

    readme_content = """# Data Lake Structure - Local Development

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
"""

    readme_path = os.path.join(base_path, "README.md")
    with open(readme_path, 'w', encoding='utf-8') as f:
        f.write(readme_content)
    print(f"Created local README file: {readme_path}")


def create_readme(bucket_name: str):
    """Create a README file explaining the data lake structure in S3"""

    try:
        s3_client = boto3.client('s3')

        readme_content = f"""# Data Lake Structure - AWS S3

This S3 bucket contains a basic data lake structure for users and orders data.

## S3 Structure

```
s3://{bucket_name}/
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
│   │   ├── data_2025-01-01.json
│   │   └── data_2025-01-02.json
│   └── 02/           # Następna partycja miesięczna
└── 2026/
    └── 01/
```

**Zalecenia:**
- Partycjonuj po dacie jako pierwszej kolumnie w zapytaniach
- Używaj formatu `YYYY/MM/DD` dla optymalnej organizacji
- Unikaj partycjonowania po kolumnach z małą kardynalnością (np. status: active/inactive)

## AWS Configuration

This data lake is hosted in Amazon S3 bucket: `{bucket_name}`

Required IAM permissions:
- s3:GetObject
- s3:PutObject
- s3:ListBucket
- s3:CreateBucket (if bucket doesn't exist)

## Usage

Run this script to create the complete data lake structure in S3:
```bash
python create_data_lake.py
```

To explore the data lake:
```bash
aws s3 ls s3://{bucket_name}/ --recursive
```
"""

        # Upload README to S3
        s3_client.put_object(
            Bucket=bucket_name,
            Key="README.md",
            Body=readme_content,
            ContentType='text/markdown'
        )
        print(f"Created README file: s3://{bucket_name}/README.md")

        return True

    except NoCredentialsError:
        print("AWS credentials not found. Please configure AWS CLI or set environment variables.")
        return False
    except ClientError as e:
        print(f"Error uploading README to S3: {e}")
        return False
    except Exception as e:
        print(f"Unexpected error: {e}")
        return False


def main():
    """Main function to create the data lake structure locally and in S3"""

    # Local data lake path
    local_path = "data-lake"

    print("Creating Data Lake Structure locally and in AWS S3...")
    print(f"Local path: {local_path}")
    print(f"S3 Bucket: {BUCKET_NAME}")
    print("-" * 70)

    success = True

    # LOCAL OPERATIONS FIRST
    print("LOCAL OPERATIONS:")
    print("1. Creating local directory structure...")
    create_local_directory_structure(local_path)

    print("\n2. Creating local sample raw data...")
    create_local_sample_raw_data(local_path)

    print("\n3. Creating local placeholder parquet files...")
    create_local_placeholder_parquet_files(local_path)

    print("\n4. Creating local README documentation...")
    create_local_readme(local_path)

    print("\n" + "=" * 70)
    print("[SUCCESS] Local data lake structure created successfully!")
    print(f"[SUCCESS] Local path: {local_path}/")
    print("=" * 70)

    # S3 OPERATIONS
    print("\nS3 OPERATIONS:")

    # Check/create S3 bucket
    print("5. Checking/creating S3 bucket...")
    if not create_s3_bucket_if_not_exists(BUCKET_NAME):
        success = False

    if success:
        # Show directory structure info
        print("\n6. Data Lake structure info...")
        create_directory_structure_info()

        # Create sample raw data
        print("7. Creating sample raw data...")
        if not create_sample_raw_data(BUCKET_NAME):
            success = False

        if success:
            # Create placeholder parquet files
            print("\n8. Creating placeholder parquet files...")
            if not create_placeholder_parquet_files(BUCKET_NAME):
                success = False

            # Create README documentation
            print("\n9. Creating README documentation...")
            if not create_readme(BUCKET_NAME):
                success = False

    print("\n" + "=" * 70)
    if success:
        print("\033[92m[SUCCESS] Data Lake structures created successfully!\033[0m")
        print(f"\033[92m[LOCAL] {local_path}/\033[0m")
        print(f"\033[92m[S3] s3://{BUCKET_NAME}/\033[0m")
        print("\n\033[92mTo explore the local structure:\033[0m")
        print(f"\033[92mls -la {local_path}/\033[0m")
        print("\n\033[92mTo explore the S3 structure:\033[0m")
        print(f"\033[92maws s3 ls s3://{BUCKET_NAME}/ --recursive\033[0m")
        print("\n\033[92mTo view S3 README:\033[0m")
        print(f"\033[92maws s3 cp s3://{BUCKET_NAME}/README.md -\033[0m")
    else:
        print("Failed to create complete Data Lake structure. Check error messages above.")
    print("=" * 70)


if __name__ == "__main__":
    main()
