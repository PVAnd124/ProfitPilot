import React from 'react';
import Card from './Card';
import { FaCalendarPlus, FaList } from 'react-icons/fa';

const EventScheduler = () => {
  return (
    <div className="page-container">
      <h1>Event Scheduler</h1>
      
      <div className="dashboard-grid">
        <Card title="Upcoming Events" className="full-width-card">
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Event</th>
                  <th>Client</th>
                  <th>Attendees</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Nov 20, 2023</td>
                  <td>9:00 AM - 12:00 PM</td>
                  <td>Corporate Workshop</td>
                  <td>Acme Inc.</td>
                  <td>25</td>
                  <td><span className="status confirmed">Confirmed</span></td>
                </tr>
                <tr>
                  <td>Nov 22, 2023</td>
                  <td>2:00 PM - 5:00 PM</td>
                  <td>Team Building</td>
                  <td>TechStart</td>
                  <td>15</td>
                  <td><span className="status pending">Pending</span></td>
                </tr>
                <tr>
                  <td>Nov 25, 2023</td>
                  <td>10:00 AM - 4:00 PM</td>
                  <td>Conference</td>
                  <td>Global Solutions</td>
                  <td>100</td>
                  <td><span className="status confirmed">Confirmed</span></td>
                </tr>
                <tr>
                  <td>Nov 28, 2023</td>
                  <td>1:00 PM - 3:00 PM</td>
                  <td>Product Launch</td>
                  <td>Innovate LLC</td>
                  <td>50</td>
                  <td><span className="status pending">Pending</span></td>
                </tr>
                <tr>
                  <td>Dec 2, 2023</td>
                  <td>9:00 AM - 1:00 PM</td>
                  <td>Training Session</td>
                  <td>EduTech</td>
                  <td>30</td>
                  <td><span className="status confirmed">Confirmed</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
        
        <Card title="Quick Actions" className="actions-card">
          <div className="action-buttons">
            <button className="action-button">
              <FaCalendarPlus />
              <span>Schedule New Event</span>
            </button>
            <button className="action-button">
              <FaList />
              <span>View All Events</span>
            </button>
          </div>
        </Card>
        
        <Card title="Calendar" className="calendar-card">
          <div className="calendar-placeholder">
            <p>Calendar view will be displayed here</p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default EventScheduler; 