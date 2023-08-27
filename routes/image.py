from flask import Blueprint, jsonify, request
from libs.flask.decorators import token_required
from libs.flask.image import make_sharelist


image = Blueprint('image', __name__)


@image.route("/image/wantlist", methods=['POST'])
@token_required
def make_shareable_image(token):
    if not request.is_json:
        return jsonify({"error": "this method requires a mimetype of 'application/json'"}), 400
    return make_sharelist(request.get_json())
