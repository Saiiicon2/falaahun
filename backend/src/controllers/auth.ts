import { Request, Response } from 'express'
import { userModel } from '../models/user'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body

    if (!email || !password || !name) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email, password, and name are required' 
      })
    }

    // Check if user exists (try database first, then mock storage)
    let existingUser = await userModel.getByEmail(email)
    
    if (existingUser) {
      // User exists - just log them in instead of failing
      const user = await userModel.verifyPassword(email, password)
      if (user) {
        const token = jwt.sign(
          { id: user.id, email: user.email, role: user.role },
          JWT_SECRET,
          { expiresIn: '7d' }
        )
        return res.status(200).json({ success: true, data: user, token })
      }
      // Password mismatch
      return res.status(400).json({ success: false, error: 'Email already in use' })
    }

    // Create new user
    const user = await userModel.create(email, password, name)
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.status(201).json({ success: true, data: user, token })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
}

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email and password are required' 
      })
    }

    let user = await userModel.verifyPassword(email, password)
    
    // For demo purposes: if user doesn't exist, create them automatically
    if (!user) {
      const newUser = await userModel.create(email, password, email.split('@')[0])
      user = { 
        id: newUser.id, 
        email: newUser.email, 
        name: newUser.name, 
        role: newUser.role 
      }
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.json({ success: true, data: user, token })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
}

export const getProfile = async (req: Request, res: Response) => {
  try {
    const user = await userModel.getById(req.user!.id)
    res.json({ success: true, data: user })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
}

export const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await userModel.getAll()
    res.json({ success: true, data: users })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
}
