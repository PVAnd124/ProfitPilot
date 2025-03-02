import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import io
from flask import jsonify, send_file
from datetime import datetime, timedelta
from openai import OpenAI
from dotenv import load_dotenv
import os
import matplotlib
matplotlib.use('Agg')  # Set non-interactive backend

# Load environment variables
load_dotenv()
client = OpenAI(
    api_key=os.getenv('OPENAI_API_KEY')
)

def calculate_weekly_revenue(engine=None):
    """
    Calculate weekly revenue for the most recent month from the database.
    Returns both the revenue data and a matplotlib figure.
    """
    try:
        # Get the current date (or use the same end date as in forecast.py for consistency)
        end_date = pd.Timestamp('2023-12-31')  # Match the date used in forecast.py
        start_date = end_date - pd.Timedelta(days=30)
        
        print(f"Calculating revenue from {start_date} to {end_date}")
        
        # Check if engine was provided
        if engine is None:
            from sqlalchemy import create_engine
            engine = create_engine('sqlite:///:memory:', echo=False)
            print("WARNING: Using new in-memory database - likely empty!")
            
        # Query the data with explicit date filtering
        query = f"""
        SELECT timestamp, cost
        FROM purchases
        WHERE timestamp >= '{start_date}'
        AND timestamp <= '{end_date}'
        """
        df = pd.read_sql(query, engine)
        
        print(f"Found {len(df)} records for revenue calculation")
        
        if df.empty:
            print("No data found in the query result - returning empty plot")
            raise ValueError("No data found in the specified date range")
            
        df['timestamp'] = pd.to_datetime(df['timestamp'])
        
        # Group by week number and calculate total revenue
        df['week'] = df['timestamp'].dt.isocalendar().week
        weekly_revenue = df.groupby('week')['cost'].sum().reset_index()
        
        print(f"Calculated revenue for {len(weekly_revenue)} weeks")
        
        # Create the revenue plot
        fig, ax = plt.subplots(figsize=(10, 6))
        
        # Use a bar chart with a more distinctive style
        bars = ax.bar(weekly_revenue['week'], weekly_revenue['cost'], 
                    color='skyblue', edgecolor='navy', alpha=0.7, width=0.7)
        
        # Add value labels on top of each bar
        for bar in bars:
            height = bar.get_height()
            ax.annotate(f'${height:.2f}',
                       xy=(bar.get_x() + bar.get_width() / 2, height),
                       xytext=(0, 3),  # 3 points vertical offset
                       textcoords="offset points",
                       ha='center', va='bottom')
        
        ax.set_xlabel('Week Number')
        ax.set_ylabel('Total Revenue ($)')
        ax.set_title('Weekly Revenue - Past Month')
        ax.grid(True, alpha=0.3)
        plt.tight_layout()
        
        # Save plot to bytes buffer
        buf = io.BytesIO()
        fig.savefig(buf, format='png', bbox_inches='tight', dpi=300)
        plt.close(fig)
        buf.seek(0)
        
        return weekly_revenue, buf
        
    except Exception as e:
        print(f"Error in calculate_weekly_revenue: {str(e)}")
        # Return empty data and a simple plot for error cases
        empty_revenue = pd.DataFrame({'week': [1, 2, 3, 4], 'cost': [0, 0, 0, 0]})
        fig, ax = plt.subplots(figsize=(10, 6))
        ax.text(0.5, 0.5, f'No revenue data available: {str(e)}', 
                horizontalalignment='center', verticalalignment='center',
                fontsize=12, color='red')
        plt.tight_layout()
        buf = io.BytesIO()
        fig.savefig(buf, format='png', bbox_inches='tight', dpi=300)
        plt.close(fig)
        buf.seek(0)
        return empty_revenue, buf

def generate_revenue_insights(weekly_revenue):
    """
    Generate AI insights about the weekly revenue trends.
    """
    try:
        # Handle case where there's not enough data
        if len(weekly_revenue) < 2:
            return "Insufficient data to generate meaningful insights. More revenue data is needed."
        
        # Calculate week-over-week changes
        weekly_revenue['revenue_change'] = weekly_revenue['cost'].pct_change()
        
        # Get latest week data
        latest_week = weekly_revenue.iloc[-1]
        
        # If we have at least 2 weeks of data, get previous week
        if len(weekly_revenue) >= 2:
            prev_week = weekly_revenue.iloc[-2]
            change_text = f"Week-over-Week Change: {latest_week['revenue_change']*100:.1f}%"
        else:
            prev_week = None
            change_text = "No previous week data available for comparison"
        
        # Prepare data for AI analysis
        revenue_summary = f"""
        Weekly Revenue Data (Most Recent {len(weekly_revenue)} Weeks):
        {weekly_revenue.to_string()}
        
        Latest Week Revenue: ${latest_week['cost']:.2f}
        {f"Previous Week Revenue: ${prev_week['cost']:.2f}" if prev_week is not None else ""}
        {change_text}
        """
        
        # If OpenAI API is not configured, return a basic analysis
        if not client:
            print("No OpenAI API key found, using basic analysis")
            # Generate basic analysis
            total_revenue = weekly_revenue['cost'].sum()
            avg_revenue = weekly_revenue['cost'].mean()
            if len(weekly_revenue) >= 2 and latest_week['revenue_change'] > 0:
                trend = f"Revenue is trending upward with a {latest_week['revenue_change']*100:.1f}% increase in the latest week."
            elif len(weekly_revenue) >= 2 and latest_week['revenue_change'] < 0:
                trend = f"Revenue is trending downward with a {abs(latest_week['revenue_change'])*100:.1f}% decrease in the latest week."
            else:
                trend = "Not enough data to determine a clear trend."
                
            return f"Total revenue for the period: ${total_revenue:.2f}. Average weekly revenue: ${avg_revenue:.2f}. {trend}"
        
        # Generate AI analysis using OpenAI
        try:
            analysis = ""
            stream = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": """You are a financial analyst AI.
                        Analyze the weekly revenue data and provide insights about:
                        1. Revenue trends and growth
                        2. Any anomalies or concerning patterns
                        3. Actionable recommendations
                        Keep the analysis concise but informative (about a paragraph)."""}, {"role": "user","content": revenue_summary}],
                stream=True,
            )
            for chunk in stream:
                if chunk.choices[0].delta.content is not None:
                    analysis += chunk.choices[0].delta.content


            # response = openai.ChatCompletion.create(
            #     model="gpt-3.5-turbo",
            #     messages=[
            #         {
            #             "role": "system",
            #             "content": """You are a financial analyst AI.
            #             Analyze the weekly revenue data and provide insights about:
            #             1. Revenue trends and growth
            #             2. Any anomalies or concerning patterns
            #             3. Actionable recommendations
            #             Keep the analysis concise but informative (about a paragraph)."""
            #         },
            #         {
            #             "role": "user",
            #             "content": revenue_summary
            #         }
            #     ]
            # )
            # analysis = response.choices[0].message.content
        except Exception as e:
            print(f"Error with OpenAI API: {str(e)}")
            analysis = f"Unable to generate AI insights at this time: {str(e)}"
        
        return analysis
    except Exception as e:
        print(f"Error in generate_revenue_insights: {str(e)}")
        return f"Unable to analyze revenue data: {str(e)}"