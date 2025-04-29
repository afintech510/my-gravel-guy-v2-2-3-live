
import React, { useEffect, useState } from 'react';
import { useBlog } from '@/contexts/BlogContext';
import BlogCard from './BlogCard';

interface RelatedPostsProps {
  categoryId: string;
  currentPostId: string;
}

const RelatedPosts = ({ categoryId, currentPostId }: RelatedPostsProps) => {
  const { getRelatedPosts } = useBlog();
  const [relatedPosts, setRelatedPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRelatedPosts = async () => {
      setLoading(true);
      const posts = await getRelatedPosts(categoryId, currentPostId);
      setRelatedPosts(posts);
      setLoading(false);
    };

    fetchRelatedPosts();
  }, [categoryId, currentPostId, getRelatedPosts]);

  if (loading) {
    return <div className="py-8 text-center">Loading related posts...</div>;
  }

  if (relatedPosts.length === 0) {
    return null;
  }

  return (
    <div className="py-8">
      <h3 className="text-2xl font-bold mb-4">Related Articles</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {relatedPosts.map((post) => (
          <BlogCard
            key={post.id}
            title={post.title}
            excerpt={post.excerpt}
            slug={post.slug}
            featuredImage={post.featured_image}
            category={post.categoryName}
            publishedAt={post.published_at}
            author={post.author}
          />
        ))}
      </div>
    </div>
  );
};

export default RelatedPosts;
