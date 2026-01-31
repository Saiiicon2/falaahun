# Dawah CRM - Complete Customer Relationship Management System

A comprehensive, production-ready CRM system built specifically for Dawah organizations. Built with React, TypeScript, Node.js, and PostgreSQL.

## 🚀 Current Status: FULLY FUNCTIONAL

✅ All core features implemented and running
- **Frontend**: Running on http://localhost:5173
- **Backend**: Running on http://localhost:3000
- **Database**: Ready for PostgreSQL (or use development mode)

## 📋 Features Implemented

### 1. **Contact Management** ✅
- Create, read, update, delete contacts
- Full-text search by name, email, or phone
- Custom labels for categorization
- Custom fields support
- Bulk import ready
- Contact relationships (link related contacts)

### 2. **Activity Tracking** ✅
- Log multiple activity types: Calls, Emails, Social Media, WhatsApp, Notes
- Tie activities to contacts
- Email tracking (open/click tracking ready)
- Activity statistics and reporting
- Recent activity feed on dashboard
- Task assignment and tracking

### 3. **Projects & Deals** ✅
- Create fundraising projects
- Multi-stage pipeline management
- Deal creation and tracking
- Financial target setting
- Real-time progress visualization
- Status tracking (active/completed/archived)
- Pledge management for donors

### 4. **Financial Tracking** ✅
- Budget target setting per project
- Real-time fundraising progress
- Total raised vs. target visualization
- Success rate calculation
- Project-by-project financial summary
- Remaining amount tracking

### 5. **Authentication & Security** ✅
- User registration and login
- JWT token-based authentication
- Password hashing with bcryptjs
- Protected API routes
- Role-based access control (Admin/User)
- Secure token management

### 6. **Reporting & Analytics** ✅
- Activity distribution pie charts
- Project funding bar charts
- Financial KPIs dashboard
- Activity breakdown by type
- Project performance metrics
- Success rate visualization
- Team activity tracking

### 7. **Team Collaboration** ✅
- Multi-user support
- Activity attribution to team members
- Team views of shared contacts
- Shared project visibility
- Real-time activity updates

## 🛠 Tech Stack

### Frontend
- **React 18** - Modern UI library
- **TypeScript** - Type-safe JavaScript
- **Vite** - Lightning-fast build tool
- **Tailwind CSS** - Utility-first styling
- **Recharts** - Beautiful data visualization
- **Axios** - HTTP client
- **React Router** - Client-side navigation
- **Lucide React** - Modern icon library

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **TypeScript** - Type-safe backend
- **PostgreSQL** - Relational database
- **JWT** - Token authentication
- **bcryptjs** - Password hashing
- **CORS** - Cross-origin requests

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 12+ (optional, app works without DB for testing)
- npm or yarn

### Quick Start (No Database Setup)

1. **Backend is already running on port 3000**
   ```bash
   # Terminal 1 - Already started
   cd c:\Users\ahmed\Downloads\DAWAHcrm\backend
   npm run dev
   ```

2. **Frontend is already running on port 5173**
   ```bash
   # Terminal 2 - Already started
   cd c:\Users\ahmed\Downloads\DAWAHcrm\frontend
   npm run dev
   ```

### With PostgreSQL Setup

1. **Install PostgreSQL**
   - Download from https://www.postgresql.org/download/
   - Install with default settings (remember the postgres password)

2. **Create Database**
   ```bash
   psql -U postgres
   CREATE DATABASE dawah_crm;
   \q
   ```

3. **Update `.env` file** (backend/.env)
   ```
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=dawah_crm
   DB_USER=postgres
   DB_PASSWORD=your-password
   ```

4. **Restart Backend**
   - The database will auto-initialize on startup

## 📱 Application Usage

### Dashboard
- Overview of key metrics
- Total contacts, active projects, revenue raised
- Recent activities feed
- Quick action buttons

### Contacts Page
- View all contacts with pagination
- Search functionality
- Add new contacts with custom fields
- Edit/delete contacts
- Filter by labels
- Contact details view

### Projects Page
- Create new fundraising projects
- View project progress with visual progress bars
- See funding status (raised vs. target)
- Track project status (active/completed)
- Manage pipeline stages
- Create and track deals

### Reports Page
- Activity distribution pie chart
- Project funding status bar chart
- Financial KPIs and metrics
- Activity breakdown by type
- Project performance summary
- Success rate calculations

## 🔌 API Endpoints

### Authentication
```
POST   /auth/register     - Register new user
POST   /auth/login        - Login user
GET    /auth/profile      - Get current user
GET    /auth/users        - List all users
```

### Contacts
```
GET    /contacts                 - List all contacts
POST   /contacts                 - Create contact
GET    /contacts/:id             - Get contact details
PUT    /contacts/:id             - Update contact
DELETE /contacts/:id             - Delete contact
GET    /contacts/search?q=query  - Search contacts
```

