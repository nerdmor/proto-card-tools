import sys
import os

from db import get_conn
from db.migration import create_migration
from db.scryfall import download_scryfall_file, parse_scryfall_file, get_scryfall_filepath


import json


arg_command = sys.argv[1].lower()

if arg_command == 'create':
    arg_type = sys.argv[2].lower()
    
    if arg_type == 'migration':
        arg_name = sys.argv[3].lower()
        created_path = create_migration(arg_name)
        print(f"Created file {created_path}")
        sys.exit()

if arg_command == 'update':
    scryfall_filename = get_scryfall_filepath()
    if not os.path.isfile(scryfall_filename):
        scryfall_filename = download_scryfall_file()
    conn = get_conn()
    parse_scryfall_file(scryfall_filename, conn)





# card = parse_scryfall_file('E:\\proto-card-tools\\db\\temp\\scryfall_default_cards_20250107.json')

# with open('E:\\proto-card-tools\\db\\temp\\complex_card.json', 'w+', encoding='utf-8') as f:
#     json.dump(card, f, indent=4)