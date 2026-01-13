"""
Tworzenie schematu bazy danych dla aplikacji Volt
Migracja danych z TypeScript do PostgreSQL

Tabele:
- circuit_templates - szablony obwodów elektrycznych
- fuse_types - typy bezpieczników (1-fazowe i 3-fazowe)
- components - komponenty elektryczne
- component_categories - kategorie komponentów
- component_subcategories - podkategorie komponentów
- component_category_components - relacja wiele-do-wielu (kategorie <-> komponenty)
"""

import os
import sys
from dotenv import load_dotenv
import psycopg2
from psycopg2.extras import RealDictCursor

# Załaduj zmienne środowiskowe
load_dotenv()

DB_CONFIG = {
    'host': os.getenv('POSTGRES_HOST', 'localhost'),
    'port': os.getenv('POSTGRES_PORT', '5432'),
    'database': os.getenv('POSTGRES_DB', 'postgres'),
    'user': os.getenv('POSTGRES_USER', 'postgres'),
    'password': os.getenv('POSTGRES_PASSWORD', '')
}


def get_connection():
    """Utwórz połączenie z bazą danych"""
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        print(f"✅ Połączono z bazą danych: {DB_CONFIG['database']}@{DB_CONFIG['host']}")
        return conn
    except psycopg2.Error as e:
        print(f"❌ Błąd połączenia: {e}")
        sys.exit(1)


def create_schema(conn):
    """Utwórz wszystkie tabele"""
    print("\n" + "="*60)
    print("Tworzenie schematu bazy danych Volt")
    print("="*60)
    
    cur = conn.cursor()
    
    try:
        # 1. Tabela circuit_templates - szablony obwodów
        print("\n📋 Tworzenie tabeli circuit_templates...")
        cur.execute("""
        CREATE TABLE IF NOT EXISTS circuit_templates (
            id SERIAL PRIMARY KEY,
            description VARCHAR(255) NOT NULL,
            zone VARCHAR(20) NOT NULL CHECK (zone IN ('Parter', 'Piętro')),
            voltage INTEGER NOT NULL,
            cable VARCHAR(100) NOT NULL,
            power DECIMAL(10,2) NOT NULL,
            phase VARCHAR(10) NOT NULL CHECK (phase IN ('L1', 'L2', 'L3', '3Φ')),
            type VARCHAR(10) NOT NULL CHECK (type IN ('1φ', '3φ')),
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        );
        """)
        print("✅ Tabela circuit_templates utworzona")
        
        # 2. Tabela fuse_types - typy bezpieczników
        print("\n📋 Tworzenie tabeli fuse_types...")
        cur.execute("""
        CREATE TABLE IF NOT EXISTS fuse_types (
            id SERIAL PRIMARY KEY,
            fuse_type VARCHAR(20) NOT NULL UNIQUE,
            phase_type VARCHAR(10) NOT NULL CHECK (phase_type IN ('1φ', '3φ')),
            created_at TIMESTAMP DEFAULT NOW()
        );
        """)
        print("✅ Tabela fuse_types utworzona")
        
        # 3. Tabela components - komponenty elektryczne
        print("\n📋 Tworzenie tabeli components...")
        cur.execute("""
        CREATE TABLE IF NOT EXISTS components (
            id VARCHAR(100) PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            fields INTEGER NOT NULL,
            description TEXT,
            price DECIMAL(10,2),
            image VARCHAR(500),
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        );
        """)
        print("✅ Tabela components utworzona")
        
        # 4. Tabela component_categories - kategorie komponentów
        print("\n📋 Tworzenie tabeli component_categories...")
        cur.execute("""
        CREATE TABLE IF NOT EXISTS component_categories (
            id VARCHAR(100) PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        );
        """)
        print("✅ Tabela component_categories utworzona")
        
        # 5. Tabela component_subcategories - podkategorie
        print("\n📋 Tworzenie tabeli component_subcategories...")
        cur.execute("""
        CREATE TABLE IF NOT EXISTS component_subcategories (
            id VARCHAR(100) PRIMARY KEY,
            category_id VARCHAR(100) NOT NULL REFERENCES component_categories(id) ON DELETE CASCADE,
            name VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        );
        """)
        print("✅ Tabela component_subcategories utworzona")
        
        # 6. Tabela component_category_components - relacja kategoria <-> komponent (bezpośrednio w kategorii)
        print("\n📋 Tworzenie tabeli component_category_components...")
        cur.execute("""
        CREATE TABLE IF NOT EXISTS component_category_components (
            id SERIAL PRIMARY KEY,
            category_id VARCHAR(100) REFERENCES component_categories(id) ON DELETE CASCADE,
            subcategory_id VARCHAR(100) REFERENCES component_subcategories(id) ON DELETE CASCADE,
            component_id VARCHAR(100) NOT NULL REFERENCES components(id) ON DELETE CASCADE,
            created_at TIMESTAMP DEFAULT NOW(),
            CONSTRAINT unique_category_component UNIQUE (category_id, component_id),
            CONSTRAINT unique_subcategory_component UNIQUE (subcategory_id, component_id),
            CONSTRAINT check_category_or_subcategory CHECK (
                (category_id IS NOT NULL AND subcategory_id IS NULL) OR
                (category_id IS NULL AND subcategory_id IS NOT NULL)
            )
        );
        """)
        print("✅ Tabela component_category_components utworzona")
        
        # Indeksy dla lepszej wydajności
        print("\n📋 Tworzenie indeksów...")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_circuit_templates_zone ON circuit_templates(zone);")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_circuit_templates_type ON circuit_templates(type);")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_fuse_types_phase_type ON fuse_types(phase_type);")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_component_subcategories_category ON component_subcategories(category_id);")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_component_category_components_category ON component_category_components(category_id);")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_component_category_components_subcategory ON component_category_components(subcategory_id);")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_component_category_components_component ON component_category_components(component_id);")
        print("✅ Indeksy utworzone")
        
        # Funkcja do aktualizacji updated_at
        cur.execute("""
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $$ language 'plpgsql';
        """)
        
        # Triggery dla updated_at
        cur.execute("""
        DROP TRIGGER IF EXISTS update_circuit_templates_updated_at ON circuit_templates;
        CREATE TRIGGER update_circuit_templates_updated_at
            BEFORE UPDATE ON circuit_templates
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        """)
        
        cur.execute("""
        DROP TRIGGER IF EXISTS update_components_updated_at ON components;
        CREATE TRIGGER update_components_updated_at
            BEFORE UPDATE ON components
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        """)
        
        cur.execute("""
        DROP TRIGGER IF EXISTS update_component_categories_updated_at ON component_categories;
        CREATE TRIGGER update_component_categories_updated_at
            BEFORE UPDATE ON component_categories
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        """)
        
        cur.execute("""
        DROP TRIGGER IF EXISTS update_component_subcategories_updated_at ON component_subcategories;
        CREATE TRIGGER update_component_subcategories_updated_at
            BEFORE UPDATE ON component_subcategories
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        """)
        print("✅ Triggery dla updated_at utworzone")
        
        conn.commit()
        print("\n✅ Schemat bazy danych utworzony pomyślnie!")
        cur.close()
        return True
        
    except psycopg2.Error as e:
        conn.rollback()
        print(f"\n❌ Błąd podczas tworzenia schematu: {e}")
        cur.close()
        return False


