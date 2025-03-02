import React, { useState, useRef, useEffect } from 'react';
import Card from './Card';
import { FaPaperPlane, FaRobot, FaUser, FaSpinner } from 'react-icons/fa';
import './DataQuery.css';

const DataQuery = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom when messages update
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!inputMessage.trim()) return;
    
    const userMessage = {
      id: Date.now(),
      text: inputMessage,
      sender: 'user',
      timestamp: new Date().toISOString()
    };
    
    setMessages([...messages, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    
    try {
      // This would be replaced with actual backend call to RAG system
      // Simulating API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Simulate a response based on the query
      let responseText = '';
      if (inputMessage.toLowerCase().includes('sales') && inputMessage.toLowerCase().includes('last year')) {
        responseText = "Based on our historical data, you had 245 sales transactions on this day last year, totaling $12,456.78 in revenue. This was a 15% increase from the previous year.";
      } else if (inputMessage.toLowerCase().includes('revenue')) {
        responseText = "Your total revenue for the last financial quarter was $156,890.45, which is a 8.3% increase compared to the same period last year.";
      } else if (inputMessage.toLowerCase().includes('event') || inputMessage.toLowerCase().includes('booking')) {
        responseText = "You had 12 event bookings last month, with an average value of $1,850 per booking. Your most popular event type was 'Corporate Workshop'.";
      } else {
        responseText = "I've searched the database but couldn't find specific information about that. Could you try rephrasing your question or ask about sales, revenue, or event bookings?";
      }
      
      const aiMessage = {
        id: Date.now() + 1,
        text: responseText,
        sender: 'ai',
        timestamp: new Date().toISOString()
      };
      
      setMessages(prevMessages => [...prevMessages, aiMessage]);
    } catch (error) {
      console.error('Error fetching response:', error);
      
      const errorMessage = {
        id: Date.now() + 1,
        text: "Sorry, I encountered an error when trying to retrieve that information. Please try again later.",
        sender: 'system',
        timestamp: new Date().toISOString()
      };
      
      setMessages(prevMessages => [...prevMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimestamp = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="page-container">
      <h1>Data Query</h1>
      
      <Card title="Business Intelligence Assistant" className="full-width-card">
        <div className="data-query-container">
          <div className="messages-container">
            {messages.length === 0 ? (
              <div className="empty-chat">
                <FaRobot className="robot-icon" />
                <h3>Business Intelligence Assistant</h3>
                <p>Ask me about your historical business data, such as sales, revenue, or event bookings.</p>
                <div className="example-queries">
                  <p>Example queries:</p>
                  <ul>
                    <li>"How many sales did I have on this day last year?"</li>
                    <li>"What was my revenue for Q1 2023?"</li>
                    <li>"Show me the most profitable events from last month"</li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="chat-messages">
                {messages.map((msg) => (
                  <div 
                    key={msg.id} 
                    className={`message ${msg.sender === 'user' ? 'user-message' : msg.sender === 'ai' ? 'ai-message' : 'system-message'}`}
                  >
                    <div className="message-avatar">
                      {msg.sender === 'user' ? <FaUser /> : msg.sender === 'ai' ? <FaRobot /> : '!'}
                    </div>
                    <div className="message-content">
                      <div className="message-text">{msg.text}</div>
                      <div className="message-timestamp">{formatTimestamp(msg.timestamp)}</div>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="message ai-message loading">
                    <div className="message-avatar">
                      <FaRobot />
                    </div>
                    <div className="message-content">
                      <div className="typing-indicator">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
          
          <form className="message-input-container" onSubmit={handleSendMessage}>
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask about your business data..."
              disabled={isLoading}
            />
            <button 
              type="submit" 
              className="send-button"
              disabled={isLoading || !inputMessage.trim()}
            >
              {isLoading ? <FaSpinner className="spinner" /> : <FaPaperPlane />}
            </button>
          </form>
        </div>
      </Card>
    </div>
  );
};

export default DataQuery; 