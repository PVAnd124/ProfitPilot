import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { FaChartLine, FaCalendarAlt, FaFileInvoiceDollar, FaBars, FaTimes, FaDatabase } from 'react-icons/fa';
import './App.css';

// Components
import InteractiveBackground from './components/InteractiveBackground';
import WeeklyFinancialDigest from './components/WeeklyFinancialDigest';
import EventScheduler from './components/EventScheduler';
import FinancialRecords from './components/FinancialRecords';
import DataQuery from './components/DataQuery';
import ActivityLog from './components/ActivityLog';

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
        <button className="nav-toggle" onClick={toggleNavbar}>
          {navbarOpen ? <FaTimes /> : <FaBars />}
        </button>

        {/* Sidebar Navigation */}
        <nav className={`sidebar ${navbarOpen ? 'open' : 'closed'}`}>
          <div className="logo-container">
            <h1>Profit Pilot</h1>
          </div>
          <ul className="nav-links">
            <li>
              <Link to="/weekly-digest" onClick={() => setNavbarOpen(false)}>
                <FaChartLine /> Weekly Financial Digest
              </Link>
            </li>
            <li>
              <Link to="/event-scheduler" onClick={() => setNavbarOpen(false)}>
                <FaCalendarAlt /> Event Scheduler
              </Link>
            </li>
            <li>
              <Link to="/financial-records" onClick={() => setNavbarOpen(false)}>
                <FaFileInvoiceDollar /> Complete Financial Records
              </Link>
            </li>
            <li>
              <Link to="/data-query" onClick={() => setNavbarOpen(false)}>
                <FaDatabase /> Data Query
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
