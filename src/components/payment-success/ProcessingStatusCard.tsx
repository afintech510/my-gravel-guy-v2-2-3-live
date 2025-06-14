
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, AlertCircle, XCircle, Database } from "lucide-react";
import { testDatabaseInsert } from '../../services/orderInsertService';
import { useToast } from "@/hooks/use-toast";

interface ProcessingStatusCardProps {
  isLoading: boolean;
  processingError: string | null;
  detailedError: string | null;
  retryCount: number;
  testingDbInsert: boolean;
  onRetry: () => void;
  onSetTestingDbInsert: (testing: boolean) => void;
}

export const ProcessingStatusCard: React.FC<ProcessingStatusCardProps> = ({
  isLoading,
  processingError,
  detailedError,
  retryCount,
  testingDbInsert,
  onRetry,
  onSetTestingDbInsert
}) => {
  const { toast } = useToast();

  const handleTestDatabaseInsert = async () => {
    onSetTestingDbInsert(true);
    try {
      const result = await testDatabaseInsert();
      if (result.success) {
        toast({
          title: "Test Insert Successful",
          description: "Test order was successfully inserted into the database!",
          variant: "default"
        });
      } else {
        toast({
          title: "Test Insert Failed",
          description: `Test insert failed: ${result.error}`,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Test Insert Error",
        description: "An error occurred during the test insert",
        variant: "destructive"
      });
    } finally {
      onSetTestingDbInsert(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="mb-8 border-blue-200">
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <RefreshCw className="h-5 w-5 animate-spin text-blue-600" />
            Processing Order
          </h3>
          
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 border border-blue-200">
              <div className="flex-1">
                <p className="font-medium">Verifying Payment</p>
                <p className="text-sm text-gray-600">
                  Please wait while we process your order details...
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (!isLoading && !processingError) {
    return (
      <Card className="mb-8 border-yellow-200">
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            Order Processing
          </h3>
          
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-yellow-50 border border-yellow-200">
              <div className="flex-1">
                <p className="font-medium">Processing Order Details</p>
                <p className="text-sm text-gray-600">
                  We're retrieving your order information. This may take a moment.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (processingError) {
    return (
      <Card className="mb-8 border-red-200">
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-600" />
            Processing Issue
          </h3>
          
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-red-50 border border-red-200">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <div className="flex-1">
                <p className="font-medium">Order Processing Delayed</p>
                <p className="text-sm text-gray-600">
                  There was an issue retrieving your order details, but your payment was likely successful.
                </p>
                <p className="text-xs text-red-600 mt-1">{processingError}</p>
                {detailedError && (
                  <details className="mt-2">
                    <summary className="text-xs text-gray-500 cursor-pointer">Technical Details</summary>
                    <pre className="text-xs text-gray-400 mt-1 whitespace-pre-wrap max-h-20 overflow-y-auto">
                      {detailedError}
                    </pre>
                  </details>
                )}
              </div>
            </div>
            
            <div className="flex justify-center gap-2 pt-2">
              {retryCount < 3 && (
                <Button 
                  onClick={onRetry} 
                  variant="outline" 
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Retry Processing ({retryCount}/3)
                </Button>
              )}
              
              <Button 
                onClick={handleTestDatabaseInsert} 
                variant="outline" 
                size="sm"
                className="flex items-center gap-2"
                disabled={testingDbInsert}
              >
                <Database className="h-4 w-4" />
                {testingDbInsert ? 'Testing...' : 'Test Schema-Accurate DB Insert'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return null;
};
