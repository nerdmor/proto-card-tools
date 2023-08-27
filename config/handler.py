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

    def __getitem__(self, item):
        if hasattr(self, item):
            return getattr(self, item)
        return None

    def add_attr(self, key, val):
        setattr(self, key, val)

    def dir_attrs(self):
        for k in self.__dict__.keys():
            if k[-4:] == '_dir':
                yield k