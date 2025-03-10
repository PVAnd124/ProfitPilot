import React, { useState, useEffect } from 'react';
import { FaPaperPlane, FaCheck, FaTimes, FaSpinner, FaFileInvoiceDollar } from 'react-icons/fa';

// CSS styles directly in the component for now
const styles = {
  simulatorContainer: {
    maxWidth: '800px',
    margin: '0 auto',
    color: '#333',
  },
  card: {
    background: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    marginBottom: '20px',
    overflow: 'hidden',
    color: '#333',
  },
  cardHeader: {
    background: '#f5f5f5',
    padding: '15px 20px',
    borderBottom: '1px solid #eee',
  },
  cardTitle: {
    margin: 0,
    fontSize: '1.2rem',
    color: '#222',
  },
  templateSelector: {
    padding: '15px 20px',
    borderBottom: '1px solid #eee',
    color: '#333',
  },
  templateButtons: {
    display: 'flex',
    gap: '10px',
    marginTop: '10px',
    flexWrap: 'wrap',
  },
  formGroup: {
    padding: '20px',
    color: '#333',
  },
  formControl: {
    width: '100%',
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontFamily: 'inherit',
    fontSize: '14px',
    color: '#333',
    backgroundColor: '#fff',
  },
  emailContent: {
    minHeight: '200px',
    resize: 'vertical',
    color: '#333',
    backgroundColor: '#fff',
  },
  btn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '8px 16px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'background-color 0.2s',
    fontWeight: 'bold',
  },
  btnPrimary: {
    backgroundColor: '#4a6cf7',
    color: 'white',
    margin: '0 20px 20px',
  },
  btnSecondary: {
    backgroundColor: '#e9ecef',
    color: '#333',
  },
  btnOutlinePrimary: {
    backgroundColor: 'transparent',
    color: '#4a6cf7',
    border: '1px solid #4a6cf7',
    margin: '5px',
  },
  detailsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '15px',
    padding: '20px',
    color: '#333',
  },
  detailItem: {
    display: 'flex',
    flexDirection: 'column',
  },
  detailLabel: {
    fontWeight: 'bold',
    marginBottom: '5px',
    color: '#333',
  },
  responseCard: {
    marginTop: '20px',
    padding: '20px',
    backgroundColor: '#ffffff',
    color: '#333',
  },
  acceptance: {
    borderLeft: '5px solid #4caf50',
  },
  rejection: {
    borderLeft: '5px solid #f44336',
  },
  alternativesSection: {
    marginTop: '15px',
    padding: '15px',
    backgroundColor: '#f9f9f9',
    borderRadius: '4px',
    color: '#333',
  },
  spinner: {
    animation: 'spin 1s linear infinite',
    marginRight: '8px',
  },
  '@keyframes spin': {
    '0%': { transform: 'rotate(0deg)' },
    '100%': { transform: 'rotate(360deg)' },
  },
  processingStep: {
    display: 'flex',
    alignItems: 'center',
    margin: '10px 20px',
    color: '#333',
  },
  btnSuccess: {
    backgroundColor: '#28a745',
    color: 'white',
    margin: '10px 20px',
  },
  pageWrapper: {
    backgroundColor: '#f7f7f7',
    padding: '30px 20px',
    minHeight: 'calc(100vh - 80px)',
    color: '#333',
  },
  responseText: {
    padding: '20px', 
    whiteSpace: 'pre-wrap',
    backgroundColor: '#fff',
    color: '#333',
    border: '1px solid #eee',
    borderRadius: '4px',
    fontFamily: 'monospace',
    fontSize: '14px',
    lineHeight: '1.6',
  },
};

