import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaEnvelope, FaCalendarAlt, FaFileInvoiceDollar, FaCog } from 'react-icons/fa';

const Dashboard = () => {
  const [stats, setStats] = useState({
    pendingEmails: 0,
    processedToday: 0,
    upcomingEvents: 0,
    invoicesGenerated: 0
  });
  
  const [recentBookings, setRecentBookings] = useState([]);
  const [systemStatus, setSystemStatus] = useState('offline');
  
  useEffect(() => {
    // Fetch dashboard data from backend
    fetchDashboardData();
    
    // Check system status
    checkSystemStatus();
    
    // Set up polling for updates
    const interval = setInterval(() => {
      fetchDashboardData();
      checkSystemStatus();
    }, 30000); // Every 30 seconds
    
    return () => clearInterval(interval);
  }, []);
  
  const fetchDashboardData = async () => {
    try {
      // In a real app, this would be an API call
      // For now, we'll simulate with mock data
      setStats({
        pendingEmails: Math.floor(Math.random() * 5),
        processedToday: Math.floor(Math.random() * 20),
        upcomingEvents: Math.floor(Math.random() * 10),
        invoicesGenerated: Math.floor(Math.random() * 15)
      });
      
      setRecentBookings([
        {
          id: 'BK001',
          eventType: 'Conference',
          organization: 'Tech Solutions Inc.',
          date: '2023-11-15',
          status: 'confirmed'
        },
        {
          id: 'BK002',
          eventType: 'Workshop',
          organization: 'Design Studio',
          date: '2023-11-18',
          status: 'pending'
        },
        {
          id: 'BK003',
          eventType: 'Meeting',
          organization: 'Finance Group',
          date: '2023-11-20',
          status: 'confirmed'
        }
      ]);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };
  
  const checkSystemStatus = async () => {
    try {
      // In a real app, this would check if the backend is running
      setSystemStatus('online');
    } catch (error) {
      setSystemStatus('offline');
    }
  };
  
  const startSystem = async () => {
    try {
      // In a real app, this would start the backend service
      setSystemStatus('starting');
      setTimeout(() => setSystemStatus('online'), 2000);
    } catch (error) {
      console.error('Error starting system:', error);
    }
  };
  
  const stopSystem = async () => {
    try {
      // In a real app, this would stop the backend service
      setSystemStatus('stopping');
      setTimeout(() => setSystemStatus('offline'), 2000);
    } catch (error) {
      console.error('Error stopping system:', error);
    }
  };
  
  return (
    <div>
      <h1>Dashboard</h1>
      
      <div className="system-status card">
        <div className="card-header">
          <h2 className="card-title">System Status</h2>
          <div>
            {systemStatus === 'online' ? (
              <button className="btn btn-danger" onClick={stopSystem}>Stop System</button>
            ) : systemStatus === 'offline' ? (
              <button className="btn btn-success" onClick={startSystem}>Start System</button>
            ) : (
              <button className="btn" disabled>{systemStatus}...</button>
            )}
          </div>
        </div>
        
        <div className="status-indicator">
          <span className={`status-dot ${systemStatus === 'online' ? 'online' : 'offline'}`}></span>
          <span>Status: {systemStatus.charAt(0).toUpperCase() + systemStatus.slice(1)}</span>
        </div>
      </div>
      
      <div className="stats-grid grid">
        <div className="stat-card card">
          <div className="stat-icon">
            <FaEnvelope />
          </div>
          <div className="stat-content">
            <h3>{stats.pendingEmails}</h3>
            <p>Pending Emails</p>
          </div>
          <Link to="/email-monitor" className="stat-link">View Emails</Link>
        </div>
        
        <div className="stat-card card">
          <div className="stat-icon">
            <FaCalendarAlt />
          </div>
          <div className="stat-content">
            <h3>{stats.upcomingEvents}</h3>
            <p>Upcoming Events</p>
          </div>
          <Link to="/calendar" className="stat-link">View Calendar</Link>
        </div>
        
        <div className="stat-card card">
          <div className="stat-icon">
            <FaFileInvoiceDollar />
          </div>
          <div className="stat-content">
            <h3>{stats.invoicesGenerated}</h3>
            <p>Invoices Generated</p>
          </div>
          <Link to="/invoices" className="stat-link">View Invoices</Link>
        </div>
        
        <div className="stat-card card">
          <div className="stat-icon">
            <FaCog />
          </div>
          <div className="stat-content">
            <h3>{stats.processedToday}</h3>
            <p>Processed Today</p>
          </div>
          <Link to="/settings" className="stat-link">Settings</Link>
        </div>
      </div>
      
      <div className="recent-bookings card">
        <div className="card-header">
          <h2 className="card-title">Recent Bookings</h2>
          <Link to="/email-monitor" className="btn btn-primary">View All</Link>
        </div>
        
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Event Type</th>
              <th>Organization</th>
              <th>Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {recentBookings.map(booking => (
              <tr key={booking.id}>
                <td>{booking.id}</td>
                <td>{booking.eventType}</td>
                <td>{booking.organization}</td>
                <td>{booking.date}</td>
                <td>
                  <span className={`badge badge-${booking.status === 'confirmed' ? 'success' : 'warning'}`}>
                    {booking.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Dashboard; 