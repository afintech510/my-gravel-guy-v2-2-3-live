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

  static async resetPasswordAndSignIn(email: string, newPassword: string, phone: string): Promise<{
    success: boolean;
    user?: any;
    error?: string;
  }> {
    try {
      console.log('=== PASSWORD RESET FLOW ===');
      console.log('Initiating password reset for:', email);
      
      // Store phone temporarily for the reset process
      localStorage.setItem('temp_checkout_phone', phone);
      
      // Step 1: Trigger password reset
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/auth/reset-password'
      });
      
      if (resetError) {
        console.error('Password reset request failed:', resetError);
        // Clean up on failure
        localStorage.removeItem('temp_checkout_phone');
        throw resetError;
      }
      
      console.log('Password reset email sent successfully');
      
      // For frictionless checkout, we return success but let the user know about the email
      return {
        success: true,
        error: 'Password reset email sent. Please check your email to complete the process, or contact support for immediate assistance.'
      };
      
    } catch (error) {
      console.error('Password reset flow failed:', error);
      localStorage.removeItem('temp_checkout_phone');
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Password reset failed'
      };
    }
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
      
      console.log('Sign in failed, checking error type...');
      console.log('Sign in error:', signInError);
      
      // Check if the error is "Invalid login credentials" which likely means user exists but wrong password
      if (signInError?.message?.includes('Invalid login credentials')) {
        console.log('Invalid credentials detected - user likely exists with different password');
        console.log('Attempting password reset approach...');
        
        const resetResult = await this.resetPasswordAndSignIn(authData.email, password, authData.phone);
        
        if (resetResult.success) {
          return {
            success: false, // We return false because they need to check their email
            error: resetResult.error // This contains the user-friendly message about checking email
          };
        }
        
        // If reset approach fails, continue with account creation attempt
        console.log('Password reset approach failed, continuing with account creation...');
      }
      
      // If sign in fails for other reasons, try to create a new account
      console.log('Attempting to create new account...');
      
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
        
        // If the account already exists but password is wrong, provide helpful message
        if (signUpError.message?.includes('already registered')) {
          console.log('Account exists - initiating password reset');
          
          // Try the reset approach as a last resort
          const resetResult = await this.resetPasswordAndSignIn(authData.email, password, authData.phone);
          
          return {
            success: false,
            error: resetResult.error || 'An account with this email already exists. Please check your email for password reset instructions.'
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
