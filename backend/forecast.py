import io
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from prophet import Prophet
from sqlalchemy import create_engine
from sqlalchemy.types import DateTime, Integer, Float
from flask import Flask, jsonify, request, send_file

# ------------------------------
# SETUP: In-Memory SQLite Database
# ------------------------------
engine = create_engine('sqlite:///:memory:', echo=False)
# engine = create_engine('sqlite:///my_database.db', echo=False)


def generate_sample_data():
    """
    Generate 100,000 sample purchase entries spanning across three years with a cyclical pattern in sales.
    The sales pattern is:
    - More sales from January to May
    - A slowdown in the summer months (June to July)
    - An uptick in sales from August to December
    """
    # Define the start and end dates
    start_date = '2021-01-01'
    end_date = '2023-12-31'
    
    # Generate a list of 100,000 random timestamps spanning 3 years
    timestamps = pd.to_datetime(
        np.random.uniform(
            pd.Timestamp(start_date).value,
            pd.Timestamp(end_date).value,
            size=100000
        )
    ).sort_values()

    # Generate cyclical sales pattern
    sales_pattern = np.zeros(len(timestamps))

    for i, timestamp in enumerate(timestamps):
        month = timestamp.month
        if month >= 1 and month <= 5:  # January to May: High sales
            sales_pattern[i] = np.random.uniform(10, 50)
        elif month >= 6 and month <= 7:  # June to July: Low sales
            sales_pattern[i] = np.random.uniform(1, 10)
        else:  # August to December: High sales again
            sales_pattern[i] = np.random.uniform(15, 60)
    
    # Generate random costs
    costs = np.random.uniform(5.0, 50.0, size=100000)
    
    # Create DataFrame
    data = pd.DataFrame({
        'purchaseId': np.arange(1, 100001),
        'timestamp': timestamps,
        'cost': costs,
        'sales': sales_pattern
    })
    
    # Save to SQLite database
    data.to_sql('purchases', engine, if_exists='replace', index=False,
                dtype={'purchaseId': Integer(), 'timestamp': DateTime(), 'cost': Float(), 'sales': Float()})
    
    print(f"Generated {len(data)} random purchase entries with cyclical sales pattern spanning {start_date} to {end_date}")


# ------------------------------
# ETL Pipeline & Prophet Forecasting
# ------------------------------
def run_etl_and_forecast():
    """
    Extract purchase data, group entries by day to count the number of purchases,
    fit a Prophet model on the daily counts, and return a forecast DataFrame for the next year.
    """
    # Extract purchase data from SQL
    df = pd.read_sql('SELECT timestamp, purchaseId FROM purchases', engine)
    df['timestamp'] = pd.to_datetime(df['timestamp'])
    
    # Group by day to count purchases - using date only, not exact timestamp
    df['date'] = df['timestamp'].dt.date
    daily_counts = df.groupby('date').size().reset_index(name='y')
    daily_counts['ds'] = pd.to_datetime(daily_counts['date'])
    daily_counts = daily_counts[['ds', 'y']]  # Prophet expects columns named 'ds' and 'y'
    
    # Calculate the date range of our data
    date_range = (daily_counts['ds'].max() - daily_counts['ds'].min()).days
    
    # Configure Prophet based on data characteristics
    model = Prophet(
        # Enable yearly seasonality only if we have close to a year of data
        yearly_seasonality='auto',
        # Enable weekly seasonality if we have enough data points
        weekly_seasonality='auto',
        # Disable daily seasonality as it's too granular for purchase data
        daily_seasonality=False,
        # Use a moderate changepoint_prior_scale to allow some flexibility but prevent overfitting
        changepoint_prior_scale=0.05,
        # Use a moderate seasonality_prior_scale
        seasonality_prior_scale=10.0,
        # Use additive seasonality by default
        seasonality_mode='additive'
    )
    
    # Add custom seasonality if we have enough data
    if date_range >= 60:  # If we have at least 2 months of data
        model.add_seasonality(
            name='monthly',
            period=30.5,
            fourier_order=5,
            prior_scale=10.0
        )
    
    model.fit(daily_counts)
    
    # Create future DataFrame for the next 365 days (1-year horizon)
    future = model.make_future_dataframe(periods=365)
    forecast = model.predict(future)
    
    # Store the historical data in the forecast DataFrame
    forecast['historical'] = np.nan
    forecast.loc[forecast['ds'].isin(daily_counts['ds']), 'historical'] = daily_counts['y'].values
    
    return forecast

# Global variable to store the latest forecast
latest_forecast = None

# ------------------------------
# Flask API to Serve the Forecast, Plot & Accept New Transactions
# ------------------------------
app = Flask(__name__)

@app.route('/forecast', methods=['GET'])
def get_forecast():
    """
    Returns the current forecast as JSON.
    The forecast includes predicted number of purchases per day with confidence intervals.
    """
    global latest_forecast
    if latest_forecast is None:
        latest_forecast = run_etl_and_forecast()
    # Select relevant columns and return as JSON
    result = latest_forecast[['ds', 'yhat', 'yhat_lower', 'yhat_upper']].to_dict(orient='records')
    return jsonify(result)

