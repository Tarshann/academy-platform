import { useState } from "react";
import { motion } from "framer-motion";
import { Play, Eye } from "lucide-react";
import { Link } from "wouter";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function Videos() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<any>(null);
  
  const { data: videos, isLoading } = trpc.videos.list.useQuery();
  
  const categories = [
    { id: "all", label: "All Videos", value: null },
    { id: "drills", label: "Drills", value: "drills" },
    { id: "technique", label: "Technique", value: "technique" },
    { id: "conditioning", label: "Conditioning", value: "conditioning" },
    { id: "games", label: "Game Footage", value: "games" },
  ];
  
  const filteredVideos = selectedCategory
    ? videos?.filter((v: any) => v.category === selectedCategory)
    : videos;
  
  // Extract video ID from YouTube or Vimeo URL
  const getEmbedUrl = (url: string) => {
    if (url.includes("youtube.com") || url.includes("youtu.be")) {
      const videoId = url.includes("youtu.be") 
        ? url.split("/").pop()?.split("?")[0]
        : new URL(url).searchParams.get("v");
      return `https://www.youtube.com/embed/${videoId}`;
    }
    if (url.includes("vimeo.com")) {
      const videoId = url.split("/").pop();
      return `https://player.vimeo.com/video/${videoId}`;
    }
    return url;
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-neutral-100">
      <Navigation />
      
      <main id="main-content" className="pt-24 pb-20">
        <div className="container px-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="text-5xl md:text-6xl font-black mb-6">
              <span className="bg-gradient-to-r from-amber-600 to-yellow-600 bg-clip-text text-transparent">
                Video Library
              </span>
            </h1>
            <p className="text-xl text-neutral-600 max-w-2xl mx-auto">
              Watch training demonstrations, technique tutorials, and game footage to improve your skills
            </p>
          </motion.div>
          
          {/* Category Filter */}
          <div className="flex flex-wrap justify-center gap-3 mb-12">
            {categories.map((cat) => (
              <Button
                key={cat.id}
                variant={selectedCategory === cat.value ? "default" : "outline"}
                onClick={() => setSelectedCategory(cat.value)}
                className={selectedCategory === cat.value ? "bg-gradient-to-r from-amber-500 to-yellow-600 text-black font-bold" : ""}
              >
                {cat.label}
              </Button>
            ))}
          </div>
          
          {/* Videos Grid */}
          {isLoading ? (
            <div className="text-center py-20">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-amber-500 border-t-transparent"></div>
            </div>
          ) : filteredVideos && filteredVideos.length > 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {filteredVideos.map((video: any) => (
                <motion.div
                  key={video.id}
                  id={`video-${video.id}`}
                  whileHover={{ scale: 1.03 }}
                  className="cursor-pointer scroll-mt-24"
                  onClick={() => setSelectedVideo(video)}
                >
                  <Card className="overflow-hidden hover:shadow-2xl transition-shadow duration-300">
                    <div className="relative aspect-video bg-neutral-900">
                      {video.thumbnailUrl ? (
                        <img
                          src={video.thumbnailUrl}
                          alt={video.title || `Video: ${video.category}`}
                          loading="lazy"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Play className="w-16 h-16 text-amber-500" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <Play className="w-16 h-16 text-white" />
                      </div>
                    </div>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-semibold px-2 py-1 rounded bg-amber-100 text-amber-800">
                          {video.category}
                        </span>
                        <span className="text-xs text-neutral-500 flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {video.viewCount || 0}
                        </span>
                      </div>
                      <h3 className="font-bold text-lg mb-2 line-clamp-2">{video.title}</h3>
                      {video.description && (
                        <p className="text-sm text-neutral-600 line-clamp-2">{video.description}</p>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div className="text-center py-20">
              <div className="max-w-md mx-auto">
                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-neutral-100 flex items-center justify-center">
                  <Play className="w-12 h-12 text-neutral-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-neutral-900">No videos available yet</h3>
                <p className="text-neutral-500 mb-6">
                  We're working on adding training videos and highlights. Check back soon!
                </p>
                <Link href="/programs">
                  <Button variant="outline">Explore Programs</Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
      
      {/* Video Player Dialog */}
      <Dialog open={!!selectedVideo} onOpenChange={() => setSelectedVideo(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{selectedVideo?.title}</DialogTitle>
          </DialogHeader>
          {selectedVideo && (
            <div>
              <div className="aspect-video bg-black rounded-lg overflow-hidden mb-4">
                <iframe
                  src={getEmbedUrl(selectedVideo.videoUrl)}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
              {selectedVideo.description && (
                <p className="text-neutral-700">{selectedVideo.description}</p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      <Footer />
    </div>
  );
}
