import os
from pathlib import Path

from flask import Flask

from config import configs

from routes.auth import auth
from routes.user import user
from routes.static import static
from routes.list import lists
from routes.image import image
from routes.cards import cards

ENV = configs.env

# ensuring directories
for ndir in configs.dir_attrs():
    ldir = configs[ndir].split('/')
    dirpath = os.path.join(os.getcwd(), *ldir)
    Path(dirpath).mkdir(parents=True, exist_ok=True)

app = Flask(__name__,
            static_url_path='/static',
            static_folder='static')

app.config.from_object(configs.flask)
if ENV == 'dev':
    app.static_url_path='/static'
    app.static_folder='static'

app.register_blueprint(auth)
app.register_blueprint(user)
app.register_blueprint(static)
app.register_blueprint(lists)
app.register_blueprint(image)
app.register_blueprint(cards)











if __name__ == '__main__':
    app.run(host='0.0.0.0', debug=True, port=5000)