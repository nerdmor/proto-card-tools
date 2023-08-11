from threading import Lock, Thread

import MySQLdb

from config import configs

class DbManager():
    _instances = {}
    _lock: Lock = Lock()

    def __call__(cls):
        with cls._lock:
            if cls not in cls._instances:
                instance = super().__call__()
                cls._instances[cls] = instance
        return cls._instances[cls]

    def __init__(self):
        self.conn = None
        self.connect()

    def connect(self, disconnect=False):
        if disconnect is True and self.conn is not None:
            self.conn.close()

        self.conn = MySQLdb.connect(
            configs.flask.DB_HOSTNAME,
            configs.flask.DB_USERNAME,
            configs.flask.DB_PASSWORD,
            configs.flask.DB_DATABASE
        )
        self.conn.autocommit(True)

    def fetch(self, sql, params=None):
        cursor = self.conn.cursor(MySQLdb.cursors.DictCursor)
        if params:
            cursor.execute(sql, params)
        else:
            cursor.execute(sql)
        result = cursor.fetchall()
        cursor.close()
        return result

    def execute(self, sql, params=None):
        cursor = self.conn.cursor()
        if params:
            cursor.execute(sql, params)
        else:
            cursor.execute(sql)

        try:
            lastrow = cursor.lastrowid
        except Exception as e:
            lastrow = None

        cursor.close()

        if lastrow:
            return lastrow
        return True




