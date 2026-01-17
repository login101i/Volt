#!/usr/bin/env python3
"""
Migracja danych komponentów elektrycznych z PostgreSQL do S3
Data Engineering Roadmap - Week 4: Python + S3 Integration z aplikacją Volt
"""
import os
import json
import psycopg2
from datetime import datetime
from dotenv import load_dotenv
from s3_config import get_s3_client, s3_config

# Załaduj zmienne środowiskowe
load_dotenv()

def get_postgres_connection():
    """Ustanawia połączenie z PostgreSQL"""
    try:
        return psycopg2.connect(
            host=os.getenv('POSTGRES_HOST'),
            database=os.getenv('POSTGRES_DB'),
            user=os.getenv('POSTGRES_USER'),
            password=os.getenv('POSTGRES_PASSWORD'),
            port=os.getenv('POSTGRES_PORT', '5432')
        )
    except Exception as e:
        raise ValueError(f"Błąd połączenia z PostgreSQL: {e}")

def export_components_to_json():
    """Eksportuje dane komponentów z PostgreSQL do formatu JSON"""
    conn = None
    try:
        conn = get_postgres_connection()
        cursor = conn.cursor()

        # Pobierz wszystkie komponenty elektryczne
        cursor.execute("""
            SELECT
                id,
                name,
                type,
                voltage,
                current,
                power,
                description,
                price,
                manufacturer,
                created_at,
                updated_at
            FROM electrical_components
            ORDER BY id
        """)

        columns = [desc[0] for desc in cursor.description]
        rows = cursor.fetchall()

        # Konwertuj do listy słowników
        components = []
        for row in rows:
            component = dict(zip(columns, row))
            # Konwertuj datetime do string dla JSON
            if component['created_at']:
                component['created_at'] = component['created_at'].isoformat()
            if component['updated_at']:
                component['updated_at'] = component['updated_at'].isoformat()
            components.append(component)

        return components

    except Exception as e:
        print(f"❌ Błąd podczas eksportu danych: {e}")
        return []
    finally:
        if conn:
            conn.close()

def upload_components_to_s3(components_data, partition_date=None):
    """Przesyła dane komponentów do S3"""
    if not components_data:
        print("⚠️  Brak danych do przesłania")
        return None

    try:
        s3 = get_s3_client()
        bucket = s3_config.bucket_name

        # Ustal ścieżkę w S3
        if partition_date:
            s3_key = f"raw/components/dt={partition_date}/components.json"
        else:
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            s3_key = f"raw/components/components_{timestamp}.json"

        # Konwertuj do JSON string
        json_data = json.dumps(components_data, indent=2, ensure_ascii=False)

        # Metadata dla pliku
        metadata = {
            'source': 'volt_postgresql',
            'table': 'electrical_components',
            'record_count': str(len(components_data)),
            'export_timestamp': datetime.now().isoformat(),
            'format': 'json'
        }

        # Upload do S3
        s3.put_object(
            Bucket=bucket,
            Key=s3_key,
            Body=json_data,
            ContentType='application/json',
            Metadata=metadata
        )

        print(f"✅ Przesłano {len(components_data)} komponentów do s3://{bucket}/{s3_key}")
        return s3_key

    except Exception as e:
        print(f"❌ Błąd podczas uploadu do S3: {e}")
        return None

def export_components_csv_to_s3():
    """Eksportuje dane jako CSV do S3 (alternatywny format)"""
    import pandas as pd

    try:
        components = export_components_to_json()
        if not components:
            return None

        # Konwertuj do DataFrame
        df = pd.DataFrame(components)

        # Ustal ścieżkę w S3
        partition_date = datetime.now().strftime('%Y-%m-%d')
        s3_key = f"raw/components/dt={partition_date}/components.csv"

        # Konwertuj do CSV
        csv_data = df.to_csv(index=False)

        # Upload do S3
        s3 = get_s3_client()
        s3.put_object(
            Bucket=s3_config.bucket_name,
            Key=s3_key,
            Body=csv_data,
            ContentType='text/csv',
            Metadata={
                'source': 'volt_postgresql',
                'table': 'electrical_components',
                'record_count': str(len(components)),
                'export_timestamp': datetime.now().isoformat(),
                'format': 'csv'
            }
        )

        print(f"✅ Przesłano CSV z {len(components)} komponentami do s3://{s3_config.bucket_name}/{s3_key}")
        return s3_key

    except Exception as e:
        print(f"❌ Błąd podczas eksportu CSV: {e}")
        return None

def main():
    """Główna funkcja migracji"""
    print("🚀 Rozpoczynam migrację danych komponentów z PostgreSQL do S3...")
    print(f"Target bucket: {s3_config.bucket_name}")

    # Test połączenia z S3
    if not s3_config.test_connection():
        print("❌ Nie można połączyć się z S3. Sprawdź konfigurację.")
        return

    # Eksport danych
    components = export_components_to_json()

    if not components:
        print("❌ Nie udało się pobrać danych z PostgreSQL")
        return

    print(f"📊 Pobrano {len(components)} komponentów z bazy danych")

    # Upload jako JSON
    json_key = upload_components_to_s3(components)

    # Upload jako CSV
    csv_key = export_components_csv_to_s3()

    if json_key or csv_key:
        print("\n✅ Migracja zakończona pomyślnie!")
        if json_key:
            print(f"   JSON: s3://{s3_config.bucket_name}/{json_key}")
        if csv_key:
            print(f"   CSV:  s3://{s3_config.bucket_name}/{csv_key}")
    else:
        print("❌ Migracja nie powiodła się")

if __name__ == "__main__":
    main()