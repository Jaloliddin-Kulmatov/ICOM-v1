# Local development entry point. Import the module-level app instead of calling
# create_app() again, which used to build the app (and seed the DB) twice.
from app import app

if __name__ == "__main__":
    app.run(debug=True, port=5001, host="0.0.0.0")
