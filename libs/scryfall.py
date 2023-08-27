import os
import json
from math import trunc

import requests

from config import configs


def bulk_data():
    try:
        resp = requests.get('https://api.scryfall.com/bulk-data')
        jdata = resp.json()
    except Exception as e:
        return None

    return jdata['data']


def download_bulk_data(bulk_data, filename=None, verbose=False):
    url = bulk_data['download_uri']
    if filename is None:
        url.split('/')[-1]

    dirpath = configs['tmp_dir'].split('/')
    fpath = os.path.join(*dirpath, filename)

    total_size = bulk_data['size']
    downloaded_size = 0
    with requests.get(url, stream=True) as r:
        r.raise_for_status()
        with open(fpath, 'wb') as f:
            for chunk in r.iter_content(chunk_size=None):
                if chunk:
                    downloaded_size += len(chunk)
                    if verbose is True:
                        pct = trunc((downloaded_size/total_size)*1000)/10
                        print(f"{str(pct).zfill(5)}%")
                    f.write(chunk)
    return fpath


def iter_file(fpath):
    with open(fpath, 'r', encoding='utf-8') as file:
        while row := file.readline():
            row = row.strip()
            if len(row) < 4:
                continue

            if row[0] == '[':
                row = row[1:]
            if row[-1] == ']' or row[-1] == ',':
                row = row[:-1]

            if len(row) < 4:
                continue

            yield row


def parse_all_cards(fpath):
    for row in iter_file(fpath):
        try:
            result = json.loads(row)
        except Exception as e:
            with open('error.txt', 'w+', encoding='utf-8') as ef:
                ef.write(row)
            raise e

        yield result


def count_all_cards(fpath):
    total_cards = 0
    for row in iter_file(fpath):
        total_cards += 1
    return total_cards
