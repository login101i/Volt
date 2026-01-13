"""
PostgreSQL CRUD Operations - Data Engineer Roadmap Week 2
Inspekcja bazowych operacji CRUD przez Python

Wymagania:
- psycopg2-binary
- python-dotenv

Użycie:
1. Utwórz plik .env z danymi połączenia (zobacz .env.example)
2. Uruchom: python scripts/python/postgres_crud.py
"""

import os
import sys
from datetime import datetime
from dotenv import load_dotenv
import psycopg2
from psycopg2.extras import RealDictCursor
from psycopg2 import sql

# Załaduj zmienne środowiskowe z .env
load_dotenv()

# Konfiguracja połączenia z PostgreSQL
DB_CONFIG = {
    'host': os.getenv('POSTGRES_HOST', 'localhost'),
    'port': os.getenv('POSTGRES_PORT', '5432'),
    'database': os.getenv('POSTGRES_DB', 'postgres'),
    'user': os.getenv('POSTGRES_USER', 'postgres'),
    'password': os.getenv('POSTGRES_PASSWORD', '')
}


def get_connection():
    """Utwórz połączenie z bazą danych PostgreSQL"""
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        print(f"✅ Połączono z bazą danych: {DB_CONFIG['database']}@{DB_CONFIG['host']}")
        return conn
    except psycopg2.Error as e:
        print(f"❌ Błąd połączenia z bazą danych: {e}")
        sys.exit(1)


def create_table(conn):
    """CREATE: Utwórz tabelę testową"""
    print("\n" + "="*60)
    print("CREATE TABLE - Tworzenie tabeli testowej")
    print("="*60)
    
    try:
        cur = conn.cursor()
        
        # Utwórz tabelę testową
        create_table_query = """
        CREATE TABLE IF NOT EXISTS volt_test_users (
            id SERIAL PRIMARY KEY,
            email VARCHAR(255) UNIQUE NOT NULL,
            name VARCHAR(100),
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        );
        """
        
        cur.execute(create_table_query)
        conn.commit()
        print("✅ Tabela 'volt_test_users' utworzona pomyślnie")
        
        # Utwórz funkcję do automatycznego aktualizowania updated_at
        update_trigger_function = """
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $$ language 'plpgsql';
        """
        
        trigger_query = """
        DROP TRIGGER IF EXISTS update_volt_test_users_updated_at ON volt_test_users;
        CREATE TRIGGER update_volt_test_users_updated_at
            BEFORE UPDATE ON volt_test_users
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
        """
        
        cur.execute(update_trigger_function)
        cur.execute(trigger_query)
        conn.commit()
        print("✅ Trigger dla updated_at utworzony")
        
        cur.close()
        return True
        
    except psycopg2.Error as e:
        conn.rollback()
        print(f"❌ Błąd podczas tworzenia tabeli: {e}")
        return False


def insert_data(conn):
    """INSERT: Wstaw dane do tabeli"""
    print("\n" + "="*60)
    print("INSERT - Wstawianie danych")
    print("="*60)
    
    try:
        cur = conn.cursor()
        
        # Przykładowe dane do wstawienia
        test_users = [
            ('john.doe@example.com', 'John Doe'),
            ('jane.smith@example.com', 'Jane Smith'),
            ('bob.wilson@example.com', 'Bob Wilson'),
        ]
        
        insert_query = """
        INSERT INTO volt_test_users (email, name)
        VALUES (%s, %s)
        ON CONFLICT (email) DO UPDATE SET
            name = EXCLUDED.name,
            updated_at = NOW()
        RETURNING id, email, name, created_at;
        """
        
        inserted_count = 0
        for email, name in test_users:
            cur.execute(insert_query, (email, name))
            result = cur.fetchone()
            if result:
                inserted_count += 1
                print(f"  ✅ Wstawiono: ID={result[0]}, Email={result[1]}, Name={result[2]}")
        
        conn.commit()
        print(f"\n✅ Wstawiono {inserted_count} rekordów")
        cur.close()
        return True
        
    except psycopg2.Error as e:
        conn.rollback()
        print(f"❌ Błąd podczas wstawiania danych: {e}")
        return False


def read_data(conn):
    """SELECT: Odczytaj dane z tabeli"""
    print("\n" + "="*60)
    print("SELECT - Odczytywanie danych")
    print("="*60)
    
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # SELECT wszystkie rekordy
        select_all_query = """
        SELECT id, email, name, created_at, updated_at
        FROM volt_test_users
        ORDER BY created_at DESC;
        """
        
        cur.execute(select_all_query)
        all_users = cur.fetchall()
        
        print(f"\n📊 Wszystkie rekordy ({len(all_users)}):")
        for user in all_users:
            print(f"  ID: {user['id']}, Email: {user['email']}, Name: {user['name']}, "
                  f"Created: {user['created_at']}")
        
        # SELECT z warunkiem WHERE
        if all_users:
            first_user_id = all_users[0]['id']
            select_one_query = """
            SELECT id, email, name, created_at, updated_at
            FROM volt_test_users
            WHERE id = %s;
            """
            cur.execute(select_one_query, (first_user_id,))
            one_user = cur.fetchone()
            
            print(f"\n🔍 Pojedynczy rekord (WHERE id = {first_user_id}):")
            if one_user:
                print(f"  ID: {one_user['id']}, Email: {one_user['email']}, "
                      f"Name: {one_user['name']}")
        
        # SELECT z COUNT
        count_query = "SELECT COUNT(*) as total FROM volt_test_users;"
        cur.execute(count_query)
        count_result = cur.fetchone()
        print(f"\n📈 Łączna liczba rekordów: {count_result['total']}")
        
        cur.close()
        return True
        
    except psycopg2.Error as e:
        print(f"❌ Błąd podczas odczytywania danych: {e}")
        return False


