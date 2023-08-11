from datetime import datetime, timedelta

import flask
from flask import Blueprint, jsonify, request, redirect
import google.oauth2.credentials
import google_auth_oauthlib.flow
import jwt
from ua_parser import user_agent_parser

from libs.helpers import random_string
from libs.helpers import sign_message
from libs.helpers import check_signed_payload

from libs import db as dbm

bp_login = Blueprint('login', __name__)

@bp_login.route("/login")
def login_init():
    state = sign_message(random_string(32), flask.current_app.config.get('CRYTO_KEY'))
    flow = google_auth_oauthlib.flow.Flow.from_client_secrets_file(
        'config/secrets/google-client-secret.json',
        ['openid']
    )
    flow.redirect_uri = flask.current_app.config.get('OAUTH_REDIRECT_URL')
    authorization_url, state = flow.authorization_url(
        access_type='offline',
        include_granted_scopes='true',
        state=state
    )
    return jsonify({'authorization_url': authorization_url})


@bp_login.route('/oauth')
def oauth():
    error = request.args.get('error')
    if error is not None:
        return jsonify({'error': error}), 401

    state = request.args.get('state')
    valid, _ = check_signed_payload(state, flask.current_app.config.get('CRYTO_KEY'))
    if valid is False:
        return jsonify({'error': 'invalid signature'}), 401

    flow = google_auth_oauthlib.flow.Flow.from_client_secrets_file(
        'config/secrets/google-client-secret.json',
        scopes=['openid'],
        state=state
    )
    flow.redirect_uri = flask.current_app.config.get('OAUTH_REDIRECT_URL')

    if flask.current_app.config.get('ENV') == 'dev':
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
        user_id = db.execute(query, (credentials.client_id, credentials.client_secret, credentials.refresh_token, credentials.token, ))
        next_action = 'send_settings'
    else:
        user_id = existing_users[0]['id']
        next_action = None

    parsed_ua = user_agent_parser.Parse(str(request.user_agent))
    user_agent = "{agent}@{os_family}-{os_major}".format(
        agent=parsed_ua['user_agent']['family'],
        os_family=parsed_ua['os']['family'],
        os_major=parsed_ua['os']['major']
    )

    response_payload = {
        'user_id': user_id,
        'valid_until': (datetime.now() + timedelta(days=30)).strftime('%Y-%m-%d %H:%M:%S'),
        'user_agent': user_agent
    }

    jwt_token = jwt.encode(response_payload, flask.current_app.config.get('JWT_KEY'), algorithm="HS256")

    redirect_url = "{protocol}{domain}/?token={jwt_token}&next_action={next_action}".format(
        protocol=flask.current_app.config.get('PROTOCOL'),
        domain=flask.current_app.config.get('DOMAIN'),
        jwt_token=jwt_token,
        next_action=next_action
    )

    return redirect(redirect_url, code=302)