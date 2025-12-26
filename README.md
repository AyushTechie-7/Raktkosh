# 🩸 RaktKosh – Blood Bank & Donor Management System

RaktKosh is a full-stack **Blood Bank & Blood Donor Management System** designed to connect **blood donors, blood banks, hospitals, and patients** on a single platform. The system enables real-time blood availability tracking, donor management, and emergency blood requests to help save lives efficiently.

> **Tagline:** *Every Drop Counts*

---

## 🚀 Features

### 👤 User Roles

* **Blood Donor** – Register, manage profile, and receive donation requests
* **Blood Bank** – Manage blood inventory and handle blood requests
* **Hospital** – Request blood and manage patient needs
* **Administrator** – Full system control and monitoring

### 🧩 Core Functionalities

* User authentication (Register / Login)
* Role-based dashboards
* Blood group–wise search
* Location-based donor & blood bank search
* Emergency blood request system
* Blood inventory management
* Secure data handling
* Responsive & modern UI

---

## 🖥️ Tech Stack

### Frontend

* React (Vite)
* Tailwind CSS
* React Router
* Axios

### Backend

* Node.js
* Express.js
* MongoDB
* Mongoose
* JWT Authentication

---

## 📂 Project Structure

```
RaktKosh/
│
├── backend/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   ├── config/
│   ├── server.js
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── context/
│   │   └── App.jsx
│   ├── index.html
│   └── package.json
│
├── .gitignore
└── README.md
```

---

## ⚙️ Installation & Setup

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/AyushTechie-7/Raktkosh.git
cd Raktkosh
```

---

### 2️⃣ Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file inside `backend`:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
```

Run backend:

```bash
npm run dev
```

---

### 3️⃣ Frontend Setup

```bash
cd ../frontend
npm install
npm run dev
```

Frontend runs at:

```
http://localhost:5173
```

---

## 📸 Screens (Implemented)

* Home Page
* Find Blood
* Blood Inventory
* Login / Register
* About Us
* Contact Us
* Role-based Registration Forms

---

## 🎯 Use Case

* Helps hospitals quickly find required blood
* Enables donors to save lives efficiently
* Centralized management for blood banks
* Ideal for emergency situations

---

## 🔐 Security

* Password hashing
* JWT-based authentication
* Role-based access control
* Environment variables protected via `.env`

---

## 🎓 Academic Use

This project is suitable for:

* Mini Project / Major Project
* Full Stack Development Demo
* Hackathons
* Resume & Portfolio

---

## 👨‍💻 Author

**Ayush Choudhar**
GitHub: [https://github.com/AyushTechie-7](https://github.com/AyushTechie-7)

---

## ❤️ Acknowledgement

Inspired by the need for efficient blood management systems to save lives.

---

## 📜 License

This project is for educational purposes.

---

> *Together, we save lives. One donation at a time.* 🩸
