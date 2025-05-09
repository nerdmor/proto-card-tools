import os

import logging
from logging.handlers import RotatingFileHandler

from config import configs


LOGGER = logging.getLogger('proto-card-tools')

lowest_level_found = logging.CRITICAL
for cfg in configs['log']['streams']:
    if cfg['type'] == 'console':
        new_handler = logging.StreamHandler()
    elif cfg['type'] == 'file':
        # ensuring director
        dir_path = cfg['path'].split('/')
        file_name = dir_path[-1]
        dir_path = dir_path[:-1]
        file_path = os.path.join(os.getcwd(), *dir_path, file_name)
        dir_path = os.path.join(os.getcwd(), *dir_path)
        os.makedirs(dir_path, exist_ok=True)

        # actually creating the handler
        new_handler = RotatingFileHandler(file_path, maxBytes=cfg.get('max_bytes', 1000000), encoding='utf-8')
    else:
        continue

    formatter = cfg.get("format", '%(message)s')
    new_handler.setFormatter(logging.Formatter(formatter, '%Y-%m-%d %H:%m:%S'))

    lvl = cfg['level'].lower()

    if lvl == 'debug':
        new_handler.setLevel(logging.DEBUG)
    elif lvl == 'info':
        new_handler.setLevel(logging.INFO)
    elif lvl == 'warning':
        new_handler.setLevel(logging.WARNING)
    elif lvl == 'error':
        new_handler.setLevel(logging.ERROR)
    else:  # lvl == 'critical':
        new_handler.setLevel(logging.CRITICAL)
    lowest_level_found = min(new_handler.level, lowest_level_found)
    LOGGER.addHandler(new_handler)
LOGGER.setLevel(lowest_level_found)


def get_logger() -> logging.RootLogger:
    """Returns the logger for the app.

    Returns:
        logging.RootLogger: logger, with all the streams.
    """
    global LOGGER
    return LOGGER
