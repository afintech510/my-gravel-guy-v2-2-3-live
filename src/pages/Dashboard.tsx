
import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";

// Fake order data - in a real app this would come from an API
const orders = [
  {
    id: "ORD-1234",
    date: "2025-04-20",
    status: "Delivered",
    total: 145.99,
    items: [
      { name: "River Rock Gravel", quantity: 3, price: 45.99 }
    ]
  },
  {
    id: "ORD-1235",
    date: "2025-04-15",
    status: "Processing",
    total: 89.97,
    items: [
      { name: "Fine Sand", quantity: 2, price: 35.99 },
      { name: "Premium Topsoil", quantity: 0.6, price: 29.99 }
    ]
  }
];

// Fake address data
const addresses = [
  {
    id: 1,
    name: "Home",
    street: "123 Main St",
    city: "Austin",
    state: "TX",
    zip: "78701",
    isDefault: true
  },
  {
    id: 2,
    name: "Office",
    street: "456 Business Ave",
    city: "Austin",
    state: "TX",
    zip: "78702",
    isDefault: false
  }
];

const Dashboard = () => {
  const { toast } = useToast();
  
  const handleLogout = () => {
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    });
    // Would normally redirect to home page here
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="py-8 px-4 bg-white border-b">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">My Account</h1>
          <Button variant="outline" onClick={handleLogout}>Log Out</Button>
        </div>
      </div>
      
      <div className="max-w-6xl mx-auto py-12 px-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="font-medium text-lg mb-4">Jane Doe</h2>
              <p className="text-gray-600 text-sm">jane.doe@example.com</p>
            </div>
            
            <nav className="space-y-1">
              <a href="#" className="block py-2 px-4 bg-blue-50 text-blue-700 font-medium rounded">
                Dashboard
              </a>
              <a href="#" className="block py-2 px-4 text-gray-600 hover:bg-gray-100 rounded">
                Orders
              </a>
              <a href="#" className="block py-2 px-4 text-gray-600 hover:bg-gray-100 rounded">
                Addresses
              </a>
              <a href="#" className="block py-2 px-4 text-gray-600 hover:bg-gray-100 rounded">
                Account Settings
              </a>
            </nav>
          </div>
          
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-8">
            <div>
              <h2 className="text-2xl font-bold mb-6">Recent Orders</h2>
              {orders.length > 0 ? (
                <div className="space-y-4">
                  {orders.map(order => (
                    <Card key={order.id}>
                      <CardHeader className="pb-2">
                        <div className="flex justify-between">
                          <CardTitle className="text-lg">Order #{order.id}</CardTitle>
                          <span className={`inline-block px-2 py-1 text-xs rounded ${
                            order.status === 'Delivered' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {order.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500">Placed on {order.date}</p>
                      </CardHeader>
                      <CardContent>
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between py-2 border-b last:border-0">
                            <div>
                              <p>{item.name}</p>
                              <p className="text-sm text-gray-500">{item.quantity} yard(s) × ${item.price.toFixed(2)}</p>
                            </div>
                            <p className="font-medium">${(item.quantity * item.price).toFixed(2)}</p>
                          </div>
                        ))}
                      </CardContent>
                      <CardFooter className="flex justify-between pt-2">
                        <Button variant="outline">View Details</Button>
                        <p className="font-bold">Total: ${order.total.toFixed(2)}</p>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="text-center py-12">
                    <p className="text-gray-600 mb-4">You haven't placed any orders yet.</p>
                    <Button asChild>
                      <a href="/products">Browse Products</a>
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Saved Addresses</h2>
                <Button variant="outline" size="sm">Add New</Button>
              </div>
              
              {addresses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {addresses.map(address => (
                    <Card key={address.id}>
                      <CardHeader className="pb-2">
                        <div className="flex justify-between">
                          <CardTitle className="text-lg">{address.name}</CardTitle>
                          {address.isDefault && (
                            <span className="inline-block px-2 py-1 text-xs rounded bg-gray-100">Default</span>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p>{address.street}</p>
                        <p>{address.city}, {address.state} {address.zip}</p>
                      </CardContent>
                      <CardFooter className="pt-2">
                        <Button variant="outline" size="sm">Edit</Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="text-center py-12">
                    <p className="text-gray-600 mb-4">You don't have any saved addresses.</p>
                    <Button>Add Address</Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
