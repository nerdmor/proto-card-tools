from flask import Blueprint, jsonify, request, redirect
from flask import current_app
import google.oauth2.credentials
import google_auth_oauthlib.flow

from libs.helpers import random_string
from libs.helpers import sign_message
from libs.helpers import check_signed_payload
from libs.helpers import user_agent_signature
from libs.flask.decorators import token_required
from libs.flask.auth import make_token

from libs import db as dbm

auth = Blueprint('auth', __name__)

@auth.route("/login", methods=['GET'])
def login():
    state = sign_message(random_string(32), current_app.config.get('CRYTO_KEY'))
    flow = google_auth_oauthlib.flow.Flow.from_client_secrets_file(
        'config/secrets/google-client-secret.json',
        ['openid']
    )
    flow.redirect_uri = current_app.config.get('OAUTH_REDIRECT_URL')
    authorization_url, state = flow.authorization_url(
        access_type='offline',
        include_granted_scopes='true',
        state=state
    )
    return jsonify({'authorization_url': authorization_url})


@auth.route('/oauth', methods=['GET'])
def oauth():
    error = request.args.get('error')
    if error is not None:
        return jsonify({'error': error}), 401

    state = request.args.get('state')
    valid, _ = check_signed_payload(state, current_app.config.get('CRYTO_KEY'))
    if valid is False:
        return jsonify({'error': 'invalid signature'}), 401

    flow = google_auth_oauthlib.flow.Flow.from_client_secrets_file(
        'config/secrets/google-client-secret.json',
        scopes=['openid'],
        state=state
    )
    flow.redirect_uri = current_app.config.get('OAUTH_REDIRECT_URL')

    if current_app.config.get('ENV') == 'dev':
        request_url = request.url.replace('http://', 'https://')
    else:
        request_url = request.url

    flow.fetch_token(authorization_response=request_url)
    credentials = flow.credentials

    db = dbm.DbManager()
    query = """
    SELECT *
      FROM users AS us
     WHERE us.client_id = %s
    """
    existing_users = db.fetch(query, (credentials.client_id, ))
    if len(existing_users) == 0:
        query = """
        INSERT
          INTO users
               (client_id, client_secret, refresh_token, token, created_at)
        VALUES (%s, %s, %s, %s, CURRENT_TIMESTAMP());
        """
        refresh_token = 'none' if credentials.refresh_token is None else credentials.refresh_token

        user_id = db.execute(query, (credentials.client_id, credentials.client_secret, refresh_token, credentials.token, ))
        client_id = credentials.client_id
    else:
        user_id = existing_users[0]['id']
        client_id = existing_users[0]['client_id']

    jwt_token = make_token(user_id, client_id, user_agent_signature(request.user_agent))
    port = f":{current_app.config.get('PORT')}" if current_app.config.get('PORT') != '80' else ''
    redirect_url = "{protocol}{domain}{port}/?token={jwt_token}".format(
        protocol=current_app.config.get('PROTOCOL'),
        domain=current_app.config.get('DOMAIN'),
        port=port,
        jwt_token=jwt_token
    )

    return redirect(redirect_url, code=302)


@auth.route("/login/renew", methods=['GET'])
@token_required
def login_renew(decoded_token):
    jwt_token = make_token(
        decoded_token['user_id'],
        decoded_token['client_id'],
        user_agent_signature(request.user_agent)
    )

    return jsonify({'token': jwt_token})

