# Library Management System

Full-stack Library Management System built with **React.js**, **Node.js/Express**, and **MySQL**.

---

## Project Structure

```
library-management-system/
├── backend/
│   ├── src/
│   │   ├── config/         # MySQL connection pool
│   │   ├── controllers/    # Business logic (auth, books, members, issues, fines)
│   │   ├── middleware/     # JWT auth + role guard, error handler
│   │   ├── models/         # SQL query functions
│   │   └── routes/         # Express routers
│   ├── database/
│   │   ├── schema.sql      # All CREATE TABLE statements
│   │   └── seed.sql        # Sample data
│   ├── server.js
│   ├── .env.example
│   └── package.json
└── frontend/
    ├── src/
    │   ├── context/        # AuthContext (JWT + role)
    │   ├── pages/          # Dashboard, Books, Members, Issues, Fines, Login
    │   ├── components/     # Sidebar
    │   ├── services/       # Axios service functions per entity
    │   └── utils/
    ├── vite.config.js
    ├── .env.example
    └── package.json
```

---

## Prerequisites

- Node.js v18+
- MySQL 8.0+

---

## Setup — Step by Step

### 1. Database

```bash
mysql -u root -p
```

```sql
SOURCE backend/database/schema.sql;
SOURCE backend/database/seed.sql;
```

---

### 2. Backend

```bash
cd backend
cp .env.example .env
# Edit .env — set DB_PASSWORD and JWT_SECRET
npm install
npm run dev
# Server starts on http://localhost:5000
```

**Seed a real password for the Admin employee:**

```bash
node -e "const b=require('bcryptjs'); b.hash('password123',10).then(h=>console.log(h))"
# Copy the hash, then run:
mysql -u root -p library_db -e "UPDATE Employee SET Password_Hash='<paste_hash>' WHERE Employee_ID=1;"
```

---

### 3. Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
# App starts on http://localhost:5173
```

---

## API Routes

| Method | Endpoint | Role required | Description |
|--------|----------|---------------|-------------|
| POST | /api/auth/login | — | Login, get JWT |
| GET | /api/books | Any | List / search books |
| POST | /api/books | Admin, Librarian | Add book |
| PUT | /api/books/:id | Admin, Librarian | Update book |
| DELETE | /api/books/:id | Admin | Delete book |
| GET | /api/members | Any | List members |
| POST | /api/members | Any | Add member |
| GET | /api/issues | Any | List all issues |
| GET | /api/issues/overdue | Any | List overdue issues |
| POST | /api/issues | Any | Issue a book |
| PATCH | /api/issues/:id/return | Any | Return book + auto-fine |
| GET | /api/fines | Any | List all fines |
| GET | /api/fines/unpaid | Any | Unpaid fines |
| PATCH | /api/fines/:id/pay | Any | Mark fine as paid |

---

## Role Permissions

| Action | Clerk | Librarian | Admin |
|--------|-------|-----------|-------|
| View everything | ✅ | ✅ | ✅ |
| Add/edit books | ❌ | ✅ | ✅ |
| Delete books | ❌ | ❌ | ✅ |
| Issue / return books | ✅ | ✅ | ✅ |
| Add members | ✅ | ✅ | ✅ |
| Delete members | ❌ | ❌ | ✅ |
| Mark fines paid | ✅ | ✅ | ✅ |

---

## Fine Calculation

When a book is returned via `PATCH /api/issues/:id/return`:
- If `Return_Date > Due_Date` → fine is auto-created
- Rate: **₹5 per day** (configurable via `FINE_PER_DAY` in `issueController.js`)
- Fine row links to the Issue and Member for full traceability

---

## Environment Variables

**Backend `.env`**
```
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=library_db
JWT_SECRET=change_this_to_a_long_random_string
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

**Frontend `.env`**
```
VITE_API_BASE_URL=http://localhost:5000/api
```
