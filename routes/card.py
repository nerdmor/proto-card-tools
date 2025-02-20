"""Collection of functions that handle routes related to cards
"""
from flask import jsonify

from unidecode import unidecode

from config import config
# from logger import get_logger
from db import get_conn, DictRowFactory
from libs.utils import clean_card_name


def card_named(name:str) -> tuple[str, int]:
    if len(name) < 3:
        resp = {
            "status": "success",
            "data": []
        }
        return jsonify(resp), 200
    name = clean_card_name(name)
    conn = get_conn()
    cur = conn.cursor(row_factory=DictRowFactory)

    query = f"""
        SELECT  DISTINCT
                oracle_id
               ,printed_name
               ,name_part
          FROM card_names
         WHERE name_part = %s
    """
    cur.execute(query, (name, ))
    res = [e for e in cur.fetchall()]

    if len(res) == 1:
        resp = {
            "status": "success",
            "data": res
        }
        return jsonify(resp), 200

    query = f"""
        SELECT *
        FROM (
            SELECT  DISTINCT
                    oracle_id
                   ,printed_name
                   ,name_part
              FROM card_names
             WHERE name_part LIKE %s
        ) AS subq
        LIMIT 10;
    """

    cur.execute(query, (f'%{name}%', ))
    resp = {
        "status": "success",
        "data": [e for e in cur.fetchall()]
    }
    return jsonify(resp), 200


def card_random(qtd:int) -> tuple[str, int]:
    conn = get_conn()
    cur = conn.cursor(row_factory=DictRowFactory)
    query = f"""
    SELECT
        oracle_id,
        "name",
        names,
        cmc,
        color_identity,
        colors,
        type_line,
        number_faces,
        is_white,
        is_blue,
        is_black,
        is_red,
        is_green,
        is_multicolor,
        is_colorless,
        is_land
    FROM public.cards
    ORDER BY random()
    LIMIT {qtd}
    """

    cur.execute(query,)
    resp = {
        "status": "success",
        "data": [e for e in cur.fetchall()]
    }
    return jsonify(resp), 200


def card_oracle_id(oid:str) -> tuple[str, int]:
    conn = get_conn()
    cur = conn.cursor(row_factory=DictRowFactory)
    query = """
    SELECT
        oracle_id,
        "name",
        names,
        cmc,
        color_identity,
        colors,
        type_line,
        number_faces,
        is_white,
        is_blue,
        is_black,
        is_red,
        is_green,
        is_multicolor,
        is_colorless,
        is_land
    FROM public.cards
    WHERE oracle_id = %s
    """

    cur.execute(query, (oid, ))
    resp = {
        "status": "success",
        "data": cur.fetchall()[0]
    }
    return jsonify(resp), 200