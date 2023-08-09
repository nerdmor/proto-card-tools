import string
import secrets

alphabet = string.ascii_letters + string.digits

def random_string(lenght):
    return ''.join(secrets.choice(alphabet) for i in range(lenght))