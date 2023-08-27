import os
import re
import requests
from math import ceil

from PIL import Image, ImageDraw, ImageFont
from flask import jsonify, current_app

from config import configs
from libs.helpers import random_string

def download(url):
    rex = re.search('^https://cards.scryfall.io/normal/([a-z]+)/././([a-f0-9\\-]+)\\.(jpg|png)\\?\\d+$', url)
    if rex is None or len(rex.groups()) != 3:
        return None

    filename = f"{rex[2]}_{rex[1]}.{rex[3]}"
    raw_dir = configs['img_cardshare_raw_dir'].split('/')
    out_path = os.path.join(os.getcwd(), *raw_dir, filename)

    r = requests.get(url, stream=True)
    if r.status_code == 200:
        with open(out_path, 'wb+') as f:
            for chunk in r:
                f.write(chunk)

    return out_path

def resize(fpath):
    filename = fpath.split(os.sep)[-1]
    work_dir = configs['img_cardshare_work_dir'].split('/')
    out_path = os.path.join(os.getcwd(), *work_dir, filename)

    srcimg = Image.open(fpath)
    outimg = srcimg.resize((320, 445))
    outimg.save(out_path)

    return out_path

def add_quantity(fpath, quantity):
    srcimg = Image.open(fpath)
    draw = ImageDraw.Draw(srcimg)

    img_w = srcimg.size[0]
    img_h = srcimg.size[1]

    e_rad = round(img_w * 0.1, 0)
    e_x1 = round(((img_w/2) - e_rad), 0)
    e_y1 = round(((img_h * 0.9) - e_rad), 9)

    draw.ellipse([(e_x1, e_y1), (e_x1 + (2* e_rad), e_y1 + (2* e_rad))], fill=(199, 139, 44, 200))

    if quantity < 10:
        fontsize = round((img_w * 0.15), 0)
        txt_x = round(img_w * 0.46, 0)
        txt_y = round(img_h * 0.85, 0)
    elif quantity < 100:
        fontsize = round((img_w * 0.15), 0)
        txt_x = round(img_w * 0.42, 0)
        txt_y = round(img_h * 0.85, 0)
    else:
        fontsize = round((img_w * 0.10), 0)
        txt_x = round(img_w * 0.42, 0)
        txt_y = round(img_h * 0.87, 0)

    fnt = ImageFont.truetype(os.path.join(os.getcwd(), 'static', 'fonts', 'swansea.ttf'), fontsize)
    draw.text((txt_x, txt_y), str(quantity), font=fnt, fill=(0, 0, 0, 255))

    filename = fpath.split(os.sep)[-1]
    work_dir = configs['img_cardshare_work_dir'].split('/')
    out_path = os.path.join(os.getcwd(), *work_dir, filename)

    srcimg.save(out_path)

    return out_path

def make_tile(fpathlist):
    width = 320
    if len(fpathlist) == 2:
        width *= 2
    elif len(fpathlist) >= 3:
        width *= 3

    height = 445 * max(ceil(len(fpathlist)/3), 1)

    outimg = Image.new("RGB", (width, height))
    xoffset = 0
    yoffset = 0

    for fpath in fpathlist:
        img = Image.open(fpath)
        outimg.paste(img, (xoffset, yoffset))

        xoffset += 320
        if xoffset > 640:
            xoffset = 0
            yoffset += 445

    filename = f"{random_string(128)}.{fpath.split('.')[-1]}"
    ready_dir = configs['img_cardshare_ready_dir'].split('/')
    out_path = os.path.join(os.getcwd(), *ready_dir, filename)
    outimg.save(out_path)
    return out_path

def kill_images(fpathlist):
    for fpath in fpathlist:
        try:
            os.remove(fpath)
        except Exception:
            pass

def make_page_url(pagepath):
    url = "{protocol}{domain}{port}/{staticpath}".format(
        protocol=current_app.config.get('PROTOCOL'),
        domain=current_app.config.get('DOMAIN'),
        port=f":{current_app.config.get('PORT')}" if current_app.config.get('PORT') != '80' else '',
        staticpath=pagepath[len(configs['img_cardshare_ready_dir'])-1:]
    )
    url = url.replace(os.sep, '/')
    return url

def make_sharelist(payload):
    if 'wantlist' not in payload:
        return jsonify({"success": False, "message": "missing key 'wantlist' in payload"}), 400

    wantlist = payload['wantlist']
    if not isinstance(wantlist, list):
        return jsonify({"success": False, "message": 'wantlist must be a list'}), 400

    for el in wantlist:
        if 'url' not in el or 'quantity' not in el:
            return jsonify({"success": False, "message": 'invalid element in wantlist'}), 400

    readyimgs = []
    dead_images = []
    pages = []
    for want in wantlist:
        raw_path = download(want['url'])
        work_path = add_quantity(raw_path, want['quantity'])
        res_path = resize(work_path)
        readyimgs.append(res_path)
        dead_images.append(raw_path)
        dead_images.append(work_path)
        dead_images.append(res_path)
        if len(readyimgs) == 9:
            pages.append(make_page_url(make_tile(readyimgs)))
            readyimgs = []
            kill_images(dead_images)
            dead_images = []

    if len(readyimgs) > 0:
        pages.append(make_page_url(make_tile(readyimgs)))
        kill_images(dead_images)


    return jsonify({"success": True, "data": pages})
