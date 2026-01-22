import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { trpc } from "@/lib/trpc";
import { Loader2, Calendar, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SEO } from "@/components/SEO";

const categoryLabels: Record<string, string> = {
  training_tips: "Training Tips",
  athlete_spotlight: "Athlete Spotlight",
  news: "News",
  events: "Events",
  other: "Other",
};

interface BlogPostProps {
  slug?: string;
  params?: { slug: string };
}

export default function BlogPost({ slug: propSlug, params }: BlogPostProps = {}) {
  const [, setLocation] = useLocation();
  const slug = propSlug || params?.slug || window.location.pathname.split('/blog/')[1] || '';
  const { data: post, isLoading } = trpc.blog.getBySlug.useQuery({ slug }, { enabled: !!slug });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navigation />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Post Not Found</h1>
            <Button onClick={() => setLocation('/blog')}>Back to Blog</Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <SEO 
        title={post.title}
        description={post.excerpt || post.title}
        image={post.featuredImage}
      />
      <Navigation />
      
      <main id="main-content" className="flex-1">
        <article className="py-16">
          <div className="container max-w-4xl">
            <Button
              variant="ghost"
              onClick={() => setLocation('/blog')}
              className="mb-8"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Blog
            </Button>

            {post.featuredImage && (
              <div className="aspect-video w-full overflow-hidden rounded-lg mb-8">
                <img
                  src={post.featuredImage}
                  alt={post.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            )}

            <div className="mb-6">
              <div className="flex items-center gap-2 mb-4">
                <Badge variant="secondary">
                  {categoryLabels[post.category] || post.category}
                </Badge>
                {post.publishedAt && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {new Date(post.publishedAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                )}
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">{post.title}</h1>
              {post.excerpt && (
                <p className="text-xl text-muted-foreground mb-6">{post.excerpt}</p>
              )}
            </div>

            <Card className="bg-card border-border">
              <CardContent className="prose prose-lg max-w-none p-8">
                <div 
                  className="blog-content"
                  dangerouslySetInnerHTML={{ __html: post.content }}
                />
              </CardContent>
            </Card>

            {post.tags && (
              <div className="mt-8 flex flex-wrap gap-2">
                {post.tags.split(',').map((tag, index) => (
                  <Badge key={index} variant="outline">
                    {tag.trim()}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </article>
      </main>

      <Footer />
    </div>
  );
}
