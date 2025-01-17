"""Module to handle configs. Loads files and handles separation of them.
"""
import os
import json


configs = config = {}

for fname in os.listdir(os.path.join(os.getcwd(), 'config')):
    if fname[-5:] != '.json':
        continue
    if fname.split('_')[-1].lower() == '_example.json':
        continue
    with open(os.path.join(os.getcwd(), 'config', fname)) as sf:
        configs[fname.split('.')[0]] = json.load(sf)
