
import React from 'react';
import GoogleShoppingManager from '@/components/admin/GoogleShoppingManager';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ShoppingCart, Target, TrendingUp, Globe } from 'lucide-react';

const GoogleShopping = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-gray-900">Google Shopping Integration</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Manage your product feeds, monitor Merchant Center status, and optimize your Google Shopping campaigns 
            for maximum visibility and sales.
          </p>
        </div>

        {/* Feature Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <ShoppingCart className="h-5 w-5 text-blue-600" />
                Product Feed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Generate optimized XML feeds for all your landscaping materials with dynamic pricing based on location.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Target className="h-5 w-5 text-green-600" />
                Geographic Targeting
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Create location-specific feeds with regional pricing and availability for better local targeting.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="h-5 w-5 text-purple-600" />
                Performance Tracking
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Monitor product approval status and track performance metrics from Google Merchant Center.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Globe className="h-5 w-5 text-orange-600" />
                Bulk Materials
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Specialized handling for bulk landscaping materials with proper weight calculations and delivery specifications.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Important Notice */}
        <Alert>
          <ShoppingCart className="h-4 w-4" />
          <AlertDescription className="text-base">
            <strong>Getting Started:</strong> Before using this integration, ensure you have:
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>A verified Google Merchant Center account</li>
              <li>API access enabled for your Merchant Center account</li>
              <li>Valid OAuth2 credentials for API authentication</li>
              <li>Your website claimed and verified in Merchant Center</li>
            </ul>
          </AlertDescription>
        </Alert>

        {/* Main Management Interface */}
        <GoogleShoppingManager />

        {/* Help Section */}
        <Card>
          <CardHeader>
            <CardTitle>Need Help?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-2">Setup Guide</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Create a Google Merchant Center account</li>
                  <li>• Verify and claim your website</li>
                  <li>• Set up Google Cloud project for API access</li>
                  <li>• Configure OAuth2 authentication</li>
                  <li>• Generate and configure access tokens</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Best Practices</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Update feeds regularly (daily recommended)</li>
                  <li>• Monitor product approval status</li>
                  <li>• Use geographic targeting for better ROI</li>
                  <li>• Optimize product titles and descriptions</li>
                  <li>• Track performance metrics regularly</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default GoogleShopping;
