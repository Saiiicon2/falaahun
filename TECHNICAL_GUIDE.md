# Technical Implementation Guide

## Architecture Overview

### Directory Structure
```
backend/
├── src/
│   ├── controllers/
│   │   ├── callLog.ts          [NEW] Call logging controller
│   │   ├── schedule.ts         [NEW] Schedule/event controller
│   │   └── ...
│   ├── models/
│   │   ├── callLog.ts          [NEW] Call logging data model
│   │   ├── schedule.ts         [NEW] Schedule data model
│   │   └── ...
│   ├── routes/
│   │   ├── callLogs.ts         [NEW] Call logging routes
│   │   ├── schedules.ts        [NEW] Schedule routes
│   │   └── ...
│   └── index.ts                [MODIFIED] Added new route imports
│
frontend/
├── src/
│   ├── services/
│   │   └── api.ts              [MODIFIED] Added call log and schedule services
│   └── pages/
│       └── ContactDetail.tsx    [ENHANCED] Added Calls and Schedules tabs
│
├── DATABASE_SETUP.md           [NEW] PostgreSQL installation guide
├── IMPLEMENTATION_SUMMARY.md   [NEW] Feature summary
└── FEATURE_GUIDE.md           [NEW] User guide
```

## Backend Implementation

### Call Logging System

#### Model: `backend/src/models/callLog.ts`
```typescript
interface CallLog {
  id: string                    // UUID
  contact_id: string           // Foreign key to contacts
  duration: number             // Minutes (0-999)
  direction: 'inbound' | 'outbound'
  status: 'completed' | 'missed' | 'voicemail'
  notes: string
  call_date: Date
  logged_by: string            // User ID
  recording_url?: string
  created_at: Date
  updated_at: Date
}
```

**Methods:**
- `getByContact(contactId, limit)` - Retrieve calls for a contact
- `create(data)` - Create new call log
- `getById(id)` - Get specific call
- `update(id, data)` - Update call details

**Features:**
- Mock storage array fallback for development
- Automatic timestamp management
- Database pooling for PostgreSQL
- Error handling with graceful degradation

#### Controller: `backend/src/controllers/callLog.ts`
```typescript
getContactCallLogs(req, res)   // GET /callLogs/contact/:contactId
logCall(req, res)              // POST /callLogs/contact/:contactId
updateCallLog(req, res)        // PUT /callLogs/:id
getCallLog(req, res)           // GET /callLogs/:id
```

**Validation:**
- Required fields: direction, status
- Optional fields: duration, notes
- Duration must be non-negative integer
- Direction must be 'inbound' or 'outbound'

#### Routes: `backend/src/routes/callLogs.ts`
```
GET  /callLogs/contact/:contactId   - Get call history
POST /callLogs/contact/:contactId   - Log new call
GET  /callLogs/:id                  - Get specific call
PUT  /callLogs/:id                  - Update call
```

All routes protected by `authMiddleware` requiring valid JWT token.

### Schedule Management System

#### Model: `backend/src/models/schedule.ts`
```typescript
interface Schedule {
  id: string                                    // UUID
  contact_id: string                          // Foreign key
  project_id?: string                         // Optional project link
  title: string
  description: string
  event_type: 'meeting' | 'call' | 'email' | 'task' | 'demo'
  start_time: Date
  end_time: Date
  location: string
  attendees: string[]
  assigned_to: string                         // User ID
  status: 'scheduled' | 'completed' | 'cancelled'
  created_by: string                          // User ID
  created_at: Date
  updated_at: Date
}
```

**Methods:**
- `getByContact(contactId)` - Get all events for contact
- `getUpcoming(limit)` - Get next N upcoming events
- `create(data)` - Create new event
- `getById(id)` - Get specific event
- `update(id, data)` - Update event
- `cancel(id)` - Mark event as cancelled

**Features:**
- Automatic status: 'scheduled' on creation
- Upcoming events filtering (start_time >= NOW)
- User join queries for author names
- Mock storage fallback

#### Controller: `backend/src/controllers/schedule.ts`
```typescript
getContactSchedules(req, res)   // GET /schedules/contact/:contactId
getUpcomingSchedules(req, res)  // GET /schedules/upcoming/list
createSchedule(req, res)        // POST /schedules/contact/:contactId
updateSchedule(req, res)        // PUT /schedules/:id
cancelSchedule(req, res)        // DELETE /schedules/:id/cancel
getSchedule(req, res)           // GET /schedules/:id
```

