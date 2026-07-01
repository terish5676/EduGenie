# EduGenie

> AI-Powered Educational Assistant built with FastAPI, Google Gemini, MongoDB, and a modern responsive frontend.

EduGenie is an intelligent educational platform that helps students learn more effectively through AI-powered question answering, concept explanations, quiz generation, document summarization, personalized learning roadmaps, smart note-taking, and learning analytics.

---

![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=for-the-badge\&logo=python\&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-Latest-009688?style=for-the-badge\&logo=fastapi\&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge\&logo=mongodb\&logoColor=white)
![Google Gemini](https://img.shields.io/badge/Google-Gemini-4285F4?style=for-the-badge\&logo=google\&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)
![Status](https://img.shields.io/badge/Status-Production%20Ready-success?style=for-the-badge)

---

## Table of Contents

* Overview
* Features
* Technology Stack
* Architecture
* Screenshots
* Project Structure
* Getting Started
* Environment Variables
* API Documentation
* API Endpoints
* Security
* Performance
* Deployment
* Roadmap
* Contributing
* License

---

# Overview

EduGenie is a full-stack AI-powered educational platform designed to make learning smarter, faster, and more interactive.

Students can ask questions, receive detailed explanations, generate quizzes, summarize documents, organize notes, bookmark important responses, monitor their learning progress, and follow personalized learning roadmaps—all from a single application.

The project combines modern backend technologies with Google's Gemini AI to deliver fast, reliable, and intelligent educational assistance.

---

# Features

## AI Learning

* Intelligent Question Answering
* Concept Explanation
* Personalized Learning Roadmaps
* Quiz Generation
* AI Text Summarization
* PDF, DOCX and TXT Summarization

## Productivity

* Smart Notes
* Folder Organization
* Autosave Notes
* Bookmarks
* AI Interaction History

## Learning Analytics

* Progress Dashboard
* Learning Statistics
* Quiz Performance
* Activity Tracking
* Learning Streaks

## User Experience

* Secure Authentication
* Responsive Interface
* Dark and Light Themes
* Profile Management
* User Preferences
* File Upload Support

---

# Technology Stack

## Frontend

* HTML5
* CSS3
* JavaScript (ES6)

## Backend

* FastAPI
* Python
* JWT Authentication

## Database

* MongoDB Atlas
* Motor Async Driver

## Artificial Intelligence

* Google Gemini API

## File Processing

* PyPDF2
* python-docx

---

# Architecture

```text
                           Browser
                              │
                              ▼
                    FastAPI Backend Server
                              │
      ┌───────────────────────┼───────────────────────┐
      │                       │                       │
      ▼                       ▼                       ▼
 Authentication          AI Services          File Services
      │                       │                       │
      ▼                       ▼                       ▼
 JWT Authentication     Google Gemini API     PDF/DOCX Parsing
      │
      ▼
 MongoDB Atlas
```

---

# Screenshots

## Landing Page

<img width="1536" height="737" alt="image" src="https://github.com/user-attachments/assets/5251223e-2ad9-4b3c-a70f-c2b846d24a43" />


## Dashboard

<img width="1536" height="731" alt="image" src="https://github.com/user-attachments/assets/6340ba62-b490-495f-ab61-b9e4f67ee5b3" />


# Project Structure

```text
EduGenieNEW/
│
├── backend/
│   ├── main.py
│   ├── config.py
│   ├── database.py
│   │
│   ├── middleware/
│   │   └── auth_middleware.py
│   │
│   ├── routers/
│   │   ├── auth.py
│   │   ├── ai.py
│   │   ├── notes.py
│   │   ├── bookmarks.py
│   │   ├── history.py
│   │   ├── progress.py
│   │   └── settings.py
│   │
│   ├── services/
│   │   ├── gemini_service.py
│   │   ├── auth_service.py
│   │   └── file_service.py
│   │
│   └── utils/
│       ├── jwt_handler.py
│       └── prompts.py
│
├── frontend/
│   ├── index.html
│   ├── login.html
│   ├── signup.html
│   ├── forgot-password.html
│   ├── dashboard.html
│   ├── notes.html
│   ├── bookmarks.html
│   ├── progress.html
│   ├── history.html
│   ├── settings.html
│   │
│   ├── css/
│   ├── js/
│   └── assets/
│
├── uploads/
├── .env.example
├── requirements.txt
└── README.md
```

---

# Getting Started

## Prerequisites

* Python 3.10 or later
* MongoDB Atlas (or Local MongoDB)
* Google Gemini API Key

---

## Clone the Repository

```bash
git clone https://github.com/your-username/EduGenieNEW.git

cd EduGenieNEW
```

---

## Install Dependencies

```bash
pip install -r requirements.txt
```

---

## Configure Environment Variables

Copy the example file.

```bash
copy .env.example .env
```

Update the `.env` file.

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/edugenie

MONGODB_DB_NAME=edugenie

GEMINI_API_KEY=your_gemini_api_key

JWT_SECRET_KEY=your_super_secret_key

ACCESS_TOKEN_EXPIRE_MINUTES=10080

MAX_UPLOAD_SIZE_MB=10

DEBUG=True
```

---

## Run the Development Server

```bash
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

---

## Open the Application

```
http://localhost:8000
```

---

# API Documentation

After the server starts, interactive API documentation is available.

| Documentation | URL                             |
| ------------- | ------------------------------- |
| Swagger UI    | http://localhost:8000/api/docs  |
| ReDoc         | http://localhost:8000/api/redoc |

---

# API Endpoints

## Authentication

| Method | Endpoint             | Description          |
| ------ | -------------------- | -------------------- |
| POST   | `/api/auth/register` | Register a new user  |
| POST   | `/api/auth/login`    | Login                |
| GET    | `/api/auth/me`       | Current user profile |

---

## AI

| Method | Endpoint                 | Description         |
| ------ | ------------------------ | ------------------- |
| POST   | `/api/ai/qa`             | Question Answering  |
| POST   | `/api/ai/explain`        | Concept Explanation |
| POST   | `/api/ai/quiz`           | Quiz Generator      |
| POST   | `/api/ai/summarize`      | Text Summarization  |
| POST   | `/api/ai/summarize/file` | File Summarization  |
| POST   | `/api/ai/roadmap`        | Learning Roadmap    |

---

## Notes

| Method | Endpoint          |
| ------ | ----------------- |
| GET    | `/api/notes`      |
| POST   | `/api/notes`      |
| PUT    | `/api/notes/{id}` |
| DELETE | `/api/notes/{id}` |

---

## Bookmarks

| Method | Endpoint         |
| ------ | ---------------- |
| GET    | `/api/bookmarks` |

---

## History

| Method | Endpoint       |
| ------ | -------------- |
| GET    | `/api/history` |

---

## Progress

| Method | Endpoint        |
| ------ | --------------- |
| GET    | `/api/progress` |

---

## Settings

| Method | Endpoint        |
| ------ | --------------- |
| GET    | `/api/settings` |
| PUT    | `/api/settings` |

---

# Environment Variables

| Variable                      | Required | Description               |
| ----------------------------- | -------- | ------------------------- |
| `MONGODB_URI`                 | Yes      | MongoDB Connection String |
| `MONGODB_DB_NAME`             | No       | Database Name             |
| `GEMINI_API_KEY`              | Yes      | Google Gemini API Key     |
| `JWT_SECRET_KEY`              | Yes      | Secret Key for JWT        |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | No       | JWT Expiry Time           |
| `MAX_UPLOAD_SIZE_MB`          | No       | Maximum Upload Size       |
| `DEBUG`                       | No       | Debug Mode                |

---

# Security

EduGenie follows secure backend development practices.

* Password hashing using bcrypt
* JWT-based authentication
* Protected API routes
* Environment variables for sensitive credentials
* User-scoped MongoDB queries
* Secure Authorization headers
* Configurable CORS settings

---

# Performance

* Fully asynchronous FastAPI backend
* Non-blocking MongoDB operations
* Optimized Gemini prompts
* Lightweight frontend
* Fast API response times
* Autosaving notes
* Modular architecture
* Clean API separation

---

# Deployment

## Backend

* Render
* Railway
* Fly.io
* VPS

## Frontend

* Vercel
* Netlify

## Database

* MongoDB Atlas

---

# Dependencies

```
fastapi
uvicorn
motor
pymongo
python-jose
passlib
bcrypt
google-generativeai
PyPDF2
python-docx
python-multipart
aiofiles
httpx
slowapi
pydantic
pydantic-settings
```

---

# Future Roadmap

* Voice-based AI Tutor
* AI Flashcards
* Collaborative Notes
* Classroom Mode
* Mobile Application
* AI Image Understanding
* PDF Annotation
* Study Planner
* Calendar Integration
* Multi-language Support
* Offline Mode
* Admin Dashboard

---

# Contributing

Contributions are welcome.

1. Fork the repository.
2. Create a new feature branch.
3. Commit your changes.
4. Push the branch.
5. Open a Pull Request.

Please follow consistent coding standards and include appropriate documentation with new features.

---

# License

This project is licensed under the MIT License.

Copyright © 2026 EduGenie.

---

# Author

**Terish Charan Tej Immidisetti**

B.Tech Computer Science and Engineering

SRM University AP

---

# Support

If you find this project useful, consider giving it a star on GitHub. Feedback, suggestions, and contributions are always welcome.
