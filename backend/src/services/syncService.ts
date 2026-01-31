/**
 * Sync Service
 * Orchestrates syncing data between local CRM and external integrations
 */

import { HubSpotIntegration } from '../integrations/hubspot/hubspot'
import { CRMIntegration } from '../integrations/integration.interface'
import { getIntegrationConfig, isIntegrationEnabled } from '../config/integrations'
import { contactModel } from '../models/contact'
import { pledgeModel } from '../models/pledge'
import { activityModel } from '../models/activity'

export class SyncService {
  private integrations: Map<string, CRMIntegration> = new Map()

  constructor() {
    this.initializeIntegrations()
  }

  /**
   * Initialize all enabled integrations
   */
  private initializeIntegrations() {
    const config = getIntegrationConfig()

    if (config.hubspot.enabled && config.hubspot.apiKey) {
      try {
        const hubspotIntegration = new HubSpotIntegration(config.hubspot.apiKey)
        this.integrations.set('hubspot', hubspotIntegration)
        console.log('✅ HubSpot integration initialized')
      } catch (error: any) {
        console.error('❌ Failed to initialize HubSpot integration:', error.message)
      }
    }

    // Add more integrations here as they're implemented
    // e.g., Salesforce, Pipedrive, etc.
  }

  /**
   * Get an integration by name
   */
  getIntegration(name: string): CRMIntegration | null {
    return this.integrations.get(name) || null
  }

  /**
   * Check if an integration is available
   */
  isIntegrationAvailable(name: string): boolean {
    return this.integrations.has(name)
  }

  /**
   * Sync a contact to all enabled integrations
   */
  async syncContact(contactId: string) {
    try {
      const contact = await contactModel.getById(contactId)
      if (!contact) {
        throw new Error(`Contact ${contactId} not found`)
      }

      const results = []

      for (const [name, integration] of this.integrations) {
        try {
          const result = await integration.syncContact(contact)

          // Update contact with external ID
          if (result.success) {
            await contactModel.update(contactId, {
              [`${name}_contact_id`]: result.externalId,
              [`${name}_sync_status`]: 'synced',
              [`${name}_last_synced`]: new Date(),
            })
          } else {
            await contactModel.update(contactId, {
              [`${name}_sync_status`]: 'failed',
              [`${name}_sync_error`]: result.error,
            })
          }

          results.push({
            integration: name,
            ...result,
          })
        } catch (error: any) {
          console.error(`Failed to sync contact to ${name}:`, error.message)
          results.push({
            integration: name,
            success: false,
            error: error.message,
            externalId: '',
            timestamp: new Date(),
          })
        }
      }

      return results
    } catch (error: any) {
      console.error('Error in syncContact:', error.message)
      throw error
    }
  }

  /**
   * Sync a pledge to all enabled integrations
   */
  async syncPledge(pledgeId: string) {
    try {
      const pledge = await pledgeModel.getById(pledgeId)
      if (!pledge) {
        throw new Error(`Pledge ${pledgeId} not found`)
      }

      const results = []

      for (const [name, integration] of this.integrations) {
        try {
          const result = await integration.syncPledge(pledge)

          // Update pledge with external ID
          if (result.success) {
            await pledgeModel.update(pledgeId, {
              [`${name}_deal_id`]: result.externalId,
              [`${name}_sync_status`]: 'synced',
              [`${name}_last_synced`]: new Date(),
            })
          } else {
            await pledgeModel.update(pledgeId, {
              [`${name}_sync_status`]: 'failed',
              [`${name}_sync_error`]: result.error,
            })
          }

          results.push({
            integration: name,
            ...result,
          })
        } catch (error: any) {
          console.error(`Failed to sync pledge to ${name}:`, error.message)
          results.push({
            integration: name,
            success: false,
            error: error.message,
            externalId: '',
            timestamp: new Date(),
          })
        }
      }

      return results
    } catch (error: any) {
      console.error('Error in syncPledge:', error.message)
      throw error
    }
  }

  /**
   * Sync an activity to all enabled integrations
   */
  async syncActivity(activityId: string) {
    try {
      const activity = await activityModel.getById(activityId)
      if (!activity) {
        throw new Error(`Activity ${activityId} not found`)
      }

      const results = []

      for (const [name, integration] of this.integrations) {
        try {
          const result = await integration.syncActivity(activity)

          // Update activity with external ID (if needed)
          if (result.success) {
            // Store in a separate table or activity metadata
            console.log(`Activity synced to ${name}:`, result.externalId)
          }

          results.push({
            integration: name,
            ...result,
          })
        } catch (error: any) {
          console.error(`Failed to sync activity to ${name}:`, error.message)
          results.push({
            integration: name,
            success: false,
            error: error.message,
            externalId: '',
            timestamp: new Date(),
          })
        }
      }

      return results
    } catch (error: any) {
      console.error('Error in syncActivity:', error.message)
      throw error
    }
  }

  /**
   * Get sync status for all integrations
   */
  async getIntegrationStatuses() {
    const statuses = []

    for (const [name, integration] of this.integrations) {
      try {
        const status = await integration.getStatus()
        statuses.push({
          integration: name,
          ...status,
        })
      } catch (error: any) {
        statuses.push({
          integration: name,
          connected: false,
          error: error.message,
        })
      }
    }

    return statuses
  }

  /**
   * Test a specific integration connection
   */
  async testIntegration(name: string) {
    const integration = this.getIntegration(name)
    if (!integration) {
      throw new Error(`Integration ${name} not found`)
    }

    try {
      const connected = await integration.testConnection()
      return {
        integration: name,
        connected,
        timestamp: new Date(),
      }
    } catch (error: any) {
      return {
        integration: name,
        connected: false,
        error: error.message,
        timestamp: new Date(),
      }
    }
  }
}

// Export singleton instance
export const syncService = new SyncService()
