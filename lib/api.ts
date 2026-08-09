export interface AuthResponse {
  success: boolean;
  message?: string;
  isWhitelisted?: boolean;
}

// =====================================================================
// BACKEND API INTEGRATION 
// (Backend Developer: Replace the bodies of these functions with actual API calls)
// =====================================================================

export const api = {
  /**
   * Submit email for authentication
   */
  async submitEmailLogin(email: string): Promise<AuthResponse> {
    // TODO: Replace with your actual backend endpoint
    // Example: return await axios.post('/api/v1/auth/email', { email }).then(r => r.data);
    
    await new Promise(r => setTimeout(r, 600)); // Simulated network delay
    return { success: true, isWhitelisted: true };
  },

  /**
   * Submit Google OAuth login
   */
  async submitGoogleLogin(): Promise<AuthResponse> {
    // TODO: Replace with Google OAuth logic
    // Example: window.location.href = '/api/v1/auth/google';
    
    await new Promise(r => setTimeout(r, 600)); // Simulated network delay
    return { success: true, isWhitelisted: true };
  },

  /**
   * Connect Discord OAuth (Step 3)
   */
  async connectDiscord(): Promise<AuthResponse> {
    // TODO: Replace with Discord OAuth linking logic
    // Example: window.location.href = '/api/v1/auth/discord';
    
    await new Promise(r => setTimeout(r, 800)); // Simulated network delay
    return { success: true };
  }
};
