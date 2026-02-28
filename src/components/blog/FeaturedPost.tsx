
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "lucide-react";
import { format } from 'date-fns';

interface FeaturedPostProps {
  title: string;
  excerpt: string;
  slug: string;
  featuredImage?: string | null;
  category?: string;
  publishedAt: string;
  author?: string;
}

const FeaturedPost = ({
  title,
  excerpt,
  slug,
  featuredImage,
  category,
  publishedAt,
  author
}: FeaturedPostProps) => {
  return (
    <div className="relative overflow-hidden rounded-lg bg-background border shadow-sm">
      <div className="grid md:grid-cols-2 gap-6">
        <div className="aspect-video overflow-hidden">
          <img
            src={featuredImage || '/placeholder.svg'}
            alt={title}
            loading="lazy"
            className="h-full w-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/placeholder.svg';
            }}
          />
        </div>
        <div className="p-6 flex flex-col justify-center">
          <div className="space-y-4">
            {category && (
              <Badge variant="secondary" className="mb-2">
                {category}
              </Badge>
            )}
            <h2 className="text-3xl font-bold tracking-tight">{title}</h2>
            <p className="text-muted-foreground">{excerpt}</p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <time dateTime={publishedAt}>
                {format(new Date(publishedAt), 'MMM d, yyyy')}
              </time>
              {author && (
                <span className="ml-2">by {author}</span>
              )}
            </div>
            <Button asChild>
              <Link to={`/blog/${slug}`}>Read Article</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeaturedPost;