**Validation:**
- Required fields: title, eventType, startTime
- Optional fields: description, location, attendees, projectId, assignedTo
- startTime must be valid ISO datetime
- endTime defaults to startTime if not provided

#### Routes: `backend/src/routes/schedules.ts`
```
GET    /schedules/upcoming/list      - Get dashboard upcoming events
GET    /schedules/contact/:contactId - Get contact's schedules
POST   /schedules/contact/:contactId - Create schedule
GET    /schedules/:id                - Get specific schedule
PUT    /schedules/:id                - Update schedule
DELETE /schedules/:id/cancel         - Cancel schedule
```

### Database Schema

#### call_logs Table
```sql
CREATE TABLE call_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  duration INTEGER DEFAULT 0,
  direction VARCHAR(20) CHECK (direction IN ('inbound', 'outbound')),
  status VARCHAR(20) CHECK (status IN ('completed', 'missed', 'voicemail')),
  notes TEXT,
  call_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  logged_by UUID REFERENCES users(id),
  recording_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_call_logs_contact_id ON call_logs(contact_id);
CREATE INDEX idx_call_logs_call_date ON call_logs(call_date DESC);
```

#### schedules Table
```sql
CREATE TABLE schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  event_type VARCHAR(50) CHECK (event_type IN ('meeting', 'call', 'email', 'task', 'demo')),
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP,
  location VARCHAR(255),
  attendees TEXT[],
  assigned_to UUID REFERENCES users(id),
  status VARCHAR(50) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_schedules_contact_id ON schedules(contact_id);
CREATE INDEX idx_schedules_start_time ON schedules(start_time ASC);
CREATE INDEX idx_schedules_assigned_to ON schedules(assigned_to);
```

## Frontend Implementation

### Services: `frontend/src/services/api.ts`

#### Call Log Service
```typescript
export const callLogService = {
  getByContact: (contactId: string) =>
    api.get(`/callLogs/contact/${contactId}`),
  
  create: (contactId: string, data: any) =>
    api.post(`/callLogs/contact/${contactId}`, data),
  
  update: (id: string, data: any) =>
    api.put(`/callLogs/${id}`, data),
  
  getOne: (id: string) =>
    api.get(`/callLogs/${id}`)
}
```

#### Schedule Service
```typescript
export const scheduleService = {
  getByContact: (contactId: string) =>
    api.get(`/schedules/contact/${contactId}`),
  
  getUpcoming: (limit = 20) =>
    api.get('/schedules/upcoming/list', { params: { limit } }),
  
  create: (contactId: string, data: any) =>
    api.post(`/schedules/contact/${contactId}`, data),
  
  update: (id: string, data: any) =>
    api.put(`/schedules/${id}`, data),
  
  cancel: (id: string) =>
    api.delete(`/schedules/${id}/cancel`),
  
  getOne: (id: string) =>
    api.get(`/schedules/${id}`)
}
```

### Components: `frontend/src/pages/ContactDetail.tsx`

#### New Tabs
1. **Calls Tab**
   - Form to log new calls (duration, direction, status, notes)
   - Call history list with display fields
   - Status badges with color coding
   - Direction indicators (inbound/outbound)

2. **Schedules Tab**
   - Form to create events (title, type, date/time, description)
   - Event list with timeline display
   - Status badges
   - Calendar icon indicators

#### State Management
```typescript
const [callLogs, setCallLogs] = useState<any[]>([])
const [schedules, setSchedules] = useState<any[]>([])
const [showCallForm, setShowCallForm] = useState(false)
const [showScheduleForm, setShowScheduleForm] = useState(false)
const [callForm, setCallForm] = useState({ 
  duration: '', 
  direction: 'inbound', 
  status: 'completed', 
  notes: '' 
})
const [scheduleForm, setScheduleForm] = useState({ 
  title: '', 
  eventType: 'meeting', 
  startTime: '', 
  description: '' 
})
```

#### Form Handlers
```typescript
handleLogCall(e)         // Submit call form
handleCreateSchedule(e)  // Submit schedule form
```

## Data Flow

