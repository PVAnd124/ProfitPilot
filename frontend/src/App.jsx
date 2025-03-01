import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import EmailMonitor from './components/EmailMonitor';
import CalendarView from './components/CalendarView';
import InvoiceManager from './components/InvoiceManager';
import TemplateEditor from './components/TemplateEditor';
import Settings from './components/Settings';
import BookingSimulator from './components/BookingSimulator';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app">
        <aside className="sidebar">
          <div className="sidebar-header">
            <h1>AgenticAI</h1>
          </div>
          <nav className="sidebar-nav">
            <ul>
              <li>
                <Link to="/">
                  <i className="icon">📊</i>
                  Dashboard
                </Link>
              </li>
              <li>
                <Link to="/email-monitor">
                  <i className="icon">📧</i>
                  Email Monitor
                </Link>
              </li>
              <li>
                <Link to="/calendar">
                  <i className="icon">📅</i>
                  Calendar
                </Link>
              </li>
              <li>
                <Link to="/invoices">
                  <i className="icon">💰</i>
                  Invoices
                </Link>
              </li>
              <li>
                <Link to="/templates">
                  <i className="icon">📝</i>
                  Templates
                </Link>
              </li>
              <li>
                <Link to="/settings">
                  <i className="icon">⚙️</i>
                  Settings
                </Link>
              </li>
              <li>
                <Link to="/simulator">
                  <i className="icon">🤖</i>
                  Booking Simulator
                </Link>
              </li>
            </ul>
          </nav>
        </aside>
        
        <main className="content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/email-monitor" element={<EmailMonitor />} />
            <Route path="/calendar" element={<CalendarView />} />
            <Route path="/invoices" element={<InvoiceManager />} />
            <Route path="/templates" element={<TemplateEditor />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/simulator" element={<BookingSimulator />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
