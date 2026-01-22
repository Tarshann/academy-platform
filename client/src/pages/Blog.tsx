import { Link, useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { trpc } from "@/lib/trpc";
import { Loader2, Calendar, User } from "lucide-react";
import { SEO } from "@/components/SEO";

const categoryLabels: Record<string, string> = {
  training_tips: "Training Tips",
  athlete_spotlight: "Athlete Spotlight",
  news: "News",
  events: "Events",
  other: "Other",
};

export default function Blog() {
  const { data: posts, isLoading } = trpc.blog.list.useQuery();

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <SEO 
        title="Blog" 
        description="Training tips, athlete spotlights, news, and updates from The Academy." 
      />
      <Navigation />
      
      <main id="main-content" className="flex-1">
        {/* Hero */}
        <section className="py-16 bg-gradient-to-br from-background via-card to-background">
          <div className="container">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">Academy Blog</h1>
              <p className="text-lg text-muted-foreground">
                Training tips, athlete spotlights, news, and updates from The Academy
              </p>
            </div>
          </div>
        </section>

        {/* Blog Posts */}
        <section className="py-16">
          <div className="container">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="animate-spin text-primary" size={48} />
              </div>
            ) : !posts || posts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-lg">No blog posts yet. Check back soon!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {posts.map((post) => (
                  <Link key={post.id} href={`/blog/${post.slug}`}>
                    <Card className="bg-card border-border hover:shadow-lg transition-shadow cursor-pointer h-full flex flex-col">
                      {post.featuredImage && (
                        <div className="aspect-video w-full overflow-hidden rounded-t-lg">
                          <img
                            src={post.featuredImage}
                            alt={post.title}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        </div>
                      )}
                      <CardHeader>
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="secondary">
                            {categoryLabels[post.category] || post.category}
                          </Badge>
                        </div>
                        <CardTitle className="text-foreground line-clamp-2">{post.title}</CardTitle>
                        {post.excerpt && (
                          <CardDescription className="text-muted-foreground line-clamp-3">
                            {post.excerpt}
                          </CardDescription>
                        )}
                      </CardHeader>
                      <CardContent className="flex-1 flex flex-col justify-end">
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          {post.publishedAt && (
                            <div className="flex items-center gap-1">
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
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