def update_data(conn):
    """UPDATE: Zaktualizuj dane w tabeli"""
    print("\n" + "="*60)
    print("UPDATE - Aktualizacja danych")
    print("="*60)
    
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # Znajdź pierwszy rekord
        cur.execute("SELECT id, email, name FROM volt_test_users LIMIT 1;")
        user = cur.fetchone()
        
        if not user:
            print("⚠️  Brak danych do aktualizacji")
            cur.close()
            return False
        
        old_name = user['name']
        new_name = f"{old_name} (Updated)"
        
        # UPDATE
        update_query = """
        UPDATE volt_test_users
        SET name = %s
        WHERE id = %s
        RETURNING id, email, name, updated_at;
        """
        
        cur.execute(update_query, (new_name, user['id']))
        updated_user = cur.fetchone()
        conn.commit()
        
        if updated_user:
            print(f"✅ Zaktualizowano rekord:")
            print(f"   ID: {updated_user['id']}")
            print(f"   Email: {updated_user['email']}")
            print(f"   Name: '{old_name}' → '{updated_user['name']}'")
            print(f"   Updated at: {updated_user['updated_at']}")
        
        cur.close()
        return True
        
    except psycopg2.Error as e:
        conn.rollback()
        print(f"❌ Błąd podczas aktualizacji danych: {e}")
        return False


def delete_data(conn):
    """DELETE: Usuń dane z tabeli"""
    print("\n" + "="*60)
    print("DELETE - Usuwanie danych")
    print("="*60)
    
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # Znajdź ostatni rekord
        cur.execute("SELECT id, email, name FROM volt_test_users ORDER BY id DESC LIMIT 1;")
        user = cur.fetchone()
        
        if not user:
            print("⚠️  Brak danych do usunięcia")
            cur.close()
            return False
        
        user_id = user['id']
        user_email = user['email']
        
        # DELETE
        delete_query = "DELETE FROM volt_test_users WHERE id = %s RETURNING id, email;"
        cur.execute(delete_query, (user_id,))
        deleted_user = cur.fetchone()
        conn.commit()
        
        if deleted_user:
            print(f"✅ Usunięto rekord:")
            print(f"   ID: {deleted_user['id']}")
            print(f"   Email: {deleted_user['email']}")
        
        # Pokaż pozostałe rekordy
        cur.execute("SELECT COUNT(*) as total FROM volt_test_users;")
        count_result = cur.fetchone()
        print(f"\n📊 Pozostałe rekordy w tabeli: {count_result['total']}")
        
        cur.close()
        return True
        
    except psycopg2.Error as e:
        conn.rollback()
        print(f"❌ Błąd podczas usuwania danych: {e}")
        return False


def cleanup_table(conn):
    """Czyszczenie: Usuń tabelę testową (opcjonalne)"""
    print("\n" + "="*60)
    print("CLEANUP - Czyszczenie tabeli testowej (opcjonalne)")
    print("="*60)
    
    response = input("Czy chcesz usunąć tabelę 'volt_test_users'? (tak/nie): ").strip().lower()
    
    if response in ['tak', 'yes', 'y', 't']:
        try:
            cur = conn.cursor()
            cur.execute("DROP TABLE IF EXISTS volt_test_users CASCADE;")
            conn.commit()
            print("✅ Tabela 'volt_test_users' usunięta")
            cur.close()
        except psycopg2.Error as e:
            conn.rollback()
            print(f"❌ Błąd podczas usuwania tabeli: {e}")
    else:
        print("ℹ️  Tabela 'volt_test_users' zachowana")


def main():
    """Główna funkcja wykonująca wszystkie operacje CRUD"""
    print("\n" + "="*60)
    print("PostgreSQL CRUD Operations - Data Engineer Roadmap")
    print("Tydzień 2: SQL & Model Danych")
    print("="*60)
    
    # Połącz z bazą danych
    conn = get_connection()
    
    try:
        # Wykonaj wszystkie operacje CRUD
        create_table(conn)
        insert_data(conn)
        read_data(conn)
        update_data(conn)
        read_data(conn)  # Odczytaj ponownie po aktualizacji
        delete_data(conn)
        read_data(conn)  # Odczytaj po usunięciu
        
        # Opcjonalne czyszczenie
        cleanup_table(conn)
        
        print("\n" + "="*60)
        print("✅ Inspekcja operacji CRUD zakończona pomyślnie!")
        print("="*60)
        
    except Exception as e:
        print(f"\n❌ Nieoczekiwany błąd: {e}")
        
    finally:
        # Zamknij połączenie
        conn.close()
        print("\n🔌 Połączenie z bazą danych zamknięte")


if __name__ == "__main__":
    main()

