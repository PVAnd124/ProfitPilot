import React from 'react';
import Card from './Card';
import { FaChartLine, FaMoneyBillWave, FaExchangeAlt, FaChartPie } from 'react-icons/fa';

const WeeklyFinancialDigest = () => {
  return (
    <div className="page-container">
      <h1>Weekly Financial Digest</h1>
      
      <div className="dashboard-grid">
        <Card title="Revenue Overview">
          <div className="stat-container">
            <div className="stat-icon">
              <FaChartLine />
            </div>
            <div className="stat-content">
              <h3>Total Revenue</h3>
              <p className="stat-value">$24,500</p>
              <p className="stat-change positive">+12% from last week</p>
            </div>
          </div>
        </Card>
        
        <Card title="Expenses">
          <div className="stat-container">
            <div className="stat-icon">
              <FaMoneyBillWave />
            </div>
            <div className="stat-content">
              <h3>Total Expenses</h3>
              <p className="stat-value">$16,200</p>
              <p className="stat-change negative">+5% from last week</p>
            </div>
          </div>
        </Card>
        
        <Card title="Profit Margin">
          <div className="stat-container">
            <div className="stat-icon">
              <FaExchangeAlt />
            </div>
            <div className="stat-content">
              <h3>Net Profit</h3>
              <p className="stat-value">$8,300</p>
              <p className="stat-change positive">+18% from last week</p>
            </div>
          </div>
        </Card>
        
        <Card title="Revenue Breakdown">
          <div className="stat-container">
            <div className="stat-icon">
              <FaChartPie />
            </div>
            <div className="stat-content">
              <h3>Top Revenue Source</h3>
              <p className="stat-value">Corporate Events</p>
              <p className="stat-change">42% of total revenue</p>
            </div>
          </div>
        </Card>
        
        <Card title="Recent Transactions" className="full-width-card">
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Category</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Nov 15, 2023</td>
                  <td>Corporate Workshop</td>
                  <td>Revenue</td>
                  <td className="positive">$5,200</td>
                </tr>
                <tr>
                  <td>Nov 14, 2023</td>
                  <td>Office Supplies</td>
                  <td>Expense</td>
                  <td className="negative">-$320</td>
                </tr>
                <tr>
                  <td>Nov 12, 2023</td>
                  <td>Team Building Event</td>
                  <td>Revenue</td>
                  <td className="positive">$3,800</td>
                </tr>
                <tr>
                  <td>Nov 10, 2023</td>
                  <td>Marketing Campaign</td>
                  <td>Expense</td>
                  <td className="negative">-$1,500</td>
                </tr>
                <tr>
                  <td>Nov 8, 2023</td>
                  <td>Conference Booking</td>
                  <td>Revenue</td>
                  <td className="positive">$7,200</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default WeeklyFinancialDigest; 