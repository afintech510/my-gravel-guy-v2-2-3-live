
import React from 'react';
import { Button } from "@/components/ui/button";
import { useBlog } from '@/contexts/BlogContext';

const CategoryFilter = () => {
  const { categories, activeCategory, setActiveCategory } = useBlog();

  return (
    <div className="sticky top-20 z-10 bg-background p-4 border-b shadow-sm">
      <div className="container mx-auto flex flex-wrap gap-2 items-center justify-start">
        <Button
          variant={activeCategory === null ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveCategory(null)}
          className="rounded-full"
        >
          All
        </Button>
        {categories.map((category) => (
          <Button
            key={category.id}
            variant={activeCategory === category.id ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveCategory(category.id)}
            className="rounded-full"
          >
            {category.name}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default CategoryFilter;
