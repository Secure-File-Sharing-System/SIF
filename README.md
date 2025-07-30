Share-IT : Secure File Sharing System

A secure and scalable full-stack web application that allows users to upload, store, and share files through time-bound and optionally password-protected links. The platform supports file metadata tracking and includes an admin dashboard for managing uploaded content.

## Project Overview

This system is designed for internal organizational use, enabling teams to securely exchange files with controlled access. The application is built using modern technologies and follows a modular, component-based architecture for maintainability and future expansion.

## Features

- File upload with type and size validation
- Unique, expiring download links
- Optional password protection for shared files
- File metadata storage (name, size, type, upload timestamp)
- Download history and usage tracking
- Admin dashboard for managing uploads and monitoring usage
- JWT-based authentication system for admins

## Technology Stack

Frontend:
- React.js
- Vite
- TypeScript (TSX)
- Axios

Backend:
- Node.js
- Express
- Multer
- JWT
- CORS

Database:
- MongoDB (Mongoose)

Other Tools:
- Git & GitHub
- Figma (UI/UX design)
- Postman (API testing)
- Google Meet, WhatsApp (collaboration)

## Installation Instructions

### Clone the repository

```bash
git clone https://github.com/Secure-File-Sharing-System.git
cd Secure-File-Sharing-System
````

### Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the `backend` directory with the following content:

```
PORT=5000
MONGO_URI=mongodb://localhost:27017/secureFileDB
JWT_SECRET=your_jwt_secret_key
```

Start the backend server:

```bash
npm run dev
```

### Frontend Setup

```bash
cd ../frontend
npm install
npm run dev
```

The frontend will run at: [http://localhost:5173](http://localhost:5173)
The backend will run at: [http://localhost:5000](http://localhost:5000)

## Folder Structure

```
Secure-File-Sharing-System/
├── backend/
│   ├── controllers/
│   ├── routes/
│   ├── models/
│   ├── middleware/
│   ├── .env
│   └── server.js
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── App.tsx
│   └── vite.config.ts
└── README.md
```

## How It Works

1. Users upload files via the frontend interface.
2. Files are validated and stored securely on the server.
3. A unique, expiring download link is generated and returned to the user.
4. Optional password protection can be applied to the link.
5. Admin users can log in to a dedicated dashboard to view, manage, or delete uploaded files.
6. All actions are tracked and logged in the database for auditing and future enhancements.

## Contribution

This project is being developed by a team of four engineering students as part of a full-stack development initiative.

Team Members:

* Saakshat Chandratre – Backend Development Lead
* Nirmal Arsade – Front End and UI/UX Design

## License

This project is open-source and licensed under the MIT License.
