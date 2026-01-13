"""
Migracja danych z TypeScript do PostgreSQL
Import danych do tabel: circuit_templates, fuse_types, components, component_categories

Użycie:
1. Najpierw utwórz schemat: python scripts/python/create_volt_schema.py
2. Potem uruchom migrację: python scripts/python/migrate_volt_data.py
"""

import os
import sys
from dotenv import load_dotenv
import psycopg2
from psycopg2.extras import RealDictCursor, execute_values

# Załaduj zmienne środowiskowe
load_dotenv()

DB_CONFIG = {
    'host': os.getenv('POSTGRES_HOST', 'localhost'),
    'port': os.getenv('POSTGRES_PORT', '5432'),
    'database': os.getenv('POSTGRES_DB', 'postgres'),
    'user': os.getenv('POSTGRES_USER', 'postgres'),
    'password': os.getenv('POSTGRES_PASSWORD', '')
}

# Dane do migracji - FUSE_TYPES
FUSE_TYPES_1PHASE = ['6A', '10A', '13A', '16A', '20A', '25A', '32A', '40A', '50A', '63A']
FUSE_TYPES_3PHASE = ['16A', '20A', '25A', '32A', '40A', '50A', '63A', '80A', '100A', '125A']

# Dane do migracji - CIRCUIT_TEMPLATES
CIRCUIT_TEMPLATES = [
    {'description': 'Gniazda kuchnia piekarnik', 'zone': 'Parter', 'voltage': 230, 'cable': 'YDYpżo 3x2,5', 'power': 2, 'phase': 'L1', 'type': '1φ'},
    {'description': 'Gniazda kuchnia zmywarka', 'zone': 'Parter', 'voltage': 230, 'cable': 'YDYpżo 3x2,5', 'power': 2, 'phase': 'L1', 'type': '1φ'},
    {'description': 'Gniazda kuchnia lodówka', 'zone': 'Parter', 'voltage': 230, 'cable': 'YDYpżo 3x2,5', 'power': 2, 'phase': 'L2', 'type': '1φ'},
    {'description': 'Zasilenie płyta indukcyjna', 'zone': 'Parter', 'voltage': 230, 'cable': 'YDYpżo 5x4', 'power': 7.5, 'phase': '3Φ', 'type': '3φ'},
    {'description': 'Gniazda garaż', 'zone': 'Parter', 'voltage': 230, 'cable': 'YDYpżo 3x2,5', 'power': 2, 'phase': 'L3', 'type': '1φ'},
    {'description': 'Gniazda kotłownia', 'zone': 'Parter', 'voltage': 230, 'cable': 'YDYpżo 3x2,5', 'power': 2, 'phase': 'L1', 'type': '1φ'},
    {'description': 'Kotłownia – bojler', 'zone': 'Parter', 'voltage': 230, 'cable': 'YDYpżo 3x2,5', 'power': 2, 'phase': 'L2', 'type': '1φ'},
    {'description': 'Oświetlenie zewnętrzne', 'zone': 'Parter', 'voltage': 230, 'cable': 'YDYpżo 3x1,5', 'power': 0.5, 'phase': 'L3', 'type': '1φ'},
    {'description': 'Brama wjazdowa', 'zone': 'Parter', 'voltage': 230, 'cable': 'YDYpżo 3x2,5', 'power': 1, 'phase': 'L1', 'type': '1φ'},
    {'description': 'Gniazda hol / strych', 'zone': 'Piętro', 'voltage': 230, 'cable': 'YDYpżo 3x2,5', 'power': 2, 'phase': 'L1', 'type': '1φ'},
    {'description': 'Gniazda strych', 'zone': 'Piętro', 'voltage': 230, 'cable': 'YDYpżo 3x2,5', 'power': 2, 'phase': 'L2', 'type': '1φ'},
    {'description': 'Rekuperator', 'zone': 'Piętro', 'voltage': 230, 'cable': 'YDYpżo 3x2,5', 'power': 1.5, 'phase': 'L3', 'type': '1φ'},
    {'description': 'Zasilanie alarm', 'zone': 'Piętro', 'voltage': 230, 'cable': 'YDYpżo 3x1,5', 'power': 0.5, 'phase': 'L1', 'type': '1φ'},
    {'description': 'Zasilanie tablica multimedialna', 'zone': 'Piętro', 'voltage': 230, 'cable': 'YDYpżo 3x2,5', 'power': 1, 'phase': 'L2', 'type': '1φ'},
    {'description': 'Gniazdo 400V', 'zone': 'Parter', 'voltage': 400, 'cable': 'YDYpżo 5x4', 'power': 5, 'phase': '3Φ', 'type': '3φ'},
    {'description': 'Rolety parter', 'zone': 'Parter', 'voltage': 230, 'cable': 'YDYpżo 3x1,5', 'power': 0.5, 'phase': 'L3', 'type': '1φ'},
    {'description': 'Oświetlenie LED', 'zone': 'Parter', 'voltage': 230, 'cable': 'OMY 2x0,5', 'power': 0.1, 'phase': 'L1', 'type': '1φ'},
    {'description': 'Oświetlenie LED', 'zone': 'Piętro', 'voltage': 230, 'cable': 'OMY 2x0,5', 'power': 0.1, 'phase': 'L2', 'type': '1φ'},
    {'description': 'Oświetlenie punktowe', 'zone': 'Parter', 'voltage': 230, 'cable': 'OMY 2x0,75', 'power': 0.2, 'phase': 'L1', 'type': '1φ'},
    {'description': 'Oświetlenie punktowe', 'zone': 'Piętro', 'voltage': 230, 'cable': 'OMY 2x0,75', 'power': 0.2, 'phase': 'L2', 'type': '1φ'},
    {'description': 'Włącznik światła', 'zone': 'Parter', 'voltage': 230, 'cable': 'OMY 2x1', 'power': 0.1, 'phase': 'L1', 'type': '1φ'},
    {'description': 'Włącznik światła', 'zone': 'Piętro', 'voltage': 230, 'cable': 'OMY 2x1', 'power': 0.1, 'phase': 'L2', 'type': '1φ'},
    {'description': 'Gniazdo słabe prądy', 'zone': 'Parter', 'voltage': 230, 'cable': 'OMY 3x1', 'power': 0.5, 'phase': 'L1', 'type': '1φ'},
    {'description': 'Gniazdo słabe prądy', 'zone': 'Piętro', 'voltage': 230, 'cable': 'OMY 3x1', 'power': 0.5, 'phase': 'L2', 'type': '1φ'},
    {'description': 'Zasilanie czujniki', 'zone': 'Parter', 'voltage': 230, 'cable': 'OMY 2x0,5', 'power': 0.05, 'phase': 'L3', 'type': '1φ'},
    {'description': 'Zasilanie czujniki', 'zone': 'Piętro', 'voltage': 230, 'cable': 'OMY 2x0,5', 'power': 0.05, 'phase': 'L1', 'type': '1φ'},
    {'description': 'Instalacja alarmowa', 'zone': 'Parter', 'voltage': 230, 'cable': 'OMY 4x0,75', 'power': 0.3, 'phase': 'L1', 'type': '1φ'},
    {'description': 'Instalacja alarmowa', 'zone': 'Piętro', 'voltage': 230, 'cable': 'OMY 4x0,75', 'power': 0.3, 'phase': 'L2', 'type': '1φ'},
    {'description': 'Sterowanie roletami', 'zone': 'Parter', 'voltage': 230, 'cable': 'OMYp 3x0,75', 'power': 0.2, 'phase': 'L3', 'type': '1φ'},
    {'description': 'Sterowanie roletami', 'zone': 'Piętro', 'voltage': 230, 'cable': 'OMYp 3x0,75', 'power': 0.2, 'phase': 'L1', 'type': '1φ'},
    {'description': 'Gniazdo słabe prądy 1,5mm²', 'zone': 'Parter', 'voltage': 230, 'cable': 'OMY 3x1,5', 'power': 1, 'phase': 'L1', 'type': '1φ'},
    {'description': 'Gniazdo słabe prądy 1,5mm²', 'zone': 'Piętro', 'voltage': 230, 'cable': 'OMY 3x1,5', 'power': 1, 'phase': 'L2', 'type': '1φ'},
    {'description': 'Instalacja multimedialna', 'zone': 'Parter', 'voltage': 230, 'cable': 'OMYp 4x0,75', 'power': 0.2, 'phase': 'L2', 'type': '1φ'},
    {'description': 'Instalacja multimedialna', 'zone': 'Piętro', 'voltage': 230, 'cable': 'OMYp 4x0,75', 'power': 0.2, 'phase': 'L3', 'type': '1φ'},
]

