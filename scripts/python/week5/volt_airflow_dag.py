#!/usr/bin/env python3
"""
Przykład DAG Airflow dla aplikacji Volt
Data Engineering Roadmap - Tydzień 2, Dni 8-9: Airflow + S3 + Volt
"""
from airflow import DAG
from airflow.operators.python import PythonOperator, BranchPythonOperator
from airflow.operators.bash import BashOperator
from airflow.utils.trigger_rule import TriggerRule
from airflow.sensors.filesystem import FileSensor
from datetime import datetime, timedelta
import os
import sys

# Dodaj ścieżkę do skryptów Volt
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))

from week4.volt_data_to_s3 import export_components_to_json, upload_components_to_s3
from week4.volt_images_to_s3 import migrate_images_to_s3
from week4.presigned_urls import batch_generate_presigned_urls

# Default arguments dla DAG
default_args = {
    'owner': 'volt_data_team',
    'depends_on_past': False,
    'start_date': datetime(2024, 1, 1),
    'email_on_failure': True,
    'email_on_retry': False,
    'retries': 2,
    'retry_delay': timedelta(minutes=5),
    'execution_timeout': timedelta(hours=2)
}

# Główny DAG dla aplikacji Volt
dag = DAG(
    'volt_daily_pipeline',
    default_args=default_args,
    description='Codzienny pipeline danych dla aplikacji Volt: PostgreSQL → S3 → Presigned URLs',
    schedule_interval='@daily',  # Codziennie o północy
    catchup=False,  # Nie przetwarzaj historycznych dat
    max_active_runs=1,  # Tylko jedno uruchomienie na raz
    tags=['volt', 'data-engineering', 's3', 'postgresql']
)

def check_volt_database():
    """Sprawdź połączenie z bazą danych Volt"""
    try:
        from week4.volt_data_to_s3 import get_postgres_connection
        conn = get_postgres_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM electrical_components")
        count = cursor.fetchone()[0]
        conn.close()
        print(f"✅ Baza danych Volt dostępna: {count} komponentów")
        return 'extract_volt_data'
    except Exception as e:
        print(f"❌ Błąd połączenia z bazą Volt: {e}")
        return 'alert_failure'

def extract_volt_data():
    """Pobierz dane komponentów z PostgreSQL"""
    print("📊 Rozpoczynam ekstrakcję danych z aplikacji Volt...")

    try:
        components = export_components_to_json()

        if not components:
            raise ValueError("Brak danych komponentów do przetworzenia")

        # Zapisz do pliku tymczasowego (Airflow może tego użyć)
        temp_file = '/tmp/volt_components_raw.json'
        import json
        with open(temp_file, 'w', encoding='utf-8') as f:
            json.dump(components, f, indent=2, ensure_ascii=False)

        print(f"✅ Wyekstrahowano {len(components)} komponentów do {temp_file}")
        return temp_file

    except Exception as e:
        print(f"❌ Błąd ekstrakcji danych: {e}")
        raise

def transform_volt_data():
    """Przekształć dane komponentów używając Pandas"""
    print("🔄 Rozpoczynam transformację danych Volt...")

    try:
        import pandas as pd

        # Wczytaj dane z pliku tymczasowego
        temp_file = '/tmp/volt_components_raw.json'
        df = pd.read_json(temp_file)

        # Transformacje danych
        # 1. Usuń komponenty bez ceny
        df_clean = df.dropna(subset=['price'])

        # 2. Filtruj komponenty z prawidłowym zakresem cen
        df_clean = df_clean[(df_clean['price'] > 0) & (df_clean['price'] < 10000)]

        # 3. Dodaj kolumnę kategorii cenowej
        df_clean['price_category'] = pd.cut(
            df_clean['price'],
            bins=[0, 100, 500, 1000, float('inf')],
            labels=['budget', 'standard', 'premium', 'luxury']
        )

        # 4. Normalizuj nazwy (lowercase, usuń specjalne znaki)
        df_clean['name_normalized'] = df_clean['name'].str.lower().str.replace(r'[^\w\s]', '', regex=True)

        # Zapisz przekształcone dane
        transformed_file = '/tmp/volt_components_transformed.parquet'
        df_clean.to_parquet(transformed_file, index=False)

        print(f"✅ Przekształcono {len(df)} → {len(df_clean)} komponentów")
        print(f"   Zapisano do: {transformed_file}")

        return transformed_file

    except Exception as e:
        print(f"❌ Błąd transformacji danych: {e}")
        raise

def load_to_s3():
    """Załaduj dane do S3"""
    print("📤 Rozpoczynam ładowanie danych do S3...")

    try:
        # Upload przekształconych danych
        transformed_file = '/tmp/volt_components_transformed.parquet'

        # Użyj istniejącej funkcji upload
        from week4.volt_data_to_s3 import upload_components_to_s3
        import pandas as pd

        # Wczytaj i prześlij jako JSON (dla kompatybilności)
        df = pd.read_parquet(transformed_file)
        components_data = df.to_dict('records')

        s3_key = upload_components_to_s3(components_data)

        if s3_key:
            print(f"✅ Dane załadowane do S3: {s3_key}")
            return s3_key
        else:
            raise ValueError("Nie udało się przesłać danych do S3")

    except Exception as e:
        print(f"❌ Błąd ładowania do S3: {e}")
        raise

