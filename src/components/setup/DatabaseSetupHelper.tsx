
import React, { useEffect, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { checkRequiredTables, getSetupInstructions } from '@/utils/dbSetup';

const DatabaseSetupHelper = () => {
  const [missingTables, setMissingTables] = useState<string[]>([]);
  const [isChecking, setIsChecking] = useState(true);
  
  useEffect(() => {
    checkDatabaseSetup();
  }, []);
  
  const checkDatabaseSetup = async () => {
    setIsChecking(true);
    try {
      const { hasPriceTiersTable } = await checkRequiredTables();
      
      const missing = [];
      if (!hasPriceTiersTable) missing.push('price_tiers');
      
      setMissingTables(missing);
    } catch (error) {
      console.error('Failed to check database setup:', error);
    } finally {
      setIsChecking(false);
    }
  };
  
  if (isChecking) {
    return (
      <Alert className="bg-blue-50 border-blue-200">
        <AlertCircle className="h-4 w-4 text-blue-500" />
        <AlertTitle>Checking database setup...</AlertTitle>
        <AlertDescription>
          Checking if all required database tables are set up properly.
        </AlertDescription>
      </Alert>
    );
  }
  
  if (missingTables.length === 0) {
    return (
      <Alert className="bg-green-50 border-green-200">
        <CheckCircle2 className="h-4 w-4 text-green-500" />
        <AlertTitle>Database setup complete</AlertTitle>
        <AlertDescription>
          All required database tables exist and are set up correctly.
        </AlertDescription>
      </Alert>
    );
  }
  
  return (
    <Alert className="bg-amber-50 border-amber-200">
      <AlertCircle className="h-4 w-4 text-amber-500" />
      <AlertTitle>Database setup required</AlertTitle>
      <AlertDescription className="space-y-4">
        <p>The following tables need to be created in your Supabase project:</p>
        <ul className="list-disc pl-5 space-y-1">
          {missingTables.map(table => (
            <li key={table}><code>{table}</code></li>
          ))}
        </ul>
        <p>Please run the SQL setup script in your Supabase SQL Editor to create these tables.</p>
        <p>You can find the SQL script at: <code>src/sql/price_tiers_setup.sql</code></p>
        <div className="flex justify-end">
          <Button 
            variant="outline" 
            className="mt-2"
            onClick={checkDatabaseSetup}
          >
            Re-check Setup
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
};

export default DatabaseSetupHelper;
