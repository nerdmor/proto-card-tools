class ProductionConfig():
    DATABASE_URI = 'mysql://user@localhost/foo'

class DevelopmentConfig():
    DATABASE_URI = "sqlite:////tmp/foo.db"
    STATIC_FOLDER = '/'