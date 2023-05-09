
REM waitress-serve --listen=*:5000 wsgi:app
REM gunicorn -w 4 --bind 0.0.0.0:5000 wsgi:app
python -m flask --app server --debug run
pause