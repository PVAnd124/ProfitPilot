"""
Event Scheduler Component
Handles event booking requests, availability checking, and email communications.
"""

import os
import json
import base64
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from googleapiclient.discovery import build
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from langchain_core.messages import HumanMessage, AIMessage
from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI
import pandas as pd
import time

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize LLM
llm = ChatOpenAI(
    model="gpt-4o-2024-05-13",  # Use the most capable model as of Oct 2024
    temperature=0.7,  # Higher temperature for more human-like responses
    api_key=os.getenv("OPENAI_API_KEY")
)

# Google API scopes
SCOPES = [
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/spreadsheets.readonly'
]

# Path to store the OAuth token
TOKEN_PATH = 'token.json'
# Path to the credentials file downloaded from Google Cloud Console
CREDENTIALS_PATH = 'credentials.json'

# Calendar data (simulated - replace with actual database integration)
EVENTS_DB_PATH = 'events_database.json'


def get_google_credentials():
    """
    Get Google API credentials using OAuth2.
    If no valid credentials exist, the user will be prompted to log in.
    
    Returns:
        Google OAuth2 credentials
    """
    creds = None
    
    # Check if token file exists
    if os.path.exists(TOKEN_PATH):
        creds = Credentials.from_authorized_user_info(
            json.load(open(TOKEN_PATH)), SCOPES
        )
    
    # If credentials don't exist or are invalid, get new ones
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            # Will open a browser window for authentication
            flow = InstalledAppFlow.from_client_secrets_file(CREDENTIALS_PATH, SCOPES)
            creds = flow.run_local_server(port=0)
        
        # Save the credentials for future use
        with open(TOKEN_PATH, 'w') as token:
            token.write(creds.to_json())
    
    return creds


def load_events_database():
    """
    Load the events database from file.
    If the file doesn't exist, create an empty database.
    
    Returns:
        Dict containing events data
    """
    try:
        if os.path.exists(EVENTS_DB_PATH):
            with open(EVENTS_DB_PATH, 'r') as f:
                return json.load(f)
        else:
            # Create empty database structure
            events_db = {
                "events": [],
                "availability": {
                    # Generate default availability for the next 90 days
                    (datetime.now() + timedelta(days=i)).strftime("%Y-%m-%d"): {
                        "morning": True,
                        "afternoon": True,
                        "evening": True
                    } for i in range(90)
                },
                "settings": {
                    "business_hours": {
                        "weekday": {"start": "08:00", "end": "20:00"},
                        "weekend": {"start": "10:00", "end": "22:00"}
                    },
                    "pricing": {
                        "base_price": 500,
                        "per_person": 25,
                        "weekend_premium": 100
                    }
                }
            }
            save_events_database(events_db)
            return events_db
    except Exception as e:
        logger.error(f"Error loading events database: {e}")
        # Return a minimal working database
        return {"events": [], "availability": {}, "settings": {}}


def save_events_database(events_db):
    """
    Save the events database to file.
    
    Args:
        events_db: Dict containing events data
    """
    try:
        with open(EVENTS_DB_PATH, 'w') as f:
            json.dump(events_db, f, indent=2)
    except Exception as e:
        logger.error(f"Error saving events database: {e}")


def fetch_google_form_responses():
    """
    Fetch responses from Google Form.
    This function retrieves the latest form submissions.
    
    Returns:
        List of form responses
    """
    try:
        creds = get_google_credentials()
        
        # Replace with your Google Form spreadsheet ID
        SPREADSHEET_ID = os.getenv("FORM_SPREADSHEET_ID")
        RANGE_NAME = 'Form Responses 1!A2:Z'  # Adjust based on your sheet
        
        service = build('sheets', 'v4', credentials=creds)
        sheet = service.spreadsheets()
        result = sheet.values().get(spreadsheetId=SPREADSHEET_ID, range=RANGE_NAME).execute()
        values = result.get('values', [])
        
        if not values:
            logger.info('No form responses found.')
            return []
        
        # Process the responses (column order depends on your form)
        # Adjust these column indices based on your form structure
        responses = []
        for row in values:
            if len(row) >= 7:  # Ensure row has enough elements
                responses.append({
                    'timestamp': row[0],
                    'name': row[1],
                    'email': row[2],
                    'phone': row[3],
                    'date': row[4],
                    'time_preference': row[5],
                    'guest_count': int(row[6]) if row[6].isdigit() else 0,
                    'special_requests': row[7] if len(row) > 7 else '',
                    'processed': False
                })
        
        return responses
    
    except Exception as e:
        logger.error(f"Error fetching Google Form responses: {e}")
        return []


