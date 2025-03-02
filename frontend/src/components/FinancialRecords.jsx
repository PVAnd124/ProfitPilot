import React, { useState, useEffect } from 'react';
import Card from './Card';
import { 
  FaChartLine, 
  FaFileInvoiceDollar, 
  FaMoneyBillWave, 
  FaReceipt, 
  FaUserTie, 
  FaChartBar, 
  FaCalendarAlt, 
  FaFilter, 
  FaDownload, 
  FaPrint, 
  FaArrowUp, 
  FaArrowDown,
  FaStore,
  FaStoreAlt
} from 'react-icons/fa';
import './FinancialRecords.css';

const FinancialRecords = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dateRange, setDateRange] = useState('month');
  const [selectedLocation, setSelectedLocation] = useState('all');
  
  // Sample franchise locations - would come from backend in real app
  const franchiseLocations = [
    { id: 'all', name: 'All Locations (Combined)' },
    { id: 'loc1', name: 'Downtown Store' },
    { id: 'loc2', name: 'West Side Branch' },
    { id: 'loc3', name: 'East End Location' },
    { id: 'loc4', name: 'North County Store' },
    { id: 'loc5', name: 'South Bay Franchise' },
  ];
  
  // Sample data - would be fetched from backend in a real app
  const financialSummary = {
    totalRevenue: 156890.45,
    expenses: 89432.12,
    profit: 67458.33,
    pendingInvoices: 24560.75,
    accountsReceivable: 35240.80,
    accountsPayable: 12450.30,
    cashOnHand: 53280.25,
    revenueChange: 12.8,
    expenseChange: 8.2,
    profitChange: 18.5
  };
  
  const recentTransactions = [
    { id: 'TX001', date: '2023-11-05', description: 'Client Payment - ABC Corp', category: 'Income', amount: 4500.00, status: 'completed' },
    { id: 'TX002', date: '2023-11-03', description: 'Office Supplies', category: 'Expense', amount: -230.45, status: 'completed' },
    { id: 'TX003', date: '2023-11-01', description: 'Monthly Rent', category: 'Expense', amount: -2800.00, status: 'completed' },
    { id: 'TX004', date: '2023-10-28', description: 'Client Payment - Tech Solutions', category: 'Income', amount: 3200.00, status: 'completed' },
    { id: 'TX005', date: '2023-10-25', description: 'Software Subscription', category: 'Expense', amount: -99.99, status: 'completed' }
  ];
  
  const invoices = [
    { id: 'INV-2023-118', client: 'Acme Inc.', date: '2023-11-10', dueDate: '2023-11-25', amount: 5200.00, status: 'paid' },
    { id: 'INV-2023-117', client: 'TechStart LLC', date: '2023-11-05', dueDate: '2023-11-20', amount: 1850.00, status: 'pending' },
    { id: 'INV-2023-116', client: 'Global Solutions', date: '2023-10-28', dueDate: '2023-11-12', amount: 3450.00, status: 'pending' },
    { id: 'INV-2023-115', client: 'Innovate Co.', date: '2023-10-20', dueDate: '2023-11-04', amount: 2300.00, status: 'paid' },
    { id: 'INV-2023-114', client: 'EduTech', date: '2023-10-15', dueDate: '2023-10-30', amount: 1750.00, status: 'overdue' }
  ];
  
  const expenses = [
    { id: 'EXP-2023-087', vendor: 'Office Supply Co.', date: '2023-11-05', category: 'Office Supplies', amount: 230.45, status: 'processed' },
    { id: 'EXP-2023-086', vendor: 'City Property Management', date: '2023-11-01', category: 'Rent', amount: 2800.00, status: 'processed' },
    { id: 'EXP-2023-085', vendor: 'Cloud Services Inc.', date: '2023-10-25', category: 'Software', amount: 99.99, status: 'processed' },
    { id: 'EXP-2023-084', vendor: 'Marketing Experts', date: '2023-10-20', category: 'Marketing', amount: 750.00, status: 'processed' },
    { id: 'EXP-2023-083', vendor: 'Utility Company', date: '2023-10-15', category: 'Utilities', amount: 345.78, status: 'processed' }
  ];
  
  const payroll = [
    { id: 'PR-2023-022', employee: 'John Smith', date: '2023-10-31', position: 'Project Manager', amount: 5200.00 },
    { id: 'PR-2023-022', employee: 'Sarah Johnson', date: '2023-10-31', position: 'Senior Developer', amount: 4800.00 },
    { id: 'PR-2023-022', employee: 'Michael Brown', date: '2023-10-31', position: 'Marketing Specialist', amount: 3800.00 },
    { id: 'PR-2023-022', employee: 'Emma Davis', date: '2023-10-31', position: 'Administrative Assistant', amount: 2900.00 },
    { id: 'PR-2023-022', employee: 'Robert Wilson', date: '2023-10-31', position: 'Sales Representative', amount: 3500.00 }
  ];
  
  const monthlyData = {
    revenue: [42800, 39200, 45600, 38900, 41200, 44800, 39500, 43200, 47600, 51300, 48900, 46700],
    expenses: [28500, 26700, 29800, 24300, 27500, 30100, 26800, 28900, 31200, 32400, 30600, 29500],
    profit: [14300, 12500, 15800, 14600, 13700, 14700, 12700, 14300, 16400, 18900, 18300, 17200]
  };
  
  // Update the useEffect to trigger when activeTab changes to 'dashboard'
  useEffect(() => {
    if (activeTab === 'dashboard') {
      setTimeout(() => {
        const cards = document.querySelectorAll('.financial-metric-card');
        cards.forEach((card, index) => {
          // Reset opacity and transform (just in case)
          card.style.opacity = '1';
          card.style.transform = 'translateY(0)';
          
          // Optional: Add a small animation when returning to the tab
          card.style.animation = `pulse 0.5s ease ${index * 0.1}s`;
        });
      }, 50);
    }
  }, [activeTab]); // Now will trigger whenever activeTab changes

  // Add a new keyframes animation for the pulse effect
  useEffect(() => {
    // Add the pulse animation via style element if it doesn't exist
    if (!document.getElementById('pulse-animation')) {
      const style = document.createElement('style');
      style.id = 'pulse-animation';
      style.innerHTML = `
        @keyframes pulse {
          0% { transform: scale(0.95); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
      `;
      document.head.appendChild(style);
    }
    
    return () => {
      const style = document.getElementById('pulse-animation');
      if (style) style.remove();
    };
  }, []);
  
  // Helper function to get the current location name
  const getCurrentLocationName = () => {
    const location = franchiseLocations.find(loc => loc.id === selectedLocation);
    return location ? location.name : 'All Locations';
  };

  // Format currency numbers
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };
  
  const renderTabContent = () => {
    switch(activeTab) {
      case 'dashboard':
        return (
          <div className="financial-dashboard">
            <div className="financial-cards">
              <div className="financial-metric-card" style={{ opacity: 0, transform: 'translateY(20px)' }}>
                <div className="metric-header">
                  <h3>Total Revenue</h3>
                  <FaChartLine className="metric-icon revenue" />
                </div>
                <div className="metric-value">{formatCurrency(financialSummary.totalRevenue)}</div>
                <div className="metric-change up">
                  <FaArrowUp /> {financialSummary.revenueChange}% from last period
                </div>
              </div>
              
              <div className="financial-metric-card" style={{ opacity: 0, transform: 'translateY(20px)' }}>
                <div className="metric-header">
                  <h3>Total Expenses</h3>
                  <FaReceipt className="metric-icon expense" />
                </div>
                <div className="metric-value">{formatCurrency(financialSummary.expenses)}</div>
                <div className="metric-change down">
                  <FaArrowUp /> {financialSummary.expenseChange}% from last period
                </div>
              </div>
              
              <div className="financial-metric-card" style={{ opacity: 0, transform: 'translateY(20px)' }}>
                <div className="metric-header">
                  <h3>Net Profit</h3>
                  <FaMoneyBillWave className="metric-icon profit" />
                </div>
                <div className="metric-value">{formatCurrency(financialSummary.profit)}</div>
                <div className="metric-change up">
                  <FaArrowUp /> {financialSummary.profitChange}% from last period
                </div>
              </div>
              
              <div className="financial-metric-card" style={{ opacity: 0, transform: 'translateY(20px)' }}>
                <div className="metric-header">
                  <h3>Cash on Hand</h3>
                  <FaMoneyBillWave className="metric-icon" />
                </div>
                <div className="metric-value">{formatCurrency(financialSummary.cashOnHand)}</div>
              </div>
            </div>
            
            <div className="chart-section">
              {/* Monthly Financial Performance card removed */}
            </div>
            
            <Card title="Recent Transactions">
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Date</th>
                      <th>Description</th>
                      <th>Category</th>
                      <th>Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentTransactions.map(transaction => (
                      <tr key={transaction.id}>
                        <td>{transaction.id}</td>
                        <td>{new Date(transaction.date).toLocaleDateString()}</td>
                        <td>{transaction.description}</td>
                        <td>{transaction.category}</td>
                        <td className={transaction.amount >= 0 ? 'amount positive' : 'amount negative'}>
                          {formatCurrency(transaction.amount)}
                        </td>
                        <td><span className={`status ${transaction.status}`}>{transaction.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        );
        
      case 'invoices':
        return (
          <div className="invoices-section">
            <div className="action-bar">
              <button className="action-button">
                <FaFileInvoiceDollar />
                <span>New Invoice</span>
              </button>
              <div className="filter-controls">
                <div className="filter-group">
                  <label>Status:</label>
                  <select>
                    <option value="all">All</option>
                    <option value="paid">Paid</option>
                    <option value="pending">Pending</option>
                    <option value="overdue">Overdue</option>
                  </select>
                </div>
                <div className="filter-group">
                  <label>Date:</label>
                  <select>
                    <option value="all">All Time</option>
                    <option value="month">This Month</option>
                    <option value="quarter">This Quarter</option>
                    <option value="year">This Year</option>
                  </select>
                </div>
              </div>
            </div>
            
            <Card title="Invoices">
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Invoice #</th>
                      <th>Client</th>
                      <th>Date</th>
                      <th>Due Date</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map(invoice => (
                      <tr key={invoice.id}>
                        <td>{invoice.id}</td>
                        <td>{invoice.client}</td>
                        <td>{new Date(invoice.date).toLocaleDateString()}</td>
                        <td>{new Date(invoice.dueDate).toLocaleDateString()}</td>
                        <td className="amount positive">{formatCurrency(invoice.amount)}</td>
                        <td><span className={`status ${invoice.status}`}>{invoice.status}</span></td>
                        <td className="actions-cell">
                          <button className="icon-button"><FaDownload /></button>
                          <button className="icon-button"><FaPrint /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
            
            <div className="summary-cards">
              <div className="summary-card">
                <h3>Total Invoiced</h3>
                <div className="summary-value">{formatCurrency(14550.00)}</div>
              </div>
              <div className="summary-card">
                <h3>Paid</h3>
                <div className="summary-value">{formatCurrency(7500.00)}</div>
              </div>
              <div className="summary-card">
                <h3>Pending</h3>
                <div className="summary-value">{formatCurrency(5300.00)}</div>
              </div>
              <div className="summary-card">
                <h3>Overdue</h3>
                <div className="summary-value">{formatCurrency(1750.00)}</div>
              </div>
            </div>
          </div>
        );
        
      case 'expenses':
        return (
          <div className="expenses-section">
            <div className="action-bar">
              <button className="action-button">
                <FaReceipt />
                <span>Record Expense</span>
              </button>
              <div className="filter-controls">
                <div className="filter-group">
                  <label>Category:</label>
                  <select>
                    <option value="all">All Categories</option>
                    <option value="rent">Rent</option>
                    <option value="utilities">Utilities</option>
                    <option value="software">Software</option>
                    <option value="marketing">Marketing</option>
                    <option value="office">Office Supplies</option>
                  </select>
                </div>
                <div className="filter-group">
                  <label>Date:</label>
                  <select>
                    <option value="all">All Time</option>
                    <option value="month">This Month</option>
                    <option value="quarter">This Quarter</option>
                    <option value="year">This Year</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div className="expense-charts">
              <Card title="Expense Breakdown">
                <div className="pie-chart-container">
                  <div className="pie-chart-placeholder">
                    <div className="pie-chart-legend">
                      <div className="legend-item">
                        <span className="legend-color rent"></span>
                        <span>Rent (45%)</span>
                      </div>
                      <div className="legend-item">
                        <span className="legend-color utilities"></span>
                        <span>Utilities (8%)</span>
                      </div>
                      <div className="legend-item">
                        <span className="legend-color marketing"></span>
                        <span>Marketing (15%)</span>
                      </div>
                      <div className="legend-item">
                        <span className="legend-color software"></span>
                        <span>Software (12%)</span>
                      </div>
                      <div className="legend-item">
                        <span className="legend-color supplies"></span>
                        <span>Office Supplies (10%)</span>
                      </div>
                      <div className="legend-item">
                        <span className="legend-color other"></span>
                        <span>Other (10%)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
            
            <Card title="Recent Expenses">
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Vendor</th>
                      <th>Date</th>
                      <th>Category</th>
                      <th>Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.map(expense => (
                      <tr key={expense.id}>
                        <td>{expense.id}</td>
                        <td>{expense.vendor}</td>
                        <td>{new Date(expense.date).toLocaleDateString()}</td>
                        <td>{expense.category}</td>
                        <td className="amount negative">{formatCurrency(expense.amount)}</td>
                        <td><span className={`status ${expense.status}`}>{expense.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        );
        
      case 'payroll':
        return (
          <div className="payroll-section">
            <div className="action-bar">
              <button className="action-button">
                <FaUserTie />
                <span>Process Payroll</span>
              </button>
              <div className="filter-controls">
                <div className="filter-group">
                  <label>Pay Period:</label>
                  <select>
                    <option value="current">Current</option>
                    <option value="previous">Previous</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div className="summary-cards">
              <div className="summary-card">
                <h3>Total Payroll</h3>
                <div className="summary-value">{formatCurrency(20200.00)}</div>
              </div>
              <div className="summary-card">
                <h3>Employees</h3>
                <div className="summary-value">5</div>
              </div>
              <div className="summary-card">
                <h3>Next Pay Date</h3>
                <div className="summary-value">Nov 30, 2023</div>
              </div>
              <div className="summary-card">
                <h3>Tax Liability</h3>
                <div className="summary-value">{formatCurrency(4242.00)}</div>
              </div>
            </div>
            
            <Card title="Employee Payroll">
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Employee</th>
                      <th>Position</th>
                      <th>Pay Date</th>
                      <th>Gross Pay</th>
                      <th>Taxes</th>
                      <th>Net Pay</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payroll.map((payment, index) => (
                      <tr key={`${payment.id}-${index}`}>
                        <td>{payment.id}</td>
                        <td>{payment.employee}</td>
                        <td>{payment.position}</td>
                        <td>{new Date(payment.date).toLocaleDateString()}</td>
                        <td>{formatCurrency(payment.amount)}</td>
                        <td>{formatCurrency(payment.amount * 0.21)}</td>
                        <td>{formatCurrency(payment.amount * 0.79)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        );
        
      case 'reports':
        return (
          <div className="reports-section">
            <div className="reports-grid">
              <Card title="Profit & Loss Statement" className="report-card">
                <div className="report-content">
                  <div className="report-icon"><FaChartBar /></div>
                  <p>View a summary of your revenue, expenses, and profit over time</p>
                  <button className="report-button">Generate Report</button>
                </div>
              </Card>
              
              <Card title="Balance Sheet" className="report-card">
                <div className="report-content">
                  <div className="report-icon"><FaFileInvoiceDollar /></div>
                  <p>See your company's assets, liabilities, and equity</p>
                  <button className="report-button">Generate Report</button>
                </div>
              </Card>
              
              <Card title="Cash Flow Statement" className="report-card">
                <div className="report-content">
                  <div className="report-icon"><FaMoneyBillWave /></div>
                  <p>Track how cash is moving in and out of your business</p>
                  <button className="report-button">Generate Report</button>
                </div>
              </Card>
              
              <Card title="Accounts Receivable Aging" className="report-card">
                <div className="report-content">
                  <div className="report-icon"><FaFileInvoiceDollar /></div>
                  <p>Monitor outstanding customer payments and their age</p>
                  <button className="report-button">Generate Report</button>
                </div>
              </Card>
              
              <Card title="Sales by Customer" className="report-card">
                <div className="report-content">
                  <div className="report-icon"><FaChartLine /></div>
                  <p>Analyze sales performance across different customers</p>
                  <button className="report-button">Generate Report</button>
                </div>
              </Card>
              
              <Card title="Expense Report" className="report-card">
                <div className="report-content">
                  <div className="report-icon"><FaReceipt /></div>
                  <p>Break down your expenses by category and time period</p>
                  <button className="report-button">Generate Report</button>
                </div>
              </Card>
            </div>
          </div>
        );
        
      default:
        return <div>Select a tab to view financial information</div>;
    }
  };
  
  return (
    <div className="page-container financial-records-page">
      <div className="financial-records-header">
        <div className="header-title-section">
          <h1>Financial Records</h1>
          <div className="current-location">
            <FaStoreAlt />
            <span>Viewing: {getCurrentLocationName()}</span>
          </div>
        </div>
        
        <div className="financial-controls">
          <div className="location-selector">
            <FaStore />
            <select 
              value={selectedLocation} 
              onChange={(e) => setSelectedLocation(e.target.value)}
              aria-label="Select franchise location"
            >
              {franchiseLocations.map(location => (
                <option key={location.id} value={location.id}>
                  {location.name}
                </option>
              ))}
            </select>
          </div>

          <div className="date-selector">
            <FaCalendarAlt />
            <select 
              value={dateRange} 
              onChange={(e) => setDateRange(e.target.value)}
            >
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>
          
          <button className="control-button">
            <FaFilter />
            <span>Filters</span>
          </button>
          
          <button className="control-button">
            <FaDownload />
            <span>Export</span>
          </button>
        </div>
      </div>
      
      <div className="financial-tabs">
        <button 
          className={`tab-button ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          <FaChartLine />
          <span>Dashboard</span>
        </button>
        <button 
          className={`tab-button ${activeTab === 'invoices' ? 'active' : ''}`}
          onClick={() => setActiveTab('invoices')}
        >
          <FaFileInvoiceDollar />
          <span>Invoices</span>
        </button>
        <button 
          className={`tab-button ${activeTab === 'expenses' ? 'active' : ''}`}
          onClick={() => setActiveTab('expenses')}
        >
          <FaReceipt />
          <span>Expenses</span>
        </button>
        <button 
          className={`tab-button ${activeTab === 'payroll' ? 'active' : ''}`}
          onClick={() => setActiveTab('payroll')}
        >
          <FaUserTie />
          <span>Payroll</span>
        </button>
        <button 
          className={`tab-button ${activeTab === 'reports' ? 'active' : ''}`}
          onClick={() => setActiveTab('reports')}
        >
          <FaChartBar />
          <span>Reports</span>
        </button>
      </div>
      
      <div className="financial-content">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default FinancialRecords; 