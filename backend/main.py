from fastapi import FastAPI
from pydantic import BaseModel, Field
from fastapi.middleware.cors import CORSMiddleware
from agent import run_agent
from datetime import date

from database import engine, SessionLocal
from models import Base, Interaction as InteractionModel

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="AI CRM HCP Module", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ──────────────────────────────────────────────
# Schemas
# ──────────────────────────────────────────────

class Interaction(BaseModel):
    hcp_name: str
    interaction_type: str = "Meeting"
    date: str = ""
    time: str = ""
    attendees: str = ""
    topics_discussed: str = ""
    sentiment: str = "Neutral"
    materials_shared: str = ""
    samples_distributed: str = ""
    outcome: str = ""
    followup_actions: str = ""


class ChatInput(BaseModel):
    message: str


class EditInput(BaseModel):
    message: str
    existing: dict = Field(default_factory=dict)


# ──────────────────────────────────────────────
# Root
# ──────────────────────────────────────────────

@app.get("/")
def read_root():
    return {"message": "AI CRM HCP Backend running", "tools": 5}


# ──────────────────────────────────────────────
# Manual form logging
# ──────────────────────────────────────────────

@app.post("/log_interaction")
def log_interaction(data: Interaction):
    db = SessionLocal()

    record = InteractionModel(**data.dict())

    db.add(record)
    db.commit()
    db.refresh(record)
    db.close()

    return {"message": "Interaction logged", "id": record.id}


# ──────────────────────────────────────────────
# Get interactions
# ──────────────────────────────────────────────

@app.get("/interactions")
def get_interactions():
    db = SessionLocal()
    interactions = db.query(InteractionModel).all()
    db.close()
    return interactions


# ──────────────────────────────────────────────
# AI Chat (LangGraph pipeline)
# ──────────────────────────────────────────────

@app.post("/ai_chat")
def ai_chat(input: ChatInput):

    try:

        result = run_agent(input.message)

        interaction_data = result.get("interaction") or {}
        summary = result.get("summary", "")
        sentiment_data = result.get("sentiment_analysis", {})
        followup_data = result.get("followup_suggestion", {})

        if not interaction_data.get("date"):
            interaction_data["date"] = str(date.today())

        db = SessionLocal()

        record = InteractionModel(
            hcp_name=interaction_data.get("hcp_name", ""),
            interaction_type=interaction_data.get("interaction_type", "Meeting"),
            date=interaction_data.get("date", str(date.today())),
            time=interaction_data.get("time", ""),
            attendees=interaction_data.get("attendees", ""),
            topics_discussed=interaction_data.get("topics_discussed", ""),
            sentiment=interaction_data.get("sentiment", "Neutral"),
            materials_shared=interaction_data.get("materials_shared", ""),
            samples_distributed=interaction_data.get("samples_distributed", ""),
            outcome=interaction_data.get("outcome", ""),
            followup_actions=interaction_data.get("followup_actions", ""),
            summary=summary,
        )

        db.add(record)
        db.commit()
        db.close()

        return {
            "interaction": interaction_data,
            "summary": summary,
            "sentiment_analysis": sentiment_data,
            "followup_suggestion": followup_data,
        }

    except Exception as e:
        return {"error": "AI pipeline failed", "details": str(e)}


# ──────────────────────────────────────────────
# Edit interaction (AI)
# ──────────────────────────────────────────────

@app.post("/edit_interaction")
def edit_interaction(input: EditInput):
    try:
        # Pass existing interaction so the agent can edit it correctly
        result = run_agent(input.message, existing_interaction=input.existing or {})
        return {
            "message": "Interaction updated",
            "interaction": result.get("interaction"),
            "summary": result.get("summary"),
            "followup_suggestion": result.get("followup_suggestion"),
        }
    except Exception as e:
        return {"error": "Edit failed", "details": str(e)}



# ──────────────────────────────────────────────
# Summarize interactions
# ──────────────────────────────────────────────

@app.get("/summarize_interactions")
def summarize_interactions():

    db = SessionLocal()
    interactions = db.query(InteractionModel).all()
    db.close()

    if not interactions:
        return {"summary": "No interactions yet"}

    doctors = list(set(i.hcp_name for i in interactions))
    topics = [i.topics_discussed for i in interactions if i.topics_discussed]

    summary = (
        f"You had {len(interactions)} interactions with "
        f"{len(doctors)} doctors including {', '.join(doctors[:5])}. "
        f"Topics discussed include: {'; '.join(topics[:3])}."
    )

    return {
        "summary": summary,
        "total_interactions": len(interactions),
        "doctors": doctors
    }


# ──────────────────────────────────────────────
# Follow-up suggestion
# ──────────────────────────────────────────────

@app.get("/suggest_followup")
def suggest_followup():

    db = SessionLocal()
    interactions = db.query(InteractionModel).all()
    db.close()

    if not interactions:
        return {"suggestion": "No interactions available"}

    last = interactions[-1]

    suggestion = (
        f"Follow up with {last.hcp_name} about '{last.topics_discussed}'. "
        f"Sentiment was {last.sentiment}. "
        f"Recommended action: {last.followup_actions or 'Send product information and schedule next meeting.'}"
    )

    return {
        "suggestion": suggestion,
        "hcp": last.hcp_name,
        "sentiment": last.sentiment
    }


# ──────────────────────────────────────────────
# Sentiment analysis endpoint
# ──────────────────────────────────────────────

@app.post("/analyze_sentiment")
def analyze_sentiment_endpoint(input: ChatInput):

    try:

        from agent import analyze_sentiment

        state = {"message": input.message, "interaction": None}

        result = analyze_sentiment(state)

        return {
            "sentiment_analysis": result.get("sentiment_analysis", {})
        }

    except Exception as e:
        return {"error": "Sentiment analysis failed", "details": str(e)}