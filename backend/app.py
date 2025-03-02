import os
import signal
import matplotlib
matplotlib.use('Agg')  

# Add this at the beginning of the file
def handle_exit(signum, frame):
    print("Exiting gracefully...")
    import sys
    sys.exit(0)

signal.signal(signal.SIGINT, handle_exit)
signal.signal(signal.SIGTERM, handle_exit)

from flask import Flask, jsonify, send_file, request
from flask_cors import CORS
# Import engine early so it's available throughout the file
from forecast import engine, generate_sample_data, run_etl_and_forecast, latest_forecast, get_forecast_plot
from revenue import calculate_weekly_revenue, generate_revenue_insights
import matplotlib.pyplot as plt
import io
from datetime import timedelta
import pandas as pd
from sqlalchemy import text
import numpy as np

app = Flask(__name__)
# Simplify CORS setting to allow all requests from your frontend
CORS(app, resources={r"/*": {"origins": "http://localhost:5173"}}, supports_credentials=True)

# Initialize data
generate_sample_data()

@app.route('/api/forecast', methods=['GET'])
def get_forecast():
    global latest_forecast
    if latest_forecast is None:
        latest_forecast = run_etl_and_forecast()
    result = latest_forecast[['ds', 'yhat', 'yhat_lower', 'yhat_upper']].to_dict(orient='records')
    return jsonify(result)

@app.route('/api/forecast-plot', methods=['GET'])
def forecast_plot():
    try:
        # Get the forecast plot
        return get_forecast_plot()
    except Exception as e:
        print(f"Forecast plot error: {str(e)}")
        # Create a simple error image
        fig, ax = plt.subplots(figsize=(10, 6))
        ax.text(0.5, 0.5, f'Error generating forecast plot: {str(e)}', 
                horizontalalignment='center', verticalalignment='center')
        plt.tight_layout()
        buf = io.BytesIO()
        fig.savefig(buf, format='png', bbox_inches='tight', dpi=300)
        plt.close(fig)
        buf.seek(0)
        return send_file(buf, mimetype='image/png')

@app.route('/api/weekly-revenue', methods=['GET'])
def get_weekly_revenue():
    try:
        # Check data exists and regenerate if needed
        if not check_data_exists():
            print("No data found, regenerating sample data...")
            generate_sample_data()
            
        weekly_revenue, _ = calculate_weekly_revenue(engine)
        insights = generate_revenue_insights(weekly_revenue)
        
        # Convert the DataFrame to a dictionary with nan values replaced with None
        # This ensures proper JSON serialization
        revenue_data = weekly_revenue.replace({np.nan: None}).to_dict(orient='records')
        
        return jsonify({
            'revenue_data': revenue_data,
            'insights': insights
        })
    except Exception as e:
        print(f"Weekly revenue error: {str(e)}")
        return jsonify({
            'error': str(e),
            'revenue_data': [],
            'insights': 'Unable to generate insights at this time.'
        }), 500

@app.route('/api/revenue-plot', methods=['GET'])
def get_revenue_plot():
    try:
        # Check data exists and regenerate if needed
        if not check_data_exists():
            print("No data found, regenerating sample data...")
            generate_sample_data()
            
        _, plot_buffer = calculate_weekly_revenue(engine)
        return send_file(plot_buffer, mimetype='image/png')
    except Exception as e:
        print(f"Revenue plot error: {str(e)}")
        # Create a simple error image
        fig, ax = plt.subplots(figsize=(10, 6))
        ax.text(0.5, 0.5, f'Error loading revenue data: {str(e)}', 
                horizontalalignment='center', verticalalignment='center')
        plt.tight_layout()
        buf = io.BytesIO()
        fig.savefig(buf, format='png', bbox_inches='tight', dpi=300)
        plt.close(fig)
        buf.seek(0)
        return send_file(buf, mimetype='image/png')

def check_data_exists():
    """Check if the database has data"""
    try:
        with engine.connect() as connection:
            result = connection.execute(text("SELECT COUNT(*) FROM purchases"))
            count = result.fetchone()[0]
            return count > 0
    except Exception as e:
        print(f"Error checking if data exists: {str(e)}")
        return False

if __name__ == '__main__':
    try:
        app.run(debug=True, port=5001, use_reloader=False)  # Disable reloader
    except KeyboardInterrupt:
        print("Server shutting down...")
    finally:
        # Force clean any remaining processes
        os._exit(0) 