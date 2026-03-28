import { Request, Response } from 'express'
import { userModel } from '../models/user'
import organizationModel from '../models/organization'
import { organizationMembershipModel } from '../models/organizationMembership'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

const issueToken = (payload: {
  id: string
  email: string
  role: string
  organizationId: string
  membershipRole: string
}) =>
  jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, name, organizationName } = req.body

    if (!email || !password || !name || !organizationName) {
      return res.status(400).json({ 
        success: false, 
        error: 'Organization name, email, password, and name are required' 
      })
    }

    let existingUser = await userModel.getByEmail(email)
    
    if (existingUser) {
      return res.status(400).json({ success: false, error: 'Email already in use' })
    }

    const user = await userModel.create(email, password, name)
    const organization = await organizationModel.create({
      name: organizationName,
      email,
    })
    const membership = await organizationMembershipModel.create(organization.id, user.id, 'owner')

    const token = issueToken({
      id: user.id,
      email: user.email,
      role: user.role,
      organizationId: organization.id,
      membershipRole: membership.role,
    })

    res.status(201).json({
      success: true,
      data: {
        user,
        organization,
        organizations: [organization],
        membership,
      },
      token,
    })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
}

export const registerOrganization = register

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password, organizationId } = req.body

    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email and password are required' 
      })
    }

    const user = await userModel.verifyPassword(email, password)

    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' })
    }

    const memberships = await organizationMembershipModel.getByUserId(user.id)
    if (!memberships.length) {
      return res.status(403).json({ success: false, error: 'No organization membership found for this user' })
    }

    const selectedMembership = organizationId
      ? memberships.find((membership: any) => membership.organization_id === organizationId)
      : memberships[0]

    if (!selectedMembership) {
      return res.status(403).json({ success: false, error: 'Requested organization is not accessible for this user' })
    }

    const organization = await organizationModel.getById(selectedMembership.organization_id)

    const token = issueToken({
      id: user.id,
      email: user.email,
      role: user.role,
      organizationId: selectedMembership.organization_id,
      membershipRole: selectedMembership.role,
    })

    res.json({
      success: true,
      data: {
        user,
        organization,
        organizations: memberships.map((membership: any) => ({
          id: membership.organization_id,
          name: membership.organization_name,
          slug: membership.organization_slug,
          role: membership.role,
        })),
        membership: selectedMembership,
      },
      token,
    })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
}

export const getProfile = async (req: Request, res: Response) => {
  try {
    const user = await userModel.getById(req.user!.id)
    const organizations = await organizationModel.getByUserId(req.user!.id)
    const currentOrganization = req.user?.organizationId
      ? organizations.find((organization: any) => organization.id === req.user?.organizationId) || null
      : null

    res.json({
      success: true,
      data: {
        user,
        organization: currentOrganization,
        organizations,
      },
    })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
}

export const getUsers = async (req: Request, res: Response) => {
  try {
    if (!req.user?.organizationId) {
      return res.status(400).json({ success: false, error: 'Organization context is required' })
    }

    const users = await userModel.getAllByOrganization(req.user.organizationId)
    res.json({ success: true, data: users })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
}
