# Split AI - Voice-Driven Website Builder

Build websites by speaking. Transform your ideas into real websites using just your voice.

![Split AI](https://img.shields.io/badge/Split-AI-6366f1?style=for-the-badge)
![React](https://img.shields.io/badge/React-18-61dafb?style=flat-square&logo=react)
![FastAPI](https://img.shields.io/badge/FastAPI-0.109-009688?style=flat-square&logo=fastapi)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

## 🎯 Overview

Split AI is a voice-driven AI website builder that allows you to create static websites simply by describing what you want. Just speak your idea, and watch as the code is generated in real-time.

## ✨ Features

- 🎤 **Voice-First Interface** - No typing required, just speak
- ⚡ **Real-Time Code Generation** - Watch code appear as you speak
- 👁️ **Live Preview** - Instantly preview your generated website
- 🎨 **Multiple Templates** - Marketing, Portfolio, Landing pages
- 📁 **IDE-Like Workspace** - File explorer, code editor, and more

## 🏗️ Tech Stack

### Frontend
- React 18 + Vite
- JavaScript (ES6+)
- Web Speech API
- CSS3 with CSS Variables

### Backend
- Python 3.8+
- FastAPI
- Server-Sent Events (SSE)
- Async/Await

## 📁 Project Structure

```
split/
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── pages/
│       │   ├── Landing.jsx
│       │   └── Workspace.jsx
│       ├── components/
│       │   ├── VoiceAgent.jsx
│       │   ├── CodeEditor.jsx
│       │   └── FileExplorer.jsx
│       └── styles/
│           └── app.css
│
└── backend/
    ├── main.py
    ├── requirements.txt
    ├── generators/
    │   └── mvp_generator.py
    └── preview/
        └── server.py
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Python 3.8+
- Modern browser with Web Speech API support (Chrome recommended)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/split-ai.git
   cd split-ai
   ```

2. **Setup Backend**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

3. **Setup Frontend**
   ```bash
   cd frontend
   npm install
   ```

### Running the Application

1. **Start the Backend** (Terminal 1)
   ```bash
   cd backend
   python main.py
   ```
   Backend runs on http://localhost:8000

2. **Start the Frontend** (Terminal 2)
   ```bash
   cd frontend
   npm run dev
   ```
   Frontend runs on http://localhost:3000

3. **Open your browser** and navigate to http://localhost:3000

## 🎙️ How to Use

1. Click **"Get Started"** on the landing page
2. In the workspace, click the **microphone button**
3. Speak your website idea (e.g., "Create a marketing website for my college")
4. Watch the code generate in real-time
5. Click **"Launch Project"** to preview your website

## 📝 Example Prompts

- "Create a marketing website for my college"
- "Build a portfolio site for a photographer"
- "Make a landing page for my startup app"
- "Design a business website for a restaurant"

## 🔧 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Health check |
| `/api/generate` | POST | Generate website from transcript (SSE) |
| `/api/preview/launch` | POST | Launch preview server |
| `/api/preview/stop` | POST | Stop preview server |

## 🛠️ Development

### Frontend Development
```bash
cd frontend
npm run dev    # Start development server
npm run build  # Build for production
```

### Backend Development
```bash
cd backend
uvicorn main:app --reload --port 8000
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Web Speech API for voice recognition
- FastAPI for the blazing-fast backend
- React + Vite for the modern frontend

---

Made with ❤️ by the Split AI Team