# Dane COMPONENTS i CATEGORIES - z powodu limitu rozmiaru, importuję z osobnego pliku
# Na razie stworzę podstawową strukturę - pełne dane wymagają osobnego pliku
# Zobacz: scripts/python/volt_data.py (będzie utworzony w następnym kroku)


def get_connection():
    """Utwórz połączenie z bazą danych"""
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        print(f"✅ Połączono z bazą danych: {DB_CONFIG['database']}@{DB_CONFIG['host']}")
        return conn
    except psycopg2.Error as e:
        print(f"❌ Błąd połączenia: {e}")
        sys.exit(1)


def migrate_fuse_types(conn):
    """Migracja typów bezpieczników"""
    print("\n" + "="*60)
    print("Migracja fuse_types")
    print("="*60)
    
    cur = conn.cursor()
    
    try:
        # Wyczyść istniejące dane
        cur.execute("DELETE FROM fuse_types;")
        
        # Wstaw 1-fazowe
        for fuse_type in FUSE_TYPES_1PHASE:
            cur.execute("""
                INSERT INTO fuse_types (fuse_type, phase_type)
                VALUES (%s, '1φ')
                ON CONFLICT (fuse_type) DO NOTHING;
            """, (fuse_type,))
        
        # Wstaw 3-fazowe
        for fuse_type in FUSE_TYPES_3PHASE:
            cur.execute("""
                INSERT INTO fuse_types (fuse_type, phase_type)
                VALUES (%s, '3φ')
                ON CONFLICT (fuse_type) DO NOTHING;
            """, (fuse_type,))
        
        conn.commit()
        print(f"✅ Wstawiono {len(FUSE_TYPES_1PHASE)} typów 1-fazowych")
        print(f"✅ Wstawiono {len(FUSE_TYPES_3PHASE)} typów 3-fazowych")
        cur.close()
        return True
        
    except psycopg2.Error as e:
        conn.rollback()
        print(f"❌ Błąd: {e}")
        cur.close()
        return False


