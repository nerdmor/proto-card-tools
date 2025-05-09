"""Collection of functions that handle routes related to cards
"""
from flask import jsonify

from config import config
# from logger import get_logger
from db import get_conn, DictRowFactory
from libs.utils import clean_card_name
from libs.cards import get_by_oracle_id as get_card_by_oracle_id
from libs.cards import get_by_name as get_card_by_name
from libs.cards import get_by_scryfall_id as get_card_by_scryfall_id
from libs.cards import get_random as get_card_random


def card_named(name:str) -> tuple[str, int]:
    if len(name) < 2:
        resp = {
            "status": "success",
            "data": []
        }
        return jsonify(resp), 200

    resp = {
        "status": "success",
        "data": get_card_by_name(name)
    }
    return jsonify(resp), 200


def card_random(qtd:int) -> tuple[str, int]:
    resp = {
        "status": "success",
        "data": get_card_random(qtd)
    }
    return jsonify(resp), 200


def card_oracle_id(oid:str) -> tuple[str, int]:
    res = get_card_by_oracle_id(oid)
    if len(res) < 1:
        resp = {
            "status": "error",
            "error": f"could not find a card with oracle id '{oid}'"
        }
        return jsonify(resp), 404
    resp = {
        "status": "success",
        "data": res[0]
    }
    return jsonify(resp), 200