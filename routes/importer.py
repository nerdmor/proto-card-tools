import json

from flask import jsonify
import requests
from bs4 import BeautifulSoup

from config import config
from db import get_conn, DictRowFactory
from libs.cards import get_by_scryfall_id as get_card_by_scryfall_id
from libs.cards import get_by_name as get_card_by_name

def parse_archidekt(url:str)->dict:
    r = requests.get(url)
    if r.status_code != 200:
        resp = {
            "status": "error",
            "error_type": f"{r.status_code}",
            "error": f"could not get URL '{url}'"
        }
        return jsonify(resp), 500

    try:
        soup = BeautifulSoup(r.text, 'html.parser')
    except Exception as e:
        resp = {
            "status": "error",
            "error_type": type(e),
            "error": f"could not parse given URL. Error '{e}'"
        }
        return jsonify(resp), 500

    deck_element = json.loads(soup.find(id='__NEXT_DATA__').string)['props']['pageProps']['redux']['deck']
    result = {
        'name': deck_element['name'],
        'categories': {},
        'cards': {},
        'errors': []
    }

    # getting categories
    for cat_name, cat_data in deck_element['categories'].items():
        result['categories'][cat_name] = {
            'premier': cat_data['isPremier'],
            'includedInDeck': cat_data['includedInDeck']
        }

    # parsing cards
    for card in deck_element['cardMap'].values():
        res = get_card_by_scryfall_id(card['uid'])
        if len(res) == 1:
            res = res[0]
            result['cards'][res['oracle_id']] = res
            result['cards'][res['oracle_id']]['categories'] = card['categories']
            continue

        # if we're still here, we couldn't find the card and should try again with the name
        res = get_card_by_name(card['name'])
        if len(res) == 1:
            res = res[0]
            result['cards'][res['oracle_id']] = res
            result['cards'][res['oracle_id']]['categories'] = card['categories']
            continue

        # if we are still here, this is an error and should be treated as such
        result['errors'].append(card)

    resp = {
        "status": "success",
        "data": result
    }
    return jsonify(resp), 200