import { supabase } from '../integrations/supabase/client';

declare global {
  interface Window {
    google: any;
    gapi: any;
  }
}

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
        client_id: process.env.GOOGLE_CLIENT_ID || 'your-google-client-id',
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

export const signInWithGooglePopup = async () => {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    });
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error signing in with Google:', error);
    throw error;
  }
};
