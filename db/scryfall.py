import os
import json
from datetime import datetime
from string import ascii_letters

import requests

from db.utils import get_dir_paths


BULK_URL = 'https://api.scryfall.com/bulk-data'
SETS_URL = 'https://api.scryfall.com/sets'


def get_scryfall_filepath():
    destination_filename = f"scryfall_default_cards_{datetime.now().strftime('%Y%m%d')}.json"
    return os.path.join(get_dir_paths()['temp'], destination_filename)

def download_scryfall_file():
    bulk_info = requests.get(BULK_URL).json()['data']
    for e in bulk_info:
        if e['type'] == 'default_cards':
            file_url = e['download_uri']
            break
    
    destination_filename = get_scryfall_filepath()

    with requests.get(file_url, stream=True) as r:
        r.raise_for_status()
        with open(destination_filename, 'wb+') as f:
            for chunk in r.iter_content(chunk_size=8192): 
                f.write(chunk)
    return destination_filename


def get_scryfall_most_complex(file_name):
    source_file = open(file_name, 'r', encoding='utf-8')
    complex_card = {}
    while row := source_file.readline():
        row = row.strip('[], \n')
        if len(row) < 4:
            continue
        
        try:
            row = json.loads(row)
        except Exception as e:
            print(e)
            print(row)
            return {}
        for k, v in row.items():
            if k not in complex_card:
                if v is not None and v not in ['', []]:
                    complex_card[k] = v
    
    source_file.close()
        
    return complex_card


