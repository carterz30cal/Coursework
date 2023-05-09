from server import app
from waitress import serve

if __name__ == "__main__":
  serve(app, listen='0.0.0.0:5000', url_scheme='https')
