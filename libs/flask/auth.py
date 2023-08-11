from datetime import datetime, timedelta

from flask import current_app
from cryptography.fernet import Fernet
import jwt


def make_token(user_id, client_id, user_agent):
    fernet = Fernet(current_app.config.get('CRYTO_KEY'))

    token = {
        'user_id': user_id,
        'client_id': fernet.encrypt(client_id.encode()).decode(),
        'user_agent': fernet.encrypt(user_agent.encode()).decode(),
        'valid_until': (datetime.now() + timedelta(days=30)).strftime('%Y-%m-%d %H:%M:%S')
    }

    return jwt.encode(token, current_app.config.get('JWT_KEY'), algorithm="HS256")

