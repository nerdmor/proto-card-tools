import os

def get_dir_paths():
    cwd = os.getcwd()
    return {
        "migrations": os.path.join(cwd, 'db', 'migrations'),
        "seeds": os.path.join(cwd, 'db', 'seeds'),
        "temp": os.path.join(cwd, 'db', 'temp'),
    }

def ensure_directories():
    dirs = get_dir_paths()
    
    if not os.path.isdir(dirs['migrations']):
        os.makedirs(dirs['migrations'])
    
    if not os.path.isdir(dirs['seeds']):
        os.makedirs(dirs['seeds'])