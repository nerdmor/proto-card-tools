import re
from random import choice
from json import loads as json_loads

import requests
from bs4 import BeautifulSoup
from unidecode import unidecode
from flask import jsonify, current_app

from config import configs
from libs import db as dbm


USER_AGENT_LIST = [
   "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.90 Safari/537.36",
   "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/42.0.2311.135 Safari/537.36 Edge/12.246",
   "Mozilla/5.0 (X11; CrOS x86_64 8172.45.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.64 Safari/537.36",
   "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_2) AppleWebKit/601.3.9 (KHTML, like Gecko) Version/9.0.2 Safari/601.3.9",
   "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/47.0.2526.111 Safari/537.36",
   "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:15.0) Gecko/20100101 Firefox/15.0.1",
   "Mozilla/5.0 (Linux; Android 13; SM-S901B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Mobile Safari/537.36",
   "Mozilla/5.0 (Linux; Android 13; SM-S901U) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Mobile Safari/537.36",
   "Mozilla/5.0 (Linux; Android 13; SM-S908B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Mobile Safari/537.36",
   "Mozilla/5.0 (Linux; Android 13; SM-G998B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Mobile Safari/537.36",
   "Mozilla/5.0 (Linux; Android 13; SM-A536B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Mobile Safari/537.36",
   "Mozilla/5.0 (Linux; Android 12; SM-G973F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Mobile Safari/537.36",
   "Mozilla/5.0 (Linux; Android 13; Pixel 6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Mobile Safari/537.36",
   "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Mobile Safari/537.36",
   "Mozilla/5.0 (Linux; Android 12; moto g pure) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Mobile Safari/537.36",
   "Mozilla/5.0 (Linux; Android 12; moto g 5G (2022)) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Mobile Safari/537.36",
   "Mozilla/5.0 (Linux; Android 13; M2101K6G) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Mobile Safari/537.36",
   "Mozilla/5.0 (iPhone14,6; U; CPU iPhone OS 15_4 like Mac OS X) AppleWebKit/602.1.50 (KHTML, like Gecko) Version/10.0 Mobile/19E241 Safari/602.1",
   "Mozilla/5.0 (iPhone14,3; U; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/602.1.50 (KHTML, like Gecko) Version/10.0 Mobile/19A346 Safari/602.1",
   "Mozilla/5.0 (iPhone13,2; U; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/602.1.50 (KHTML, like Gecko) Version/10.0 Mobile/15E148 Safari/602.1",
   "Mozilla/5.0 (iPhone12,1; U; CPU iPhone OS 13_0 like Mac OS X) AppleWebKit/602.1.50 (KHTML, like Gecko) Version/10.0 Mobile/15E148 Safari/602.1",
   "Mozilla/5.0 (iPhone12,1; U; CPU iPhone OS 13_0 like Mac OS X) AppleWebKit/602.1.50 (KHTML, like Gecko) Version/10.0 Mobile/15E148 Safari/602.1",
   "Mozilla/5.0 (iPhone; CPU iPhone OS 11_0 like Mac OS X) AppleWebKit/604.1.38 (KHTML, like Gecko) Version/11.0 Mobile/15A372 Safari/604.1",
   "Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.130 Safari/537.36",
   "Mozilla/5.0 (iPad; CPU OS 15_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/104.0.5112.99 Mobile/15E148 Safari/604.1"
]


def get_from_url(url):
    cards = None

    if re.match(r"^https://archidekt\.com/decks/\d+\/?.+$", url):
        cards = get_archidekt(url)
    elif re.match(r"^https://www\.moxfield.com/decks/([A-z0-9\_]+)", url):
        cards = get_moxfield(url)
    elif re.match(r"^https://www\.ligamagic\.com\.br/\?view=dks/deck\&id=\d+", url):
        cards = get_ligamagic(url)

    if cards is None:
        return jsonify({"success": False, "message": "provided url is not supported"}), 400

    return jsonify({"success": True, "data": cards})


def syntetic_request(url, params=None):
    headers = {
       'Connection': 'keep-alive',
       'Cache-Control': 'max-age=0',
       'Upgrade-Insecure-Requests': '1',
       'User-Agent': choice(USER_AGENT_LIST),
       'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
       'Accept-Encoding': 'gzip, deflate',
       'Accept-Language': 'en-US,en;q=0.9,fr;q=0.8',
       'referer': url
    }

    cookies = None
    if params:
        for k, v in params.items():
            if k == 'cookies':
                cookies = v
            else:
                headers[k] = v


    return requests.get(url, headers=headers, cookies=cookies)


def get_archidekt(url):
    if not re.match(r"^https://archidekt\.com/decks/\d+\/?.+$", url):
        return None

    resp = syntetic_request(url)
    soup = BeautifulSoup(resp.text, 'html.parser')
    scrip = soup.find(id='__NEXT_DATA__')
    if scrip is None:
        return None

    deckbody = json_loads(scrip.text)
    deckbody = deckbody['props']['pageProps']['redux']['deck']
    resp = None
    soup = None
    scrip = None

    categories = {k:[] for k in deckbody['categories'].keys()}
    for _, card in deckbody['cardMap'].items():
        categories[card['categories'][0]].append({
            'name': card['name'].lower(),
            'quantity': card['qty']
        })

    empty_categories = [k for k, v in categories.items() if len(v) == 0]
    for k in empty_categories:
        del categories[k]

    return categories


def get_moxfield(url):
    try:
        deckid = re.match(r"^https://www\.moxfield.com/decks/([A-z0-9\_]+)", url)
        deckid = deckid.groups()[0]
    except Exception as e:
        return None

    api_url = f"https://api2.moxfield.com/v3/decks/all/{deckid}"
    resp = syntetic_request(api_url, {'referer': url})
    deckbody = resp.json()

    categories = {}
    for cat, catBody in deckbody['boards'].items():
        categories[cat] = []
        for _, card in catBody['cards'].items():
            categories[cat].append({
                'name': card['card']['name'].lower(),
                'quantity': card['quantity']
            })

    empty_categories = [k for k, v in categories.items() if len(v) == 0]
    for k in empty_categories:
        del categories[k]

    return categories


def get_ligamagic(url):
    resp = syntetic_request(url, {'cookies': {'dk-language': '2'}})

    soup = BeautifulSoup(resp.text, 'html.parser')
    deck_element = soup.find('div', class_='pdeck-block').parent

    card_elements = deck_element.find_all("td", class_="deck-card")

    result = []
    for el in card_elements:
        card_name = unidecode(el.find('a').get_text().lower().strip())

        result.append({
            'name': card_name,
            'quantity': int(el.parent.find(class_='deck-qty').get_text().strip())
        })

    return {"only_category": result}