/**
 * Theme Configuration — aligned with GlobalStyleProvider / volt-theme.css
 */

export const theme = {
  colors: {
    primary: {
      50: '#f7f1e4',
      100: '#efe2c4',
      200: '#e3b760',
      300: '#d4a84a',
      400: '#c4963a',
      500: '#e3b760',
      600: '#a36714',
      700: '#78521c',
      800: '#5c3f16',
      900: '#3d2a0f',
    },
    secondary: {
      50: '#e8f0ef',
      100: '#c5d8d6',
      200: '#90b4b1',
      300: '#6a9693',
      400: '#4f7a77',
      500: '#41646a',
      600: '#36484a',
      700: '#253134',
      800: '#1d2628',
      900: '#121719',
    },
    success: {
      50: '#e8f8f0',
      100: '#c5ecd8',
      200: '#6ecf9b',
      300: '#4cba82',
      400: '#36a56c',
      500: '#2e7d32',
      600: '#256628',
      700: '#1c4f1f',
      800: '#143816',
      900: '#0c220d',
    },
    neutral: {
      50: '#f0f5f3',
      100: '#e7eae5',
      200: '#cdd6d0',
      300: '#a8b9b6',
      400: '#90b4b1',
      500: '#566a68',
      600: '#36484a',
      700: '#253134',
      800: '#1d2628',
      900: '#121719',
    },
    danger: {
      50: '#fce8e8',
      100: '#f5c4c4',
      200: '#e57373',
      300: '#d95353',
      400: '#c62828',
      500: '#c62828',
      600: '#a61f1f',
      700: '#861919',
      800: '#661313',
      900: '#460d0d',
    },
  },

  typography: {
    fontFamily: {
      sans: [
        'Inter',
        'ui-sans-serif',
        'system-ui',
        '-apple-system',
        'Segoe UI',
        'Arial',
        'sans-serif',
      ],
    },
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
    },
  },

  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
  },
} as const;

/**
 * Button presets — Volt industrial language
 */
export const buttonStyles = {
  primary: 'volt-btn',
  secondary: 'volt-btn volt-btn--secondary',
  success: 'volt-btn',
  danger: 'volt-btn volt-btn--danger',
  neutral: 'volt-btn volt-btn--ghost',
  outline: 'volt-btn volt-btn--secondary',
} as const;

export const getButtonClass = (
  variant: keyof typeof buttonStyles,
  additionalClasses?: string
) => {
  const baseClasses = 'text-sm transition-colors';
  return `${baseClasses} ${buttonStyles[variant]} ${additionalClasses || ''}`.trim();
};

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
