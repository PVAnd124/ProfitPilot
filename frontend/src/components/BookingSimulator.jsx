import React, { useState, useEffect } from 'react';
import { FaPaperPlane, FaCheck, FaTimes, FaSpinner } from 'react-icons/fa';
import { GoogleGenerativeAI } from '@google/generative-ai';

// CSS styles directly in the component for now
const styles = {
  simulatorContainer: {
    maxWidth: '800px',
    margin: '0 auto',
  },
  card: {
    background: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    marginBottom: '20px',
    overflow: 'hidden',
  },
  cardHeader: {
    background: '#f5f5f5',
    padding: '15px 20px',
    borderBottom: '1px solid #eee',
  },
  cardTitle: {
    margin: 0,
    fontSize: '1.2rem',
  },
  templateSelector: {
    padding: '15px 20px',
    borderBottom: '1px solid #eee',
  },
  templateButtons: {
    display: 'flex',
    gap: '10px',
    marginTop: '10px',
    flexWrap: 'wrap',
  },
  formGroup: {
    padding: '20px',
  },
  formControl: {
    width: '100%',
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontFamily: 'inherit',
    fontSize: '14px',
  },
  emailContent: {
    minHeight: '200px',
    resize: 'vertical',
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
  },
  btnPrimary: {
    backgroundColor: '#4a6cf7',
    color: 'white',
    margin: '0 20px 20px',
  },
  btnSecondary: {
    backgroundColor: '#e9ecef',
    color: '#495057',
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
  },
  detailItem: {
    display: 'flex',
    flexDirection: 'column',
  },
  detailLabel: {
    fontWeight: 'bold',
    marginBottom: '5px',
    color: '#666',
  },
  responseCard: {
    marginTop: '20px',
    padding: '20px',
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
    color: '#666',
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
      // Step 1: Extract booking details using Gemini API
      const details = await extractBookingDetails(emailContent);
      setExtractedDetails(details);
      
      // Step 2: Check availability
      setProcessingStep('checking');
      const availability = await checkAvailability(details, existingEvents);
      setAvailabilityResult(availability);
      
      // Step 3: Generate response
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
  
  // Function to extract booking details using Gemini API
  const extractBookingDetails = async (emailContent) => {
    try {
      // Initialize the Gemini API
      const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      
      // Create the prompt
      const prompt = `
        Extract the following booking details from this email:
        - Event type (e.g., meeting, conference, workshop)
        - Event date
        - Start time
        - End time
        - Number of attendees
        - Contact name
        - Contact email
        - Organization name (if mentioned)
        - Special requests (if any)

        Format the response as a JSON object with these fields:
        {
          "eventType": "...",
          "eventDate": "YYYY-MM-DD",
          "startTime": "...",
          "endTime": "...",
          "numAttendees": number,
          "contactName": "...",
          "contactEmail": "...",
          "organization": "..." (or null if not mentioned),
          "specialRequests": "..." (or null if not mentioned)
        }

        Email content:
        ${emailContent}
      `;
      
      // Generate content
      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      
      // Extract the JSON part
      const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/) || 
                        responseText.match(/{[\s\S]*?}/);
      
      if (jsonMatch) {
        const jsonStr = jsonMatch[1] || jsonMatch[0];
        return JSON.parse(jsonStr);
      } else {
        throw new Error("Could not parse the response from AI");
      }
    } catch (error) {
      console.error("Error extracting booking details:", error);
      throw error;
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
    
    // If there are conflicts, generate alternatives using Gemini
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
      // Initialize the Gemini API
      const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      
      // Create the prompt
      const prompt = `
        I need to suggest alternative time slots for a booking that has conflicts.
        
        Original booking details:
        - Date: ${bookingDetails.eventDate}
        - Time: ${bookingDetails.startTime} to ${bookingDetails.endTime}
        - Event type: ${bookingDetails.eventType}
        - Number of attendees: ${bookingDetails.numAttendees}
        
        Existing events on the calendar:
        ${existingEvents.map(event => 
          `- ${new Date(event.start).toLocaleDateString()}: ${new Date(event.start).toLocaleTimeString()} to ${new Date(event.end).toLocaleTimeString()} - ${event.title}`
        ).join('\n')}
        
        Please suggest 3 alternative time slots that avoid conflicts. Consider suggesting slots on the same day at different times, or on nearby dates.
        
        Format the response as a JSON array with objects containing:
        [
          {
            "eventDate": "YYYY-MM-DD",
            "startTime": "...",
            "endTime": "...",
            "reason": "Brief explanation of why this alternative was suggested"
          },
          ...
        ]
      `;
      
      // Generate content
      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      
      // Extract the JSON part
      const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/) || 
                        responseText.match(/\[([\s\S]*?)\]/);
      
      if (jsonMatch) {
        const jsonStr = jsonMatch[1] || jsonMatch[0];
        return JSON.parse(jsonStr);
      } else {
        // If we can't parse the JSON, return some default alternatives
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
    } catch (error) {
      console.error("Error generating alternatives:", error);
      // Return some default alternatives
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
  
  // Function to generate response
  const generateResponse = async (bookingDetails, availabilityResult) => {
    try {
      // Initialize the Gemini API
      const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      
      let prompt;
      
      if (availabilityResult.available) {
        // Generate acceptance response
        prompt = `
          Generate a professional email response accepting a booking request with the following details:
          
          - Event type: ${bookingDetails.eventType}
          - Date: ${bookingDetails.eventDate}
          - Time: ${bookingDetails.startTime} to ${bookingDetails.endTime}
          - Number of attendees: ${bookingDetails.numAttendees}
          - Contact name: ${bookingDetails.contactName}
          - Organization: ${bookingDetails.organization || 'Not specified'}
          
          The response should:
          1. Confirm the booking details
          2. Mention that an invoice will be generated and sent separately
          3. Include information about any special requests: ${bookingDetails.specialRequests || 'None'}
          4. Provide contact information for any questions
          5. Be professional and courteous
          
          Format the response as a plain text email.
        `;
      } else {
        // Generate rejection with alternatives
        prompt = `
          Generate a professional email response rejecting a booking request due to scheduling conflicts, but offering alternatives.
          
          Original booking details:
          - Event type: ${bookingDetails.eventType}
          - Date: ${bookingDetails.eventDate}
          - Time: ${bookingDetails.startTime} to ${bookingDetails.endTime}
          - Number of attendees: ${bookingDetails.numAttendees}
          - Contact name: ${bookingDetails.contactName}
          - Organization: ${bookingDetails.organization || 'Not specified'}
          
          Alternative slots available:
          ${availabilityResult.alternatives.map((alt, index) => 
            `${index + 1}. ${alt.eventDate} from ${alt.startTime} to ${alt.endTime} - ${alt.reason}`
          ).join('\n')}
          
          The response should:
          1. Politely explain that the requested slot is not available
          2. Clearly list the alternative options
          3. Ask if any of the alternatives would work
          4. Provide contact information for questions
          5. Be professional and courteous
          
          Format the response as a plain text email.
        `;
      }
      
      // Generate content
      const result = await model.generateContent(prompt);
      return result.response.text();
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
  
  return (
    <div>
      <h1>Booking Simulator</h1>
      
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
            
            <div style={{ padding: '20px', whiteSpace: 'pre-wrap' }}>
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
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingSimulator; 