def check_availability(date_str, time_preference):
    """
    Check if the requested date and time are available.
    
    Args:
        date_str: String date in format YYYY-MM-DD
        time_preference: String indicating morning, afternoon, or evening
    
    Returns:
        Boolean indicating availability
    """
    events_db = load_events_database()
    availability = events_db.get("availability", {})
    
    # If date not in database, assume available
    if date_str not in availability:
        availability[date_str] = {
            "morning": True,
            "afternoon": True,
            "evening": True
        }
        events_db["availability"] = availability
        save_events_database(events_db)
    
    return availability[date_str].get(time_preference.lower(), False)


def find_alternative_slots(requested_date, time_preference, num_alternatives=3):
    """
    Find alternative available slots if the requested one is not available.
    
    Args:
        requested_date: String date in format YYYY-MM-DD
        time_preference: String indicating morning, afternoon, or evening
        num_alternatives: Number of alternatives to suggest
    
    Returns:
        List of dict with alternative dates and times
    """
    events_db = load_events_database()
    availability = events_db.get("availability", {})
    
    # Convert requested date to datetime
    date_obj = datetime.strptime(requested_date, "%Y-%m-%d")
    
    # Map time preference to index (for finding alternatives)
    time_slots = ["morning", "afternoon", "evening"]
    time_idx = time_slots.index(time_preference.lower()) if time_preference.lower() in time_slots else 0
    
    alternatives = []
    # Check within +/- 7 days
    for day_offset in range(-7, 8):
        if len(alternatives) >= num_alternatives:
            break
            
        alt_date = date_obj + timedelta(days=day_offset)
        alt_date_str = alt_date.strftime("%Y-%m-%d")
        
        # Skip the requested date
        if alt_date_str == requested_date:
            continue
            
        # Check if date exists in availability
        if alt_date_str not in availability:
            availability[alt_date_str] = {
                "morning": True,
                "afternoon": True,
                "evening": True
            }
        
        # Try the same time slot first
        if availability[alt_date_str].get(time_slots[time_idx], False):
            alternatives.append({
                "date": alt_date_str,
                "time": time_slots[time_idx]
            })
            continue
            
        # Try other time slots
        for i in range(3):
            if i != time_idx and availability[alt_date_str].get(time_slots[i], False):
                alternatives.append({
                    "date": alt_date_str,
                    "time": time_slots[i]
                })
                break
    
    # Save updated availability
    events_db["availability"] = availability
    save_events_database(events_db)
    
    return alternatives


def calculate_event_price(date_str, guest_count, special_requests=None):
    """
    Calculate the price for an event.
    
    Args:
        date_str: String date in format YYYY-MM-DD
        guest_count: Number of guests
        special_requests: String of special requests (optional)
    
    Returns:
        Dict with price details
    """
    events_db = load_events_database()
    pricing = events_db.get("settings", {}).get("pricing", {})
    
    base_price = pricing.get("base_price", 500)
    per_person = pricing.get("per_person", 25)
    weekend_premium = pricing.get("weekend_premium", 100)
    
    # Check if the date is a weekend
    date_obj = datetime.strptime(date_str, "%Y-%m-%d")
    is_weekend = date_obj.weekday() >= 5  # 5 = Saturday, 6 = Sunday
    
    # Calculate price
    total_price = base_price + (guest_count * per_person)
    if is_weekend:
        total_price += weekend_premium
    
    # Add premium for special requests (simplified example)
    if special_requests and len(special_requests) > 0:
        # Add $50 for each special request keyword
        keywords = ["dietary", "allergy", "decoration", "setup", "cleanup"]
        for keyword in keywords:
            if keyword.lower() in special_requests.lower():
                total_price += 50
    
    return {
        "base_price": base_price,
        "per_person_rate": per_person,
        "guest_count": guest_count,
        "weekend_premium": weekend_premium if is_weekend else 0,
        "special_requests_fee": total_price - base_price - (guest_count * per_person) - (weekend_premium if is_weekend else 0),
        "total_price": total_price
    }


