import os
from datetime import datetime

from db import get_conn, DictRowFactory
from db.utils import ensure_directories, get_dir_paths


def migrate():
    """Ensure tables for migrations and actrually migrates everything in
    db/migrations
    """
    # preparation: connecting to DB exclusively
    conn = get_conn(True)

    # step 1: ensuring we have the needed tables
    queries = [
        """CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR (256) NOT NULL,
        run_at TIMESTAMP NOT NULL DEFAULT NOW()
        );
        """,
        """CREATE TABLE IF NOT EXISTS seeds (
        id SERIAL PRIMARY KEY,
        filename VARCHAR (256) NOT NULL,
        run_at TIMESTAMP NOT NULL DEFAULT NOW()
        );
        """
    ]

    for query in queries:
        conn.execute(query)
        

    # step 2: making sure that we have the folders that we need
    ensure_directories()
    
    # step 3: listing migrations to run
    query = """
    SELECT id, filename, run_at
    FROM migrations
    WHERE filename = %s
    """
    cur = conn.cursor(row_factory=DictRowFactory)
    
    dirpath = get_dir_paths()['migrations']
    migrations_to_run = []
    for fname in os.listdir(dirpath):
        if not os.path.isfile(os.path.join(dirpath, fname)):
            continue
        cur.execute(query, (fname, ))
        res = cur.fetchall()
        if len(res) > 1:
            continue
        
        migrations_to_run.append(fname)
    cur.close()
    
    query = """
    INSERT INTO public.migrations
    (filename, run_at)
    VALUES(%s, now());
    """
    for fname in migrations_to_run:
        print(f"trying to run {fname}")
        with open(os.path.join(dirpath, fname), 'r', encoding='utf-8') as f:
            mig_query = f.read()
            try:
                conn.execute(mig_query)
                conn.execute(query, (fname, ))
                print("\tSUCCESS!")
            except Exception as e:
                print(f"\tERROR: {e}")


def create_migration(name):
    fname = f"{datetime.now().strftime('%Y%m%d%H%M%S')}__{name}.sql"
    fpath = os.path.join(get_dir_paths()['migrations'], fname)
    with open(fpath, 'w+', encoding='utf-8') as df:
        df.write("-- migration file\n")
        df.write(f"-- {fname}\n")
        df.write("-- -----------------------------------------------------------------------------\n\n\n")
    return fpath