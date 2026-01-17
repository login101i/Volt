#!/usr/bin/env python3
"""
Migracja zdjęć komponentów elektrycznych z lokalnego storage do S3
Data Engineering Roadmap - Week 4: Python + S3 Integration z aplikacją Volt
"""
import os
import glob
import mimetypes
from datetime import datetime
from pathlib import Path
from s3_config import get_s3_client, s3_config

def get_local_images_path():
    """Zwraca ścieżkę do lokalnych zdjęć komponentów"""
    # Ścieżka względna od scripts/python/week4/ do frontend/public/pictures/
    script_dir = Path(__file__).parent
    project_root = script_dir.parent.parent.parent
    images_path = project_root / "frontend" / "public" / "pictures" / "electricComponents"

    return images_path

def find_component_images():
    """Znajduje wszystkie zdjęcia komponentów w lokalnym storage"""
    images_path = get_local_images_path()
    pattern = str(images_path / "*.jpg")

    image_files = []
    for image_path in glob.glob(pattern):
        path_obj = Path(image_path)

        # Wyciągnij component_id z nazwy pliku (np. "123.jpg" → "123")
        filename = path_obj.name
        component_id = filename.split('.')[0]

        image_files.append({
            'path': str(path_obj),
            'filename': filename,
            'component_id': component_id,
            'size': path_obj.stat().st_size,
            'modified': datetime.fromtimestamp(path_obj.stat().st_mtime).isoformat()
        })

    return image_files

def upload_image_to_s3(image_info):
    """Przesyła pojedyncze zdjęcie do S3"""
    try:
        s3 = get_s3_client()
        bucket = s3_config.bucket_name

        # Struktura w S3: images/components/{component_id}/{filename}
        component_id = image_info['component_id']
        filename = image_info['filename']
        s3_key = f"images/components/{component_id}/{filename}"

        # Określ content type
        content_type, _ = mimetypes.guess_type(filename)
        if not content_type:
            content_type = 'image/jpeg'

        # Metadata dla zdjęcia
        metadata = {
            'component_id': component_id,
            'original_filename': filename,
            'uploaded_from': 'volt_local_storage',
            'upload_timestamp': datetime.now().isoformat(),
            'file_size': str(image_info['size']),
            'last_modified': image_info['modified']
        }

        # Odczytaj plik i prześlij do S3
        with open(image_info['path'], 'rb') as file:
            s3.put_object(
                Bucket=bucket,
                Key=s3_key,
                Body=file,
                ContentType=content_type,
                Metadata=metadata,
                # Dodaj tagi
                Tagging=f"component_id={component_id}&source=volt_migration"
            )

        return {
            'success': True,
            's3_key': s3_key,
            's3_url': f"s3://{bucket}/{s3_key}",
            'component_id': component_id
        }

    except Exception as e:
        return {
            'success': False,
            'error': str(e),
            'component_id': image_info['component_id'],
            'filename': image_info['filename']
        }

def migrate_images_batch(image_files, batch_size=10):
    """Migracja zdjęć w partiach"""
    results = {
        'successful': [],
        'failed': [],
        'total_processed': 0
    }

    for i in range(0, len(image_files), batch_size):
        batch = image_files[i:i + batch_size]
        print(f"📦 Przetwarzam partię {i//batch_size + 1}/{(len(image_files) + batch_size - 1)//batch_size} ({len(batch)} plików)...")

        for image_info in batch:
            result = upload_image_to_s3(image_info)
            results['total_processed'] += 1

            if result['success']:
                results['successful'].append(result)
                print(f"  ✅ {result['component_id']}: {result['s3_key']}")
            else:
                results['failed'].append(result)
                print(f"  ❌ {result['component_id']}: {result['error']}")

    return results

def generate_migration_report(results):
    """Generuje raport z migracji"""
    report = {
        'migration_timestamp': datetime.now().isoformat(),
        'total_processed': results['total_processed'],
        'successful_uploads': len(results['successful']),
        'failed_uploads': len(results['failed']),
        'success_rate': f"{len(results['successful'])/max(1, results['total_processed'])*100:.1f}%" if results['total_processed'] > 0 else "0%",
        'successful_components': [r['component_id'] for r in results['successful']],
        'failed_components': [r['component_id'] for r in results['failed']]
    }

    return report

def save_migration_report(report):
    """Zapisuje raport migracji do pliku"""
    report_filename = f"migration_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"

    with open(report_filename, 'w', encoding='utf-8') as f:
        json.dump(report, f, indent=2, ensure_ascii=False)

    print(f"📄 Raport migracji zapisany: {report_filename}")
    return report_filename

def main():
    """Główna funkcja migracji zdjęć"""
    print("🚀 Rozpoczynam migrację zdjęć komponentów do S3...")
    print(f"Target bucket: {s3_config.bucket_name}")

    # Test połączenia z S3
    if not s3_config.test_connection():
        print("❌ Nie można połączyć się z S3. Sprawdź konfigurację.")
        return

    # Znajdź zdjęcia komponentów
    local_images_path = get_local_images_path()
    print(f"🔍 Skanowanie katalogu: {local_images_path}")

    image_files = find_component_images()

    if not image_files:
        print(f"⚠️  Nie znaleziono zdjęć w katalogu {local_images_path}")
        print("   Sprawdź czy ścieżka jest poprawna i czy zdjęcia istnieją.")
        return

    print(f"📸 Znaleziono {len(image_files)} zdjęć komponentów")

    # Wyświetl pierwsze kilka przykładów
    for img in image_files[:3]:
        print(f"   - {img['component_id']}: {img['filename']} ({img['size']} bytes)")

    if len(image_files) > 3:
        print(f"   ... i {len(image_files) - 3} więcej")

    # Potwierdzenie migracji
    response = input(f"\nCzy chcesz przesłać {len(image_files)} zdjęć do S3? (y/N): ")
    if response.lower() not in ['y', 'yes']:
        print("❌ Migracja anulowana przez użytkownika")
        return

    # Wykonaj migrację
    print("\n📤 Rozpoczynam upload zdjęć...")
    results = migrate_images_batch(image_files)

    # Generuj i zapisz raport
    report = generate_migration_report(results)
    report_file = save_migration_report(report)

    # Podsumowanie
    print("
🎯 PODSUMOWANIE MIGRACJI:"    print(f"   Przetworzono plików: {results['total_processed']}")
    print(f"   Pomyślnych uploadów: {len(results['successful'])}")
    print(f"   Błędnych uploadów: {len(results['failed'])}")
    print(f"   Skuteczność: {report['success_rate']}")

    if results['failed']:
        print("
❌ PLIKI Z BŁĘDAMI:"        for failed in results['failed'][:5]:  # Pokaż pierwsze 5 błędów
            print(f"   - {failed['component_id']}: {failed['error']}")
        if len(results['failed']) > 5:
            print(f"   ... i {len(results['failed']) - 5} więcej")

    print(f"\n📄 Szczegółowy raport: {report_file}")

if __name__ == "__main__":
    main()