
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, MessageSquare, Phone, Mail, Shield } from 'lucide-react';
import SMSTestSection from '@/components/sms/SMSTestSection';

const SMSConsent = () => {
  return (
    <div className="min-h-screen bg-muted">
      <div className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">SMS Communication Consent</h1>
            <p className="text-xl text-muted-foreground">
              Transparent communication practices and your consent preferences
            </p>
          </div>

          {/* SMS Test Section 
              <SMSTestSection />  */}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            {/* Consent Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  SMS & Text Messaging
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold">Order Confirmations</h4>
                      <p className="text-sm text-muted-foreground">Receive confirmation when your order is placed and processed</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold">Delivery Updates</h4>
                      <p className="text-sm text-muted-foreground">Get notified when your materials are out for delivery</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold">Driver Coordination</h4>
                      <p className="text-sm text-muted-foreground">Direct communication with your delivery driver</p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <h5 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Sample Message:</h5>
                  <p className="text-sm text-blue-800 dark:text-blue-200 italic">
                    "Your 5 tons of crushed stone from MyGravelGuy is out for delivery today between 2-4pm. 
                    Driver John will text 30 min before arrival. Track: [link] Reply STOP to opt out."
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Contact Preferences */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  Communication Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Mail className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold">Email Communications</h4>
                      <p className="text-sm text-muted-foreground">Order confirmations, receipts, and important updates</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Phone className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold">Phone Calls</h4>
                      <p className="text-sm text-muted-foreground">For complex orders or delivery coordination if needed</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MessageSquare className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold">Text Messages</h4>
                      <p className="text-sm text-muted-foreground">Quick delivery updates and driver coordination</p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-950 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Shield className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h5 className="font-semibold text-amber-900 dark:text-amber-100 mb-1">Your Rights</h5>
                      <p className="text-sm text-amber-800 dark:text-amber-200">
                        You can opt out anytime by replying STOP to any text message or contacting us directly.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Compliance Information */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Compliance & Legal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3">TCPA Compliance</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Express written consent required for all SMS</li>
                    <li>• Clear opt-out instructions in every message</li>
                    <li>• No marketing messages without separate consent</li>
                    <li>• Toll-free number registered for business use</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-3">Message Frequency</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• 1-3 messages per order (confirmation, delivery, completion)</li>
                    <li>• Additional messages only for delivery coordination</li>
                    <li>• No promotional messages unless opted in separately</li>
                    <li>• Message & data rates may apply</li>
                  </ul>
                </div>
              </div>

              <div className="border-t pt-6">
                <h4 className="font-semibold mb-3">Contact Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="font-medium">Phone</p>
                    <p className="text-muted-foreground">(844) 624-0400</p>
                  </div>
                  <div>
                    <p className="font-medium">Email</p>
                    <p className="text-muted-foreground">support@mygravelguy.com</p>
                  </div>
                  <div>
                    <p className="font-medium">Hours</p>
                    <p className="text-muted-foreground">Mon-Fri 8am-5pm EST</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Call to Action */}
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-4">Ready to Get Started?</h3>
            <p className="text-muted-foreground mb-6">
              Get your materials delivered with clear communication every step of the way.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/contact">
                <Button size="lg" className="w-full sm:w-auto">
                  Get a Quote
                </Button>
              </Link>
              <Link to="/shop">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  Shop Materials
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SMSConsent;
