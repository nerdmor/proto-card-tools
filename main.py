from flask import Flask
from flask import send_from_directory
from flask import send_file
from flask import request
from flask import jsonify

from config import config
import routes.list as routes_list
import routes.card as routes_card
import routes.importer as routes_importer
import routes.card_image as routes_card_image


app = Flask(__name__)

@app.route("/")
def hello():
    return send_file('static/html/index.html')

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

@app.route("/import/archidekt", methods=['POST'])
def import_archidekt():
    post_data = {}
    try:
        post_data = request.get_json()
        if not isinstance(post_data, dict) or 'url' not in post_data:
            err = {
                'result': 'error',
                'error': "'url' field missing in POST data"
            }
            return jsonify(err), 400
    except Exception as e:
        err = {
            'result': 'error',
            'error_type': str(type(e)),
            'error': str(e)
        }
        return jsonify(err), 400

    return routes_importer.parse_archidekt(post_data['url'])


@app.route('/cardimg', defaults={'path': ''})
@app.route('/cardimg/<path:path>')
def card_img(path):
    return routes_card_image.get_img(path)


if __name__ == "__main__":
    @app.route('/js/<path:path>')
    def serve_js(path):
        return send_from_directory('static/js', path)

    @app.route('/css/<path:path>')
    def serve_css(path):
        return send_from_directory('static/css', path)

    app.run(host='0.0.0.0')