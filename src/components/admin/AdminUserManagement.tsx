
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Users, UserPlus, Edit, Trash2, Shield } from 'lucide-react';

interface AdminUser {
  id: string;
  email: string;
  role: 'super_admin' | 'admin' | 'manager' | 'viewer';
  is_active: boolean;
  created_at: string;
  last_login_at?: string;
}

const AdminUserManagement = () => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [newUserData, setNewUserData] = useState({
    email: '',
    role: 'viewer' as const
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch admin users
  const { data: adminUsers, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_users')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as AdminUser[];
    }
  });

  // Add admin user mutation
  const addUserMutation = useMutation({
    mutationFn: async (userData: { email: string; role: string }) => {
      // First, check if user exists in auth.users
      const { data: authUser } = await supabase.auth.admin.getUserByEmail(userData.email);
      
      if (!authUser.user) {
        throw new Error('User must be registered first. Please ask them to sign up.');
      }

      const { data, error } = await supabase
        .from('admin_users')
        .insert([{
          user_id: authUser.user.id,
          email: userData.email,
          role: userData.role,
          is_active: true
        }])
        .select()
        .single();

      if (error) throw error;

      // Log the action
      await supabase.rpc('log_admin_action', {
        p_action: 'CREATE_ADMIN_USER',
        p_resource_type: 'admin_users',
        p_resource_id: data.id,
        p_new_values: data
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setIsAddDialogOpen(false);
      setNewUserData({ email: '', role: 'viewer' });
      toast({
        title: "Admin user added",
        description: "The user has been successfully added as an admin.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error adding admin user",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Update admin user mutation
  const updateUserMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<AdminUser> }) => {
      const { data: oldData } = await supabase
        .from('admin_users')
        .select('*')
        .eq('id', id)
        .single();

      const { data, error } = await supabase
        .from('admin_users')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Log the action
      await supabase.rpc('log_admin_action', {
        p_action: 'UPDATE_ADMIN_USER',
        p_resource_type: 'admin_users',
        p_resource_id: id,
        p_old_values: oldData,
        p_new_values: data
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setEditingUser(null);
      toast({
        title: "Admin user updated",
        description: "The user has been successfully updated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error updating admin user",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Delete admin user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data: oldData } = await supabase
        .from('admin_users')
        .select('*')
        .eq('id', id)
        .single();

      const { error } = await supabase
        .from('admin_users')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Log the action
      await supabase.rpc('log_admin_action', {
        p_action: 'DELETE_ADMIN_USER',
        p_resource_type: 'admin_users',
        p_resource_id: id,
        p_old_values: oldData
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast({
        title: "Admin user deleted",
        description: "The user has been successfully removed.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error deleting admin user",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'super_admin': return 'bg-red-100 text-red-800';
      case 'admin': return 'bg-blue-100 text-blue-800';
      case 'manager': return 'bg-green-100 text-green-800';
      case 'viewer': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return <div>Loading admin users...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            <CardTitle>Admin User Management</CardTitle>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="mr-2 h-4 w-4" />
                Add Admin User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Admin User</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newUserData.email}
                    onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                    placeholder="user@example.com"
                  />
                </div>
                <div>
                  <Label htmlFor="role">Role</Label>
                  <Select value={newUserData.role} onValueChange={(value: any) => setNewUserData({ ...newUserData, role: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="viewer">Viewer</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="super_admin">Super Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={() => addUserMutation.mutate(newUserData)}
                    disabled={addUserMutation.isPending}
                  >
                    Add User
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Login</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {adminUsers?.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.email}</TableCell>
                <TableCell>
                  <Badge className={getRoleBadgeColor(user.role)}>
                    {user.role.replace('_', ' ').toUpperCase()}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={user.is_active ? "default" : "secondary"}>
                    {user.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell>
                  {user.last_login_at 
                    ? new Date(user.last_login_at).toLocaleDateString()
                    : 'Never'
                  }
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingUser(user)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteUserMutation.mutate(user.id)}
                      disabled={deleteUserMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {editingUser && (
          <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Admin User</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Email</Label>
                  <Input value={editingUser.email} disabled />
                </div>
                <div>
                  <Label htmlFor="editRole">Role</Label>
                  <Select 
                    value={editingUser.role} 
                    onValueChange={(value: any) => setEditingUser({ ...editingUser, role: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="viewer">Viewer</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="super_admin">Super Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={editingUser.is_active}
                    onChange={(e) => setEditingUser({ ...editingUser, is_active: e.target.checked })}
                  />
                  <Label htmlFor="isActive">Active</Label>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setEditingUser(null)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={() => updateUserMutation.mutate({ 
                      id: editingUser.id, 
                      updates: { role: editingUser.role, is_active: editingUser.is_active }
                    })}
                    disabled={updateUserMutation.isPending}
                  >
                    Update User
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminUserManagement;
