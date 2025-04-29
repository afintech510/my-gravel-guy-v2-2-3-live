
import React, { useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { useBlog } from '@/contexts/BlogContext';
import Blog from './Blog';

const BlogCategory = () => {
  const { slug } = useParams<{ slug: string }>();
  const { categories, setActiveCategory } = useBlog();
  
  // Find the category ID from the slug
  const category = categories.find((cat) => cat.slug === slug);
  
  useEffect(() => {
    if (category) {
      setActiveCategory(category.id);
    }
  }, [category, setActiveCategory]);
  
  // If category doesn't exist, redirect to the main blog page
  if (!category && categories.length > 0) {
    return <Navigate to="/blog" replace />;
  }
  
  // Use the main Blog component with the filtered category
  return <Blog />;
};

export default BlogCategory;
