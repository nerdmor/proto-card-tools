from datetime import datetime
import string
import secrets

from cryptography.fernet import Fernet
from cryptography.fernet import InvalidToken

from ua_parser import user_agent_parser

ALPHABET = string.ascii_letters + string.digits

def random_string(lenght):
    return ''.join(secrets.choice(ALPHABET) for i in range(lenght))


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


def user_agent_signature(ua_obj):
    if not isinstance(ua_obj, str):
        ua_obj = str(ua_obj)

    parsed_ua = user_agent_parser.Parse(ua_obj)
    user_agent = "{agent}@{os_family}-{os_major}".format(
        agent=parsed_ua['user_agent']['family'],
        os_family=parsed_ua['os']['family'],
        os_major=parsed_ua['os']['major']
    )
    return user_agent