from flask import Blueprint
from flask import current_app

static = Blueprint('static', __name__)


@static.route("/")
def home():
    return current_app.send_static_file('index.html')

@static.route("/privacy-policy")
def privacy():
    return current_app.send_static_file('policy/privacy.html')

@static.route("/terms-of-service")
def tos():
    return current_app.send_static_file('policy/tos.html')