
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type TableName = 'products' | 'blog_posts' | 'blog_categories' | 'service_zip_codes' | 'delivery_locations' | 'location_search';

const ProductDatabaseTest = () => {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [tables, setTables] = useState<TableName[]>([]);
  const [tableInfo, setTableInfo] = useState<any>(null);

  const testConnection = async () => {
    setStatus('loading');
    setError(null);
    
    try {
      // Test 1: Try to query the products table directly
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .limit(10);
      
      if (productsError) {
        throw new Error(`Failed to query products table: ${productsError.message}`);
      }

      // Get list of tables by querying each known table
      const tablesToCheck: TableName[] = ['products', 'blog_posts', 'blog_categories', 'service_zip_codes', 'delivery_locations', 'location_search'];
      const availableTables: TableName[] = [];

      for (const table of tablesToCheck) {
        const { error: checkError } = await supabase
          .from(table)
          .select('id')
          .limit(1);
        
        // If no error, table exists and is accessible
        if (!checkError) {
          availableTables.push(table);
        }
      }

      setTables(availableTables);
      
      // Get column information for products table if it exists
      if (availableTables.includes('products')) {
        try {
          // Fix: Use explicitly typed parameters for the RPC call
          const { data: columnData } = await supabase
            .rpc('get_table_info', { table_name: 'products' as string });
          
          if (columnData) {
            setTableInfo(columnData);
          }
        } catch (columnsErr) {
          console.warn('Could not get column info:', columnsErr);
        }
      }
      
      setResult({
        productsCount: productsData?.length || 0,
        products: productsData || []
      });
      
      setStatus('success');
    } catch (err) {
      console.error('Database test failed:', err);
      setError(err instanceof Error ? err.message : String(err));
      setStatus('error');
    }
  };

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="text-xl">Product Database Connection Test</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {status === 'idle' && (
            <p className="text-gray-500">Click the button below to test the database connection.</p>
          )}
          
          <Button 
            onClick={testConnection} 
            disabled={status === 'loading'}
            className="mb-4"
          >
            {status === 'loading' ? 'Testing...' : 'Test Database Connection'}
          </Button>
          
          {status === 'loading' && <p>Testing connection...</p>}
          
          {status === 'error' && (
            <Alert variant="destructive">
              <AlertDescription className="whitespace-pre-wrap">
                {error}
              </AlertDescription>
            </Alert>
          )}
          
          {status === 'success' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium">Available Tables</h3>
                {tables.length > 0 ? (
                  <ul className="list-disc pl-6 mt-2">
                    {tables.map(table => (
                      <li key={table}>{table}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500 mt-2">No tables found in public schema</p>
                )}
              </div>
              
              <div>
                <h3 className="text-lg font-medium">Products Table</h3>
                {result?.productsCount > 0 ? (
                  <div className="mt-2">
                    <p className="text-green-600 font-medium">✓ Found {result.productsCount} products</p>
                    <pre className="bg-gray-100 p-4 rounded mt-2 text-xs max-h-72 overflow-auto">
                      {JSON.stringify(result.products, null, 2)}
                    </pre>
                  </div>
                ) : (
                  <div className="mt-2">
                    <p className="text-amber-600">⚠ No products found in database</p>
                    <p className="text-gray-500 mt-1 text-sm">
                      The products table exists but contains no records, which is why sample products are being shown.
                    </p>
                    {tables.includes('products') ? (
                      <p className="text-gray-500 mt-1 text-sm">
                        You need to add products to the database or check if there are any RLS (Row Level Security) policies restricting access.
                      </p>
                    ) : (
                      <p className="text-red-500 mt-1 text-sm">
                        The products table doesn't exist in the database. Please check your database setup.
                      </p>
                    )}
                  </div>
                )}
              </div>
              
              {tableInfo && (
                <div>
                  <h3 className="text-lg font-medium">Products Table Structure</h3>
                  <pre className="bg-gray-100 p-4 rounded mt-2 text-xs max-h-72 overflow-auto">
                    {JSON.stringify(tableInfo, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductDatabaseTest;
