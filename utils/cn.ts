// Utility function to conditionally join classNames
// This is a simple implementation without external dependencies
export function cn(...inputs: (string | undefined | null | boolean)[]) {
  return inputs.filter(Boolean).join(' ');
}

// Helper function for responsive breakpoints
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

// Check if we're in a browser environment
export const isBrowser = typeof window !== 'undefined'; 