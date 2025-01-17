"""Collection of functions that are useful in the db context, but should not be
exported."""

import os

def get_dir_paths() -> dict[str, str]:
    """Returns a dict with absolute paths for important DB directories.

    Returns:
        dict: dict with important paths.
    """
    cwd = os.getcwd()
    return {
        "migrations": os.path.join(cwd, 'db', 'migrations'),
        "seeds": os.path.join(cwd, 'db', 'seeds'),
        "temp": os.path.join(cwd, 'db', 'temp'),
    }

def ensure_directories():
    """Ensures that all important directories in get_dir_paths() exist.
    """
    dirs = get_dir_paths()
    
    for dirkey, dirpath in dirs.items():
        if not os.path.isdir(dirpath):
            os.makedirs(dirpath)