### Call Logging Flow
```
User fills form
    ↓
handleLogCall validates
    ↓
callLogService.create sends POST request
    ↓
Backend callLogController validates
    ↓
callLogModel.create inserts to DB/mock storage
    ↓
Response with created call
    ↓
UI updates call history list
    ↓
Form clears and closes
```

### Schedule Creation Flow
```
User fills form
    ↓
handleCreateSchedule validates
    ↓
scheduleService.create sends POST request
    ↓
Backend scheduleController validates
    ↓
scheduleModel.create inserts to DB/mock storage
    ↓
Response with created schedule
    ↓
UI updates schedule list
    ↓
Form clears and closes
```

## Error Handling

### Backend Error Responses
```typescript
// 400 - Validation error
{ success: false, error: "title, eventType, and startTime are required" }

// 404 - Not found
{ success: false, error: "Call log not found" }

// 500 - Server error
{ success: false, error: "Internal server error" }
```

### Frontend Error Handling
```typescript
try {
  const response = await callLogService.create(contactId, data)
} catch (error: any) {
  console.error('Error logging call:', error)
  // Show user-friendly error message
}
```

## Testing

### Unit Test Examples

#### Call Log Model Test
```typescript
test('should create call log', async () => {
  const callLog = await callLogModel.create({
    contactId: 'test-contact',
    duration: 15,
    direction: 'outbound',
    status: 'completed',
    notes: 'Test call',
    callDate: new Date(),
    loggedBy: 'test-user'
  })
  
  expect(callLog.id).toBeDefined()
  expect(callLog.duration).toBe(15)
  expect(callLog.direction).toBe('outbound')
})
```

#### Schedule Model Test
```typescript
test('should get upcoming schedules', async () => {
  const upcoming = await scheduleModel.getUpcoming(10)
  
  expect(Array.isArray(upcoming)).toBe(true)
  if (upcoming.length > 0) {
    expect(new Date(upcoming[0].start_time) >= new Date()).toBe(true)
  }
})
```

### Integration Test Examples

#### Call Log Endpoint Test
```typescript
test('POST /callLogs/contact/:contactId', async () => {
  const response = await request(app)
    .post('/callLogs/contact/test-contact')
    .set('Authorization', `Bearer ${token}`)
    .send({
      duration: 20,
      direction: 'inbound',
      status: 'completed',
      notes: 'Follow-up call'
    })
  
  expect(response.status).toBe(201)
  expect(response.body.data.id).toBeDefined()
})
```

## Performance Considerations

1. **Database Indexes**
   - call_logs.contact_id for quick lookups
   - call_logs.call_date for sorting
   - schedules.contact_id for quick lookups
   - schedules.start_time for upcoming events

2. **Query Optimization**
   - Limit results with pagination (callLogService accepts limit)
   - Use indexed fields in WHERE clauses
   - Join users table only when needed

3. **Frontend Optimization**
   - Lazy load call logs and schedules
   - Pagination for large contact histories
   - Memoize expensive computations

## Security Considerations

1. **Authentication**
   - All endpoints protected by JWT middleware
   - User ID extracted from token context
   - Automatic user ID assignment prevents spoofing

2. **Authorization**
   - Users can only see contacts they have access to
   - Can be extended with role-based access control

3. **Input Validation**
   - Backend validates all required fields
   - Type checking with TypeScript
   - Database constraints (ENUM, CHECK, FK)

4. **SQL Injection Prevention**
   - Parameterized queries using prepared statements
   - No string concatenation in SQL

## Deployment Checklist

- [ ] Set environment variables (.env file)
- [ ] Run database migrations
- [ ] Test all API endpoints
- [ ] Run frontend build
- [ ] Run backend build
- [ ] Check error logs
- [ ] Verify mock storage works without DB
- [ ] Test with real PostgreSQL
- [ ] Load test with expected traffic
- [ ] Setup monitoring and alerting

## Future Enhancements

1. **Real-time Features**
   - WebSocket updates for team members
   - Live call status updates
   - Notification system for missed calls

2. **Advanced Features**
   - Bulk call import
   - Call recording integration
   - Calendar sync (Google, Outlook)
   - Twilio/CallRail integration

3. **Analytics**
   - Call duration reports
   - Team productivity metrics
   - Schedule completion rates
   - Conversion funnel analysis

4. **Mobile**
   - React Native app
   - Offline capability
   - Native call integration

---

**Version**: 1.0
**Last Updated**: January 2024
**Maintainer**: Development Team
