# HubSpot Integration Setup Guide

This guide walks you through setting up HubSpot integration with the Dawah CRM system.

## Overview

The Dawah CRM is now integration-ready with HubSpot. This means you can:
- Sync contacts to HubSpot CRM
- Sync pledges/donations as HubSpot deals
- Sync activities as HubSpot tasks
- Receive real-time webhooks from HubSpot

## Architecture

The integration uses an **interface-based plugin architecture** that allows:
- Easy addition of future CRMs (Salesforce, Pipedrive, etc.)
- Graceful degradation if HubSpot is unavailable
- Flexible configuration via environment variables
- Audit trail of all sync operations

**Key Files:**
- `backend/src/integrations/integration.interface.ts` - CRM integration contract
- `backend/src/integrations/hubspot/hubspot.ts` - HubSpot implementation
- `backend/src/services/syncService.ts` - Multi-integration orchestration
- `backend/src/routes/integrations.ts` - Integration API endpoints
- `backend/src/config/integrations.ts` - Configuration management

## Step 1: Get HubSpot API Key

1. Go to your HubSpot account dashboard
2. Click **Settings** (gear icon in top right)
3. Navigate to **Integrations → Private Apps**
4. Click **Create app**
5. Name it: "Dawah CRM"
6. Go to **Scopes** tab and enable:
   - `crm.objects.contacts.read`
   - `crm.objects.contacts.write`
   - `crm.objects.deals.read`
   - `crm.objects.deals.write`
   - `crm.objects.tasks.read`
   - `crm.objects.tasks.write`
7. Click **Create app**
8. Copy the **Private App Access Token** (this is your API key)

## Step 2: Configure Environment Variables

Add these to your `.env` file in the backend directory:

```bash
# HubSpot Integration
HUBSPOT_ENABLED=true
HUBSPOT_API_KEY=your_private_app_access_token_here
HUBSPOT_SYNC_MODE=real-time  # Options: real-time, batch, manual
HUBSPOT_AUTO_SYNC_CONTACTS=true
HUBSPOT_AUTO_SYNC_PLEDGES=true
HUBSPOT_AUTO_SYNC_ACTIVITIES=true
```

**Configuration Options:**
- `HUBSPOT_ENABLED` - Turn integration on/off without code changes
- `HUBSPOT_API_KEY` - Your HubSpot private app token
- `HUBSPOT_SYNC_MODE` - Sync timing strategy
  - `real-time` - Sync immediately on creation/update
  - `batch` - Sync in batches periodically
  - `manual` - Only sync when explicitly triggered
- `HUBSPOT_AUTO_SYNC_*` - Auto-sync specific entity types

## Step 3: Test Connection

You can test the integration in two ways:

### Via Frontend UI
1. Start both servers: `npm run dev` (frontend) and `npm run dev` (backend)
2. Go to **Settings** in the sidebar
3. Enter your HubSpot API key
4. Click **Test Connection**
5. You should see a success message

### Via API (cURL)
```bash
curl -X POST http://localhost:3000/integrations/hubspot/test \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

## Step 4: Verify Database Schema

The system automatically uses these database tables:

**Contacts** additions:
- `hubspot_contact_id` - External HubSpot ID
- `hubspot_sync_status` - pending, synced, or failed
- `hubspot_last_synced` - Last sync timestamp

**Pledges** (new table):
- `id` - Primary key
- `contact_id` - Link to contact
- `amount` - Pledge amount
- `type` - donation, pledge, zakat, sadaqah
- `status` - pending, received, failed
- `payment_method` - How payment was made
- `hubspot_deal_id` - External HubSpot deal ID
- `hubspot_sync_status` - Sync status
- `hubspot_last_synced` - Last sync timestamp

**integration_sync_logs** (audit):
- Tracks all sync operations for troubleshooting

## Step 5: How Syncing Works

### Manual Sync via API

**Sync a Single Contact:**
```bash
curl -X POST http://localhost:3000/integrations/sync/contact/contact-123 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

**Sync a Pledge:**
```bash
curl -X POST http://localhost:3000/integrations/sync/pledge/pledge-456 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

**Sync an Activity:**
```bash
curl -X POST http://localhost:3000/integrations/sync/activity/activity-789 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

### Check Integration Status

