from flask import Blueprint, jsonify, request
from libs.flask.decorators import token_possible, token_required
from libs.flask.list import get_list, list_lists, delete_list, update_list, create_list


lists = Blueprint('lists', __name__)


@lists.route("/list/<int:list_id>", methods=['GET', 'POST', 'DELETE'])
@token_possible
def list_route(token, list_id):
    if request.method == 'GET':
        if token is None:
            return get_list(list_id, None)
        else:
            return get_list(list_id, token['user_id'])

    # any other method requires authentication
    if token is None:
        return jsonify({'error': 'unauthorized'}), 403

    # use this to allow for an admin call
    # user_id = request.args.get('user_id')
    # if user_id is None:
    #     user_id = token['user_id']
    user_id = token['user_id']

    if request.method == 'DELETE':
        return delete_list(list_id, user_id)

    if request.method == 'POST':
        if not request.is_json:
            return jsonify({"error": "this method requires a mimetype of 'application/json'"}), 400

        list_data = request.get_json()
        return update_list(list_id, user_id, list_data)

    return jsonify({'error': 'method not allowed'}), 405


@lists.route("/list", methods=['POST'])
@token_required
def list_create_route(token):
    if not request.is_json:
        return jsonify({"error": "this method requires a mimetype of 'application/json'"}), 400

    list_data = request.get_json()
    list_data['user_id'] = token['user_id']
    return create_list(**list_data)


@lists.route("/list/by/<int:user_id>", methods=['GET'])
@token_possible
def list_list_route(token, user_id):
    if token is not None and token['user_id'] == user_id:
        public = False
    else:
        public = True

    if order := request.args.get('order_by'):
        return list_lists(user_id, public, order)
    else:
        return list_lists(user_id, public)
