import { useState } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

const galleryPhotos = [
  {
    id: 1,
    url: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663204873520/WnUtjaTtiicfvTcM.png",
    title: "Summer Camp Group",
    category: "events",
    description: "Youth athletes at our annual summer basketball camp"
  },
  {
    id: 2,
    url: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663204873520/LoTkDHgnwoQfPrSa.png",
    title: "Girls Team",
    category: "teams",
    description: "Academy girls team ready for tournament competition"
  },
  {
    id: 3,
    url: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663204873520/bHWlHCSeLtHjxEEQ.png",
    title: "Shooting Practice",
    category: "training",
    description: "Working on proper shooting form and technique"
  },
  {
    id: 4,
    url: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663204873520/cneaVkHZVVMAdQwz.png",
    title: "Team Huddle",
    category: "training",
    description: "Coach leading team huddle at Sumner Academy"
  },
  {
    id: 5,
    url: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663204873520/sUtbjurQhVuawLiA.png",
    title: "Coach Instruction",
    category: "training",
    description: "Hands-on coaching during skills session"
  },
  {
    id: 6,
    url: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663204873520/ocpoHaLBcigVkfYx.png",
    title: "Dribbling Drill",
    category: "training",
    description: "Ball handling drills with cone work"
  },
  {
    id: 7,
    url: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663204873520/ZrvwDrwlNAjLdWMh.png",
    title: "One-on-One Training",
    category: "training",
    description: "Individual skill development session"
  },
  {
    id: 8,
    url: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663204873520/EHhkFKpZPIRhKBhk.jpeg",
    title: "Free Throw Practice",
    category: "training",
    description: "Athletes working on free throw fundamentals"
  },
  {
    id: 9,
    url: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663204873520/ycReYGSogWWXZoQk.jpeg",
    title: "Shooting Form",
    category: "training",
    description: "Developing proper shooting mechanics"
  },
  {
    id: 10,
    url: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663204873520/QxrXovSzWgTZmpuQ.jpeg",
    title: "Dribble Move",
    category: "training",
    description: "Working on crossover and ball control"
  },
];

const categories = [
  { value: "all", label: "All Photos" },
  { value: "training", label: "Training" },
  { value: "teams", label: "Teams" },
  { value: "events", label: "Events" },
];

export default function Gallery() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  const filteredPhotos = selectedCategory === "all"
    ? galleryPhotos
    : galleryPhotos.filter(photo => photo.category === selectedCategory);

  const openLightbox = (index: number) => {
    setCurrentPhotoIndex(index);
    setLightboxOpen(true);
  };

  const nextPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev + 1) % filteredPhotos.length);
  };

  const prevPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev - 1 + filteredPhotos.length) % filteredPhotos.length);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />
      
      <main id="main-content" className="flex-1">
        <div className="container pt-6">
          <Breadcrumbs items={[{ label: "Gallery" }]} />
        </div>

        {/* Hero Section */}
        <section className="bg-gradient-to-b from-primary/10 to-background py-16">
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
                  className="min-w-[100px]"
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPhotos.map((photo, index) => (
                <div
                  key={photo.id}
                  className="group relative overflow-hidden rounded-xl bg-muted cursor-pointer shadow-md hover:shadow-xl transition-all duration-300"
                  onClick={() => openLightbox(index)}
                >
                  <div className="aspect-[4/3] overflow-hidden">
                    <img
                      src={photo.url}
                      alt={photo.title}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                      <h3 className="font-semibold text-lg">{photo.title}</h3>
                      <p className="text-sm text-white/80">{photo.description}</p>
                    </div>
                  </div>
                  <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="px-3 py-1 text-xs font-medium rounded-full bg-white/90 text-gray-800 capitalize">
                      {photo.category}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {filteredPhotos.length === 0 && (
              <div className="text-center py-16">
                <p className="text-muted-foreground">No photos in this category yet.</p>
              </div>
            )}
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-primary/5">
          <div className="container text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Want to be part of our gallery?
            </h2>
            <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
              Join The Academy and become part of our growing community of athletes
            </p>
            <Button size="lg" asChild>
              <a href="/signup">Register Now</a>
            </Button>
          </div>
        </section>
      </main>

      {/* Lightbox Dialog */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-5xl w-full p-0 bg-black/95 border-none">
          <div className="relative">
            <button
              onClick={() => setLightboxOpen(false)}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            >
              <X className="w-6 h-6 text-white" />
            </button>
            
            <button
              onClick={prevPhoto}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            >
              <ChevronLeft className="w-8 h-8 text-white" />
            </button>
            
            <button
              onClick={nextPhoto}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            >
              <ChevronRight className="w-8 h-8 text-white" />
            </button>

            <div className="flex items-center justify-center min-h-[60vh] p-8">
              <img
                src={filteredPhotos[currentPhotoIndex]?.url}
                alt={filteredPhotos[currentPhotoIndex]?.title}
                className="max-w-full max-h-[70vh] object-contain rounded-lg"
              />
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black to-transparent">
              <h3 className="text-white text-xl font-semibold">
                {filteredPhotos[currentPhotoIndex]?.title}
              </h3>
              <p className="text-white/70">
                {filteredPhotos[currentPhotoIndex]?.description}
              </p>
              <p className="text-white/50 text-sm mt-2">
                {currentPhotoIndex + 1} of {filteredPhotos.length}
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
