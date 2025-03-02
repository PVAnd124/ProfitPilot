import React, { useState, useEffect } from 'react';
import { FaSync, FaEnvelope, FaCheck, FaTimes, FaRobot } from 'react-icons/fa';
import './EmailMonitor.css';

const EmailMonitor = () => {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [emailDetails, setEmailDetails] = useState(null);
  const [aiAnalysisResults, setAiAnalysisResults] = useState(null);
  const [aiGeneratedResponse, setAiGeneratedResponse] = useState('');
  const [processingAction, setProcessingAction] = useState('');
  const [credentials, setCredentials] = useState({
    email: '',
    password: '',
    server: 'imap.gmail.com'
  });
  const [isConfigured, setIsConfigured] = useState(false);
  
  useEffect(() => {
    // Check if credentials are stored
    const storedEmail = localStorage.getItem('bookingEmail');
    const storedServer = localStorage.getItem('bookingServer');
    
    if (storedEmail && storedServer) {
      setCredentials({
        email: storedEmail,
        password: '',
        server: storedServer
      });
      setIsConfigured(true);
      fetchEmails();
    }
  }, []);
  
  const fetchEmails = async () => {
    setLoading(true);
    try {
      // In a real app, this would be an API call to your backend
      // For now, we'll simulate with mock data
      setTimeout(() => {
        const mockEmails = [
          {
            id: 'email1',
            from: 'john.doe@example.com',
            subject: 'Booking Request for Conference Room',
            date: '2023-11-10T14:30:00',
            processed: false,
            body: 'Hello, I would like to book the conference room for a team meeting on November 15th from 2:00 PM to 4:00 PM. We will have about 20 people attending. Please let me know if this is possible. Thanks, John'
          },
          {
            id: 'email2',
            from: 'jane.smith@company.org',
            subject: 'Workshop Booking Inquiry',
            date: '2023-11-09T09:15:00',
            processed: false,
            body: 'Hi there, I\'m interested in booking your space for a workshop on digital marketing. The event would be on December 5th, 2023, from 9 AM until 5 PM. We expect around 30-35 attendees. We would need projector facilities and a whiteboard. Please let me know the availability and pricing. Best regards, Jane Smith.'
          },
          {
            id: 'email3',
            from: 'michael.johnson@example.net',
            subject: 'Private Event Space',
            date: '2023-11-08T16:45:00',
            processed: true,
            body: 'To whom it may concern, I\'m looking to book a private room for a retirement celebration on January 20, 2024. We would need the space from 6:00 PM to 10:00 PM and expect approximately 40-50 guests. Do you offer catering services or can we bring our own? Thank you, Michael Johnson'
          }
        ];
        setEmails(mockEmails);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error fetching emails:', error);
      setLoading(false);
    }
  };
  
  const handleEmailSelect = (email) => {
    setSelectedEmail(email);
    // Reset AI analysis when selecting a new email
    setAiAnalysisResults(null);
    setAiGeneratedResponse('');
    
    // In a real app, you would fetch more details about the email
    // For now, we'll just use what we have
    setEmailDetails({
      ...email,
      fullBody: email.body,
      attachments: []
    });
  };
  
  const handleCredentialsSubmit = (e) => {
    e.preventDefault();
    localStorage.setItem('bookingEmail', credentials.email);
    localStorage.setItem('bookingServer', credentials.server);
    setIsConfigured(true);
    fetchEmails();
  };
  
  const analyzeEmailWithGemini = async () => {
    if (!selectedEmail) return;
    
    setProcessingAction('analyzing');
    setLoading(true);
    
    try {
      // Call the backend API to analyze the email with Gemini
      const response = await fetch('http://localhost:8080/api/analyze-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email_body: selectedEmail.body }),
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }
      
      const data = await response.json();
      setAiAnalysisResults(data.booking_details);
      setLoading(false);
    } catch (error) {
      console.error('Error analyzing email with Gemini:', error);
      setLoading(false);
    }
  };
  
  const processEmail = async (accept = true) => {
    if (!selectedEmail || !aiAnalysisResults) return;
    
    try {
      setProcessingAction(accept ? 'accepting' : 'rejecting');
      setLoading(true);
      
      // Generate either a confirmation or rejection email using Gemini API
      const endpoint = accept ? 'generate-confirmation' : 'generate-rejection';
      
      // In a real app, you would have actual alternative slots from your calendar system
      const alternativeSlots = [
        {
          date: '2023-11-16',
          start_time: '10:00 AM',
          end_time: '12:00 PM',
        },
        {
          date: '2023-11-17',
          start_time: '3:00 PM',
          end_time: '5:00 PM',
        }
      ];
      
      const payload = {
        booking_details: aiAnalysisResults,
      };
      
      if (!accept) {
        payload.alternative_slots = alternativeSlots;
      }
      
      const response = await fetch(`http://localhost:8080/api/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }
      
      const data = await response.json();
      setAiGeneratedResponse(data.email_body);
      
      // Update the email in the list to mark as processed
      setEmails(emails.map(email => 
        email.id === selectedEmail.id 
          ? {...email, processed: true} 
          : email
      ));
      
      setLoading(false);
    } catch (error) {
      console.error('Error processing email:', error);
      setLoading(false);
    }
  };
  
  const sendResponse = async () => {
    if (!selectedEmail || !aiGeneratedResponse) return;
    
    setProcessingAction('sending');
    setLoading(true);
    
    try {
      // In a real app, this would call your backend to send the email
      // For now, we'll simulate sending
      setTimeout(() => {
        setLoading(false);
        // Clear selection and reset state
        setSelectedEmail(null);
        setEmailDetails(null);
        setAiAnalysisResults(null);
        setAiGeneratedResponse('');
      }, 1500);
    } catch (error) {
      console.error('Error sending response:', error);
      setLoading(false);
    }
  };
  
  if (!isConfigured) {
    return (
      <div>
        <h1>Email Monitor</h1>
        
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Configure Email Access</h2>
          </div>
          
          <form onSubmit={handleCredentialsSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                className="form-control"
                value={credentials.email}
                onChange={(e) => setCredentials({...credentials, email: e.target.value})}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                className="form-control"
                value={credentials.password}
                onChange={(e) => setCredentials({...credentials, password: e.target.value})}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="server">IMAP Server</label>
              <input
                type="text"
                id="server"
                className="form-control"
                value={credentials.server}
                onChange={(e) => setCredentials({...credentials, server: e.target.value})}
                required
              />
            </div>
            
            <button type="submit" className="btn btn-primary">Save and Connect</button>
          </form>
        </div>
      </div>
    );
  }
  
  return (
    <div>
      <h1>Email Monitor</h1>
      
      <div className="toolbar">
        <button onClick={fetchEmails} className="btn btn-refresh" disabled={loading}>
          <FaSync className={loading ? 'spinning' : ''} /> Refresh
        </button>
      </div>
      
      <div className="email-container">
        <div className="email-list">
          <h2>Booking Requests</h2>
          {emails.length === 0 ? (
            <p className="no-data">No emails found</p>
          ) : (
            <ul>
              {emails.map(email => (
                <li 
                  key={email.id} 
                  className={`email-item ${email.processed ? 'processed' : ''} ${selectedEmail?.id === email.id ? 'selected' : ''}`}
                  onClick={() => !email.processed && handleEmailSelect(email)}
                >
                  <div className="email-icon">
                    <FaEnvelope />
                  </div>
                  <div className="email-info">
                    <div className="email-from">{email.from}</div>
                    <div className="email-subject">{email.subject}</div>
                    <div className="email-date">{new Date(email.date).toLocaleString()}</div>
                  </div>
                  {email.processed && (
                    <div className="email-processed-icon">
                      <FaCheck />
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
        
        <div className="email-detail">
          {selectedEmail ? (
            <>
              <div className="email-header">
                <h3>{selectedEmail.subject}</h3>
                <div className="email-metadata">
                  <div><strong>From:</strong> {selectedEmail.from}</div>
                  <div><strong>Date:</strong> {new Date(selectedEmail.date).toLocaleString()}</div>
                </div>
              </div>
              
              <div className="email-body">
                {emailDetails?.fullBody}
              </div>
              
              <div className="action-buttons">
                {!aiAnalysisResults && (
                  <button 
                    onClick={analyzeEmailWithGemini} 
                    className="btn btn-primary"
                    disabled={loading}
                  >
                    <FaRobot /> {loading && processingAction === 'analyzing' ? 'Analyzing...' : 'Analyze with Gemini AI'}
                  </button>
                )}
                
                {aiAnalysisResults && !aiGeneratedResponse && (
                  <>
                    <div className="analysis-results">
                      <h4>Gemini AI Analysis Results:</h4>
                      <div className="result-card">
                        <div><strong>Client:</strong> {aiAnalysisResults.client_name}</div>
                        <div><strong>Email:</strong> {aiAnalysisResults.client_email}</div>
                        <div><strong>Date:</strong> {aiAnalysisResults.requested_date}</div>
                        <div><strong>Time:</strong> {aiAnalysisResults.start_time} - {aiAnalysisResults.end_time}</div>
                        <div><strong>Purpose:</strong> {aiAnalysisResults.purpose}</div>
                        <div><strong>Attendees:</strong> {aiAnalysisResults.attendees}</div>
                        {aiAnalysisResults.special_requests && (
                          <div><strong>Special Requests:</strong> {aiAnalysisResults.special_requests}</div>
                        )}
                      </div>
                      
                      <div className="action-row">
                        <button 
                          onClick={() => processEmail(true)} 
                          className="btn btn-success"
                          disabled={loading}
                        >
                          <FaCheck /> {loading && processingAction === 'accepting' ? 'Generating...' : 'Accept & Generate Response'}
                        </button>
                        <button 
                          onClick={() => processEmail(false)} 
                          className="btn btn-danger"
                          disabled={loading}
                        >
                          <FaTimes /> {loading && processingAction === 'rejecting' ? 'Generating...' : 'Reject & Offer Alternatives'}
                        </button>
                      </div>
                    </div>
                  </>
                )}
                
                {aiGeneratedResponse && (
                  <>
                    <div className="response-preview">
                      <h4>Generated Response Email:</h4>
                      <div className="response-content">
                        <pre>{aiGeneratedResponse}</pre>
                      </div>
                      
                      <button 
                        onClick={sendResponse} 
                        className="btn btn-primary"
                        disabled={loading}
                      >
                        <FaEnvelope /> {loading && processingAction === 'sending' ? 'Sending...' : 'Send Response'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </>
          ) : (
            <div className="no-selection">
              <p>Select an email from the list to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmailMonitor; 