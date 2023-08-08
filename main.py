from flask import Flask, json, jsonify

ENV = 'dev'

app = Flask(__name__,
            static_url_path='/static',
            static_folder='static')

@app.route("/")
def home():
    return app.send_static_file('index.html')


if __name__ == '__main__':
    if ENV == 'dev':
        app.config.from_object('config.flask.DevelopmentConfig')
        # app.static_url_path=app.config.get('STATIC_FOLDER')
        # app.static_folder='/'
    elif ENV == 'prod':
        app.config.from_object('config.flask.ProductionConfig')

    app.run(host='0.0.0.0', debug=True,port=80)