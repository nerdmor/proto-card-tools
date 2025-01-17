"""Collection of functions that deal with seeds.
"""
import os

from config import config
from db import get_conn, DictRowFactory
from db.utils import get_dir_paths


def create_seed(table_name:str) -> str:
    """Creates a seed file in the seeds folder. If the table for which the seed
    is being created already exists, prepopulates the file with a boilerplate
    query.

    Args:
        table_name (str): table for which the seed is being created.

    Returns:
        str: path where the new file was written.
    """

    conn = get_conn(False, True)
    cur = conn.cursor(row_factory=DictRowFactory)

    query = f"""
    SELECT  column_name
           ,ordinal_position
      FROM information_schema.columns
     WHERE table_schema = '{config['db']['schema']}'
       AND table_name = %s
     ORDER BY ordinal_position
     ;
    """

    cur.execute(query, (table_name, ))
    column_names = [e['column_name'] for e in cur.fetchall()]
    cur.close()

    seedpath = os.path.join(get_dir_paths()['seeds'], f"{table_name}__seed.sql")
    if os.path.isfile(seedpath):
        raise Exception(f"file '{seedpath}' already exists!")

    with open(seedpath, 'w+', encoding='utf-8') as df:
        df.write("-- seed file\n")
        df.write(f"-- {table_name}\n")
        df.write("-- -----------------------------------------------------------------------------\n\n\n")

        if len(column_names) > 0:
            df.write(f"INSERT\n  INTO {config['db']['schema']}.{table_name}\n")
            cnames = ', '.join([f'"{e}"' for e in column_names])
            df.write(f"       ({cnames})\n")
            df.write("\tVALUES ")
            placeholders = ', '.join([f"'%{{{e}}}s'" for e in column_names])
            df.write(f"({placeholders})\n;")

    return seedpath


def seed():
    """Runs all seed files in the seed folder.
    """
    conn = get_conn()

    dirpath = get_dir_paths()['seeds']
    for fname in os.listdir(dirpath):
        fpath = os.path.join(dirpath, fname)
        if not os.path.isfile(fpath):
            continue
        if fname[-4:] != '.sql':
            continue

        with open(fpath, 'r', encoding='utf-8') as sf:
            query = sf.read()
            cur = conn.cursor()
            cur.execute(query)
            cur.close()
