# HYB — Help Your Buddy

**HYB** (Help Your Buddy) is a collaborative Q&A platform where users can ask questions and help each other through shared knowledge and community support. It’s built with a modern frontend and backend architecture to enable seamless interaction and knowledge exchange within a community.

## 🎯 Why HYB?
Many students struggle to find timely help for doubts, especially in peer groups.
HYB is built to encourage **buddy-based learning**, where anyone can ask questions
and others can help — creating a supportive, community-driven learning environment.

🔗 Live Demo: https://hyb-delta.vercel.app/ 

---

## 🚀 Features

- 💬 Ask and answer questions
- 📚 Community-driven knowledge sharing
- 👥 User authentication and profiles
- ⚡ Responsive frontend UI
- 📦 Structured backend APIs
- 🚀 Easily deployable

---

## 🧠 Tech Stack

| Part        | Technology                    |
|-------------|-------------------------------|
| Frontend    | React / Next.js (JavaScript/TypeScript) |
| Backend     | Node.js / Express             |
| Database    | MongoDB (or similar)          |
| Deployment  | Vercel / Heroku / Render     |
| Languages   | JavaScript, TypeScript, CSS   |

*Languages shown based on GitHub stats.* :contentReference[oaicite:4]{index=4}

---

## 📁 Project Structure

```bash
HYB/
├── frontend/        # React / Next.js application
├── backend/         # Express API server
├── .env.example     # Example environment variables
├── package.json
└── README.md



---

## 🛠 Setup — Development

### 🧾 Prerequisites

Make sure you have installed:

- Node.js (v16+)
- npm or yarn
- MongoDB (local or Atlas)

---

### 🔧 Clone Repository

```bash
git clone https://github.com/vagabondraj/HYB.git
cd HYB

📌 Backend Setup
cd backend
npm install


Create a .env file:

PORT=5000
MONGO_URI=your_mongo_connection_string
JWT_SECRET=your_jwt_secret


Start server:

npm run dev

📌 Frontend Setup
cd ../frontend
npm install


Create a .env file:

NEXT_PUBLIC_API_URL=http://localhost:5000


Start frontend:

npm run dev

## 📜 License

This project is licensed under the MIT License.

## 👤 Author

**Ravi Raj**  
GitHub: https://github.com/vagabondraj



