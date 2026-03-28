import pool from './connection'

const initializeDatabase = async () => {
  try {
    // Ensure UUID generation is available (Render Postgres typically has this, but keep it safe).
    await pool.query('CREATE EXTENSION IF NOT EXISTS pgcrypto;')

    // Check connection
    const result = await pool.query('SELECT NOW()')
    console.log('✅ Database connection successful')
    
    // Create tables
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `)
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS contacts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        first_name VARCHAR(255) NOT NULL,
        last_name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(20),
        organization_id UUID,
        project_id UUID,
        lead_status VARCHAR(50) DEFAULT 'lead',
        assigned_to UUID,
        labels VARCHAR(255)[],
        custom_fields JSONB DEFAULT '{}',
        last_activity_at TIMESTAMP,
        hubspot_contact_id VARCHAR(50),
        hubspot_sync_status VARCHAR(50) DEFAULT 'pending',
        hubspot_last_synced TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `)
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS organizations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE,
        email VARCHAR(255),
        billing_email VARCHAR(255),
        stripe_customer_id VARCHAR(255),
        phone VARCHAR(20),
        address TEXT,
        website VARCHAR(255),
        description TEXT,
        logo_url VARCHAR(500),
        logo_key VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `)

    // Migrations: CREATE TABLE IF NOT EXISTS won't update existing tables.
    // Keep these idempotent so deployments can evolve schema safely.
    await pool.query('ALTER TABLE contacts ADD COLUMN IF NOT EXISTS organization_id UUID;')
    await pool.query('ALTER TABLE contacts ADD COLUMN IF NOT EXISTS project_id UUID;')
    await pool.query("ALTER TABLE contacts ADD COLUMN IF NOT EXISTS lead_status VARCHAR(50) DEFAULT 'lead';")
    await pool.query('ALTER TABLE contacts ADD COLUMN IF NOT EXISTS assigned_to UUID;')
    await pool.query('ALTER TABLE contacts ADD COLUMN IF NOT EXISTS labels VARCHAR(255)[];')
    await pool.query("ALTER TABLE contacts ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '{}';")
    await pool.query('ALTER TABLE contacts ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMP;')
    await pool.query('ALTER TABLE contacts ADD COLUMN IF NOT EXISTS hubspot_contact_id VARCHAR(50);')
    await pool.query("ALTER TABLE contacts ADD COLUMN IF NOT EXISTS hubspot_sync_status VARCHAR(50) DEFAULT 'pending';")
    await pool.query('ALTER TABLE contacts ADD COLUMN IF NOT EXISTS hubspot_last_synced TIMESTAMP;')

    await pool.query('ALTER TABLE organizations ADD COLUMN IF NOT EXISTS email VARCHAR(255);')
    await pool.query('ALTER TABLE organizations ADD COLUMN IF NOT EXISTS slug VARCHAR(255);')
    await pool.query('ALTER TABLE organizations ADD COLUMN IF NOT EXISTS billing_email VARCHAR(255);')
    await pool.query('ALTER TABLE organizations ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255);')
    await pool.query('ALTER TABLE organizations ADD COLUMN IF NOT EXISTS phone VARCHAR(20);')
    await pool.query('ALTER TABLE organizations ADD COLUMN IF NOT EXISTS address TEXT;')
    await pool.query('ALTER TABLE organizations ADD COLUMN IF NOT EXISTS website VARCHAR(255);')
    await pool.query('ALTER TABLE organizations ADD COLUMN IF NOT EXISTS description TEXT;')
    await pool.query('ALTER TABLE organizations ADD COLUMN IF NOT EXISTS logo_url VARCHAR(500);')
    await pool.query('ALTER TABLE organizations ADD COLUMN IF NOT EXISTS logo_key VARCHAR(255);')

    await pool.query(`
      CREATE TABLE IF NOT EXISTS organization_memberships (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role VARCHAR(50) NOT NULL DEFAULT 'member',
        status VARCHAR(50) NOT NULL DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (organization_id, user_id)
      );
    `)

    await pool.query(`
      CREATE TABLE IF NOT EXISTS organization_subscriptions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        provider VARCHAR(50) NOT NULL DEFAULT 'stripe',
        provider_customer_id VARCHAR(255),
        provider_subscription_id VARCHAR(255) NOT NULL UNIQUE,
        plan_key VARCHAR(255),
        status VARCHAR(50) NOT NULL DEFAULT 'incomplete',
        current_period_start TIMESTAMP,
        current_period_end TIMESTAMP,
        cancel_at_period_end BOOLEAN DEFAULT false,
        canceled_at TIMESTAMP,
        trial_end TIMESTAMP,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `)

    await pool.query('ALTER TABLE contacts ADD COLUMN IF NOT EXISTS tenant_organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;')

    // Seed a default org so the UI has a valid UUID to select.
    await pool.query(`
      INSERT INTO organizations (id, name, slug, email, created_at, updated_at)
      SELECT gen_random_uuid(), 'Default Organization', 'default-organization', 'org@falaahun.org', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      WHERE NOT EXISTS (SELECT 1 FROM organizations);
    `)
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS activities (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
        contact_id UUID NOT NULL,
        type VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        date TIMESTAMP,
        created_by UUID,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `)
    await pool.query('ALTER TABLE activities ADD COLUMN IF NOT EXISTS tenant_organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;')

    await pool.query(`
      CREATE TABLE IF NOT EXISTS comments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
        contact_id UUID NOT NULL,
        activity_id UUID,
        content TEXT NOT NULL,
        author_id UUID NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `)
    await pool.query('ALTER TABLE comments ADD COLUMN IF NOT EXISTS tenant_organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;')

    await pool.query(`
      CREATE TABLE IF NOT EXISTS email_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
        contact_id UUID NOT NULL,
        from_email VARCHAR(255) NOT NULL,
        to_email VARCHAR(255) NOT NULL,
        subject VARCHAR(500),
        body TEXT,
        status VARCHAR(50) DEFAULT 'sent',
        opened BOOLEAN DEFAULT false,
        opened_at TIMESTAMP,
        sent_by UUID,
        external_id VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `)
    await pool.query('ALTER TABLE email_logs ADD COLUMN IF NOT EXISTS tenant_organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;')

    await pool.query(`
      CREATE TABLE IF NOT EXISTS call_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
        contact_id UUID NOT NULL,
        duration INT,
        direction VARCHAR(20),
        status VARCHAR(50) DEFAULT 'completed',
        notes TEXT,
        call_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        logged_by UUID,
        recording_url VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `)
    await pool.query('ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS tenant_organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;')

    await pool.query(`
      CREATE TABLE IF NOT EXISTS schedules (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
        contact_id UUID,
        project_id UUID,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        event_type VARCHAR(50) DEFAULT 'meeting',
        start_time TIMESTAMP NOT NULL,
        end_time TIMESTAMP,
        location VARCHAR(255),
        attendees VARCHAR(255)[],
        assigned_to UUID NOT NULL,
        status VARCHAR(50) DEFAULT 'scheduled',
        created_by UUID,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `)
    await pool.query('ALTER TABLE schedules ADD COLUMN IF NOT EXISTS tenant_organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;')
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        budget DECIMAL(15,2),
        raised DECIMAL(15,2) DEFAULT 0,
        status VARCHAR(50) DEFAULT 'active',
        occurrence VARCHAR(50) DEFAULT 'one-time',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `)

    // Migrations for existing DBs
    await pool.query("ALTER TABLE projects ADD COLUMN IF NOT EXISTS occurrence VARCHAR(50) DEFAULT 'one-time';")
  await pool.query('ALTER TABLE projects ADD COLUMN IF NOT EXISTS tenant_organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;')

    // Seed a default project (helps dropdowns; safe/idempotent)
    await pool.query(`
      INSERT INTO projects (id, tenant_organization_id, name, description, budget, raised, status, occurrence, created_at, updated_at)
      SELECT gen_random_uuid(), o.id, 'General Fundraising', 'Default project', 0, 0, 'active', 'one-time', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      FROM organizations o
      WHERE NOT EXISTS (SELECT 1 FROM projects)
      ORDER BY o.created_at ASC
      LIMIT 1;
    `)
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS pipeline_stages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
        project_id UUID NOT NULL,
        name VARCHAR(255) NOT NULL,
        position INT,
        target_amount DECIMAL(15,2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `)
    await pool.query('ALTER TABLE pipeline_stages ADD COLUMN IF NOT EXISTS tenant_organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;')
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS deals (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
        project_id UUID NOT NULL,
        title VARCHAR(255) NOT NULL,
        amount DECIMAL(15,2) NOT NULL,
        stage_id UUID,
        contact_id UUID,
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `)
    await pool.query('ALTER TABLE deals ADD COLUMN IF NOT EXISTS tenant_organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;')

    await pool.query(`
      CREATE TABLE IF NOT EXISTS pledges (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
        contact_id UUID NOT NULL,
        deal_id UUID,
        amount DECIMAL(10, 2) NOT NULL,
        currency VARCHAR(3) DEFAULT 'USD',
        type VARCHAR(50) DEFAULT 'donation',
        status VARCHAR(50) DEFAULT 'pending',
        payment_method VARCHAR(50),
        transaction_id VARCHAR(255),
        expected_date TIMESTAMP,
        received_date TIMESTAMP,
        notes TEXT,
        logged_by UUID,
        hubspot_deal_id VARCHAR(50),
        hubspot_sync_status VARCHAR(50) DEFAULT 'pending',
        hubspot_last_synced TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `)

    // Pledge migrations for existing databases.
    await pool.query('ALTER TABLE pledges ADD COLUMN IF NOT EXISTS deal_id UUID;')
    await pool.query('ALTER TABLE pledges ADD COLUMN IF NOT EXISTS transaction_id VARCHAR(255);')
    await pool.query('ALTER TABLE pledges ADD COLUMN IF NOT EXISTS received_date TIMESTAMP;')
    await pool.query('ALTER TABLE pledges ADD COLUMN IF NOT EXISTS expected_date TIMESTAMP;')
    await pool.query('ALTER TABLE pledges ADD COLUMN IF NOT EXISTS notes TEXT;')
    await pool.query('ALTER TABLE pledges ADD COLUMN IF NOT EXISTS hubspot_deal_id VARCHAR(50);')
    await pool.query("ALTER TABLE pledges ADD COLUMN IF NOT EXISTS hubspot_sync_status VARCHAR(50) DEFAULT 'pending';")
    await pool.query('ALTER TABLE pledges ADD COLUMN IF NOT EXISTS hubspot_last_synced TIMESTAMP;')
    await pool.query('ALTER TABLE pledges ADD COLUMN IF NOT EXISTS tenant_organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;')

    await pool.query('CREATE INDEX IF NOT EXISTS idx_pledges_contact ON pledges(contact_id);')
    await pool.query('CREATE INDEX IF NOT EXISTS idx_pledges_deal ON pledges(deal_id);')
    await pool.query('CREATE INDEX IF NOT EXISTS idx_pledges_status ON pledges(status);')
    await pool.query('CREATE INDEX IF NOT EXISTS idx_pledges_hubspot ON pledges(hubspot_deal_id);')
    await pool.query('CREATE INDEX IF NOT EXISTS idx_pledges_sync_status ON pledges(hubspot_sync_status);')
    await pool.query('CREATE INDEX IF NOT EXISTS idx_contacts_tenant_organization ON contacts(tenant_organization_id);')
    await pool.query('CREATE INDEX IF NOT EXISTS idx_projects_tenant_organization ON projects(tenant_organization_id);')
    await pool.query('CREATE INDEX IF NOT EXISTS idx_deals_tenant_organization ON deals(tenant_organization_id);')
    await pool.query('CREATE INDEX IF NOT EXISTS idx_pledges_tenant_organization ON pledges(tenant_organization_id);')
    await pool.query('CREATE INDEX IF NOT EXISTS idx_activities_tenant_organization ON activities(tenant_organization_id);')
    await pool.query('CREATE INDEX IF NOT EXISTS idx_comments_tenant_organization ON comments(tenant_organization_id);')
    await pool.query('CREATE INDEX IF NOT EXISTS idx_email_logs_tenant_organization ON email_logs(tenant_organization_id);')
    await pool.query('CREATE INDEX IF NOT EXISTS idx_call_logs_tenant_organization ON call_logs(tenant_organization_id);')
    await pool.query('CREATE INDEX IF NOT EXISTS idx_schedules_tenant_organization ON schedules(tenant_organization_id);')
    await pool.query('CREATE INDEX IF NOT EXISTS idx_org_memberships_user_org ON organization_memberships(user_id, organization_id);')
    await pool.query('CREATE INDEX IF NOT EXISTS idx_org_subscriptions_org ON organization_subscriptions(organization_id);')
    await pool.query('CREATE INDEX IF NOT EXISTS idx_org_subscriptions_status ON organization_subscriptions(status);')
    await pool.query('CREATE INDEX IF NOT EXISTS idx_organizations_stripe_customer ON organizations(stripe_customer_id);')
    
    console.log('✅ Database schema initialized successfully')
  } catch (error: any) {
    console.error('❌ ERROR: Database initialization failed!')
    console.error('Error message:', error.message)
    console.error('Error code:', error.code)
    console.error('Full error:', error)
    console.error('\nIf using Render PostgreSQL, check:')
    console.error('1. DATABASE_URL is correctly set')
    console.error('2. Database exists and is accessible')
    console.error('3. Check Render logs for connection issues')
  }
}

export default initializeDatabase
