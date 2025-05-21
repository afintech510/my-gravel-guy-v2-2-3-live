
import React from 'react';
import { Plus, Minus, PlusCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface AreaInput {
  length: number;
  width: number;
}

type ShopAreaInputsProps = {
  areas: AreaInput[];
  setAreas: React.Dispatch<React.SetStateAction<AreaInput[]>>;
};

const ShopAreaInputs: React.FC<ShopAreaInputsProps> = ({ areas, setAreas }) => {
  const handleAddArea = () => {
    setAreas([...areas, { length: 10, width: 10 }]);
  };

  const handleRemoveArea = (index: number) => {
    if (areas.length > 1) {
      const newAreas = [...areas];
      newAreas.splice(index, 1);
      setAreas(newAreas);
    }
  };

  const handleInputChange = (index: number, field: 'length' | 'width', value: number) => {
    const newAreas = [...areas];
    newAreas[index][field] = value;
    setAreas(newAreas);
  };

  const adjustValue = (index: number, field: 'length' | 'width', amount: number) => {
    const newAreas = [...areas];
    const newValue = Math.max(1, newAreas[index][field] + amount);
    newAreas[index][field] = newValue;
    setAreas(newAreas);
  };

  return (
    <div className="space-y-4 font-montserrat">
      {areas.map((area, index) => (
        <div key={index} className="flex items-center gap-4 bg-gray-50 p-3 rounded-lg">
          <div className="flex flex-col sm:flex-row items-center gap-3 flex-grow">
            <div className="w-full sm:w-1/2">
              <div className="flex items-center">
                <Button 
                  type="button" 
                  size="sm" 
                  variant="outline"
                  onClick={() => adjustValue(index, 'length', -1)}
                  className="h-10 w-10 rounded-full p-0 flex items-center justify-center border-2"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Input
                  type="number"
                  min="1"
                  value={area.length}
                  onChange={(e) => handleInputChange(index, 'length', parseInt(e.target.value) || 1)}
                  className="h-10 text-center rounded-none border-x-0 text-lg font-montserrat mx-2 font-medium"
                  placeholder="Length (ft)"
                />
                <Button 
                  type="button" 
                  size="sm"
                  variant="outline" 
                  onClick={() => adjustValue(index, 'length', 1)}
                  className="h-10 w-10 rounded-full p-0 flex items-center justify-center border-2"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="w-full sm:w-1/2">
              <div className="flex items-center">
                <Button 
                  type="button" 
                  size="sm" 
                  variant="outline"
                  onClick={() => adjustValue(index, 'width', -1)}
                  className="h-10 w-10 rounded-full p-0 flex items-center justify-center border-2"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Input
                  type="number"
                  min="1"
                  value={area.width}
                  onChange={(e) => handleInputChange(index, 'width', parseInt(e.target.value) || 1)}
                  className="h-10 text-center rounded-none border-x-0 text-lg font-montserrat mx-2 font-medium"
                  placeholder="Width (ft)"
                />
                <Button 
                  type="button" 
                  size="sm"
                  variant="outline" 
                  onClick={() => adjustValue(index, 'width', 1)}
                  className="h-10 w-10 rounded-full p-0 flex items-center justify-center border-2"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {areas.length > 1 && (
            <Button 
              type="button" 
              variant="destructive"
              size="sm" 
              onClick={() => handleRemoveArea(index)}
              className="h-10 w-10 p-0 flex items-center justify-center rounded-full"
            >
              <Minus className="h-4 w-4" />
            </Button>
          )}
        </div>
      ))}

      <Button
        type="button"
        onClick={handleAddArea}
        variant="outline"
        className="mt-2 flex items-center gap-2 font-montserrat"
      >
        <PlusCircle className="h-5 w-5" /> Add Another Area
      </Button>
    </div>
  );
};

export default ShopAreaInputs;
