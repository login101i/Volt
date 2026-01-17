#!/usr/bin/env python3
"""
Generator presigned URLs dla bezpiecznego dostępu do zdjęć komponentów w S3
Data Engineering Roadmap - Week 4: Python + S3 Integration z aplikacją Volt
"""
import os
import json
from datetime import datetime, timedelta
from s3_config import get_s3_client, s3_config

def generate_presigned_url(s3_key, expiration_seconds=3600):
    """
    Generuje presigned URL dla pliku w S3

    Args:
        s3_key (str): Klucz obiektu w S3
        expiration_seconds (int): Czas wygaśnięcia URL w sekundach (domyślnie 1 godzina)

    Returns:
        str: Presigned URL lub None w przypadku błędu
    """
    try:
        s3 = get_s3_client()

        response = s3.generate_presigned_url(
            'get_object',
            Params={
                'Bucket': s3_config.bucket_name,
                'Key': s3_key
            },
            ExpiresIn=expiration_seconds
        )

        return response

    except Exception as e:
        print(f"❌ Błąd generowania presigned URL dla {s3_key}: {e}")
        return None

def generate_component_image_url(component_id, expiration_hours=24):
    """
    Generuje presigned URL dla zdjęcia komponentu

    Args:
        component_id (str): ID komponentu
        expiration_hours (int): Czas wygaśnięcia w godzinach

    Returns:
        dict: Słownik z informacjami o URL lub błędem
    """
    # Struktura klucza w S3: images/components/{component_id}/{component_id}.jpg
    s3_key = f"images/components/{component_id}/{component_id}.jpg"

    expiration_seconds = expiration_hours * 3600
    url = generate_presigned_url(s3_key, expiration_seconds)

    if url:
        return {
            'success': True,
            'component_id': component_id,
            'presigned_url': url,
            'expires_in_hours': expiration_hours,
            'expires_at': (datetime.now() + timedelta(hours=expiration_hours)).isoformat(),
            's3_key': s3_key
        }
    else:
        return {
            'success': False,
            'component_id': component_id,
            'error': 'Nie udało się wygenerować presigned URL'
        }

def batch_generate_presigned_urls(component_ids, expiration_hours=24):
    """
    Generuje presigned URLs dla wielu komponentów na raz

    Args:
        component_ids (list): Lista ID komponentów
        expiration_hours (int): Czas wygaśnięcia w godzinach

    Returns:
        dict: Wyniki generowania URLs
    """
    results = {
        'successful': [],
        'failed': [],
        'total_requested': len(component_ids)
    }

    print(f"🔗 Generowanie presigned URLs dla {len(component_ids)} komponentów...")

    for component_id in component_ids:
        result = generate_component_image_url(component_id, expiration_hours)

        if result['success']:
            results['successful'].append(result)
            print(f"  ✅ {component_id}: URL wygenerowany")
        else:
            results['failed'].append(result)
            print(f"  ❌ {component_id}: {result['error']}")

    results['success_rate'] = f"{len(results['successful'])}/{len(component_ids)}"
    return results

def get_component_image_urls_from_db():
    """
    Pobiera wszystkie component_id z bazy danych i generuje presigned URLs

    Returns:
        dict: Wyniki z URLs dla wszystkich komponentów
    """
    try:
        import psycopg2
        from dotenv import load_dotenv
        load_dotenv()

        # Połącz z bazą danych
        conn = psycopg2.connect(
            host=os.getenv('POSTGRES_HOST'),
            database=os.getenv('POSTGRES_DB'),
            user=os.getenv('POSTGRES_USER'),
            password=os.getenv('POSTGRES_PASSWORD'),
            port=os.getenv('POSTGRES_PORT', '5432')
        )

        cursor = conn.cursor()
        cursor.execute("SELECT DISTINCT id FROM electrical_components ORDER BY id")
        component_ids = [str(row[0]) for row in cursor.fetchall()]

        conn.close()

        if not component_ids:
            return {'error': 'Brak komponentów w bazie danych'}

        print(f"📊 Znaleziono {len(component_ids)} komponentów w bazie danych")

        # Wygeneruj URLs
        return batch_generate_presigned_urls(component_ids)

    except Exception as e:
        return {'error': f'Błąd połączenia z bazą danych: {e}'}

def create_presigned_url_api_response(component_id, expiration_hours=24):
    """
    Tworzy odpowiedź API kompatybilną z istniejącą aplikacją Volt

    Args:
        component_id (str): ID komponentu
        expiration_hours (int): Czas wygaśnięcia URL

    Returns:
        dict: Odpowiedź w formacie JSON API
    """
    result = generate_component_image_url(component_id, expiration_hours)

    if result['success']:
        return {
            'success': True,
            'data': {
                'componentId': result['component_id'],
                'imageUrl': result['presigned_url'],
                'expiresAt': result['expires_at'],
                'expiresInHours': result['expires_in_hours']
            },
            'message': f'Presigned URL wygenerowany na {expiration_hours} godzin'
        }
    else:
        return {
            'success': False,
            'error': result['error'],
            'componentId': component_id
        }

def main():
    """Demonstracja funkcjonalności presigned URLs"""
    print("🔗 Demonstracja presigned URLs dla zdjęć komponentów")
    print(f"Bucket: {s3_config.bucket_name}")

    # Test pojedynczego URL
    test_component_id = "1"  # Przykładowe ID komponentu
    print(f"\n🧪 Test pojedynczego URL dla komponentu {test_component_id}:")

    result = generate_component_image_url(test_component_id)
    if result['success']:
        print("✅ URL wygenerowany pomyślnie:"        print(f"   URL: {result['presigned_url']}")
        print(f"   Wygasa: {result['expires_at']} (za {result['expires_in_hours']}h)")
        print(f"   S3 Key: {result['s3_key']}")
    else:
        print(f"❌ Błąd: {result['error']}")

    # Test batch processing ze wszystkich komponentów z bazy
    print("
📦 Test batch processing dla wszystkich komponentów z bazy:"    batch_results = get_component_image_urls_from_db()

    if 'error' in batch_results:
        print(f"❌ Błąd: {batch_results['error']}")
    else:
        print("✅ Batch processing zakończony:"        print(f"   Sukces: {batch_results['success_rate']}")
        print(f"   Pomyślnych: {len(batch_results['successful'])}")
        print(f"   Błędnych: {len(batch_results['failed'])}")

        if batch_results['successful']:
            print("
📋 Przykładowe URLs:"            for item in batch_results['successful'][:3]:  # Pokaż pierwsze 3
                print(f"   {item['component_id']}: {item['presigned_url'][:80]}...")

def test_api_response_format():
    """Test formatu odpowiedzi API"""
    print("
🧪 Test formatu odpowiedzi API:"    api_response = create_presigned_url_api_response("123", 48)

    print("Odpowiedź JSON API:")
    print(json.dumps(api_response, indent=2, ensure_ascii=False))

if __name__ == "__main__":
    # Test połączenia z S3
    if not s3_config.test_connection():
        print("❌ Nie można połączyć się z S3. Sprawdź konfigurację.")
        exit(1)

    main()
    test_api_response_format()