# 🚀 HYB — Help Your Buddy

> A community-driven platform where students can request help and support each other during critical situations.

---

## 🌐 Live Links
- 🔗 Frontend: https://hyb-theta.vercel.app/
- 🔗 Backend: (add your backend URL here)

---

## 📌 Features

- 🆘 Create and respond to help requests  
- 💬 One-to-one real-time chat system  
- 👤 User profiles with role-based access  
- 🛡️ Admin moderation (block/unblock users)  
- 🚨 Report system for misuse   
- ⚡ Real-time updates using Socket.IO  

---

## 🛠️ Tech Stack

### 🔹 Backend
- Node.js
- Express.js
- MongoDB + Mongoose
- Socket.IO

### 🔹 Frontend
- React (Vite)
- Tailwind CSS
- shadcn/ui + Radix UI

---

## 📁 Project Structure
HYB/
│
├── backend/
│ ├── src/controllers
│ ├── src/models
│ ├── src/routes
│ └── app.js
│
├── frontend/
│ ├── src/pages
│ ├── src/components
│ ├── src/hooks
│ └── axios.ts


---

## ⚙️ Environment Variables

### Backend `.env`

PORT=8000

MONGO_URI=your_mongodb_uri

ACCESS_TOKEN_SECRET=your_secret

ACCESS_TOKEN_EXPIRY=1d

REFRESH_TOKEN_SECRET=your_secret

REFRESH_TOKEN_EXPIRY=7d

CLOUDINARY_CLOUD_NAME=

CLOUDINARY_API_KEY=

CLOUDINARY_API_SECRET=


### Frontend `.env`

VITE_API_URL=http://localhost:8000/api/v1



---

## 🚀 Run Locally

### 🔹 Backend

```bash
cd backend
npm install
npm run dev

cd frontend
npm install
npm run dev

response
🛡️ Admin Features
Block / Unblock users
Moderate reported content

🧠 Key Highlights
🔐 Role-based authentication system
⚡ Optimized backend architecture
🎯 Clean and responsive UI

🧪 Testing
cd frontend
npm run test

📄 License

ISC License

👨‍💻 Author

Ravi Raj

BTech CSE @ BIT Mesra
Backend + Full Stack Developer
⭐ Support

If you like this project, give it a ⭐ on GitHub!
