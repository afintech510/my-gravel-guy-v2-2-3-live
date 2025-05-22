
import { supabase } from '@/integrations/supabase/client';

/**
 * Check if required tables exist in the database
 * @returns Object with boolean flags for each required table
 */
export async function checkRequiredTables(): Promise<{
  hasPriceTiersTable: boolean;
}> {
  try {
    // Fix the type issue with a cast
    const { data: tables, error } = await supabase
      .rpc('get_tables') as unknown as {
        data: Array<{ table_name: string }> | null,
        error: Error | null
      };
      
    if (error) {
      console.error('Error checking database tables:', error);
      return { hasPriceTiersTable: false };
    }
    
    // Check if price_tiers table exists
    const hasPriceTiersTable = tables && tables.some((table) => 
      table.table_name === 'price_tiers'
    );
    
    return {
      hasPriceTiersTable: !!hasPriceTiersTable
    };
  } catch (error) {
    console.error('Failed to check database tables:', error);
    return { hasPriceTiersTable: false };
  }
}

/**
 * Display database setup instructions to the user
 * @param missingTables List of missing tables
 */
export function getSetupInstructions(missingTables: string[]): string {
  if (missingTables.length === 0) {
    return 'All required database tables exist. No setup needed.';
  }
  
  const instructions = `
# Database Setup Required

The following tables need to be created in your Supabase project:
${missingTables.map(table => `- ${table}`).join('\n')}

Please run the SQL setup script in your Supabase SQL Editor to create these tables.
You can find the SQL script at: \`src/sql/price_tiers_setup.sql\`
  `;
  
  return instructions;
}