def migrate_circuit_templates(conn):
    """Migracja szablonów obwodów"""
    print("\n" + "="*60)
    print("Migracja circuit_templates")
    print("="*60)
    
    cur = conn.cursor()
    
    try:
        # Wyczyść istniejące dane
        cur.execute("DELETE FROM circuit_templates;")
        
        # Wstaw dane
        for template in CIRCUIT_TEMPLATES:
            cur.execute("""
                INSERT INTO circuit_templates (description, zone, voltage, cable, power, phase, type)
                VALUES (%s, %s, %s, %s, %s, %s, %s);
            """, (
                template['description'],
                template['zone'],
                template['voltage'],
                template['cable'],
                template['power'],
                template['phase'],
                template['type']
            ))
        
        conn.commit()
        print(f"✅ Wstawiono {len(CIRCUIT_TEMPLATES)} szablonów obwodów")
        cur.close()
        return True
        
    except psycopg2.Error as e:
        conn.rollback()
        print(f"❌ Błąd: {e}")
        cur.close()
        return False


def main():
    """Główna funkcja migracji"""
    print("\n" + "="*60)
    print("Migracja danych Volt do PostgreSQL")
    print("="*60)
    
    conn = get_connection()
    
    try:
        # Migruj dane
        migrate_fuse_types(conn)
        migrate_circuit_templates(conn)
        
        print("\n" + "="*60)
        print("✅ Migracja podstawowych danych zakończona!")
        print("="*60)
        print("\n⚠️  Uwaga: Komponenty i kategorie wymagają osobnego pliku")
        print("   Ze względu na rozmiar danych, utwórz plik scripts/python/volt_components_data.py")
        print("   z danymi COMPONENTS i COMPONENT_CATEGORIES")
        print("="*60)
        
    except Exception as e:
        print(f"\n❌ Nieoczekiwany błąd: {e}")
        import traceback
        traceback.print_exc()
    finally:
        conn.close()
        print("\n🔌 Połączenie zamknięte")


if __name__ == "__main__":
    main()


