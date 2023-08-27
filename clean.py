import os
from datetime import datetime

from config import configs

dirnames = [
    'img_cardshare_raw_dir',
    'img_cardshare_work_dir',
    'img_cardshare_ready_dir',
    'tmp_dir'
]

now = datetime.timestamp(datetime.now())

for dname in dirnames:
    dpath = configs[dname].split('/')
    dpath = os.path.join(os.getcwd(), *dpath)

    for dirpath, dirnames, filenames in os.walk(dpath):
        for fname in filenames:
            fpath = os.path.join(dpath, fname)
            ctime = os.path.getctime(fpath)
            if (now - ctime) >= (90 * 60):
                print(f"removing {fpath}")
                try:
                    os.remove(fpath)
                except Exception as e:
                    print(e)
