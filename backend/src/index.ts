import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import initializeDatabase from './db/init'
import contactRoutes from './routes/contacts'
import activityRoutes from './routes/activities'
import projectRoutes from './routes/projects'
import authRoutes from './routes/auth'
import commentRoutes from './routes/comments'
import emailRoutes from './routes/emails'
import callLogRoutes from './routes/callLogs'
import scheduleRoutes from './routes/schedules'
import integrationRoutes from './routes/integrations'
import organizationRoutes from './routes/organizations'
import { syncService } from './services/syncService'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000

// Middleware
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://falaahun-1.onrender.com',
    process.env.CLIENT_URL
  ].filter(Boolean),
  credentials: true
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Static files for uploads
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')))

// Routes
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date() })
})

// API Routes
app.use('/auth', authRoutes)
app.use('/contacts', contactRoutes)
app.use('/activities', activityRoutes)
app.use('/projects', projectRoutes)
app.use('/comments', commentRoutes)
app.use('/emails', emailRoutes)
app.use('/callLogs', callLogRoutes)
app.use('/schedules', scheduleRoutes)
app.use('/integrations', integrationRoutes)
app.use('/organizations', organizationRoutes)

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack)
  res.status(500).json({ success: false, error: 'Internal server error' })
})

// Initialize database and start server
initializeDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`✅ Dawah CRM API running on port ${PORT}`)
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`)
      console.log(`🔗 Frontend URL: ${process.env.CLIENT_URL || 'http://localhost:5173'}`)
    })
  })
  .catch((error) => {
    console.log('⚠️  Starting server despite initialization warning')
    app.listen(PORT, () => {
      console.log(`✅ Dawah CRM API running on port ${PORT}`)
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`)
      console.log(`🔗 Frontend URL: ${process.env.CLIENT_URL || 'http://localhost:5173'}`)
      console.log('⚠️  Note: Database features require PostgreSQL to be set up')
    })
  })
