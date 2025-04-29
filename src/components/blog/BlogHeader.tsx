
import React from 'react';
import { Helmet } from 'react-helmet-async';

interface BlogHeaderProps {
  title: string;
  description?: string;
  imageUrl?: string;
  children?: React.ReactNode;
}

const BlogHeader = ({ 
  title, 
  description, 
  imageUrl,
  children 
}: BlogHeaderProps) => {
  return (
    <>
      <Helmet>
        <title>{title} | My Gravel Guy Blog</title>
        {description && <meta name="description" content={description} />}
        {imageUrl && <meta property="og:image" content={imageUrl} />}
      </Helmet>
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">{title}</h1>
          {description && (
            <p className="text-xl text-muted-foreground mb-6">{description}</p>
          )}
          {children}
        </div>
      </div>
    </>
  );
};

export default BlogHeader;
