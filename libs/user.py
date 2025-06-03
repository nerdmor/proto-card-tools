from datetime import datetime, timedelta

import jwt

from config import config
from db import get_conn, DictRowFactory


def get_user_by_id(user_id):
    conn = get_conn()
    cur = conn.cursor(row_factory=DictRowFactory)

    query = f"""
    SELECT usr.*
    FROM {config['db']['schema']}.users AS usr
    WHERE usr.id = %s
    LIMIT 1
    """
    cur.execute(query, (user_id, ))
    res = cur.fetchone()
    if res is not None:
        res = dict(res)
    return res


def get_user_by_external_id(external_id, external_id_type):
    conn = get_conn()
    cur = conn.cursor(row_factory=DictRowFactory)

    query = f"""
    SELECT usr.*
    FROM {config['db']['schema']}.users AS usr
    WHERE usr.external_id = %s
      AND usr.external_id_type = %s
    LIMIT 1
    """
    cur.execute(query, (external_id, external_id_type, ))
    res = cur.fetchone()
    if res is not None:
        res = dict(res)
    return res


def create_user(**kwargs):
    mandatory_fields = ['external_id', 'external_id_type']
    for f in mandatory_fields:
        if f not in kwargs:
            raise ValueError(f"Missing mandatory field {f}")

    possible_fields = {
        'name': "name",
        'external_id': 'external_id',
        'external_id_type': 'external_id_type'
    }

    insert_keys = []
    insert_values = []

    for k, v in possible_fields.items():
        if k in kwargs:
            insert_keys.append(v)
            insert_values.append(kwargs[k])

    value_string = ', '.join([f"%s" for _ in insert_values])
    query = f"""
    INSERT INTO public.users
        ({', '.join(insert_keys)})
    VALUES({value_string})
    RETURNING id;
    """
    conn = get_conn()
    cur = conn.cursor(row_factory=DictRowFactory)
    cur.execute(query, insert_values)

    new_id = cur.fetchone()
    return new_id


def make_jwt_token(user_id):
    now = datetime.now()
    expiration_date = now + timedelta(days=config['app']['cookie_valid_days'])

    token_payload = {
        'user_id': user_id,
        'created_at': now.strftime('%Y-%m-%d %H:%M:%S'),
        'expires_at': expiration_date.strftime('%Y-%m-%d %H:%M:%S')
    }
    encoded_jwt = jwt.encode(
        token_payload,
        config['app']['secret'],
        algorithm="HS256"
    )
    return encoded_jwt


def decode_jwt_token(token):
    return jwt.decode(token, config['app']['secret'], algorithms="HS256")


def validate_jwt_token(token):
    decoded_token = decode_jwt_token(token)
    now = datetime.now()
    decoded_token['created_at'] = datetime.strptime(decoded_token['created_at'], '%Y-%m-%d %H:%M:%S')
    decoded_token['expires_at'] = datetime.strptime(decoded_token['expires_at'], '%Y-%m-%d %H:%M:%S')

    if now < decoded_token['created_at']:
        return False
    if now > decoded_token['expires_at']:
        return False

    user = get_user_by_id(decoded_token['user_id'])
    if user is None:
        return False

    return True
