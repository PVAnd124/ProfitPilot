import React, { useState, useEffect } from 'react';
import { FaSync, FaEnvelope, FaCheck, FaTimes } from 'react-icons/fa';

const EmailMonitor = () => {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [emailDetails, setEmailDetails] = useState(null);
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
            date: '2023-11-09T10:15:00',
            processed: false,
            body: 'Hi there, Our organization would like to host a workshop at your venue on November 20th. We expect around 30 attendees and would need the space from 9:00 AM until 3:00 PM. Please confirm if this date is available. Regards, Jane Smith, Company Organization'
          },
          {
            id: 'email3',
            from: 'events@techcorp.com',
            subject: 'Tech Meetup Space Request',
            date: '2023-11-08T16:45:00',
            processed: true,
            body: 'Hello, We are organizing a tech meetup and would like to use your venue on December 5th from 6:00 PM to 9:00 PM. We anticipate around 50 attendees. Please let us know the availability and pricing. Thanks, Events Team, TechCorp'
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
    
    // In a real app, this would fetch the parsed booking details
    // For now, we'll simulate with mock data
    setEmailDetails({
      event_date: '2023-11-15',
      start_time: '2:00 PM',
      end_time: '4:00 PM',
      num_attendees: 20,
      event_type: 'meeting',
      contact_name: 'John Doe',
      contact_email: 'john.doe@example.com',
      organization: 'Example Corp',
      special_requests: null
    });
  };
  
  const handleCredentialsSubmit = (e) => {
    e.preventDefault();
    // In a real app, this would validate and store credentials securely
    localStorage.setItem('bookingEmail', credentials.email);
    localStorage.setItem('bookingServer', credentials.server);
    setIsConfigured(true);
    fetchEmails();
  };
  
  const processEmail = async (accept = true) => {
    if (!selectedEmail) return;
    
    try {
      // In a real app, this would call your backend API
      // For now, we'll simulate processing
      setLoading(true);
      
      setTimeout(() => {
        // Update the email in the list
        setEmails(emails.map(email => 
          email.id === selectedEmail.id 
            ? {...email, processed: true} 
            : email
        ));
        
        // Clear selection
        setSelectedEmail(null);
        setEmailDetails(null);
        setLoading(false);
      }, 1500);
    } catch (error) {
      console.error('Error processing email:', error);
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
              <small>Note: For Gmail, you may need to use an app password.</small>
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
            
            <button type="submit" className="btn btn-primary">Connect</button>
          </form>
        </div>
      </div>
    );
  }
  
  return (
    <div>
      <h1>Email Monitor</h1>
      
      <div className="email-monitor-container">
        <div className="email-list card">
          <div className="card-header">
            <h2 className="card-title">Booking Emails</h2>
            <button 
              className="btn btn-primary" 
              onClick={fetchEmails} 
              disabled={loading}
            >
              <FaSync className={loading ? 'spin' : ''} /> Refresh
            </button>
          </div>
          
          {emails.length === 0 ? (
            <div className="empty-state">
              <FaEnvelope size={48} />
              <p>No booking emails found</p>
            </div>
          ) : (
            <ul className="email-list-items">
              {emails.map(email => (
                <li 
                  key={email.id} 
                  className={`email-item ${selectedEmail?.id === email.id ? 'selected' : ''} ${email.processed ? 'processed' : ''}`}
                  onClick={() => !email.processed && handleEmailSelect(email)}
                >
                  <div className="email-item-header">
                    <span className="email-from">{email.from}</span>
                    <span className="email-date">{new Date(email.date).toLocaleString()}</span>
                  </div>
                  <div className="email-subject">{email.subject}</div>
                  {email.processed && <span className="processed-badge">Processed</span>}
                </li>
              ))}
            </ul>
          )}
        </div>
        
        {selectedEmail && (
          <div className="email-details card">
            <div className="card-header">
              <h2 className="card-title">Email Details</h2>
              <div className="email-actions">
                <button 
                  className="btn btn-success" 
                  onClick={() => processEmail(true)}
                  disabled={loading}
                >
                  <FaCheck /> Accept
                </button>
                <button 
                  className="btn btn-danger" 
                  onClick={() => processEmail(false)}
                  disabled={loading}
                >
                  <FaTimes /> Reject
                </button>
              </div>
            </div>
            
            <div className="email-content">
              <h3>Original Email</h3>
              <div className="email-header-details">
                <p><strong>From:</strong> {selectedEmail.from}</p>
                <p><strong>Subject:</strong> {selectedEmail.subject}</p>
                <p><strong>Date:</strong> {new Date(selectedEmail.date).toLocaleString()}</p>
              </div>
              <div className="email-body">
                {selectedEmail.body}
              </div>
              
              <h3>Extracted Booking Details</h3>
              {emailDetails ? (
                <div className="booking-details">
                  <div className="detail-row">
                    <div className="detail-item">
                      <label>Event Date:</label>
                      <span>{emailDetails.event_date}</span>
                    </div>
                    <div className="detail-item">
                      <label>Time:</label>
                      <span>{emailDetails.start_time} - {emailDetails.end_time}</span>
                    </div>
                  </div>
                  
                  <div className="detail-row">
                    <div className="detail-item">
                      <label>Event Type:</label>
                      <span>{emailDetails.event_type}</span>
                    </div>
                    <div className="detail-item">
                      <label>Attendees:</label>
                      <span>{emailDetails.num_attendees}</span>
                    </div>
                  </div>
                  
                  <div className="detail-row">
                    <div className="detail-item">
                      <label>Contact:</label>
                      <span>{emailDetails.contact_name}</span>
                    </div>
                    <div className="detail-item">
                      <label>Email:</label>
                      <span>{emailDetails.contact_email}</span>
                    </div>
                  </div>
                  
                  <div className="detail-row">
                    <div className="detail-item">
                      <label>Organization:</label>
                      <span>{emailDetails.organization || 'N/A'}</span>
                    </div>
                  </div>
                  
                  {emailDetails.special_requests && (
                    <div className="detail-row">
                      <div className="detail-item full-width">
                        <label>Special Requests:</label>
                        <span>{emailDetails.special_requests}</span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p>Loading details...</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailMonitor; 