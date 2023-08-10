from flask import Flask, json, jsonify, request
import google.oauth2.credentials
import google_auth_oauthlib.flow

from libs.helpers import random_string
from config import configs

ENV = configs.env

app = Flask(__name__,
            static_url_path='/static',
            static_folder='static')

app.config.from_object(configs.flask)
if ENV == 'dev':
    app.static_url_path='/static'
    app.static_folder='static'

@app.route("/")
def home():
    return app.send_static_file('index.html')

@app.route("/login")
def login():
    flow = google_auth_oauthlib.flow.Flow.from_client_secrets_file('config/secrets/google-client-secret.json', ['openid'])
    flow.redirect_uri = app.config.get('OAUTH_REDIRECT_URL')
    authorization_url, state = flow.authorization_url(access_type='offline', include_granted_scopes='true', state=random_string(32))
    return jsonify({'authorization_url': authorization_url})

@app.route('/oauth')
def oauth():
    error = request.args.get('error')
    if error is not None:
        return jsonify({'error': error}), 500

    state = request.args.get('state')
    flow = google_auth_oauthlib.flow.Flow.from_client_secrets_file(
        'config/secrets/google-client-secret.json',
        scopes=['openid'],
        state=state)
    flow.redirect_uri = app.config.get('OAUTH_REDIRECT_URL')

    request_url = request.url
    if ENV == 'dev':
        request_url = request_url.replace('http://', 'https://')

    flow.fetch_token(authorization_response=request_url)

    credentials = flow.credentials
    dict_credentials = {
        'token': credentials.token,
        'refresh_token': credentials.refresh_token,
        'token_uri': credentials.token_uri,
        'client_id': credentials.client_id,
        'client_secret': credentials.client_secret,
        'scopes': credentials.scopes
    }

    return jsonify(dict_credentials)





if __name__ == '__main__':
    app.run(host='0.0.0.0', debug=True,port=80)