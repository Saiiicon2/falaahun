import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string
        email: string
        role: string
        organizationId?: string
        membershipRole?: string
      }
    }
  }
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]

    if (!token) {
      return res.status(401).json({ success: false, error: 'No token provided' })
    }

    const decoded = jwt.verify(token, JWT_SECRET) as Express.Request['user']
    req.user = decoded
    next()
  } catch (error: any) {
    res.status(401).json({ success: false, error: 'Invalid token' })
  }
}

export const adminMiddleware = (req: Request, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Admin access required' })
  }
  next()
}
