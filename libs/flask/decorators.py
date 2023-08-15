from datetime import datetime
from functools import wraps

from flask import current_app
from flask import request, jsonify
import jwt
from cryptography.fernet import Fernet

from libs import db as dbm
from libs.helpers import user_agent_signature


# Authentication decorator
def token_required(f):
    @wraps(f)
    def decorator(*args, **kwargs):
        token = None
        token = request.headers.get('x-access-token')
        if not token:
            return jsonify({"error": "missing token"}), 401

        try:
            token = jwt.decode(
                token,
                current_app.config.get('JWT_KEY'),
                algorithms=["HS256"]
            )
            token['valid_until'] = datetime.strptime(token['valid_until'], '%Y-%m-%d %H:%M:%S')

            fernet = Fernet(current_app.config.get('CRYTO_KEY'))
            token['client_id'] = fernet.decrypt(token['client_id'].encode()).decode()
            token['user_agent'] = fernet.decrypt(token['user_agent'].encode()).decode()
        except Exception as e:
            print(e)
            return jsonify({"error": "invalid token"}), 401

        if token['valid_until'] <= datetime.now():
            return jsonify({"error": "expired token"}), 401

        db = dbm.DbManager()
        query = """
        SELECT id
          FROM users AS us
         WHERE us.id = %s
           AND us.client_id = %s
        ;
        """
        existing_users = db.fetch(query, (token['user_id'], token['client_id'], ))
        if len(existing_users) < 1:
            return jsonify({"error": "invalid token"}), 401

        if token['user_agent'] != user_agent_signature(request.user_agent):
            return jsonify({"error": "invalid user agent"}), 401

        return f(token, *args, **kwargs)
    return decorator
