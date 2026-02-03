import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { Play, ExternalLink, Search, SortAsc, Loader2 } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { trpc } from "@/lib/trpc";

// Default/fallback videos (used when database is empty)
const defaultVideos = [
  {
    id: "tt1",
    url: "https://www.tiktok.com/@cspringsacademy/video/7426665432193920298",
    title: "Training Highlights",
    category: "training",
    thumbnail: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663204873520/cneaVkHZVVMAdQwz.png",
    platform: "tiktok" as const,
    date: "2024-12-01"
  },
  {
    id: "tt2",
    url: "https://www.tiktok.com/@cspringsacademy/video/7426652015718460714",
    title: "Skills Development",
    category: "training",
    thumbnail: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663204873520/sUtbjurQhVuawLiA.png",
    platform: "tiktok" as const,
    date: "2024-11-28"
  },
  {
    id: "tt3",
    url: "https://www.tiktok.com/@cspringsacademy/video/7426651330054538539",
    title: "Dribbling Drills",
    category: "training",
    thumbnail: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663204873520/ocpoHaLBcigVkfYx.png",
    platform: "tiktok" as const,
    date: "2024-11-25"
  },
  {
    id: "tt4",
    url: "https://www.tiktok.com/@cspringsacademy/video/7426650617190679851",
    title: "Shooting Practice",
    category: "training",
    thumbnail: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663204873520/bHWlHCSeLtHjxEEQ.png",
    platform: "tiktok" as const,
    date: "2024-11-20"
  },
  {
    id: "tt5",
    url: "https://www.tiktok.com/@cspringsacademy/video/7426649984685289771",
    title: "Team Training",
    category: "training",
    thumbnail: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663204873520/ZrvwDrwlNAjLdWMh.png",
    platform: "tiktok" as const,
    date: "2024-11-15"
  },
  {
    id: "tt6",
    url: "https://www.tiktok.com/@cspringsacademy/video/7426649426347912491",
    title: "Ball Handling",
    category: "training",
    thumbnail: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663204873520/EHhkFKpZPIRhKBhk.jpeg",
    platform: "tiktok" as const,
    date: "2024-11-10"
  },
  {
    id: "tt7",
    url: "https://www.tiktok.com/@cspringsacademy/video/7426648763882748203",
    title: "Footwork Fundamentals",
    category: "training",
    thumbnail: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663204873520/ycReYGSogWWXZoQk.jpeg",
    platform: "tiktok" as const,
    date: "2024-11-05"
  },
  {
    id: "tt8",
    url: "https://www.tiktok.com/@cspringsacademy/video/7426648066550359339",
    title: "Conditioning",
    category: "training",
    thumbnail: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663204873520/QxrXovSzWgTZmpuQ.jpeg",
    platform: "tiktok" as const,
    date: "2024-10-30"
  },
  {
    id: "tt9",
    url: "https://www.tiktok.com/@cspringsacademy/video/7426647407243523371",
    title: "Game Prep",
    category: "highlights",
    thumbnail: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663204873520/WnUtjaTtiicfvTcM.png",
    platform: "tiktok" as const,
    date: "2024-10-25"
  },
  {
    id: "tt10",
    url: "https://www.tiktok.com/@cspringsacademy/video/7426646709697204523",
    title: "Youth Development",
    category: "training",
    thumbnail: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663204873520/LoTkDHgnwoQfPrSa.png",
    platform: "tiktok" as const,
    date: "2024-10-20"
  },
  {
    id: "tt11",
    url: "https://www.tiktok.com/@cspringsacademy/video/7426646007474175275",
    title: "Academy Life",
    category: "highlights",
    thumbnail: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663204873520/WnUtjaTtiicfvTcM.png",
    platform: "tiktok" as const,
    date: "2024-10-15"
  },
  {
    id: "ig1",
    url: "https://www.instagram.com/reel/DDVpkOWRPTc/",
    title: "Training Session",
    category: "training",
    thumbnail: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663204873520/cneaVkHZVVMAdQwz.png",
    platform: "instagram" as const,
    date: "2024-12-02"
  },
  {
    id: "ig2",
    url: "https://www.instagram.com/reel/DDVpJcMRVgJ/",
    title: "Skills Work",
    category: "training",
    thumbnail: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663204873520/sUtbjurQhVuawLiA.png",
    platform: "instagram" as const,
    date: "2024-11-30"
  },
  {
    id: "ig3",
    url: "https://www.instagram.com/reel/DDVo1qMR_Xv/",
    title: "Practice Highlights",
    category: "highlights",
    thumbnail: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663204873520/ocpoHaLBcigVkfYx.png",
    platform: "instagram" as const,
    date: "2024-11-27"
  },
  {
    id: "ig4",
    url: "https://www.instagram.com/p/DDVoqVqxWXC/",
    title: "Team Photo",
    category: "highlights",
    thumbnail: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663204873520/LoTkDHgnwoQfPrSa.png",
    platform: "instagram" as const,
    date: "2024-11-22"
  },
  {
    id: "ig5",
    url: "https://www.instagram.com/p/DDVoZYJx3Vy/",
    title: "Camp Moments",
    category: "highlights",
    thumbnail: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663204873520/WnUtjaTtiicfvTcM.png",
    platform: "instagram" as const,
    date: "2024-11-18"
  },
  {
    id: "ig6",
    url: "https://www.instagram.com/p/DDVoH-Yx_Wk/",
    title: "Shooting Form",
    category: "training",
    thumbnail: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663204873520/bHWlHCSeLtHjxEEQ.png",
    platform: "instagram" as const,
    date: "2024-11-12"
  },
  {
    id: "ig7",
    url: "https://www.instagram.com/p/DDVn4rnRgvH/",
    title: "Dribble Moves",
    category: "training",
    thumbnail: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663204873520/ZrvwDrwlNAjLdWMh.png",
    platform: "instagram" as const,
    date: "2024-11-08"
  },
];

