
import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

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
  const { toast } = useToast();
  
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
      
      // Now run the actual Virginia query
      const { data, error, count: resultCount } = await supabase
        .from('service_zip_codes')
        .select('city, state_id, zip', { count: 'exact' })
        .eq('state_name', 'Virginia')
        .limit(10);
      
      if (error) {
        throw new Error(`Query error: ${error.message}`);
      }
      
      console.log('Virginia query results:', data);
      console.log('Result count:', resultCount);
      
      setResults(data || []);
      setCount(resultCount);
      
      toast({
        title: "Query Successful",
        description: `Found ${resultCount} locations in Virginia (showing first 10)`,
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
  
  return (
    <div className="p-4 border rounded-lg bg-white shadow-sm">
      <div className="flex items-center gap-4 mb-4">
        <h3 className="text-lg font-medium">Database Query Test</h3>
        <Button 
          onClick={runQuery} 
          disabled={loading}
          className="ml-auto"
        >
          {loading ? 'Running Query...' : 'Query Virginia Locations'}
        </Button>
      </div>
      
      {error && (
        <div className="p-3 mb-4 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          <strong>Error:</strong> {error}
        </div>
      )}
      
      {count !== null && (
        <div className="mb-2 text-sm text-gray-500">
          Found {count} locations in Virginia (showing first 10)
        </div>
      )}
      
      {results.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="p-2 text-left border border-gray-200">ZIP</th>
                <th className="p-2 text-left border border-gray-200">City</th>
                <th className="p-2 text-left border border-gray-200">State</th>
              </tr>
            </thead>
            <tbody>
              {results.map((location, index) => (
                <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
                  <td className="p-2 border border-gray-200">{location.zip}</td>
                  <td className="p-2 border border-gray-200">{location.city}</td>
                  <td className="p-2 border border-gray-200">{location.state_id}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default TestQueryButton;
