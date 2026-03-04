
import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useBlog } from '@/contexts/BlogContext';
import BlogCard from '@/components/blog/BlogCard';
import BlogSearch from '@/components/blog/BlogSearch';
import CategoryFilter from '@/components/blog/CategoryFilter';
import FeaturedPost from '@/components/blog/FeaturedPost';
import { Separator } from '@/components/ui/separator';

const Blog = () => {
  const { posts, featuredPosts, isLoading, error } = useBlog();
  
  const featuredPost = featuredPosts.length > 0 ? featuredPosts[0] : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>Blog | My Gravel Guy</title>
        <meta name="description" content="Expert tips and advice on gravel, sand, and dirt for your landscaping and construction projects." />
        <link rel="canonical" href="https://mygravelguy.com/blog" />
        <meta property="og:title" content="Blog | My Gravel Guy" />
        <meta property="og:description" content="Expert tips and advice on gravel, sand, and dirt for your landscaping and construction projects." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://mygravelguy.com/blog" />
      </Helmet>

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-2">Blog</h1>
        <p className="text-lg text-muted-foreground mb-8">
          Expert tips and advice for your gravel, sand, and dirt projects
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-8">
          <div className="lg:col-span-3">
            <BlogSearch />
          </div>
        </div>
        
        <CategoryFilter />

        {isLoading ? (
          <div className="py-20 text-center">
            <p className="text-xl text-muted-foreground">Loading blog posts...</p>
          </div>
        ) : error ? (
          <div className="py-20 text-center">
            <p className="text-xl text-red-500">{error}</p>
          </div>
        ) : (
          <div className="py-8">
            {featuredPost && (
              <div className="mb-12">
                <h2 className="text-2xl font-bold mb-6">Featured Article</h2>
                <FeaturedPost
                  title={featuredPost.title}
                  excerpt={featuredPost.excerpt}
                  slug={featuredPost.slug}
                  featuredImage={featuredPost.featured_image}
                  category={featuredPost.categoryName}
                  publishedAt={featuredPost.published_at}
                  author={featuredPost.author || undefined}
                />
              </div>
            )}

            <Separator className="my-8" />

            <h2 className="text-2xl font-bold mb-6">Latest Articles</h2>
            {posts.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground">No articles found.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {posts.map((post) => (
                  <BlogCard
                    key={post.id}
                    title={post.title}
                    excerpt={post.excerpt}
                    slug={post.slug}
                    featuredImage={post.featured_image}
                    category={post.categoryName}
                    publishedAt={post.published_at}
                    author={post.author || undefined}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Blog;
