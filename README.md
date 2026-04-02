# 🚀 AI Resume Screener and Job Matcher

An intelligent, production-ready platform designed for recruiters and HR professionals to streamline the hiring process. Upload multiple resumes, match them against job descriptions, and get AI-powered rankings and insights in seconds.

## ✨ Features

- **📄 Multi-Format Support**: Upload resumes in PDF and DOCX formats.
- **🤖 AI-Powered Analysis**: Uses Google Gemini AI to analyze skills, experience, and cultural fit.
- **📊 Intelligent Ranking**: Automatically ranks candidates based on their match percentage with the job description.
- **🔐 Secure Authentication**: Firebase Authentication (Google Login & Email/Password).
- **☁️ Real-time Database**: Powered by Firestore for storing job postings and candidate data.
- **🎨 Modern UI**: Built with React, Tailwind CSS, and Framer Motion for a smooth, responsive experience.

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS, Framer Motion
- **Backend/Database**: Firebase (Auth & Firestore)
- **AI Engine**: Google Gemini API (`@google/genai`)
- **Parsing**: `pdfjs-dist` (PDF) and `mammoth` (DOCX)
- **Deployment**: Render (Static Site)

## 🚀 Getting Started

### 1. Clone the Repository
```bash
git clone https://github.com/Suneetha125/AI-Resume-Screener.git
cd AI-Resume-Screener
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Set Up Environment Variables
Create a `.env` file in the root directory and add your keys:
```env
VITE_GEMINI_API_KEY=your_gemini_api_key
# Firebase config is automatically loaded from firebase-applet-config.json
```

### 4. Run Locally
```bash
npm run dev
```
The app will be available at `http://localhost:3000`.

## 🌍 Deployment (Render)

This project is optimized for deployment on **Render**.

1. **Connect GitHub**: Connect your repository to Render.
2. **Build Command**: `npm install && npm run build`
3. **Publish Directory**: `dist`
4. **Environment Variables**: Add `GEMINI_API_KEY` in the Render dashboard.

## 🔥 Firebase Configuration

To ensure the app works in production, you must:
1. **Authorize Domain**: Add your Render URL (e.g., `ai-resume-screener-4b9w.onrender.com`) to the **Authorized Domains** list in the Firebase Console.
2. **Enable Auth Providers**: Enable **Google** and **Email/Password** in the Authentication tab.
3. **Firestore Rules**: Deploy the provided `firestore.rules` to your Firebase project.

## 📄 License

This project is licensed under the MIT License.

