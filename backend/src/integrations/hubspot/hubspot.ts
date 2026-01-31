/**
 * HubSpot CRM Integration
 * Handles all communication with HubSpot API
 */

import axios, { AxiosInstance } from 'axios'
import {
  CRMIntegration,
  Contact,
  Pledge,
  Activity,
  IntegrationSyncResult,
  IntegrationWebhookEvent,
} from '../integration.interface'

const HUBSPOT_API_URL = 'https://api.hubapi.com'

export class HubSpotIntegration implements CRMIntegration {
  private apiKey: string
  private client: AxiosInstance

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('HubSpot API key is required')
    }
    this.apiKey = apiKey
    this.client = axios.create({
      baseURL: HUBSPOT_API_URL,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    })
  }

  /**
   * Test connection to HubSpot
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.client.get('/crm/v3/objects/contacts', {
        params: { limit: 1 },
      })
      return response.status === 200
    } catch (error: any) {
      console.error('HubSpot connection test failed:', error.message)
      return false
    }
  }

  /**
   * Sync a contact to HubSpot
   */
  async syncContact(contact: Contact): Promise<IntegrationSyncResult> {
    try {
      const properties = {
        firstname: contact.first_name,
        lastname: contact.last_name,
        email: contact.email,
        phone: contact.phone,
        company: contact.company,
        lifecyclestage: this.mapLeadStatusToHubSpot(contact.lead_status),
      }

      const response = await this.client.post('/crm/v3/objects/contacts', {
        properties,
      })

      return {
        success: true,
        externalId: response.data.id,
        externalUrl: `https://app.hubspot.com/contacts/default/contact/${response.data.id}`,
        timestamp: new Date(),
      }
    } catch (error: any) {
      return {
        success: false,
        externalId: '',
        timestamp: new Date(),
        error: error.response?.data?.message || error.message,
      }
    }
  }

  /**
   * Sync a pledge to HubSpot as a Deal
   */
  async syncPledge(pledge: Pledge): Promise<IntegrationSyncResult> {
    try {
      const dealstage = this.mapPledgeStatusToHubSpot(pledge.status)
      const properties = {
        dealname: `${pledge.type.charAt(0).toUpperCase() + pledge.type.slice(1)} - $${pledge.amount}`,
        dealtype: 'donation',
        amount: pledge.amount * 100, // HubSpot uses cents
        dealstage,
        closedate: pledge.expected_date
          ? new Date(pledge.expected_date).toISOString().split('T')[0]
          : undefined,
        custom_pledge_type: pledge.type,
        custom_pledge_status: pledge.status,
        notes_next_activity_date: pledge.notes || '',
      }

      const response = await this.client.post('/crm/v3/objects/deals', {
        properties,
        associations: pledge.contact_id
          ? [
              {
                type: 'deal_to_contact',
                id: pledge.contact_id,
              },
            ]
          : [],
      })

      return {
        success: true,
        externalId: response.data.id,
        externalUrl: `https://app.hubspot.com/deals/default/deal/${response.data.id}`,
        timestamp: new Date(),
      }
    } catch (error: any) {
      return {
        success: false,
        externalId: '',
        timestamp: new Date(),
        error: error.response?.data?.message || error.message,
      }
    }
  }

  /**
   * Sync an activity to HubSpot
   */
  async syncActivity(activity: Activity): Promise<IntegrationSyncResult> {
    try {
      const engagementType = this.mapActivityTypeToHubSpot(activity.type)

      const response = await this.client.post('/crm/v3/objects/tasks', {
        properties: {
          hs_task_type: engagementType,
          hs_task_subject: activity.title,
          hs_task_body: activity.description || '',
          hs_task_for_object_type: 'CONTACT',
          hs_timestamp: activity.date.toISOString(),
        },
        associations: [
          {
            type: 'task_to_contact',
            id: activity.contact_id,
          },
        ],
      })

      return {
        success: true,
        externalId: response.data.id,
        timestamp: new Date(),
      }
    } catch (error: any) {
      return {
        success: false,
        externalId: '',
        timestamp: new Date(),
        error: error.response?.data?.message || error.message,
      }
    }
  }

  /**
   * Get a contact from HubSpot
   */
  async getContact(externalId: string): Promise<any> {
    try {
      const response = await this.client.get(`/crm/v3/objects/contacts/${externalId}`)
      return response.data
    } catch (error: any) {
      console.error('Failed to get contact from HubSpot:', error.message)
      return null
    }
  }

  /**
   * Get a pledge from HubSpot
   */
  async getPledge(externalId: string): Promise<any> {
    try {
      const response = await this.client.get(`/crm/v3/objects/deals/${externalId}`)
      return response.data
    } catch (error: any) {
      console.error('Failed to get pledge from HubSpot:', error.message)
      return null
    }
  }

  /**
   * Handle incoming webhook from HubSpot
   */
  async handleWebhook(event: IntegrationWebhookEvent): Promise<void> {
    try {
      // Verify webhook signature (important for security)
      // This should validate the webhook came from HubSpot

      console.log('Received HubSpot webhook:', {
        type: event.type,
        timestamp: event.timestamp,
      })

      // Handle different event types
      switch (event.type) {
        case 'contact.created':
        case 'contact.updated':
          // Update contact in local database with HubSpot data
          break
        case 'deal.created':
        case 'deal.updated':
          // Update pledge in local database with HubSpot data
          break
        case 'task.created':
          // Create activity in local database
          break
        default:
          console.log('Unknown webhook type:', event.type)
      }
    } catch (error: any) {
      console.error('Error handling HubSpot webhook:', error.message)
      throw error
    }
  }

  /**
   * Get the status of the HubSpot integration
   */
  async getStatus(): Promise<{
    connected: boolean
    lastSync?: Date
    error?: string
  }> {
    try {
      const connected = await this.testConnection()
      return {
        connected,
        lastSync: new Date(),
      }
    } catch (error: any) {
      return {
        connected: false,
        error: error.message,
      }
    }
  }

  /**
   * Helper: Map lead status to HubSpot lifecycle stage
   */
  private mapLeadStatusToHubSpot(status?: string): string {
    const mapping: Record<string, string> = {
      lead: 'lead',
      prospect: 'salesqualifiedlead',
      customer: 'customer',
      past_customer: 'customer',
    }
    return mapping[status || 'lead'] || 'lead'
  }

  /**
   * Helper: Map pledge status to HubSpot deal stage
   */
  private mapPledgeStatusToHubSpot(status: string): string {
    const mapping: Record<string, string> = {
      pending: 'qualifiedtobuy',
      received: 'closedwon',
      failed: 'closedlost',
    }
    return mapping[status] || 'qualifiedtobuy'
  }

  /**
   * Helper: Map activity type to HubSpot task type
   */
  private mapActivityTypeToHubSpot(type: string): string {
    const mapping: Record<string, string> = {
      call: 'CALL',
      email: 'EMAIL',
      meeting: 'MEETING',
      note: 'NOTE',
    }
    return mapping[type] || 'NOTE'
  }
}
