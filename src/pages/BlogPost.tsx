
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useBlog } from '@/contexts/BlogContext';
import BlogHeader from '@/components/blog/BlogHeader';
import RelatedPosts from '@/components/blog/RelatedPosts';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { Separator } from '@/components/ui/separator';
import NotFound from './NotFound';

const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();
  const { getPostBySlug } = useBlog();
  const [post, setPost] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPost = async () => {
      if (!slug) return;
      
      setIsLoading(true);
      try {
        const postData = await getPostBySlug(slug);
        setPost(postData);
      } catch (err) {
        console.error('Error fetching post:', err);
        setError('Failed to load the blog post.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPost();
  }, [slug, getPostBySlug]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-xl text-muted-foreground">Loading article...</p>
      </div>
    );
  }

  if (error || !post) {
    return <NotFound />;
  }

  return (
    <>
      <Helmet>
        <title>{post.meta_title || post.title} | My Gravel Guy Blog</title>
        <meta name="description" content={post.meta_description || post.excerpt} />
        {post.featured_image && <meta property="og:image" content={post.featured_image} />}
      </Helmet>

      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <Button variant="ghost" asChild>
              <Link to="/blog" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to all articles
              </Link>
            </Button>
          </div>
          
          <article className="max-w-4xl mx-auto bg-white rounded-lg shadow overflow-hidden">
            {post.featured_image && (
              <div className="aspect-video w-full">
                <img 
                  src={post.featured_image} 
                  alt={post.title}
                  className="w-full h-full object-cover" 
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/placeholder.svg';
                  }}
                />
              </div>
            )}
            
            <div className="p-6 md:p-8">
              <div className="mb-6">
                {post.categoryName && (
                  <Badge variant="secondary" className="mb-3">
                    {post.categoryName}
                  </Badge>
                )}
                <h1 className="text-3xl md:text-4xl font-bold mb-4">{post.title}</h1>
                
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <time dateTime={post.published_at}>
                    {format(new Date(post.published_at), 'MMMM d, yyyy')}
                  </time>
                  {post.author && (
                    <span className="ml-2">by {post.author}</span>
                  )}
                </div>
              </div>
              
              <Separator className="my-6" />
              
              <div 
                className="prose max-w-none"
                dangerouslySetInnerHTML={{ __html: post.content }} 
              />
              
              <Separator className="my-8" />
              
              {post.category_id && (
                <RelatedPosts 
                  categoryId={post.category_id} 
                  currentPostId={post.id} 
                />
              )}
            </div>
          </article>
        </div>
      </div>
    </>
  );
};

export default BlogPost;
