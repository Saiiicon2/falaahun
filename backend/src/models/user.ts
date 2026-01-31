import pool from '../db/connection'
import { v4 as uuidv4 } from 'uuid'
import bcrypt from 'bcryptjs'

// Mock storage for demo/offline mode
const mockUsers: any[] = []

export const userModel = {
  async getById(id: string) {
    try {
      const result = await pool.query(
        'SELECT id, email, name, role, created_at FROM users WHERE id = $1',
        [id]
      )
      return result.rows[0]
    } catch (error) {
      return mockUsers.find(u => u.id === id)
    }
  },

  async getByEmail(email: string) {
    try {
      const result = await pool.query(
        'SELECT * FROM users WHERE email = $1',
        [email]
      )
      return result.rows[0]
    } catch (error) {
      return mockUsers.find(u => u.email === email)
    }
  },

  async create(email: string, password: string, name: string, role = 'user') {
    const id = uuidv4()
    const passwordHash = await bcrypt.hash(password, 10)
    
    const user = {
      id,
      email,
      password_hash: passwordHash,
      name,
      role,
      created_at: new Date()
    }

    try {
      const result = await pool.query(
        `INSERT INTO users (id, email, password_hash, name, role)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, email, name, role, created_at`,
        [id, email, passwordHash, name, role]
      )
      return result.rows[0]
    } catch (error) {
      mockUsers.push(user)
      return { id: user.id, email: user.email, name: user.name, role: user.role, created_at: user.created_at }
    }
  },

  async verifyPassword(email: string, password: string) {
    const user = await this.getByEmail(email)
    if (!user) return null
    
    const isValid = await bcrypt.compare(password, user.password_hash)
    if (!isValid) return null
    
    return { id: user.id, email: user.email, name: user.name, role: user.role }
  },

  async getAll() {
    try {
      const result = await pool.query(
        'SELECT id, email, name, role, created_at FROM users'
      )
      return result.rows
    } catch (error) {
      return mockUsers.map(u => ({
        id: u.id,
        email: u.email,
        name: u.name,
        role: u.role,
        created_at: u.created_at
      }))
    }
  }
}
