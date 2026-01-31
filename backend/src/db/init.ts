import pool from './connection'

const initializeDatabase = async () => {
  try {
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
        labels VARCHAR(255)[],
        custom_fields JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
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
    console.error('⚠️  Warning: Database initialization encountered an issue')
    console.error('This is normal if PostgreSQL is not installed.')
    console.error('Error:', error.message)
    console.error('\nTo set up PostgreSQL:')
    console.error('1. Install PostgreSQL from https://www.postgresql.org/download/')
    console.error('2. Create database: psql -U postgres -c "CREATE DATABASE dawah_crm;"')
    console.error('3. Update .env with your database credentials')
    console.error('4. Restart the server')
  }
}

export default initializeDatabase
