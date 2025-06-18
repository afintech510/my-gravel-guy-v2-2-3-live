
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: Date;
  rateLimitHeaders: Record<string, string>;
}

// Default rate limit configurations for different endpoints
export const RATE_LIMIT_CONFIGS = {
  'create-payment': { windowMs: 60000, maxRequests: 10 }, // 10 requests per minute
  'verify-payment': { windowMs: 60000, maxRequests: 20 }, // 20 requests per minute
  'send-email': { windowMs: 60000, maxRequests: 5 }, // 5 requests per minute
  'send-sms': { windowMs: 60000, maxRequests: 3 }, // 3 requests per minute
  'voice-response': { windowMs: 60000, maxRequests: 30 }, // 30 requests per minute (webhook)
};

export async function checkRateLimit(
  functionName: string,
  clientId: string,
  config?: RateLimitConfig
): Promise<RateLimitResult> {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );

  const rateLimitConfig = config || RATE_LIMIT_CONFIGS[functionName] || { windowMs: 60000, maxRequests: 10 };
  const now = new Date();
  const windowStart = new Date(now.getTime() - rateLimitConfig.windowMs);

  console.log(`Rate limiting check for ${functionName}, client: ${clientId}`);

  try {
    // Clean up old entries first
    await supabase
      .from('rate_limits')
      .delete()
      .lt('created_at', windowStart.toISOString());

    // Count current requests in the window
    const { data: existingRequests, error: countError } = await supabase
      .from('rate_limits')
      .select('*', { count: 'exact' })
      .eq('client_id', clientId)
      .eq('function_name', functionName)
      .gte('created_at', windowStart.toISOString());

    if (countError) {
      console.error('Error counting rate limit requests:', countError);
      // On error, allow the request but log it
      return {
        allowed: true,
        remaining: rateLimitConfig.maxRequests - 1,
        resetTime: new Date(now.getTime() + rateLimitConfig.windowMs),
        rateLimitHeaders: {
          'X-RateLimit-Limit': rateLimitConfig.maxRequests.toString(),
          'X-RateLimit-Remaining': (rateLimitConfig.maxRequests - 1).toString(),
          'X-RateLimit-Reset': new Date(now.getTime() + rateLimitConfig.windowMs).toISOString()
        }
      };
    }

    const currentCount = existingRequests?.length || 0;
    const remaining = Math.max(0, rateLimitConfig.maxRequests - currentCount - 1);
    const resetTime = new Date(now.getTime() + rateLimitConfig.windowMs);

    const rateLimitHeaders = {
      'X-RateLimit-Limit': rateLimitConfig.maxRequests.toString(),
      'X-RateLimit-Remaining': remaining.toString(),
      'X-RateLimit-Reset': resetTime.toISOString()
    };

    if (currentCount >= rateLimitConfig.maxRequests) {
      console.log(`Rate limit exceeded for ${functionName}, client: ${clientId}. Count: ${currentCount}`);
      return {
        allowed: false,
        remaining: 0,
        resetTime,
        rateLimitHeaders: {
          ...rateLimitHeaders,
          'X-RateLimit-Remaining': '0'
        }
      };
    }

    // Record this request
    const { error: insertError } = await supabase
      .from('rate_limits')
      .insert({
        client_id: clientId,
        function_name: functionName,
        created_at: now.toISOString()
      });

    if (insertError) {
      console.error('Error recording rate limit request:', insertError);
      // On error, still allow the request
    }

    console.log(`Rate limit check passed for ${functionName}, client: ${clientId}. Remaining: ${remaining}`);

    return {
      allowed: true,
      remaining,
      resetTime,
      rateLimitHeaders
    };

  } catch (error) {
    console.error('Rate limiting error:', error);
    // On any error, allow the request to prevent blocking legitimate users
    return {
      allowed: true,
      remaining: rateLimitConfig.maxRequests - 1,
      resetTime: new Date(now.getTime() + rateLimitConfig.windowMs),
      rateLimitHeaders: {
        'X-RateLimit-Limit': rateLimitConfig.maxRequests.toString(),
        'X-RateLimit-Remaining': (rateLimitConfig.maxRequests - 1).toString(),
        'X-RateLimit-Reset': new Date(now.getTime() + rateLimitConfig.windowMs).toISOString()
      }
    };
  }
}

export function getClientId(req: Request): string {
  // Try to get authenticated user ID first
  const authHeader = req.headers.get('authorization');
  if (authHeader) {
    try {
      // Extract user ID from JWT if available
      const token = authHeader.replace('Bearer ', '');
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.sub) {
        return `user_${payload.sub}`;
      }
    } catch (error) {
      // If JWT parsing fails, fall back to IP
    }
  }

  // Fall back to IP address
  const forwardedFor = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');
  const cfConnectingIp = req.headers.get('cf-connecting-ip');
  
  const clientIp = forwardedFor?.split(',')[0]?.trim() || 
                   realIp || 
                   cfConnectingIp || 
                   'unknown';
                   
  return `ip_${clientIp}`;
}
