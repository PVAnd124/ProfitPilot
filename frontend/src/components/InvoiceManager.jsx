import React, { useState, useEffect } from 'react';
import { FaDownload, FaEye, FaTrash, FaSearch, FaSpinner } from 'react-icons/fa';

const InvoiceManager = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  
  useEffect(() => {
    fetchInvoices();
  }, []);
  
  const fetchInvoices = async () => {
    setLoading(true);
    try {
      // Fetch invoices from the backend API
      const response = await fetch('http://localhost:8080/api/invoices');
      
      if (!response.ok) {
        throw new Error('Failed to fetch invoices');
      }
      
      const data = await response.json();
      
      // Transform the invoice data to match our component's expected format
      const formattedInvoices = data.invoices.map(invoice => {
        const invoiceData = invoice.invoice_data || {};
        const clientData = invoiceData.client || {};
        const bookingData = invoiceData.booking || {};
        
        // Calculate the total from the data for consistency
        const subtotal = invoiceData.subtotal || 0;
        const tax = invoiceData.tax || 0; 
        const total = invoiceData.total || (subtotal + tax);
        
        return {
          id: invoiceData.invoice_number || 'Unknown',
          clientName: clientData.name || 'Unknown',
          organization: clientData.organization || 'N/A',
          clientEmail: clientData.email || '',
          eventType: bookingData.purpose || 'Event',
          eventDate: bookingData.date || 'N/A',
          eventStartTime: bookingData.start_time || '',
          eventEndTime: bookingData.end_time || '',
          duration: bookingData.duration || 1,
          attendees: bookingData.attendees || 1,
          subtotal: subtotal,
          tax: tax,
          amount: total,
          status: 'pending',
          createdAt: invoiceData.invoice_date || new Date().toISOString().split('T')[0],
          dueDate: invoiceData.due_date || '',
          paidAt: null,
          html_content: invoice.html_content || '',
          raw_data: invoice
        };
      });
      
      // If we don't have any real invoices yet, add some mock data
      if (formattedInvoices.length === 0) {
        const mockInvoices = [
          {
            id: 'INV1001',
            clientName: 'John Smith',
            organization: 'Tech Solutions Inc.',
            clientEmail: 'john@techsolutions.com',
            eventType: 'Conference',
            eventDate: '2023-11-15',
            eventStartTime: '09:00',
            eventEndTime: '17:00',
            duration: 8,
            attendees: 50,
            subtotal: 1550,
            tax: 124,
            amount: 1674,
            status: 'paid',
            createdAt: '2023-10-20',
            dueDate: '2023-11-19',
            paidAt: '2023-10-25',
            html_content: '<div class="invoice"><h2>Invoice #INV1001</h2><p>This is a mock invoice</p></div>'
          },
          {
            id: 'INV1002',
            clientName: 'Sarah Johnson',
            organization: 'Design Studio',
            clientEmail: 'sarah@designstudio.com',
            eventType: 'Workshop',
            eventDate: '2023-11-18',
            eventStartTime: '13:00',
            eventEndTime: '17:00',
            duration: 4,
            attendees: 25,
            subtotal: 1025,
            tax: 82,
            amount: 1107,
            status: 'pending',
            createdAt: '2023-10-22',
            dueDate: '2023-11-21',
            paidAt: null,
            html_content: '<div class="invoice"><h2>Invoice #INV1002</h2><p>This is a mock invoice</p></div>'
          }
        ];
        
        setInvoices(mockInvoices);
      } else {
        setInvoices(formattedInvoices);
      }
      
        setLoading(false);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      
      // Fallback to mock data if the API fails
      const mockInvoices = [
        {
          id: 'INV1001',
          clientName: 'John Smith',
          organization: 'Tech Solutions Inc.',
          clientEmail: 'john@techsolutions.com',
          eventType: 'Conference',
          eventDate: '2023-11-15',
          eventStartTime: '09:00',
          eventEndTime: '17:00',
          duration: 8,
          attendees: 50,
          subtotal: 1550,
          tax: 124,
          amount: 1674,
          status: 'paid',
          createdAt: '2023-10-20',
          dueDate: '2023-11-19',
          paidAt: '2023-10-25',
          html_content: '<div class="invoice"><h2>Invoice #INV1001</h2><p>This is a mock invoice</p></div>'
        },
        {
          id: 'INV1002',
          clientName: 'Sarah Johnson',
          organization: 'Design Studio',
          clientEmail: 'sarah@designstudio.com',
          eventType: 'Workshop',
          eventDate: '2023-11-18',
          eventStartTime: '13:00',
          eventEndTime: '17:00',
          duration: 4,
          attendees: 25, 
          subtotal: 1025,
          tax: 82,
          amount: 1107,
          status: 'pending',
          createdAt: '2023-10-22',
          dueDate: '2023-11-21',
          paidAt: null,
          html_content: '<div class="invoice"><h2>Invoice #INV1002</h2><p>This is a mock invoice</p></div>'
        }
      ];
      
      setInvoices(mockInvoices);
      setLoading(false);
    }
  };
  
  const handleViewInvoice = (invoice) => {
    setSelectedInvoice(invoice);
    setShowInvoiceModal(true);
  };
  
  const handleCloseModal = () => {
    setShowInvoiceModal(false);
    setSelectedInvoice(null);
  };
  
  const handleDownloadInvoice = (invoiceId) => {
    try {
      const invoice = invoices.find(inv => inv.id === invoiceId);
      
      if (!invoice) {
        console.error(`Invoice ${invoiceId} not found`);
        alert(`Invoice ${invoiceId} not found`);
        return;
      }
      
      console.log("Invoice data for download:", invoice);
      
      // Use actual values from the invoice object with fallbacks for missing data
      const hourlyRate = 150; // Fixed rate
      const attendeeFee = 25; // Fixed fee per attendee
      
      // Ensure duration and attendees are numbers
      const duration = parseInt(invoice.duration || 1, 10);
      const attendees = parseInt(invoice.attendees || 1, 10);
      
      // Calculate costs - use pre-calculated values if available, otherwise recalculate
      const venueCost = hourlyRate * duration;
      const attendeeCost = attendeeFee * attendees;
      const subtotal = parseFloat(invoice.subtotal || (venueCost + attendeeCost));
      const taxRate = 0.08;
      const tax = parseFloat(invoice.tax || (subtotal * taxRate));
      const total = parseFloat(invoice.amount || (subtotal + tax));
      
      // Format dates with fallbacks
      const createdAt = invoice.createdAt || new Date().toISOString().split('T')[0];
      const dueDate = invoice.dueDate || new Date(new Date(createdAt).getTime() + 30*24*60*60*1000).toISOString().split('T')[0];
      
      // Create a complete HTML document to manipulate for download - with Capital One colors
      const baseHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Invoice ${invoice.id}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f8f9fa; }
          .invoice-container { max-width: 800px; margin: 0 auto; border: 1px solid #ddd; padding: 30px; background-color: white; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .header { display: flex; justify-content: space-between; margin-bottom: 30px; background-color: #0f3b64; color: white; padding: 20px; }
          .company-name { font-size: 26px; font-weight: bold; color: white; }
          .invoice-title { font-size: 28px; margin-top: 0; color: white; text-transform: uppercase; letter-spacing: 1px; }
          .details-section { margin-bottom: 25px; padding: 15px; border: 1px solid #e0e0e0; border-radius: 4px; background-color: #f8f9fa; }
          .section-title { font-weight: bold; margin-bottom: 10px; color: #0f3b64; font-size: 16px; border-bottom: 1px solid #e0e0e0; padding-bottom: 5px; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; border: 1px solid #e0e0e0; }
          th { padding: 12px 15px; text-align: left; background-color: #0f3b64; color: white; font-weight: 600; }
          td { padding: 12px 15px; text-align: left; border-bottom: 1px solid #ddd; }
          .text-right { text-align: right; }
          .total-row { font-weight: bold; }
          .footer { margin-top: 40px; text-align: center; font-size: 14px; color: #666; border-top: 1px solid #e0e0e0; padding-top: 20px; }
          .amount-section { background-color: #f8f9fa; padding: 15px; margin-top: 10px; border-top: 2px solid #0f3b64; }
          .amount-row { display: flex; justify-content: space-between; margin: 5px 0; }
          .amount-row.total { font-weight: bold; font-size: 18px; margin-top: 10px; color: #0f3b64; }
          .status-badge { padding: 3px 8px; border-radius: 3px; font-size: 0.8rem; font-weight: bold; background-color: ${invoice.status === 'paid' ? '#e6f7ee' : '#fff3e0'}; color: ${invoice.status === 'paid' ? '#28a745' : '#d03027'}; }
          a { color: #0f3b64; text-decoration: none; }
          a:hover { color: #d03027; }
          .subtotal-text, .tax-text { color: #0f3b64; font-weight: 600; }
          .invoice-id, .invoice-date { color: #0f3b64; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="invoice-container">
          <div class="header">
            <div>
              <div class="company-name">ProfitPilot</div>
              <p>123 Venue Street, City, Country</p>
              <p>Email: bookings@profitpilot.com</p>
              <p>Phone: +1 (555) 123-4567</p>
            </div>
            <div>
              <h1 class="invoice-title">Invoice</h1>
              <p><strong>Invoice #:</strong> <span class="invoice-id">${invoice.id}</span></p>
              <p><strong>Date:</strong> <span class="invoice-date">${createdAt}</span></p>
              <p><strong>Due Date:</strong> ${dueDate}</p>
              <p><strong>Status:</strong> <span class="status-badge">${invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}</span></p>
            </div>
          </div>
          
          <div class="details-section">
            <div class="section-title">Bill To:</div>
            <p><strong>${invoice.clientName || 'Client'}</strong></p>
            <p>${invoice.organization && invoice.organization !== 'N/A' ? invoice.organization : ''}</p>
            <p>${invoice.clientEmail || ''}</p>
          </div>
          
          <div class="details-section">
            <div class="section-title">Event Details:</div>
            <p><strong style="color: #0f3b64;">Event Type:</strong> ${invoice.eventType || 'Event'}</p>
            <p><strong style="color: #0f3b64;">Date:</strong> ${invoice.eventDate || 'To be determined'}</p>
            ${invoice.eventStartTime ? `<p><strong style="color: #0f3b64;">Time:</strong> ${invoice.eventStartTime} to ${invoice.eventEndTime || 'End time TBD'}</p>` : ''}
            <p><strong style="color: #0f3b64;">Duration:</strong> ${duration} hour${duration !== 1 ? 's' : ''}</p>
            <p><strong style="color: #0f3b64;">Attendees:</strong> ${attendees}</p>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th>Quantity</th>
                <th>Unit Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Venue Rental (${duration} hours at $${hourlyRate}/hour)</td>
                <td>${duration}</td>
                <td>$${hourlyRate.toFixed(2)}</td>
                <td>$${venueCost.toFixed(2)}</td>
              </tr>
              <tr>
                <td>Attendee Fee (${attendees} attendees at $${attendeeFee}/person)</td>
                <td>${attendees}</td>
                <td>$${attendeeFee.toFixed(2)}</td>
                <td>$${attendeeCost.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
          
          <div class="amount-section">
            <div class="amount-row">
              <span class="subtotal-text">Subtotal:</span>
              <span>$${subtotal.toFixed(2)}</span>
            </div>
            <div class="amount-row">
              <span class="tax-text">Tax (${(taxRate * 100).toFixed(1)}%):</span>
              <span>$${tax.toFixed(2)}</span>
            </div>
            <div class="amount-row total">
              <span>Total Due:</span>
              <span>$${total.toFixed(2)}</span>
            </div>
          </div>
          
          <div class="details-section">
            <div class="section-title">Payment Instructions:</div>
            <p>Please make payment within 30 days of the invoice date.</p>
            <p>Bank transfer details will be provided separately.</p>
          </div>
          
          <div class="footer">
            <p>Thank you for your business!</p>
            <p>ProfitPilot - Your Venue Management Solution</p>
          </div>
        </div>
      </body>
      </html>
      `;
      
      // Create a Blob from the complete HTML content
      const blob = new Blob([baseHtml], { type: 'text/html' });
      
      // Create a URL for the Blob
      const url = URL.createObjectURL(blob);
      
      // Create a temporary link to download the file
      const a = document.createElement('a');
      a.href = url;
      a.download = `Invoice-${invoiceId}.html`;
      
      // Trigger a click event on the link
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating invoice:', error);
      alert('Failed to generate invoice. Please try again.');
    }
  };
  
  const handleDeleteInvoice = async (invoiceId) => {
    if (!confirm('Are you sure you want to delete this invoice?')) return;
    
    try {
      // In a production app, this would call an API to delete the invoice
      setInvoices(invoices.filter(invoice => invoice.id !== invoiceId));
    } catch (error) {
      console.error('Error deleting invoice:', error);
    }
  };
  
  const handleMarkAsPaid = async (invoiceId) => {
    try {
      // In a real app, this would be an API call to your backend
      setInvoices(invoices.map(invoice => 
        invoice.id === invoiceId 
          ? {...invoice, status: 'paid', paidAt: new Date().toISOString().split('T')[0]} 
          : invoice
      ));
    } catch (error) {
      console.error('Error updating invoice:', error);
    }
  };
  
  const filteredInvoices = invoices.filter(invoice => 
    invoice.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.organization.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.id.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  return (
    <div style={{ fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ color: '#0f3b64' }}>Invoice Manager</h1>
      
      <div className="invoice-manager-container">
        <div className="invoice-list card" style={{ border: '1px solid #e0e0e0', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
          <div className="card-header" style={{ backgroundColor: '#0f3b64', color: 'white', padding: '15px 20px', borderBottom: '1px solid #e0e0e0' }}>
            <h2 className="card-title" style={{ margin: 0, fontSize: '1.5rem' }}>Invoices</h2>
            <div className="search-container">
              <div className="search-input-wrapper" style={{ position: 'relative', marginTop: '10px' }}>
                <FaSearch className="search-icon" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#0f3b64' }} />
                <input
                  type="text"
                  className="search-input"
                  placeholder="Search invoices..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ 
                    padding: '8px 10px 8px 35px', 
                    borderRadius: '4px', 
                    border: '1px solid #e0e0e0', 
                    width: '100%',
                    boxSizing: 'border-box',
                    outline: 'none'
                  }}
                />
              </div>
            </div>
          </div>
          
          {loading ? (
            <div className="loading-spinner" style={{ padding: '20px', textAlign: 'center', color: '#0f3b64' }}>
              <FaSpinner style={{ animation: 'spin 2s linear infinite', fontSize: '2rem' }} /> Loading...
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="empty-state" style={{ padding: '30px', textAlign: 'center', color: '#666' }}>
              <p>No invoices found</p>
            </div>
          ) : (
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8f9fa' }}>
                  <th style={{ padding: '12px 15px', textAlign: 'left', borderBottom: '2px solid #0f3b64', color: '#0f3b64' }}>Invoice #</th>
                  <th style={{ padding: '12px 15px', textAlign: 'left', borderBottom: '2px solid #0f3b64', color: '#0f3b64' }}>Client</th>
                  <th style={{ padding: '12px 15px', textAlign: 'left', borderBottom: '2px solid #0f3b64', color: '#0f3b64' }}>Event</th>
                  <th style={{ padding: '12px 15px', textAlign: 'left', borderBottom: '2px solid #0f3b64', color: '#0f3b64' }}>Date</th>
                  <th style={{ padding: '12px 15px', textAlign: 'left', borderBottom: '2px solid #0f3b64', color: '#0f3b64' }}>Amount</th>
                  <th style={{ padding: '12px 15px', textAlign: 'left', borderBottom: '2px solid #0f3b64', color: '#0f3b64' }}>Status</th>
                  <th style={{ padding: '12px 15px', textAlign: 'left', borderBottom: '2px solid #0f3b64', color: '#0f3b64' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map(invoice => (
                  <tr key={invoice.id} style={{ borderBottom: '1px solid #e0e0e0' }}>
                    <td style={{ padding: '12px 15px', color: '#0f3b64' }}>{invoice.id}</td>
                    <td style={{ padding: '12px 15px' }}>
                      <div style={{ fontWeight: 'bold', color: '#0f3b64' }}>{invoice.clientName}</div>
                      <div className="organization-name" style={{ fontSize: '0.9rem', color: '#666' }}>{invoice.organization}</div>
                    </td>
                    <td style={{ padding: '12px 15px' }}>{invoice.eventType}</td>
                    <td style={{ padding: '12px 15px' }}>{invoice.eventDate}</td>
                    <td style={{ padding: '12px 15px', fontWeight: 'bold' }}>${invoice.amount.toFixed(2)}</td>
                    <td style={{ padding: '12px 15px' }}>
                      <span style={{ 
                        padding: '3px 8px', 
                        borderRadius: '3px', 
                        fontSize: '0.8rem', 
                        backgroundColor: invoice.status === 'paid' ? '#e6f7ee' : '#fff3e0', 
                        color: invoice.status === 'paid' ? '#28a745' : '#d03027' 
                      }}>
                        {invoice.status}
                      </span>
                    </td>
                    <td className="actions-cell" style={{ padding: '12px 15px' }}>
                      <button 
                        className="btn-icon" 
                        title="View Invoice"
                        onClick={() => handleViewInvoice(invoice)}
                        style={{ 
                          background: 'none', 
                          border: 'none', 
                          color: '#0f3b64', 
                          cursor: 'pointer', 
                          marginRight: '8px',
                          fontSize: '1rem',
                          transition: 'color 0.2s ease' 
                        }}
                        onMouseOver={(e) => e.currentTarget.style.color = '#d03027'}
                        onMouseOut={(e) => e.currentTarget.style.color = '#0f3b64'}
                      >
                        <FaEye />
                      </button>
                      <button 
                        className="btn-icon" 
                        title="Download Invoice"
                        onClick={() => handleDownloadInvoice(invoice.id)}
                        style={{ 
                          background: 'none', 
                          border: 'none', 
                          color: '#0f3b64', 
                          cursor: 'pointer', 
                          marginRight: '8px',
                          fontSize: '1rem',
                          transition: 'color 0.2s ease' 
                        }}
                        onMouseOver={(e) => e.currentTarget.style.color = '#d03027'}
                        onMouseOut={(e) => e.currentTarget.style.color = '#0f3b64'}
                      >
                        <FaDownload />
                      </button>
                      <button 
                        className="btn-icon btn-icon-danger" 
                        title="Delete Invoice"
                        onClick={() => handleDeleteInvoice(invoice.id)}
                        style={{ 
                          background: 'none', 
                          border: 'none', 
                          color: '#d03027', 
                          cursor: 'pointer',
                          fontSize: '1rem',
                          transition: 'color 0.2s ease' 
                        }}
                        onMouseOver={(e) => e.currentTarget.style.opacity = '0.8'}
                        onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
                      >
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        
        <div className="invoice-stats card" style={{ border: '1px solid #e0e0e0', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', overflow: 'hidden', marginTop: '20px' }}>
          <div className="card-header" style={{ backgroundColor: '#0f3b64', color: 'white', padding: '15px 20px', borderBottom: '1px solid #e0e0e0' }}>
            <h2 className="card-title" style={{ margin: 0, fontSize: '1.5rem' }}>Invoice Statistics</h2>
          </div>
          
          <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', padding: '20px' }}>
            <div className="stat-item" style={{ textAlign: 'center', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
              <div className="stat-value" style={{ fontSize: '2rem', fontWeight: 'bold', color: '#0f3b64', marginBottom: '5px' }}>{invoices.length}</div>
              <div className="stat-label" style={{ fontSize: '0.9rem', color: '#666' }}>Total Invoices</div>
            </div>
            
            <div className="stat-item" style={{ textAlign: 'center', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
              <div className="stat-value" style={{ fontSize: '2rem', fontWeight: 'bold', color: '#28a745', marginBottom: '5px' }}>
                {invoices.filter(inv => inv.status === 'paid').length}
              </div>
              <div className="stat-label" style={{ fontSize: '0.9rem', color: '#666' }}>Paid</div>
            </div>
            
            <div className="stat-item" style={{ textAlign: 'center', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
              <div className="stat-value" style={{ fontSize: '2rem', fontWeight: 'bold', color: '#d03027', marginBottom: '5px' }}>
                {invoices.filter(inv => inv.status === 'pending').length}
              </div>
              <div className="stat-label" style={{ fontSize: '0.9rem', color: '#666' }}>Pending</div>
            </div>
            
            <div className="stat-item" style={{ textAlign: 'center', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
              <div className="stat-value" style={{ fontSize: '2rem', fontWeight: 'bold', color: '#0f3b64', marginBottom: '5px' }}>
                ${invoices.reduce((sum, inv) => sum + inv.amount, 0).toFixed(2)}
              </div>
              <div className="stat-label" style={{ fontSize: '0.9rem', color: '#666' }}>Total Amount</div>
            </div>
          </div>
        </div>
      </div>
      
      {showInvoiceModal && selectedInvoice && (
        <div className="modal-backdrop" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 59, 100, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="modal invoice-modal" style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)',
            width: '90%',
            maxWidth: '850px',
            maxHeight: '90vh',
            overflowY: 'auto',
            position: 'relative'
          }}>
            <div className="modal-header" style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '15px 20px',
              backgroundColor: '#0f3b64',
              color: 'white',
              borderTopLeftRadius: '8px',
              borderTopRightRadius: '8px'
            }}>
              <h3 className="modal-title" style={{
                margin: 0,
                fontSize: '1.5rem',
                color: 'white'
              }}>Invoice #{selectedInvoice.id}</h3>
              <button className="modal-close" onClick={handleCloseModal} style={{
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                color: 'white',
                transition: 'opacity 0.2s ease'
              }}
              onMouseOver={(e) => e.currentTarget.style.opacity = '0.8'}
              onMouseOut={(e) => e.currentTarget.style.opacity = '1'}>×</button>
            </div>
            
            <div className="modal-body" style={{ padding: '20px' }}>
              <div className="invoice-preview" style={{
                border: '1px solid #e0e0e0',
                borderRadius: '5px',
                overflow: 'hidden',
                backgroundColor: '#fff',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
              }}>
                <div className="invoice-header-section" style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '25px',
                  backgroundColor: '#0f3b64',
                  color: 'white',
                  borderBottom: '1px solid #e0e0e0'
                }}>
                  <div className="company-info" style={{ maxWidth: '50%' }}>
                    <h2 style={{ 
                      color: 'white',
                      margin: '0 0 10px 0',
                      fontSize: '1.8rem' 
                    }}>ProfitPilot</h2>
                    <p style={{ margin: '5px 0', color: '#e0e0e0' }}>123 Venue Street, City, Country</p>
                    <p style={{ margin: '5px 0', color: '#e0e0e0' }}>Email: bookings@profitpilot.com</p>
                    <p style={{ margin: '5px 0', color: '#e0e0e0' }}>Phone: +1 (555) 123-4567</p>
                  </div>
                  
                  <div className="invoice-details" style={{ 
                    textAlign: 'right',
                    minWidth: '200px'
                  }}>
                    <h1 style={{ 
                      margin: '0 0 10px 0',
                      color: 'white',
                      fontSize: '2.2rem',
                      textTransform: 'uppercase',
                      letterSpacing: '1px'
                    }}>INVOICE</h1>
                    <p style={{ margin: '7px 0', fontSize: '0.95rem' }}>
                      <strong style={{ color: '#e0e0e0' }}>Invoice #:</strong> 
                      <span style={{ marginLeft: '5px', color: 'white' }}>{selectedInvoice.id}</span>
                    </p>
                    <p style={{ margin: '7px 0', fontSize: '0.95rem' }}>
                      <strong style={{ color: '#e0e0e0' }}>Date:</strong> 
                      <span style={{ marginLeft: '5px', color: 'white' }}>{selectedInvoice.createdAt}</span>
                    </p>
                    <p style={{ margin: '7px 0', fontSize: '0.95rem' }}>
                      <strong style={{ color: '#e0e0e0' }}>Due Date:</strong> 
                      <span style={{ marginLeft: '5px', color: 'white' }}>
                        {new Date(new Date(selectedInvoice.createdAt).getTime() + 30*24*60*60*1000).toISOString().split('T')[0]}
                      </span>
                    </p>
                    <p style={{ margin: '7px 0', fontSize: '0.95rem' }}>
                      <strong style={{ color: '#e0e0e0' }}>Status:</strong> 
                      <span style={{ 
                        marginLeft: '5px',
                        padding: '3px 8px',
                        borderRadius: '3px',
                        fontSize: '0.8rem',
                        fontWeight: 'bold',
                        backgroundColor: selectedInvoice.status === 'paid' ? '#e6f7ee' : '#fff3e0',
                        color: selectedInvoice.status === 'paid' ? '#28a745' : '#d03027'
                      }}>
                        {selectedInvoice.status.charAt(0).toUpperCase() + selectedInvoice.status.slice(1)}
                      </span>
                    </p>
                  </div>
                </div>
                
                <div style={{ padding: '20px 25px' }}>
                  <div className="client-section" style={{ 
                    marginBottom: '20px',
                    padding: '15px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '4px',
                    border: '1px solid #e0e0e0'
                  }}>
                    <div className="section-title" style={{ 
                      fontWeight: 'bold',
                      color: '#0f3b64',
                      marginBottom: '10px',
                      fontSize: '1.1rem',
                      borderBottom: '1px solid #e0e0e0',
                      paddingBottom: '5px'
                    }}>Bill To</div>
                    <p style={{ margin: '5px 0', fontSize: '1.05rem' }}><strong>{selectedInvoice.clientName}</strong></p>
                    <p style={{ margin: '5px 0', color: '#555' }}>{selectedInvoice.organization !== 'N/A' ? selectedInvoice.organization : ''}</p>
                </div>
                
                  <div className="event-section" style={{ 
                    marginBottom: '25px',
                    padding: '15px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '4px',
                    border: '1px solid #e0e0e0'
                  }}>
                    <div className="section-title" style={{ 
                      fontWeight: 'bold',
                      color: '#0f3b64',
                      marginBottom: '10px',
                      fontSize: '1.1rem',
                      borderBottom: '1px solid #e0e0e0',
                      paddingBottom: '5px'
                    }}>Event Details</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                      <div style={{ marginRight: '30px', minWidth: '200px' }}>
                        <p style={{ margin: '5px 0' }}>
                          <strong style={{ color: '#0f3b64' }}>Event Type:</strong>
                          <span style={{ marginLeft: '5px', color: '#555' }}>{selectedInvoice.eventType}</span>
                        </p>
                      </div>
                      <div>
                        <p style={{ margin: '5px 0' }}>
                          <strong style={{ color: '#0f3b64' }}>Date:</strong>
                          <span style={{ marginLeft: '5px', color: '#555' }}>{selectedInvoice.eventDate}</span>
                        </p>
                      </div>
                    </div>
                </div>
                
                  <table className="invoice-items" style={{ 
                    width: '100%',
                    borderCollapse: 'collapse',
                    marginBottom: '25px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '4px',
                    overflow: 'hidden'
                  }}>
                  <thead>
                      <tr style={{ backgroundColor: '#0f3b64', color: 'white' }}>
                        <th style={{ padding: '12px 15px', textAlign: 'left', fontWeight: '600' }}>Description</th>
                        <th style={{ padding: '12px 15px', textAlign: 'center', fontWeight: '600' }}>Quantity</th>
                        <th style={{ padding: '12px 15px', textAlign: 'right', fontWeight: '600' }}>Unit Price</th>
                        <th style={{ padding: '12px 15px', textAlign: 'right', fontWeight: '600' }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                      {(() => {
                        // Use the actual values from the selected invoice
                        const hourlyRate = 150; // Fixed rate
                        const attendeeFee = 25; // Fixed fee per attendee
                        
                        // Calculate costs - use pre-calculated values if available
                        const venueCost = hourlyRate * selectedInvoice.duration;
                        const attendeeCost = attendeeFee * selectedInvoice.attendees;
                        const subtotal = selectedInvoice.subtotal || (venueCost + attendeeCost);
                        const tax = selectedInvoice.tax || (subtotal * 0.08);
                        const total = selectedInvoice.amount || (subtotal + tax);
                        
                        return (
                          <>
                            <tr style={{ borderBottom: '1px solid #e0e0e0' }}>
                              <td style={{ padding: '12px 15px', fontSize: '0.95rem' }}>
                                Venue Booking ({selectedInvoice.eventType}) - {selectedInvoice.duration} hour{selectedInvoice.duration !== 1 ? 's' : ''}
                              </td>
                              <td style={{ padding: '12px 15px', textAlign: 'center', fontSize: '0.95rem' }}>{selectedInvoice.duration}</td>
                              <td style={{ padding: '12px 15px', textAlign: 'right', fontSize: '0.95rem' }}>${hourlyRate.toFixed(2)}</td>
                              <td style={{ padding: '12px 15px', textAlign: 'right', fontSize: '0.95rem' }}>${venueCost.toFixed(2)}</td>
                            </tr>
                            <tr style={{ borderBottom: '1px solid #e0e0e0' }}>
                              <td style={{ padding: '12px 15px', fontSize: '0.95rem' }}>Attendee Fee ({selectedInvoice.attendees} attendees)</td>
                              <td style={{ padding: '12px 15px', textAlign: 'center', fontSize: '0.95rem' }}>{selectedInvoice.attendees}</td>
                              <td style={{ padding: '12px 15px', textAlign: 'right', fontSize: '0.95rem' }}>${attendeeFee.toFixed(2)}</td>
                              <td style={{ padding: '12px 15px', textAlign: 'right', fontSize: '0.95rem' }}>${attendeeCost.toFixed(2)}</td>
                    </tr>
                    <tr>
                              <td colSpan="4" style={{ padding: '0' }}>
                                <div style={{ 
                                  backgroundColor: '#f8f9fa',
                                  padding: '15px 20px',
                                  borderTop: '1px solid #e0e0e0'
                                }}>
                                  <div style={{ 
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    margin: '5px 0',
                                    fontSize: '0.95rem'
                                  }}>
                                    <span style={{ fontWeight: '600', color: '#0f3b64' }}>Subtotal:</span>
                                    <span>${subtotal.toFixed(2)}</span>
                                  </div>
                                  <div style={{ 
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    margin: '5px 0',
                                    fontSize: '0.95rem'
                                  }}>
                                    <span style={{ fontWeight: '600', color: '#0f3b64' }}>Tax (8.0%):</span>
                                    <span>${tax.toFixed(2)}</span>
                                  </div>
                                  <div style={{ 
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    margin: '10px 0 5px',
                                    paddingTop: '10px',
                                    borderTop: '2px solid #0f3b64',
                                    fontWeight: 'bold',
                                    fontSize: '1.1rem',
                                    color: '#0f3b64'
                                  }}>
                                    <span>Total Due:</span>
                                    <span>${total.toFixed(2)}</span>
                                  </div>
                                </div>
                              </td>
                    </tr>
                          </>
                        );
                      })()}
                  </tbody>
                </table>
                
                  <div className="payment-section" style={{ 
                    marginBottom: '25px',
                    padding: '15px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '4px',
                    border: '1px solid #e0e0e0'
                  }}>
                    <div className="section-title" style={{ 
                      fontWeight: 'bold',
                      color: '#0f3b64',
                      marginBottom: '10px',
                      fontSize: '1.1rem',
                      borderBottom: '1px solid #e0e0e0',
                      paddingBottom: '5px'
                    }}>Payment Instructions</div>
                    <p style={{ margin: '5px 0', color: '#555' }}>Please make payment within 30 days of the invoice date.</p>
                    <p style={{ margin: '5px 0', color: '#555' }}>Bank transfer details will be provided separately.</p>
                </div>
                
                  <div className="invoice-footer" style={{ 
                    textAlign: 'center',
                    borderTop: '1px solid #e0e0e0',
                    paddingTop: '20px',
                    color: '#777',
                    fontSize: '0.9rem'
                  }}>
                    <p style={{ margin: '5px 0' }}>Thank you for your business!</p>
                    <p style={{ margin: '5px 0' }}>ProfitPilot - Your Venue Management Solution</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="modal-footer" style={{
              display: 'flex',
              justifyContent: 'flex-end',
              padding: '15px 20px',
              borderTop: '1px solid #eaeaea',
              gap: '10px'
            }}>
              {selectedInvoice.status === 'pending' && (
                <button 
                  className="btn btn-success"
                  onClick={() => handleMarkAsPaid(selectedInvoice.id)}
                  style={{
                    backgroundColor: '#0f3b64',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '8px 16px',
                    cursor: 'pointer',
                    fontWeight: '500',
                    fontSize: '0.9rem',
                    transition: 'background-color 0.2s ease'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#0a2d4e'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#0f3b64'}
                >
                  Mark as Paid
                </button>
              )}
              <button 
                className="btn btn-primary"
                onClick={() => handleDownloadInvoice(selectedInvoice.id)}
                style={{
                  backgroundColor: '#d03027',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '8px 16px',
                  cursor: 'pointer',
                  fontWeight: '500',
                  fontSize: '0.9rem',
                  transition: 'background-color 0.2s ease'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#b82922'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#d03027'}
              >
                Download
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceManager; 