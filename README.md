# E-Transit Transport Management System

## 🔗 Quick Access Links

### Frontend Application
**http://localhost:5173**

### Backend API Documentation (Swagger)
**https://localhost:5011/swagger**

### API Base URL
**https://localhost:5011/api**

Note: The database is external and managed outside this repository.

---

## 🚀 Quick Start
1. Run `start-all.bat` to start the backend API and frontend dev server
2. Use the links above to access the application
3. Run `stop-all.bat` to stop the backend and frontend processes

---

## 🛠 Backend Database Configuration

The backend API uses an external PostgreSQL database. Configure the connection via `.env` (recommended) or `appsettings.json`.

### Option 1: .env (recommended)
Create `backend/Api/.env` from `backend/Api/.env.example` and set values:

```
DB_HOST=
DB_PORT=5432
DB_NAME=
DB_USER=
DB_PASSWORD=
```

The API loads `.env` at startup and builds the connection string automatically. If `.env` is missing, it falls back to `appsettings.json`.

### Option 2: appsettings.json (fallback)
Set `ConnectionStrings.DefaultConnection` in `backend/Api/appsettings.json` to a valid Npgsql connection string.