const categories = [
  { value: "all", label: "All Videos" },
  { value: "training", label: "Training" },
  { value: "highlights", label: "Highlights" },
];

const sortOptions = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "tiktok", label: "TikTok First" },
  { value: "instagram", label: "Instagram First" },
  { value: "az", label: "A-Z" },
  { value: "za", label: "Z-A" },
];

const VIDEOS_PER_PAGE = 8;

export default function Videos() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [searchQuery, setSearchQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(VIDEOS_PER_PAGE);
  const [isLoading, setIsLoading] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Fetch videos from database
  const { data: dbVideos } = trpc.videos.list.useQuery(undefined, {
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  // Use database videos if available, otherwise use defaults
  const allVideos = useMemo(() => {
    if (dbVideos && dbVideos.length > 0) {
      return dbVideos.map((v: any) => ({
        id: v.id.toString(),
        url: v.url,
        title: v.title,
        category: v.category,
        thumbnail: v.thumbnail || "https://files.manuscdn.com/user_upload_by_module/session_file/310519663204873520/cneaVkHZVVMAdQwz.png",
        platform: v.platform as "tiktok" | "instagram",
        date: v.createdAt ? new Date(v.createdAt).toISOString().split('T')[0] : "2024-01-01"
      }));
    }
    return defaultVideos;
  }, [dbVideos]);

  // Filter and sort videos
  const processedVideos = useMemo(() => {
    let videos = [...allVideos];

    // Filter by category
    if (selectedCategory !== "all") {
      videos = videos.filter(v => v.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      videos = videos.filter(v => 
        v.title.toLowerCase().includes(query) ||
        v.category.toLowerCase().includes(query)
      );
    }

    // Sort videos
    switch (sortBy) {
      case "newest":
        videos.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        break;
      case "oldest":
        videos.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        break;
      case "tiktok":
        videos.sort((a, b) => {
          if (a.platform === "tiktok" && b.platform !== "tiktok") return -1;
          if (a.platform !== "tiktok" && b.platform === "tiktok") return 1;
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        });
        break;
      case "instagram":
        videos.sort((a, b) => {
          if (a.platform === "instagram" && b.platform !== "instagram") return -1;
          if (a.platform !== "instagram" && b.platform === "instagram") return 1;
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        });
        break;
      case "az":
        videos.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "za":
        videos.sort((a, b) => b.title.localeCompare(a.title));
        break;
    }

    return videos;
  }, [allVideos, selectedCategory, sortBy, searchQuery]);

  // Reset visible count when filters change
  useEffect(() => {
    setVisibleCount(VIDEOS_PER_PAGE);
  }, [selectedCategory, sortBy, searchQuery]);

  const visibleVideos = processedVideos.slice(0, visibleCount);
  const hasMore = visibleCount < processedVideos.length;

  // Infinite scroll handler
  const loadMore = useCallback(() => {
    if (!hasMore || isLoading) return;
    
    setIsLoading(true);
    // Simulate loading delay for smooth UX
    setTimeout(() => {
      setVisibleCount(prev => Math.min(prev + VIDEOS_PER_PAGE, processedVideos.length));
      setIsLoading(false);
    }, 300);
  }, [hasMore, isLoading, processedVideos.length]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          loadMore();
        }
      },
      { threshold: 0.1, rootMargin: "100px" }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, isLoading, loadMore]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />
      
      <main id="main-content" className="flex-1">
        <div className="container pt-6">
          <Breadcrumbs items={[{ label: "Videos" }]} />
        </div>

        {/* Hero Section */}
        <section className="bg-gradient-to-b from-primary/10 to-background py-16">
          <div className="container">
            <h1 className="text-4xl md:text-5xl font-bold text-center mb-4">
              Video Library
            </h1>
            <p className="text-xl text-center text-muted-foreground max-w-2xl mx-auto">
              Watch training clips and highlights from The Academy
            </p>
            <div className="flex justify-center gap-4 mt-6">
              <a
                href="https://www.tiktok.com/@cspringsacademy"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
                </svg>
                Follow on TikTok
              </a>
              <a
                href="https://www.instagram.com/cspringsacademy"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:opacity-90 transition-opacity"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
                Follow on Instagram
              </a>
            </div>
          </div>
        </section>

        {/* Search and Filter Section */}
        <section className="py-6 border-b bg-muted/30">
          <div className="container">
            {/* Search Bar */}
            <div className="max-w-md mx-auto mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search videos by title..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-11"
                />
              </div>
            </div>

            {/* Category Filters */}
            <div className="flex flex-wrap gap-2 justify-center mb-4">
              {categories.map((category) => (
                <Button
                  key={category.value}
                  variant={selectedCategory === category.value ? "default" : "outline"}
                  onClick={() => setSelectedCategory(category.value)}
                  size="sm"
                >
                  {category.label}
                </Button>
              ))}
            </div>

            {/* Sort and Count */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-sm text-muted-foreground">
                {searchQuery && (
                  <span className="font-medium">
                    {processedVideos.length === 0 
                      ? "No results for " 
                      : `${processedVideos.length} result${processedVideos.length !== 1 ? 's' : ''} for `}
                    "{searchQuery}"
                  </span>
                )}
                {!searchQuery && (
                  <span>
                    Showing {Math.min(visibleCount, processedVideos.length)} of {processedVideos.length} videos
                  </span>
                )}
              </p>
              <div className="flex items-center gap-2">
                <SortAsc className="w-4 h-4 text-muted-foreground" />
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    {sortOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </section>

        {/* Video Grid */}
        <section className="py-12">
          <div className="container">
            {processedVideos.length === 0 ? (
              <div className="text-center py-16">
                <Play className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-lg mb-2">
                  {searchQuery ? "No videos match your search" : "No videos in this category yet"}
                </p>
                {searchQuery && (
                  <Button variant="outline" onClick={() => setSearchQuery("")}>
                    Clear search
                  </Button>
                )}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {visibleVideos.map((video) => (
                    <a
                      key={video.id}
                      href={video.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group relative overflow-hidden rounded-xl bg-muted shadow-md hover:shadow-xl transition-all duration-300 block"
                    >
                      <div className="aspect-[4/3] overflow-hidden bg-gray-900">
                        <img
                          src={video.thumbnail}
                          alt={video.title}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                            <Play className="w-8 h-8 text-white ml-1" fill="white" />
                          </div>
                        </div>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                            video.platform === "tiktok" 
                              ? "bg-black text-white" 
                              : "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                          }`}>
                            {video.platform === "tiktok" ? "TikTok" : "Instagram"}
                          </span>
                          <span className="text-xs text-white/70 capitalize">{video.category}</span>
                        </div>
                        <h3 className="font-semibold text-white text-sm flex items-center gap-1">
                          {video.title}
                          <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </h3>
                      </div>
                    </a>
                  ))}
                </div>

                {/* Infinite Scroll Trigger */}
                {hasMore && (
                  <div ref={loadMoreRef} className="flex justify-center py-8">
                    {isLoading && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Loading more videos...</span>
                      </div>
                    )}
                  </div>
                )}

                {/* End of results message */}
                {!hasMore && processedVideos.length > VIDEOS_PER_PAGE && (
                  <p className="text-center text-muted-foreground py-8">
                    You've reached the end of the video library
                  </p>
                )}
              </>
            )}
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-primary/5">
          <div className="container text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Want to see more?
            </h2>
            <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
              Follow us on social media for daily training content, tips, and updates
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <a
                href="https://www.tiktok.com/@cspringsacademy"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
                </svg>
                TikTok
                <ExternalLink className="w-4 h-4" />
              </a>
              <a
                href="https://www.instagram.com/cspringsacademy"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:opacity-90 transition-opacity"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
                Instagram
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
