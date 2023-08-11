from datetime import datetime
import string
import secrets

from cryptography.fernet import Fernet
from cryptography.fernet import InvalidToken

alphabet = string.ascii_letters + string.digits

def random_string(lenght):
    return ''.join(secrets.choice(alphabet) for i in range(lenght))


def sign_message(message, key):
    fernet = Fernet(key.encode())

    now = datetime.now().strftime('%Y%m%d%H%M%S')
    message_body = f"{message}.{now}"

    return f"{fernet.encrypt(message_body.encode()).decode()}.{now}"


def check_signed_payload(payload, key):
    fernet = Fernet(key.encode())
    payload = payload.split('.')
    if len(payload) != 2:
        return False, None

    try:
        decoded_message = fernet.decrypt(payload[0].encode()).decode()
    except InvalidToken:
        return False, None

    decoded_message = decoded_message.split('.')
    if len(decoded_message) != 2:
        return False, None

    if decoded_message[1] != payload[1]:
        return False, None

    payloadtime = datetime.strptime(decoded_message[1], '%Y%m%d%H%M%S')
    if (datetime.now()-payloadtime).total_seconds() <= 600:
        return True, decoded_message[0]

    return False, None