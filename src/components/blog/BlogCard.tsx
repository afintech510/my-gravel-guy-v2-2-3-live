
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "lucide-react";
import { format } from 'date-fns';

interface BlogCardProps {
  title: string;
  excerpt: string;
  slug: string;
  featuredImage?: string | null;
  category?: string;
  publishedAt: string;
  author?: string;
  className?: string;
}

const BlogCard = ({
  title,
  excerpt,
  slug,
  featuredImage,
  category,
  publishedAt,
  author,
  className = ""
}: BlogCardProps) => {
  return (
    <Card className={`overflow-hidden transition-all hover:shadow-md ${className}`}>
      <Link to={`/blog/${slug}`} className="block">
        <div className="aspect-video w-full overflow-hidden">
          <img
            src={featuredImage || '/placeholder.svg'}
            alt={title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform hover:scale-105"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/placeholder.svg';
            }}
          />
        </div>
        <CardHeader className="p-4">
          {category && (
            <Badge variant="secondary" className="mb-2 self-start">
              {category}
            </Badge>
          )}
          <h3 className="text-xl font-bold line-clamp-2">{title}</h3>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <p className="text-muted-foreground line-clamp-3">{excerpt}</p>
        </CardContent>
        <CardFooter className="p-4 pt-0 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <time dateTime={publishedAt}>
              {format(new Date(publishedAt), 'MMM d, yyyy')}
            </time>
          </div>
          {author && (
            <div className="ml-auto">
              By {author}
            </div>
          )}
        </CardFooter>
      </Link>
    </Card>
  );
};

export default BlogCard;
