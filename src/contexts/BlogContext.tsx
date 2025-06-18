
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface BlogCategory {
  id: string;
  name: string;
  slug: string;
}

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featured_image: string | null;
  category_id: string;
  published_at: string;
  author: string | null;
  meta_title: string | null;
  meta_description: string | null;
  is_featured: boolean;
  categoryName?: string; // Added for convenience when joining with categories
}

interface BlogContextType {
  posts: BlogPost[];
  categories: BlogCategory[];
  featuredPosts: BlogPost[];
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  activeCategory: string | null;
  setActiveCategory: (category: string | null) => void;
  getPostBySlug: (slug: string) => Promise<BlogPost | null>;
  getRelatedPosts: (categoryId: string, currentPostId: string) => Promise<BlogPost[]>;
}

const defaultContextValue: BlogContextType = {
  posts: [],
  categories: [],
  featuredPosts: [],
  isLoading: true,
  error: null,
  searchQuery: '',
  setSearchQuery: () => {},
  activeCategory: null,
  setActiveCategory: () => {},
  getPostBySlug: async () => null,
  getRelatedPosts: async () => [],
};

const BlogContext = createContext<BlogContextType>(defaultContextValue);

export const useBlog = () => useContext(BlogContext);

export const BlogProvider = ({ children }: { children: React.ReactNode }) => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [featuredPosts, setFeaturedPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  // Fetch all blog posts and categories
  useEffect(() => {
    const fetchBlogData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch categories
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('blog_categories')
          .select('*')
          .order('name');

        if (categoriesError) throw new Error(categoriesError.message);
        setCategories(categoriesData || []);

        // Fetch all posts with category information
        const { data: postsData, error: postsError } = await supabase
          .from('blog_posts')
          .select(`
            *,
            blog_categories(name)
          `)
          .order('published_at', { ascending: false });

        if (postsError) throw new Error(postsError.message);

        // Format posts with category name and ensure all required fields
        const formattedPosts: BlogPost[] = postsData?.map(post => ({
          id: post.id,
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt,
          content: post.content,
          featured_image: post.featured_image,
          category_id: post.category_id,
          published_at: post.published_at,
          author: post.author,
          meta_title: post.meta_title,
          meta_description: post.meta_description,
          is_featured: post.is_featured ?? false, // Ensure boolean with fallback
          categoryName: post.blog_categories?.name
        })) || [];

        setPosts(formattedPosts);

        // Set featured posts
        const featured = formattedPosts.filter(post => post.is_featured);
        setFeaturedPosts(featured);

        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching blog data:', err);
        setError('Failed to load blog posts. Please try again later.');
        setIsLoading(false);
        toast({
          title: "Error",
          description: "Failed to load blog posts",
          variant: "destructive",
        });
      }
    };

    fetchBlogData();
  }, []);

  // Get post by slug
  const getPostBySlug = async (slug: string): Promise<BlogPost | null> => {
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select(`
          *,
          blog_categories(name)
        `)
        .eq('slug', slug)
        .single();

      if (error) throw error;
      
      if (data) {
        return {
          id: data.id,
          title: data.title,
          slug: data.slug,
          excerpt: data.excerpt,
          content: data.content,
          featured_image: data.featured_image,
          category_id: data.category_id,
          published_at: data.published_at,
          author: data.author,
          meta_title: data.meta_title,
          meta_description: data.meta_description,
          is_featured: data.is_featured ?? false,
          categoryName: data.blog_categories?.name
        };
      }
      return null;
    } catch (err) {
      console.error('Error fetching post by slug:', err);
      toast({
        title: "Error",
        description: "Failed to load blog post",
        variant: "destructive",
      });
      return null;
    }
  };

  // Get related posts
  const getRelatedPosts = async (categoryId: string, currentPostId: string): Promise<BlogPost[]> => {
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select(`
          *,
          blog_categories(name)
        `)
        .eq('category_id', categoryId)
        .neq('id', currentPostId)
        .limit(3);

      if (error) throw error;
      
      return data?.map(post => ({
        id: post.id,
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        content: post.content,
        featured_image: post.featured_image,
        category_id: post.category_id,
        published_at: post.published_at,
        author: post.author,
        meta_title: post.meta_title,
        meta_description: post.meta_description,
        is_featured: post.is_featured ?? false,
        categoryName: post.blog_categories?.name
      })) || [];
    } catch (err) {
      console.error('Error fetching related posts:', err);
      return [];
    }
  };

  // Filter posts based on search query and active category
  const filteredPosts = posts.filter(post => {
    const matchesSearch = searchQuery === '' || 
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = activeCategory === null || 
      post.category_id === activeCategory;
    
    return matchesSearch && matchesCategory;
  });

  return (
    <BlogContext.Provider value={{
      posts: filteredPosts,
      categories,
      featuredPosts,
      isLoading,
      error,
      searchQuery,
      setSearchQuery,
      activeCategory,
      setActiveCategory,
      getPostBySlug,
      getRelatedPosts
    }}>
      {children}
    </BlogContext.Provider>
  );
};
