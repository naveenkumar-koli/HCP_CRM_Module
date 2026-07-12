from sqlalchemy import Column, Integer, String, Text
from database import Base


class Interaction(Base):
    __tablename__ = "interactions"

    id = Column(Integer, primary_key=True, index=True)

    hcp_name = Column(String(255), nullable=False)
    interaction_type = Column(String(100), default="Meeting")

    date = Column(String(50))
    time = Column(String(50), default="")

    attendees = Column(Text, default="")
    topics_discussed = Column(Text, default="")

    materials_shared = Column(Text, default="")
    samples_distributed = Column(Text, default="")

    sentiment = Column(String(50), default="Neutral")

    outcome = Column(Text, default="")
    followup_actions = Column(Text, default="")

    summary = Column(Text, default="")