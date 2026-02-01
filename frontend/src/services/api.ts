import axios from 'axios'

// Use environment variable or fallback to production API URL
const API_URL = import.meta.env.VITE_API_URL || 'https://falaahun.onrender.com'

const api = axios.create({
  baseURL: API_URL,
})

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export const authService = {
  register: (email: string, password: string, name: string) =>
    api.post('/auth/register', { email, password, name }),
  
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  
  getProfile: () => api.get('/auth/profile'),
  
  getUsers: () => api.get('/auth/users')
}

export const contactService = {
  getAll: (limit = 50, offset = 0) =>
    api.get('/contacts', { params: { limit, offset } }),
  
  getOne: (id: string) => api.get(`/contacts/${id}`),
  
  create: (contact: any) =>
    api.post('/contacts', contact),
  
  update: (id: string, contact: any) =>
    api.put(`/contacts/${id}`, contact),
  
  delete: (id: string) =>
    api.delete(`/contacts/${id}`),
  
  search: (query: string) =>
    api.get('/contacts/search', { params: { q: query } })
}

export const activityService = {
  getByContact: (contactId: string) =>
    api.get(`/activities/contact/${contactId}`),
  
  getRecent: () =>
    api.get('/activities'),
  
  getStats: () =>
    api.get('/activities/stats'),
  
  getOne: (id: string) =>
    api.get(`/activities/${id}`),
  
  create: (activity: any) =>
    api.post('/activities', activity),
  
  update: (id: string, activity: any) =>
    api.put(`/activities/${id}`, activity),
  
  delete: (id: string) =>
    api.delete(`/activities/${id}`)
}

export const projectService = {
  getAll: (limit = 50, offset = 0) =>
    api.get('/projects', { params: { limit, offset } }),
  
  getOne: (id: string) =>
    api.get(`/projects/${id}`),
  
  create: (project: any) =>
    api.post('/projects', project),
  
  update: (id: string, project: any) =>
    api.put(`/projects/${id}`, project),
  
  delete: (id: string) =>
    api.delete(`/projects/${id}`),
  
  getStages: (projectId: string) =>
    api.get(`/projects/${projectId}/stages`),
  
  addStage: (projectId: string, stage: any) =>
    api.post(`/projects/${projectId}/stages`, stage),
  
  getDeals: (projectId: string) =>
    api.get(`/projects/${projectId}/deals`),
  
  getDeal: (id: string) =>
    api.get(`/projects/deals/${id}`),
  
  createDeal: (projectId: string, deal: any) =>
    api.post(`/projects/${projectId}/deals`, deal),
  
  updateDeal: (id: string, deal: any) =>
    api.put(`/projects/deals/${id}`, deal),
  
  deleteDeal: (id: string) =>
    api.delete(`/projects/deals/${id}`)
}

export const commentService = {
  getByContact: (contactId: string) =>
    api.get(`/comments/contact/${contactId}`),
  
  create: (contactId: string, content: string) =>
    api.post(`/comments/contact/${contactId}`, { content }),
  
  delete: (id: string) =>
    api.delete(`/comments/${id}`)
}

export const emailService = {
  getByContact: (contactId: string) =>
    api.get(`/emails/contact/${contactId}`),
  
  send: (contactId: string, data: any) =>
    api.post(`/emails/send/${contactId}`, data),
  
  getStats: () =>
    api.get('/emails/stats'),
  
  markAsOpened: (id: string) =>
    api.put(`/emails/${id}/opened`)
}

export const callLogService = {
  getByContact: (contactId: string) =>
    api.get(`/callLogs/contact/${contactId}`),
  
  create: (contactId: string, data: any) =>
    api.post(`/callLogs/contact/${contactId}`, data),
  
  update: (id: string, data: any) =>
    api.put(`/callLogs/${id}`, data),
  
  getOne: (id: string) =>
    api.get(`/callLogs/${id}`)
}

export const scheduleService = {
  getByContact: (contactId: string) =>
    api.get(`/schedules/contact/${contactId}`),
  
  getUpcoming: (limit = 20) =>
    api.get('/schedules/upcoming/list', { params: { limit } }),
  
  create: (contactId: string, data: any) =>
    api.post(`/schedules/contact/${contactId}`, data),
  
  update: (id: string, data: any) =>
    api.put(`/schedules/${id}`, data),
  
  cancel: (id: string) =>
    api.delete(`/schedules/${id}/cancel`),
  
  getOne: (id: string) =>
    api.get(`/schedules/${id}`)
}

export default api
