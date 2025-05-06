
import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';

interface LocationResult {
  city: string;
  state_id: string;
  zip: string;
}

const TestQueryButton = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<LocationResult[]>([]);
  const [count, setCount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<string | null>(null);
  const { toast } = useToast();
  
  const testConnection = async () => {
    setConnectionStatus("Testing connection...");
    try {
      // Simple ping test - just fetch a single row to test connection
      const { data, error } = await supabase
        .from('service_zip_codes')
        .select('id')
        .limit(1);
      
      if (error) {
        throw new Error(`Connection error: ${error.message}`);
      }
      
      setConnectionStatus(`✅ Connection successful! Found ${data ? data.length : 0} records.`);
      toast({
        title: "Connection Successful",
        description: "Database connection is working properly.",
      });
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      console.error('Connection test failed:', errorMessage);
      setConnectionStatus(`❌ Connection failed: ${errorMessage}`);
      
      toast({
        title: "Connection Failed",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };
  
  const runQuery = async () => {
    setLoading(true);
    setError(null);
    setResults([]);
    setCount(null);
    
    try {
      console.log('Running test query for Virginia locations...');
      
      // First check if we have any data at all
      const { count: totalCount, error: countError } = await supabase
        .from('service_zip_codes')
        .select('*', { count: 'exact', head: true });
        
      console.log('Total records in service_zip_codes:', totalCount);
      
      if (countError) {
        throw new Error(`Count error: ${countError.message}`);
      }
      
      // First try with state_name
      let { data, error, count: resultCount } = await supabase
        .from('service_zip_codes')
        .select('city, state_id, zip', { count: 'exact' })
        .eq('state_name', 'Virginia')
        .limit(10);
      
      console.log('Virginia query with state_name results:', data);
      
      // If no results and no error, try with state_id instead
      if ((!data || data.length === 0) && !error) {
        console.log('Trying with state_id instead...');
        const result = await supabase
          .from('service_zip_codes')
          .select('city, state_id, zip', { count: 'exact' })
          .eq('state_id', 'VA')
          .limit(10);
          
        data = result.data;
        error = result.error;
        resultCount = result.count;
        console.log('Virginia query with state_id results:', data);
      }
      
      if (error) {
        throw new Error(`Query error: ${error.message}`);
      }
      
      setResults(data || []);
      setCount(resultCount);
      
      const message = data && data.length > 0
        ? `Found ${resultCount} locations in Virginia (showing first ${data.length})`
        : "No locations found in Virginia. Database may be empty or state values may not match 'Virginia' or 'VA'";
      
      toast({
        title: data && data.length > 0 ? "Query Successful" : "No Results",
        description: message,
      });
      
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      console.error('Error running test query:', errorMessage);
      setError(errorMessage);
      
      toast({
        title: "Query Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Dump the supabase URL and key (without showing sensitive parts)
  const dumpConfig = () => {
    const supabaseUrl = supabase.supabaseUrl;
    // Only show first 10 chars of key for security
    const keyPreview = supabase.supabaseKey.substring(0, 10) + "...";
    
    setConnectionStatus(`URL: ${supabaseUrl}\nKey: ${keyPreview}`);
  };
  
  return (
    <div className="p-4 border rounded-lg bg-white shadow-sm">
      <div className="flex flex-col gap-4 mb-4">
        <h3 className="text-lg font-medium">Database Connection Test</h3>
        
        <div className="flex flex-wrap gap-2">
          <Button 
            onClick={testConnection} 
            variant="secondary"
            disabled={loading}
            className="flex-none"
          >
            Test Connection
          </Button>
          
          <Button 
            onClick={runQuery} 
            disabled={loading}
            className="flex-none"
          >
            {loading ? 'Running Query...' : 'Query Virginia Locations'}
          </Button>
          
          <Button 
            onClick={dumpConfig}
            variant="outline" 
            className="flex-none"
          >
            Show Config
          </Button>
        </div>
        
        {connectionStatus && (
          <div className="p-3 bg-slate-50 border border-slate-200 rounded text-sm font-mono whitespace-pre-wrap">
            {connectionStatus}
          </div>
        )}
      </div>
      
      {error && (
        <div className="p-3 mb-4 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          <strong>Error:</strong> {error}
        </div>
      )}
      
      {count !== null && (
        <div className="mb-2 text-sm text-gray-500">
          Found {count} locations in Virginia (showing first {results.length})
        </div>
      )}
      
      {results.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ZIP</TableHead>
              <TableHead>City</TableHead>
              <TableHead>State</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {results.map((location, index) => (
              <TableRow key={index}>
                <TableCell>{location.zip}</TableCell>
                <TableCell>{location.city}</TableCell>
                <TableCell>{location.state_id}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : count === 0 ? (
        <div className="p-4 text-center text-gray-500">
          No results found. The database query executed successfully but returned no data.
        </div>
      ) : null}
    </div>
  );
};

export default TestQueryButton;
