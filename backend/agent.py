from dotenv import load_dotenv
import os
import json
import re
from datetime import date
from typing import TypedDict, Optional

from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, SystemMessage
from langgraph.graph import StateGraph, END

load_dotenv()

groq_key = os.getenv("GROQ_API_KEY")

llm = ChatGroq(
    groq_api_key=groq_key,
    model="llama-3.3-70b-versatile",
    temperature=0
)

# -------------------------
# Agent State
# -------------------------

class AgentState(TypedDict):
    message: str
    interaction: Optional[dict]
    summary: Optional[str]
    sentiment_analysis: Optional[dict]
    followup_suggestion: Optional[dict]
    tool_used: Optional[str]


# -------------------------
# Utility
# -------------------------

def extract_json(text: str) -> dict:

    match = re.search(r"\{[\s\S]*\}", text)

    if match:
        try:
            return json.loads(match.group())
        except:
            return {}

    return {}


# -------------------------
# Router
# -------------------------

def router(state: AgentState):

    msg = state["message"].lower()

    if any(word in msg for word in ["edit", "change", "update"]):
        return {**state, "tool_used": "edit_interaction"}

    return {**state, "tool_used": "log_interaction"}


# -------------------------
# TOOL 1: Log Interaction
# -------------------------

def log_interaction(state: AgentState):

    message = state["message"]

    system_prompt = """
You are an AI assistant for a pharmaceutical CRM system.

Extract interaction information.

Return ONLY valid JSON:

{
  "hcp_name": "",
  "interaction_type": "",
  "date": "",
  "time": "",
  "attendees": "",
  "topics_discussed": "",
  "sentiment": "",
  "materials_shared": "",
  "samples_distributed": "",
  "outcome": "",
  "followup_actions": ""
}

Rules:
- interaction_type: Meeting, Call, Email, Conference, Visit
- sentiment: Positive, Neutral, Negative
- date format: YYYY-MM-DD
"""

    response = llm.invoke([
        SystemMessage(content=system_prompt),
        HumanMessage(content=message)
    ])

    data = extract_json(response.content)

    if not data.get("date"):
        data["date"] = str(date.today())

    return {
        **state,
        "interaction": data,
        "tool_used": "log_interaction"
    }


# -------------------------
# TOOL 2: Edit Interaction
# -------------------------

def edit_interaction(state: AgentState):

    message = state["message"]
    interaction = state.get("interaction") or {}

    system_prompt = f"""
Update the CRM interaction JSON.

Current interaction:

{json.dumps(interaction, indent=2)}

Apply ONLY requested changes.

Return full updated JSON.
"""

    response = llm.invoke([
        SystemMessage(content=system_prompt),
        HumanMessage(content=message)
    ])

    updated = extract_json(response.content)

    if not updated:
        updated = interaction

    return {
        **state,
        "interaction": updated,
        "tool_used": "edit_interaction"
    }


# -------------------------
# TOOL 3: Sentiment Analysis
# -------------------------

def analyze_sentiment(state: AgentState):

    interaction = state.get("interaction") or {}

    text = interaction.get("topics_discussed", "")

    system_prompt = """
Analyze doctor sentiment.

Return JSON:

{
 "overall_sentiment": "Positive/Neutral/Negative",
 "confidence": 0.8,
 "engagement_level": "High/Medium/Low"
}
"""

    response = llm.invoke([
        SystemMessage(content=system_prompt),
        HumanMessage(content=text)
    ])

    data = extract_json(response.content)

    if not data:
        data = {
            "overall_sentiment": "Neutral",
            "confidence": 0.5,
            "engagement_level": "Medium"
        }

    updated = interaction.copy()
    updated["sentiment"] = data["overall_sentiment"]

    return {
        **state,
        "interaction": updated,
        "sentiment_analysis": data,
        "tool_used": "analyze_sentiment"
    }


# -------------------------
# TOOL 4: Summarize
# -------------------------

def summarize_interaction(state: AgentState):

    interaction = state.get("interaction") or {}

    if not interaction:
        return {**state, "summary": "No interaction available"}

    prompt = f"""
Summarize this interaction in 2 sentences.

{json.dumps(interaction, indent=2)}
"""

    response = llm.invoke([
        SystemMessage(content="You are a pharma CRM assistant."),
        HumanMessage(content=prompt)
    ])

    return {
        **state,
        "summary": response.content.strip(),
        "tool_used": "summarize_interaction"
    }


# -------------------------
# TOOL 5: Follow-up
# -------------------------

def suggest_followup(state: AgentState):

    interaction = state.get("interaction") or {}

    prompt = f"""
Suggest follow-up actions.

Interaction:
{json.dumps(interaction, indent=2)}

Return JSON:

{{
 "suggestions": [],
 "priority": "High/Medium/Low"
}}
"""

    response = llm.invoke([
        SystemMessage(content="You are a pharma sales coach."),
        HumanMessage(content=prompt)
    ])

    data = extract_json(response.content)

    if not data:
        data = {
            "suggestions": [response.content],
            "priority": "Medium"
        }

    return {
        **state,
        "followup_suggestion": data,
        "tool_used": "suggest_followup"
    }


# -------------------------
# Build Graph
# -------------------------

builder = StateGraph(AgentState)

builder.add_node("router", router)
builder.add_node("log_interaction", log_interaction)
builder.add_node("edit_interaction", edit_interaction)
builder.add_node("analyze_sentiment", analyze_sentiment)
builder.add_node("summarize_interaction", summarize_interaction)
builder.add_node("suggest_followup", suggest_followup)

builder.set_entry_point("router")

builder.add_conditional_edges(
    "router",
    lambda state: state["tool_used"],
    {
        "log_interaction": "log_interaction",
        "edit_interaction": "edit_interaction"
    }
)

builder.add_edge("log_interaction", "analyze_sentiment")
builder.add_edge("edit_interaction", "analyze_sentiment")

builder.add_edge("analyze_sentiment", "summarize_interaction")
builder.add_edge("summarize_interaction", "suggest_followup")

builder.add_edge("suggest_followup", END)

graph = builder.compile()


# -------------------------
# Run Agent
# -------------------------

def run_agent(message: str, existing_interaction: dict = None):

    state: AgentState = {
        "message": message,
        "interaction": existing_interaction,  # Pass existing data for edits
        "summary": None,
        "sentiment_analysis": None,
        "followup_suggestion": None,
        "tool_used": None
    }

    result = graph.invoke(state)

    return result