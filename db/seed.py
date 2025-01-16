import os

from db import get_conn, DictRowFactory
from db.utils import get_dir_paths


def create_seed(table_name:str) -> str:
    """_summary_

    Args:
        table_name (str): _description_

    Returns:
        str: _description_
    """
    
    conn = get_conn(False, True)
    cur = conn.cursor(row_factory=DictRowFactory)
    
    query = """
    SELECT  column_name
           ,ordinal_position 
      FROM information_schema.columns
     WHERE table_schema = 'public'
       AND table_name = %s
     ORDER BY ordinal_position
     ;
    """
    
    cur.execute(query, (table_name, ))
    column_names = [e for e in cur.fetchall()]
    cur.close()
    
    seedpath = os.path.join(get_dir_paths()['seeds'], f"{table_name}__seed.sql")
    if os.path.isfile(seedpath):
        raise Exception(f"file '{seedpath}' already exists!")
    
    with open(seedpath, 'w+', encoding='utf-8') as df:
        df.write("-- seed file\n")
        df.write(f"-- {table_name}\n")
        df.write("-- -----------------------------------------------------------------------------\n\n\n")
        
        if len(column_names) > 0:
            df.write(f"INSERT INTO public.{table_name}\n")
            df.write(f"\t({', '.join(column_names)})\n")
            placeholders = ', '.join(['%e' for _ in range(len(column_names))])
            df.write(f"\tVALUES ({placeholders});\n")
    
    return seedpath
            
    
def seed():
    # TODO: add logging
    # listing seeds
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
    