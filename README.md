# 🎓 GradeX - Student Grade Management System

GradeX is a professional full-stack MERN application designed to streamline student grade management, department organization, and academic results tracking. It features an intelligent admin-controlled Excel upload system with automated metadata extraction.

---

## 🚀 Tech Stack

### Backend
- **Node.js & Express.js**: High-performance server environment.
- **MongoDB & Mongoose**: Flexible NoSQL database with dynamic schema support.
- **JWT**: Secure JSON Web Token authentication.
- **Multer**: Efficient multi-part form data handling for file uploads.
- **XLSX**: Robust Excel parsing and generation.

### Frontend
- **React (Vite)**: Modern, fast frontend development.
- **Tailwind CSS v4**: Utility-first styling with "The Scholarly Ethereal" design system.
- **Axios**: Promised-based HTTP client for API communication.
- **React Router**: Declarative routing for single-page applications.

---

## ✨ Features

### 👨‍🏫 Admin Dashboard
- **Dynamic Configuration**: Customize departments (e.g., Electrical Engineering, Cybersecurity), grades, and sections on the fly.
- **Intelligent Excel Upload**: Bulk import student data with automatic mapping of subjects and scores.
- **Smart Metadata Extraction**: Automatically infers department, grade, and section from uploaded filenames.
- **Data Preview & Validation**: Review and adjust data before final confirmation.
- **Student Management**: Full CRUD operations for student records.
- **Secure Export**: Generate Excel credential sheets for students.

### 🎓 Student Portal
- **Secure Login**: Access results using system-generated credentials.
- **Personalized Dashboard**: View detailed subject scores, totals, and averages.
- **Support Messaging**: Direct communication channel with administration for inquiries.

---

## 📁 Project Structure

```text
GradeX/
├── backend/
│   ├── config/      # Database and system configuration
│   ├── controllers/ # Business logic for routes
│   ├── middleware/  # Authentication and security layers
│   ├── models/      # Mongoose schemas (Student, Settings, SupportMessage)
│   ├── routes/      # API endpoint definitions
│   ├── utils/       # Excel parser and helper functions
│   └── server.js    # Entry point
├── frontend/
│   ├── src/
│   │   ├── api/     # Axios instance configuration
│   │   ├── pages/   # Main application views
│   │   ├── hooks/   # Custom React hooks
│   │   └── App.jsx  # Main component and routing
│   └── vite.config.js
└── Design/          # Design prototypes and system documentation
```

---

## ⚙️ Installation & Setup

### 1. Clone the repository
```bash
git clone https://github.com/your-username/GradeX.git
cd GradeX
```

### 2. Backend Setup
```bash
cd backend
npm install
```
Create a `.env` file in the `backend` directory:
```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
```
Start the backend server:
```bash
npm run dev
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

---

## 🔐 Default Admin Access

To create the initial admin account, use the setup endpoint:
`POST /api/auth/create-admin` with a secure password.

Default Admin Credentials:
- **Username**: `admin`
- **Password**: `YourCreatedPassword`

---

## 📊 Excel Upload Format

For optimal parsing, ensure your Excel files include:
- **Column Headers**: Student Name (اسم الطالب), Subjects (e.g., Mathematics), and Total (optional).
- **Naming Convention**: Filenames like `Electrical_Grade1_SecA.xlsx` allow the system to automatically categorize the data.

---

## 🛠️ API Endpoints

### Auth
- `POST /api/auth/login`: Authenticate users.
- `GET /api/auth/profile`: Retrieve current user data.

### Admin
- `GET /api/admin/options`: Fetch dynamic grades/departments.
- `PUT /api/admin/options`: Update system settings.
- `POST /api/admin/upload-preview`: Parse Excel for review.
- `GET /api/admin/students`: Manage student database.

### Student
- `GET /api/student/me`: View authenticated student results.

---

## 👨‍💻 Project Software Management
**Abdulqadir Muhammad** (عبدالقادر محمد)

---

## 📜 License
This project is licensed under the ISC License.

---

## 🌍 Arabic Documentation / التوثيق بالعربية
For detailed documentation in Arabic, please refer to [DOCS_AR.md](./DOCS_AR.md).
للحصول على التوثيق التفصيلي باللغة العربية، يرجى الرجوع إلى ملف [DOCS_AR.md](./DOCS_AR.md).
