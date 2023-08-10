from datetime import datetime
import argparse
import os
from os import path

from libs import db


class ArgumentException(Exception):
    pass

class NameException(Exception):
    pass


SEED_PATH = path.join(os.getcwd(), 'db', 'seeds')
MIGRATION_PATH = path.join(os.getcwd(), 'db', 'migrations')


parser = argparse.ArgumentParser(
    prog='PTC Database manager',
    description='Handles database migrations for Proto Card Tools'
)
parser.add_argument('action',
                    choices=['add', 'migrate', 'seed'],
                    help="Action to be taken.")
parser.add_argument('-t', '--type',
                    choices=['seed', 'migration'],
                    help="When using 'add', the kind of file to be created")
parser.add_argument('-n', '--name',
                    help="When using 'add', base name to be used for the file")
parser.add_argument('-o', '--order',
                    help="When using 'add seed', the order of the file. If suppressed, will use the sequence of existing files.")
args = parser.parse_args()



if args.action == 'add':
    if args.type is None:
        raise ArgumentException('--type is mandatory when using add')
    if args.name is None:
        raise ArgumentException('--name is mandatory when using add')

    if args.type == 'migration':
        new_filename = f"{datetime.now().strftime('%Y%m%d%H%M%S')}_{args.name}.sql"
        full_path = path.join(MIGRATION_PATH, new_filename)
    if args.type == 'seed':
        existing_seeds = [f for f in os.listdir(SEED_PATH) if path.isfile(path.join(SEED_PATH, f)) and f[-4:] == '.sql']
        if args.order is None:
            orders = [int(f.split('_')[0]) for f in existing_seeds]
            if len(orders) == 0:
                order = 1
            else:
                order = max(orders) + 1
        else:
            order = args.order

        new_filename = f"{str(order).zfill(4)}_{args.name}.sql"

        if new_filename in existing_seeds:
            raise NameException('duplicate name for seed')

        full_path = path.join(SEED_PATH, new_filename)

    with open(full_path, 'w+', encoding='utf-8') as f:
        f.write(f'-- {new_filename}')
    print(f"created {full_path}")

elif args.action == 'migrate':
    db = db.DbManager()
    dblist = db.fetch("SHOW TABLES LIKE 'migrations';")
    if len(dblist) == 0:
        query = """
        CREATE TABLE IF NOT EXISTS migrations (
            id INT AUTO_INCREMENT PRIMARY KEY,
            filename VARCHAR(255) NOT NULL,
            execution_date DATE DEFAULT CURRENT_DATE NOT NULL
        );
        """
        print('creating migrations table...', end='')
        db.execute(query)
        print('\tsuccess!')

    migration_files = [f for f in os.listdir(MIGRATION_PATH) if path.isfile(path.join(MIGRATION_PATH, f)) and f[-4:] == '.sql']
    migration_files.sort()

    find_query = "SELECT * FROM migrations WHERE filename = %s;"
    insert_query = """INSERT INTO migrations
                                  (filename, execution_date)
                           VALUES (%s, CURRENT_DATE);
                   """
    for migfile in migration_files:
        print(f"Migration: {migfile}")
        executed = db.fetch(find_query, (migfile, ))
        if executed:
            print("\talready done, skipping")
            continue

        with open(path.join(MIGRATION_PATH, migfile), 'r', encoding='utf-8') as f:
            query = f.read();

        print("\texecuting...")
        try:
            result = db.execute(query)
        except Exception as e:
            print("\terror!")
            print(f"\t{e}")
            db.connect(True)
            break

        result = db.execute(insert_query, (migfile, ))
        print("\tsuccess!")

elif args.action == 'seed':
    db = db.DbManager()
    seed_files = [f for f in os.listdir(SEED_PATH) if path.isfile(path.join(SEED_PATH, f)) and f[-4:] == '.sql']
    seed_files.sort()

    for seefile in seed_files:
        print(f"Seed: {seefile}")

        with open(path.join(SEED_PATH, migfile), 'r', encoding='utf-8') as f:
            query = f.read();

        print("\texecuting...")
        try:
            result = db.execute(query)
        except Exception as e:
            print("\terror!")
            print(f"\t{e}")
            db.connect(True)
            break

        print("\tsuccess!")








