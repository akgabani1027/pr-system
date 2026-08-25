# PR System

A comprehensive full-stack application designed to streamline and manage Purchase Requisition (PR) workflows efficiently with role-based access control, multi-tier approvals, dynamic line-item calculation, document attachments, and real-time procurement analytics.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Backend Setup (FastAPI)](#backend-setup-fastapi)
  - [Frontend Setup (React + Vite)](#frontend-setup-react--vite)
- [Demo Credentials](#demo-credentials)
- [Environment Variables](#environment-variables)
- [API Documentation](#api-documentation)
- [Testing](#testing)
- [License](#license)

---

## Features

* **User Authentication & RBAC:** Secure login and token authorization with role-based permissions (`Admin`, `Manager`, `Employee`) using JWT and bcrypt.
* **Dashboard & Live Analytics:** Centralized overview of PR statuses, expenditure analytics, department procurement totals, and live activity streams.
* **Create & Manage PRs:** Intuitive forms for submitting new PRs, auto-calculating line items (`quantity * unit_price`), attaching quotes/receipts, and priority tagging.
* **Multi-Tier Approval Workflow:** 
  - **Employee:** Creates drafts and submits requisitions.
  - **Manager (Tier 1):** Reviews department requisitions with approval/rejection audit comments.
  - **Admin (Tier 2):** Grants final budget authorization, issues PO approvals, or requests revisions.
* **Search & MongoDB Query Filtering:** Filter and search across PR numbers, titles, departments, categories, priorities, price ranges, and workflow statuses.
* **Audit Trail & Discussion:** Full chronological history of actions, timestamps, notes, and approval decisions.

---

## Tech Stack

### Backend
* **Language:** Python 3.9+ (Python 3.14 compatible)
* **Framework:** FastAPI
* **Database:** MongoDB (via Motor async driver + PyMongo, with automatic fallback store)
* **Authentication:** JWT (JSON Web Tokens) with Python-Jose & Passlib / BCrypt
* **Testing:** Pytest & HTTPX AsyncClient

### Frontend
* **Framework:** React 18 (Vite SPA)
* **Styling:** Tailwind CSS
* **Icons:** Lucide React
* **HTTP Client:** Axios (with automatic Bearer token interceptor)
* **State Management:** React Context API (`AuthContext`)

---

## Getting Started

Follow these instructions to get the application up and running on your local machine for development and testing.

### Prerequisites

Ensure you have the following installed:
* [Python](https://www.python.org/downloads/) (v3.9 or higher)
* [Node.js](https://nodejs.org/) (v14 or higher)
* [MongoDB](https://www.mongodb.com/try/download/community) (Local MongoDB service or MongoDB Atlas cloud URI. If MongoDB is offline, the backend automatically uses its built-in JSON fallback engine.)

---

### Backend Setup (FastAPI)

1. Open a terminal and navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install Python dependencies:
   ```bash
   python -m pip install -r requirements.txt
   ```

3. Configure environment variables (optional, default values already set):
   ```bash
   copy .env.example .env
   ```

4. Start the backend development server:
   ```bash
   python run.py
   ```
   * The API server will be live at: `http://localhost:8000`
   * Interactive Swagger documentation at: `http://localhost:8000/docs`

---

### Frontend Setup (React + Vite)

1. Open a second terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install Node dependencies:
   ```bash
   npm install
   ```

3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   * The frontend application will be live at: `http://localhost:5173`

---

## Demo Credentials

The backend automatically seeds 3 pre-configured user accounts on first launch for testing different permission tiers. You can also use the **1-Click Demo Login** buttons on the login screen.

| Role | Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@prsystem.com` | `password123` | Final PO sign-off, full system analytics, user management |
| **Manager** | `manager@prsystem.com` | `password123` | Tier 1 department approval/rejection, spend monitoring |
| **Employee** | `employee@prsystem.com` | `password123` | Requisition creation, line item management, draft editing |

---

## Environment Variables

### Backend (`backend/.env`)

```env
SECRET_KEY=pr-system-super-secure-secret-key-2026-xyz-0987654321
MONGODB_URI=mongodb://localhost:27017
DATABASE_NAME=pr_system_db
USE_MOCK_DB_FALLBACK=true
```

---

## API Documentation

When the backend is running, explore the interactive OpenAPI (Swagger) interface at `http://localhost:8000/docs`.

### Key Endpoints

#### Authentication
- `POST /api/auth/register` - Create a new user account
- `POST /api/auth/login` - Authenticate and retrieve JWT token
- `GET /api/auth/me` - Get current authenticated user profile

#### Purchase Requisitions
- `POST /api/prs` - Create a new requisition or draft
- `GET /api/prs` - List requisitions with search, status, category, department, and amount filters
- `GET /api/prs/{id}` - Inspect requisition details, items, timeline, and audit logs
- `PUT /api/prs/{id}` - Update draft or submitted requisition
- `POST /api/prs/{id}/action` - Execute workflow transition (`submit`, `approve`, `reject`, `cancel`)
- `POST /api/prs/{id}/comments` - Add review notes / audit comments
- `POST /api/prs/{id}/attachments` - Upload supporting quotes and invoices
- `DELETE /api/prs/{id}` - Delete draft requisitions

#### Analytics & Users
- `GET /api/analytics/dashboard` - High-level metrics, department spend, and category breakdown
- `GET /api/users` - Directory of organization members and assigned roles

---

## Testing

Run the automated backend test suite using Pytest:

```bash
cd backend
python -m pytest -v tests/test_api.py
```

---

## License

This project is licensed under the MIT License.
