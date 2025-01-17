import os

import logging
from logging.handlers import RotatingFileHandler

from config import configs

LOGGER = logging.getLogger('proto-card-tools')


for cfg in configs['log']['streams']:
    if cfg['type'] == 'console':
        stream_handler = logging.StreamHandler()
        stream_handler.setFormatter(cfg.get("format", "%(message)s"))
    elif cfg['type'] == 'file':
        # ensuring director
        dir_path = cfg['path'].split('/')[:-1]
        dir_path = os.path.join(os.getcwd(), *dir_path)
        os.makedirs(file_path, exist_ok=True)

        # actually creating the handler
        file_path = os.path.join(os.getcwd(), *cfg['path'].split('/'))
        info_handler = RotatingFileHandler('info.log', maxBytes=cfg.get('max_bytes', 1000000))
    else:
        continue

    lvl = cfg['level'].lower()
    if lvl == 'debug':
        stream_handler.setLevel(logging.DEBUG)
    elif lvl == 'info':
        stream_handler.setLevel(logging.INFO)
    elif lvl == 'warning':
        stream_handler.setLevel(logging.WARNING)
    elif lvl == 'error':
        stream_handler.setLevel(logging.ERROR)
    elif lvl == 'critical':
        stream_handler.setLevel(logging.CRITICAL)
    LOGGER.addHandler(stream_handler)


def get_logger() -> logging.RootLogger:
    global LOGGER
    return LOGGER
