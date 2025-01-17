"""Basic wrapper module to get a singleton connection to the database and other
simple database functions like migration.
"""

from typing import Any, Sequence

import psycopg
from psycopg import Cursor

from config import config


# global connection object to be re-used
CUR_CONN = None


class DictRowFactory:
    """Simple class to enable psycopg3 connections to return dictionaries
    """
    def __init__(self, cursor: Cursor[Any]):
        self.fields = [c.name for c in cursor.description]

    def __call__(self, values: Sequence[Any]) -> dict[str, Any]:
        return dict(zip(self.fields, values))


def get_conn(autocommit: bool=True, exclusive: bool=False) -> psycopg.Connection:
    """Gets a connection to the database.

    Args:
        autocommit (bool, optional): Parameter passed to the connection creation,
            controlling wether it autocommits. Defaults to True
        exclusive (bool, optional): If set to True, will create a new connection.
            Defaults to False.

    Returns:
        psycopg.Connection: a connection to the database
    """
    global CUR_CONN

    make_new_comm = False
    if exclusive:
        make_new_comm = True
    elif CUR_CONN is None:
        make_new_comm = True
    elif not isinstance(CUR_CONN, psycopg.Connection) or CUR_CONN.closed is True:
        make_new_comm = True

    if make_new_comm is True:
        new_conn = psycopg.connect(
            hostaddr=config['db']['host'],
            port=config['db']['port'],
            dbname =config['db']['database'],
            user=config['db']['username'],
            password=config['db']['password'],
            autocommit=autocommit
        )

    if exclusive:
        return new_conn

    if make_new_comm:
        CUR_CONN = new_conn

    return CUR_CONN


def empty_tables():
    """Truncates all tables in the schema.
    """
    conn = get_conn(False, True)
    cur = conn.cursor(row_factory=DictRowFactory)

    query = f"""
    SELECT table_name
      FROM information_schema.tables
     WHERE table_schema = '{config['db']['schema']}';
    """
    cur.execute(query)
    table_list = [e['table_name'] for e in cur.fetchall()]
    cur.close()

    cur = conn.cursor()
    for tb in table_list:
        cur.execute(f"TRUNCATE TABLE {tb} CASCADE;")
    conn.commit()
    cur.close()