import { Pool } from 'pg';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

async function seedDefaultUser() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔌 Connecting to database...');
    
    const client = await pool.connect();
    console.log('✅ Connected!');
    
    // Check if user already exists
    const existingUser = await client.query(
      'SELECT * FROM users WHERE email = $1',
      ['admin@falaahun.com']
    );
    
    if (existingUser.rows.length > 0) {
      console.log('ℹ️  Default user already exists');
      console.log('📧 Email: admin@falaahun.com');
      client.release();
      return;
    }
    
    // Create default admin user
    const password = 'admin123';
    const hashedPassword = await bcrypt.hash(password, 10);
    
    await client.query(
      `INSERT INTO users (email, password_hash, name, role)
       VALUES ($1, $2, $3, $4)`,
      ['admin@falaahun.com', hashedPassword, 'Admin User', 'admin']
    );
    
    console.log('✅ Default user created successfully!');
    console.log('\n📝 Login Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Email:    admin@falaahun.com');
    console.log('🔑 Password: admin123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n⚠️  IMPORTANT: Change this password after first login!');
    
    client.release();
    
  } catch (error) {
    console.error('❌ Error seeding user:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

seedDefaultUser()
  .then(() => {
    console.log('\n🎉 Seeding complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Failed to seed user:', error);
    process.exit(1);
  });
