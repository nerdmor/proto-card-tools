"""Collection of functions that handle routes related to card lists
"""
from flask import jsonify

from config import config
# from logger import get_logger
from db import get_conn, DictRowFactory

def get_all(user_id:int) -> str:
    """TODO
    """
    conn = get_conn()
    cur = conn.cursor(row_factory=DictRowFactory)

    query = f"""
    SELECT  id
           ,list_name AS name
           ,archived
      FROM {config['db']['schema']}.card_lists
     WHERE user_id = %s
    """

    try:
        cur.execute(query, (user_id, ))
        res = cur.fetchall()
    except Exception as e:
        resp = {
            "status": "error",
            "error_type": type(e),
            "error": str(e)
        }
        return jsonify(resp), 500

    resp = {
        "status": "success",
        "data": [e for e in res]
    }
    return jsonify(resp), 200