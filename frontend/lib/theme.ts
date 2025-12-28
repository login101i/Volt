/**
 * Theme Configuration
 * Centralized colors and typography for consistent UI across the application
 */

export const theme = {
  colors: {
    // Primary color - Main actions, primary buttons
    primary: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6', // Main primary
      600: '#2563eb', // Hover state
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
    },
    
    // Secondary color - Secondary actions, info buttons
    secondary: {
      50: '#f5f3ff',
      100: '#ede9fe',
      200: '#ddd6fe',
      300: '#c4b5fd',
      400: '#a78bfa',
      500: '#8b5cf6', // Main secondary
      600: '#7c3aed', // Hover state
      700: '#6d28d9',
      800: '#5b21b6',
      900: '#4c1d95',
    },
    
    // Success color - Success actions, confirm buttons
    success: {
      50: '#f0fdf4',
      100: '#dcfce7',
      200: '#bbf7d0',
      300: '#86efac',
      400: '#4ade80',
      500: '#22c55e', // Main success
      600: '#16a34a', // Hover state
      700: '#15803d',
      800: '#166534',
      900: '#14532d',
    },
    
    // Neutral colors - Backgrounds, borders, text
    neutral: {
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827',
    },
    
    // Danger color - Delete, destructive actions
    danger: {
      50: '#fef2f2',
      100: '#fee2e2',
      200: '#fecaca',
      300: '#fca5a5',
      400: '#f87171',
      500: '#ef4444', // Main danger
      600: '#dc2626', // Hover state
      700: '#b91c1c',
      800: '#991b1b',
      900: '#7f1d1d',
    },
  },
  
  typography: {
    fontFamily: {
      sans: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'sans-serif'],
    },
    fontSize: {
      xs: '0.75rem',    // 12px
      sm: '0.875rem',   // 14px
      base: '1rem',     // 16px
      lg: '1.125rem',   // 18px
      xl: '1.25rem',    // 20px
      '2xl': '1.5rem',  // 24px
      '3xl': '1.875rem', // 30px
    },
  },
  
  spacing: {
    // Common spacing values
    xs: '0.25rem',   // 4px
    sm: '0.5rem',    // 8px
    md: '1rem',      // 16px
    lg: '1.5rem',    // 24px
    xl: '2rem',      // 32px
  },
} as const;

/**
 * Button style presets for consistent button styling
 * Using 3 main colors for better UX:
 * - Primary (blue): Main actions, primary buttons
 * - Secondary (purple): Secondary actions
 * - Success (green): Positive actions (Add, Save, Generate)
 */
export const buttonStyles = {
  primary: 'bg-blue-600 hover:bg-blue-700 text-white',
  secondary: 'bg-purple-600 hover:bg-purple-700 text-white',
  success: 'bg-green-600 hover:bg-green-700 text-white',
  danger: 'bg-red-600 hover:bg-red-700 text-white',
  neutral: 'bg-gray-500 hover:bg-gray-600 text-white',
  outline: 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50',
} as const;

/**
 * Helper function to get Tailwind classes for buttons
 */
export const getButtonClass = (variant: keyof typeof buttonStyles, additionalClasses?: string) => {
  const baseClasses = 'px-4 py-1.5 rounded-lg font-medium text-sm transition-colors';
  return `${baseClasses} ${buttonStyles[variant]} ${additionalClasses || ''}`.trim();
};

/**
 * Color classes for backgrounds and highlights
 */
export const colorClasses = {
  primary: {
    bg: 'bg-primary-50',
    bgHover: 'hover:bg-primary-50',
    text: 'text-primary-700',
    border: 'border-primary-200',
  },
  secondary: {
    bg: 'bg-secondary-50',
    bgHover: 'hover:bg-secondary-50',
    text: 'text-secondary-700',
    border: 'border-secondary-200',
  },
  success: {
    bg: 'bg-success-50',
    bgHover: 'hover:bg-success-50',
    text: 'text-success-700',
    border: 'border-success-200',
  },
} as const;










