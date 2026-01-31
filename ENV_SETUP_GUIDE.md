# Environment Setup Guide

## Quick Start - Copy and Configure

Create a `.env` file in the `backend` directory with these settings:

```bash
# ============================================
# DATABASE CONFIGURATION
# ============================================
DB_HOST=localhost
DB_PORT=5432
DB_NAME=dawah_crm
DB_USER=postgres
DB_PASSWORD=your_postgres_password

# ============================================
# JWT AUTHENTICATION
# ============================================
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRY=7d

# ============================================
# HUBSPOT INTEGRATION (REQUIRED FOR SYNC)
# ============================================
HUBSPOT_ENABLED=true
HUBSPOT_API_KEY=pat_xxxxxxxxxxxxxxxxxxxxxxxx
HUBSPOT_SYNC_MODE=real-time
HUBSPOT_AUTO_SYNC_CONTACTS=true
HUBSPOT_AUTO_SYNC_PLEDGES=true
HUBSPOT_AUTO_SYNC_ACTIVITIES=true

# ============================================
# SERVER CONFIGURATION
# ============================================
PORT=3000
NODE_ENV=development
```

## Step 1: Get HubSpot API Key

1. Log in to HubSpot
2. Click Settings (gear icon, top right)
3. Go to **Integrations → Private Apps**
4. Click **Create app**
5. Name: "Dawah CRM"
6. Go to **Scopes** tab and enable:
   - ✓ crm.objects.contacts.read
   - ✓ crm.objects.contacts.write
   - ✓ crm.objects.deals.read
   - ✓ crm.objects.deals.write
   - ✓ crm.objects.tasks.read
   - ✓ crm.objects.tasks.write
7. Click **Create app**
8. Copy the **Private App Access Token**
9. Paste it in your `.env` file as `HUBSPOT_API_KEY`

## Step 2: Set Up Database

### Option A: PostgreSQL Installed Locally
```bash
# Create database
psql -U postgres -c "CREATE DATABASE dawah_crm;"

# Create tables (the app will do this automatically)
```

### Option B: No PostgreSQL (Development)
The app will use mock storage automatically. Sync will still work but data won't persist between restarts.

## Step 3: Configure .env File

Copy the template above and update:
- `DB_PASSWORD` - Your PostgreSQL password
- `JWT_SECRET` - Use: `openssl rand -base64 32` to generate
- `HUBSPOT_API_KEY` - From step 1

## Step 4: Start the Application

```bash
# Terminal 1: Start Backend
cd backend
npm run dev

# Terminal 2: Start Frontend
cd frontend
npm run dev
```

## Step 5: Test the Integration

1. Open http://localhost:5173
2. Log in with any credentials
3. Go to **Settings** in the sidebar
4. Enter your HubSpot API key
5. Click **Test Connection**
6. Should see: "✓ HubSpot connection successful!"

## Environment Variables Explained

| Variable | Purpose | Example |
|----------|---------|---------|
| `HUBSPOT_ENABLED` | Turn syncing on/off | `true` or `false` |
| `HUBSPOT_API_KEY` | Authentication token | `pat_1234...` |
| `HUBSPOT_SYNC_MODE` | When to sync | `real-time`, `batch`, `manual` |
| `HUBSPOT_AUTO_SYNC_CONTACTS` | Auto-sync contacts | `true` or `false` |
| `HUBSPOT_AUTO_SYNC_PLEDGES` | Auto-sync pledges | `true` or `false` |
| `HUBSPOT_AUTO_SYNC_ACTIVITIES` | Auto-sync activities | `true` or `false` |

## Sync Modes Explained

- **real-time** (recommended) - Sync immediately when creating/updating
- **batch** - Collect changes and sync every hour (better for high-volume)
- **manual** - Only sync when you click the sync button

## Testing Configuration

Test that everything is working:

```bash
# Test backend is running
curl http://localhost:3000/health

# Test frontend is running
curl http://localhost:5173

# Test HubSpot integration
curl -X POST http://localhost:3000/integrations/hubspot/test \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

## Troubleshooting

### "Cannot find module 'axios'"
```bash
cd backend
npm install
npm run dev
```

### "Port 3000 already in use"
```bash
# Kill the process
lsof -i :3000
kill -9 <PID>

# Or use a different port
PORT=3001 npm run dev
```

### "Database connection failed"
- Verify PostgreSQL is running
- Check DB credentials in `.env`
- Create database: `psql -U postgres -c "CREATE DATABASE dawah_crm;"`

### "HubSpot connection failed"
- Verify API key is correct (copy from HubSpot settings)
- Check API key hasn't been revoked
- Verify all required scopes are enabled in HubSpot
- Check `HUBSPOT_ENABLED=true`

## Production Deployment

For production:

1. **Use strong secrets:**
   ```bash
   JWT_SECRET=$(openssl rand -base64 32)
   ```

2. **Use PostgreSQL (not mock storage)**
   - Set up managed database (AWS RDS, Azure Database, etc.)
   - Update DB_* variables

3. **Secure API keys:**
   - Use secrets manager (AWS Secrets Manager, etc.)
   - Never commit `.env` to git
   - Add `.env` to `.gitignore`

4. **Enable HTTPS:**
   - Use reverse proxy (nginx, cloudflare)
   - Update API URLs to HTTPS

5. **Monitor:**
   - Check `integration_sync_logs` table regularly
   - Monitor HubSpot API usage
   - Set up error alerting

## Need Help?

1. Check the server logs for error messages
2. Review `integration_sync_logs` table for sync failures
3. Verify HubSpot API key and scopes
4. See HUBSPOT_INTEGRATION.md for detailed setup