def book_event(event_details):
    """
    Book an event by recording it in the database and marking the time as unavailable.
    
    Args:
        event_details: Dict containing event details
    
    Returns:
        Dict with booking result
    """
    events_db = load_events_database()
    
    # Generate a unique event ID
    event_id = f"EVT-{datetime.now().strftime('%Y%m%d')}-{len(events_db['events']) + 1}"
    
    # Mark the slot as unavailable
    date_str = event_details.get("date")
    time_slot = event_details.get("time_preference", "").lower()
    
    if date_str in events_db["availability"]:
        events_db["availability"][date_str][time_slot] = False
    else:
        events_db["availability"][date_str] = {
            "morning": time_slot != "morning",
            "afternoon": time_slot != "afternoon",
            "evening": time_slot != "evening"
        }
    
    # Calculate price
    price_details = calculate_event_price(
        date_str,
        event_details.get("guest_count", 0),
        event_details.get("special_requests", "")
    )
    
    # Create event record
    event_record = {
        "event_id": event_id,
        "customer": {
            "name": event_details.get("name"),
            "email": event_details.get("email"),
            "phone": event_details.get("phone")
        },
        "event_details": {
            "date": date_str,
            "time_slot": time_slot,
            "guest_count": event_details.get("guest_count", 0),
            "special_requests": event_details.get("special_requests", "")
        },
        "pricing": price_details,
        "status": "booked",
        "created_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "updated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "invoice_sent": False
    }
    
    # Add to events database
    events_db["events"].append(event_record)
    save_events_database(events_db)
    
    return {
        "success": True,
        "event_id": event_id,
        "message": "Event booked successfully."
    }


def send_email(to_email, subject, body_html, body_text=None):
    """
    Send an email using Gmail API.
    
    Args:
        to_email: Recipient email address
        subject: Email subject
        body_html: HTML content of email
        body_text: Plain text content (optional)
    
    Returns:
        Dict with email send result
    """
    try:
        creds = get_google_credentials()
        service = build('gmail', 'v1', credentials=creds)
        
        message = MIMEMultipart('alternative')
        message['to'] = to_email
        message['subject'] = subject
        
        # Add text part if provided
        if body_text:
            part1 = MIMEText(body_text, 'plain')
            message.attach(part1)
        
        # Add HTML part
        part2 = MIMEText(body_html, 'html')
        message.attach(part2)
        
        # Encode the message
        raw_message = base64.urlsafe_b64encode(message.as_bytes()).decode('utf-8')
        
        # Send the message
        send_message = service.users().messages().send(
            userId='me',
            body={'raw': raw_message}
        ).execute()
        
        logger.info(f"Email sent to {to_email}, message ID: {send_message['id']}")
        return {
            "success": True,
            "message_id": send_message['id']
        }
        
    except Exception as e:
        logger.error(f"Error sending email: {e}")
        return {
            "success": False,
            "error": str(e)
        }


