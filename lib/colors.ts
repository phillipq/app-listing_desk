/**
 * Centralized Color System for the Realtor App
 * 
 * This file defines all the colors used throughout the application
 * to ensure consistency and easy maintenance.
 */

// Primary Color Palette (Sophisticated)
export const colors = {
  // Simple 4-Color Palette
  primary: {
    buff: {
      50: '#fdf7f2',
      100: '#f9ede0',
      200: '#f2d9c0',
      300: '#e7a573',
      400: '#e7a573',
      500: '#e7a573',
      600: '#e7a573',
      700: '#e7a573',
      800: '#e7a573',
      900: '#e7a573',
    },
    keppel: {
      50: '#f0f8f7',
      100: '#d9f0ed',
      200: '#b3e1db',
      300: '#5aa197',
      400: '#5aa197',
      500: '#5aa197',
      600: '#5aa197',
      700: '#5aa197',
      800: '#5aa197',
      900: '#5aa197',
    },
    seasalt: {
      50: '#fafafa',
      100: '#fafafa',
      200: '#fafafa',
      300: '#fafafa',
      400: '#fafafa',
      500: '#fafafa',
      600: '#fafafa',
      700: '#fafafa',
      800: '#fafafa',
      900: '#fafafa',
    },
    gray: {
      50: '#f5f5f5',
      100: '#e5e5e5',
      200: '#cccccc',
      300: '#999999',
      400: '#7b7b7b',
      500: '#7b7b7b',
      600: '#7b7b7b',
      700: '#7b7b7b',
      800: '#7b7b7b',
      900: '#7b7b7b',
    },
  },

  // Neutral Colors
  neutral: {
    slate: {
      50: '#f8fafc',
      100: '#dee2e6',
      200: '#cbd3da',
      300: '#a8b8d8',
      400: '#8392ab',
      500: '#67748e',
      600: '#627594',
      700: '#344767',
      800: '#3a416f',
      900: '#0f172a',
    },
    gray: {
      50: '#f8f9fa',
      100: '#ebeff4',
      200: '#e9ecef',
      300: '#d2d6da',
      400: '#ced4da',
      500: '#adb5bd',
      600: '#6c757d',
      700: '#495057',
      800: '#252f40',
      900: '#141727',
    },
  },

  // Status Colors
  status: {
    success: '#22c55e',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
  },
} as const

// Semantic Color Mappings
export const semanticColors = {
  // Text Colors - Using new 4-color palette
  text: {
    primary: 'text-gray-700',
    secondary: 'text-gray-700',
    muted: 'text-gray-500',
    inverse: 'text-seasalt-500',
  },

  // Background Colors
  background: {
    primary: 'bg-seasalt-50',
    secondary: 'bg-seasalt-500',
    accent: 'bg-keppel-500',
  },

  // Button Colors - Solid colors only, no gradients
  button: {
    primary: 'bg-keppel-500 text-seasalt-500 hover:shadow-soft-md focus:ring-2 focus:ring-keppel-500',
    secondary: 'bg-seasalt-500 text-gray-700 border border-gray-200 hover:bg-gray-50 hover:shadow-soft-md',
    success: 'bg-buff-500 text-seasalt-500 hover:shadow-soft-md focus:ring-2 focus:ring-buff-500',
    warning: 'bg-buff-500 text-seasalt-500 hover:shadow-soft-md focus:ring-2 focus:ring-buff-500',
    danger: 'bg-buff-500 text-seasalt-500 hover:shadow-soft-md focus:ring-2 focus:ring-buff-500',
    info: 'bg-keppel-500 text-seasalt-500 hover:shadow-soft-md focus:ring-2 focus:ring-keppel-500',
  },

  // Card Colors
  card: {
    default: 'bg-seasalt-500 rounded-xl shadow-soft-lg border border-gray-100',
    elevated: 'bg-seasalt-500 rounded-xl shadow-soft-xl border border-gray-100',
  },

  // Input Colors
  input: {
    default: 'px-3 py-2 border border-gray-200 rounded-xl shadow-soft-sm focus:ring-2 focus:ring-keppel-500 focus:border-keppel-500 transition-all duration-200',
  },

  // Loading Spinner Colors
  spinner: {
    primary: 'border-keppel-500',
    secondary: 'border-gray-300',
  },
} as const

// Color Usage Guidelines
export const colorGuidelines = {
  // Primary Actions
  primaryAction: 'cerulean',
  
  // Secondary Actions  
  secondaryAction: 'verdigris',
  
  // Warning/Danger Actions
  warningAction: 'eggplant',
  dangerAction: 'licorice',
  
  // Info Actions
  infoAction: 'indigo',
  
  // Navigation
  navigation: {
    active: 'cerulean',
    hover: 'verdigris',
  },
  
  // Status Indicators
  status: {
    success: 'verdigris',
    warning: 'eggplant', 
    error: 'licorice',
    info: 'indigo',
  },
} as const

// Helper function to get color classes
export function getColorClasses(type: keyof typeof semanticColors, variant?: string): string {
  const colorMap = semanticColors[type]
  
  if (typeof colorMap === 'object' && variant) {
    return colorMap[variant as keyof typeof colorMap] || ''
  }
  
  return typeof colorMap === 'string' ? colorMap : ''
}

// Helper function to get gradient classes
export function getGradientClasses(color: keyof typeof colors.primary): string {
  return `bg-gradient-${color}`
}

// Type for shade values
type ShadeValue = keyof typeof colors.primary.buff

// Helper function to get text color classes
export function getTextColorClasses(
  color: keyof typeof colors.primary, 
  shade: ShadeValue = ('700' as unknown as ShadeValue)
): string {
  return `text-${String(color)}-${String(shade)}`
}

// Helper function to get background color classes
export function getBackgroundColorClasses(
  color: keyof typeof colors.primary, 
  shade: ShadeValue = ('500' as unknown as ShadeValue)
): string {
  return `bg-${String(color)}-${String(shade)}`
}