def drop_schema(conn):
    """Usuń wszystkie tabele (CASCADE)"""
    print("\n" + "="*60)
    print("Usuwanie schematu bazy danych Volt")
    print("="*60)
    
    response = input("⚠️  Czy na pewno chcesz usunąć wszystkie tabele? (tak/nie): ").strip().lower()
    
    if response not in ['tak', 'yes', 'y', 't']:
        print("❌ Anulowano")
        return False
    
    cur = conn.cursor()
    
    try:
        tables = [
            'component_category_components',
            'component_subcategories',
            'component_categories',
            'components',
            'fuse_types',
            'circuit_templates'
        ]
        
        for table in tables:
            cur.execute(f"DROP TABLE IF EXISTS {table} CASCADE;")
            print(f"✅ Usunięto tabelę: {table}")
        
        conn.commit()
        print("\n✅ Wszystkie tabele usunięte")
        cur.close()
        return True
        
    except psycopg2.Error as e:
        conn.rollback()
        print(f"\n❌ Błąd podczas usuwania: {e}")
        cur.close()
        return False


def main():
    """Główna funkcja"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Zarządzanie schematem bazy danych Volt')
    parser.add_argument('--drop', action='store_true', help='Usuń istniejące tabele przed utworzeniem')
    args = parser.parse_args()
    
    conn = get_connection()
    
    try:
        if args.drop:
            drop_schema(conn)
        
        create_schema(conn)
        
        print("\n" + "="*60)
        print("✅ Zakończono pomyślnie!")
        print("="*60)
        print("\nNastępny krok:")
        print("Uruchom: python scripts/python/migrate_volt_data.py")
        print("="*60)
        
    except Exception as e:
        print(f"\n❌ Nieoczekiwany błąd: {e}")
    finally:
        conn.close()
        print("\n🔌 Połączenie zamknięte")


if __name__ == "__main__":
    main()


