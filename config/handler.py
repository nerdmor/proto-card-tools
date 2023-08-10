from .flask import ProductionConfig, DevelopmentConfig

class ConfigHandler():
    def __init__(self, dic):
        for k,v in dic.items():
            self.add_attr(k, v)

        if not hasattr(self, 'env'):
            setattr(self, 'env', 'dev')

        if self.env == 'prod':
            self.flask = ProductionConfig
        else:
            self.flask = DevelopmentConfig



    def add_attr(self, key, val):
        setattr(self, key, val)