def generate_email_content(event_details, is_confirmation=True, alternatives=None):
    """
    Generate email content based on event details and whether it's a confirmation or alternative suggestion.
    
    Args:
        event_details: Dict with event details
        is_confirmation: Boolean indicating if this is a confirmation (or alternatives)
        alternatives: List of alternative slots (only if is_confirmation is False)
    
    Returns:
        Dict with email subject, HTML body, and text body
    """
    # Define variables for email template
    customer_name = event_details.get("name", "Valued Customer")
    event_date = event_details.get("date", "")
    event_time = event_details.get("time_preference", "").lower()
    guest_count = event_details.get("guest_count", 0)
    
    # Convert time to human-readable format
    time_display = {
        "morning": "Morning (8:00 AM - 12:00 PM)",
        "afternoon": "Afternoon (12:00 PM - 4:00 PM)",
        "evening": "Evening (4:00 PM - 8:00 PM)"
    }.get(event_time, event_time)
    
    # Format date in human-readable form
    try:
        date_obj = datetime.strptime(event_date, "%Y-%m-%d")
        date_display = date_obj.strftime("%A, %B %d, %Y")
    except:
        date_display = event_date
    
    if is_confirmation:
        # Get price details
        price_details = calculate_event_price(
            event_date, 
            guest_count,
            event_details.get("special_requests", "")
        )
        
        # Create LLM prompt for email generation
        email_prompt = ChatPromptTemplate.from_messages([
            ("system", """
            You are a helpful email generator for a catering business.
            Generate a warm, professional confirmation email for a customer who has booked an event.
            Keep the tone friendly but professional. Include all relevant details.
            """),
            ("human", """
            Customer Name: {customer_name}
            Event Date: {date_display}
            Event Time: {time_display}
            Guest Count: {guest_count}
            Total Price: ${total_price}
            
            Please generate a confirmation email with HTML formatting.
            """)
        ])
        
        # Generate email content
        email_content = llm.invoke(
            email_prompt.format(
                customer_name=customer_name,
                date_display=date_display,
                time_display=time_display,
                guest_count=guest_count,
                total_price=price_details["total_price"]
            )
        ).content
        
        # For confirmation emails, use the LLM's output directly
        # Since LLM might produce different formats, extract subject and body
        if "Subject:" in email_content:
            email_parts = email_content.split("Subject:", 1)
            email_body = email_parts[1].strip()
            
            if "\n" in email_body:
                subject, email_body = email_body.split("\n", 1)
                subject = subject.strip()
            else:
                subject = f"Confirmation: Your Event Booking for {date_display}"
        else:
            subject = f"Confirmation: Your Event Booking for {date_display}"
            email_body = email_content
        
        # Clean up HTML if necessary
        if not email_body.startswith("<html") and not email_body.startswith("<body"):
            # Convert line breaks to HTML and wrap in basic HTML structure
            email_body = f"""
            <html>
            <body>
                {email_body.replace("\n", "<br>")}
                <br><br>
                <div style="border-top: 1px solid #ccc; padding-top: 10px; margin-top: 10px;">
                    <p><strong>Booking Details:</strong></p>
                    <ul>
                        <li>Date: {date_display}</li>
                        <li>Time: {time_display}</li>
                        <li>Guests: {guest_count}</li>
                        <li>Total Price: ${price_details["total_price"]}</li>
                    </ul>
                </div>
            </body>
            </html>
            """
    else:
        # For alternative suggestions
        alternative_html = ""
        for i, alt in enumerate(alternatives or []):
            alt_date = alt.get("date", "")
            try:
                alt_date_obj = datetime.strptime(alt_date, "%Y-%m-%d")
                alt_date_display = alt_date_obj.strftime("%A, %B %d, %Y")
            except:
                alt_date_display = alt_date
                
            alt_time = alt.get("time", "").lower()
            alt_time_display = {
                "morning": "Morning (8:00 AM - 12:00 PM)",
                "afternoon": "Afternoon (12:00 PM - 4:00 PM)",
                "evening": "Evening (4:00 PM - 8:00 PM)"
            }.get(alt_time, alt_time)
            
            alternative_html += f"""
            <div style="margin-bottom: 10px; padding: 10px; border: 1px solid #eee; border-radius: 5px;">
                <strong>Option {i+1}:</strong> {alt_date_display}, {alt_time_display}
            </div>
            """
        
        # Create LLM prompt for email generation
        email_prompt = ChatPromptTemplate.from_messages([
            ("system", """
            You are a helpful email generator for a catering business.
            Generate a polite email suggesting alternative dates when the customer's requested
            date/time is not available. Keep the tone friendly and helpful.
            """),
            ("human", """
            Customer Name: {customer_name}
            Requested Date: {date_display}
            Requested Time: {time_display}
            Guest Count: {guest_count}
            
            I need an email explaining that the requested slot is unavailable,
            and offering the following alternatives:
            {alternative_description}
            
            Please generate the email with HTML formatting.
            """)
        ])
        
        # Generate description of alternatives for the prompt
        alt_description = "\n".join([
            f"Option {i+1}: {alt.get('date')}, {alt.get('time')}" 
            for i, alt in enumerate(alternatives or [])])
        
        # Generate email content
        email_content = llm.invoke(
            email_prompt.format(
                customer_name=customer_name,
                date_display=date_display,
                time_display=time_display,
                guest_count=guest_count,
                alternative_description=alt_description
            )
        ).content
        
        subject = f"Alternative Slots Available - Your Event Request for {date_display}"
        
        # Wrap the LLM response in HTML with our alternative slots
        email_body = f"""
        <html>
        <body>
            {email_content}
            <div style="margin-top: 20px;">
                <h3>Available Alternative Slots:</h3>
                {alternative_html}
            </div>
            <p>Please reply to this email or submit a new booking request with your preferred alternative.</p>
        </body>
        </html>
        """
    
    # Create plain text version
    text_body = email_body.replace('<br>', '\n').replace('<p>', '\n').replace('</p>', '\n')
    text_body = ''.join(c for c in text_body if ord(c) < 128)  # Remove non-ASCII chars
    
    return {
        "subject": subject,
        "body_html": email_body,
        "body_text": text_body
    }


