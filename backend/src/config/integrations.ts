/**
 * Integration Configuration
 * Centralized configuration for all CRM integrations
 */

export interface IntegrationConfigType {
  hubspot: {
    enabled: boolean
    apiKey: string
    syncMode: 'real-time' | 'batch' | 'manual'
    autoSyncOnCreate: {
      contacts: boolean
      pledges: boolean
      activities: boolean
    }
  }
  salesforce?: {
    enabled: boolean
    apiKey: string
  }
}

export const getIntegrationConfig = (): IntegrationConfigType => {
  return {
    hubspot: {
      enabled: process.env.HUBSPOT_ENABLED === 'true',
      apiKey: process.env.HUBSPOT_API_KEY || '',
      syncMode: (process.env.HUBSPOT_SYNC_MODE as any) || 'manual',
      autoSyncOnCreate: {
        contacts: process.env.HUBSPOT_AUTO_SYNC_CONTACTS === 'true',
        pledges: process.env.HUBSPOT_AUTO_SYNC_PLEDGES === 'true',
        activities: process.env.HUBSPOT_AUTO_SYNC_ACTIVITIES === 'true',
      },
    },
  }
}

export const isIntegrationEnabled = (integration: string): boolean => {
  const config = getIntegrationConfig()
  return (config as any)[integration]?.enabled || false
}

export const getIntegrationApiKey = (integration: string): string => {
  const config = getIntegrationConfig()
  return (config as any)[integration]?.apiKey || ''
}
