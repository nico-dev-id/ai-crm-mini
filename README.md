# 🤝 AI-Powered CRM Mini

A modern CRM system with AI-powered customer analysis and Redis caching for optimal performance.

## 🚀 Live Demo
- **Frontend**: https://ai-crm-mini.vercel.app/
- **Backend API**: https://nico-dev-id-ai-crm-mini-api.hf.space/docs

## ✨ Features
- 🔐 User authentication (JWT)
- 👥 Customer relationship management (CRUD)
- 💼 Deal/pipeline tracking
- 🤖 AI-powered customer analysis using LLaMA 3.3 70b
- ⚡ Redis caching for instant AI responses
- 📊 Real-time dashboard with business metrics
- 🎨 Modern dark-themed UI

## 🛠️ Tech Stack

**Backend:**
- FastAPI (Python)
- PostgreSQL + SQLAlchemy
- Redis (caching layer)
- Groq API (LLaMA 3.3 70b)
- JWT Authentication

**Frontend:**
- Next.js 15 + TypeScript
- React
- Tailwind CSS

**Deployment:**
- Hugging Face Spaces (Backend)
- Vercel (Frontend)
- Supabase (PostgreSQL)
- Upstash (Redis)

## 🏗️ Architecture

User → Next.js (TypeScript) → FastAPI Backend → PostgreSQL (data)
→ Redis (AI cache)
→ Groq LLaMA (AI analysis)

## 💡 Key Technical Highlights
- **Caching Strategy**: AI analysis results cached in Redis (1hr TTL) to reduce API costs and improve response time from ~3s to instant
- **Type Safety**: Full TypeScript implementation on frontend
- **Cache Invalidation**: Automatic cache clearing when customer/deal data changes

## 🚦 Getting Started

### Backend
```bash
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## 📝 Environment Variables

### Backend (.env)

DATABASE_URL=postgresql://...
GROQ_API_KEY=gsk_...
REDIS_URL=rediss://...

> ⚠️ Note: This is a portfolio project. Please do not enter sensitive customer data.