def process_booking_request(request_details):
    """
    Process a new booking request, checking availability and sending appropriate emails.
    
    Args:
        request_details: Dict containing booking request details
    
    Returns:
        Dict with processing result
    """
    try:
        date_str = request_details.get("date")
        time_preference = request_details.get("time_preference")
        
        # Check availability
        if check_availability(date_str, time_preference):
            # Book the event
            booking_result = book_event(request_details)
            
            if booking_result["success"]:
                # Generate and send confirmation email
                email_content = generate_email_content(request_details, is_confirmation=True)
                email_result = send_email(
                    request_details["email"],
                    email_content["subject"],
                    email_content["body_html"],
                    email_content["body_text"]
                )
                
                return {
                    "success": True,
                    "message": "Event booked and confirmation sent",
                    "event_id": booking_result["event_id"],
                    "email_sent": email_result["success"]
                }
        else:
            # Find alternative slots
            alternatives = find_alternative_slots(date_str, time_preference)
            
            if alternatives:
                # Generate and send alternatives email
                email_content = generate_email_content(
                    request_details,
                    is_confirmation=False,
                    alternatives=alternatives
                )
                email_result = send_email(
                    request_details["email"],
                    email_content["subject"],
                    email_content["body_html"],
                    email_content["body_text"]
                )
                
                return {
                    "success": False,
                    "message": "Requested slot unavailable, alternatives suggested",
                    "alternatives": alternatives,
                    "email_sent": email_result["success"]
                }
            else:
                return {
                    "success": False,
                    "message": "No available slots found"
                }
    
    except Exception as e:
        logger.error(f"Error processing booking request: {e}")
        return {
            "success": False,
            "message": f"Error processing request: {str(e)}"
        }


def main():
    """
    Main function to run the event scheduler.
    Periodically checks for new form responses and processes them.
    """
    logger.info("Starting event scheduler...")
    
    while True:
        try:
            # Fetch new form responses
            responses = fetch_google_form_responses()
            
            # Process each new response
            for response in responses:
                if not response.get("processed"):
                    logger.info(f"Processing booking request for {response.get('name')}")
                    
                    result = process_booking_request(response)
                    logger.info(f"Processing result: {result['message']}")
                    
                    # Mark response as processed (implement this in your form handling)
                    response["processed"] = True
            
            # Sleep for 5 minutes before next check
            time.sleep(300)
            
        except Exception as e:
            logger.error(f"Error in main loop: {e}")
            time.sleep(60)  # Wait a minute before retrying on error


if __name__ == "__main__":
    main()