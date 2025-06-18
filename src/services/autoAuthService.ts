
import { supabase } from '@/integrations/supabase/client';

export interface AutoAuthData {
  email: string;
  phone: string;
  name: string;
}

export class AutoAuthService {
  private static generatePassword(phone: string): string {
    // Use phone number as password for simplicity
    // In production, you might want to add additional entropy
    return phone.replace(/\D/g, ''); // Remove non-digits
  }

  static async createAccountAndLogin(authData: AutoAuthData): Promise<{
    success: boolean;
    user?: any;
    error?: string;
    isNewAccount?: boolean;
  }> {
    try {
      console.log('=== AUTO AUTH SERVICE DEBUG ===');
      console.log('Starting auto-authentication for:', authData.email);
      
      const password = this.generatePassword(authData.phone);
      console.log('Generated password from phone:', password);
      
      // First, try to sign in with existing credentials
      console.log('Attempting to sign in with existing account...');
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: authData.email,
        password: password
      });
      
      if (signInData?.user && !signInError) {
        console.log('Successfully signed in with existing account:', signInData.user.email);
        
        // Wait for session to be established
        await this.waitForSession(5000);
        
        return {
          success: true,
          user: signInData.user,
          isNewAccount: false
        };
      }
      
      console.log('Sign in failed, attempting to create new account...');
      console.log('Sign in error:', signInError);
      
      // If sign in fails, create a new account
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: authData.email,
        password: password,
        options: {
          data: {
            name: authData.name,
            phone: authData.phone,
            auto_created: true,
            created_from: 'checkout'
          }
        }
      });
      
      if (signUpError) {
        console.error('Sign up failed:', signUpError);
        
        // If the account already exists but password is wrong, try to update it
        if (signUpError.message?.includes('already registered')) {
          console.log('Account exists but password mismatch. This is expected for frictionless checkout.');
          
          // For now, we'll treat this as a success and continue
          // In a production environment, you might want to handle this differently
          return {
            success: false,
            error: 'Account exists with different credentials. Please contact support.'
          };
        }
        
        throw signUpError;
      }
      
      if (!signUpData?.user) {
        throw new Error('Account creation succeeded but no user returned');
      }
      
      console.log('Successfully created new account:', signUpData.user.email);
      console.log('Account confirmation required:', !signUpData.user.email_confirmed_at);
      
      // Wait for session to be established
      await this.waitForSession(5000);
      
      // For frictionless checkout, we'll treat unconfirmed accounts as valid
      return {
        success: true,
        user: signUpData.user,
        isNewAccount: true
      };
      
    } catch (error) {
      console.error('Auto-authentication failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Authentication failed'
      };
    }
  }
  
  static async ensureAuthenticated(authData: AutoAuthData): Promise<{
    success: boolean;
    user?: any;
    error?: string;
    isNewAccount?: boolean;
  }> {
    // Check if user is already authenticated
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.user) {
      console.log('User already authenticated:', session.user.email);
      return {
        success: true,
        user: session.user,
        isNewAccount: false
      };
    }
    
    // If not authenticated, create account and login
    const result = await this.createAccountAndLogin(authData);
    
    if (result.success) {
      // Double-check that session is properly established
      const { data: { session: newSession } } = await supabase.auth.getSession();
      if (!newSession) {
        console.warn('Authentication succeeded but session not found');
        // Wait a bit more and try again
        await this.waitForSession(3000);
        const { data: { session: finalSession } } = await supabase.auth.getSession();
        if (!finalSession) {
          return {
            success: false,
            error: 'Authentication succeeded but session could not be established'
          };
        }
      }
    }
    
    return result;
  }

  // Helper method to wait for session to be established
  private static async waitForSession(timeoutMs: number = 5000): Promise<boolean> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeoutMs) {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        console.log('Session established for user:', session.user.email);
        return true;
      }
      
      // Wait 100ms before checking again
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.warn('Timed out waiting for session to be established');
    return false;
  }

  // Method to verify authentication state
  static async verifyAuthenticationState(): Promise<{
    isAuthenticated: boolean;
    user?: any;
    sessionId?: string;
  }> {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Error checking authentication state:', error);
      return { isAuthenticated: false };
    }
    
    return {
      isAuthenticated: !!session?.user,
      user: session?.user,
      sessionId: session?.access_token
    };
  }
}
