import json
import os

from .handler import ConfigHandler

cwd = os.getcwd()
if not os.path.isdir(os.path.join(os.getcwd(), 'config')):
    print('config in wrong place. Moving')
    new_path = ['/'] + __file__.split(os.sep)[:-2]
    new_path = os.path.join(*new_path)
    os.chdir(new_path)

with open(os.path.join(os.getcwd(), 'config', 'config.json'), 'r', encoding='utf-8') as f:
    jconfig = json.load(f)

configs = ConfigHandler(jconfig)


