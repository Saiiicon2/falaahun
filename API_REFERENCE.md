# API Quick Reference

## Base URL
```
http://localhost:3000
```

## Authentication
All endpoints require JWT token in header:
```
Authorization: Bearer <token>
```

## Call Logs API

### Log a Call
```
POST /callLogs/contact/:contactId
Content-Type: application/json

{
  "duration": 15,
  "direction": "outbound",
  "status": "completed",
  "notes": "Discussed project timeline"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "contact_id": "uuid",
    "duration": 15,
    "direction": "outbound",
    "status": "completed",
    "notes": "Discussed project timeline",
    "call_date": "2024-01-15T10:30:00Z",
    "logged_by": "user-id",
    "created_at": "2024-01-15T10:35:00Z",
    "updated_at": "2024-01-15T10:35:00Z"
  }
}
```

### Get Call History
```
GET /callLogs/contact/:contactId?limit=50
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "contact_id": "uuid",
      "duration": 15,
      "direction": "outbound",
      "status": "completed",
      "notes": "Discussed project timeline",
      "call_date": "2024-01-15T10:30:00Z",
      "logged_by": "user-id",
      "logged_by_name": "John Smith",
      "created_at": "2024-01-15T10:35:00Z"
    }
  ]
}
```

### Get Specific Call
```
GET /callLogs/:id
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "contact_id": "uuid",
    "duration": 15,
    "direction": "outbound",
    "status": "completed",
    "notes": "Discussed project timeline",
    "call_date": "2024-01-15T10:30:00Z",
    "logged_by": "user-id",
    "logged_by_name": "John Smith",
    "created_at": "2024-01-15T10:35:00Z"
  }
}
```

### Update Call
```
PUT /callLogs/:id
Content-Type: application/json

{
  "notes": "Updated notes",
  "status": "missed",
  "duration": 20
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "contact_id": "uuid",
    "duration": 20,
    "status": "missed",
    "notes": "Updated notes",
    "updated_at": "2024-01-15T11:00:00Z"
  }
}
```

## Schedules API

### Create Event
```
POST /schedules/contact/:contactId
Content-Type: application/json

{
  "title": "Project Kickoff Meeting",
  "eventType": "meeting",
  "startTime": "2024-01-20T14:00:00Z",
  "description": "Quarterly project review",
  "location": "Meeting Room B"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "contact_id": "uuid",
    "title": "Project Kickoff Meeting",
    "eventType": "meeting",
    "startTime": "2024-01-20T14:00:00Z",
    "endTime": "2024-01-20T14:00:00Z",
    "description": "Quarterly project review",
    "location": "Meeting Room B",
    "status": "scheduled",
    "assignedTo": "user-id",
    "createdBy": "user-id",
    "created_at": "2024-01-15T10:35:00Z"
  }
}
```

### Get Contact's Events
```
GET /schedules/contact/:contactId
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "contact_id": "uuid",
      "title": "Project Kickoff",
      "eventType": "meeting",
      "startTime": "2024-01-20T14:00:00Z",
      "endTime": "2024-01-20T15:00:00Z",
      "location": "Meeting Room B",
      "status": "scheduled",
      "assignedTo": "user-id",
      "assignedTo_name": "John Smith",
      "created_at": "2024-01-15T10:35:00Z"
    }
  ]
}
```

### Get Upcoming Events (Dashboard)
```
GET /schedules/upcoming/list?limit=20
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "contact_id": "uuid",
      "contact_name": "Jane Doe",
      "title": "Demo Call",
      "eventType": "call",
      "startTime": "2024-01-18T10:00:00Z",
      "status": "scheduled",
      "assignedTo_name": "John Smith",
      "created_at": "2024-01-15T10:35:00Z"
    }
  ]
}
```

### Get Specific Event
```
GET /schedules/:id
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "contact_id": "uuid",
    "title": "Project Kickoff",
    "eventType": "meeting",
    "startTime": "2024-01-20T14:00:00Z",
    "endTime": "2024-01-20T15:00:00Z",
    "location": "Meeting Room B",
    "status": "scheduled",
    "assignedTo": "user-id",
    "assignedTo_name": "John Smith",
    "created_at": "2024-01-15T10:35:00Z"
  }
}
```

### Update Event
```
PUT /schedules/:id
Content-Type: application/json

{
  "status": "completed",
  "title": "Project Kickoff - COMPLETED",
  "description": "Successfully completed kickoff"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "completed",
    "title": "Project Kickoff - COMPLETED",
    "description": "Successfully completed kickoff",
    "updated_at": "2024-01-20T15:30:00Z"
  }
}
```

### Cancel Event
```
DELETE /schedules/:id/cancel
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "cancelled",
    "updated_at": "2024-01-18T09:00:00Z"
  }
}
```

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "error": "title, eventType, and startTime are required"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "error": "Unauthorized"
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": "Call log not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Internal server error"
}
```

## Enums

### Call Direction
- `inbound` - Incoming call
- `outbound` - Outgoing call

### Call Status
- `completed` - Call was answered and completed
- `missed` - Call was missed/not answered
- `voicemail` - Voicemail was left

### Event Types
- `meeting` - Team or client meeting
- `call` - Scheduled phone call
- `email` - Email follow-up
- `task` - Internal task
- `demo` - Product/service demo

### Schedule Status
- `scheduled` - Event is scheduled (upcoming)
- `completed` - Event has been completed
- `cancelled` - Event has been cancelled

## Query Parameters

### Pagination
```
?limit=50      // Items per page (default: 50)
?offset=0      // Skip N items (default: 0)
```

### Filters
```
?contactId=uuid    // Filter by contact
?status=completed  // Filter by status
?startDate=2024-01-01T00:00:00Z
?endDate=2024-12-31T23:59:59Z
```

## Rate Limiting
No rate limiting currently implemented. For production, add:
```
- Max 100 requests per minute per user
- Max 1000 requests per hour per user
```

## Pagination Example

### Request
```
GET /callLogs/contact/contact-id?limit=10&offset=0
```

### Response
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "limit": 10,
    "offset": 0,
    "total": 25,
    "hasMore": true
  }
}
```

## Date/Time Format
All dates in ISO 8601 format: `2024-01-15T10:30:00Z`

## Testing with cURL

### Log a Call
```bash
curl -X POST http://localhost:3000/callLogs/contact/contact-id \
  -H "Authorization: Bearer token" \
  -H "Content-Type: application/json" \
  -d '{
    "duration": 15,
    "direction": "outbound",
    "status": "completed",
    "notes": "Test call"
  }'
```

### Create Schedule
```bash
curl -X POST http://localhost:3000/schedules/contact/contact-id \
  -H "Authorization: Bearer token" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Meeting",
    "eventType": "meeting",
    "startTime": "2024-01-20T14:00:00Z"
  }'
```

### Get Call History
```bash
curl -X GET "http://localhost:3000/callLogs/contact/contact-id?limit=10" \
  -H "Authorization: Bearer token"
```

## HTTP Status Codes
- `200 OK` - Success
- `201 Created` - Resource created
- `400 Bad Request` - Invalid input
- `401 Unauthorized` - Missing/invalid token
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

---

**API Version**: 1.0
**Last Updated**: January 2024
**Status**: Production Ready
