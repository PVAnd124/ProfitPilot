import React, { useState, useEffect } from 'react';
import { FaSave, FaSync } from 'react-icons/fa';

const Settings = () => {
  const [settings, setSettings] = useState({
    email: {
      address: '',
      password: '',
      server: 'imap.gmail.com',
      smtpServer: 'smtp.gmail.com',
      smtpPort: 587
    },
    calendar: {
      type: 'google',
      credentialsPath: '',
      checkInterval: 300
    },
    company: {
      name: 'Your Venue Name',
      address: '123 Venue Street, City, Country',
      email: 'bookings@yourvenue.com',
      phone: '+1 (555) 123-4567',
      logo: ''
    },
    pricing: {
      basePrice: 500,
      perPersonPrice: 25
    },
    system: {
      autoStart: false,
      debugMode: false
    }
  });
  
  const [activeTab, setActiveTab] = useState('email');
  const [isSaving, setIsSaving] = useState(false);
  const [testStatus, setTestStatus] = useState({
    email: null,
    calendar: null
  });
  
  useEffect(() => {
    // In a real app, this would load settings from backend/localStorage
    const savedEmail = localStorage.getItem('bookingEmail');
    const savedServer = localStorage.getItem('bookingServer');
    
    if (savedEmail) {
      setSettings(prev => ({
        ...prev,
        email: {
          ...prev.email,
          address: savedEmail,
          server: savedServer || prev.email.server
        }
      }));
    }
  }, []);
  
  const handleInputChange = (section, field, value) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };
  
  const handleSaveSettings = async () => {
    setIsSaving(true);
    
    try {
      // In a real app, this would save settings to backend
      // For now, we'll just save to localStorage
      localStorage.setItem('bookingEmail', settings.email.address);
      localStorage.setItem('bookingServer', settings.email.server);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Error saving settings');
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleTestConnection = async (type) => {
    try {
      setTestStatus(prev => ({
        ...prev,
        [type]: 'testing'
      }));
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Randomly succeed or fail for demo purposes
      const success = Math.random() > 0.3;
      
      setTestStatus(prev => ({
        ...prev,
        [type]: success ? 'success' : 'error'
      }));
      
      setTimeout(() => {
        setTestStatus(prev => ({
          ...prev,
          [type]: null
        }));
      }, 3000);
    } catch (error) {
      console.error(`Error testing ${type} connection:`, error);
      setTestStatus(prev => ({
        ...prev,
        [type]: 'error'
      }));
    }
  };
  
  return (
    <div>
      <h1>Settings</h1>
      
      <div className="settings-container card">
        <div className="tabs">
          <div 
            className={`tab ${activeTab === 'email' ? 'active' : ''}`}
            onClick={() => setActiveTab('email')}
          >
            Email
          </div>
          <div 
            className={`tab ${activeTab === 'calendar' ? 'active' : ''}`}
            onClick={() => setActiveTab('calendar')}
          >
            Calendar
          </div>
          <div 
            className={`tab ${activeTab === 'company' ? 'active' : ''}`}
            onClick={() => setActiveTab('company')}
          >
            Company
          </div>
          <div 
            className={`tab ${activeTab === 'pricing' ? 'active' : ''}`}
            onClick={() => setActiveTab('pricing')}
          >
            Pricing
          </div>
          <div 
            className={`tab ${activeTab === 'system' ? 'active' : ''}`}
            onClick={() => setActiveTab('system')}
          >
            System
          </div>
        </div>
        
        <div className="tab-content">
          {activeTab === 'email' && (
            <div className="email-settings">
              <div className="form-group">
                <label htmlFor="emailAddress">Email Address</label>
                <input
                  type="email"
                  id="emailAddress"
                  className="form-control"
                  value={settings.email.address}
                  onChange={(e) => handleInputChange('email', 'address', e.target.value)}
                  placeholder="booking@yourvenue.com"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="emailPassword">Password</label>
                <input
                  type="password"
                  id="emailPassword"
                  className="form-control"
                  value={settings.email.password}
                  onChange={(e) => handleInputChange('email', 'password', e.target.value)}
                  placeholder="Enter password"
                />
                <small>For Gmail, you may need to use an app password.</small>
              </div>
              
              <div className="form-row">
                <div className="form-group half">
                  <label htmlFor="imapServer">IMAP Server</label>
                  <input
                    type="text"
                    id="imapServer"
                    className="form-control"
                    value={settings.email.server}
                    onChange={(e) => handleInputChange('email', 'server', e.target.value)}
                  />
                </div>
                
                <div className="form-group half">
                  <label htmlFor="smtpServer">SMTP Server</label>
                  <input
                    type="text"
                    id="smtpServer"
                    className="form-control"
                    value={settings.email.smtpServer}
                    onChange={(e) => handleInputChange('email', 'smtpServer', e.target.value)}
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="smtpPort">SMTP Port</label>
                <input
                  type="number"
                  id="smtpPort"
                  className="form-control"
                  value={settings.email.smtpPort}
                  onChange={(e) => handleInputChange('email', 'smtpPort', parseInt(e.target.value))}
                />
              </div>
              
              <button 
                className="btn btn-secondary"
                onClick={() => handleTestConnection('email')}
                disabled={testStatus.email === 'testing'}
              >
                <FaSync className={testStatus.email === 'testing' ? 'spin' : ''} /> 
                Test Connection
                {testStatus.email === 'success' && <span className="test-success"> ✓ Success</span>}
                {testStatus.email === 'error' && <span className="test-error"> ✗ Failed</span>}
              </button>
            </div>
          )}
          
          {activeTab === 'calendar' && (
            <div className="calendar-settings">
              <div className="form-group">
                <label htmlFor="calendarType">Calendar Type</label>
                <select
                  id="calendarType"
                  className="form-control"
                  value={settings.calendar.type}
                  onChange={(e) => handleInputChange('calendar', 'type', e.target.value)}
                >
                  <option value="google">Google Calendar</option>
                  <option value="outlook">Microsoft Outlook</option>
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="credentialsPath">Credentials File Path</label>
                <input
                  type="text"
                  id="credentialsPath"
                  className="form-control"
                  value={settings.calendar.credentialsPath}
                  onChange={(e) => handleInputChange('calendar', 'credentialsPath', e.target.value)}
                  placeholder="/path/to/credentials.json"
                />
                <small>Path to the API credentials file for {settings.calendar.type === 'google' ? 'Google Calendar' : 'Microsoft Outlook'}</small>
              </div>
              
              <div className="form-group">
                <label htmlFor="checkInterval">Check Interval (seconds)</label>
                <input
                  type="number"
                  id="checkInterval"
                  className="form-control"
                  value={settings.calendar.checkInterval}
                  onChange={(e) => handleInputChange('calendar', 'checkInterval', parseInt(e.target.value))}
                  min="60"
                />
                <small>How often the system checks for new booking requests</small>
              </div>
              
              <button 
                className="btn btn-secondary"
                onClick={() => handleTestConnection('calendar')}
                disabled={testStatus.calendar === 'testing'}
              >
                <FaSync className={testStatus.calendar === 'testing' ? 'spin' : ''} /> 
                Test Connection
                {testStatus.calendar === 'success' && <span className="test-success"> ✓ Success</span>}
                {testStatus.calendar === 'error' && <span className="test-error"> ✗ Failed</span>}
              </button>
            </div>
          )}
          
          {activeTab === 'company' && (
            <div className="company-settings">
              <div className="form-group">
                <label htmlFor="companyName">Company Name</label>
                <input
                  type="text"
                  id="companyName"
                  className="form-control"
                  value={settings.company.name}
                  onChange={(e) => handleInputChange('company', 'name', e.target.value)}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="companyAddress">Address</label>
                <textarea
                  id="companyAddress"
                  className="form-control"
                  value={settings.company.address}
                  onChange={(e) => handleInputChange('company', 'address', e.target.value)}
                  rows="2"
                ></textarea>
              </div>
              
              <div className="form-row">
                <div className="form-group half">
                  <label htmlFor="companyEmail">Email</label>
                  <input
                    type="email"
                    id="companyEmail"
                    className="form-control"
                    value={settings.company.email}
                    onChange={(e) => handleInputChange('company', 'email', e.target.value)}
                  />
                </div>
                
                <div className="form-group half">
                  <label htmlFor="companyPhone">Phone</label>
                  <input
                    type="text"
                    id="companyPhone"
                    className="form-control"
                    value={settings.company.phone}
                    onChange={(e) => handleInputChange('company', 'phone', e.target.value)}
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="companyLogo">Logo URL</label>
                <input
                  type="text"
                  id="companyLogo"
                  className="form-control"
                  value={settings.company.logo}
                  onChange={(e) => handleInputChange('company', 'logo', e.target.value)}
                  placeholder="https://example.com/logo.png"
                />
              </div>
              
              {settings.company.logo && (
                <div className="logo-preview">
                  <img src={settings.company.logo} alt="Company Logo" />
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'pricing' && (
            <div className="pricing-settings">
              <div className="form-group">
                <label htmlFor="basePrice">Base Price ($)</label>
                <input
                  type="number"
                  id="basePrice"
                  className="form-control"
                  value={settings.pricing.basePrice}
                  onChange={(e) => handleInputChange('pricing', 'basePrice', parseInt(e.target.value))}
                  min="0"
                />
                <small>Base price for venue booking</small>
              </div>
              
              <div className="form-group">
                <label htmlFor="perPersonPrice">Per Person Price ($)</label>
                <input
                  type="number"
                  id="perPersonPrice"
                  className="form-control"
                  value={settings.pricing.perPersonPrice}
                  onChange={(e) => handleInputChange('pricing', 'perPersonPrice', parseInt(e.target.value))}
                  min="0"
                />
                <small>Additional price per attendee</small>
              </div>
              
              <div className="pricing-example">
                <h3>Example Calculation</h3>
                <p>For an event with 50 attendees:</p>
                <div className="calculation">
                  <div>Base Price: ${settings.pricing.basePrice}</div>
                  <div>Attendee Fee: ${settings.pricing.perPersonPrice} × 50 = ${settings.pricing.perPersonPrice * 50}</div>
                  <div className="total">Total: ${settings.pricing.basePrice + (settings.pricing.perPersonPrice * 50)}</div>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'system' && (
            <div className="system-settings">
              <div className="form-group checkbox-group">
                <input
                  type="checkbox"
                  id="autoStart"
                  checked={settings.system.autoStart}
                  onChange={(e) => handleInputChange('system', 'autoStart', e.target.checked)}
                />
                <label htmlFor="autoStart">Auto-start system on server boot</label>
              </div>
              
              <div className="form-group checkbox-group">
                <input
                  type="checkbox"
                  id="debugMode"
                  checked={settings.system.debugMode}
                  onChange={(e) => handleInputChange('system', 'debugMode', e.target.checked)}
                />
                <label htmlFor="debugMode">Enable debug mode (verbose logging)</label>
              </div>
              
              <div className="system-actions">
                <button className="btn btn-warning">
                  Clear All Data
                </button>
                <button className="btn btn-danger">
                  Reset to Defaults
                </button>
              </div>
            </div>
          )}
        </div>
        
        <div className="settings-footer">
          <button 
            className="btn btn-primary"
            onClick={handleSaveSettings}
            disabled={isSaving}
          >
            <FaSave /> {isSaving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings; 