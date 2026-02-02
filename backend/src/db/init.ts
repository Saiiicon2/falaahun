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
        email VARCHAR(255),
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
    await pool.query('ALTER TABLE organizations ADD COLUMN IF NOT EXISTS phone VARCHAR(20);')
    await pool.query('ALTER TABLE organizations ADD COLUMN IF NOT EXISTS address TEXT;')
    await pool.query('ALTER TABLE organizations ADD COLUMN IF NOT EXISTS website VARCHAR(255);')
    await pool.query('ALTER TABLE organizations ADD COLUMN IF NOT EXISTS description TEXT;')
    await pool.query('ALTER TABLE organizations ADD COLUMN IF NOT EXISTS logo_url VARCHAR(500);')
    await pool.query('ALTER TABLE organizations ADD COLUMN IF NOT EXISTS logo_key VARCHAR(255);')

    // Seed a default org so the UI has a valid UUID to select.
    await pool.query(`
      INSERT INTO organizations (id, name, email, created_at, updated_at)
      SELECT gen_random_uuid(), 'Default Organization', 'org@falaahun.org', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      WHERE NOT EXISTS (SELECT 1 FROM organizations);
    `)
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS activities (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        budget DECIMAL(15,2),
        raised DECIMAL(15,2) DEFAULT 0,
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `)
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS pipeline_stages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id UUID NOT NULL,
        name VARCHAR(255) NOT NULL,
        position INT,
        target_amount DECIMAL(15,2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `)
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS deals (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
