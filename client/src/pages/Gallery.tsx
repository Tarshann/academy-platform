import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const categories = [
  { value: "all", label: "All Photos" },
  { value: "training", label: "Training Sessions" },
  { value: "teams", label: "Teams" },
  { value: "events", label: "Events" },
  { value: "facilities", label: "Facilities" },
];

export default function Gallery() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  
  const { data: photos, isLoading } = selectedCategory === "all"
    ? trpc.gallery.list.useQuery()
    : trpc.gallery.byCategory.useQuery({ category: selectedCategory });
  const visiblePhotos = (photos ?? []).filter((photo: any) =>
    !String(photo.title || "").toLowerCase().includes("test") &&
    !String(photo.description || "").toLowerCase().includes("test")
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />
      
      <main id="main-content" className="flex-1">
        {/* Hero Section */}
        <section className="bg-primary/10 py-16">
          <div className="container">
            <h1 className="text-4xl md:text-5xl font-bold text-center mb-4">
              Photo Gallery
            </h1>
            <p className="text-xl text-center text-muted-foreground max-w-2xl mx-auto">
              See our athletes in action - training sessions, team moments, and Academy events
            </p>
          </div>
        </section>

        {/* Category Filter */}
        <section className="py-8 border-b">
          <div className="container">
            <div className="flex flex-wrap gap-2 justify-center">
              {categories.map((category) => (
                <Button
                  key={category.value}
                  variant={selectedCategory === category.value ? "default" : "outline"}
                  onClick={() => setSelectedCategory(category.value)}
                >
                  {category.label}
                </Button>
              ))}
            </div>
          </div>
        </section>

        {/* Photo Grid */}
        <section className="py-12">
          <div className="container">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <Card key={i}>
                    <Skeleton className="h-64 w-full" />
                    <CardContent className="p-4">
                      <Skeleton className="h-6 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : visiblePhotos.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {visiblePhotos.map((photo) => (
                  <Card key={photo.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="aspect-video relative overflow-hidden bg-muted">
                      <img
                        src={photo.imageUrl}
                        alt={photo.title || `Gallery photo in ${photo.category} category`}
                        loading="lazy"
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-lg mb-2">{photo.title}</h3>
                      {photo.description && (
                        <p className="text-sm text-muted-foreground">{photo.description}</p>
                      )}
                      <div className="mt-2">
                        <span className="inline-block px-2 py-1 text-xs rounded-full bg-primary/10 text-primary">
                          {photo.category}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="max-w-md mx-auto">
                  <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
                    <svg
                      className="w-12 h-12 text-muted-foreground"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">No photos yet</h3>
                  <p className="text-muted-foreground mb-6">
                    We're working on adding photos to this category. Check back soon for updates!
                  </p>
                  <Link href="/gallery">
                    <Button variant="outline">View All Photos</Button>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
