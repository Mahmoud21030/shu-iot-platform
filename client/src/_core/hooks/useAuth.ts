// Simplified auth hook for standalone deployment (no OAuth required)
// This version always returns unauthenticated state since the platform
// is public and doesn't require authentication

export function useAuth() {
  return {
    user: null,
    loading: false,
    error: null,
    isAuthenticated: false,
    logout: () => {},
    refresh: () => Promise.resolve({ data: null }),
  };
}
