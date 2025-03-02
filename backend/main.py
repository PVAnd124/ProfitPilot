from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import os
from agentic import BookingAgent, BookingRequest
from datetime import datetime

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

# Initialize the BookingAgent
email_config = {
    "smtp_server": os.getenv("SMTP_SERVER", "smtp.gmail.com"),
    "smtp_port": int(os.getenv("SMTP_PORT", "587")),
    "username": os.getenv("EMAIL_USERNAME"),
    "password": os.getenv("EMAIL_PASSWORD"),
    "from_email": os.getenv("FROM_EMAIL")
}

booking_agent = BookingAgent(
    api_key=os.getenv("GEMINI_API_KEY"),
    email_config=email_config
)

@app.route('/api/booking', methods=['POST'])
async def create_booking():
    try:
        data = request.json
        booking = BookingRequest(
            client_email=data['email'],
            event_type=data['event_type'],
            requested_date=datetime.fromisoformat(data['date']),
            requested_duration=int(data['duration']),
            num_guests=int(data.get('num_guests', 0)),
            additional_notes=data.get('notes', '')
        )
        
        # Create and run the workflow
        chain = booking_agent.create_workflow()
        # Pass the booking as a dictionary to the chain
        result = await chain.ainvoke({"booking": booking})
        
        return jsonify({
            'status': 'success',
            'message': 'Booking request processed successfully',
            'result': result
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 400

@app.route('/api/booking/history', methods=['GET'])
def get_booking_history():
    history = booking_agent.get_booking_history()
    return jsonify(history)

# Your existing reverse endpoint
@app.route('/api/reverse', methods=['POST'])
def reverse_text():
    data = request.json
    text = data.get('text', '')
    reversed_text = text[::-1]
    return jsonify({'result': reversed_text})

if __name__ == "__main__":
    app.run(debug=True, port=8080)