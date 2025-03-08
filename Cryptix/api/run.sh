#!/bin/bash

# Set environment variables
export FLASK_APP=app.py
export FLASK_DEBUG=1

# Run Flask application on port 5001 (since 5000 is in use)
python3 -m flask run --host=0.0.0.0 --port=5001