@app.route('/forecast_plot', methods=['GET'])
def get_forecast_plot():
    """
    Creates an aesthetic plot of the forecast and sends it as a PNG image.
    """
    global latest_forecast
    if latest_forecast is None:
        latest_forecast = run_etl_and_forecast()

    # Get the current date and filter the historical data to the last 365 days for plotting
    today = pd.Timestamp('today')
    one_year_ago = today - pd.Timedelta(days=365)
    
    # Plot historical data with a line to show trend
    historical_data = latest_forecast[~latest_forecast['historical'].isna()]
    historical_data = historical_data[historical_data['ds'] >= one_year_ago]

    # Create an aesthetic plot using matplotlib
    fig, ax = plt.subplots(figsize=(12, 6))

    # Plot historical data
    historical_data['smoothed'] = historical_data['historical'].rolling(window=7, min_periods=1).mean()
    ax.plot(historical_data['ds'], historical_data['smoothed'], 
            color='blue', alpha=0.6, linestyle='-', linewidth=2, 
            label='Smoothed Historical Data')


    
    # Plot forecast starting from the last historical date
    forecast_start = historical_data['ds'].max()
    forecast_mask = latest_forecast['ds'] > forecast_start

    # Plot the forecast line
    ax.plot(latest_forecast.loc[forecast_mask, 'ds'], 
            latest_forecast.loc[forecast_mask, 'yhat'], 
            color='red', label='Forecast', linewidth=2)

    # Add confidence interval
    ax.fill_between(
        latest_forecast.loc[forecast_mask, 'ds'],
        latest_forecast.loc[forecast_mask, 'yhat_lower'],
        latest_forecast.loc[forecast_mask, 'yhat_upper'],
        color='red', alpha=0.2, label='95% Confidence Interval'
    )

    # Add a vertical line to separate historical and forecast
    ax.axvline(x=forecast_start, color='gray', linestyle='--', alpha=0.5, label='Forecast Start')

    ax.set_xlabel('Date')
    ax.set_ylabel('Number of Purchases per Day')
    ax.set_title('Historical Data and Demand Forecast')
    ax.grid(True, alpha=0.3)
    ax.legend()
    plt.tight_layout()

    # Save the plot to a BytesIO object and return it
    buf = io.BytesIO()
    fig.savefig(buf, format='png', bbox_inches='tight', dpi=300)
    plt.close(fig)  # Close the figure to free memory
    buf.seek(0)
    return send_file(buf, mimetype='image/png')

@app.route('/new_transaction', methods=['POST'])
def new_transaction():
    """
    Adds a new purchase transaction. Expects a JSON payload with 'purchaseId', 'timestamp', and 'cost'.
    Inserting a new transaction triggers a refitting of the Prophet model.
    """
    global latest_forecast
    data = request.get_json()
    new_df = pd.DataFrame([data])
    new_df['timestamp'] = pd.to_datetime(new_df['timestamp'])
    
    # Append the new transaction to the 'purchases' table
    new_df.to_sql('purchases', engine, if_exists='append', index=False)
    
    # Trigger refitting of the Prophet model
    latest_forecast = run_etl_and_forecast()
    
    return jsonify({'message': 'New transaction added and Prophet model refitted.'}), 201

# ------------------------------
# Temporary Testing Function to Display the Plot from the Backend
# ------------------------------
def display_plot_temporarily():
    """
    For testing purposes: generate the forecast plot and display it on the backend.
    This function should be run in an environment with a display (e.g., during development).
    """
    forecast = run_etl_and_forecast()

    # Get the current date and filter the historical data to the last 365 days for plotting
    today = pd.Timestamp('today')
    one_year_ago = today - pd.Timedelta(days=365)
    
    # Create plot
    fig, ax = plt.subplots(figsize=(12, 6))

    # Plot historical data with a line to show trend
    historical_data = forecast[~forecast['historical'].isna()]
    historical_data = historical_data[historical_data['ds'] >= one_year_ago]

    # Filter based on the last year
    ax.scatter(historical_data['ds'], historical_data['historical'], 
              color='blue', alpha=0.5, s=20, label='Historical Data')
    ax.plot(historical_data['ds'], historical_data['historical'], 
            color='blue', alpha=0.3, linestyle='-', linewidth=1)
    
    print("sanity check 2")
    
    # Plot forecast starting from the last historical date
    forecast_start = historical_data['ds'].max()
    forecast_mask = forecast['ds'] > forecast_start
    
    print("sanity check 3")

    # Plot the forecast line
    ax.plot(forecast.loc[forecast_mask, 'ds'], 
            forecast.loc[forecast_mask, 'yhat'], 
            color='red', label='Forecast', linewidth=2)
    
    print("sanity check 4")

    # Add confidence interval
    ax.fill_between(
        forecast.loc[forecast_mask, 'ds'],
        forecast.loc[forecast_mask, 'yhat_lower'],
        forecast.loc[forecast_mask, 'yhat_upper'],
        color='red', alpha=0.2, label='95% Confidence Interval'
    )
    
    print("sanity check 5")

    # Add a vertical line to separate historical and forecast
    ax.axvline(x=forecast_start.to_datetime64(), color='gray', linestyle='--', alpha=0.5, label='Forecast Start')

    print("sanity check 6")
    
    ax.set_xlabel('Date')
    ax.set_ylabel('Number of Purchases per Day')
    ax.set_title('Historical Data and Demand Forecast')
    ax.grid(True, alpha=0.3)
    ax.legend()
    plt.tight_layout()
    plt.show()


# ------------------------------
# Main Execution
# ------------------------------
if __name__ == '__main__':
    generate_sample_data()
    # Uncomment the next line to temporarily display the plot on the backend for testing.
    display_plot_temporarily()
    app.run(debug=True)
