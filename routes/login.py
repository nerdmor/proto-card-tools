import json
import base64

from flask import request, redirect, url_for, jsonify
from oauthlib.oauth2 import WebApplicationClient
import requests

from config import config
from libs import user as userlib


def login_start():
    client = WebApplicationClient(config['google']['web']['client_id'])

    # Find out what URL to hit for Google login
    google_provider_cfg = requests.get(config['google']['discovery_url']).json()
    authorization_endpoint = google_provider_cfg["authorization_endpoint"]

    # Use library to construct the request for Google login and provide
    # scopes that let you retrieve user's profile from Google

    request_uri = client.prepare_request_uri(
        authorization_endpoint,
        redirect_uri=request.base_url + "/oauth",
        scope=["openid"]
    )

    return redirect(request_uri)


def login_callback():
    code = request.args.get("code")
    google_provider_cfg = requests.get(config['google']['discovery_url']).json()

    client = WebApplicationClient(config['google']['web']['client_id'])

    # Prepare and send a request to get tokens
    token_url, headers, body = client.prepare_token_request(
        google_provider_cfg["token_endpoint"],
        authorization_response=request.url,
        redirect_url=request.base_url,
        code=code
    )
    token_response = requests.post(
        token_url,
        headers=headers,
        data=body,
        auth=(config['google']['web']['client_id'], config['google']['web']['client_secret']),
    )

    # Parse the tokens!
    client.parse_request_body_response(json.dumps(token_response.json()))

    # getting unique ID from Google
    uri, headers, body = client.add_token(google_provider_cfg["userinfo_endpoint"])
    userinfo = requests.get(uri, headers=headers, data=body).json()
    unique_id = userinfo["sub"]

    # lets see if this guy exists
    existing_user = userlib.get_user_by_external_id(unique_id, 'google')
    if existing_user is None:
        # user does not exist, create it
        new_id = userlib.create_user(
            external_id=unique_id,
            external_id_type='google'
        )
        user_id = new_id['id']
    else:
        user_id = existing_user['id']

    jwt_token = userlib.make_jwt_token(user_id)
    token_bytes = base64.b64encode(jwt_token.encode("ascii"))
    token_string = token_bytes.decode("ascii")

    redirect_url = request.base_url.replace('/oauth', '/redirect')
    redirect_url = f"{redirect_url}?token={token_string}"

    return redirect(redirect_url)




