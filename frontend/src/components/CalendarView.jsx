import React, { useState, useEffect } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { FaPlus, FaTimes } from 'react-icons/fa';

const localizer = momentLocalizer(moment);

const CalendarView = () => {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    start: new Date(),
    end: new Date(new Date().setHours(new Date().getHours() + 1)),
    eventType: 'meeting',
    organization: '',
    attendees: 0,
    contactName: '',
    contactEmail: '',
    specialRequests: ''
  });
  
  useEffect(() => {
    fetchEvents();
  }, []);
  
  const fetchEvents = async () => {
    try {
      // In a real app, this would be an API call to your backend
      // For now, we'll simulate with mock data
      const mockEvents = [
        {
          id: 1,
          title: 'Conference - Tech Solutions Inc.',
          start: new Date(2023, 10, 15, 10, 0), // Nov 15, 2023, 10:00 AM
          end: new Date(2023, 10, 15, 16, 0),   // Nov 15, 2023, 4:00 PM
          eventType: 'conference',
          organization: 'Tech Solutions Inc.',
          attendees: 50,
          contactName: 'John Smith',
          contactEmail: 'john@techsolutions.com',
          specialRequests: 'Need projector and microphone setup'
        },
        {
          id: 2,
          title: 'Workshop - Design Studio',
          start: new Date(2023, 10, 18, 13, 0), // Nov 18, 2023, 1:00 PM
          end: new Date(2023, 10, 18, 17, 0),   // Nov 18, 2023, 5:00 PM
          eventType: 'workshop',
          organization: 'Design Studio',
          attendees: 25,
          contactName: 'Sarah Johnson',
          contactEmail: 'sarah@designstudio.com',
          specialRequests: 'Whiteboard and markers needed'
        },
        {
          id: 3,
          title: 'Meeting - Finance Group',
          start: new Date(2023, 10, 20, 9, 0),  // Nov 20, 2023, 9:00 AM
          end: new Date(2023, 10, 20, 11, 0),   // Nov 20, 2023, 11:00 AM
          eventType: 'meeting',
          organization: 'Finance Group',
          attendees: 15,
          contactName: 'Michael Brown',
          contactEmail: 'michael@financegroup.com',
          specialRequests: ''
        }
      ];
      
      setEvents(mockEvents);
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };
  
  const handleSelectEvent = (event) => {
    setSelectedEvent(event);
    setShowEventModal(true);
  };
  
  const handleSelectSlot = ({ start, end }) => {
    setNewEvent({
      ...newEvent,
      start,
      end
    });
    setSelectedEvent(null);
    setShowEventModal(true);
  };
  
  const handleCloseModal = () => {
    setShowEventModal(false);
    setSelectedEvent(null);
    setNewEvent({
      title: '',
      start: new Date(),
      end: new Date(new Date().setHours(new Date().getHours() + 1)),
      eventType: 'meeting',
      organization: '',
      attendees: 0,
      contactName: '',
      contactEmail: '',
      specialRequests: ''
    });
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (selectedEvent) {
      setSelectedEvent({
        ...selectedEvent,
        [name]: value
      });
    } else {
      setNewEvent({
        ...newEvent,
        [name]: value
      });
    }
  };
  
  const handleSaveEvent = async () => {
    try {
      if (selectedEvent) {
        // Update existing event
        // In a real app, this would be an API call to your backend
        const updatedEvents = events.map(event => 
          event.id === selectedEvent.id ? selectedEvent : event
        );
        setEvents(updatedEvents);
      } else {
        // Create new event
        // In a real app, this would be an API call to your backend
        const newEventWithId = {
          ...newEvent,
          id: Date.now(),
          title: `${newEvent.eventType.charAt(0).toUpperCase() + newEvent.eventType.slice(1)} - ${newEvent.organization || 'No Organization'}`
        };
        setEvents([...events, newEventWithId]);
      }
      
      handleCloseModal();
    } catch (error) {
      console.error('Error saving event:', error);
    }
  };
  
  const handleDeleteEvent = async () => {
    if (!selectedEvent) return;
    
    try {
      // In a real app, this would be an API call to your backend
      const updatedEvents = events.filter(event => event.id !== selectedEvent.id);
      setEvents(updatedEvents);
      handleCloseModal();
    } catch (error) {
      console.error('Error deleting event:', error);
    }
  };
  
  return (
    <div>
      <h1>Calendar</h1>
      
      <div className="calendar-container card">
        <div className="card-header">
          <h2 className="card-title">Booking Calendar</h2>
          <button 
            className="btn btn-primary"
            onClick={() => {
              setSelectedEvent(null);
              setShowEventModal(true);
            }}
          >
            <FaPlus /> Add Event
          </button>
        </div>
        
        <div className="calendar-wrapper">
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: 600 }}
            onSelectEvent={handleSelectEvent}
            onSelectSlot={handleSelectSlot}
            selectable
            views={['month', 'week', 'day']}
            defaultView="week"
          />
        </div>
      </div>
      
      {showEventModal && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">
                {selectedEvent ? 'Edit Event' : 'Add New Event'}
              </h3>
              <button className="modal-close" onClick={handleCloseModal}>
                <FaTimes />
              </button>
            </div>
            
            <div className="modal-body">
              <div className="form-group">
                <label htmlFor="eventType">Event Type</label>
                <select
                  id="eventType"
                  name="eventType"
                  className="form-control"
                  value={selectedEvent ? selectedEvent.eventType : newEvent.eventType}
                  onChange={handleInputChange}
                >
                  <option value="meeting">Meeting</option>
                  <option value="conference">Conference</option>
                  <option value="workshop">Workshop</option>
                  <option value="party">Party</option>
                  <option value="seminar">Seminar</option>
                  <option value="retreat">Retreat</option>
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="organization">Organization</label>
                <input
                  type="text"
                  id="organization"
                  name="organization"
                  className="form-control"
                  value={selectedEvent ? selectedEvent.organization : newEvent.organization}
                  onChange={handleInputChange}
                  placeholder="Organization name"
                />
              </div>
              
              <div className="form-row">
                <div className="form-group half">
                  <label htmlFor="start">Start Date & Time</label>
                  <input
                    type="datetime-local"
                    id="start"
                    name="start"
                    className="form-control"
                    value={moment(selectedEvent ? selectedEvent.start : newEvent.start).format('YYYY-MM-DDTHH:mm')}
                    onChange={(e) => {
                      const date = new Date(e.target.value);
                      if (selectedEvent) {
                        setSelectedEvent({
                          ...selectedEvent,
                          start: date
                        });
                      } else {
                        setNewEvent({
                          ...newEvent,
                          start: date
                        });
                      }
                    }}
                  />
                </div>
                
                <div className="form-group half">
                  <label htmlFor="end">End Date & Time</label>
                  <input
                    type="datetime-local"
                    id="end"
                    name="end"
                    className="form-control"
                    value={moment(selectedEvent ? selectedEvent.end : newEvent.end).format('YYYY-MM-DDTHH:mm')}
                    onChange={(e) => {
                      const date = new Date(e.target.value);
                      if (selectedEvent) {
                        setSelectedEvent({
                          ...selectedEvent,
                          end: date
                        });
                      } else {
                        setNewEvent({
                          ...newEvent,
                          end: date
                        });
                      }
                    }}
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="attendees">Number of Attendees</label>
                <input
                  type="number"
                  id="attendees"
                  name="attendees"
                  className="form-control"
                  value={selectedEvent ? selectedEvent.attendees : newEvent.attendees}
                  onChange={handleInputChange}
                  min="1"
                />
              </div>
              
              <div className="form-row">
                <div className="form-group half">
                  <label htmlFor="contactName">Contact Name</label>
                  <input
                    type="text"
                    id="contactName"
                    name="contactName"
                    className="form-control"
                    value={selectedEvent ? selectedEvent.contactName : newEvent.contactName}
                    onChange={handleInputChange}
                  />
                </div>
                
                <div className="form-group half">
                  <label htmlFor="contactEmail">Contact Email</label>
                  <input
                    type="email"
                    id="contactEmail"
                    name="contactEmail"
                    className="form-control"
                    value={selectedEvent ? selectedEvent.contactEmail : newEvent.contactEmail}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="specialRequests">Special Requests</label>
                <textarea
                  id="specialRequests"
                  name="specialRequests"
                  className="form-control"
                  value={selectedEvent ? selectedEvent.specialRequests : newEvent.specialRequests}
                  onChange={handleInputChange}
                  rows="3"
                ></textarea>
              </div>
            </div>
            
            <div className="modal-footer">
              {selectedEvent && (
                <button 
                  className="btn btn-danger" 
                  onClick={handleDeleteEvent}
                >
                  Delete
                </button>
              )}
              <button 
                className="btn btn-secondary" 
                onClick={handleCloseModal}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary" 
                onClick={handleSaveEvent}
              >
                {selectedEvent ? 'Update' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarView; 