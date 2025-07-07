
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  Download, 
  Upload, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  ShoppingCart,
  TrendingUp,
  Eye,
  MapPin,
  Shield
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { GoogleShoppingFeedGenerator, GoogleShoppingProduct } from '@/services/googleShopping/feedGenerator';
import { GoogleMerchantCenterAPI, ProductStatus, MerchantCenterConfig } from '@/services/googleShopping/merchantCenter';
import { isContinentalUSZipCode, getContinentalUSRegion } from '@/services/googleShopping/usTargeting';

interface GoogleShoppingManagerProps {
  merchantId?: string;
  accessToken?: string;
}

const GoogleShoppingManager = ({ merchantId, accessToken }: GoogleShoppingManagerProps) => {
  const [feedGenerator] = useState(new GoogleShoppingFeedGenerator());
  const [merchantAPI, setMerchantAPI] = useState<GoogleMerchantCenterAPI | null>(null);
  
  const [products, setProducts] = useState<GoogleShoppingProduct[]>([]);
  const [productStatuses, setProductStatuses] = useState<ProductStatus[]>([]);
  const [xmlFeed, setXmlFeed] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [zipCode, setZipCode] = useState('75001');
  const [zipCodeValid, setZipCodeValid] = useState(true);
  
  const [config, setConfig] = useState<MerchantCenterConfig>({
    merchantId: merchantId || '',
    accessToken: accessToken || ''
  });

  const { toast } = useToast();

  // Initialize Merchant Center API when config changes
  useEffect(() => {
    if (config.merchantId && config.accessToken) {
      setMerchantAPI(new GoogleMerchantCenterAPI(config));
    }
  }, [config]);

  // Validate ZIP code for continental US
  useEffect(() => {
    const isValid = isContinentalUSZipCode(zipCode);
    setZipCodeValid(isValid);
    
    if (!isValid && zipCode.length === 5) {
      toast({
        title: 'Invalid ZIP Code',
        description: 'Please enter a ZIP code from the continental United States (48 states)',
        variant: 'destructive'
      });
    }
  }, [zipCode, toast]);

  /**
   * Generate product feed with US restrictions
   */
  const handleGenerateFeed = async () => {
    if (!zipCodeValid) {
      toast({
        title: 'Invalid ZIP Code',
        description: 'Please enter a valid continental US ZIP code before generating the feed',
        variant: 'destructive'
      });
      return;
    }

    setIsGenerating(true);
    try {
      console.log('Generating Continental US Google Shopping feed...');
      
      const generatedProducts = await feedGenerator.generateFeed();
      setProducts(generatedProducts);
      
      const xml = await feedGenerator.generateXMLFeed();
      setXmlFeed(xml);
      
      const region = getContinentalUSRegion(zipCode);
      
      toast({
        title: 'Feed Generated',
        description: `Successfully generated Continental US feed with ${generatedProducts.length} products for ${region} region`
      });
    } catch (error) {
      console.error('Error generating feed:', error);
      toast({
        title: 'Generation Failed',
        description: 'Failed to generate product feed',
        variant: 'destructive'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * Download XML feed
   */
  const handleDownloadFeed = () => {
    if (!xmlFeed) {
      toast({
        title: 'No Feed Available',
        description: 'Please generate a feed first',
        variant: 'destructive'
      });
      return;
    }

    const region = getContinentalUSRegion(zipCode);
    const blob = new Blob([xmlFeed], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `google-shopping-continental-us-${region}-${new Date().toISOString().split('T')[0]}.xml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: 'Feed Downloaded',
      description: 'Continental US XML feed has been downloaded successfully'
    });
  };

  /**
   * Upload products to Merchant Center
   */
  const handleUploadToMerchant = async () => {
    if (!merchantAPI) {
      toast({
        title: 'Configuration Required',
        description: 'Please configure Merchant Center credentials first',
        variant: 'destructive'
      });
      return;
    }

    if (products.length === 0) {
      toast({
        title: 'No Products',
        description: 'Please generate a feed first',
        variant: 'destructive'
      });
      return;
    }

    setIsUploading(true);
    try {
      console.log(`Uploading ${products.length} products to Merchant Center...`);
      
      // Upload in batches of 50 to avoid API limits
      const batchSize = 50;
      const batches = [];
      for (let i = 0; i < products.length; i += batchSize) {
        batches.push(products.slice(i, i + batchSize));
      }

      let uploadedCount = 0;
      for (const batch of batches) {
        await merchantAPI.batchUploadProducts(batch);
        uploadedCount += batch.length;
        
        // Update progress
        toast({
          title: 'Upload Progress',
          description: `Uploaded ${uploadedCount} of ${products.length} products`
        });
      }

      toast({
        title: 'Upload Complete',
        description: `Successfully uploaded ${products.length} products to Google Merchant Center`
      });

      // Refresh product statuses
      await handleRefreshStatuses();
    } catch (error) {
      console.error('Error uploading to Merchant Center:', error);
      toast({
        title: 'Upload Failed',
        description: 'Failed to upload products to Merchant Center',
        variant: 'destructive'
      });
    } finally {
      setIsUploading(false);
    }
  };

  /**
   * Refresh product statuses from Merchant Center
   */
  const handleRefreshStatuses = async () => {
    if (!merchantAPI) return;

    try {
      const statuses = await merchantAPI.getAllProductStatuses();
      setProductStatuses(statuses);
      
      toast({
        title: 'Statuses Updated',
        description: `Retrieved status for ${statuses.length} products`
      });
    } catch (error) {
      console.error('Error refreshing statuses:', error);
      toast({
        title: 'Status Refresh Failed',
        description: 'Failed to retrieve product statuses',
        variant: 'destructive'
      });
    }
  };

  /**
   * Get status badge component
   */
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
      case 'disapproved':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Disapproved</Badge>;
      case 'pending':
        return <Badge variant="secondary"><AlertTriangle className="h-3 w-3 mr-1" />Pending</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Google Shopping Integration - Continental US Only
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              This integration is configured for <strong>Continental US delivery only</strong> (48 states). 
              Products will be restricted to prevent international variations and ensure proper geographic targeting.
              Alaska, Hawaii, and US territories are excluded from targeting.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <Tabs defaultValue="feed" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="feed">Continental US Feed</TabsTrigger>
          <TabsTrigger value="merchant">Merchant Center</TabsTrigger>
          <TabsTrigger value="config">Configuration</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="feed">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Generate Continental US Product Feed
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  Feed generation is restricted to continental US ZIP codes only. 
                  This prevents Google from creating international product variations.
                </AlertDescription>
              </Alert>

              <div className="flex gap-4 items-end">
                <div className="flex-1">
                  <Label htmlFor="zipcode">Continental US ZIP Code</Label>
                  <Input
                    id="zipcode"
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value)}
                    placeholder="Enter continental US ZIP code"
                    className={!zipCodeValid && zipCode.length === 5 ? 'border-red-500' : ''}
                  />
                  {zipCode.length === 5 && (
                    <div className="mt-1 text-sm">
                      {zipCodeValid ? (
                        <span className="text-green-600 flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Valid continental US ZIP - {getContinentalUSRegion(zipCode)} region
                        </span>
                      ) : (
                        <span className="text-red-600 flex items-center gap-1">
                          <XCircle className="h-3 w-3" />
                          Invalid - Continental US only (excludes AK, HI, territories)
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <Button 
                  onClick={handleGenerateFeed} 
                  disabled={isGenerating || !zipCodeValid}
                  className="flex items-center gap-2"
                >
                  {isGenerating ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <TrendingUp className="h-4 w-4" />
                  )}
                  {isGenerating ? 'Generating...' : 'Generate US Feed'}
                </Button>
              </div>

              {products.length > 0 && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">
                      Generated {products.length} continental US products for {getContinentalUSRegion(zipCode)} region
                    </span>
                    <Button
                      onClick={handleDownloadFeed}
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Download Continental US XML
                    </Button>
                  </div>

                  <div className="max-h-96 overflow-y-auto border rounded p-4 bg-gray-50">
                    <div className="space-y-2">
                      {products.slice(0, 10).map((product) => (
                        <div key={product.id} className="flex justify-between items-center p-2 bg-white rounded text-sm">
                          <span className="font-medium">{product.title}</span>
                          <div className="flex gap-2">
                            <Badge variant="outline">{product.price}</Badge>
                            <Badge variant="secondary" className="text-xs">
                              {product.custom_label_0}
                            </Badge>
                          </div>
                        </div>
                      ))}
                      {products.length > 10 && (
                        <div className="text-center text-gray-500 py-2">
                          ... and {products.length - 10} more continental US products
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="merchant">
          <Card>
            <CardHeader>
              <CardTitle>Merchant Center Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <Button
                  onClick={handleUploadToMerchant}
                  disabled={isUploading || !merchantAPI || products.length === 0}
                  className="flex items-center gap-2"
                >
                  {isUploading ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  {isUploading ? 'Uploading...' : 'Upload to Merchant Center'}
                </Button>
                
                <Button
                  onClick={handleRefreshStatuses}
                  disabled={!merchantAPI}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Refresh Statuses
                </Button>
              </div>

              {productStatuses.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Product Status Overview</h3>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="pt-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">
                            {productStatuses.filter(p => p.status === 'approved').length}
                          </div>
                          <div className="text-sm text-gray-600">Approved</div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="pt-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-yellow-600">
                            {productStatuses.filter(p => p.status === 'pending').length}
                          </div>
                          <div className="text-sm text-gray-600">Pending</div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="pt-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-red-600">
                            {productStatuses.filter(p => p.status === 'disapproved').length}
                          </div>
                          <div className="text-sm text-gray-600">Disapproved</div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="max-h-96 overflow-y-auto border rounded">
                    <div className="space-y-1">
                      {productStatuses.map((status) => (
                        <div key={status.productId} className="flex justify-between items-center p-3 border-b last:border-b-0">
                          <span className="font-medium">{status.productId}</span>
                          {getStatusBadge(status.status)}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="config">
          <Card>
            <CardHeader>
              <CardTitle>API Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Eye className="h-4 w-4" />
                <AlertDescription>
                  Configure your Google Merchant Center API credentials. You'll need a Merchant Center account and API access.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="merchantId">Merchant ID</Label>
                  <Input
                    id="merchantId"
                    value={config.merchantId}
                    onChange={(e) => setConfig(prev => ({ ...prev, merchantId: e.target.value }))}
                    placeholder="Enter your Merchant Center ID"
                  />
                </div>
                
                <div>
                  <Label htmlFor="accessToken">Access Token</Label>
                  <Textarea
                    id="accessToken"
                    value={config.accessToken}
                    onChange={(e) => setConfig(prev => ({ ...prev, accessToken: e.target.value }))}
                    placeholder="Enter your OAuth2 access token"
                    rows={3}
                  />
                </div>

                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Access tokens expire regularly. You'll need to refresh them using your OAuth2 flow.
                    Consider implementing automated token refresh in production.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Performance Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <Alert>
                <TrendingUp className="h-4 w-4" />
                <AlertDescription>
                  Analytics integration coming soon. This will show performance metrics from Google Ads and Merchant Center.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GoogleShoppingManager;
