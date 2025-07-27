
import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, FileText, MessageSquare, DollarSign, TrendingUp, Users } from 'lucide-react';
import { useFinancialAuth } from '@/hooks/useFinancialAuth';

const menuItems = [
  {
    title: 'Dashboard',
    url: '/dashboard',
    icon: LayoutDashboard,
    requiresFinancialAccess: false,
  },
  {
    title: 'Orders',
    url: '/dashboard/orders',
    icon: ShoppingCart,
    requiresFinancialAccess: false,
  },
  {
    title: 'Quotes',
    url: '/dashboard/quotes',
    icon: FileText,
    requiresFinancialAccess: false,
  },
  {
    title: 'Suppliers',
    url: '/dashboard/suppliers',
    icon: Users,
    requiresFinancialAccess: false,
  },
  {
    title: 'Messaging',
    url: '/dashboard/comm',
    icon: MessageSquare,
    requiresFinancialAccess: false,
  },
  {
    title: 'Expenses',
    url: '/dashboard/expenses',
    icon: DollarSign,
    requiresFinancialAccess: true,
  },
  {
    title: 'Analyze',
    url: '/dashboard/analyze',
    icon: TrendingUp,
    requiresFinancialAccess: true,
  },
];

interface DashboardSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function DashboardSidebar({ isOpen }: DashboardSidebarProps) {
  const { isFinancialAdmin, loading } = useFinancialAuth();

  // Filter menu items based on financial admin access
  const filteredMenuItems = menuItems.filter(item => {
    if (item.requiresFinancialAccess && !isFinancialAdmin) {
      return false;
    }
    return true;
  });

  return (
    <div
      className={`${
        isOpen ? 'w-64' : 'w-16'
      } transition-all duration-300 ease-in-out bg-gray-800 border-r border-gray-700 flex-shrink-0 h-full`}
    >
      <nav className="h-full flex flex-col py-4">
        <div className="flex-1 px-2 space-y-1">
          {filteredMenuItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.title}
                to={item.url}
                end={item.url === '/dashboard'}
                className={({ isActive }) =>
                  `group flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-lg'
                      : 'text-gray-300 hover:bg-primary/10 hover:text-primary'
                  } ${!isOpen ? 'justify-center' : ''}`
                }
                title={!isOpen ? item.title : undefined}
              >
                <Icon 
                  className="h-5 w-5 flex-shrink-0" 
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
