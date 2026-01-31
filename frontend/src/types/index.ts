export interface Contact {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  company?: string
  labels: string[]
  customFields: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

export interface Activity {
  id: string
  contactId: string
  type: 'call' | 'email' | 'social' | 'whatsapp' | 'note' | 'task'
  title: string
  description: string
  date: Date
  createdAt: Date
}

export interface Project {
  id: string
  name: string
  description: string
  budget: number
  raised: number
  pipeline: PipelineStage[]
  status: 'active' | 'completed' | 'archived'
  createdAt: Date
  updatedAt: Date
}

export interface PipelineStage {
  id: string
  name: string
  value: number
  targetAmount: number
  deals: Deal[]
}

export interface Deal {
  id: string
  projectId: string
  title: string
  amount: number
  stage: string
  pledges: Pledge[]
  createdAt: Date
}

export interface Pledge {
  id: string
  dealId: string
  donor: string
  amount: number
  pledgeDate: Date
  status: 'pending' | 'received' | 'cancelled'
}

export interface User {
  id: string
  email: string
  name: string
  role: 'admin' | 'user'
  createdAt: Date
}
