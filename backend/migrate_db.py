import sqlite3
import os

db_path = 'backend/split_ai.db'

def migrate():
    if not os.path.exists(db_path):
        print(f"Database not found at {db_path}")
        return

    print(f"Migrating database at {db_path}...")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Check current columns
    cursor.execute('PRAGMA table_info(projects);')
    columns = [col[1] for col in cursor.fetchall()]
    print(f"Current columns: {columns}")

    # Add missing columns
    new_columns = [
        ('prompt', 'TEXT'),
        ('description', 'TEXT'),
        ('design_image_b64', 'TEXT'),
        ('plan_json', 'TEXT')
    ]

    for col_name, col_type in new_columns:
        if col_name not in columns:
            print(f"Adding column {col_name}...")
            try:
                cursor.execute(f'ALTER TABLE projects ADD COLUMN {col_name} {col_type};')
                print(f"[SUCCESS] Column {col_name} added successfully.")
            except Exception as e:
                print(f"[FAILURE] Failed to add column {col_name}: {e}")
        else:
            print(f"Column {col_name} already exists.")

    conn.commit()
    conn.close()
    print("Migration complete.")

if __name__ == "__main__":
    migrate()
