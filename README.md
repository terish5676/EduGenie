# 🧞 EduGenie — AI-Powered Educational Assistant

> A production-ready, full-stack educational platform powered by FastAPI, Google Gemini AI, and MongoDB.

![EduGenie](frontend/assets/genie-hero.png)

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 💬 Intelligent Q&A | Instant AI answers to any academic question |
| 📚 Concept Explanation | Structured explanations with examples and analogies |
| ❓ Quiz Generator | MCQ, True/False, Fill-blank, Short answer quizzes |
| 📄 Text Summarizer | Summarize text or upload PDF/DOCX/TXT files |
| 🗺️ Learning Roadmap | Personalized roadmaps with milestones and resources |
| 📝 Notes | Create, edit, organize notes with folders and autosave |
| 🔖 Bookmarks | Save AI responses for later reference |
| 📈 Progress | Charts, activity heatmap, streaks, quiz performance |
| 🕐 History | Full history of all AI interactions |
| ⚙️ Settings | Theme, profile, password, preferences |

---

## 🚀 Quick Start

### Prerequisites
- Python 3.10+
- MongoDB (Atlas or local)
- Google Gemini API key

### 1. Clone & Install

```bash
cd EduGenieNEW
pip install -r requirements.txt
```

### 2. Configure Environment

```bash
# Copy and edit the .env file
copy .env.example .env
```

Open `.env` and fill in:
```
MONGODB_URI=mongodb+srv://youruser:yourpass@cluster.mongodb.net/edugenie
GEMINI_API_KEY=your_gemini_api_key_here
JWT_SECRET_KEY=your-very-secret-key-change-this
```

### 3. Run the Server

```bash
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

### 4. Open in Browser

```
http://localhost:8000
```

---

## 📁 Project Structure

```
EduGenieNEW/
├── backend/
│   ├── main.py              # FastAPI app entry point
│   ├── config.py            # Settings & environment variables
│   ├── database.py          # MongoDB connection (Motor async)
│   ├── middleware/
│   │   └── auth_middleware.py  # JWT auth dependency
│   ├── routers/
│   │   ├── auth.py          # Register, Login, Profile
│   │   ├── ai.py            # All AI tool endpoints
│   │   ├── notes.py         # Notes CRUD
│   │   ├── bookmarks.py     # Bookmarks CRUD
│   │   ├── history.py       # AI history
│   │   ├── progress.py      # Progress tracking
│   │   └── settings.py      # User settings
│   ├── services/
│   │   ├── gemini_service.py  # Google Gemini AI
│   │   ├── auth_service.py    # User auth logic
│   │   └── file_service.py    # PDF/DOCX/TXT extraction
│   └── utils/
│       ├── jwt_handler.py   # JWT token utilities
│       └── prompts.py       # Optimized AI prompt templates
├── frontend/
│   ├── index.html           # Landing page
│   ├── login.html           # Login
│   ├── signup.html          # Sign up
│   ├── forgot-password.html # Forgot password
│   ├── dashboard.html       # Main dashboard
│   ├── notes.html           # Notes management
│   ├── bookmarks.html       # Bookmarks
│   ├── progress.html        # Progress & charts
│   ├── history.html         # AI interaction history
│   ├── settings.html        # User settings
│   ├── css/
│   │   ├── main.css         # Global design system
│   │   ├── landing.css      # Landing page styles
│   │   ├── auth.css         # Auth page styles
│   │   ├── dashboard.css    # Dashboard styles
│   │   └── components.css   # Reusable components
│   ├── js/
│   │   ├── api.js           # Centralized API client
│   │   ├── main.js          # Shared utilities
│   │   ├── landing.js       # Landing page logic
│   │   ├── auth.js          # Auth forms
│   │   ├── dashboard.js     # Dashboard + AI tools
│   │   ├── notes.js         # Notes logic
│   │   ├── bookmarks.js     # Bookmarks logic
│   │   ├── progress.js      # Progress charts
│   │   ├── history.js       # History logic
│   │   └── settings.js      # Settings logic
│   └── assets/
│       ├── genie-hero.png   # Genie hero illustration
│       └── genie-dashboard.png  # Dashboard banner genie
├── uploads/                 # Uploaded files storage
├── .env.example             # Environment variable template
├── requirements.txt         # Python dependencies
└── README.md
```

---

## 🔑 API Documentation

After running the server, visit:
- **Swagger UI**: `http://localhost:8000/api/docs`
- **ReDoc**: `http://localhost:8000/api/redoc`

### Key Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get current user |
| POST | `/api/ai/qa` | Ask a question |
| POST | `/api/ai/explain` | Explain a concept |
| POST | `/api/ai/quiz` | Generate quiz |
| POST | `/api/ai/summarize` | Summarize text |
| POST | `/api/ai/summarize/file` | Summarize uploaded file |
| POST | `/api/ai/roadmap` | Generate learning roadmap |
| GET | `/api/notes/` | Get all notes |
| POST | `/api/notes/` | Create note |
| PUT | `/api/notes/{id}` | Update note |
| DELETE | `/api/notes/{id}` | Delete note |
| GET | `/api/bookmarks/` | Get bookmarks |
| GET | `/api/history/` | Get history |
| GET | `/api/progress/` | Get progress data |
| GET | `/api/settings/` | Get settings |
| PUT | `/api/settings/` | Update settings |

---

## 🔧 Adding Your MongoDB Connection String

1. Go to [MongoDB Atlas](https://cloud.mongodb.com) → Clusters → Connect
2. Choose "Connect your application"
3. Copy the connection string
4. Paste into `.env`:
   ```
   MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/edugenie
   ```

---

## 🌐 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGODB_URI` | ✅ | MongoDB connection string |
| `MONGODB_DB_NAME` | Optional | Database name (default: `edugenie`) |
| `GEMINI_API_KEY` | ✅ | Google Gemini API key |
| `JWT_SECRET_KEY` | ✅ | Secret key for JWT tokens |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Optional | Token expiry (default: 10080 = 7 days) |
| `MAX_UPLOAD_SIZE_MB` | Optional | Max upload size (default: 10MB) |
| `DEBUG` | Optional | Debug mode (default: True) |

---

## 🛡️ Security

- Passwords hashed with **bcrypt**
- Authentication via **JWT Bearer tokens**
- Tokens stored in `localStorage`, sent in `Authorization` header
- MongoDB queries are user-scoped (no cross-user data leakage)
- CORS configured for localhost development

---

## 📦 Dependencies

```
fastapi, uvicorn, motor, pymongo
python-jose, passlib, bcrypt
google-generativeai
PyPDF2, python-docx
python-multipart, pydantic, pydantic-settings
aiofiles, httpx, slowapi
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

## 📄 License

MIT License — © 2024 EduGenie