const BookingSimulator = () => {
  const [emailContent, setEmailContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [extractedDetails, setExtractedDetails] = useState(null);
  const [processingStep, setProcessingStep] = useState(null);
  const [existingEvents, setExistingEvents] = useState([]);
  const [availabilityResult, setAvailabilityResult] = useState(null);
  const [response, setResponse] = useState(null);
  const [selectedAlternative, setSelectedAlternative] = useState(null);
  const [isGeneratingInvoice, setIsGeneratingInvoice] = useState(false);
  const [generatedInvoice, setGeneratedInvoice] = useState(null);
  
  // Templates for booking requests
  const templates = [
    {
      name: 'Conference Booking',
      content: `Subject: Conference Room Booking Request

Hello,

I would like to book your venue for a conference on November 25th, 2023. We are expecting around 50 people to attend. The conference would run from 9:00 AM to 5:00 PM.

We represent Tech Solutions Inc. and would need a projector and microphone setup for our presentations.

Please let me know if this date is available and what the cost would be.

Thank you,
John Smith
john.smith@techsolutions.com
(555) 123-4567`
    },
    {
      name: 'Workshop Booking',
      content: `Subject: Workshop Space Needed

Hi there,

I'm looking to book a space for a design workshop on December 10th, 2023. We'll have about 25 attendees and would need the space from 1:00 PM until 5:00 PM.

We would need tables arranged in groups, and whiteboards if possible. Our company, Design Studio, has worked with you before.

Is this date available? What would be the total cost?

Thanks,
Sarah Johnson
Design Studio
sarah@designstudio.com`
    },
    {
      name: 'Corporate Meeting',
      content: `Subject: Meeting Room Request

To whom it may concern,

I need to book a meeting room for our quarterly board meeting on November 20th, 2023. We will have 15 people attending from Finance Group.

The meeting will run from 9:00 AM to 11:00 AM. We would need a conference table setup with water and coffee service if possible.

Please confirm availability and pricing at your earliest convenience.

Regards,
Michael Brown
CFO, Finance Group
michael@financegroup.com`
    }
  ];
  
  // Load mock existing events
  useEffect(() => {
    // In a real app, this would come from your calendar API
    setExistingEvents([
      {
        id: 1,
        title: 'Team Meeting',
        start: new Date(2023, 10, 20, 10, 0), // Nov 20, 2023, 10:00 AM
        end: new Date(2023, 10, 20, 12, 0),   // Nov 20, 2023, 12:00 PM
      },
      {
        id: 2,
        title: 'Product Launch',
        start: new Date(2023, 10, 25, 13, 0), // Nov 25, 2023, 1:00 PM
        end: new Date(2023, 10, 25, 16, 0),   // Nov 25, 2023, 4:00 PM
      },
      {
        id: 3,
        title: 'Client Workshop',
        start: new Date(2023, 11, 10, 9, 0),  // Dec 10, 2023, 9:00 AM
        end: new Date(2023, 11, 10, 12, 0),   // Dec 10, 2023, 12:00 PM
      }
    ]);
  }, []);
  
  const handleTemplateSelect = (template) => {
    setEmailContent(template.content);
  };
  
  const handleSubmit = async () => {
    if (!emailContent.trim()) {
      alert('Please enter email content');
      return;
    }
    
    setLoading(true);
    setProcessingStep('extracting');
    setExtractedDetails(null);
    setAvailabilityResult(null);
    setResponse(null);
    setSelectedAlternative(null);
    
    try {
      // Step 1: Extract booking details using the backend API
      const details = await extractBookingDetails(emailContent);
      setExtractedDetails(details);
      
      // Step 2: Check availability
      setProcessingStep('checking');
      const availability = await checkAvailability(details, existingEvents);
      setAvailabilityResult(availability);
      
      // Step 3: Generate response using the backend
      setProcessingStep('generating');
      const responseText = await generateResponse(details, availability);
      setResponse({
        type: availability.available ? 'acceptance' : 'rejection',
        message: responseText,
        alternatives: availability.available ? null : availability.alternatives
      });
      
      setProcessingStep(null);
    } catch (error) {
      console.error('Error processing booking request:', error);
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };
  
  const handleSelectAlternative = async (alternative) => {
    if (!extractedDetails) return;
    
    setSelectedAlternative(alternative);
    setLoading(true);
    setProcessingStep('rebooking');
    
    try {
      // Create updated booking details with the selected alternative
      const updatedDetails = {
        ...extractedDetails,
        eventDate: alternative.eventDate,
        startTime: alternative.startTime,
        endTime: alternative.endTime
      };
      
      // Generate acceptance for the alternative slot
      const responseText = await generateResponse(updatedDetails, { available: true });
      
      setExtractedDetails(updatedDetails);
      setResponse({
        type: 'acceptance',
        message: responseText
      });
    } catch (error) {
      console.error('Error processing alternative selection:', error);
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
      setProcessingStep(null);
    }
  };
  
  // Function to extract booking details using the backend API
  const extractBookingDetails = async (emailContent) => {
    try {
      const response = await fetch('http://localhost:8080/api/analyze-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email_body: emailContent }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to analyze email content');
      }
      
      const data = await response.json();
      
      // Transform booking_details from backend to match our frontend format
      const bookingDetails = data.booking_details;
      return {
        eventType: bookingDetails.purpose || 'Event',
        eventDate: bookingDetails.requested_date || '2023-11-25',
        startTime: bookingDetails.start_time || '9:00 AM',
        endTime: bookingDetails.end_time || '5:00 PM',
        numAttendees: bookingDetails.attendees || 10,
        contactName: bookingDetails.client_name || 'Client',
        contactEmail: bookingDetails.client_email || 'client@example.com',
        organization: bookingDetails.organization || null,
        specialRequests: bookingDetails.special_requests || null
      };
    } catch (error) {
      console.error("Error extracting booking details:", error);
      // Return default values if the API fails
      return {
        eventType: 'Event',
        eventDate: '2023-11-25',
        startTime: '9:00 AM',
        endTime: '5:00 PM',
        numAttendees: 10,
        contactName: 'Client',
        contactEmail: 'client@example.com',
        organization: null,
        specialRequests: null
      };
    }
  };
  
  // Function to check availability
  const checkAvailability = async (bookingDetails, existingEvents) => {
    // Parse the booking date and times
    const bookingDate = new Date(bookingDetails.eventDate);
    const bookingStart = parseTimeString(bookingDetails.startTime, bookingDate);
    const bookingEnd = parseTimeString(bookingDetails.endTime, bookingDate);
    
    // Check for conflicts
    const conflicts = existingEvents.filter(event => {
      const eventDate = new Date(event.start);
      // Check if it's the same day
      if (eventDate.toDateString() !== bookingDate.toDateString()) {
        return false;
      }
      
      const eventStart = new Date(event.start);
      const eventEnd = new Date(event.end);
      
      // Check for overlap
      return (
        (bookingStart >= eventStart && bookingStart < eventEnd) ||
        (bookingEnd > eventStart && bookingEnd <= eventEnd) ||
        (bookingStart <= eventStart && bookingEnd >= eventEnd)
      );
    });
    
    if (conflicts.length === 0) {
      return { available: true };
    }
    
    // If there are conflicts, generate alternatives using the backend
    const alternatives = await generateAlternatives(bookingDetails, existingEvents);
    
    return {
      available: false,
      conflicts,
      alternatives
    };
  };
  
  // Helper function to parse time strings like "9:00 AM"
  const parseTimeString = (timeString, dateObj) => {
    const date = new Date(dateObj);
    const [time, period] = timeString.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    
    if (period === 'PM' && hours < 12) {
      hours += 12;
    } else if (period === 'AM' && hours === 12) {
      hours = 0;
    }
    
    date.setHours(hours, minutes || 0, 0, 0);
    return date;
  };
  
  // Function to generate alternative time slots
  const generateAlternatives = async (bookingDetails, existingEvents) => {
    try {
      // Since we don't have a dedicated backend endpoint for alternatives yet,
      // we'll generate them on the frontend for now
      const today = new Date(bookingDetails.eventDate);
      
      // Generate alternatives for the same day, next day, and two days later
        return [
          {
            eventDate: bookingDetails.eventDate,
          startTime: "8:00 AM",
          endTime: "10:00 AM",
            reason: "Earlier time slot on the same day"
          },
          {
          eventDate: new Date(today.getTime() + 86400000).toISOString().split('T')[0],
            startTime: bookingDetails.startTime,
            endTime: bookingDetails.endTime,
            reason: "Same time slot on the next day"
          },
          {
          eventDate: new Date(today.getTime() + 172800000).toISOString().split('T')[0],
            startTime: bookingDetails.startTime,
            endTime: bookingDetails.endTime,
            reason: "Same time slot two days later"
          }
        ];
    } catch (error) {
      console.error("Error generating alternatives:", error);
      // Return default alternatives
      return [
        {
          eventDate: bookingDetails.eventDate,
          startTime: "9:00 AM",
          endTime: "12:00 PM",
          reason: "Earlier time slot on the same day"
        },
        {
          eventDate: new Date(new Date(bookingDetails.eventDate).getTime() + 86400000).toISOString().split('T')[0],
          startTime: bookingDetails.startTime,
          endTime: bookingDetails.endTime,
          reason: "Same time slot on the next day"
        },
        {
          eventDate: new Date(new Date(bookingDetails.eventDate).getTime() + 172800000).toISOString().split('T')[0],
          startTime: bookingDetails.startTime,
          endTime: bookingDetails.endTime,
          reason: "Same time slot two days later"
        }
      ];
    }
  };
  
  // Function to generate response using the backend
  const generateResponse = async (bookingDetails, availabilityResult) => {
    try {
      // Transform data to match backend API format
      const backendBookingDetails = {
        client_name: bookingDetails.contactName,
        client_email: bookingDetails.contactEmail,
        requested_date: bookingDetails.eventDate,
        start_time: bookingDetails.startTime,
        end_time: bookingDetails.endTime,
        purpose: bookingDetails.eventType,
        attendees: bookingDetails.numAttendees,
        special_requests: bookingDetails.specialRequests,
        organization: bookingDetails.organization
      };
      
      let response;
      
      if (availabilityResult.available) {
        // Generate acceptance response using backend
        response = await fetch('http://localhost:8080/api/generate-confirmation', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ booking_details: backendBookingDetails }),
        });
      } else {
        // Format alternatives for backend
        const backendAlternatives = availabilityResult.alternatives.map(alt => ({
          date: alt.eventDate,
          start_time: alt.startTime,
          end_time: alt.endTime
        }));
        
        // Generate rejection with alternatives using backend
        response = await fetch('http://localhost:8080/api/generate-rejection', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            booking_details: backendBookingDetails,
            alternative_slots: backendAlternatives
          }),
        });
      }
      
      if (!response.ok) {
        throw new Error('Failed to generate response');
      }
      
      const data = await response.json();
      return data.email_body;
    } catch (error) {
      console.error("Error generating response:", error);
      
      // Return a fallback response if the API fails
      if (availabilityResult.available) {
        return `Dear ${bookingDetails.contactName},\n\nThank you for your booking request. We are pleased to confirm your ${bookingDetails.eventType} on ${bookingDetails.eventDate} from ${bookingDetails.startTime} to ${bookingDetails.endTime}.\n\nAn invoice will be sent separately.\n\nBest regards,\nThe Venue Team`;
      } else {
        return `Dear ${bookingDetails.contactName},\n\nThank you for your booking request. Unfortunately, the requested time slot is not available. Please consider one of our alternative slots.\n\nBest regards,\nThe Venue Team`;
      }
    }
  };
  
  // Render loading indicator based on processing step
  const renderProcessingStep = () => {
    if (!processingStep) return null;
    
    const steps = {
      extracting: 'Extracting booking details...',
      checking: 'Checking calendar availability...',
      generating: 'Generating response...',
      rebooking: 'Processing alternative booking...'
    };
    
    return (
      <div style={styles.processingStep}>
        <FaSpinner style={styles.spinner} />
        <span>{steps[processingStep]}</span>
      </div>
    );
  };
  
  // Improved function to handle invoice generation with better debugging
  const handleGenerateInvoice = async () => {
    if (!extractedDetails) {
      alert('No booking details available to generate an invoice.');
      return;
    }
    
    setIsGeneratingInvoice(true);
    
    try {
      // Format booking details to match the API expectation
      const bookingDetails = {
        client_name: extractedDetails.contactName,
        client_email: extractedDetails.contactEmail,
        requested_date: extractedDetails.eventDate,
        start_time: extractedDetails.startTime,
        end_time: extractedDetails.endTime,
        purpose: extractedDetails.eventType,
        attendees: parseInt(extractedDetails.numAttendees),
        special_requests: extractedDetails.specialRequests,
        organization: extractedDetails.organization
      };
      
      console.log('Sending booking details for invoice generation:', bookingDetails);
      
      const response = await fetch('http://localhost:8080/api/generate-invoice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          booking_details: bookingDetails
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server error:', errorText);
        throw new Error(`Server responded with ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      console.log('Invoice generation response:', data);
      
      setGeneratedInvoice(data.invoice);
      
      // Update the UI to show success
      alert('Invoice generated successfully! View it in the Invoice Manager.');
    } catch (error) {
      console.error('Error generating invoice:', error);
      alert(`Failed to generate invoice: ${error.message}. Check console for details.`);
    } finally {
      setIsGeneratingInvoice(false);
    }
  };
  
  return (
    <div style={styles.pageWrapper}>
      <h1 style={{color: '#222', marginBottom: '30px'}}>Booking Simulator</h1>
      
      <div style={styles.simulatorContainer}>
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h2 style={styles.cardTitle}>Compose Booking Request Email</h2>
          </div>
          
          <div style={styles.templateSelector}>
            <label>Choose a template:</label>
            <div style={styles.templateButtons}>
              {templates.map((template, index) => (
                <button 
                  key={index}
                  style={{...styles.btn, ...styles.btnSecondary}}
                  onClick={() => handleTemplateSelect(template)}
                >
                  {template.name}
                </button>
              ))}
            </div>
          </div>
          
          <div style={styles.formGroup}>
            <textarea
              style={{...styles.formControl, ...styles.emailContent}}
              value={emailContent}
              onChange={(e) => setEmailContent(e.target.value)}
              placeholder="Type your booking request email here..."
              rows="15"
            ></textarea>
          </div>
          
          <button 
            style={{...styles.btn, ...styles.btnPrimary}}
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <>Processing... {processingStep && `(${processingStep})`}</>
            ) : (
              <>
                <FaPaperPlane style={{ marginRight: '8px' }} /> Send Booking Request
              </>
            )}
          </button>
          
          {renderProcessingStep()}
        </div>
        
        {extractedDetails && (
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h2 style={styles.cardTitle}>Extracted Booking Details</h2>
            </div>
            
            <div style={styles.detailsGrid}>
              <div style={styles.detailItem}>
                <label style={styles.detailLabel}>Event Date:</label>
                <span>{extractedDetails.eventDate}</span>
              </div>
              
              <div style={styles.detailItem}>
                <label style={styles.detailLabel}>Time:</label>
                <span>{extractedDetails.startTime} - {extractedDetails.endTime}</span>
              </div>
              
              <div style={styles.detailItem}>
                <label style={styles.detailLabel}>Event Type:</label>
                <span>{extractedDetails.eventType}</span>
              </div>
              
              <div style={styles.detailItem}>
                <label style={styles.detailLabel}>Attendees:</label>
                <span>{extractedDetails.numAttendees}</span>
              </div>
              
              <div style={styles.detailItem}>
                <label style={styles.detailLabel}>Contact:</label>
                <span>{extractedDetails.contactName}</span>
              </div>
              
              <div style={styles.detailItem}>
                <label style={styles.detailLabel}>Email:</label>
                <span>{extractedDetails.contactEmail}</span>
              </div>
              
              <div style={styles.detailItem}>
                <label style={styles.detailLabel}>Organization:</label>
                <span>{extractedDetails.organization || 'Not specified'}</span>
              </div>
              
              <div style={styles.detailItem}>
                <label style={styles.detailLabel}>Special Requests:</label>
                <span>{extractedDetails.specialRequests || 'None'}</span>
              </div>
            </div>
          </div>
        )}
        
        {response && (
          <div style={{
            ...styles.card, 
            ...styles.responseCard,
            ...(response.type === 'acceptance' ? styles.acceptance : styles.rejection)
          }}>
            <div style={styles.cardHeader}>
              <h2 style={styles.cardTitle}>
                {response.type === 'acceptance' ? (
                  <>
                    <FaCheck style={{ color: '#4caf50', marginRight: '8px' }} /> Booking Accepted
                  </>
                ) : (
                  <>
                    <FaTimes style={{ color: '#f44336', marginRight: '8px' }} /> Booking Rejected
                  </>
                )}
              </h2>
            </div>
            
            <div style={styles.responseText}>
              {response.message}
            </div>
            
            {response.type === 'rejection' && response.alternatives && (
              <div style={styles.alternativesSection}>
                <h3>Select an Alternative Slot:</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                  {response.alternatives.map((alt, index) => (
                    <button
                      key={index}
                      style={{...styles.btn, ...styles.btnOutlinePrimary}}
                      onClick={() => handleSelectAlternative(alt)}
                      disabled={loading}
                    >
                      {alt.eventDate} from {alt.startTime} to {alt.endTime}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {response.type === 'acceptance' && (
              <div style={{ padding: '0 20px 20px' }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  padding: '10px', 
                  backgroundColor: '#e8f5e9', 
                  borderRadius: '4px' 
                }}>
                  <div style={{ marginRight: '10px', fontSize: '24px' }}>📄</div>
                  <div>
                    <strong>Invoice Generated</strong>
                    <p style={{ margin: '5px 0 0' }}>An invoice has been generated and would be attached to the email.</p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Add the invoice generation button if booking is confirmed */}
            {response.type === 'acceptance' && (
              <button 
                onClick={handleGenerateInvoice}
                disabled={isGeneratingInvoice}
                style={{
                  ...styles.btn,
                  ...styles.btnSuccess
                }}
              >
                {isGeneratingInvoice ? (
                  <><FaSpinner style={{ animation: 'spin 1s linear infinite', marginRight: '8px' }} /> Generating Invoice...</>
                ) : (
                  <><FaFileInvoiceDollar style={{ marginRight: '8px' }} /> Generate Invoice</>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingSimulator; 