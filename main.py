from random import randint

from flask import Flask
from flask import send_from_directory

from config import config
import routes.list as routes_list
import routes.card as routes_card


app = Flask(__name__)

@app.route("/")
def hello():
    txt = f"""
    <h1 style='color:blue'>Hello There!</h1>
    <p>Have a random number on the house: {randint(1,100)}</p>
    """
    return txt

@app.route("/list/all")
def list_all():
    return routes_list.get_all(1)

@app.route("/card/named/<name>")
def card_named(name):
    return routes_card.card_named(name)

@app.route("/card/random/<quantity>")
def card_random(quantity):
    return routes_card.card_random(quantity)

@app.route("/card/oracle/<oid>")
def card_oracle(oid):
    return routes_card.card_oracle_id(oid)

if __name__ == "__main__":

    @app.route('/js/<path:path>')
    def serve_js(path):
        return send_from_directory('static/js', path)

    app.run(host='0.0.0.0')