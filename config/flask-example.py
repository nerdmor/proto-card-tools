class ProductionConfig():
    OAUTH_REDIRECT_URL = 'https://protocardtools.com/oauth'
    DB_HOSTNAME = ''
    DB_USERNAME = ''
    DB_PASSWORD = ''
    DB_DATABASE = ''

class DevelopmentConfig():
    OAUTH_REDIRECT_URL = 'http://127.0.0.1/oauth'
    DB_HOSTNAME = ''
    DB_USERNAME = ''
    DB_PASSWORD = ''
    DB_DATABASE = ''