import base64

from flask import Blueprint, jsonify, request
from libs.flask.decorators import token_required
from libs.flask.url_import import get_from_url


cards = Blueprint('cards', __name__)


@cards.route("/cards/from/<listurl>", methods=['GET'])
@token_required
def import_card_list(token, listurl):
    listurl = base64.b64decode(listurl.replace('.', '/')).decode().strip()
    return get_from_url(listurl)
