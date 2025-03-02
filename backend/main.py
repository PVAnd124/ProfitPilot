from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import uuid
import logging

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Try to load environment variables, but don't fail if it doesn't work
try:
    from dotenv import load_dotenv
    load_dotenv()
    logger.info("Successfully loaded .env file")
except Exception as e:
    logger.warning(f"Error loading .env file: {str(e)}. Will use environment variables directly.")

# Import GeminiEmailProcessor after environment variables are set
try:
    from gemini_integration import GeminiEmailProcessor
    # Initialize Gemini Email Processor
    gemini_processor = GeminiEmailProcessor()
    logger.info("Successfully initialized GeminiEmailProcessor")
except Exception as e:
    logger.error(f"Error initializing GeminiEmailProcessor: {str(e)}")
    raise

app = Flask(__name__)
CORS(app, resources={
    r"/api/*": {
        "origins": ["http://localhost:5173"],
        "methods": ["GET", "POST", "DELETE", "PUT", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
        "supports_credentials": True
    }
})

# Store for generated invoices
invoices_db = {}

@app.route('/api/reverse', methods=['POST'])
def reverse_text():
    data = request.json
    text = data.get('text', '')
    reversed_text = text[::-1]
    return jsonify({'result': reversed_text})

@app.route('/api/analyze-email', methods=['POST'])
def analyze_email():
    """
    Analyzes an email body to extract booking request details
    Expected JSON format: {"email_body": "The email content..."}
    """
    data = request.json
    email_body = data.get('email_body', '')
    
    if not email_body:
        return jsonify({'error': 'Email body is required'}), 400
    
    try:
        booking_details = gemini_processor.analyze_booking_request(email_body)
        return jsonify({'booking_details': booking_details})
    except Exception as e:
        logger.error(f"Error analyzing email: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/generate-confirmation', methods=['POST'])
def generate_confirmation():
    """
    Generates a confirmation email response
    Expected JSON format: {"booking_details": {...booking details object...}}
    """
    data = request.json
    booking_details = data.get('booking_details', {})
    
    if not booking_details:
        return jsonify({'error': 'Booking details are required'}), 400
    
    try:
        email_body = gemini_processor.generate_booking_confirmation(booking_details)
        return jsonify({'email_body': email_body})
    except Exception as e:
        logger.error(f"Error generating confirmation: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/generate-rejection', methods=['POST'])
def generate_rejection():
    """
    Generates a rejection email response with alternative time slots
    Expected JSON format: {
        "booking_details": {...booking details object...},
        "alternative_slots": [{...slot1...}, {...slot2...}, ...]
    }
    """
    data = request.json
    booking_details = data.get('booking_details', {})
    alternative_slots = data.get('alternative_slots', [])
    
    if not booking_details:
        return jsonify({'error': 'Booking details are required'}), 400
    
    try:
        email_body = gemini_processor.generate_booking_rejection(booking_details, alternative_slots)
        return jsonify({'email_body': email_body})
    except Exception as e:
        logger.error(f"Error generating rejection: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/generate-invoice', methods=['POST'])
def generate_invoice():
    """
    Generates an invoice for a booking
    Expected JSON format: {
        "booking_details": {...booking details object...},
        "pricing_info": {optional pricing info}
    }
    """
    data = request.json
    logger.info(f"Received invoice generation request: {data}")
    
    booking_details = data.get('booking_details', {})
    pricing_info = data.get('pricing_info', None)
    
    if not booking_details:
        logger.warning("Invoice generation failed: No booking details provided")
        return jsonify({'error': 'Booking details are required'}), 400
    
    # Validate booking details has required fields
    required_fields = ['client_name', 'requested_date']
    missing_fields = [field for field in required_fields if not booking_details.get(field)]
    
    if missing_fields:
        error_msg = f"Missing required fields in booking details: {', '.join(missing_fields)}"
        logger.warning(f"Invoice generation failed: {error_msg}")
        return jsonify({'error': error_msg}), 400
    
    try:
        logger.info(f"Generating invoice for booking: {booking_details}")
        invoice = gemini_processor.generate_invoice(booking_details, pricing_info)
        
        # Store the invoice for retrieval later
        invoice_id = invoice.get('invoice_data', {}).get('invoice_number', str(uuid.uuid4()))
        invoices_db[invoice_id] = invoice
        
        logger.info(f"Invoice generated successfully with ID: {invoice_id}")
        return jsonify({
            'invoice_id': invoice_id,
            'invoice': invoice
        })
    except Exception as e:
        logger.error(f"Error generating invoice: {str(e)}", exc_info=True)
        return jsonify({'error': str(e)}), 500

@app.route('/api/invoices', methods=['GET'])
def get_invoices():
    """
    Get all stored invoices
    """
    try:
        return jsonify({'invoices': list(invoices_db.values())})
    except Exception as e:
        logger.error(f"Error retrieving invoices: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/invoices/<invoice_id>', methods=['GET'])
def get_invoice(invoice_id):
    """
    Get a specific invoice by ID
    """
    try:
        invoice = invoices_db.get(invoice_id)
        if not invoice:
            return jsonify({'error': 'Invoice not found'}), 404
        return jsonify({'invoice': invoice})
    except Exception as e:
        logger.error(f"Error retrieving invoice: {str(e)}")
        return jsonify({'error': str(e)}), 500

if __name__ == "__main__":
    logger.info("Starting Flask server on port 8080")
    app.run(debug=True, port=8080)