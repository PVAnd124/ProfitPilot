from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import os
import uuid

load_dotenv()
app = Flask(__name__)
CORS(app, resources={
    r"/api/*": {
        "origins": ["http://localhost:5173"],
        "methods": ["GET", "POST", "DELETE", "PUT", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
        "supports_credentials": True
    }
})

@app.route('/api/reverse', methods=['POST'])
def reverse_text():
    data = request.json
    text = data.get('text', '')
    reversed_text = text[::-1]
    return jsonify({'result': reversed_text})

if __name__ == "__main__":
    app.run(debug=True, port=8080)