import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { SupplierService } from '@/services/supplierService';
import { Supplier } from '@/types/supplier.types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Eye, Edit, Plus, Users, DollarSign, Package } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import SupplierDetailModal from './SupplierDetailModal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const SuppliersTable = () => {
  const { toast } = useToast();
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'view' | 'edit' | 'create'>('view');

  const { data: suppliers, isLoading, error, refetch } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => SupplierService.fetchSuppliers(),
    staleTime: 30000,
  });

  const { data: supplierStats } = useQuery({
    queryKey: ['supplier-stats', suppliers],
    queryFn: () => suppliers ? SupplierService.getSupplierStatsBatch(suppliers) : Promise.resolve({}),
    enabled: !!suppliers && suppliers.length > 0,
    staleTime: 30000,
  });

  const handleViewSupplier = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setModalMode('view');
    setIsModalOpen(true);
  };

  const handleEditSupplier = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleCreateSupplier = () => {
    setSelectedSupplier(null);
    setModalMode('create');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedSupplier(null);
  };

  const handleSupplierUpdate = () => {
    refetch();
  };

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Error loading suppliers: {error.message}</p>
        <Button onClick={() => refetch()} className="mt-4">
          Try Again
        </Button>
      </div>
    );
  }

  const supplierList = suppliers || [];
  const activeSuppliers = supplierList.filter(s => s.active !== false);
  const stats = supplierStats || {};
  const totalOrders = Object.values(stats).reduce((sum, stat: any) => sum + (stat?.totalOrders || 0), 0);
  const totalRevenue = Object.values(stats).reduce((sum, stat: any) => sum + (stat?.totalRevenue || 0), 0);

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Suppliers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{supplierList.length}</div>
            <p className="text-xs text-muted-foreground">
              {activeSuppliers.length} active
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrders as number}</div>
            <p className="text-xs text-muted-foreground">
              Across all suppliers
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(totalRevenue as number).toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              From supplier orders
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Action Bar */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Suppliers</h3>
        <Button onClick={handleCreateSupplier}>
          <Plus className="h-4 w-4 mr-2" />
          Add Supplier
        </Button>
      </div>

      {isLoading && (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      )}

      {!isLoading && (
        <>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Service Areas</TableHead>
                  <TableHead>Materials</TableHead>
                  <TableHead>Orders</TableHead>
                  <TableHead>Revenue</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {supplierList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-gray-500">
                      No suppliers found
                    </TableCell>
                  </TableRow>
                ) : (
                  supplierList.map((supplier) => (
                    <TableRow 
                      key={supplier.id}
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => handleViewSupplier(supplier)}
                    >
                      <TableCell className="font-medium">
                        {supplier.name}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {supplier.email && (
                            <div className="text-sm">
                              <a href={`mailto:${supplier.email}`} className="text-blue-600 hover:underline">
                                {supplier.email}
                              </a>
                            </div>
                          )}
                          {supplier.phone && (
                            <div className="text-sm">
                              <a href={`tel:${supplier.phone}`} className="text-blue-600 hover:underline">
                                {supplier.phone}
                              </a>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {supplier.service_areas?.slice(0, 2).map((area, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {area}
                            </Badge>
                          ))}
                          {supplier.service_areas && supplier.service_areas.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{supplier.service_areas.length - 2} more
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {supplier.materials?.slice(0, 2).map((material, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {material}
                            </Badge>
                          ))}
                          {supplier.materials && supplier.materials.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{supplier.materials.length - 2} more
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{(stats[supplier.id] as any)?.totalOrders || 0}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-medium">${((stats[supplier.id] as any)?.totalRevenue || 0).toFixed(2)}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={supplier.active !== false ? "default" : "secondary"}>
                          {supplier.active !== false ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div 
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                          }}
                          className="flex items-center gap-2"
                        >
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewSupplier(supplier);
                            }}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditSupplier(supplier);
                            }}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <SupplierDetailModal
            supplier={selectedSupplier}
            isOpen={isModalOpen}
            onClose={handleCloseModal}
            onSupplierUpdate={handleSupplierUpdate}
            mode={modalMode}
          />
        </>
      )}
    </div>
  );
};

export default SuppliersTable;