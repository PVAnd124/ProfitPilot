import React from 'react';
import Card from './Card';

const FinancialRecords = () => {
  return (
    <div className="page-container">
      <h1>Complete Financial Records</h1>
      
      <div className="dashboard-grid">
        <Card title="Financial Records Overview" className="full-width-card">
          <div className="financial-records-content">
            <p>This is where the complete financial records will be displayed.</p>
            <p>Coming soon...</p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default FinancialRecords; 