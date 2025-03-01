import React, { useState, useEffect } from 'react';
import { FaPlus, FaSave, FaTrash, FaCode, FaEye } from 'react-icons/fa';

const TemplateEditor = () => {
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [editMode, setEditMode] = useState(true);
  const [templateHtml, setTemplateHtml] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [previewData, setPreviewData] = useState({
    invoice_number: 'INV1001',
    invoice_date: '2023-11-01',
    due_date: '2023-12-01',
    company_name: 'Your Venue Name',
    company_address: '123 Venue Street, City, Country',
    company_email: 'bookings@yourvenue.com',
    company_phone: '+1 (555) 123-4567',
    client_name: 'John Smith',
    client_organization: 'Tech Solutions Inc.',
    client_email: 'john@techsolutions.com',
    event_date: '2023-11-15',
    event_type: 'Conference',
    start_time: '10:00 AM',
    end_time: '4:00 PM',
    num_attendees: 50,
    base_price: 500,
    per_person_price: 25,
    total_price: 1750,
    special_requests: 'Need projector and microphone setup'
  });
  
  useEffect(() => {
    fetchTemplates();
  }, []);
  
  const fetchTemplates = async () => {
    try {
      // In a real app, this would be an API call to your backend
      // For now, we'll simulate with mock data
      const mockTemplates = [
        {
          id: 'default',
          name: 'Default Template',
          description: 'The default invoice template',
          createdAt: '2023-10-01'
        },
        {
          id: 'tech_company',
          name: 'Tech Company',
          description: 'Template for tech companies',
          createdAt: '2023-10-05'
        },
        {
          id: 'event_planner',
          name: 'Event Planner',
          description: 'Template for event planning companies',
          createdAt: '2023-10-10'
        }
      ];
      
      setTemplates(mockTemplates);
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };
  
  const fetchTemplateHtml = async (templateId) => {
    try {
      // In a real app, this would be an API call to your backend
      // For now, we'll use a simplified version of the default template
      const defaultTemplate = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Invoice #{{ invoice_number }}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            color: #333;
        }
        .invoice-header {
            text-align: center;
            margin-bottom: 30px;
        }
        .invoice-title {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 5px;
        }
        .invoice-details {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
        }
        .company-details, .client-details {
            width: 45%;
        }
        .section-title {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 10px;
            border-bottom: 1px solid #ddd;
            padding-bottom: 5px;
        }
        .event-details {
            margin-bottom: 30px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
        }
        th, td {
            padding: 10px;
            text-align: left;
            border-bottom: 1px solid #ddd;
        }
        th {
            background-color: #f2f2f2;
        }
        .total-row {
            font-weight: bold;
        }
        .footer {
            margin-top: 50px;
            text-align: center;
            font-size: 12px;
            color: #777;
        }
    </style>
</head>
<body>
    <div class="invoice-header">
        <div class="invoice-title">INVOICE</div>
        <div>Invoice #{{ invoice_number }}</div>
        <div>Date: {{ invoice_date }}</div>
        <div>Due Date: {{ due_date }}</div>
    </div>
    
    <div class="invoice-details">
        <div class="company-details">
            <div class="section-title">From</div>
            <div>{{ company_name }}</div>
            <div>{{ company_address }}</div>
            <div>Email: {{ company_email }}</div>
            <div>Phone: {{ company_phone }}</div>
        </div>
        
        <div class="client-details">
            <div class="section-title">To</div>
            <div>{{ client_name }}</div>
            {% if client_organization %}
            <div>{{ client_organization }}</div>
            {% endif %}
            <div>Email: {{ client_email }}</div>
        </div>
    </div>
    
    <div class="event-details">
        <div class="section-title">Event Details</div>
        <div>Event Type: {{ event_type }}</div>
        <div>Date: {{ event_date }}</div>
        <div>Time: {{ start_time }} to {{ end_time }}</div>
        <div>Number of Attendees: {{ num_attendees }}</div>
        {% if special_requests %}
        <div>Special Requests: {{ special_requests }}</div>
        {% endif %}
    </div>
    
    <table>
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
                <td>Venue Booking ({{ event_type }})</td>
                <td>1</td>
                <td>${{ base_price }}</td>
                <td>${{ base_price }}</td>
            </tr>
            <tr>
                <td>Attendee Fee</td>
                <td>{{ num_attendees }}</td>
                <td>${{ per_person_price }}</td>
                <td>${{ attendee_total }}</td>
            </tr>
            <tr class="total-row">
                <td colspan="3" style="text-align: right;">Total</td>
                <td>${{ total_price }}</td>
            </tr>
        </tbody>
    </table>
    
    <div>
        <div class="section-title">Payment Instructions</div>
        <div>Please make payment within 30 days of the invoice date.</div>
        <div>Bank transfer details will be provided separately.</div>
    </div>
    
    <div class="footer">
        <div>Thank you for your business!</div>
        <div>{{ company_name }} - {{ company_address }}</div>
    </div>
</body>
</html>
      `;
      
      // Different templates for different IDs
      if (templateId === 'tech_company') {
        // A more modern template for tech companies
        return defaultTemplate.replace('font-family: Arial, sans-serif;', 'font-family: "Segoe UI", Roboto, sans-serif;')
                             .replace('#f2f2f2', '#e6f7ff')
                             .replace('#ddd', '#88c8ff');
      } else if (templateId === 'event_planner') {
        // A more decorative template for event planners
        return defaultTemplate.replace('font-family: Arial, sans-serif;', 'font-family: "Georgia", serif;')
                             .replace('#f2f2f2', '#f8e8ff')
                             .replace('#ddd', '#d8b8ff');
      } else {
        return defaultTemplate;
      }
    } catch (error) {
      console.error('Error fetching template HTML:', error);
      return '';
    }
  };
  
  const handleTemplateSelect = async (template) => {
    setSelectedTemplate(template);
    const html = await fetchTemplateHtml(template.id);
    setTemplateHtml(html);
    setCompanyId(template.id);
    setEditMode(true);
  };
  
  const handleCreateNew = () => {
    setSelectedTemplate(null);
    setTemplateHtml(fetchTemplateHtml('default'));
    setCompanyId('');
    setEditMode(true);
  };
  
  const handleSaveTemplate = async () => {
    try {
      // In a real app, this would be an API call to your backend
      if (!companyId) {
        alert('Please enter a company ID');
        return;
      }
      
      // Check if template already exists
      const existingTemplate = templates.find(t => t.id === companyId);
      
      if (existingTemplate) {
        // Update existing template
        setTemplates(templates.map(t => 
          t.id === companyId 
            ? {...t, updatedAt: new Date().toISOString().split('T')[0]} 
            : t
        ));
      } else {
        // Create new template
        const newTemplate = {
          id: companyId,
          name: companyId.charAt(0).toUpperCase() + companyId.slice(1).replace('_', ' '),
          description: 'Custom invoice template',
          createdAt: new Date().toISOString().split('T')[0]
        };
        
        setTemplates([...templates, newTemplate]);
        setSelectedTemplate(newTemplate);
      }
      
      alert('Template saved successfully!');
    } catch (error) {
      console.error('Error saving template:', error);
      alert('Error saving template');
    }
  };
  
  const handleDeleteTemplate = async () => {
    if (!selectedTemplate) return;
    
    if (selectedTemplate.id === 'default') {
      alert('Cannot delete the default template');
      return;
    }
    
    if (!confirm(`Are you sure you want to delete the "${selectedTemplate.name}" template?`)) {
      return;
    }
    
    try {
      // In a real app, this would be an API call to your backend
      setTemplates(templates.filter(t => t.id !== selectedTemplate.id));
      setSelectedTemplate(null);
      setTemplateHtml('');
      setCompanyId('');
    } catch (error) {
      console.error('Error deleting template:', error);
      alert('Error deleting template');
    }
  };
  
  const toggleEditMode = () => {
    setEditMode(!editMode);
  };
  
  return (
    <div>
      <h1>Invoice Template Editor</h1>
      
      <div className="template-editor-container">
        <div className="templates-sidebar card">
          <div className="card-header">
            <h2 className="card-title">Templates</h2>
            <button 
              className="btn btn-primary"
              onClick={handleCreateNew}
            >
              <FaPlus /> New
            </button>
          </div>
          
          <ul className="template-list">
            {templates.map(template => (
              <li 
                key={template.id}
                className={`template-item ${selectedTemplate?.id === template.id ? 'selected' : ''}`}
                onClick={() => handleTemplateSelect(template)}
              >
                <div className="template-name">{template.name}</div>
                <div className="template-description">{template.description}</div>
                <div className="template-date">Created: {template.createdAt}</div>
              </li>
            ))}
          </ul>
        </div>
        
        <div className="template-content card">
          <div className="card-header">
            <h2 className="card-title">
              {selectedTemplate ? `Edit: ${selectedTemplate.name}` : 'New Template'}
            </h2>
            <div className="template-actions">
              <button 
                className={`btn ${editMode ? 'btn-primary' : 'btn-secondary'}`}
                onClick={toggleEditMode}
                title={editMode ? 'Preview Template' : 'Edit Template'}
              >
                {editMode ? <FaEye /> : <FaCode />}
              </button>
              <button 
                className="btn btn-success"
                onClick={handleSaveTemplate}
                disabled={!templateHtml}
              >
                <FaSave /> Save
              </button>
              {selectedTemplate && selectedTemplate.id !== 'default' && (
                <button 
                  className="btn btn-danger"
                  onClick={handleDeleteTemplate}
                >
                  <FaTrash /> Delete
                </button>
              )}
            </div>
          </div>
          
          {editMode ? (
            <div className="editor-container">
              <div className="form-group">
                <label htmlFor="companyId">Company ID</label>
                <input
                  type="text"
                  id="companyId"
                  className="form-control"
                  value={companyId}
                  onChange={(e) => setCompanyId(e.target.value)}
                  placeholder="Enter a unique identifier for this template"
                  disabled={selectedTemplate?.id === 'default'}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="templateHtml">HTML Template</label>
                <textarea
                  id="templateHtml"
                  className="form-control code-editor"
                  value={templateHtml}
                  onChange={(e) => setTemplateHtml(e.target.value)}
                  rows="20"
                ></textarea>
                <small>Use Jinja2 template syntax with variables like {'{{'} 'variable_name' {'}}'}</small>
              </div>
            </div>
          ) : (
            <div className="preview-container">
              <iframe
                srcDoc={templateHtml}
                title="Template Preview"
                className="template-preview"
              ></iframe>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TemplateEditor; 