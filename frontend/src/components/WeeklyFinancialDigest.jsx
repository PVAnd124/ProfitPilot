import React from 'react';
import Card from './Card';
import { FaChartLine, FaMoneyBillWave, FaExchangeAlt, FaChartPie } from 'react-icons/fa';

const WeeklyFinancialDigest = () => {
  return (
    <div className="page-container">
      <h1>Weekly Financial Digest</h1>
      
      <div className="dashboard-grid">
        <Card title="Revenue Overview" className="full-width-card">
          <div className="chart-placeholder">
            <p>Revenue chart will be displayed here</p>
          </div>
        </Card>
        
        <Card title="Top Revenue Sources">
          <div className="content-placeholder">
            <p>Top revenue sources will be displayed here</p>
          </div>
        </Card>
        
        <Card title="Expenses Breakdown">
          <div className="content-placeholder">
            <p>Expenses breakdown will be displayed here</p>
          </div>
        </Card>
        
        <Card title="Profit Margin">
          <div className="content-placeholder">
            <p>Profit margin analysis will be displayed here</p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default WeeklyFinancialDigest; 