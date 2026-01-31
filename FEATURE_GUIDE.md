# Call Logging & Scheduling Feature Guide

## Overview
The Dawah CRM now includes comprehensive call logging and scheduling features for tracking all customer interactions and managing team calendars.

## Features

### 1. Call Logging

#### How to Log a Call
1. Navigate to any contact from the Contacts page
2. Click on the **"Calls"** tab in the contact detail view
3. Click **"+ Log New Call"** button
4. Fill in the call details:
   - **Duration**: Minutes of the call (0-999)
   - **Direction**: Select "Inbound" or "Outbound"
   - **Status**: Choose from:
     - Completed - Call was answered and completed
     - Missed - Call was missed/not answered
     - Voicemail - Voicemail was left
   - **Notes**: Add any relevant call information
5. Click **"Log Call"** to save

#### View Call History
- The Calls tab displays all logged calls for the contact in reverse chronological order (newest first)
- Each call shows:
  - Duration in minutes
  - Direction indicator (📥 inbound, 📤 outbound)
  - Status badge with color coding:
    - 🟢 Green: Completed
    - 🔴 Red: Missed
    - 🟡 Yellow: Voicemail
  - Call notes
  - Exact date and time of the call

#### Quick Access
Click **"Log Call"** button in the Quick Actions sidebar to jump directly to the Calls tab and open the form.

### 2. Schedule Management

#### How to Create a Schedule/Event
1. Navigate to any contact from the Contacts page
2. Click on the **"Schedules"** tab in the contact detail view
3. Click **"+ Schedule Event"** button
4. Fill in the event details:
   - **Title**: Event name (e.g., "Project Kickoff", "Demo Call")
   - **Event Type**: Select from:
     - Meeting - Team or client meeting
     - Call - Scheduled phone call
     - Email - Email follow-up reminder
     - Task - Internal task
     - Demo - Product/service demonstration
   - **Date & Time**: Select the exact date and time using the date/time picker
   - **Description**: Add event details and agenda (optional)
5. Click **"Schedule Event"** to create

#### View Scheduled Events
- The Schedules tab displays all upcoming and past events for the contact
- Each event shows:
  - 📅 Calendar icon
  - Event title
  - Event description
  - Scheduled date and time
  - Status badge:
    - 🔵 Blue: Scheduled (upcoming)
    - 🟢 Green: Completed
    - ⚫ Gray: Cancelled

#### Quick Access
Click **"Schedule"** button in the Quick Actions sidebar to jump directly to the Schedules tab and open the form.

#### Manage Upcoming Events
- View all team's upcoming events via the Dashboard
- See a list of next scheduled events across all contacts
- Assign events to specific team members

### 3. Integration with Other Features

#### Activity Timeline
All calls and schedules appear in the **Activity** tab to give you a complete interaction history with each contact.

#### Quick Actions Sidebar
On every contact detail page, use the Quick Actions section to:
- 💌 Send Email
- 📞 Log Call
- 📅 Schedule Event

These shortcuts make it easy to quickly record interactions without navigation.

## Best Practices

### Call Logging
✅ **Do:**
- Log calls immediately after they occur while details are fresh
- Include brief notes about the call discussion and outcome
- Set accurate duration to track team productivity
- Use the Direction field to categorize inbound vs outbound

❌ **Don't:**
- Leave notes blank - they're valuable for team context
- Forget to mark missed calls as "missed" for accurate reporting
- Log calls for the wrong contact

### Scheduling
✅ **Do:**
- Set reminders for important meetings
- Include agenda items in the description
- Assign events to responsible team members
- Update status when events are completed
- Schedule follow-ups immediately after discovery calls

❌ **Don't:**
- Schedule too many events on one contact (quality over quantity)
- Leave event descriptions blank
- Schedule conflicting times for the same contact

## Data Fields Reference

### Call Log Fields
| Field | Type | Description |
|-------|------|-------------|
| Duration | Number | Length of call in minutes |
| Direction | Enum | Inbound or Outbound |
| Status | Enum | Completed, Missed, or Voicemail |
| Notes | Text | Call details and outcomes |
| Logged By | System | Automatically captured user ID |
| Call Date | DateTime | Automatically captured timestamp |

### Schedule Fields
| Field | Type | Description |
|-------|------|-------------|
| Title | Text | Event name/subject |
| Event Type | Enum | Meeting, Call, Email, Task, Demo |
| Start Time | DateTime | When the event begins |
| Description | Text | Event details and agenda |
| Assigned To | Enum | Team member responsible |
| Status | Enum | Scheduled, Completed, Cancelled |
| Created By | System | Automatically captured user ID |

## Reporting

### Call Analytics (Coming Soon)
- Total calls per contact
- Average call duration
- Inbound vs outbound ratio
- Resolution rates by call type

### Schedule Completion (Coming Soon)
- Scheduled vs completed events
- Average time to follow-up
- Team member assignment efficiency
- Event type distribution

## API Reference (For Developers)

### Call Logging Endpoints
```
POST   /callLogs/contact/:contactId    - Log new call
GET    /callLogs/contact/:contactId    - Get call history
GET    /callLogs/:id                   - Get specific call
PUT    /callLogs/:id                   - Update call details
```

### Schedule Endpoints
```
POST   /schedules/contact/:contactId   - Create event
GET    /schedules/contact/:contactId   - Get contact's events
GET    /schedules/upcoming/list        - Get upcoming events
GET    /schedules/:id                  - Get specific event
PUT    /schedules/:id                  - Update event
DELETE /schedules/:id/cancel           - Cancel event
```

## Troubleshooting

### Call not saving?
- Check that you've selected a Direction and Status
- Verify your internet connection
- Look for error messages in the browser console

### Schedule not appearing?
- Ensure you've selected a valid date and time
- Verify the title field is filled in
- Check that the start time is in the future

### Forms not showing?
- Refresh the page
- Clear browser cache
- Try logging out and logging back in

## Support

For issues or feature requests, contact the development team with:
- Contact ID where issue occurred
- What you were trying to do
- Expected vs actual behavior
- Browser and operating system

---

**Version**: 1.0
**Last Updated**: January 2024
**Status**: Production Ready