def parse_scryfall_file(file_name, conn):
    source_file = open(file_name, 'r', encoding='utf-8')
    cur = conn.cursor()
    
    results = {}
    
    variant_query_insert = """
    INSERT INTO variants
    (oracle_id, flavor_name, scryfall_id, image_uri, lang, rarity, set_code, collector_number, collector_number_sort, finishes, image_downloaded, variant_key)
    VALUES(%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    ON CONFLICT (variant_key) DO NOTHING
    """
    
    card_query_insert = """
    INSERT INTO cards (
        oracle_id,
        name,
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
    ) VALUES( %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    ON CONFLICT (oracle_id) DO NOTHING
    """
    
    name_query_insert = """
    INSERT INTO names
    (oracle_id, name)
    VALUES (%s, %s)
    ON CONFLICT (name) DO NOTHING
    """

    while row := source_file.readline():
        row = row.strip('[], \n')
        if len(row) < 4:
            continue
        
        jrow = json.loads(row)
        if 'oracle_id' not in jrow:
            continue
        if jrow.get('object', 'card') != 'card':
            continue
        if 'paper' not in jrow.get('games', ''):
            continue
        if jrow.get('layout', '').lower() in ['art_series', 'token', 'emblem']:
            continue
        if jrow.get('set_type', '').lower() in ['memorabilia']:
            continue
        
        # doing card basics
        card = {
            'oracle_id': jrow['oracle_id'],
            'name': None,
            'names': None,
            'cmc': jrow.get('cmc', 0),
            'color_identity': ''.join(jrow.get('color_identity', [])).lower(),
            'colors': ''.join(jrow.get('colors', [])).lower(),
            'type_line': '',
            'number_faces': len(jrow.get('card_faces', '1')),
            'is_white': False,
            'is_blue': False,
            'is_black': False,
            'is_red': False,
            'is_green': False,
            'is_multicolor': False,
            'is_colorless': False,
            'is_land': False,
        }
            
        if 'card_faces' in jrow:
            names = [e['name'] for e in jrow['card_faces']]
            card['type_line'] = jrow['card_faces'][0].get('type_line', '')
        else:
            names = [jrow['name']]
            card['type_line'] = jrow.get('type_line', '')

        # early exit due to type line
        if 'token' in card['type_line'].lower():
            continue
        if card['type_line'].lower() in ['card', 'card // card']:
            continue

        name = ' // '.join(names)

        if 'flavor_name' in jrow:
            names.append(jrow['flavor_name'])

        if jrow.get('set', '') in ['ust', 'unf']:
            col_num = jrow.get('collector_number', "0")
            if col_num[-1] in ascii_letters:
                names.append(f"{name} ({jrow['set'].upper()} {col_num[-1]})")
        elif jrow.get('set', '') == 'ulst':
            cur.execute("SELECT count(*) FROM cards WHERE name = %s;", (name, ))
            res = cur.fetchone()[0]
            names.append(f"{name} ({jrow['set'].upper()} {ascii_letters[res]})")
        elif jrow.get('name', '') == "B.F.M. (Big Furry Monster)":
            if jrow.get('mana_cost', '-') == '':
                names.append("B.F.M. (Big Furry Monster) (a)")
            else:
                names.append("B.F.M. (Big Furry Monster) (b)")

        if jrow['set'][:3] == "cmb":
            names = [f"{e} [playtest]" for e in names]
            name = f"{name} [playtest]"

        if 'flavor_name' in jrow:
            card['names'] = json.dumps(names[:-1])
        else:
            card['names'] = json.dumps(names)

        card['name'] = name
        card['sort_name'] = name.lower()

        if 'w' in card['colors']:
            card['is_white'] = True
        if 'b' in card['colors']:
            card['is_blue'] = True
        if 'b' in card['colors']:
            card['is_black'] = True
        if 'r' in card['colors']:
            card['is_red'] = True
        if 'g' in card['colors']:
            card['is_green'] = True
        if len(card['colors']) == 0:
            card['is_colorless'] = True
        elif len(card['colors']) > 1:
            card['is_multicolor'] = True
        if 'land' in card['type_line'].lower():
            card['is_land'] == True

        # insert the card
        cur.execute(card_query_insert, (
            card['oracle_id'],
            card['name'],
            card['names'],
            card['cmc'],
            card['color_identity'],
            card['colors'],
            card['type_line'],
            card['number_faces'],
            card['is_white'],
            card['is_blue'],
            card['is_black'],
            card['is_red'],
            card['is_green'],
            card['is_multicolor'],
            card['is_colorless'],
            card['is_land'],
        ))

        # we always detect variation
        variation = {
            'oracle_id': jrow['oracle_id'],
            'flavor_name': jrow.get('flavor_name', None),
            'scryfall_id': jrow['id'],
            'image_uri': None,
            'lang': jrow['lang'],
            'rarity': jrow.get('rarity', 'special')[0],
            'set_code': jrow.get('set', ''),
            'collector_number': jrow.get('collector_number', "0"),
            'collector_number_sort': 0,
            'finishes': ','.join(jrow.get('finishes', [])),
            'variant_key': f"{jrow['oracle_id']}_{jrow.get('set', '')}_{jrow.get('collector_number', '0')}"
        }

        variation['collector_number_sort'] = variation['collector_number'].split('-')[-1]
        variation['collector_number_sort'] = ''.join(
            e
            for e in variation['collector_number']
            if e.isdigit()
        )
        if len(variation['collector_number_sort']) == 0:
            variation['collector_number_sort'] = "0"
        variation['collector_number_sort'] = int(variation['collector_number_sort'])

        image_uris = jrow.get('image_uris', [])
        if 'large' in image_uris:
            variation['image_uri'] = image_uris['large']
        elif 'normal' in image_uris:
            variation['image_uri'] = image_uris['normal']
        elif 'png' in image_uris:
            variation['image_uri'] = image_uris['png']
        elif 'small' in image_uris:
            variation['image_uri'] = image_uris['small']

        # now that we're sure the card exists, insert names and variants
        cur.execute(
            variant_query_insert,
            (
                variation['oracle_id'],
                variation['flavor_name'],
                variation['scryfall_id'],
                variation['image_uri'],
                variation['lang'],
                variation['rarity'],
                variation['set_code'],
                variation['collector_number'],
                variation['collector_number_sort'],
                variation['finishes'],
                False,
                variation['variant_key'],
            )
        )

        for nm in names:
            cur.execute(name_query_insert, (variation['oracle_id'], nm,))

    cur.close()
    source_file.close()