# Dawah CRM - Database Setup Guide

## Quick Start

### Prerequisites
- PostgreSQL 12+ installed
- Node.js 16+

### 1. Install PostgreSQL

**Windows:**
1. Download from https://www.postgresql.org/download/windows/
2. Run installer
3. Note your password for `postgres` user
4. Keep default port 5432

**macOS:**
```bash
brew install postgresql@15
brew services start postgresql@15
```

**Linux (Ubuntu):**
```bash
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql
```

---

### 2. Create Database

**Windows (PowerShell):**
```powershell
# Connect to PostgreSQL
psql -U postgres

# In psql prompt, create database:
CREATE DATABASE dawah_crm;
\q
```

**macOS/Linux:**
```bash
psql -U postgres -c "CREATE DATABASE dawah_crm;"
```

---

### 3. Create .env File

Create a `.env` file in the backend folder:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=dawah_crm
DB_USER=postgres
DB_PASSWORD=your_postgres_password

# Server
PORT=3000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# JWT
JWT_SECRET=your-super-secret-key-change-in-production

# Email (Optional - for real email sending)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
FROM_EMAIL=noreply@dawahcrm.com
```

---

### 4. Initialize Database Schema

The schema will auto-initialize on first run. To manually run it:

**Windows (PowerShell):**
```powershell
cd backend
$env:DB_HOST="localhost"
$env:DB_PORT="5432"
$env:DB_NAME="dawah_crm"
$env:DB_USER="postgres"
$env:DB_PASSWORD="your_password"

psql -U postgres -d dawah_crm -f database.sql
```

**macOS/Linux:**
```bash
cd backend
PGPASSWORD=your_password psql -U postgres -d dawah_crm -f database.sql
```

---

### 5. Verify Connection

```bash
cd backend
npm run dev
```

You should see:
```
✅ Dawah CRM API running on port 3000
```

---

## Database Schema

The CRM uses these main tables:

| Table | Purpose |
|-------|---------|
| users | Team members & salespeople |
| contacts | Leads, prospects, customers |
| activities | Calls, emails, notes, meetings |
| comments | Internal conversation thread |
| email_logs | Email history with tracking |
| call_logs | Phone call records |
| schedules | Meetings & events |
| projects | Campaigns & initiatives |
| deals | Sales opportunities |
| teams | Team groups |

---

## Troubleshooting

**Connection Refused:**
- Verify PostgreSQL is running: `pg_isready -h localhost`
- Check credentials in .env
- Ensure port 5432 is not blocked by firewall

**Database Does Not Exist:**
```bash
psql -U postgres -c "CREATE DATABASE dawah_crm;"
```

**Permission Denied:**
- Verify DB_USER and DB_PASSWORD in .env
- Check user has CREATE TABLE permission

**Schema Not Applied:**
```bash
psql -U postgres -d dawah_crm -f backend/database.sql
```

---

## Next Steps

1. ✅ Install PostgreSQL
2. ✅ Create database
3. ✅ Configure .env
4. ✅ Run `npm run dev`
5. ✅ Access at http://localhost:3173
