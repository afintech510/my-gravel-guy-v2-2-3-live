
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, FileText, MessageSquare, Menu } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';

const menuItems = [
  {
    title: 'Dashboard',
    url: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Orders',
    url: '/dashboard/orders',
    icon: ShoppingCart,
  },
  {
    title: 'Quotes',
    url: '/dashboard/quotes',
    icon: FileText,
  },
  {
    title: 'Messaging',
    url: '/dashboard/comm',
    icon: MessageSquare,
  },
];

export function DashboardSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return currentPath === '/dashboard';
    }
    return currentPath.startsWith(path);
  };

  const isCollapsed = state === 'collapsed';

  return (
    <Sidebar className={`transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'} border-r bg-card`}>
      {/* Header with hamburger menu */}
      <SidebarHeader className="border-b p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {!isCollapsed && (
            <div className="flex flex-col">
              <h2 className="text-lg font-semibold text-foreground">Admin Panel</h2>
              <p className="text-xs text-muted-foreground">Management Dashboard</p>
            </div>
          )}
        </div>
        <SidebarTrigger className="hover:bg-muted rounded-md p-2">
          <Menu className="h-4 w-4" />
        </SidebarTrigger>
      </SidebarHeader>

      <SidebarContent className="p-2">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className={({ isActive: linkActive }) =>
                        `flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 w-full ${
                          isActive(item.url) || linkActive
                            ? 'bg-primary text-primary-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                        } ${isCollapsed ? 'justify-center' : ''}`
                      }
                      title={isCollapsed ? item.title : undefined}
                    >
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      {!isCollapsed && (
                        <span className="font-medium">{item.title}</span>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
