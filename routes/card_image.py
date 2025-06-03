import os

from flask import send_file, redirect


def get_filename_from_path(img_path):
    img_path = img_path.split('?')[0]
    img_path = img_path.split('/')
    if len(img_path) == 1:
        return img_path[0]

    largest_element = ''
    for e in img_path:
        if e[-4:] in ['.jpg', '.png']:
            return e
        if len(e) > len(largest_element):
            largest_element = e
    return largest_element


def get_img(img_path):
    img_filename = get_filename_from_path(img_path)
    local_path = os.path.join(os.getcwd(), "static", "card_images", img_filename)
    if os.path.isfile(local_path):
        return send_file(local_path)

    image_url = f"https://cards.scryfall.io/{img_path}"
    cmd = f"python {os.path.join(os.getcwd(), 'download_image.py')} {image_url} {local_path} &"
    os.system(cmd)

    return redirect(image_url, code=307)




