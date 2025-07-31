# 💬 Messaging SaaS - Frontend

This is the frontend application for the [Messaging SaaS](https://github.com/celikhakan41/messaging-service) platform. It allows users to register, log in, manage their subscription plans, and interact via a real-time messaging system powered by WebSocket and Kafka.

## 🚀 Features

- 🌐 Built with React, Vite, and TailwindCSS
- 🔐 JWT-based authentication
- 💳 View current subscription plan (FREE / PREMIUM)
- ⚙️ Upgrade plan functionality
- 📈 Display daily message limit and usage
- 🔁 WebSocket integration for real-time messaging
- 📊 Kafka stream visualized using charts
- 🎯 Designed for SaaS usage with multi-tenant support

---

## 🖼️ Demo

🌍 [Live Demo (Coming soon via Vercel or Netlify)](https://your-frontend-demo-url.com)

> ⚠️ Note: Backend APIs may require an API key or JWT for access.

---

## ⚙️ Getting Started

### 1. Install dependencies:

```bash
npm install
```

### 2. Start development server:

```bash
npm run dev
```

By default, the app will run at: http://localhost:3000

Vite proxy setup redirects API calls to: http://localhost:8080

## 🔧 Backend Requirements

This frontend is designed to work with the private backend API available at:

👉 Messaging SaaS Backend (Private)

- Spring Boot + MongoDB + Kafka + WebSocket
- JWT & API Key authentication
- Plan-based feature restrictions
- Daily message limit enforcement

## 🧪 Test Scenarios

| Scenario | Description |
|----------|-------------|
| ✅ User registration and login | JWT token should be returned |
| ✅ Plan information display | Correct plan shown in PlanInfo page |
| ✅ Daily message counter visible | Tracked inside Chat.jsx |
| ✅ Upgrade from FREE to PREMIUM | Triggered via API |
| ✅ Limit breach warning | Enforced by backend |
| ✅ Kafka stream chart visualization | Updated in real time |

## 📁 Project Structure

```
messaging-service-frontend/
├── src/
│   ├── components/         # Login, Chat, PlanUpgrade, etc.
│   ├── pages/              # Dashboard, InvoicePage, PlanInfo
│   ├── services/           # Axios API calls
│   ├── assets/             # Images, icons
├── public/
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
└── README.md
```

## 📦 Tech Stack

- React 19
- Vite
- TailwindCSS
- Axios
- WebSocket API
- Recharts (for Kafka stream visualization)
- JWT (for authentication)

## 📝 License

This project is intended for testing and demo purposes. For commercial use, please contact the developer.

## 📬 Contact

📧 celikhakan41@yahoo.com

https://www.linkedin.com/in/muhammedhakancelik/