// This mock API simulates the backend structure for the authentication flow.
// The backend developer can replace these with actual fetch() calls to their Spring Boot endpoints.

export interface AuthResponse {
  success: boolean;
  message: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: any;
}

export const mockAuthApi = {
  // Simulate checking if an email exists for a staff member
  checkEmail: async (email: string): Promise<AuthResponse> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        if (email.includes('admin') || email.includes('staff')) {
          resolve({ success: true, message: 'Email found. Proceed to OAuth.' });
        } else {
          resolve({ success: false, message: 'Email not found in whitelist.' });
        }
      }, 800);
    });
  },

  // Simulate a Discord OAuth redirect and subsequent callback data
  simulateDiscordOAuth: async (role: string): Promise<AuthResponse> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          message: 'OAuth successful',
          data: {
            user: {
              id: '812093847561',
              username: 'RNG_Command',
              avatar: 'https://cdn.discordapp.com/embed/avatars/0.png',
              role: role,
              whitelisted: true,
              permissions: ['SERVER_MANAGE_ALL', 'BOT_MANAGE_ALL']
            }
          }
        });
      }, 1500);
    });
  }
};
