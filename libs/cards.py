import json

from config import config
from libs.utils import clean_card_name
from db import get_conn, DictRowFactory


def add_details(card:dict)->dict:
    card['rarities'] = get_rarities(card['oracle_id'])
    card['variants'] = {}
    variants = get_variants(card['oracle_id'])
    for v in variants:
        variant_key = v['variant_key'].replace(f"{card['oracle_id']}_", '')
        v.pop('variant_key', None)
        card['variants'][variant_key] = v
    return card


def parse_db_response(card:dict)->dict:
    card['types'] = json.loads(card['types'])
    card['names'] = json.loads(card['names'])
    return card


def get_by_scryfall_id(id:str) -> list:
    # Connect to DB
    conn = get_conn()
    cur = conn.cursor(row_factory=DictRowFactory)

    query = f"""
    SELECT DISTINCT
        car.oracle_id
    FROM {config['db']['schema']}.card_variants AS cav
        INNER JOIN {config['db']['schema']}.cards AS car
            ON cav.oracle_id = car.oracle_id
    WHERE cav.scryfall_id = %s
    """
    cur.execute(query, (id, ))
    res = [get_by_oracle_id(e['oracle_id'])[0] for e in cur.fetchall()]

    return res


def get_by_oracle_id(id:str) -> list:
    # Connect to DB
    conn = get_conn()
    cur = conn.cursor(row_factory=DictRowFactory)

    query = f"""
    SELECT DISTINCT
        car.oracle_id,
        car."name",
        car.simple_name,
        car.names,
        car.cmc,
        car.color_identity,
        car.colors,
        car.type_line,
        car.types,
        car.number_faces,
        car.is_white,
        car.is_blue,
        car.is_black,
        car.is_red,
        car.is_green,
        car.is_multicolor,
        car.is_colorless,
        car.is_land
    FROM {config['db']['schema']}.cards AS car
    WHERE car.oracle_id = %s
    """
    cur.execute(query, (id, ))

    res = [add_details(parse_db_response(e)) for e in cur.fetchall()]
    return res


def get_by_name(name:str) -> list:
    # Connect to DB
    conn = get_conn()
    cur = conn.cursor(row_factory=DictRowFactory)

    query = f"""
    SELECT DISTINCT
        car.oracle_id,
    FROM {config['db']['schema']}.card_names AS can
        INNER JOIN {config['db']['schema']}.cards AS car
            ON can.oracle_id = car.oracle_id
    WHERE can.name_part = %s
        OR can.printed_name = %s
    """
    cname = clean_card_name(name)
    cur.execute(query, (cname, cname, ))

    res = [get_by_oracle_id(e['oracle_id'])[0] for e in cur.fetchall()]
    return res


def get_random(qtd:int) -> list:
    # Connect to DB
    conn = get_conn()
    cur = conn.cursor(row_factory=DictRowFactory)

    query = f"""
    SELECT
        car.oracle_id
    FROM {config['db']['schema']}.cards AS car
    ORDER BY RANDOM()
    LIMIT {qtd}
    """
    print(query)
    cur.execute(query)

    res = [get_by_oracle_id(e['oracle_id'])[0] for e in cur.fetchall()]
    return res


def get_rarities(oracle_id:str)->list:
    conn = get_conn()
    cur = conn.cursor(row_factory=DictRowFactory)

    query = f"""
    SELECT DISTINCT rarity
    FROM {config['db']['schema']}.card_variants
    WHERE oracle_id = %s
    """
    cur.execute(query, (oracle_id, ))

    return [e['rarity'] for e in cur.fetchall()]

def get_variants(oracle_id:str)->list:
    conn = get_conn()
    cur = conn.cursor(row_factory=DictRowFactory)

    query = f"""
    SELECT
        variant_key,
        image_uri,
        collector_number,
        collector_number_sort,
        set_code,
        scryfall_id,
        flavor_name
    FROM {config['db']['schema']}.card_variants
    WHERE oracle_id = %s
    """
    cur.execute(query, (oracle_id, ))

    return [e for e in cur.fetchall()]