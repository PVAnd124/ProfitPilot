"""
Business Management System - Main Architecture
This file defines the core components and workflow for the business management system.
"""

import os
from typing import Dict, List, Any, Tuple, Optional
from datetime import datetime, timedelta
from dotenv import load_dotenv
import json
import logging
from langchain_core.messages import HumanMessage, AIMessage
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI
from langgraph.graph import StateGraph, END
from langgraph.prebuilt import ToolExecutor, ToolInvocation

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize LLM
llm = ChatOpenAI(
    model="gpt-4o-2024-05-13",  # Use the most capable model as of Oct 2024
    temperature=0.1,
    # Configure with your OpenAI API key
    api_key=os.getenv("OPENAI_API_KEY")
)

# System state definition
class SystemState(dict):
    """State of the business management system"""
    
    def __init__(
        self,
        messages: List[dict] = None,
        current_agent: str = "coordinator",
        task_queue: List[Dict] = None,
        event_data: Dict = None,
        business_data: Dict = None,
        analysis_results: Dict = None,
        scheduled_reports: List[Dict] = None,
    ):
        self.messages = messages or []
        self.current_agent = current_agent
        self.task_queue = task_queue or []
        self.event_data = event_data or {}
        self.business_data = business_data or {}
        self.analysis_results = analysis_results or {}
        self.scheduled_reports = scheduled_reports or []
        
        super().__init__(
            messages=self.messages,
            current_agent=self.current_agent,
            task_queue=self.task_queue,
            event_data=self.event_data,
            business_data=self.business_data,
            analysis_results=self.analysis_results,
            scheduled_reports=self.scheduled_reports,
        )
    
    def add_message(self, message: dict) -> None:
        """Add a message to the conversation history"""
        self.messages.append(message)
        self["messages"] = self.messages
    
    def set_current_agent(self, agent: str) -> None:
        """Set the current active agent"""
        self.current_agent = agent
        self["current_agent"] = agent
    
    def add_task(self, task: Dict) -> None:
        """Add a task to the queue"""
        self.task_queue.append(task)
        self["task_queue"] = self.task_queue
    
    def get_next_task(self) -> Optional[Dict]:
        """Get the next task from the queue"""
        if self.task_queue:
            task = self.task_queue.pop(0)
            self["task_queue"] = self.task_queue
            return task
        return None
    
    def update_event_data(self, data: Dict) -> None:
        """Update event scheduling data"""
        self.event_data.update(data)
        self["event_data"] = self.event_data
    
    def update_business_data(self, data: Dict) -> None:
        """Update business analytics data"""
        self.business_data.update(data)
        self["business_data"] = self.business_data
    
    def update_analysis_results(self, results: Dict) -> None:
        """Update analysis results"""
        self.analysis_results.update(results)
        self["analysis_results"] = self.analysis_results
    
    def add_scheduled_report(self, report: Dict) -> None:
        """Add a scheduled report"""
        self.scheduled_reports.append(report)
        self["scheduled_reports"] = self.scheduled_reports


# Main system coordinator
def system_coordinator(state: SystemState) -> Dict:
    """
    Central coordinator that routes tasks to appropriate agents.
    
    This function serves as the entry point for the system and dispatches
    tasks to different specialized agents.
    """
    # Process the incoming message to determine the required action
    last_message = state.messages[-1] if state.messages else None
    
    if not last_message:
        # No messages yet, initialize the system
        return {"current_agent": "idle"}
    
    # Determine the intent and route to the correct agent
    intent_prompt = ChatPromptTemplate.from_messages([
        ("system", """
        You are a business management system coordinator. Determine the appropriate agent to handle the incoming request.
        Available agents:
        - event_scheduler: For scheduling events, handling booking requests, generating invoices
        - analytics_engine: For querying business data, sales information, inventory, etc.
        - insights_generator: For generating business insights, reports, and trend analysis
        - coordinator: For general system management
        """),
        ("human", "{input}")
    ])
    
    content = last_message.get("content", "") if isinstance(last_message, dict) else last_message
    intent_chain = intent_prompt | llm | StrOutputParser()
    agent = intent_chain.invoke({"input": content})
    
    # Clean up the agent name if needed
    agent = agent.lower().strip()
    if "event" in agent or "schedule" in agent or "booking" in agent:
        return {"current_agent": "event_scheduler"}
    elif "analytics" in agent or "data" in agent or "query" in agent:
        return {"current_agent": "analytics_engine"}
    elif "insight" in agent or "report" in agent or "analysis" in agent:
        return {"current_agent": "insights_generator"}
    else:
        return {"current_agent": "coordinator"}


# Create the workflow graph
def create_system_graph():
    """
    Create the LangGraph workflow for the business management system.
    """
    from event_scheduler import process_event_request
    from analytics_engine import process_analytics_query
    from insights_generator import generate_insights
    
    # Initialize the workflow graph
    workflow = StateGraph(SystemState)
    
    # Add nodes
    workflow.add_node("coordinator", system_coordinator)
    workflow.add_node("event_scheduler", process_event_request)
    workflow.add_node("analytics_engine", process_analytics_query)
    workflow.add_node("insights_generator", generate_insights)
    workflow.add_node("idle", lambda x: {"current_agent": END})
    
    # Define edges
    workflow.add_edge("coordinator", "event_scheduler")
    workflow.add_edge("coordinator", "analytics_engine")
    workflow.add_edge("coordinator", "insights_generator")
    workflow.add_edge("coordinator", "idle")
    
    # Return to coordinator after task completion
    workflow.add_edge("event_scheduler", "coordinator")
    workflow.add_edge("analytics_engine", "coordinator")
    workflow.add_edge("insights_generator", "coordinator")
    
    # Set the entry point
    workflow.set_entry_point("coordinator")
    
    return workflow.compile()


# Main execution function
def run_business_system(input_message: str = None, state: Dict = None):
    """
    Run the business management system with an input message.
    
    Args:
        input_message: The input message to process
        state: Optional existing state to continue from
    
    Returns:
        Updated state after processing
    """
    graph = create_system_graph()
    
    if state is None:
        state = SystemState()
    
    if input_message:
        state.add_message({"role": "human", "content": input_message})
    
    # Execute the workflow
    result = graph.invoke(state)
    return result


if __name__ == "__main__":
    print("Business Management System initialized.")
    # Example usage
    result = run_business_system("Schedule a new catering event for next Tuesday")
    print(f"Result: {result}")
"""
Note: This is the main system architecture. The three core components
(event_scheduler.py, analytics_engine.py, and insights_generator.py) will be
implemented separately.
"""