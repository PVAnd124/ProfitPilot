import React, { useState, useEffect } from 'react';
import { FaRobot, FaEnvelope, FaCalendarCheck, FaFileInvoiceDollar, FaSearch } from 'react-icons/fa';
import './ActivityLog.css';

const ActivityLog = () => {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    // In a real app, this would fetch from an API or use websockets
    // For demo, we'll generate some sample logs
    const sampleLogs = [
      {
        id: 1,
        action: 'email_response',
        description: 'Responded to booking inquiry from sarah@example.com',
        timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 minutes ago
        icon: <FaEnvelope />
      },
      {
        id: 2,
        action: 'booking_created',
        description: 'Created booking for Acme Corp Workshop on Nov 28',
        timestamp: new Date(Date.now() - 1000 * 60 * 22).toISOString(), // 22 minutes ago
        icon: <FaCalendarCheck />
      },
      {
        id: 3,
        action: 'invoice_generated',
        description: 'Generated invoice #INV-2024-118 for $1,250.00',
        timestamp: new Date(Date.now() - 1000 * 60 * 47).toISOString(), // 47 minutes ago
        icon: <FaFileInvoiceDollar />
      },
      {
        id: 4,
        action: 'data_query',
        description: 'Analyzed Q1 2023 revenue data',
        timestamp: new Date(Date.now() - 1000 * 60 * 95).toISOString(), // ~1.5 hours ago
        icon: <FaSearch />
      },
      {
        id: 5,
        action: 'booking_update',
        description: 'Rescheduled Tech Solutions meeting to Dec 5',
        timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(), // 3 hours ago
        icon: <FaCalendarCheck />
      },
      {
        id: 6,
        action: 'email_response',
        description: 'Sent venue information to john@company.org',
        timestamp: new Date(Date.now() - 1000 * 60 * 300).toISOString(), // 5 hours ago
        icon: <FaEnvelope />
      },
      {
        id: 7,
        action: 'invoice_generated',
        description: 'Generated invoice #INV-2024-117 for $850.00',
        timestamp: new Date(Date.now() - 1000 * 60 * 1200).toISOString(), // 20 hours ago
        icon: <FaFileInvoiceDollar />
      }
    ];
    
    setLogs(sampleLogs);
    
    // Simulate new log entries being added periodically
    const interval = setInterval(() => {
      const actions = [
        {
          action: 'email_response',
          description: 'Responded to availability inquiry from new-client@example.com',
          icon: <FaEnvelope />
        },
        {
          action: 'booking_created',
          description: 'Created booking for Team Building event on Dec 10',
          icon: <FaCalendarCheck />
        },
        {
          action: 'data_query',
          description: 'Analyzed sales performance for current quarter',
          icon: <FaSearch />
        }
      ];
      
      const randomAction = actions[Math.floor(Math.random() * actions.length)];
      
      setLogs(prevLogs => [{
        id: Date.now(),
        ...randomAction,
        timestamp: new Date().toISOString()
      }, ...prevLogs.slice(0, 20)]);  // Keep only the most recent 20 logs
    }, 45000);  // Add a new log every 45 seconds
    
    return () => clearInterval(interval);
  }, []);

  const formatTimestamp = (isoString) => {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays}d ago`;
  };

  return (
    <div className="activity-log">
      <div className="activity-log-header">
        <div className="activity-log-title">
          <FaRobot className="activity-log-icon" />
          <h2>AI Activity Log</h2>
        </div>
        <div className="activity-status online">Active</div>
      </div>
      
      <div className="activity-log-body">
        {logs.map((log, index) => (
          <div 
            key={log.id} 
            className="activity-item"
            style={{ 
              opacity: Math.max(0.4, 1 - (index * 0.1)),
              animationDelay: `${index * 0.05}s`
            }}
          >
            <div className="activity-icon">
              {log.icon}
            </div>
            <div className="activity-content">
              <div className="activity-description">{log.description}</div>
              <div className="activity-timestamp">{formatTimestamp(log.timestamp)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ActivityLog; 