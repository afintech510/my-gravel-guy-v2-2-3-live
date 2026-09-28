
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Download,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ShoppingCart,
  TrendingUp,
  MapPin,
  Shield,
  PlayCircle,
  UploadCloud,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { GoogleShoppingFeedGenerator, GoogleShoppingProduct } from '@/services/googleShopping/feedGenerator';
import { isContinentalUSZipCode, getContinentalUSRegion } from '@/services/googleShopping/usTargeting';
import {
  runMerchantSyncDryRun,
  runMerchantSyncLive,
  type MerchantSyncResponse,
} from '@/services/googleShopping/merchantApiClient';

const GoogleShoppingManager = () => {
  // --- Legacy continental-US flat feed preview (client-side only, no Google credential
  // involved — safe to keep as a manual inspection tool; see index.ts's barrel-file comment
  // for why this is not the path used to actually sync with Google anymore). ---
  const [feedGenerator] = useState(new GoogleShoppingFeedGenerator());
  const [products, setProducts] = useState<GoogleShoppingProduct[]>([]);
  const [xmlFeed, setXmlFeed] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [zipCode, setZipCode] = useState('75001');
  const [zipCodeValid, setZipCodeValid] = useState(true);

  // --- Merchant API sync (google-merchant-sync edge function) ---
  const [metroSlug, setMetroSlug] = useState('');
  const [isDryRunning, setIsDryRunning] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<MerchantSyncResponse | null>(null);

  const { toast } = useToast();

  const handleZipChange = (value: string) => {
    setZipCode(value);
    const isValid = isContinentalUSZipCode(value);
    setZipCodeValid(isValid);
    if (!isValid && value.length === 5) {
      toast({
        title: 'Invalid ZIP Code',
        description: 'Please enter a ZIP code from the continental United States (48 states)',
        variant: 'destructive',
      });
    }
  };

  const handleGenerateFeed = async () => {
    if (!zipCodeValid) {
      toast({
        title: 'Invalid ZIP Code',
        description: 'Please enter a valid continental US ZIP code before generating the feed',
        variant: 'destructive',
      });
      return;
    }

    setIsGenerating(true);
    try {
      const generatedProducts = await feedGenerator.generateFeed();
      setProducts(generatedProducts);
      const xml = await feedGenerator.generateXMLFeed();
      setXmlFeed(xml);

      const region = getContinentalUSRegion(zipCode);
      toast({
        title: 'Feed Generated',
        description: `Generated ${generatedProducts.length} products for ${region} region (preview only)`,
      });
    } catch (error) {
      console.error('Error generating feed:', error);
      toast({ title: 'Generation Failed', description: 'Failed to generate product feed', variant: 'destructive' });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadFeed = () => {
    if (!xmlFeed) {
      toast({ title: 'No Feed Available', description: 'Please generate a feed first', variant: 'destructive' });
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
    toast({ title: 'Feed Downloaded', description: 'Continental US XML feed has been downloaded' });
  };

  const handleDryRun = async () => {
    setIsDryRunning(true);
    try {
      const result = await runMerchantSyncDryRun(metroSlug || undefined);
      setSyncResult(result);
      toast({
        title: 'Dry run complete',
        description: `${result.counts.regions} region(s), ${result.counts.productInputs} product(s), ${result.counts.regionalInventories} regional price row(s) built — nothing sent to Google.`,
      });
    } catch (error) {
      console.error('Dry run failed:', error);
      toast({
        title: 'Dry run failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsDryRunning(false);
    }
  };

  const handleLiveSync = async () => {
    setIsSyncing(true);
    try {
      const result = await runMerchantSyncLive(metroSlug || undefined);
      setSyncResult(result);
      const failed = result.results?.failed ?? 0;
      toast({
        title: failed > 0 ? 'Sync completed with errors' : 'Sync complete',
        description: `${result.results?.succeeded ?? 0} succeeded, ${failed} failed. See details below.`,
        variant: failed > 0 ? 'destructive' : 'default',
      });
    } catch (error) {
      console.error('Live sync failed:', error);
      toast({
        title: 'Sync failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Google Shopping Integration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              Merchant Center sync now runs server-side through the <code>google-merchant-sync</code> edge
              function — no Google credential is ever held in this browser tab. See{' '}
              <code>docs/metro/research/merchant-api-implementation.md</code> for setup.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <Tabs defaultValue="sync" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="sync">Merchant API Sync</TabsTrigger>
          <TabsTrigger value="feed">Legacy Feed Preview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="sync">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Regions, Products & Regional Inventory
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Reads the pre-built price book (regenerate it with{' '}
                  <code>node scripts/metro/export-price-book.mjs</code> after any pricing change) and builds one
                  Merchant API region per delivery zone, one product per material variant, and one regional
                  inventory price override per zone. Dry run never contacts Google.
                </AlertDescription>
              </Alert>

              <div className="flex gap-4 items-end flex-wrap">
                <div className="flex-1 min-w-[200px]">
                  <Label htmlFor="metroSlug">Metro filter (optional)</Label>
                  <Input
                    id="metroSlug"
                    value={metroSlug}
                    onChange={e => setMetroSlug(e.target.value)}
                    placeholder="e.g. dallas-fort-worth (blank = all metros)"
                  />
                </div>
                <Button onClick={handleDryRun} disabled={isDryRunning} variant="outline" className="flex items-center gap-2">
                  {isDryRunning ? <RefreshCw className="h-4 w-4 animate-spin" /> : <PlayCircle className="h-4 w-4" />}
                  {isDryRunning ? 'Running…' : 'Dry run sync'}
                </Button>
                <Button onClick={handleLiveSync} disabled={isSyncing} className="flex items-center gap-2">
                  {isSyncing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
                  {isSyncing ? 'Syncing…' : 'Sync to Merchant Center'}
                </Button>
              </div>

              {syncResult && (
                <div className="space-y-3">
                  <div className="flex gap-2 flex-wrap">
                    <Badge variant={syncResult.dryRun ? 'secondary' : 'default'}>
                      {syncResult.dryRun ? 'Dry run' : 'Live sync'}
                    </Badge>
                    <Badge variant="outline">{syncResult.counts.regions} regions</Badge>
                    <Badge variant="outline">{syncResult.counts.productInputs} products</Badge>
                    <Badge variant="outline">{syncResult.counts.regionalInventories} regional prices</Badge>
                    {syncResult.results && (
                      <>
                        <Badge className="bg-green-500">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          {syncResult.results.succeeded} ok
                        </Badge>
                        {syncResult.results.failed > 0 && (
                          <Badge variant="destructive">
                            <XCircle className="h-3 w-3 mr-1" />
                            {syncResult.results.failed} failed
                          </Badge>
                        )}
                      </>
                    )}
                  </div>

                  {syncResult.results && syncResult.results.failures.length > 0 && (
                    <div className="max-h-64 overflow-y-auto border rounded p-3 bg-red-50 space-y-1">
                      {syncResult.results.failures.map((failure, i) => (
                        <div key={`${failure.kind}-${failure.key}-${i}`} className="text-sm">
                          <span className="font-medium">{failure.kind}</span> {failure.key}:{' '}
                          {failure.error || `HTTP ${failure.status}`}
                        </div>
                      ))}
                    </div>
                  )}

                  <details className="text-sm">
                    <summary className="cursor-pointer font-medium">Raw response JSON</summary>
                    <pre className="mt-2 max-h-96 overflow-auto bg-gray-50 border rounded p-3 text-xs">
                      {JSON.stringify(syncResult, null, 2)}
                    </pre>
                  </details>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="feed">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Legacy Continental-US Feed Preview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  This tab is client-side only (no Google API calls) and reflects the old flat, single-price feed
                  shape. It's kept for quick manual inspection; it is not what gets pushed to Merchant Center — use
                  the Merchant API Sync tab for that.
                </AlertDescription>
              </Alert>

              <div className="flex gap-4 items-end">
                <div className="flex-1">
                  <Label htmlFor="zipcode">Continental US ZIP Code</Label>
                  <Input
                    id="zipcode"
                    value={zipCode}
                    onChange={e => handleZipChange(e.target.value)}
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
                <Button onClick={handleGenerateFeed} disabled={isGenerating || !zipCodeValid} className="flex items-center gap-2">
                  {isGenerating ? <RefreshCw className="h-4 w-4 animate-spin" /> : <TrendingUp className="h-4 w-4" />}
                  {isGenerating ? 'Generating...' : 'Generate US Feed'}
                </Button>
              </div>

              {products.length > 0 && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">
                      Generated {products.length} continental US products for {getContinentalUSRegion(zipCode)} region
                    </span>
                    <Button onClick={handleDownloadFeed} variant="outline" className="flex items-center gap-2">
                      <Download className="h-4 w-4" />
                      Download Continental US XML
                    </Button>
                  </div>

                  <div className="max-h-96 overflow-y-auto border rounded p-4 bg-gray-50">
                    <div className="space-y-2">
                      {products.slice(0, 10).map(product => (
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

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Performance Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <Alert>
                <TrendingUp className="h-4 w-4" />
                <AlertDescription>
                  Analytics integration coming soon. This will show performance metrics from Google Ads and
                  Merchant Center.
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
