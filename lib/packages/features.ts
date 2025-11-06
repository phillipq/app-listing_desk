/**
 * Feature Access Control
 * 
 * Defines which packages grant access to which features/pages
 */

export interface FeatureAccess {
  featureId: string
  pagePath: string
  requiredPackages: string[] // Package slugs (user needs at least one)
  description: string
}

export const FEATURE_ACCESS: FeatureAccess[] = [
  // Real Estate Features
  {
    featureId: 'properties',
    pagePath: '/realtor/properties',
    requiredPackages: ['real_estate'],
    description: 'Property management and listings'
  },
  {
    featureId: 'showing-tours',
    pagePath: '/realtor/showing-tours',
    requiredPackages: ['real_estate'],
    description: 'Showing tour planner'
  },
  {
    featureId: 'appointments',
    pagePath: '/realtor/appointments',
    requiredPackages: ['real_estate'],
    description: 'Appointment scheduling'
  },
  {
    featureId: 'customers-realtor',
    pagePath: '/realtor/customers',
    requiredPackages: ['real_estate'],
    description: 'Real estate customer management'
  },
  {
    featureId: 'services-realtor',
    pagePath: '/realtor/services',
    requiredPackages: ['real_estate'],
    description: 'Real estate services'
  },
  
  // Business Features
  {
    featureId: 'customers-business',
    pagePath: '/business/customers',
    requiredPackages: ['business'],
    description: 'Business customer management'
  },
  {
    featureId: 'services-business',
    pagePath: '/business/services',
    requiredPackages: ['business'],
    description: 'Business services management'
  },
  
  // Communications Features (Addon)
  {
    featureId: 'social-media-hub',
    pagePath: '/social-media-hub',
    requiredPackages: ['communications'],
    description: 'Social media management hub'
  },
  {
    featureId: 'whatsapp',
    pagePath: '/communications/whatsapp',
    requiredPackages: ['communications'],
    description: 'WhatsApp integration'
  },
  {
    featureId: 'instagram',
    pagePath: '/communications/instagram',
    requiredPackages: ['communications'],
    description: 'Instagram integration'
  },
  {
    featureId: 'facebook-groups',
    pagePath: '/realtor/properties/facebook-groups',
    requiredPackages: ['communications'],
    description: 'Facebook Groups integration'
  },
  
  // Shared Features (Available to both)
  {
    featureId: 'dashboard',
    pagePath: '/dashboard',
    requiredPackages: ['real_estate', 'business'], // Either package works
    description: 'Main dashboard'
  },
  {
    featureId: 'settings',
    pagePath: '/settings',
    requiredPackages: ['real_estate', 'business'],
    description: 'Account settings'
  }
]

/**
 * Get feature access requirements for a page
 */
export function getFeatureAccess(pagePath: string): FeatureAccess | undefined {
  return FEATURE_ACCESS.find(f => f.pagePath === pagePath)
}

/**
 * Get all features accessible with given packages
 */
export function getAccessibleFeatures(packageSlugs: string[]): FeatureAccess[] {
  return FEATURE_ACCESS.filter(feature =>
    feature.requiredPackages.some(slug => packageSlugs.includes(slug))
  )
}

