// Google OAuth configuration
const GOOGLE_CLIENT_ID = 'your-google-client-id.apps.googleusercontent.com';
const GOOGLE_REDIRECT_URI = window.location.origin;

interface GoogleUser {
  id: string;
  email: string;
  name: string;
  picture: string;
  given_name: string;
  family_name: string;
}

export class GoogleAuthService {
  private static instance: GoogleAuthService;
  
  public static getInstance(): GoogleAuthService {
    if (!GoogleAuthService.instance) {
      GoogleAuthService.instance = new GoogleAuthService();
    }
    return GoogleAuthService.instance;
  }

  async signInWithGoogle(): Promise<GoogleUser> {
    return new Promise((resolve, reject) => {
      // Load Google API
      if (!window.google) {
        this.loadGoogleAPI().then(() => {
          this.initializeGoogleAuth(resolve, reject);
        }).catch(reject);
      } else {
        this.initializeGoogleAuth(resolve, reject);
      }
    });
  }

  private async loadGoogleAPI(): Promise<void> {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = () => {
        window.gapi.load('auth2', () => {
          resolve();
        });
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  private initializeGoogleAuth(resolve: (user: GoogleUser) => void, reject: (error: any) => void): void {
    try {
      const auth2 = window.gapi.auth2.init({
        client_id: GOOGLE_CLIENT_ID,
        cookiepolicy: 'single_host_origin',
      });

      const authInstance = auth2.getAuthInstance();
      
      authInstance.signIn().then((googleUser: any) => {
        const profile = googleUser.getBasicProfile();
        const user: GoogleUser = {
          id: profile.getId(),
          email: profile.getEmail(),
          name: profile.getName(),
          picture: profile.getImageUrl(),
          given_name: profile.getGivenName(),
          family_name: profile.getFamilyName(),
        };
        resolve(user);
      }).catch(reject);
      
    } catch (error) {
      reject(error);
    }
  }

  async signOut(): Promise<void> {
    if (window.google && window.gapi) {
      const auth2 = window.gapi.auth2.getAuthInstance();
      if (auth2) {
        await auth2.signOut();
      }
    }
  }
}

// Fallback method using Google OAuth popup
export const signInWithGooglePopup = (): Promise<GoogleUser> => {
  return new Promise((resolve, reject) => {
    const clientId = 'your-google-client-id.apps.googleusercontent.com';
    const redirectUri = window.location.origin;
    
    // Create OAuth URL
    const authUrl = `https://accounts.google.com/oauth/authorize?` +
      `client_id=${clientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=code&` +
      `scope=openid%20email%20profile&` +
      `access_type=offline&` +
      `prompt=select_account`;

    // Open popup window
    const popup = window.open(
      authUrl,
      'google-auth',
      'width=500,height=600,scrollbars=yes,resizable=yes'
    );

    if (!popup) {
      reject(new Error('Popup blocked'));
      return;
    }

    // Listen for popup messages
    const messageListener = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      
      if (event.data.type === 'GOOGLE_AUTH_SUCCESS') {
        window.removeEventListener('message', messageListener);
        popup.close();
        resolve(event.data.user);
      } else if (event.data.type === 'GOOGLE_AUTH_ERROR') {
        window.removeEventListener('message', messageListener);
        popup.close();
        reject(new Error(event.data.error));
      }
    };

    window.addEventListener('message', messageListener);

    // Check if popup is closed manually
    const checkClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkClosed);
        window.removeEventListener('message', messageListener);
        reject(new Error('Authentication cancelled'));
      }
    }, 1000);
  });
};
