import requests
from oauthlib.oauth2 import WebApplicationClient

from config import config





def get_oauth():
    client = WebApplicationClient(config['google']['web']['client_id'])
    return client
    # app = Flask(__name__)
    # oauth = OAuth(app)
    # google = oauth.remote_app(
    #     'google',
    #     consumer_key=config['google']['web']['client_id'],
    #     consumer_secret=config['google']['web']['client_secret'],
    #     request_token_params={},
    #     base_url='https://www.googleapis.com/oauth2/v1/',
    #     request_token_url=None,
    #     access_token_method='POST',
    #     access_token_url='https://accounts.google.com/o/oauth2/token',
    #     authorize_url='https://accounts.google.com/o/oauth2/auth',
    # )
    # return google

def get_google_provider_cfg():
    return requests.get(config['google']['discovery_url']).json()
