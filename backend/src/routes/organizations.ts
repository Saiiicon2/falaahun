/**
 * Organization Routes
 * Handles organization management and logo uploads
 */

import { Router, Request, Response, NextFunction } from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import organizationModel from '../models/organization'
import { authMiddleware } from '../middleware/auth'

const router = Router()

// Configure multer for file uploads
const uploadDir = path.join(process.cwd(), 'uploads', 'logos')
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb: Function) => {
    cb(null, uploadDir)
  },
  filename: (req: Request, file: Express.Multer.File, cb: Function) => {
    const uniqueName = `logo-${Date.now()}-${file.originalname}`
    cb(null, uniqueName)
  },
})

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req: Request, file: Express.Multer.File, cb: Function) => {
    // Only allow image files
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Only image files (JPEG, PNG, WebP, SVG) are allowed'))
    }
  },
})

// Get all organizations
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const organizations = await organizationModel.getAll()
    res.json({
      success: true,
      data: organizations,
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch organizations',
      error: error.message,
    })
  }
})

// Get organization by ID
router.get('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const organization = await organizationModel.getById(req.params.id)
    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found',
      })
    }
    res.json({
      success: true,
      data: organization,
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch organization',
      error: error.message,
    })
  }
})

// Create organization
router.post('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { name, email, phone, address, website, description } = req.body

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Organization name is required',
      })
    }

    const organization = await organizationModel.create({
      name,
      email,
      phone,
      address,
      website,
      description,
    })

    res.status(201).json({
      success: true,
      data: organization,
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to create organization',
      error: error.message,
    })
  }
})

// Update organization
router.put('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { name, email, phone, address, website, description } = req.body

    const organization = await organizationModel.update(req.params.id, {
      name,
      email,
      phone,
      address,
      website,
      description,
    })

    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found',
      })
    }

    res.json({
      success: true,
      data: organization,
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to update organization',
      error: error.message,
    })
  }
})

// Upload logo
router.post(
  '/:id/logo',
  authMiddleware,
  upload.single('logo'),
  async (req: Request, res: Response) => {
    try {
      const multerReq = req as any // Type cast for multer properties
      
      if (!multerReq.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded',
        })
      }

      const organization = await organizationModel.getById(req.params.id)
      if (!organization) {
        // Delete uploaded file if organization not found
        fs.unlink(multerReq.file.path, () => {})
        return res.status(404).json({
          success: false,
          message: 'Organization not found',
        })
      }

      // Delete old logo if exists
      if (organization.logo_key) {
        const oldPath = path.join(uploadDir, organization.logo_key)
        fs.unlink(oldPath, () => {}) // Ignore errors
      }

      // Save logo URL to database
      const logoUrl = `/uploads/logos/${multerReq.file.filename}`
      const updatedOrg = await organizationModel.updateLogo(
        req.params.id,
        logoUrl,
        multerReq.file.filename
      )

      res.json({
        success: true,
        data: updatedOrg,
        message: 'Logo uploaded successfully',
      })
    } catch (error: any) {
      // Delete uploaded file on error
      const multerReq = req as any
      if (multerReq.file) {
        fs.unlink(multerReq.file.path, () => {})
      }
      res.status(500).json({
        success: false,
        message: 'Failed to upload logo',
        error: error.message,
      })
    }
  }
)

// Delete logo
router.delete('/:id/logo', authMiddleware, async (req: Request, res: Response) => {
  try {
    const organization = await organizationModel.getById(req.params.id)
    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found',
      })
    }

    // Delete logo file
    if (organization.logo_key) {
      const logoPath = path.join(uploadDir, organization.logo_key)
      fs.unlink(logoPath, () => {}) // Ignore errors
    }

    // Update database
    const updatedOrg = await organizationModel.updateLogo(req.params.id, '', '')

    res.json({
      success: true,
      data: updatedOrg,
      message: 'Logo deleted successfully',
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete logo',
      error: error.message,
    })
  }
})

// Delete organization
router.delete('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const organization = await organizationModel.getById(req.params.id)
    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found',
      })
    }

    // Delete logo file if exists
    if (organization.logo_key) {
      const logoPath = path.join(uploadDir, organization.logo_key)
      fs.unlink(logoPath, () => {}) // Ignore errors
    }

    await organizationModel.delete(req.params.id)

    res.json({
      success: true,
      message: 'Organization deleted successfully',
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete organization',
      error: error.message,
    })
  }
})

export default router
