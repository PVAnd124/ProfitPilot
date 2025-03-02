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
        
        return {
          id: invoiceData.invoice_number || 'Unknown',
          clientName: invoiceData.client?.name || 'Unknown',
          organization: invoiceData.client?.organization || 'N/A',
          eventType: invoiceData.booking?.purpose || 'Event',
          eventDate: invoiceData.booking?.date || 'N/A',
          amount: invoiceData.total || 0,
          status: 'pending',
          createdAt: invoiceData.invoice_date || new Date().toISOString().split('T')[0],
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
            eventType: 'Conference',
            eventDate: '2023-11-15',
            amount: 1750,
            status: 'paid',
            createdAt: '2023-10-20',
            paidAt: '2023-10-25',
            html_content: '<div class="invoice"><h2>Invoice #INV1001</h2><p>This is a mock invoice</p></div>'
          },
          {
            id: 'INV1002',
            clientName: 'Sarah Johnson',
            organization: 'Design Studio',
            eventType: 'Workshop',
            eventDate: '2023-11-18',
            amount: 1125,
            status: 'pending',
            createdAt: '2023-10-22',
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
          eventType: 'Conference',
          eventDate: '2023-11-15',
          amount: 1750,
          status: 'paid',
          createdAt: '2023-10-20',
          paidAt: '2023-10-25',
          html_content: '<div class="invoice"><h2>Invoice #INV1001</h2><p>This is a mock invoice</p></div>'
        },
        {
          id: 'INV1002',
          clientName: 'Sarah Johnson',
          organization: 'Design Studio',
          eventType: 'Workshop',
          eventDate: '2023-11-18',
          amount: 1125,
          status: 'pending',
          createdAt: '2023-10-22',
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
    // In a real app, this would download the invoice file
    const invoice = invoices.find(inv => inv.id === invoiceId);
    
    if (invoice && invoice.html_content) {
      // Create a Blob from the HTML content
      const blob = new Blob([invoice.html_content], { type: 'text/html' });
      
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
    } else {
      alert(`Downloading invoice ${invoiceId}`);
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
    <div>
      <h1>Invoice Manager</h1>
      
      <div className="invoice-manager-container">
        <div className="invoice-list card">
          <div className="card-header">
            <h2 className="card-title">Invoices</h2>
            <div className="search-container">
              <div className="search-input-wrapper">
                <FaSearch className="search-icon" />
                <input
                  type="text"
                  className="search-input"
                  placeholder="Search invoices..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>
          
          {loading ? (
            <div className="loading-spinner">Loading...</div>
          ) : filteredInvoices.length === 0 ? (
            <div className="empty-state">
              <p>No invoices found</p>
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Client</th>
                  <th>Event</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map(invoice => (
                  <tr key={invoice.id}>
                    <td>{invoice.id}</td>
                    <td>
                      <div>{invoice.clientName}</div>
                      <div className="organization-name">{invoice.organization}</div>
                    </td>
                    <td>{invoice.eventType}</td>
                    <td>{invoice.eventDate}</td>
                    <td>${invoice.amount.toFixed(2)}</td>
                    <td>
                      <span className={`badge badge-${invoice.status === 'paid' ? 'success' : 'warning'}`}>
                        {invoice.status}
                      </span>
                    </td>
                    <td className="actions-cell">
                      <button 
                        className="btn-icon" 
                        title="View Invoice"
                        onClick={() => handleViewInvoice(invoice)}
                      >
                        <FaEye />
                      </button>
                      <button 
                        className="btn-icon" 
                        title="Download Invoice"
                        onClick={() => handleDownloadInvoice(invoice.id)}
                      >
                        <FaDownload />
                      </button>
                      <button 
                        className="btn-icon btn-icon-danger" 
                        title="Delete Invoice"
                        onClick={() => handleDeleteInvoice(invoice.id)}
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
        
        <div className="invoice-stats card">
          <div className="card-header">
            <h2 className="card-title">Invoice Statistics</h2>
          </div>
          
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-value">{invoices.length}</div>
              <div className="stat-label">Total Invoices</div>
            </div>
            
            <div className="stat-item">
              <div className="stat-value">
                {invoices.filter(inv => inv.status === 'paid').length}
              </div>
              <div className="stat-label">Paid</div>
            </div>
            
            <div className="stat-item">
              <div className="stat-value">
                {invoices.filter(inv => inv.status === 'pending').length}
              </div>
              <div className="stat-label">Pending</div>
            </div>
            
            <div className="stat-item">
              <div className="stat-value">
                ${invoices.reduce((sum, inv) => sum + inv.amount, 0).toFixed(2)}
              </div>
              <div className="stat-label">Total Amount</div>
            </div>
          </div>
        </div>
      </div>
      
      {showInvoiceModal && selectedInvoice && (
        <div className="modal-backdrop">
          <div className="modal invoice-modal">
            <div className="modal-header">
              <h3 className="modal-title">Invoice #{selectedInvoice.id}</h3>
              <button className="modal-close" onClick={handleCloseModal}>×</button>
            </div>
            
            <div className="modal-body">
              <div className="invoice-preview">
                <div className="invoice-header-section">
                  <div className="company-info">
                    <h2>Your Venue Name</h2>
                    <p>123 Venue Street, City, Country</p>
                    <p>Email: bookings@yourvenue.com</p>
                    <p>Phone: +1 (555) 123-4567</p>
                  </div>
                  
                  <div className="invoice-details">
                    <h1>INVOICE</h1>
                    <p><strong>Invoice #:</strong> {selectedInvoice.id}</p>
                    <p><strong>Date:</strong> {selectedInvoice.createdAt}</p>
                    <p><strong>Due Date:</strong> {new Date(new Date(selectedInvoice.createdAt).getTime() + 30*24*60*60*1000).toISOString().split('T')[0]}</p>
                    <p><strong>Status:</strong> 
                      <span className={`badge badge-${selectedInvoice.status === 'paid' ? 'success' : 'warning'}`}>
                        {selectedInvoice.status}
                      </span>
                    </p>
                  </div>
                </div>
                
                <div className="client-section">
                  <div className="section-title">Bill To</div>
                  <p><strong>{selectedInvoice.clientName}</strong></p>
                  <p>{selectedInvoice.organization}</p>
                </div>
                
                <div className="event-section">
                  <div className="section-title">Event Details</div>
                  <p><strong>Event Type:</strong> {selectedInvoice.eventType}</p>
                  <p><strong>Date:</strong> {selectedInvoice.eventDate}</p>
                </div>
                
                <table className="invoice-items">
                  <thead>
                    <tr>
                      <th>Description</th>
                      <th>Quantity</th>
                      <th>Unit Price</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Venue Booking ({selectedInvoice.eventType})</td>
                      <td>1</td>
                      <td>$500.00</td>
                      <td>$500.00</td>
                    </tr>
                    <tr>
                      <td>Attendee Fee</td>
                      <td>50</td>
                      <td>$25.00</td>
                      <td>$1,250.00</td>
                    </tr>
                    <tr className="total-row">
                      <td colSpan="3" style={{textAlign: 'right'}}><strong>Total</strong></td>
                      <td><strong>${selectedInvoice.amount.toFixed(2)}</strong></td>
                    </tr>
                  </tbody>
                </table>
                
                <div className="payment-section">
                  <div className="section-title">Payment Instructions</div>
                  <p>Please make payment within 30 days of the invoice date.</p>
                  <p>Bank transfer details will be provided separately.</p>
                </div>
                
                <div className="invoice-footer">
                  <p>Thank you for your business!</p>
                  <p>Your Venue Name - 123 Venue Street, City, Country</p>
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              {selectedInvoice.status === 'pending' && (
                <button 
                  className="btn btn-success"
                  onClick={() => handleMarkAsPaid(selectedInvoice.id)}
                >
                  Mark as Paid
                </button>
              )}
              <button 
                className="btn btn-primary"
                onClick={() => handleDownloadInvoice(selectedInvoice.id)}
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