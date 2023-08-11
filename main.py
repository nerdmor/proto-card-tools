from flask import Flask, json, jsonify, request

from config import configs

from routes.auth import auth

ENV = configs.env

app = Flask(__name__,
            static_url_path='/static',
            static_folder='static')

app.config.from_object(configs.flask)
if ENV == 'dev':
    app.static_url_path='/static'
    app.static_folder='static'

app.register_blueprint(auth)

@app.route("/")
def home():
    return app.send_static_file('index.html')









if __name__ == '__main__':
    app.run(host='0.0.0.0', debug=True,port=80)