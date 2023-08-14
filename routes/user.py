from flask import Blueprint, jsonify, request
from flask import current_app
from libs.flask.decorators import token_required

from libs import db as dbm

user = Blueprint('user', __name__)

@user.route("/user/<int:user_id>", methods=['GET'])
@token_required
def get_user(token, user_id):
    if user_id == 0:
        user_id = token['user_id']
    elif token['user_id'] != user_id:
        return jsonify({'error': 'unauthorized'}), 403

    db = dbm.DbManager()
    query = """
    SELECT  id
           ,username
           ,settings
           ,DATE_FORMAT(created_at, '%%Y-%%m-%%d %%H:%%i:%%s') AS created_at
      FROM users AS us
     WHERE us.id = %s
    ;
    """
    existing_users = db.fetch(query, (token['user_id'], ))

    if len(existing_users) != 1:
        return jsonify({'error': 'invalid user_id'}), 403

    return jsonify({'data': existing_users[0]})