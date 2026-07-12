<div align="center">

# 🏥 AI CRM — HCP Module

### AI-Powered CRM for Pharmaceutical Field Representatives

*Describe a doctor visit in plain English. The AI agent handles the rest.*

[![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React_18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
[![LangGraph](https://img.shields.io/badge/LangGraph-Agent-FF6B6B?style=for-the-badge&logo=python&logoColor=white)](https://langchain-ai.github.io/langgraph/)
[![Groq](https://img.shields.io/badge/Groq-Llama_3.3_70B-F55036?style=for-the-badge)](https://groq.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-NeonDB-336791?style=for-the-badge&logo=postgresql&logoColor=white)](https://neon.tech/)

</div>

---

## 📌 What Is This?

**AI CRM — HCP Module** is an intelligent Customer Relationship Management system built specifically for **pharmaceutical field representatives** who interact with **Healthcare Professionals (HCPs)** — doctors, specialists, and hospital staff.

Instead of manually filling CRM forms after each visit, a field rep simply **types what happened** in plain English:

> *"Met Dr. Sharma today. Discussed Product X effectiveness. Shared a brochure and samples. Doctor seemed very interested and asked for a follow-up next week."*

The **LangGraph AI agent** automatically:
- ✅ Extracts all structured CRM fields from the message
- ✅ Detects the doctor's sentiment (Positive / Neutral / Negative)
- ✅ Generates a concise meeting summary
- ✅ Suggests smart follow-up actions
- ✅ Saves everything to the PostgreSQL database

---

## ✨ Features

| Feature | Description |
|---|---|
| 🤖 **AI Interaction Logging** | Describe a visit naturally — AI fills the CRM form automatically |
| ✏️ **AI-Powered Editing** | Edit interactions using natural language ("change the date to tomorrow") |
| 📊 **Sentiment Detection** | Auto-detects doctor engagement level and sentiment |
| 📝 **Meeting Summarization** | Generates a 2-sentence summary of every interaction |
| 📅 **Follow-up Suggestions** | AI recommends prioritized next actions for the rep |
| 📋 **Manual Form Entry** | Traditional form-based logging also supported |
| 🗂️ **Interaction History** | Full history of all HCP interactions |
| 📡 **REST API + Swagger UI** | Fully documented API via FastAPI Swagger |

---

## 🏗️ Architecture

```
React Frontend  (Vite + Redux Toolkit)
        │
        │  HTTP REST API
        ▼
FastAPI Backend  (Python)
        │
        │  run_agent()
        ▼
LangGraph AI Agent  (StateGraph Pipeline)
        │
        │  LLM Calls
        ▼
Groq LLM — Llama-3.3-70B-Versatile
        │
        │  SQLAlchemy ORM
        ▼
PostgreSQL Database  (Neon DB — Serverless)
```

### LangGraph Agent Pipeline

```
User Message
     │
     ▼
[Router]  ──────────────────────────────────────────────┐
     │                                                  │
     │ (new visit)                            (edit/change/update)
     ▼                                                  ▼
[log_interaction]                          [edit_interaction]
     │                                                  │
     └──────────────────────┬─────────────────────────┘
                            ▼
                  [analyze_sentiment]
                            │
                            ▼
                  [summarize_interaction]
                            │
                            ▼
                   [suggest_followup]
                            │
                            ▼
               Structured CRM Data → Saved to DB
```

---

## ⚙️ Tech Stack

### Frontend
| Technology | Role |
|---|---|
| **React 18** (Vite) | UI framework & component system |
| **Redux Toolkit** | Global state management (`aiSlice`, `interactionSlice`) |
| **Vanilla CSS** | Styling |

### Backend
| Technology | Role |
|---|---|
| **FastAPI** | REST API framework |
| **SQLAlchemy** | ORM for database operations |
| **Pydantic** | Request/response schema validation |
| **Uvicorn** | ASGI server |

### AI & LLM
| Technology | Role |
|---|---|
| **LangGraph** | Stateful AI agent graph — `StateGraph` orchestration |
| **LangChain Groq** | Groq LLM integration (`langchain_groq`) |
| **Groq API** | High-speed LLM inference |
| **Llama-3.3-70B-Versatile** | Underlying language model |

### Database
| Technology | Role |
|---|---|
| **PostgreSQL** | Relational database |
| **Neon DB** | Serverless Postgres hosting |
| **python-dotenv** | Environment variable management |

---

## 🤖 AI Agent — 5 Tools

The LangGraph agent runs as a **stateful sequential pipeline**. All 5 tools run on every request:

| # | Tool | When It Runs | What It Does |
|---|---|---|---|
| 1 | `log_interaction` | New visit description | Extracts `hcp_name`, `date`, `interaction_type`, `topics_discussed`, `materials_shared`, `samples_distributed`, `outcome`, `followup_actions` from free text |
| 2 | `edit_interaction` | Message contains "edit / change / update" | Applies only the requested changes to an existing interaction JSON |
| 3 | `analyze_sentiment` | Always | Returns `overall_sentiment`, `confidence`, `engagement_level` for the interaction |
| 4 | `summarize_interaction` | Always | Produces a 2-sentence human-readable meeting summary |
| 5 | `suggest_followup` | Always | Returns a prioritized list of next actions: `{ suggestions: [], priority: "High/Medium/Low" }` |

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Health check |
| `POST` | `/ai_chat` | Run full LangGraph agent pipeline on a natural language message |
| `POST` | `/log_interaction` | Manual CRM form submission |
| `GET` | `/interactions` | Fetch all stored interactions |
| `POST` | `/edit_interaction` | AI-powered interaction editing with existing context |
| `GET` | `/summarize_interactions` | Summarize all interactions across all doctors |
| `GET` | `/suggest_followup` | Get a follow-up suggestion for the most recent interaction |
| `POST` | `/analyze_sentiment` | Standalone sentiment analysis endpoint |

> 📖 Interactive docs: `http://127.0.0.1:8000/docs` (Swagger UI)

---

## 📁 Project Structure

```
crm_hcp_module/
│
├── backend/
│   ├── main.py              # FastAPI app & all 8 API endpoints
│   ├── agent.py             # LangGraph StateGraph — all 5 AI tools
│   ├── models.py            # SQLAlchemy ORM model (Interaction table)
│   ├── database.py          # DB engine, session, Base
│   ├── requirements.txt     # Python dependencies
│   └── .env                 # API keys (not committed to git)
│
├── frontend/
│   └── crm_frontend/
│       ├── src/
│       │   ├── App.jsx              # Main application component
│       │   ├── store.js             # Redux store
│       │   ├── aiSlice.js           # AI state slice (Redux)
│       │   ├── interactionSlice.js  # Interaction state slice
│       │   └── components/          # UI components
│       ├── index.html
│       ├── vite.config.js
│       └── package.json
│
├── screenshots/             # UI screenshots for README
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- **Python** 3.10+
- **Node.js** 18+
- [Groq API Key](https://console.groq.com/) — free tier available
- [Neon DB](https://neon.tech/) PostgreSQL connection string — free tier available

---

### 1️⃣ Backend Setup

```bash
# Navigate to backend
cd backend

# Create and activate virtual environment
python -m venv venv

venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS / Linux

# Install dependencies
pip install -r requirements.txt
```

Create a `.env` file inside the `backend/` folder:

```env
GROQ_API_KEY=your_groq_api_key_here
DATABASE_URL=postgresql://user:password@host/dbname
```

```bash
# Start the FastAPI server
uvicorn main:app --reload
```

| | URL |
|---|---|
| ✅ API | `http://127.0.0.1:8000` |
| ✅ Swagger UI | `http://127.0.0.1:8000/docs` |

---

### 2️⃣ Frontend Setup

```bash
# Navigate to frontend
cd frontend/crm_frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

✅ Frontend running at: `http://localhost:5173`

---

## 🔐 Environment Variables

| Variable | Description |
|---|---|
| `GROQ_API_KEY` | From [console.groq.com](https://console.groq.com/) |
| `DATABASE_URL` | PostgreSQL connection string (e.g. Neon DB) |

> ⚠️ Never commit your `.env` file. It is already in `.gitignore`.

---

## 🧩 How It Works — Step by Step

1. Field rep opens the **React frontend** and types a visit description.
2. Message is sent via `POST /ai_chat` to the **FastAPI backend**.
3. FastAPI calls `run_agent()` → initializes a **LangGraph `StateGraph`**.
4. The **Router node** classifies intent: log a new visit or edit an existing one.
5. The appropriate tool calls **Groq LLM (Llama-3.3-70B)** with a structured prompt.
6. LLM returns structured JSON — extracted CRM fields.
7. **Sentiment analysis** runs on `topics_discussed`.
8. A **2-sentence summary** is generated from the interaction data.
9. **Follow-up suggestions** with priority level are produced.
10. All data is **saved to PostgreSQL** via SQLAlchemy.
11. The complete result is returned to the React frontend, which **auto-fills the CRM form** and displays AI insights.

---

## 🎬 Demo

### 📹 Demo Video
[▶️ Watch the full demo on Google Drive](https://drive.google.com/file/d/1IVO8Vjx2-cT05uIIniS2vPvzDhRS7FsR/view?usp=drive_link)

---

### 📸 Screenshots

**Log Interaction — AI Chat UI**

![Log Interaction](screenshots/log_interaction.png)

**Interaction History**

![Interaction History](screenshots/history.png)

---

## 👩‍💻 Author

**Naveenkumar Koli**  
📧 [kolinaveen02@gmail.com](mailto:kolinaveen02@gmail.com)  
🎓  Software Engineer & AI Developer
---

<div align="center">

⭐

</div>
