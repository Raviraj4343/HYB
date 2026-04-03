# 🚀 HYB — Help Your Buddy

![Frontend](https://img.shields.io/badge/Frontend-React-61DAFB?logo=react&logoColor=white)
![Build Tool](https://img.shields.io/badge/Build-Vite-646CFF?logo=vite&logoColor=white)
![Language](https://img.shields.io/badge/Language-TypeScript-3178C6?logo=typescript&logoColor=white)
![Backend](https://img.shields.io/badge/Backend-Node.js-339933?logo=node.js&logoColor=white)
![Framework](https://img.shields.io/badge/Framework-Express-000000?logo=express&logoColor=white)
![Database](https://img.shields.io/badge/Database-MongoDB-47A248?logo=mongodb&logoColor=white)
![Realtime](https://img.shields.io/badge/Realtime-Socket.IO-010101?logo=socket.io&logoColor=white)
![Styling](https://img.shields.io/badge/Styling-Tailwind_CSS-06B6D4?logo=tailwindcss&logoColor=white)
![UI](https://img.shields.io/badge/UI-shadcn/ui-000000?logo=shadcnui&logoColor=white)
![Authentication](https://img.shields.io/badge/Auth-JWT-black?logo=jsonwebtokens&logoColor=white)
![Media](https://img.shields.io/badge/Media-Cloudinary-3448C5?logo=cloudinary&logoColor=white)
![Cache](https://img.shields.io/badge/Cache-Redis-DC382D?logo=redis&logoColor=white)
![Testing](https://img.shields.io/badge/Testing-Vitest-6E9F18?logo=vitest&logoColor=white)
![Deployment](https://img.shields.io/badge/Frontend-Vercel-000000?logo=vercel&logoColor=white)
![Backend Hosting](https://img.shields.io/badge/Backend-Render-46E3B7?logo=render&logoColor=black)
![License](https://img.shields.io/badge/License-ISC-orange)

> HYB(Help Your Buddy) is a campus-focused platform that enables students to quickly request and offer help for academic, personal, or emotional needs within a trusted peer network. With real-time chat, notifications, and admin moderation, it ensures safe, fast, and meaningful support—turning student challenges into collaborative solutions.


---

## 🌐 Live Links
- 🔗 Frontend: https://hyb-theta.vercel.app/
- 🔗 Backend: https://hyb-nlut.onrender.com

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
