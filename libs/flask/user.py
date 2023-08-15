from datetime import datetime, timedelta

from flask import jsonify

from libs import db as dbm


USER_EDITABLE_FIELDS = ['username', 'settings']
SYSTEM_EDITABLE_FIELDS = ['client_id', 'client_secret', 'refresh_token', 'token']


def get_user(user_id):
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
    existing_users = db.fetch(query, (user_id, ))

    if len(existing_users) != 1:
        return jsonify({'error': 'invalid user_id'}), 403

    return jsonify({'data': existing_users[0]})

def update_user(user_id, user_data, system=False):
    db = dbm.DbManager()

    fields = []
    values = []

    for k in USER_EDITABLE_FIELDS:
        if k in user_data:
            fields.append(k)
            values.append(user_data[k])

    if system is True:
        for k in SYSTEM_EDITABLE_FIELDS:
            if k in user_data:
                fields.append(k)
                values.append(user_data[k])

    if len(values) == 0:
        return jsonify({"error": "no valid fields to update"}), 400

    values.append(user_id)

    fields = ', '.join([f"{k} = %s" for k in fields])

    query = """
    UPDATE users
       SET {fields}
     WHERE id = %s
    ;
    """.format(fields=fields)
    try:
        _ = db.execute(query, values)
    except Exception as e:
        raise e
        return jsonify({'error': 'failed to update user'}), 500

    return jsonify({'message': 'success'})


def delete_user(user_id):
    db = dbm.DbManager()

    query = """
    DELETE
      FROM users
     WHERE id = %s
    ;
    """

    try:
        _ = db.execute(query, (user_id, ))
    except Exception:
        return jsonify({'error': 'failed to delete user'}), 500

    return jsonify({'message': 'success'})

