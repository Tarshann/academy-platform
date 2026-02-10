import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { trpc } from "@/lib/trpc";
import { Calendar, FileText, Newspaper, Trophy, Users } from "lucide-react";
import { BlogPostCardSkeleton } from "@/components/skeletons/BlogPostCardSkeleton";
import { SEO } from "@/components/SEO";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Button } from "@/components/ui/button";

const categoryLabels: Record<string, string> = {
  training_tips: "Training Tips",
  athlete_spotlight: "Athlete Spotlight",
  news: "News",
  events: "Events",
  other: "Other",
};

const upcomingTopics = [
  {
    icon: Trophy,
    title: "Tournament Recaps",
    description: "Follow our teams' journey through tournaments and competitions"
  },
  {
    icon: Users,
    title: "Athlete Spotlights",
    description: "Get to know our athletes and their basketball journeys"
  },
  {
    icon: FileText,
    title: "Training Tips",
    description: "Expert advice from our coaches to improve your game"
  },
  {
    icon: Newspaper,
    title: "Academy News",
    description: "Stay updated on programs, events, and announcements"
  },
];

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
        <div className="container pt-6">
          <Breadcrumbs items={[{ label: "Blog" }]} />
        </div>

        {/* Hero */}
        <section className="py-16 bg-gradient-to-b from-primary/10 to-background">
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <BlogPostCardSkeleton />
                <BlogPostCardSkeleton />
                <BlogPostCardSkeleton />
              </div>
            ) : !posts || posts.length === 0 ? (
              <div className="max-w-4xl mx-auto">
                {/* Coming Soon Message */}
                <div className="text-center mb-12">
                  <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
                    <Newspaper className="w-10 h-10 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold mb-4">Blog Coming Soon</h2>
                  <p className="text-muted-foreground max-w-lg mx-auto">
                    We're working on bringing you great content. In the meantime, follow us on social media for the latest updates.
                  </p>
                </div>

                {/* What to Expect */}
                <div className="mb-12">
                  <h3 className="text-xl font-semibold text-center mb-8">What to Expect</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {upcomingTopics.map((topic, index) => (
                      <Card key={index} className="bg-card/50">
                        <CardContent className="p-6 flex items-start gap-4">
                          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <topic.icon className="w-6 h-6 text-primary" />
                          </div>
                          <div>
                            <h4 className="font-semibold mb-1">{topic.title}</h4>
                            <p className="text-sm text-muted-foreground">{topic.description}</p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Social Links */}
                <div className="text-center">
                  <p className="text-muted-foreground mb-4">Follow us for the latest content</p>
                  <div className="flex justify-center gap-4">
                    <a
                      href="https://www.tiktok.com/@academytn"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
                      </svg>
                      TikTok
                    </a>
                    <a
                      href="https://www.instagram.com/the_academytn"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:opacity-90 transition-opacity"
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                      </svg>
                      Instagram
                    </a>
                    <a
                      href="https://www.facebook.com/share/1DY8v2AEuN/?mibextid=wwXIfr"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-[#1877f2] text-white rounded-lg hover:bg-[#166fe5] transition-colors"
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                      Facebook
                    </a>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {posts.map((post: any) => (
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

        {/* CTA Section */}
        <section className="py-16 bg-primary/5">
          <div className="container text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Ready to Start Training?
            </h2>
            <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
              Join The Academy and take your game to the next level
            </p>
            <Link href="/programs">
              <Button size="lg">View Programs</Button>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
