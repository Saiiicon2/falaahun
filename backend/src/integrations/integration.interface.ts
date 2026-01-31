/**
 * CRM Integration Interface
 * Defines the contract for all CRM integrations (HubSpot, Salesforce, etc.)
 */

export interface Contact {
  id: string
  first_name: string
  last_name: string
  email?: string
  phone?: string
  lead_status?: string
  company?: string
}

export interface Pledge {
  id: string
  contact_id: string
  amount: number
  currency?: string
  type: string // 'pledge', 'donation', 'zakat', 'sadaqah'
  status: string // 'pending', 'received', 'failed'
  expected_date?: Date
  received_date?: Date
  notes?: string
}

export interface Activity {
  id: string
  contact_id: string
  type: string // 'call', 'email', 'meeting', 'note'
  title: string
  description?: string
  date: Date
}

export interface IntegrationSyncResult {
  success: boolean
  externalId: string
  externalUrl?: string
  timestamp: Date
  error?: string
}

export interface IntegrationWebhookEvent {
  id: string
  type: string
  timestamp: Date
  data: any
}

export interface CRMIntegration {
  /**
   * Test the connection to the external CRM
   */
  testConnection(): Promise<boolean>

  /**
   * Sync a contact to the external CRM
   */
  syncContact(contact: Contact): Promise<IntegrationSyncResult>

  /**
   * Sync a pledge/deal to the external CRM
   */
  syncPledge(pledge: Pledge): Promise<IntegrationSyncResult>

  /**
   * Sync an activity to the external CRM
   */
  syncActivity(activity: Activity): Promise<IntegrationSyncResult>

  /**
   * Get a contact from the external CRM
   */
  getContact(externalId: string): Promise<any>

  /**
   * Get a pledge/deal from the external CRM
   */
  getPledge(externalId: string): Promise<any>

  /**
   * Handle incoming webhook from external CRM
   */
  handleWebhook(event: IntegrationWebhookEvent): Promise<void>

  /**
   * Get the status of the integration
   */
  getStatus(): Promise<{
    connected: boolean
    lastSync?: Date
    error?: string
  }>
}
