import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { FaChartLine, FaCalendarAlt, FaFileInvoiceDollar, FaBars, FaTimes, FaDatabase, FaEnvelope, FaBookmark } from 'react-icons/fa';
import './App.css';

// Components
import InteractiveBackground from './components/InteractiveBackground';
import WeeklyFinancialDigest from './components/WeeklyFinancialDigest';
import EventScheduler from './components/EventScheduler';
import FinancialRecords from './components/FinancialRecords';
import DataQuery from './components/DataQuery';
import ActivityLog from './components/ActivityLog';
import BookingSimulator from './components/BookingSimulator';
import InvoiceManager from './components/InvoiceManager';
import EmailMonitor from './components/EmailMonitor';

function App() {
  const [navbarOpen, setNavbarOpen] = useState(true);
  const [activityLogExpanded, setActivityLogExpanded] = useState(false);

  const toggleNavbar = () => {
    setNavbarOpen(!navbarOpen);
  };

  // Listen for custom events from the ActivityLog component
  useEffect(() => {
    const handleActivityLogExpand = (e) => {
      setActivityLogExpanded(e.detail.expanded);
    };

    document.addEventListener('activity-log-state-change', handleActivityLogExpand);
    
    return () => {
      document.removeEventListener('activity-log-state-change', handleActivityLogExpand);
    };
  }, []);

  // Update document body data attribute when activity log state changes
  useEffect(() => {
    document.body.setAttribute('data-activity-log-expanded', activityLogExpanded);
  }, [activityLogExpanded]);

  return (
    <Router>
      <div className="app-container">
        {/* Interactive Background */}
        <InteractiveBackground />
        
        {/* Navigation toggle button */}
        <button 
          className="nav-toggle" 
          onClick={toggleNavbar}
          style={{
            backgroundColor: '#0f3b64',
            color: 'white',
            border: 'none',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)',
            transition: 'all 0.3s',
            position: 'fixed',
            top: '20px',
            left: '20px',
            zIndex: 200
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#d03027'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#0f3b64'}
        >
          {navbarOpen ? <FaTimes /> : <FaBars />}
        </button>

        {/* Sidebar Navigation */}
        <nav className={`sidebar ${navbarOpen ? 'open' : 'closed'}`}>
          <div className="logo-container">
            <h1 style={{ color: 'white', textShadow: '1px 1px 2px rgba(0,0,0,0.2)' }}>Profit Pilot</h1>
          </div>
          <ul className="nav-links">
            <li>
              <Link 
                to="/weekly-digest" 
                onClick={() => setNavbarOpen(false)}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  padding: '15px 20px', 
                  color: 'white', 
                  textDecoration: 'none', 
                  transition: 'all 0.3s',
                  borderLeft: '4px solid transparent',
                  textShadow: '1px 1px 2px rgba(0,0,0,0.2)'
                }}
                activeClassName="active"
              >
                <FaChartLine style={{ marginRight: '15px', color: 'white' }} /> Weekly Financial Digest
              </Link>
            </li>
            <li>
              <Link 
                to="/event-scheduler" 
                onClick={() => setNavbarOpen(false)}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  padding: '15px 20px', 
                  color: 'white', 
                  textDecoration: 'none', 
                  transition: 'all 0.3s',
                  borderLeft: '4px solid transparent',
                  textShadow: '1px 1px 2px rgba(0,0,0,0.2)'
                }}
                activeClassName="active"
              >
                <FaCalendarAlt style={{ marginRight: '15px', color: 'white' }} /> Event Scheduler
              </Link>
            </li>
            <li>
              <Link 
                to="/financial-records" 
                onClick={() => setNavbarOpen(false)}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  padding: '15px 20px', 
                  color: 'white', 
                  textDecoration: 'none', 
                  transition: 'all 0.3s',
                  borderLeft: '4px solid transparent',
                  textShadow: '1px 1px 2px rgba(0,0,0,0.2)'
                }}
                activeClassName="active"
              >
                <FaFileInvoiceDollar style={{ marginRight: '15px', color: 'white' }} /> Complete Financial Records
              </Link>
            </li>
            <li>
              <Link 
                to="/email-monitor" 
                onClick={() => setNavbarOpen(false)}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  padding: '15px 20px', 
                  color: 'white', 
                  textDecoration: 'none', 
                  transition: 'all 0.3s',
                  borderLeft: '4px solid transparent',
                  textShadow: '1px 1px 2px rgba(0,0,0,0.2)'
                }}
                activeClassName="active"
              >
                <FaEnvelope style={{ marginRight: '15px', color: 'white' }} /> Email Monitor
              </Link>
            </li>
            <li>
              <Link 
                to="/booking-simulator" 
                onClick={() => setNavbarOpen(false)}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  padding: '15px 20px', 
                  color: 'white', 
                  textDecoration: 'none', 
                  transition: 'all 0.3s',
                  borderLeft: '4px solid transparent',
                  textShadow: '1px 1px 2px rgba(0,0,0,0.2)'
                }}
                activeClassName="active"
              >
                <FaBookmark style={{ marginRight: '15px', color: 'white' }} /> Booking Simulator
              </Link>
            </li>
            <li>
              <Link 
                to="/invoice-manager" 
                onClick={() => setNavbarOpen(false)}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  padding: '15px 20px', 
                  color: 'white', 
                  textDecoration: 'none', 
                  transition: 'all 0.3s',
                  borderLeft: '4px solid transparent',
                  textShadow: '1px 1px 2px rgba(0,0,0,0.2)'
                }}
                activeClassName="active"
              >
                <FaFileInvoiceDollar style={{ marginRight: '15px', color: 'white' }} /> Invoice Manager
              </Link>
            </li>
            <li>
              <Link 
                to="/data-query" 
                onClick={() => setNavbarOpen(false)}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  padding: '15px 20px', 
                  color: 'white', 
                  textDecoration: 'none', 
                  transition: 'all 0.3s',
                  borderLeft: '4px solid transparent',
                  textShadow: '1px 1px 2px rgba(0,0,0,0.2)'
                }}
                activeClassName="active"
              >
                <FaDatabase style={{ marginRight: '15px', color: 'white' }} /> Data Query
              </Link>
            </li>
          </ul>
        </nav>

        {/* Main Content Area */}
        <main className={`main-content ${navbarOpen ? 'with-sidebar' : 'full-width'}`}>
          <Routes>
            <Route path="/" element={<Navigate to="/weekly-digest" replace />} />
            <Route path="/weekly-digest" element={<WeeklyFinancialDigest />} />
            <Route path="/event-scheduler" element={<EventScheduler />} />
            <Route path="/financial-records" element={<FinancialRecords />} />
            <Route path="/email-monitor" element={<EmailMonitor />} />
            <Route path="/booking-simulator" element={<BookingSimulator />} />
            <Route path="/invoice-manager" element={<InvoiceManager />} />
            <Route path="/data-query" element={<DataQuery />} />
          </Routes>
        </main>
        
        {/* Activity Log Sidebar */}
        <ActivityLog 
          onStateChange={(expanded) => {
            document.dispatchEvent(new CustomEvent('activity-log-state-change', { 
              detail: { expanded } 
            }));
          }}
        />
      </div>
    </Router>
  );
}

export default App;
