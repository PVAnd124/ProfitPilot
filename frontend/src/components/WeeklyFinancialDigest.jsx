// import React from 'react';
// import Card from './Card';
// import { FaChartLine, FaMoneyBillWave, FaExchangeAlt, FaChartPie } from 'react-icons/fa';

////////////////// const WeeklyFinancialDigest = () => {
//   return (
//     <div className="page-container">
//       <h1>Weekly Financial Digest</h1>
      
//       <div className="dashboard-grid">
//         <Card title="Revenue Overview" className="full-width-card">
//           <div className="chart-placeholder">
//             <p>Revenue chart will be displayed here</p>
//           </div>
//         </Card>
        
//         <Card title="Top Revenue Sources">
//           <div className="content-placeholder">
//             <p>Top revenue sources will be displayed here</p>
//           </div>
//         </Card>
        
//         <Card title="Expenses Breakdown">
//           <div className="content-placeholder">
//             <p>Expenses breakdown will be displayed here</p>
//           </div>
//         </Card>
        
//         <Card title="Profit Margin">
//           <div className="content-placeholder">
//             <p>Profit margin analysis will be displayed here</p>
//           </div>
//         </Card>
//       </div>
//     </div>
//   );
// };

// export default WeeklyFinancialDigest; 

import React, { useState, useEffect } from 'react';
import Card from './Card';
import { FaChartLine, FaMoneyBillWave, FaExchangeAlt, FaChartPie } from 'react-icons/fa';

const WeeklyFinancialDigest = () => {
  const [revenueData, setRevenueData] = useState(null);
  const [insights, setInsights] = useState('Loading insights...');
  const [forecastPlot, setForecastPlot] = useState(null);
  const [revenuePlot, setRevenuePlot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchWithRetry = async (url, retries = 3) => {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(url);
        if (response.ok) return response;
      } catch (err) {
        console.log(`Attempt ${i+1} failed, retrying...`);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
      }
    }
    throw new Error(`Failed to fetch after ${retries} attempts`);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Add timestamp to URL to prevent caching
        const timestamp = new Date().getTime();
        
        // Try to fetch revenue data
        try {
          const revenueRes = await fetchWithRetry(`http://localhost:5001/api/weekly-revenue?t=${timestamp}`);
          if (revenueRes.ok) {
            const revenueData = await revenueRes.json();
            setRevenueData(revenueData.revenue_data);
            setInsights(revenueData.insights || 'No insights available.');
          } else {
            console.warn('Could not fetch revenue data:', revenueRes.status);
            setInsights('Unable to load revenue insights at this time.');
          }
        } catch (err) {
          console.error('Revenue data fetch error:', err);
        }
        
        // Try to fetch forecast plot
        try {
          setForecastPlot(`http://localhost:5001/api/forecast-plot?t=${timestamp}`);
        } catch (err) {
          console.error('Forecast plot fetch error:', err);
        }
        
        // Try to fetch revenue plot
        try {
          setRevenuePlot(`http://localhost:5001/api/revenue-plot?t=${timestamp}`);
        } catch (err) {
          console.error('Revenue plot fetch error:', err);
        }
      } catch (error) {
        console.error('Error in overall fetch process:', error);
        setError('Failed to load financial data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <div>Loading financial data...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="page-container">
      <h1>Weekly Financial Digest</h1>
      
      <div className="dashboard-grid">
        <Card title="Revenue Overview" className="full-width-card">
          <div className="chart-container">
            {revenuePlot ? (
              <img 
                src={revenuePlot}
                alt="Weekly Revenue Chart"
                style={{ width: '100%', height: 'auto' }}
                onError={(e) => {
                  console.error("Revenue image failed to load");
                  e.target.src = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22800%22%20height%3D%22400%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Crect%20width%3D%22800%22%20height%3D%22400%22%20fill%3D%22%23eee%22%2F%3E%3Ctext%20x%3D%22400%22%20y%3D%22200%22%20font-family%3D%22Arial%22%20font-size%3D%2220%22%20text-anchor%3D%22middle%22%3ERevenue%20chart%20failed%20to%20load%3C%2Ftext%3E%3C%2Fsvg%3E';
                }}
              />
            ) : (
              <div className="chart-placeholder">Unable to load revenue chart</div>
            )}
          </div>
        </Card>
        
        <Card title="AI Revenue Analysis" className="full-width-card">
          <div className="analysis-content">
            <p>{insights}</p>
          </div>
        </Card>
        
        <Card title="Demand Forecast" className="full-width-card">
          <div className="chart-container">
            {forecastPlot ? (
              <img 
                src={forecastPlot}
                alt="Demand Forecast"
                style={{ width: '100%', height: 'auto' }}
                onError={(e) => {
                  console.error("Forecast image failed to load");
                  e.target.src = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22800%22%20height%3D%22400%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Crect%20width%3D%22800%22%20height%3D%22400%22%20fill%3D%22%23eee%22%2F%3E%3Ctext%20x%3D%22400%22%20y%3D%22200%22%20font-family%3D%22Arial%22%20font-size%3D%2220%22%20text-anchor%3D%22middle%22%3EForecast%20chart%20failed%20to%20load%3C%2Ftext%3E%3C%2Fsvg%3E';
                }}
              />
            ) : (
              <div className="chart-placeholder">Unable to load forecast chart</div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default WeeklyFinancialDigest;