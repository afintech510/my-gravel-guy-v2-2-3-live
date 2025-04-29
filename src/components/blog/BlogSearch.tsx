
import React from 'react';
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useBlog } from '@/contexts/BlogContext';

const BlogSearch = () => {
  const { searchQuery, setSearchQuery } = useBlog();

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        placeholder="Search articles..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="pl-10 rounded-full"
      />
    </div>
  );
};

export default BlogSearch;
