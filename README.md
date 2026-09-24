# 💬 QuickChat — Modern Real-Time Chat Platform

A full-stack, feature-rich real-time messaging application built with **React 19**, **Node.js**, **Express**, **MongoDB**, **Socket.IO**, **Zustand**, **Tailwind CSS v4**, and **DaisyUI**.

![QuickChat Banner](https://img.shields.io/badge/Stack-MERN%20%2B%20Socket.IO-cyan?style=for-the-badge)
![React 19](https://img.shields.io/badge/React-19.2-61DAFB?style=for-the-badge&logo=react)
![Node.js](https://img.shields.io/badge/Node.js-5FA04E?style=for-the-badge&logo=nodedotjs)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css)

---

## 🌟 Key Features

### ⚡ Real-Time Messaging & Sockets
* **Instant Messaging**: Low-latency bi-directional messaging using Socket.IO.
* **Typing Indicators**: Displays animated *"typing..."* indicators in real-time when contacts are typing.
* **Read Receipts**: Double checkmark icons (`✓✓`) that turn cyan when messages are read by the recipient.
* **Online Presence**: Real-time online/offline status indicators with live green badge updates.
* **Audio Notifications**: Sound effects for incoming messages and keyboard interactions (toggleable).

### 💬 Message Interactions
* **Emoji Picker & Reactions**: Interactive emoji selector overlay and real-time emoji reactions (👍, ❤️, 😂, 😮, 😢, 🔥) on message bubbles.
* **Quoted Replies**: Select any message to render a inline reply banner with parent message context.
* **Edit Sent Messages**: Edit previously sent messages with a real-time `(edited)` indicator update.
* **Delete Options**: Soft delete messages locally (*"Delete for me"*) or permanently for both parties (*"Delete for everyone"*).
* **Media Sharing**: Upload and share images integrated seamlessly with **Cloudinary**.

### 🔒 Authentication & Security
* **JWT Authentication**: Secure HttpOnly cookie-based JWT authentication.
* **Welcome Emails**: Automated welcome emails dispatched via **Resend** upon registration.
* **Arcjet Security**: Integrated bot protection and rate-limiting middleware powered by **Arcjet**.
* **Profile Management**: Instant avatar uploads and user details updates.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 19 + Vite 8
- **State Management**: Zustand v5
- **Styling**: Tailwind CSS v4 + DaisyUI v5
- **Icons**: Lucide React
- **Real-Time Client**: Socket.IO Client v4
- **HTTP Client**: Axios
- **Notifications**: React Hot Toast

### Backend
- **Runtime**: Node.js (ES Modules)
- **Framework**: Express.js v5
- **Database**: MongoDB with Mongoose ORM
- **WebSockets**: Socket.IO v4
- **Security & Bot Protection**: Arcjet
- **Media Cloud**: Cloudinary SDK
- **Email Service**: Resend
- **Authentication**: JSON Web Tokens (JWT) & bcryptjs

---

## 📁 Project Structure

```text
QUICKCHAT/
├── backend/
│   ├── src/
│   │   ├── controllers/         # Auth & Message request handlers
│   │   ├── emails/              # Resend templates & handlers
│   │   ├── lib/                 # DB, Socket, Cloudinary, Arcjet setup
│   │   ├── middlewares/         # JWT Auth, Socket Auth & Arcjet protection
│   │   ├── models/              # Mongoose schemas (User, Message)
│   │   ├── routes/              # Express API endpoints
│   │   └── server.js            # Express app entry point
│   ├── .env                     # Backend environment configuration
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/          # Chat UI components (Container, Header, Input, Lists)
│   │   ├── hooks/               # Custom hooks (Keyboard sound, etc.)
│   │   ├── lib/                 # Axios configuration
│   │   ├── pages/               # Auth (Login, SignUp) & Chat pages
│   │   ├── store/               # Zustand stores (useAuthStore, useChatStore)
│   │   ├── App.jsx              # Main React App & routes
│   │   └── index.css            # Tailwind & DaisyUI entry
│   ├── index.html
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── package.json
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
Make sure you have installed:
- [Node.js](https://nodejs.org/) (v18+ recommended)
- [MongoDB](https://www.mongodb.com/) (Local instance or MongoDB Atlas cluster)

---

### 1. Environment Setup

Create a `.env` file in the `backend/` directory:

```env
PORT=3000
NODE_ENV=development
MONGO_URL=your_mongodb_connection_string
JWT_SECRET=your_super_secret_jwt_key

CLIENT_URL=http://localhost:5173

# Resend Email Config (Optional)
RESEND_API_KEY=your_resend_api_key
EMAIL_FROM=onboarding@resend.dev
EMAIL_FROM_NAME=QuickChat

# Cloudinary Storage Config
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Arcjet Security Config (Optional in dev)
ARCJET_KEY=your_arcjet_key
ARCJET_ENV=development
```

---

### 2. Backend Installation & Run

```bash
cd backend
npm install
npm run dev
```
> Server runs on `http://localhost:3000`

---

### 3. Frontend Installation & Run

```bash
cd frontend
npm install
npm run dev
```
> Client runs on `http://localhost:5173`

---

## 🧪 Production Build

To build the frontend for production:

```bash
cd frontend
npm run build
```

To run the unified server in production mode:

```bash
cd backend
npm start
```

---

## 📄 License

This project is licensed under the [ISC License](LICENSE).

---

Made with ❤️ by Suraj Patil
