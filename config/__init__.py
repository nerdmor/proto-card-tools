import json
import os

from .handler import ConfigHandler

with open(os.path.join(os.getcwd(), 'config', 'config.json'), 'r', encoding='utf-8') as f:
    jconfig = json.load(f)

configs = ConfigHandler(jconfig)


