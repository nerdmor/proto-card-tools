# simple script for downloading a card image.
# TODO: add logging
import sys
import os

import requests

try:
    source_url = sys.argv[1]
    filepath = sys.argv[2]
except IndexError:
    # TODO: turn this into a warning
    print("graceful exit: could not get mandatory parameter. Exiting")
    sys.exit()

if os.path.isfile(filepath):
    print("graceful exit: file already exists in location. Exiting")
    sys.exit()

with requests.get(source_url, stream=True) as r:
    r.raise_for_status()
    with open(filepath, 'wb+') as f:
        for chunk in r.iter_content(chunk_size=8192):
            f.write(chunk)

print(f"downloaded file to {filepath}")