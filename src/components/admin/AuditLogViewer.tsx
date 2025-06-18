
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { History, Search, Filter } from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';

type AuditLog = Tables<'audit_logs'>;

const AuditLogViewer = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [resourceFilter, setResourceFilter] = useState('all');

  // Fetch audit logs
  const { data: auditLogs, isLoading } = useQuery({
    queryKey: ['audit-logs', searchTerm, actionFilter, resourceFilter],
    queryFn: async () => {
      let query = supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (searchTerm) {
        query = query.or(`user_email.ilike.%${searchTerm}%,action.ilike.%${searchTerm}%`);
      }

      if (actionFilter !== 'all') {
        query = query.eq('action', actionFilter);
      }

      if (resourceFilter !== 'all') {
        query = query.eq('resource_type', resourceFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });

  const getActionBadgeColor = (action: string) => {
    if (action.includes('CREATE')) return 'bg-green-100 text-green-800';
    if (action.includes('UPDATE')) return 'bg-blue-100 text-blue-800';
    if (action.includes('DELETE')) return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
  };

  const formatJsonPreview = (obj: any) => {
    if (!obj) return 'N/A';
    const str = JSON.stringify(obj, null, 2);
    return str.length > 100 ? str.substring(0, 100) + '...' : str;
  };

  if (isLoading) {
    return <div>Loading audit logs...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <History className="h-5 w-5" />
          <CardTitle>Audit Log Viewer</CardTitle>
        </div>
        <div className="flex gap-4 items-center">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by email or action..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-[180px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Filter by action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              <SelectItem value="CREATE_ORDER">Create Order</SelectItem>
              <SelectItem value="UPDATE_ORDER">Update Order</SelectItem>
              <SelectItem value="DELETE_ORDER">Delete Order</SelectItem>
              <SelectItem value="CREATE_ADMIN_USER">Create Admin</SelectItem>
              <SelectItem value="UPDATE_ADMIN_USER">Update Admin</SelectItem>
              <SelectItem value="DELETE_ADMIN_USER">Delete Admin</SelectItem>
            </SelectContent>
          </Select>
          <Select value={resourceFilter} onValueChange={setResourceFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by resource" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Resources</SelectItem>
              <SelectItem value="orders">Orders</SelectItem>
              <SelectItem value="admin_users">Admin Users</SelectItem>
              <SelectItem value="products">Products</SelectItem>
              <SelectItem value="customer_reviews">Reviews</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date/Time</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Resource</TableHead>
              <TableHead>Resource ID</TableHead>
              <TableHead>Changes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {auditLogs?.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="font-mono text-sm">
                  {new Date(log.created_at).toLocaleString()}
                </TableCell>
                <TableCell>{log.user_email}</TableCell>
                <TableCell>
                  <Badge className={getActionBadgeColor(log.action)}>
                    {log.action}
                  </Badge>
                </TableCell>
                <TableCell className="capitalize">{log.resource_type}</TableCell>
                <TableCell className="font-mono text-sm">
                  {log.resource_id ? log.resource_id.substring(0, 8) + '...' : 'N/A'}
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    {log.old_values && (
                      <div className="text-xs">
                        <span className="font-medium text-red-600">Old:</span>
                        <pre className="text-xs bg-red-50 p-1 rounded">
                          {formatJsonPreview(log.old_values)}
                        </pre>
                      </div>
                    )}
                    {log.new_values && (
                      <div className="text-xs">
                        <span className="font-medium text-green-600">New:</span>
                        <pre className="text-xs bg-green-50 p-1 rounded">
                          {formatJsonPreview(log.new_values)}
                        </pre>
                      </div>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        {auditLogs?.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No audit logs found matching your criteria.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AuditLogViewer;
