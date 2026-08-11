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

  async submitRegister(email: string, username: string, password?: string): Promise<AuthResponse> {
    console.log("Mock API Call: submitRegister", email, username, !!password);
    await new Promise(r => setTimeout(r, 600)); 
    return { success: true };
  },

  async connectDiscord(role: string): Promise<AuthResponse> {
    console.log("Mock API Call: connectDiscord", role);
    await new Promise(r => setTimeout(r, 800)); 
    return { success: true };
  },

  async logout(): Promise<AuthResponse> {
    console.log("Mock API Call: logout");
    await new Promise(r => setTimeout(r, 400));
    return { success: true };
  }
};