def generate_image_urls():
    """Wygeneruj presigned URLs dla zdjęć komponentów"""
    print("🔗 Generowanie presigned URLs dla zdjęć komponentów...")

    try:
        # Pobierz wszystkie ID komponentów z bazy
        from week4.volt_data_to_s3 import get_postgres_connection

        conn = get_postgres_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT DISTINCT id FROM electrical_components")
        component_ids = [str(row[0]) for row in cursor.fetchall()]
        conn.close()

        if not component_ids:
            print("⚠️  Brak komponentów w bazie danych")
            return []

        # Wygeneruj URLs
        results = batch_generate_presigned_urls(component_ids, expiration_hours=168)  # 7 dni

        successful_urls = len(results.get('successful', []))
        failed_urls = len(results.get('failed', []))

        print(f"✅ Wygenerowano {successful_urls} presigned URLs")
        if failed_urls > 0:
            print(f"⚠️  {failed_urls} URLs nie udało się wygenerować")

        return results

    except Exception as e:
        print(f"❌ Błąd generowania presigned URLs: {e}")
        raise

def cleanup_temp_files():
    """Wyczyść pliki tymczasowe"""
    import os

    temp_files = [
        '/tmp/volt_components_raw.json',
        '/tmp/volt_components_transformed.parquet'
    ]

    for file_path in temp_files:
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
                print(f"🗑️  Usunięto plik tymczasowy: {file_path}")
        except Exception as e:
            print(f"⚠️  Nie udało się usunąć {file_path}: {e}")

def send_success_alert():
    """Wyślij alert o sukcesie"""
    print("🎉 Pipeline Volt zakończony pomyślnie!")
    print("📊 Podsumowanie:")
    print("   ✅ Ekstrakcja danych z PostgreSQL")
    print("   ✅ Transformacja Pandas")
    print("   ✅ Ładowanie do S3")
    print("   ✅ Generowanie presigned URLs")
    print("   🧹 Czyszczenie plików tymczasowych")

def send_failure_alert():
    """Wyślij alert o błędzie"""
    print("❌ Pipeline Volt zakończony błędem!")
    print("🔍 Sprawdź logi Airflow dla szczegółów")

# Definicja zadań (tasks)

# 1. Sprawdź połączenie z bazą danych
check_db = BranchPythonOperator(
    task_id='check_volt_database',
    python_callable=check_volt_database,
    dag=dag
)

# 2. Ekstrakcja danych
extract_data = PythonOperator(
    task_id='extract_volt_data',
    python_callable=extract_volt_data,
    dag=dag
)

# 3. Transformacja danych
transform_data = PythonOperator(
    task_id='transform_volt_data',
    python_callable=transform_volt_data,
    dag=dag
)

# 4. Ładowanie do S3
load_s3 = PythonOperator(
    task_id='load_to_s3',
    python_callable=load_to_s3,
    dag=dag
)

# 5. Generowanie presigned URLs
generate_urls = PythonOperator(
    task_id='generate_image_urls',
    python_callable=generate_image_urls,
    dag=dag
)

# 6. Czyszczenie plików tymczasowych
cleanup = PythonOperator(
    task_id='cleanup_temp_files',
    python_callable=cleanup_temp_files,
    trigger_rule=TriggerRule.ALL_DONE,  # Uruchom zawsze, nawet przy błędach
    dag=dag
)

# 7. Alerty
success_alert = PythonOperator(
    task_id='success_alert',
    python_callable=send_success_alert,
    trigger_rule=TriggerRule.ALL_SUCCESS,
    dag=dag
)

failure_alert = PythonOperator(
    task_id='failure_alert',
    python_callable=send_failure_alert,
    trigger_rule=TriggerRule.ONE_FAILED,
    dag=dag
)

# Przepływ zadań (dependencies)
check_db >> [extract_data, failure_alert]
extract_data >> transform_data >> load_s3 >> generate_urls >> cleanup
cleanup >> [success_alert, failure_alert]

if __name__ == "__main__":
    print("🚀 Test DAG Volt - uruchomienie lokalne")

    # Test pojedynczych funkcji
    try:
        print("\n1. Sprawdzanie bazy danych...")
        check_result = check_volt_database()

        if check_result == 'extract_volt_data':
            print("\n2. Ekstrakcja danych...")
            extract_volt_data()

            print("\n3. Transformacja danych...")
            transform_volt_data()

            print("\n4. Ładowanie do S3...")
            load_to_s3()

            print("\n5. Generowanie URLs...")
            generate_image_urls()

            print("\n6. Czyszczenie...")
            cleanup_temp_files()

            print("\n🎉 Test DAG zakończony pomyślnie!")
        else:
            print(f"❌ Test nieudany: {check_result}")

    except Exception as e:
        print(f"❌ Błąd podczas testu DAG: {e}")
        import traceback
        traceback.print_exc()