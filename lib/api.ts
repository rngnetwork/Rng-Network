export interface AuthResponse {
  success: boolean;
  message?: string;
  isWhitelisted?: boolean;
}

export const api = {
  async submitEmailLogin(email: string, password?: string): Promise<AuthResponse> {
    console.log("Mock API Call: submitEmailLogin", email, !!password);
    await new Promise(r => setTimeout(r, 600)); 
    return { success: true, isWhitelisted: true };
  },

  async submitGoogleLogin(): Promise<AuthResponse> {
    console.log("Mock API Call: submitGoogleLogin");
    await new Promise(r => setTimeout(r, 600)); 
    return { success: true, isWhitelisted: true };
  },

  async connectDiscord(role: any): Promise<AuthResponse> {
    console.log("Mock API Call: connectDiscord", role);
    await new Promise(r => setTimeout(r, 800)); 
    return { success: true };
  }
};
