
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, FileText, MessageSquare } from 'lucide-react';

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

interface DashboardSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function DashboardSidebar({ isOpen }: DashboardSidebarProps) {
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return currentPath === '/dashboard';
    }
    return currentPath.startsWith(path);
  };

  return (
    <div
      className={`${
        isOpen ? 'w-64' : 'w-16'
      } transition-all duration-300 ease-in-out bg-gray-900 border-r border-gray-800 flex-shrink-0`}
    >
      <nav className="h-full flex flex-col py-4">
        <div className="flex-1 px-2 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.title}
                to={item.url}
                className={({ isActive: linkActive }) =>
                  `group flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                    isActive(item.url) || linkActive
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  } ${!isOpen ? 'justify-center' : ''}`
                }
                title={!isOpen ? item.title : undefined}
              >
                <Icon 
                  className={`h-5 w-5 flex-shrink-0 ${
                    isActive(item.url) ? 'text-white' : 'text-gray-400 group-hover:text-white'
                  }`} 
                />
                {isOpen && (
                  <span className="ml-3 truncate">{item.title}</span>
                )}
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
