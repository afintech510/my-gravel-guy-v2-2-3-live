
import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { OrderService } from '@/services/orderService';

interface SalesPersonSelectorProps {
  currentPerson: string | null;
  orderId: string;
  onPersonUpdate: (orderId: string, newPerson: string) => void;
  readonly?: boolean;
}

const SalesPersonSelector: React.FC<SalesPersonSelectorProps> = ({
  currentPerson,
  orderId,
  onPersonUpdate,
  readonly = false
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [salesPersons, setSalesPersons] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Load unique sales persons from the database when editing starts
    const loadSalesPersons = async () => {
      if (!isEditing) return;
      
      setIsLoading(true);
      try {
        const uniquePersons = await OrderService.getUniqueSalesPersons();
        console.log('Loaded unique sales persons:', uniquePersons);
        setSalesPersons(uniquePersons);
      } catch (error) {
        console.error('Error loading sales persons:', error);
        // Fallback to known persons
        setSalesPersons(['Adam', 'Ronnie']);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadSalesPersons();
  }, [isEditing]);

  const handlePersonChange = (newPerson: string) => {
    console.log('Sales person changed:', { orderId, newPerson });
    onPersonUpdate(orderId, newPerson);
    setIsEditing(false);
  };

  const handleBadgeClick = (e: React.MouseEvent) => {
    console.log('Badge clicked - preventing default and propagation');
    e.preventDefault();
    e.stopPropagation();
    e.nativeEvent.stopImmediatePropagation();
    
    if (!readonly) {
      console.log('Setting editing to true');
      setIsEditing(true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      e.stopPropagation();
      if (!readonly) {
        setIsEditing(true);
      }
    }
  };

  if (readonly) {
    return (
      <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200">
        {currentPerson || 'Not Assigned'}
      </Badge>
    );
  }

  if (isEditing) {
    return (
      <div 
        onClick={(e) => {
          console.log('Select container clicked - stopping propagation');
          e.stopPropagation();
          e.preventDefault();
        }}
        className="relative z-50"
      >
        <Select 
          value={currentPerson || ''} 
          onValueChange={handlePersonChange}
          onOpenChange={(open) => {
            console.log('Select open state changed:', open);
            if (!open) {
              setIsEditing(false);
            }
          }}
          open={true}
        >
          <SelectTrigger className="w-32 h-7 text-xs bg-white border shadow-sm">
            <SelectValue placeholder={isLoading ? "Loading..." : "Select..."} />
          </SelectTrigger>
          <SelectContent className="z-[9999] bg-white border shadow-lg min-w-[8rem]">
            <SelectItem value="">Not Assigned</SelectItem>
            {salesPersons.map((person) => (
              <SelectItem key={person} value={person}>
                {person}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  return (
    <Badge 
      role="button"
      tabIndex={0}
      className="cursor-pointer bg-gray-100 text-gray-800 hover:bg-gray-200 select-none no-underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
      style={{ textDecoration: 'none', color: 'inherit' }}
      onClick={handleBadgeClick}
      onKeyDown={handleKeyDown}
    >
      {currentPerson || 'Not Assigned'}
    </Badge>
  );
};

export default SalesPersonSelector;
