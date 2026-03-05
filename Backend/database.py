import sqlite3
from datetime import datetime
import time
from functools import wraps

# SQLite uses a local file instead of a host/user config
DB_FILE = "pet_game.db"

def get_connection():
    try:
        # check_same_thread=False allows sharing the connection if needed
        conn = sqlite3.connect(DB_FILE, check_same_thread=False)
        return conn
    except Exception as e:
        print(f"❌ Failed to connect to SQLite: {e}")
        return None

def retry_db(max_retries=3, delay=2):
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            for i in range(max_retries):
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    if i == max_retries - 1: raise e
                    print(f"⚠️ {func.__name__} attempt {i+1} failed. Retrying...")
                    time.sleep(delay)
        return wrapper
    return decorator

@retry_db()
def init_db():
    with get_connection() as conn:
        cursor = conn.cursor()
        # User table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                phone TEXT PRIMARY KEY,
                user_name TEXT,
                pet_name TEXT,
                hunger INTEGER,
                is_sleep INTEGER
            )
        ''')
        # Stats table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS summary_stats (
                date TEXT,
                start_hour INTEGER,
                action_type TEXT,
                click_count INTEGER DEFAULT 0,
                PRIMARY KEY (date, start_hour, action_type)
            )
        ''')
        conn.commit()

@retry_db()
def log_action_smart(action_type):
    now = datetime.now()
    date_str = now.strftime('%Y-%m-%d')
    hour_slot = (now.hour // 3) * 3
    
    with get_connection() as conn:
        cursor = conn.cursor()
        # SQLite Upsert syntax (ON CONFLICT)
        sql = """
            INSERT INTO summary_stats (date, start_hour, action_type, click_count)
            VALUES (?, ?, ?, 1)
            ON CONFLICT(date, start_hour, action_type) 
            DO UPDATE SET click_count = click_count + 1
        """
        cursor.execute(sql, (date_str, hour_slot, action_type))
        conn.commit()

@retry_db()
def save_user_pet(phone, user_name, pet_name, hunger, is_sleep):
    with get_connection() as conn:
        cursor = conn.cursor()
        # SQLite UPSERT for users
        sql = '''
            INSERT INTO users (phone, user_name, pet_name, hunger, is_sleep)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(phone) 
            DO UPDATE SET hunger=excluded.hunger, is_sleep=excluded.is_sleep
        '''
        cursor.execute(sql, (phone, user_name, pet_name, hunger, int(is_sleep)))
        conn.commit()

def get_user_pet(phone):
    try:
        with get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT user_name, pet_name, hunger, is_sleep FROM users WHERE phone = ?", (phone,))
            return cursor.fetchone()
    except Exception as e:
        print(f"Database Read Error: {e}")
        return None
    

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)