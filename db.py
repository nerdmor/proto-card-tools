import sys
import os

from db import get_conn, empty_tables
from db.migration import create_migration, migrate
from db.seed import create_seed, seed
from db.scryfall import download_scryfall_file, parse_scryfall_file, get_scryfall_filepath

try:
    arg_command = sys.argv[1].lower()
except Exception:
    raise ValueError('Missing command. Please use "db.py help" for instructions.')

if arg_command == 'create':
    try:
        arg_type = sys.argv[2].lower()
    except Exception:
        raise ValueError('Missing `type` for command "create".')

    try:
        arg_name = sys.argv[3].lower()
    except Exception:
        raise ValueError(f'Missing `name` for command "create {arg_type}".')
    
    if arg_type == 'migration':
        created_path = create_migration(arg_name)
        print(f"Created file {created_path}")
        sys.exit()
    
    if arg_type == 'seed':
        created_path = create_seed(arg_name)
        print(f"Created file {created_path}")
        sys.exit()
    
    raise ValueError(f'Invalid type `{arg_type}` for command "create".')

if arg_command == 'update':
    scryfall_filename = get_scryfall_filepath()
    if not os.path.isfile(scryfall_filename):
        scryfall_filename = download_scryfall_file()
    conn = get_conn()
    parse_scryfall_file(scryfall_filename, conn)
    sys.exit()

if arg_command == 'migrate':
    migrate()
    sys.exit()
    
if arg_command == 'empty':
    empty_tables()
    sys.exit()

if arg_command == 'seed':
    seed()
    sys.exit()

raise ValueError(f'Invalid command `{arg_command}`. Please use db.py for instructions".')





# card = parse_scryfall_file('E:\\proto-card-tools\\db\\temp\\scryfall_default_cards_20250107.json')

# with open('E:\\proto-card-tools\\db\\temp\\complex_card.json', 'w+', encoding='utf-8') as f:
#     json.dump(card, f, indent=4)