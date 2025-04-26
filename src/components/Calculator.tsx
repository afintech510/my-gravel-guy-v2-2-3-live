
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calculator as CalculatorIcon, Equal, Divide, Plus, Minus, Dot } from 'lucide-react';

const Calculator = () => {
  const [display, setDisplay] = useState('0');
  const [firstNumber, setFirstNumber] = useState<number | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [newNumber, setNewNumber] = useState(true);

  const handleNumber = (num: string) => {
    if (newNumber) {
      setDisplay(num);
      setNewNumber(false);
    } else {
      setDisplay(display === '0' ? num : display + num);
    }
  };

  const handleDecimal = () => {
    if (!display.includes('.')) {
      setDisplay(display + '.');
    }
  };

  const handleOperation = (op: string) => {
    setFirstNumber(parseFloat(display));
    setOperation(op);
    setNewNumber(true);
  };

  const handleEqual = () => {
    if (firstNumber === null || operation === null) return;
    
    const secondNumber = parseFloat(display);
    let result = 0;

    switch (operation) {
      case '+':
        result = firstNumber + secondNumber;
        break;
      case '-':
        result = firstNumber - secondNumber;
        break;
      case 'x':
        result = firstNumber * secondNumber;
        break;
      case '÷':
        result = secondNumber !== 0 ? firstNumber / secondNumber : 0;
        break;
    }

    setDisplay(result.toString());
    setFirstNumber(null);
    setOperation(null);
    setNewNumber(true);
  };

  const handleClear = () => {
    setDisplay('0');
    setFirstNumber(null);
    setOperation(null);
    setNewNumber(true);
  };

  return (
    <Card className="w-full max-w-[320px] bg-white shadow-lg">
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2">
          <CalculatorIcon className="h-5 w-5" />
          Calculator
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="mb-4 bg-gray-50 p-4 rounded-lg">
          <div className="text-right text-3xl font-medium truncate">
            {display}
          </div>
        </div>
        <div className="grid grid-cols-4 gap-2">
          <Button
            variant="outline"
            className="h-14"
            onClick={handleClear}
          >
            C
          </Button>
          <Button
            variant="outline"
            className="h-14"
            onClick={() => setDisplay((prev) => 
              prev.startsWith('-') ? prev.slice(1) : '-' + prev
            )}
          >
            +/-
          </Button>
          <Button
            variant="outline"
            className="h-14"
            onClick={() => {
              const num = parseFloat(display);
              setDisplay((num / 100).toString());
            }}
          >
            %
          </Button>
          <Button
            variant="secondary"
            className="h-14"
            onClick={() => handleOperation('÷')}
          >
            <Divide className="h-4 w-4" />
          </Button>
          {[7, 8, 9].map((num) => (
            <Button
              key={num}
              variant="outline"
              className="h-14"
              onClick={() => handleNumber(num.toString())}
            >
              {num}
            </Button>
          ))}
          <Button
            variant="secondary"
            className="h-14"
            onClick={() => handleOperation('x')}
          >
            ×
          </Button>
          {[4, 5, 6].map((num) => (
            <Button
              key={num}
              variant="outline"
              className="h-14"
              onClick={() => handleNumber(num.toString())}
            >
              {num}
            </Button>
          ))}
          <Button
            variant="secondary"
            className="h-14"
            onClick={() => handleOperation('-')}
          >
            <Minus className="h-4 w-4" />
          </Button>
          {[1, 2, 3].map((num) => (
            <Button
              key={num}
              variant="outline"
              className="h-14"
              onClick={() => handleNumber(num.toString())}
            >
              {num}
            </Button>
          ))}
          <Button
            variant="secondary"
            className="h-14"
            onClick={() => handleOperation('+')}
          >
            <Plus className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="h-14 col-span-2"
            onClick={() => handleNumber('0')}
          >
            0
          </Button>
          <Button
            variant="outline"
            className="h-14"
            onClick={handleDecimal}
          >
            <Dot className="h-4 w-4" />
          </Button>
          <Button
            variant="primary"
            className="h-14 bg-blue-500 hover:bg-blue-600"
            onClick={handleEqual}
          >
            <Equal className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default Calculator;