```bash
curl http://localhost:3000/integrations/status \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Response:
```json
{
  "data": [
    {
      "integration": "hubspot",
      "connected": true,
      "lastSync": "2024-01-18T10:30:00Z",
      "syncCounts": {
        "contacts": 45,
        "pledges": 12,
        "activities": 89
      }
    }
  ]
}
```

## Step 6: Field Mapping

Data is mapped between Dawah CRM and HubSpot as follows:

### Contacts
| Dawah Field | HubSpot Field | Notes |
|---|---|---|
| first_name | firstname | Contact first name |
| last_name | lastname | Contact last name |
| email | email | Primary email |
| phone | phone | Phone number |
| lead_status | lifecyclestage | Opportunity, Qualified to buy, etc. |
| company | company | Company name |

### Pledges (mapped to HubSpot Deals)
| Dawah Field | HubSpot Field | Notes |
|---|---|---|
| amount | dealstage | Deal amount |
| type | description | Donation/pledge type |
| status | dealstage | pending→Qualification, received→Closed Won |
| expected_date | closedate | Expected completion |

### Activities (mapped to HubSpot Tasks)
| Dawah Field | HubSpot Field | Notes |
|---|---|---|
| title | subject | Activity title |
| description | body | Full description |
| type | tasktype | call, email, etc. |
| date | timestamp | When activity occurred |

## Step 7: Webhook Receiver

HubSpot can push updates back to your system. Configure webhooks in HubSpot:

1. Go to **Settings → Integrations → Webhooks**
2. Add webhook:
   - **URL:** `https://your-domain.com/integrations/webhooks/hubspot`
   - **Events:** Select contact and deal updates
3. The system will receive real-time updates

**Webhook Signature Verification** (Security):
The system validates webhook signatures to ensure they come from HubSpot. This prevents unauthorized updates.

## Troubleshooting

### Connection Failed
- Check API key is correct (copy from HubSpot settings)
- Verify HUBSPOT_ENABLED=true in .env
- Check network connectivity to api.hubapi.com
- Look at server logs for detailed error messages

### Sync Failing for Specific Contact
- Check contact has required fields (first_name, email)
- Look at integration_sync_logs table for error details
- Verify HubSpot account hasn't hit API rate limits

### Missing Synced Records in HubSpot
- Check HUBSPOT_AUTO_SYNC_* settings are true
- Verify sync status in Dawah CRM UI
- Check HubSpot for duplicate prevention settings

### Performance Issues
The system includes performance indexes on:
- `idx_contacts_hubspot` - Fast hubspot_contact_id lookups
- `idx_pledges_hubspot` - Fast pledge sync lookups
- `idx_sync_logs_integration` - Fast log queries

If syncing is slow:
- Reduce batch size (TBD: configuration option)
- Consider batch sync mode instead of real-time
- Check HubSpot API rate limit status

## API Reference

### GET /integrations/status
Get status of all integrations

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "integration": "hubspot",
      "connected": true,
      "error": null,
      "lastSync": "2024-01-18T10:30:00Z"
    }
  ]
}
```

### POST /integrations/:name/test
Test a specific integration connection

**Response:**
```json
{
  "success": true,
  "message": "Connection successful"
}
```

### POST /integrations/sync/contact/:contactId
Manually sync a contact

**Response:**
```json
{
  "success": true,
  "integration": "hubspot",
  "externalId": "12345",
  "externalUrl": "https://app.hubspot.com/contacts/123/contact/12345",
  "timestamp": "2024-01-18T10:30:00Z"
}
```

### POST /integrations/webhooks/hubspot
Receive webhooks from HubSpot (called by HubSpot, not by you)

## Multi-Integration Support

The system is designed for multiple CRM integrations:

```typescript
// Future: Salesforce integration
import { SalesforceIntegration } from './salesforce/salesforce'

// Future: Pipedrive integration
import { PipedriveIntegration } from './pipedrive/pipedrive'
```

To add a new CRM:
1. Create new folder: `backend/src/integrations/salesforce/`
2. Implement `CRMIntegration` interface
3. Update `backend/src/services/syncService.ts` to initialize it
4. Add configuration to `backend/src/config/integrations.ts`
5. Update `.env` with new CRM credentials

## Best Practices

1. **Start with manual sync** - Test single contacts before enabling auto-sync
2. **Monitor sync logs** - Check integration_sync_logs for any failures
3. **Regular backups** - Keep HubSpot data in sync, but maintain local backups
4. **Rate limiting** - HubSpot has API rate limits; batch sync mode recommended for large datasets
5. **Test webhooks** - Verify bidirectional sync works with HubSpot webhooks

## Environment Variables Checklist

```bash
HUBSPOT_ENABLED=true              # ✓ Must be true
HUBSPOT_API_KEY=xxx               # ✓ Must be filled in
HUBSPOT_SYNC_MODE=real-time       # ✓ Choose: real-time, batch, manual
HUBSPOT_AUTO_SYNC_CONTACTS=true   # ✓ Auto-sync contacts
HUBSPOT_AUTO_SYNC_PLEDGES=true    # ✓ Auto-sync pledges
HUBSPOT_AUTO_SYNC_ACTIVITIES=true # ✓ Auto-sync activities
```

## Support

For issues or questions:
1. Check integration_sync_logs table for error details
2. Review server logs for API errors
3. Verify HubSpot API key has correct scopes
4. Check network connectivity to HubSpot servers
5. Review webhook configuration in HubSpot settings
