import os
import json
from math import trunc
from unidecode import unidecode

import libs.scryfall as scryfall
from libs import db as dbm

fpath = 'tmp/all_cards.json'
if not os.path.isfile(fpath):
    fpath = None

if fpath is None:
    bulk_data = scryfall.bulk_data()
    for bd in bulk_data:
        if bd['type'] == 'all_cards':
            all_cards = bd
            break

    fpath = scryfall.download_bulk_data(all_cards, 'all_cards.json', True)

db = dbm.DbManager()
insert_query = """
INSERT IGNORE
  INTO cards
       (printed_name, name, scryfall_id)
VALUES (%s, %s, %s);
"""

total_cards = scryfall.count_all_cards(fpath)

i = 0
new_ids = []
ALLOWED_LANGS = ['de', 'en', 'es', 'fr', 'it', 'la', 'pt']
for card in scryfall.parse_all_cards(fpath):
    i += 1
    if card['lang'] not in ALLOWED_LANGS:
        continue

    try:
        printed_name = card.get('printed_name', card['name'])
    except Exception as e:
        json.dump(card, open('card.json', 'w+', encoding='utf-8'), indent=4)
        raise e

    try:
        printed_name = printed_name.lower()
    except Exception as e:
        pass

    en_name = card['name'].lower()

    values = [(printed_name, en_name, card['id'], )]
    if '//' in printed_name:
        for pname in [s.strip() for s in printed_name.split('//')]:
            values.append((pname, en_name, card['id'], ))

    new_names = []
    for val in values:
        new_name = unidecode(val[0])
        if new_name and new_name != val[0]:
            new_names.append(new_name)

    for pname in new_names:
        values.append((pname, en_name, card['id'], ))

    for val in values:
        new_id = db.execute(insert_query, val)
        if isinstance(new_id, int):
            new_ids.append(str(new_id))

    if i % 1000 == 0:
        pct = trunc((i/total_cards)*1000)/10
        print(f"{str(pct).zfill(5)}%")

with open('new_ids.txt', 'w+', encoding='utf-8') as f:
    f.write(','.join(new_ids))
