import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { FaChartLine, FaCalendarAlt, FaFileInvoiceDollar, FaBars, FaTimes } from 'react-icons/fa';
import './App.css';

// Components
import InteractiveBackground from './components/InteractiveBackground';
import WeeklyFinancialDigest from './components/WeeklyFinancialDigest';
import EventScheduler from './components/EventScheduler';
import FinancialRecords from './components/FinancialRecords';

function App() {
  const [navbarOpen, setNavbarOpen] = useState(true);

  const toggleNavbar = () => {
    setNavbarOpen(!navbarOpen);
  };

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
          </ul>
        </nav>

        {/* Main Content Area */}
        <main className={`main-content ${navbarOpen ? 'with-sidebar' : 'full-width'}`}>
          <Routes>
            <Route path="/" element={<Navigate to="/weekly-digest" replace />} />
            <Route path="/weekly-digest" element={<WeeklyFinancialDigest />} />
            <Route path="/event-scheduler" element={<EventScheduler />} />
            <Route path="/financial-records" element={<FinancialRecords />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
