from flask import Blueprint, jsonify, request
from libs.flask.decorators import token_required
from libs.flask.user import get_user, update_user, delete_user


user = Blueprint('user', __name__)


@user.route("/user/<int:user_id>", methods=['GET', 'POST', 'DELETE'])
@token_required
def user_route(token, user_id):
    if user_id == 0:
        user_id = token['user_id']
    elif token['user_id'] != user_id:
        # this is where we can verify if the calling user is an admin
        return jsonify({'error': 'unauthorized'}), 403

    if request.method == 'POST':
        if not request.is_json:
            return jsonify({"error": "this method requires a mimetype of 'application/json'"}), 400
        return update_user(user_id, request.get_json(), system=False)
    elif request.method == 'DELETE':
        return delete_user(user_id)
    elif request.method == 'GET':
        return get_user(user_id)
    else:
        return jsonify({'error': 'method not allowed'}), 405