### Activities
```
GET    /activities                   - Get recent activities
POST   /activities                   - Create activity
GET    /activities/:id               - Get activity details
PUT    /activities/:id               - Update activity
DELETE /activities/:id               - Delete activity
GET    /activities/contact/:contactId - Get contact activities
GET    /activities/stats             - Get activity statistics
```

### Projects
```
GET    /projects                      - List projects
POST   /projects                      - Create project
GET    /projects/:id                  - Get project details
PUT    /projects/:id                  - Update project
DELETE /projects/:id                  - Delete project
GET    /projects/:projectId/stages    - Get pipeline stages
POST   /projects/:projectId/stages    - Add stage
GET    /projects/:projectId/deals     - Get deals
POST   /projects/:projectId/deals     - Create deal
```

## 📊 Database Schema

### Core Tables
- **users** - User accounts and authentication
- **contacts** - Contact information and relationships
- **organizations** - Company/organization info
- **activities** - Activity logs and history
- **projects** - Fundraising projects
- **pipeline_stages** - Project deal stages
- **deals** - Individual deals and pledges
- **pledges** - Pledge tracking for donors
- **custom_fields** - Custom field definitions
- **teams** - Team groupings
- **team_members** - Team membership

## 🎨 Customization

### Color Scheme
Edit `frontend/tailwind.config.js`:
```javascript
theme: {
  extend: {
    colors: {
      brand: {
        // Custom colors here
      }
    }
  }
}
```

### Add Custom Fields
Edit `frontend/src/pages/Contacts.tsx` and `backend/src/models/contact.ts`

### Change API Base URL
Edit `frontend/src/services/api.ts`:
```typescript
const API_URL = 'your-api-url'
```

## 🔒 Security Features

- ✅ JWT authentication
- ✅ Password hashing (bcryptjs)
- ✅ Protected routes
- ✅ CORS configuration
- ✅ Input validation
- ✅ SQL injection protection (via parameterized queries)
- ✅ Role-based access control

## 📈 Performance Optimizations

- Code splitting with Vite
- Lazy loading of routes
- Optimized database queries with indexes
- Responsive design for mobile
- Efficient state management
- Bundle size optimization

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Frontend port 5173
lsof -i :5173
kill -9 <PID>

# Backend port 3000
lsof -i :3000
kill -9 <PID>
```

### Database Connection Failed
- Ensure PostgreSQL is running
- Check credentials in `.env`
- Verify database exists
- Check firewall settings

### Build Errors
```bash
# Clear dependencies
rm -rf node_modules
npm install

# Clear build files
rm -rf dist
npm run build
```

## 📚 Project Structure

```
dawah-crm/
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   ├── types/          # TypeScript types
│   │   └── utils/          # Utilities
│   ├── index.html
│   ├── package.json
│   └── vite.config.ts
├── backend/
│   ├── src/
│   │   ├── controllers/    # API handlers
│   │   ├── models/         # Database models
│   │   ├── routes/         # API routes
│   │   ├── middleware/     # Express middleware
│   │   ├── db/             # Database setup
│   │   ├── types/          # TypeScript types
│   │   └── index.ts        # Server entry
│   ├── database.sql        # SQL schema
│   ├── package.json
│   └── tsconfig.json
├── .vscode/
│   ├── tasks.json          # VS Code tasks
│   └── settings.json       # VS Code settings
├── .github/
│   └── copilot-instructions.md
├── SETUP.md                # Setup guide
└── README.md               # This file
```

## 🚀 Deployment

### Frontend (Production Build)
```bash
cd frontend
npm run build
# Output: dist/ folder ready for hosting
```

### Backend (Production)
```bash
cd backend
npm run build
npm start
# Or use: NODE_ENV=production npm start
```

### Hosting Options
- **Frontend**: Vercel, Netlify, AWS S3 + CloudFront
- **Backend**: Heroku, Railway, DigitalOcean, AWS EC2
- **Database**: AWS RDS, PostgreSQL Cloud, Heroku Postgres

## 📝 Development Notes

### Adding New Features
1. Create API endpoint in `backend/src/routes/`
2. Create controller in `backend/src/controllers/`
3. Update model in `backend/src/models/`
4. Create service in `frontend/src/services/`
5. Build UI component in `frontend/src/components/` or `pages/`

### Database Migrations
1. Edit `backend/database.sql`
2. Run SQL on database
3. Update models and controllers

### Testing
```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

## 📞 Support & Documentation

- Database schema: See `backend/database.sql`
- API documentation: See API Endpoints section above
- Setup guide: See `SETUP.md`
- Copilot instructions: See `.github/copilot-instructions.md`

## 📄 License

Proprietary - Dawah CRM

---

## 🎉 Ready to Use!

Your Dawah CRM application is fully functional and running. 

**Access the application:**
- 🌐 Frontend: http://localhost:5173
- 🔌 API: http://localhost:3000
- 📊 API Health: http://localhost:3000/health

**Next Steps:**
1. Register a new account in the application
2. Add your first contact
3. Create a project
4. Log some activities
5. View reports and analytics

Happy managing! 🚀
