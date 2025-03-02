import os
import re
import json
import datetime
import smtplib
import email
import imaplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.application import MIMEApplication
import nltk
from nltk.tokenize import word_tokenize
from nltk.corpus import stopwords
import spacy
import pandas as pd
import numpy as np
from jinja2 import Template
import requests
from typing import Dict, List, Tuple, Optional, Any
import logging

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class EmailParser:
    """
    Parses incoming emails to extract booking request details using NLP techniques.
    """
    def __init__(self):
        # Download necessary NLTK resources
        try:
            nltk.data.find('tokenizers/punkt')
        except LookupError:
            nltk.download('punkt')
        try:
            nltk.data.find('corpora/stopwords')
        except LookupError:
            nltk.download('stopwords')
            
        # Load spaCy model for NER and other NLP tasks
        self.nlp = spacy.load("en_core_web_sm")
        
    def connect_to_email_server(self, email_address: str, password: str, imap_server: str = "imap.gmail.com") -> imaplib.IMAP4_SSL:
        """Connect to the email server and return the connection object."""
        mail = imaplib.IMAP4_SSL(imap_server)
        mail.login(email_address, password)
        return mail
    
    def fetch_unread_emails(self, mail_connection: imaplib.IMAP4_SSL) -> List[Dict]:
        """Fetch unread emails from the inbox."""
        mail_connection.select('inbox')
        status, data = mail_connection.search(None, 'UNSEEN')
        email_ids = data[0].split()
        
        emails = []
        for e_id in email_ids:
            status, data = mail_connection.fetch(e_id, '(RFC822)')
            raw_email = data[0][1]
            msg = email.message_from_bytes(raw_email)
            
            body = ""
            if msg.is_multipart():
                for part in msg.walk():
                    content_type = part.get_content_type()
                    if content_type == "text/plain" or content_type == "text/html":
                        try:
                            body += part.get_payload(decode=True).decode()
                        except:
                            pass
            else:
                body = msg.get_payload(decode=True).decode()
            
            emails.append({
                'id': e_id,
                'from': msg['from'],
                'to': msg['to'],
                'subject': msg['subject'],
                'date': msg['date'],
                'body': body
            })
        
        return emails
    
    def extract_booking_details(self, email_body: str) -> Dict[str, Any]:
        """
        Extract booking details from email body using NLP.
        Returns a dictionary with extracted information.
        """
        doc = self.nlp(email_body)
        
        # Initialize booking details
        booking_details = {
            'event_date': None,
            'start_time': None,
            'end_time': None,
            'num_attendees': None,
            'event_type': None,
            'contact_name': None,
            'contact_email': None,
            'organization': None,
            'special_requests': None
        }
        
        # Extract dates
        dates = []
        for ent in doc.ents:
            if ent.label_ == "DATE":
                dates.append(ent.text)
                
        # Try to find a date that looks like an event date
        if dates:
            # Simple heuristic: take the first future date
            for date_str in dates:
                try:
                    # This is a simplified approach - in a real system, you'd need more robust date parsing
                    parsed_date = self._parse_date(date_str)
                    if parsed_date and parsed_date > datetime.datetime.now():
                        booking_details['event_date'] = parsed_date
                        break
                except:
                    continue
        
        # Extract number of attendees
        attendees_pattern = re.compile(r'(\d+)\s*(people|persons|attendees|guests)', re.IGNORECASE)
        attendees_match = attendees_pattern.search(email_body)
        if attendees_match:
            booking_details['num_attendees'] = int(attendees_match.group(1))
        
        # Extract event type
        event_types = ['wedding', 'conference', 'meeting', 'party', 'workshop', 'seminar', 'retreat']
        for event_type in event_types:
            if re.search(r'\b' + event_type + r'\b', email_body, re.IGNORECASE):
                booking_details['event_type'] = event_type
                break
        
        # Extract contact information
        email_pattern = re.compile(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b')
        email_matches = email_pattern.findall(email_body)
        if email_matches:
            # Exclude the recipient's email
            for email_match in email_matches:
                if not email_match.endswith(('gmail.com', 'yahoo.com', 'hotmail.com')):  # Simplified check
                    booking_details['contact_email'] = email_match
                    break
            
            if not booking_details['contact_email'] and email_matches:
                booking_details['contact_email'] = email_matches[0]
        
        # Extract organization name (simplified approach)
        org_indicators = ['company', 'organization', 'behalf of', 'representing']
        for indicator in org_indicators:
            pattern = re.compile(r'' + indicator + r'\s+([A-Z][A-Za-z0-9\s&]+)', re.IGNORECASE)
            match = pattern.search(email_body)
            if match:
                booking_details['organization'] = match.group(1).strip()
                break
        
        # Extract time information
        time_pattern = re.compile(r'(\d{1,2}(?::\d{2})?\s*(?:am|pm))\s*(?:to|until|-)\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm))', re.IGNORECASE)
        time_match = time_pattern.search(email_body)
        if time_match:
            booking_details['start_time'] = time_match.group(1)
            booking_details['end_time'] = time_match.group(2)
        
        # Extract special requests
        special_request_indicators = ['special request', 'would like', 'need', 'require', 'arrangement']
        for indicator in special_request_indicators:
            pattern = re.compile(r'' + indicator + r'[s]?[\s:]+([^.!?]+)[.!?]', re.IGNORECASE)
            match = pattern.search(email_body)
            if match:
                booking_details['special_requests'] = match.group(1).strip()
                break
        
        return booking_details
    
    def _parse_date(self, date_str: str) -> Optional[datetime.datetime]:
        """
        Parse a date string into a datetime object.
        This is a simplified version - a production system would need more robust date parsing.
        """
        try:
            # Try common date formats
            for fmt in ['%Y-%m-%d', '%d/%m/%Y', '%m/%d/%Y', '%B %d, %Y', '%d %B %Y']:
                try:
                    return datetime.datetime.strptime(date_str, fmt)
                except ValueError:
                    continue
            
            # If none of the formats work, return None
            return None
        except:
            return None


class CalendarIntegration:
    """
    Handles integration with calendar systems to check availability and schedule events.
    Supports Google Calendar, Microsoft Outlook, and other calendar APIs.
    """
    def __init__(self, calendar_type: str = "google", credentials_path: str = None):
        self.calendar_type = calendar_type.lower()
        self.credentials_path = credentials_path
        self.api_client = None
        
        # Initialize the appropriate calendar API client
        if self.calendar_type == "google":
            self._init_google_calendar()
        elif self.calendar_type == "outlook":
            self._init_outlook_calendar()
        else:
            raise ValueError(f"Unsupported calendar type: {calendar_type}")
    
    def _init_google_calendar(self):
        """Initialize Google Calendar API client."""
        # In a real implementation, you would use the Google Calendar API
        # For this example, we'll use a placeholder
        logger.info("Initializing Google Calendar API client")
        self.api_client = "google_calendar_client"
    
    def _init_outlook_calendar(self):
        """Initialize Microsoft Outlook Calendar API client."""
        # In a real implementation, you would use the Microsoft Graph API
        # For this example, we'll use a placeholder
        logger.info("Initializing Outlook Calendar API client")
        self.api_client = "outlook_calendar_client"
    
    def check_availability(self, date: datetime.datetime, start_time: str, end_time: str) -> bool:
        """
        Check if the venue is available for the specified date and time.
        Returns True if available, False otherwise.
        """
        # Convert string times to datetime objects
        start_datetime = self._combine_date_and_time(date, start_time)
        end_datetime = self._combine_date_and_time(date, end_time)
        
        # In a real implementation, you would query the calendar API
        # For this example, we'll simulate availability
        logger.info(f"Checking availability for {date.strftime('%Y-%m-%d')} from {start_time} to {end_time}")
        
        # Simulate API call to check for conflicting events
        conflicting_events = self._get_events_in_range(start_datetime, end_datetime)
        
        return len(conflicting_events) == 0
    
    def schedule_event(self, booking_details: Dict[str, Any]) -> bool:
        """
        Schedule an event in the calendar.
        Returns True if successful, False otherwise.
        """
        # Extract necessary details
        date = booking_details['event_date']
        start_time = booking_details['start_time']
        end_time = booking_details['end_time']
        event_type = booking_details['event_type']
        organization = booking_details['organization']
        num_attendees = booking_details['num_attendees']
        
        # Create event title and description
        event_title = f"{event_type.capitalize()} - {organization}" if organization else f"{event_type.capitalize()} Event"
        event_description = f"Number of attendees: {num_attendees}\n"
        if booking_details['special_requests']:
            event_description += f"Special requests: {booking_details['special_requests']}\n"
        event_description += f"Contact: {booking_details['contact_name']} ({booking_details['contact_email']})"
        
        # Convert string times to datetime objects
        start_datetime = self._combine_date_and_time(date, start_time)
        end_datetime = self._combine_date_and_time(date, end_time)
        
        # In a real implementation, you would create an event via the calendar API
        # For this example, we'll simulate event creation
        logger.info(f"Scheduling event: {event_title} on {date.strftime('%Y-%m-%d')} from {start_time} to {end_time}")
        
        # Simulate successful event creation
        return True
    
    def find_alternative_slots(self, date: datetime.datetime, duration_hours: int = 2, days_to_check: int = 7) -> List[Dict[str, Any]]:
        """
        Find alternative available time slots if the requested slot is not available.
        Returns a list of available slots within the specified range.
        """
        alternative_slots = []
        
        # Check the same day first
        same_day_slots = self._find_available_slots_on_date(date, duration_hours)
        alternative_slots.extend(same_day_slots)
        
        # Check subsequent days
        for i in range(1, days_to_check + 1):
            next_date = date + datetime.timedelta(days=i)
            next_day_slots = self._find_available_slots_on_date(next_date, duration_hours)
            alternative_slots.extend(next_day_slots)
            
            # If we have enough alternatives, stop searching
            if len(alternative_slots) >= 3:
                break
        
        return alternative_slots[:3]  # Return at most 3 alternatives
    
    def _combine_date_and_time(self, date: datetime.datetime, time_str: str) -> datetime.datetime:
        """Combine a date object with a time string to create a datetime object."""
        # Parse the time string (e.g., "2:00 PM")
        time_formats = ['%I:%M %p', '%I%p', '%I %p', '%H:%M']
        parsed_time = None
        
        for fmt in time_formats:
            try:
                parsed_time = datetime.datetime.strptime(time_str.strip().upper(), fmt).time()
                break
            except ValueError:
                continue
        
        if not parsed_time:
            raise ValueError(f"Could not parse time string: {time_str}")
        
        # Combine the date and time
        return datetime.datetime.combine(date.date(), parsed_time)
    
    def _get_events_in_range(self, start_datetime: datetime.datetime, end_datetime: datetime.datetime) -> List[Dict]:
        """
        Get events in the specified time range.
        This is a placeholder for actual calendar API integration.
        """
        # In a real implementation, you would query the calendar API
        # For this example, we'll return a simulated list of events
        
        # Simulate some existing events (30% chance of conflict)
        if np.random.random() < 0.3:
            return [{
                'title': 'Existing Event',
                'start': start_datetime,
                'end': end_datetime
            }]
        else:
            return []
    
    def _find_available_slots_on_date(self, date: datetime.datetime, duration_hours: int) -> List[Dict[str, Any]]:
        """Find available time slots on a specific date."""
        available_slots = []
        
        # Define business hours (9 AM to 9 PM)
        business_start = datetime.time(9, 0)
        business_end = datetime.time(21, 0)
        
        # Check availability in 1-hour increments
        current_time = datetime.datetime.combine(date.date(), business_start)
        end_time = datetime.datetime.combine(date.date(), business_end)
        
        while current_time + datetime.timedelta(hours=duration_hours) <= end_time:
            slot_end = current_time + datetime.timedelta(hours=duration_hours)
            
            # Check if this slot is available
            if not self._get_events_in_range(current_time, slot_end):
                available_slots.append({
                    'date': date.date(),
                    'start_time': current_time.strftime('%I:%M %p'),
                    'end_time': slot_end.strftime('%I:%M %p')
                })
            
            # Move to the next slot
            current_time += datetime.timedelta(hours=1)
        
        return available_slots


class InvoiceGenerator:
    """
    Generates invoices based on booking details and company templates.
    """
    def __init__(self, templates_dir: str = "invoice_templates"):
        self.templates_dir = templates_dir
        
        # Create templates directory if it doesn't exist
        os.makedirs(self.templates_dir, exist_ok=True)
    
    def create_template(self, company_id: str, template_html: str) -> bool:
        """
        Create or update a custom invoice template for a company.
        Returns True if successful, False otherwise.
        """
        try:
            template_path = os.path.join(self.templates_dir, f"{company_id}_template.html")
            with open(template_path, 'w') as f:
                f.write(template_html)
            logger.info(f"Created invoice template for company {company_id}")
            return True
        except Exception as e:
            logger.error(f"Failed to create invoice template: {str(e)}")
            return False
    
    def generate_invoice(self, booking_details: Dict[str, Any], company_id: str, invoice_number: str) -> str:
        """
        Generate an invoice based on booking details and company template.
        Returns the path to the generated invoice file.
        """
        # Load the company's template
        template_path = os.path.join(self.templates_dir, f"{company_id}_template.html")
        
        # If company template doesn't exist, use default template
        if not os.path.exists(template_path):
            template_path = os.path.join(self.templates_dir, "default_template.html")
            
            # If default template doesn't exist, create it
            if not os.path.exists(template_path):
                self._create_default_template()
        
        # Load the template
        with open(template_path, 'r') as f:
            template_html = f.read()
        
        # Create Jinja2 template
        template = Template(template_html)
        
        # Calculate invoice details
        event_date = booking_details['event_date'].strftime('%Y-%m-%d')
        num_attendees = booking_details['num_attendees']
        
        # In a real system, you would have pricing logic here
        # For this example, we'll use a simple pricing model
        base_price = 500  # Base price for venue
        per_person_price = 25  # Additional price per person
        total_price = base_price + (per_person_price * num_attendees)
        
        # Prepare invoice data
        invoice_data = {
            'invoice_number': invoice_number,
            'invoice_date': datetime.datetime.now().strftime('%Y-%m-%d'),
            'due_date': (datetime.datetime.now() + datetime.timedelta(days=30)).strftime('%Y-%m-%d'),
            'company_name': "Your Venue Name",  # This would come from company settings
            'company_address': "123 Venue Street, City, Country",  # This would come from company settings
            'company_email': "bookings@yourvenue.com",  # This would come from company settings
            'company_phone': "+1 (555) 123-4567",  # This would come from company settings
            'client_name': booking_details['contact_name'],
            'client_organization': booking_details['organization'],
            'client_email': booking_details['contact_email'],
            'event_date': event_date,
            'event_type': booking_details['event_type'],
            'start_time': booking_details['start_time'],
            'end_time': booking_details['end_time'],
            'num_attendees': num_attendees,
            'base_price': base_price,
            'per_person_price': per_person_price,
            'total_price': total_price,
            'special_requests': booking_details['special_requests']
        }
        
        # Render the template
        rendered_html = template.render(**invoice_data)
        
        # Save the rendered invoice
        invoice_dir = "generated_invoices"
        os.makedirs(invoice_dir, exist_ok=True)
        invoice_path = os.path.join(invoice_dir, f"invoice_{invoice_number}.html")
        
        with open(invoice_path, 'w') as f:
            f.write(rendered_html)
        
        logger.info(f"Generated invoice {invoice_number} for booking")
        
        return invoice_path
    
    def _create_default_template(self) -> None:
        """Create a default invoice template."""
        default_template = """
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Invoice #{{ invoice_number }}</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    margin: 0;
                    padding: 20px;
                    color: #333;
                }
                .invoice-header {
                    text-align: center;
                    margin-bottom: 30px;
                }
                .invoice-title {
                    font-size: 24px;
                    font-weight: bold;
                    margin-bottom: 5px;
                }
                .invoice-details {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 30px;
                }
                .company-details, .client-details {
                    width: 45%;
                }
                .section-title {
                    font-size: 18px;
                    font-weight: bold;
                    margin-bottom: 10px;
                    border-bottom: 1px solid #ddd;
                    padding-bottom: 5px;
                }
                .event-details {
                    margin-bottom: 30px;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 30px;
                }
                th, td {
                    padding: 10px;
                    text-align: left;
                    border-bottom: 1px solid #ddd;
                }
                th {
                    background-color: #f2f2f2;
                }
                .total-row {
                    font-weight: bold;
                }
                .footer {
                    margin-top: 50px;
                    text-align: center;
                    font-size: 12px;
                    color: #777;
                }
            </style>
        </head>
        <body>
            <div class="invoice-header">
                <div class="invoice-title">INVOICE</div>
                <div>Invoice #{{ invoice_number }}</div>
                <div>Date: {{ invoice_date }}</div>
                <div>Due Date: {{ due_date }}</div>
            </div>
            
            <div class="invoice-details">
                <div class="company-details">
                    <div class="section-title">From</div>
                    <div>{{ company_name }}</div>
                    <div>{{ company_address }}</div>
                    <div>Email: {{ company_email }}</div>
                    <div>Phone: {{ company_phone }}</div>
                </div>
                
                <div class="client-details">
                    <div class="section-title">To</div>
                    <div>{{ client_name }}</div>
                    {% if client_organization %}
                    <div>{{ client_organization }}</div>
                    {% endif %}
                    <div>Email: {{ client_email }}</div>
                </div>
            </div>
            
            <div class="event-details">
                <div class="section-title">Event Details</div>
                <div>Event Type: {{ event_type }}</div>
                <div>Date: {{ event_date }}</div>
                <div>Time: {{ start_time }} to {{ end_time }}</div>
                <div>Number of Attendees: {{ num_attendees }}</div>
                {% if special_requests %}
                <div>Special Requests: {{ special_requests }}</div>
                {% endif %}
            </div>
            
            <table>
                <thead>
                    <tr>
                        <th>Description</th>
                        <th>Quantity</th>
                        <th>Unit Price</th>
                        <th>Amount</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Venue Booking ({{ event_type }})</td>
                        <td>1</td>
                        <td>${{ base_price }}</td>
                        <td>${{ base_price }}</td>
                    </tr>
                    <tr>
                        <td>Attendee Fee</td>
                        <td>{{ num_attendees }}</td>
                        <td>${{ per_person_price }}</td>
                        <td>${{ num_attendees * per_person_price }}</td>
                    </tr>
                    <tr class="total-row">
                        <td colspan="3" style="text-align: right;">Total</td>
                        <td>${{ total_price }}</td>
                    </tr>
                </tbody>
            </table>
            
            <div>
                <div class="section-title">Payment Instructions</div>
                <div>Please make payment within 30 days of the invoice date.</div>
                <div>Bank transfer details will be provided separately.</div>
            </div>
            
            <div class="footer">
                <div>Thank you for your business!</div>
                <div>{{ company_name }} - {{ company_address }}</div>
            </div>
        </body>
        </html>
        """
        
        template_path = os.path.join(self.templates_dir, "default_template.html")
        with open(template_path, 'w') as f:
            f.write(default_template)
        
        logger.info("Created default invoice template")


class AIResponseGenerator:
    """
    Generates appropriate responses for booking requests using AI.
    """
    def __init__(self):
        # In a real implementation, you might use an LLM API like OpenAI
        pass
    
    def generate_acceptance_response(self, booking_details: Dict[str, Any]) -> str:
        """Generate an acceptance response for a booking request."""
        event_date = booking_details['event_date'].strftime('%A, %B %d, %Y')
        start_time = booking_details['start_time']
        end_time = booking_details['end_time']
        event_type = booking_details['event_type']
        organization = booking_details['organization'] or "your organization"
        
        response = f"""
        Dear {booking_details['contact_name']},

        Thank you for your booking request. We are pleased to confirm that we have reserved our venue for your {event_type} on {event_date} from {start_time} to {end_time}.

        Booking Details:
        - Event: {event_type.capitalize()}
        - Date: {event_date}
        - Time: {start_time} to {end_time}
        - Number of Attendees: {booking_details['num_attendees']}
        - Organization: {organization}

        An invoice for this booking has been attached to this email. Please review it and process the payment according to the instructions provided.

        If you have any questions or need to make changes to your booking, please don't hesitate to contact us.

        We look forward to hosting your event!

        Best regards,
        The Venue Team
        """
        
        return response.strip()
    
    def generate_rejection_response(self, booking_details: Dict[str, Any], alternative_slots: List[Dict[str, Any]]) -> str:
        """Generate a rejection response with alternative slots."""
        event_date = booking_details['event_date'].strftime('%A, %B %d, %Y')
        start_time = booking_details['start_time']
        end_time = booking_details['end_time']
        event_type = booking_details['event_type']
        
        response = f"""
        Dear {booking_details['contact_name']},

        Thank you for your booking request for a {event_type} on {event_date} from {start_time} to {end_time}.

        Unfortunately, our venue is already booked during your requested time slot. However, we have the following alternative slots available:
        """
        
        for i, slot in enumerate(alternative_slots, 1):
            slot_date = slot['date'].strftime('%A, %B %d, %Y')
            response += f"\n{i}. {slot_date} from {slot['start_time']} to {slot['end_time']}"
        
        response += """

        If any of these alternatives work for you, please let us know and we'll be happy to reserve the slot for you. Alternatively, if you have other dates in mind, please share them with us.

        We apologize for any inconvenience and hope we can still accommodate your event.

        Best regards,
        The Venue Team
        """
        
        return response.strip()


class EmailSender:
    """
    Handles sending emails with booking confirmations, rejections, and invoices.
    """
    def __init__(self, email_address: str, password: str, smtp_server: str = "smtp.gmail.com", smtp_port: int = 587):
        self.email_address = email_address
        self.password = password
        self.smtp_server = smtp_server
        self.smtp_port = smtp_port
    
    def send_email(self, to_email: str, subject: str, body: str, attachment_path: str = None) -> bool:
        """
        Send an email with optional attachment.
        Returns True if successful, False otherwise.
        """
        try:
            msg = MIMEMultipart()
            msg['From'] = self.email_address
            msg['To'] = to_email
            msg['Subject'] = subject
            
            msg.attach(MIMEText(body, 'plain'))
            
            # Attach file if provided
            if attachment_path:
                with open(attachment_path, 'rb') as f:
                    attachment = MIMEApplication(f.read(), _subtype="html")
                    attachment.add_header('Content-Disposition', 'attachment', filename=os.path.basename(attachment_path))
                    msg.attach(attachment)
            
            # Connect to SMTP server and send email
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls()
                server.login(self.email_address, self.password)
                server.send_message(msg)
            
            logger.info(f"Email sent to {to_email}")
            return True
        
        except Exception as e:
            logger.error(f"Failed to send email: {str(e)}")
            return False


class BookingManager:
    """
    Main class that orchestrates the booking process.
    """
    def __init__(self, email_address: str, email_password: str, calendar_type: str = "google", calendar_credentials_path: str = None):
        self.email_parser = EmailParser()
        self.calendar = CalendarIntegration(calendar_type, calendar_credentials_path)
        self.invoice_generator = InvoiceGenerator()
        self.ai_response = AIResponseGenerator()
        self.email_sender = EmailSender(email_address, email_password)
        self.email_address = email_address
        self.email_password = email_password
        self.next_invoice_number = self._load_invoice_counter()
        
        # Company settings - in a real system, this would be loaded from a database
        self.company_settings = {}
        
    def _load_invoice_counter(self) -> int:
        """Load the current invoice counter from file or initialize it."""
        counter_file = "invoice_counter.txt"
        try:
            with open(counter_file, 'r') as f:
                return int(f.read().strip())
        except (FileNotFoundError, ValueError):
            # If file doesn't exist or contains invalid data, start from 1001
            return 1001
    
    def _save_invoice_counter(self) -> None:
        """Save the current invoice counter to file."""
        counter_file = "invoice_counter.txt"
        with open(counter_file, 'w') as f:
            f.write(str(self.next_invoice_number))
    
    def process_booking_requests(self) -> None:
        """
        Main method to process booking requests from emails.
        This method should be called periodically to check for new booking requests.
        """
        try:
            # Connect to email server
            mail_connection = self.email_parser.connect_to_email_server(
                self.email_address, self.email_password
            )
            
            # Fetch unread emails
            emails = self.email_parser.fetch_unread_emails(mail_connection)
            
            if not emails:
                logger.info("No new booking requests found.")
                return
            
            logger.info(f"Found {len(emails)} new emails to process.")
            
            # Process each email
            for email_data in emails:
                self._process_single_email(email_data)
                
            # Close the connection
            mail_connection.logout()
            
        except Exception as e:
            logger.error(f"Error processing booking requests: {str(e)}")
    
    def _process_single_email(self, email_data: Dict[str, Any]) -> None:
        """Process a single email booking request."""
        try:
            # Extract sender information
            from_email = self._extract_email_address(email_data['from'])
            subject = email_data['subject']
            
            logger.info(f"Processing email from {from_email} with subject: {subject}")
            
            # Extract booking details from email body
            booking_details = self.email_parser.extract_booking_details(email_data['body'])
            
            # Add contact email from the sender if not extracted from body
            if not booking_details['contact_email']:
                booking_details['contact_email'] = from_email
            
            # Extract contact name from email if not found in body
            if not booking_details['contact_name']:
                booking_details['contact_name'] = self._extract_name(email_data['from'])
            
            # Check if we have the minimum required information
            if not self._validate_booking_details(booking_details):
                self._send_incomplete_request_response(from_email)
                return
            
            # Check calendar availability
            is_available = self.calendar.check_availability(
                booking_details['event_date'],
                booking_details['start_time'],
                booking_details['end_time']
            )
            
            if is_available:
                # Schedule the event in the calendar
                self.calendar.schedule_event(booking_details)
                
                # Generate invoice
                company_id = "default"  # In a real system, you would determine the company ID
                invoice_number = f"{self.next_invoice_number}"
                invoice_path = self.invoice_generator.generate_invoice(
                    booking_details, company_id, invoice_number
                )
                
                # Increment invoice number for next time
                self.next_invoice_number += 1
                self._save_invoice_counter()
                
                # Generate acceptance response
                response_body = self.ai_response.generate_acceptance_response(booking_details)
                
                # Send acceptance email with invoice
                self.email_sender.send_email(
                    from_email,
                    f"Booking Confirmation - {booking_details['event_type']} on {booking_details['event_date'].strftime('%Y-%m-%d')}",
                    response_body,
                    invoice_path
                )
                
                logger.info(f"Booking accepted and confirmed for {from_email}")
                
            else:
                # Find alternative slots
                event_duration = self._calculate_event_duration(booking_details['start_time'], booking_details['end_time'])
                alternative_slots = self.calendar.find_alternative_slots(
                    booking_details['event_date'],
                    event_duration
                )
                
                # Generate rejection response with alternatives
                response_body = self.ai_response.generate_rejection_response(
                    booking_details, alternative_slots
                )
                
                # Send rejection email
                self.email_sender.send_email(
                    from_email,
                    f"Regarding Your Booking Request - {booking_details['event_type']} on {booking_details['event_date'].strftime('%Y-%m-%d')}",
                    response_body
                )
                
                logger.info(f"Booking rejected (unavailable) for {from_email}, alternatives provided")
        
        except Exception as e:
            logger.error(f"Error processing email: {str(e)}")
            # Send error response to the sender
            try:
                self._send_error_response(self._extract_email_address(email_data['from']))
            except:
                logger.error("Could not send error response")
    
    def _extract_email_address(self, from_string: str) -> str:
        """Extract email address from the 'From' header."""
        # Simple regex to extract email address
        match = re.search(r'<([^>]+)>', from_string)
        if match:
            return match.group(1)
        else:
            # If no angle brackets, assume the whole string is an email
            return from_string.strip()
    
    def _extract_name(self, from_string: str) -> str:
        """Extract name from the 'From' header."""
        # Try to extract name from "Name <email>" format
        match = re.search(r'^([^<]+)<', from_string)
        if match:
            return match.group(1).strip()
        else:
            # If no name found, use the email address up to the @ symbol
            email = self._extract_email_address(from_string)
            return email.split('@')[0]
    
    def _validate_booking_details(self, booking_details: Dict[str, Any]) -> bool:
        """Check if we have the minimum required information for a booking."""
        required_fields = ['event_date', 'start_time', 'end_time', 'num_attendees', 'event_type']
        
        for field in required_fields:
            if not booking_details[field]:
                logger.warning(f"Missing required booking field: {field}")
                return False
        
        return True
    
    def _send_incomplete_request_response(self, to_email: str) -> None:
        """Send a response for incomplete booking requests."""
        subject = "Additional Information Needed for Your Booking Request"
        body = """
        Dear Customer,

        Thank you for your booking request. To process your request, we need some additional information:

        - Event date
        - Start and end time
        - Number of attendees
        - Type of event (e.g., meeting, conference, party)

        Please reply to this email with the missing details, and we'll be happy to check availability for you.

        Best regards,
        The Venue Team
        """
        
        self.email_sender.send_email(to_email, subject, body.strip())
        logger.info(f"Sent incomplete request response to {to_email}")
    
    def _send_error_response(self, to_email: str) -> None:
        """Send an error response when processing fails."""
        subject = "Regarding Your Booking Request"
        body = """
        Dear Customer,

        Thank you for your booking request. We apologize, but we encountered an issue while processing your request.

        Our team has been notified of this issue and will review your request manually. You may be contacted for additional information if needed.

        If your request is urgent, please call us directly at +1 (555) 123-4567.

        We apologize for any inconvenience.

        Best regards,
        The Venue Team
        """
        
        self.email_sender.send_email(to_email, subject, body.strip())
        logger.info(f"Sent error response to {to_email}")
    
    def _calculate_event_duration(self, start_time: str, end_time: str) -> int:
        """Calculate event duration in hours."""
        try:
            # Parse the time strings
            time_formats = ['%I:%M %p', '%I%p', '%I %p', '%H:%M']
            
            start_datetime = None
            end_datetime = None
            
            for fmt in time_formats:
                try:
                    start_datetime = datetime.datetime.strptime(start_time.strip().upper(), fmt)
                    break
                except ValueError:
                    continue
            
            for fmt in time_formats:
                try:
                    end_datetime = datetime.datetime.strptime(end_time.strip().upper(), fmt)
                    break
                except ValueError:
                    continue
            
            if not start_datetime or not end_datetime:
                # Default to 2 hours if parsing fails
                return 2
            
            # Calculate duration in hours
            duration = (end_datetime - start_datetime).seconds / 3600
            return max(1, round(duration))  # Minimum 1 hour, rounded to nearest hour
            
        except Exception as e:
            logger.warning(f"Error calculating event duration: {str(e)}")
            return 2  # Default to 2 hours if calculation fails
    
    def register_company_settings(self, company_id: str, settings: Dict[str, Any]) -> bool:
        """Register or update company settings."""
        try:
            self.company_settings[company_id] = settings
            logger.info(f"Registered settings for company {company_id}")
            return True
        except Exception as e:
            logger.error(f"Error registering company settings: {str(e)}")
            return False
    
    def create_invoice_template(self, company_id: str, template_html: str) -> bool:
        """Create or update a custom invoice template for a company."""
        return self.invoice_generator.create_template(company_id, template_html)


def main():
    """Main function to run the booking system."""
    import argparse
    
    # Parse command line arguments
    parser = argparse.ArgumentParser(description='Agentic AI Booking System')
    parser.add_argument('--email', required=True, help='Email address for the booking system')
    parser.add_argument('--password', required=True, help='Password for the email account')
    parser.add_argument('--calendar', default='google', choices=['google', 'outlook'], help='Calendar type to use')
    parser.add_argument('--credentials', help='Path to calendar API credentials file')
    parser.add_argument('--interval', type=int, default=300, help='Check interval in seconds (default: 300)')
    parser.add_argument('--once', action='store_true', help='Run once and exit')
    
    args = parser.parse_args()
    
    # Create booking manager
    booking_manager = BookingManager(
        args.email,
        args.password,
        args.calendar,
        args.credentials
    )
    
    if args.once:
        # Run once
        logger.info("Running booking process once")
        booking_manager.process_booking_requests()
    else:
        # Run continuously
        import time
        logger.info(f"Starting booking system, checking every {args.interval} seconds")
        
        try:
            while True:
                booking_manager.process_booking_requests()
                logger.info(f"Sleeping for {args.interval} seconds")
                time.sleep(args.interval)
        except KeyboardInterrupt:
            logger.info("Booking system stopped by user")
        except Exception as e:
            logger.error(f"Booking system error: {str(e)}")


if __name__ == "__main__":
    main()