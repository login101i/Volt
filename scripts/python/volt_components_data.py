"""Migracja komponentów i kategorii komponentów do PostgreSQL

Umieść w tym pliku zmienne `COMPONENTS` i `COMPONENT_CATEGORIES` (lista/dict
skopiowana z frontendu). Skrypt spróbuje użyć tych zmiennych z globals() —
czyli możesz wkleić swoje dane powyżej tej logiki w tym samym pliku.

Użycie:
  python scripts/python/volt_components_data.py

Plik korzysta ze zmiennych środowiskowych Postgres (z .env) jak w innych
skryptach w `scripts/python`.
"""

import os
import sys
from dotenv import load_dotenv
import psycopg2
from psycopg2.extras import execute_values

# Załaduj .env
load_dotenv()

DB_CONFIG = {
    'host': os.getenv('POSTGRES_HOST', 'localhost'),
    'port': os.getenv('POSTGRES_PORT', '5432'),
    'database': os.getenv('POSTGRES_DB', 'postgres'),
    'user': os.getenv('POSTGRES_USER', 'postgres'),
    'password': os.getenv('POSTGRES_PASSWORD', '')
}


def get_connection():
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        print(f"✅ Połączono z bazą danych: {DB_CONFIG['database']}@{DB_CONFIG['host']}")
        return conn
    except psycopg2.Error as e:
        print(f"❌ Błąd połączenia: {e}")
        sys.exit(1)


def upsert_components(conn, components):
    """Wstaw/aktualizuj rekordy w tabeli `components`.

    Komponenty powinny mieć pola: id, name, fields, description, price, image
    """
    if not components:
        print("ℹ️  Brak komponentów do przetworzenia")
        return 0

    cur = conn.cursor()
    rows = []
    for c in components:
        rows.append((
            c.get('id'),
            c.get('name'),
            int(c.get('fields', 0)),
            c.get('description'),
            None if c.get('price') is None else float(c.get('price')),
            c.get('image')
        ))

    sql = ("""
    INSERT INTO components (id, name, fields, description, price, image)
    VALUES %s
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      fields = EXCLUDED.fields,
      description = EXCLUDED.description,
      price = EXCLUDED.price,
      image = EXCLUDED.image;
    """)

    try:
        execute_values(cur, sql, rows, template=None)
        conn.commit()
        print(f"✅ Wstawiono/aktualizowano {len(rows)} komponentów")
        cur.close()
        return len(rows)
    except psycopg2.Error as e:
        conn.rollback()
        print(f"❌ Błąd przy wstawianiu komponentów: {e}")
        cur.close()
        return 0


def upsert_categories_and_links(conn, categories):
    """Wstaw kategorie, podkategorie i powiązania komponentów.

    Struktura `categories` powinna odpowiadać ComponentCategory[] z TS:
    - element może mieć `id`, `name`, `components` (lista id komponentów)
    - lub `subcategories`: lista {id, name, components}
    """
    if not categories:
        print("ℹ️  Brak kategorii do przetworzenia")
        return 0

    cur = conn.cursor()
    count_links = 0

    try:
        for cat in categories:
            cat_id = cat.get('id')
            cat_name = cat.get('name')
            # upsert category
            cur.execute(
                """
                INSERT INTO component_categories (id, name)
                VALUES (%s, %s)
                ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;
                """,
                (cat_id, cat_name)
            )

            # direct components in category
            comps = cat.get('components') or []
            for comp_id in comps:
                cur.execute(
                    """
                    INSERT INTO component_category_components (category_id, subcategory_id, component_id)
                    VALUES (%s, NULL, %s)
                    ON CONFLICT (category_id, component_id) DO NOTHING;
                    """,
                    (cat_id, comp_id)
                )
                count_links += 1

            # subcategories
            for sub in cat.get('subcategories') or []:
                sub_id = sub.get('id')
                sub_name = sub.get('name')
                cur.execute(
                    """
                    INSERT INTO component_subcategories (id, category_id, name)
                    VALUES (%s, %s, %s)
                    ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, category_id = EXCLUDED.category_id;
                    """,
                    (sub_id, cat_id, sub_name)
                )

                for comp_id in sub.get('components') or []:
                    cur.execute(
                        """
                        INSERT INTO component_category_components (category_id, subcategory_id, component_id)
                        VALUES (NULL, %s, %s)
                        ON CONFLICT (subcategory_id, component_id) DO NOTHING;
                        """,
                        (sub_id, comp_id)
                    )
                    count_links += 1

        conn.commit()
        print(f"✅ Wstawiono/aktualizowano {len(categories)} kategorii/podkategorii i {count_links} powiązań komponentów")
        cur.close()
        return count_links

    except psycopg2.Error as e:
        conn.rollback()
        print(f"❌ Błąd przy wstawianiu kategorii/powiązań: {e}")
        cur.close()
        return 0


def load_data_from_globals():
    """Sprawdź czy `COMPONENTS` i `COMPONENT_CATEGORIES` są już zdefiniowane
    w tym module (użyteczne gdy wkleisz TS->py listy nad tym kodem).
    """
    comps = globals().get('COMPONENTS') or globals().get('REQUIRED_COMPONENTS')
    cats = globals().get('COMPONENT_CATEGORIES')
    return comps, cats


def main():
    import argparse
    parser = argparse.ArgumentParser(description='Migracja komponentów Volt do PostgreSQL')
    parser.add_argument('--dry', action='store_true', help='Nie wykonuj zapisu, tylko podsumuj')
    args = parser.parse_args()

    comps, cats = load_data_from_globals()
    if comps is None or cats is None:
        print("❗ Nie znaleziono danych COMPONENTS lub COMPONENT_CATEGORIES w module.")
        print("   Wklej listy `COMPONENTS` (lub `REQUIRED_COMPONENTS`) i `COMPONENT_CATEGORIES` nad tym kodem w tym pliku,")
        print("   lub umieść plik JSON/py i załaduj go ręcznie.")
        sys.exit(1)

    print(f"ℹ️  Znaleziono {len(comps)} komponentów i {len(cats)} kategorii (top-level) do migracji")

    if args.dry:
        print("--dry uruchomiony — koniec")
        return

    conn = get_connection()
    try:
        upsert_components(conn, comps)
        upsert_categories_and_links(conn, cats)
        print("\n✅ Migracja komponentów zakończona")
    finally:
        conn.close()


if __name__ == '__main__':
    main()
