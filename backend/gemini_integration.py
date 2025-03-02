import os
import json
import google.generativeai as genai
from typing import Dict, Any, List, Optional
from dotenv import load_dotenv
import logging

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Try to load from .env file, but don't fail if it doesn't work
try:
    load_dotenv()
    logger.info("Successfully loaded .env file")
except Exception as e:
    logger.warning(f"Error loading .env file: {str(e)}. Will try using environment variables directly.")

# Get API key with fallback
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY") or os.getenv("GEMINI_API_KEY") or "AIzaSyAL4dMuRDI23JPRGgxVW6D4F9BPy4uwkGI"

if not GEMINI_API_KEY:
    logger.error("GEMINI_API_KEY not found in environment variables")
    raise ValueError("GEMINI_API_KEY is required")

# Configure the Gemini API
logger.info("Configuring Gemini API")
genai.configure(api_key=GEMINI_API_KEY)

class GeminiEmailProcessor:
    """
    Uses Gemini API to process booking request emails and generate responses
    """
    def __init__(self, model_name="gemini-1.5-pro"):
        self.model = genai.GenerativeModel(model_name)
        logger.info(f"Initialized GeminiEmailProcessor with model: {model_name}")
    
    def analyze_booking_request(self, email_body: str) -> Dict[str, Any]:
        """
        Analyzes an email to extract booking request details using Gemini AI
        
        Args:
            email_body: The body text of the email
            
        Returns:
            dict: Extracted booking details including:
                - client_name: Name of the client
                - client_email: Email of the client
                - requested_date: Date for booking (YYYY-MM-DD)
                - start_time: Start time (HH:MM)
                - end_time: End time (HH:MM)
                - purpose: Purpose of the booking
                - attendees: Number of attendees
                - special_requests: Any special requests
        """
        prompt = f"""
        Extract booking request details from the following email. 
        Return the information in a structured JSON format with the following fields:
        - client_name: Name of the person making the request
        - client_email: Email address of the requester
        - requested_date: The date requested for booking (in YYYY-MM-DD format)
        - start_time: The start time (in HH:MM format)
        - end_time: The end time (in HH:MM format)
        - purpose: The purpose of the booking
        - attendees: Number of attendees (integer)
        - special_requests: Any special requests mentioned
        
        If any information is not provided in the email, use null for that field.
        
        Email:
        {email_body}
        """
        
        try:
            response = self.model.generate_content(prompt)
            
            # Extract the JSON from the response
            result_text = response.text
            # Handle the case where the response might contain markdown code blocks
            if "```json" in result_text:
                json_str = result_text.split("```json")[1].split("```")[0].strip()
            elif "```" in result_text:
                json_str = result_text.split("```")[1].strip()
            else:
                json_str = result_text.strip()
                
            # Try to parse as JSON first
            try:
                booking_details = json.loads(json_str)
            except json.JSONDecodeError:
                # Fall back to eval if JSON parsing fails
                booking_details = eval(json_str)
                
            logger.info(f"Successfully extracted booking details: {booking_details}")
            return booking_details
            
        except Exception as e:
            logger.error(f"Error analyzing booking request: {str(e)}")
            return {
                "client_name": None,
                "client_email": None,
                "requested_date": None,
                "start_time": None,
                "end_time": None,
                "purpose": None,
                "attendees": None,
                "special_requests": None,
                "error": str(e)
            }
    
    def generate_booking_confirmation(self, booking_details: Dict[str, Any]) -> str:
        """
        Generates a confirmation email response for a successful booking
        
        Args:
            booking_details: Dictionary containing booking details
            
        Returns:
            str: The generated email body text
        """
        client_name = booking_details.get("client_name", "Valued Client")
        date = booking_details.get("requested_date", "the requested date")
        start_time = booking_details.get("start_time", "the requested time")
        end_time = booking_details.get("end_time", "")
        purpose = booking_details.get("purpose", "your event")
        
        time_slot = start_time
        if end_time:
            time_slot = f"{start_time} to {end_time}"
            
        prompt = f"""
        Generate a professional and friendly booking confirmation email to {client_name}.
        The booking is confirmed for {date} at {time_slot} for {purpose}.
        
        The email should:
        1. Start with a personalized greeting
        2. Confirm the booking details (date, time, purpose)
        3. Include any special instructions or next steps
        4. End with a professional sign-off
        5. Be written in a friendly, professional tone
        
        Do not use placeholder text - generate a complete, ready-to-send email.
        """
        
        try:
            response = self.model.generate_content(prompt)
            return response.text
        except Exception as e:
            logger.error(f"Error generating booking confirmation: {str(e)}")
            # Fallback template if AI generation fails
            return f"""
            Dear {client_name},
            
            Thank you for your booking request. We're pleased to confirm your booking for {purpose} on {date} at {time_slot}.
            
            If you have any questions or need to make changes, please don't hesitate to contact us.
            
            Best regards,
            The ProfitPilot Team
            """
    
    def generate_booking_rejection(self, booking_details: Dict[str, Any], 
                                  alternative_slots: List[Dict[str, Any]] = None) -> str:
        """
        Generates a rejection email with alternative time slots
        
        Args:
            booking_details: Dictionary containing booking details
            alternative_slots: List of alternative time slots
            
        Returns:
            str: The generated email body text
        """
        client_name = booking_details.get("client_name", "Valued Client")
        date = booking_details.get("requested_date", "the requested date")
        start_time = booking_details.get("start_time", "the requested time")
        end_time = booking_details.get("end_time", "")
        purpose = booking_details.get("purpose", "your event")
        
        time_slot = start_time
        if end_time:
            time_slot = f"{start_time} to {end_time}"
            
        alternatives_text = ""
        if alternative_slots and len(alternative_slots) > 0:
            alternatives_text = "We can offer the following alternative slots:\n"
            for i, slot in enumerate(alternative_slots[:3]):  # Limit to top 3 alternatives
                slot_date = slot.get("date", "")
                slot_start = slot.get("start_time", "")
                slot_end = slot.get("end_time", "")
                alternatives_text += f"- {slot_date} from {slot_start} to {slot_end}\n"
                
        prompt = f"""
        Generate a professional and considerate rejection email to {client_name}.
        The booking for {date} at {time_slot} for {purpose} cannot be accommodated.
        
        {alternatives_text}
        
        The email should:
        1. Start with a personalized greeting
        2. Express regret that the requested slot is not available
        3. Clearly present the alternative options if available
        4. Invite the client to respond with their preference or request another time
        5. End with a professional sign-off
        6. Be written in a friendly, professional tone
        
        Do not use placeholder text - generate a complete, ready-to-send email.
        """
        
        try:
            response = self.model.generate_content(prompt)
            return response.text
        except Exception as e:
            logger.error(f"Error generating booking rejection: {str(e)}")
            # Fallback template if AI generation fails
            alt_text = ""
            if alternative_slots and len(alternative_slots) > 0:
                alt_text = "However, we can offer the following alternative slots:\n"
                for i, slot in enumerate(alternative_slots[:3]):
                    slot_date = slot.get("date", "")
                    slot_start = slot.get("start_time", "")
                    slot_end = slot.get("end_time", "")
                    alt_text += f"- {slot_date} from {slot_start} to {slot_end}\n"
                    
            return f"""
            Dear {client_name},
            
            Thank you for your booking request for {purpose} on {date} at {time_slot}.
            
            Unfortunately, we are unable to accommodate your request for this specific time.
            
            {alt_text}
            
            Please let us know if any of these alternatives would work for you, or if you'd like to suggest another time.
            
            Best regards,
            The ProfitPilot Team
            """
            
    def generate_invoice(self, booking_details: Dict[str, Any], 
                         pricing_info: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Generates an invoice for a booking using Gemini AI
        
        Args:
            booking_details: Dictionary containing booking details
            pricing_info: Optional dictionary with pricing information
            
        Returns:
            dict: Invoice details including:
                - invoice_number: Unique invoice identifier
                - invoice_date: Date of invoice generation
                - due_date: Payment due date
                - items: List of billable items
                - subtotal: Sum before tax
                - tax: Tax amount
                - total: Total amount due
                - html_content: Formatted HTML invoice that can be displayed
        """
        client_name = booking_details.get("client_name", "Valued Client")
        client_email = booking_details.get("client_email", "client@example.com")
        date = booking_details.get("requested_date", "")
        start_time = booking_details.get("start_time", "")
        end_time = booking_details.get("end_time", "")
        purpose = booking_details.get("purpose", "Event")
        attendees = booking_details.get("attendees", 1)
        
        # Default pricing if not provided
        if not pricing_info:
            pricing_info = {
                "hourly_rate": 150,
                "attendee_fee": 25,
                "tax_rate": 0.08  # 8% tax
            }
            
        # Calculate duration in hours
        duration = 1.0  # Default to 1 hour
        if start_time and end_time:
            try:
                start_hour, start_min = map(int, start_time.split(':'))
                end_hour, end_min = map(int, end_time.split(':'))
                duration = (end_hour - start_hour) + (end_min - start_min) / 60
                duration = max(0.5, duration)  # Minimum 30 minutes
            except:
                logger.warning(f"Could not parse start/end times: {start_time}/{end_time}")
        
        # Generate a unique invoice number
        import datetime
        import uuid
        today = datetime.datetime.now()
        invoice_number = f"INV-{today.strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}"
        invoice_date = today.strftime("%Y-%m-%d")
        due_date = (today + datetime.timedelta(days=30)).strftime("%Y-%m-%d")
        
        # Calculate costs
        hourly_rate = pricing_info.get("hourly_rate", 150)
        attendee_fee = pricing_info.get("attendee_fee", 25)
        tax_rate = pricing_info.get("tax_rate", 0.08)
        
        venue_cost = hourly_rate * duration
        attendee_cost = attendee_fee * attendees
        subtotal = venue_cost + attendee_cost
        tax = subtotal * tax_rate
        total = subtotal + tax
        
        prompt = f"""
        Generate a professional invoice for:
        - Client: {client_name} ({client_email})
        - Event: {purpose}
        - Date: {date}
        - Time: {start_time} to {end_time}
        - Duration: {duration:.2f} hours
        - Attendees: {attendees}
        
        INVOICE DETAILS:
        - Invoice #: {invoice_number}
        - Date: {invoice_date}
        - Due Date: {due_date}
        
        LINE ITEMS:
        1. Venue Rental: ${venue_cost:.2f} ({duration:.2f} hours at ${hourly_rate}/hour)
        2. Attendee Fee: ${attendee_cost:.2f} ({attendees} attendees at ${attendee_fee}/person)
        
        - Subtotal: ${subtotal:.2f}
        - Tax ({tax_rate*100:.1f}%): ${tax:.2f}
        - Total Due: ${total:.2f}
        
        Please generate a JSON response with the following:
        1. A complete, well-formatted HTML invoice that looks professional and can be displayed directly in a dashboard
        2. The structured invoice data

        The HTML should use modern design principles with a clean layout, proper spacing, and a professional color scheme.
        Include the ProfitPilot logo or name prominently.
        
        Return the response as a JSON with two keys:
        - "html_content": The complete HTML for the invoice
        - "invoice_data": The structured invoice data including invoice_number, dates, line items, and totals
        """
        
        try:
            response = self.model.generate_content(prompt)
            result_text = response.text
            
            # Extract the JSON
            if "```json" in result_text:
                json_str = result_text.split("```json")[1].split("```")[0].strip()
            elif "```" in result_text:
                json_str = result_text.split("```")[1].strip()
            else:
                json_str = result_text.strip()
                
            # Try to parse as JSON
            try:
                invoice_content = json.loads(json_str)
            except json.JSONDecodeError:
                # Fallback approach
                logger.warning("Failed to parse JSON response from Gemini, using fallback")
                invoice_content = {
                    "html_content": self._generate_fallback_invoice_html(
                        client_name, client_email, purpose, date, 
                        start_time, end_time, invoice_number, 
                        invoice_date, due_date, venue_cost, 
                        attendee_cost, subtotal, tax, total
                    ),
                    "invoice_data": {
                        "invoice_number": invoice_number,
                        "invoice_date": invoice_date,
                        "due_date": due_date,
                        "client": {
                            "name": client_name,
                            "email": client_email
                        },
                        "booking": {
                            "purpose": purpose,
                            "date": date,
                            "start_time": start_time,
                            "end_time": end_time,
                            "duration": duration,
                            "attendees": attendees
                        },
                        "items": [
                            {
                                "description": f"Venue Rental ({duration:.2f} hours at ${hourly_rate}/hour)",
                                "amount": venue_cost
                            },
                            {
                                "description": f"Attendee Fee ({attendees} attendees at ${attendee_fee}/person)",
                                "amount": attendee_cost
                            }
                        ],
                        "subtotal": subtotal,
                        "tax_rate": tax_rate,
                        "tax": tax,
                        "total": total
                    }
                }
            
            logger.info(f"Successfully generated invoice #{invoice_number}")
            return invoice_content
            
        except Exception as e:
            logger.error(f"Error generating invoice: {str(e)}")
            # Return fallback invoice in case of error
            return {
                "html_content": self._generate_fallback_invoice_html(
                    client_name, client_email, purpose, date, 
                    start_time, end_time, invoice_number, 
                    invoice_date, due_date, venue_cost, 
                    attendee_cost, subtotal, tax, total
                ),
                "invoice_data": {
                    "invoice_number": invoice_number,
                    "invoice_date": invoice_date,
                    "due_date": due_date,
                    "client": {
                        "name": client_name,
                        "email": client_email
                    },
                    "booking": {
                        "purpose": purpose,
                        "date": date,
                        "start_time": start_time,
                        "end_time": end_time,
                        "duration": duration,
                        "attendees": attendees
                    },
                    "items": [
                        {
                            "description": f"Venue Rental ({duration:.2f} hours at ${hourly_rate}/hour)",
                            "amount": venue_cost
                        },
                        {
                            "description": f"Attendee Fee ({attendees} attendees at ${attendee_fee}/person)",
                            "amount": attendee_cost
                        }
                    ],
                    "subtotal": subtotal,
                    "tax_rate": tax_rate,
                    "tax": tax,
                    "total": total,
                    "error": str(e)
                }
            }
            
    def _generate_fallback_invoice_html(self, client_name, client_email, purpose, date, 
                                       start_time, end_time, invoice_number, 
                                       invoice_date, due_date, venue_cost, 
                                       attendee_cost, subtotal, tax, total):
        """Generate a fallback HTML invoice template if AI generation fails"""
        return f"""
        <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; border: 1px solid #ddd;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
                <div>
                    <h1 style="color: #2c3e50; margin: 0;">INVOICE</h1>
                    <p style="color: #7f8c8d; margin: 5px 0 0 0;">ProfitPilot</p>
                </div>
                <div style="text-align: right;">
                    <h2 style="color: #2c3e50; margin: 0;">#{invoice_number}</h2>
                    <p style="margin: 5px 0 0 0;">Date: {invoice_date}</p>
                    <p style="margin: 5px 0 0 0;">Due: {due_date}</p>
                </div>
            </div>
            
            <div style="background-color: #f9f9f9; padding: 15px; margin-bottom: 20px;">
                <h3 style="margin-top: 0; color: #2c3e50;">Bill To:</h3>
                <p style="margin: 5px 0;">{client_name}</p>
                <p style="margin: 5px 0;">{client_email}</p>
            </div>
            
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                <thead>
                    <tr style="background-color: #2c3e50; color: white;">
                        <th style="padding: 10px; text-align: left;">Description</th>
                        <th style="padding: 10px; text-align: right;">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    <tr style="border-bottom: 1px solid #ddd;">
                        <td style="padding: 10px;">{purpose} - Venue Rental</td>
                        <td style="padding: 10px; text-align: right;">${venue_cost:.2f}</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #ddd;">
                        <td style="padding: 10px;">Attendee Fee</td>
                        <td style="padding: 10px; text-align: right;">${attendee_cost:.2f}</td>
                    </tr>
                </tbody>
            </table>
            
            <div style="display: flex; justify-content: flex-end;">
                <div style="width: 250px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                        <span>Subtotal:</span>
                        <span>${subtotal:.2f}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                        <span>Tax:</span>
                        <span>${tax:.2f}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 1.2em; margin-top: 10px; border-top: 2px solid #2c3e50; padding-top: 10px;">
                        <span>Total:</span>
                        <span>${total:.2f}</span>
                    </div>
                </div>
            </div>
            
            <div style="margin-top: 40px; text-align: center; color: #7f8c8d; border-top: 1px solid #ddd; padding-top: 20px;">
                <p>Thank you for your business!</p>
                <p>Payment due within 30 days. Please make checks payable to ProfitPilot.</p>
            </div>
        </div>
        """ 