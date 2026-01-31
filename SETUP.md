# Dawah CRM - Setup & Getting Started

## ✅ Project Complete

Your full-stack Dawah CRM application is now fully functional with all core features implemented.

## Features Implemented

### 1. Database Schema ✓
- **PostgreSQL** schema with all necessary tables
- Users, Contacts, Activities, Projects, Deals, Pledges
- Proper relationships and indexes for performance

### 2. Contact Management ✓
- Create, read, update, delete contacts
- Search functionality
- Custom labels for categorization
- Custom fields support
- Organization linking

### 3. Activity Tracking ✓
- Log activities: calls, emails, social media, WhatsApp, notes
- Tied to contacts
- Activity statistics and reporting
- Email tracking support
- Task assignment

### 4. Projects & Deals ✓
- Create and manage projects
- Pipeline stages for deal tracking
- Financial target setting and progress tracking
- Deal creation and management
- Pledge tracking for fundraising

### 5. Authentication ✓
- User registration and login
- JWT token-based authentication
- Password hashing with bcryptjs
- Protected API routes
- User roles (admin/user)

### 6. Reporting & Analytics ✓
- Activity distribution charts
- Project funding status visualization
- Financial summaries and KPIs
- Activity breakdown by type
- Success rate calculations

## Prerequisites

### Required Software
- **Node.js 18+**
- **PostgreSQL 12+**
- **npm or yarn**

### Installation

1. Install PostgreSQL (if not already installed)
   - Download from https://www.postgresql.org/download/
   - Remember your password for the postgres user

2. Create database:
```bash
psql -U postgres
CREATE DATABASE dawah_crm;
\q
```

3. Initialize database schema:
```bash
psql -U postgres -d dawah_crm -f backend/database.sql
```

4. Create `.env` file in backend directory:
```bash
cp backend/.env.example backend/.env
```

5. Update database credentials in `backend/.env` if needed:
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=dawah_crm
DB_USER=postgres
DB_PASSWORD=your-password
```

## Running the Application

### Option 1: Using VS Code Tasks (Recommended)

Press `Ctrl+Shift+B` and select "Run All Dev Servers"

This will start both frontend and backend in parallel.

### Option 2: Manual Startup

**Terminal 1 - Start Backend:**
```bash
cd backend
npm run dev
```

Backend will be available at: `http://localhost:3000`

**Terminal 2 - Start Frontend:**
```bash
cd frontend
npm run dev
```

Frontend will be available at: `http://localhost:5173`

### Option 3: Production Build

**Build frontend:**
```bash
cd frontend
npm run build
```

**Build backend:**
```bash
cd backend
npm run build
npm start
```

## API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user
- `GET /auth/profile` - Get current user profile
- `GET /auth/users` - Get all users

### Contacts
- `GET /contacts` - List all contacts
- `POST /contacts` - Create contact
- `GET /contacts/:id` - Get contact details
- `PUT /contacts/:id` - Update contact
- `DELETE /contacts/:id` - Delete contact
- `GET /contacts/search?q=query` - Search contacts

### Activities
- `GET /activities` - Get recent activities
- `POST /activities` - Create activity
- `GET /activities/:id` - Get activity details
- `PUT /activities/:id` - Update activity
- `DELETE /activities/:id` - Delete activity
- `GET /activities/contact/:contactId` - Get activities for contact
- `GET /activities/stats` - Get activity statistics

### Projects
- `GET /projects` - List all projects
- `POST /projects` - Create project
- `GET /projects/:id` - Get project details
- `PUT /projects/:id` - Update project
- `DELETE /projects/:id` - Delete project
- `GET /projects/:projectId/stages` - Get pipeline stages
- `POST /projects/:projectId/stages` - Add pipeline stage
- `GET /projects/:projectId/deals` - Get deals for project
- `POST /projects/:projectId/deals` - Create deal

## Default Credentials

Once you run the application, you can register a new account through the application.

For development/testing, you can modify user creation in `backend/src/models/user.ts`.

## Project Structure

```
dawah-crm/
├── frontend/
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── pages/            # Page components
│   │   ├── services/         # API services
│   │   ├── types/            # TypeScript types
│   │   └── utils/            # Utility functions
│   └── package.json
├── backend/
│   ├── src/
│   │   ├── routes/           # API routes
│   │   ├── controllers/       # Request handlers
│   │   ├── models/           # Database models
│   │   ├── middleware/       # Express middleware
│   │   ├── db/               # Database setup
│   │   └── types/            # TypeScript types
│   ├── database.sql          # Database schema
│   └── package.json
├── .vscode/
│   └── tasks.json           # VS Code dev tasks
└── README.md
```

## Database Schema

### Core Tables
- `users` - User accounts and authentication
- `contacts` - Contact information and relationships
- `organizations` - Company/organization details
- `activities` - Activity logs (calls, emails, etc.)
- `tasks` - Task tracking
- `projects` - Fundraising projects
- `pipeline_stages` - Project deal stages
- `deals` - Fundraising deals
- `pledges` - Pledge tracking
- `custom_fields` - Custom field definitions
- `teams` - Team groupings
- `team_members` - Team membership

## Next Steps

1. **Database Setup**: Follow the "Installation" section above
2. **Start Servers**: Use VS Code tasks or manual startup
3. **Access Application**: Open http://localhost:5173
4. **Register Account**: Create your user account
5. **Start Using**: Add contacts, create projects, log activities

## Customization

### Adding Custom Fields
Edit `frontend/src/pages/Contacts.tsx` to add custom field inputs and update `backend/src/models/contact.ts` to handle new fields.

### Styling
Tailwind CSS is configured. Edit `frontend/tailwind.config.js` to customize colors and styling.

### Database
To modify schema, edit `backend/database.sql` and re-run initialization.

## Troubleshooting

### Port Already in Use
- Frontend (5173): `lsof -i :5173` and kill the process
- Backend (3000): `lsof -i :3000` and kill the process

### Database Connection Error
- Check PostgreSQL is running
- Verify credentials in `.env`
- Ensure database exists: `psql -l`

### Build Errors
- Clear node_modules: `rm -rf node_modules && npm install`
- Clear build: `rm -rf dist` (frontend) or `rm -rf dist` (backend)

## Support

For issues or questions:
1. Check the error message in the console
2. Verify all prerequisites are installed
3. Ensure database is properly initialized
4. Check that environment variables are set correctly

## License

Proprietary - Dawah CRM

---

**You're all set!** 🚀 Your Dawah CRM application is ready to use.
