import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Play, ExternalLink, Search, SortAsc, Loader2, Eye, X } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { trpc } from "@/lib/trpc";

// Extract TikTok video ID from URL
function getTikTokVideoId(url: string): string | null {
  const match = url.match(/\/video\/(\d+)/);
  return match ? match[1] : null;
}

// Extract Instagram shortcode from URL
function getInstagramShortcode(url: string): string | null {
  const match = url.match(/\/(reel|p)\/([A-Za-z0-9_-]+)/);
  return match ? match[2] : null;
}

// Video embed modal
function VideoEmbedModal({
  video,
  onClose,
}: {
  video: { url: string; title: string; platform: "tiktok" | "instagram" } | null;
  onClose: () => void;
}) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!video) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEsc);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "";
    };
  }, [video, onClose]);

  // Load Instagram embed script when showing an Instagram video
  useEffect(() => {
    if (!video || video.platform !== "instagram") return;
    const existing = document.querySelector('script[src*="instagram.com/embed.js"]');
    if (!existing) {
      const script = document.createElement("script");
      script.src = "https://www.instagram.com/embed.js";
      script.async = true;
      document.body.appendChild(script);
    } else if ((window as any).instgrm) {
      (window as any).instgrm.Embeds.process();
    }
  }, [video]);

  // Re-process Instagram embeds once the script loads
  useEffect(() => {
    if (!video || video.platform !== "instagram") return;
    const interval = setInterval(() => {
      if ((window as any).instgrm) {
        (window as any).instgrm.Embeds.process();
        clearInterval(interval);
      }
    }, 200);
    return () => clearInterval(interval);
  }, [video]);

  if (!video) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className="relative max-w-lg w-full max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white font-semibold truncate pr-4">{video.title}</h3>
          <div className="flex items-center gap-2 flex-shrink-0">
            <a
              href={video.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/70 hover:text-white transition-colors text-xs flex items-center gap-1"
            >
              <ExternalLink className="h-3 w-3" />
              Open original
            </a>
            <button
              onClick={onClose}
              className="text-white/70 hover:text-white transition-colors p-1"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
        <div className="overflow-auto rounded-xl bg-black flex items-center justify-center">
          {video.platform === "tiktok" ? (
            <iframe
              src={`https://www.tiktok.com/embed/v2/${getTikTokVideoId(video.url)}`}
              width="325"
              height="575"
              frameBorder="0"
              allowFullScreen
              allow="encrypted-media"
              className="mx-auto"
            />
          ) : (
            <div className="p-4 w-full flex justify-center">
              <blockquote
                className="instagram-media"
                data-instgrm-permalink={video.url}
                data-instgrm-version="14"
                style={{ maxWidth: 400, width: "100%", margin: "0 auto" }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Platform-specific placeholder component
const PlatformPlaceholder = ({ platform, title }: { platform: "tiktok" | "instagram"; title: string }) => {
  if (platform === "tiktok") {
    return (
      <div className="w-full h-full bg-black flex flex-col items-center justify-center p-6">
        {/* TikTok Logo */}
        <svg viewBox="0 0 48 48" className="w-16 h-16 mb-4" fill="none">
          <path d="M34.1451 16.3322C36.5765 18.0193 39.5431 19.0145 42.7391 19.0145V12.6467C42.1461 12.6467 41.5548 12.5941 40.9722 12.4906V17.4889C37.7762 17.4889 34.8096 16.4937 32.3782 14.8066V28.3282C32.3782 35.0958 26.9174 40.5833 20.1891 40.5833C17.5718 40.5833 15.1404 39.7837 13.1211 38.4185C15.4156 40.7566 18.6116 42.1092 22.1222 42.1092C28.8505 42.1092 34.3113 36.6217 34.3113 29.8541V16.3322H34.1451ZM36.3313 9.96455C35.1016 8.60018 34.2728 6.86654 34.0217 4.95117V4.21875H32.4631C32.8811 6.55518 34.3113 8.55518 36.3313 9.96455ZM17.3207 33.3541C16.5768 32.3589 16.1588 31.1193 16.1588 29.7541C16.1588 26.3541 18.9168 23.5833 22.3004 23.5833C22.8934 23.5833 23.4695 23.6633 24.0205 23.8145V17.3633C23.4275 17.2854 22.8261 17.2598 22.2248 17.2854V22.2889C21.6738 22.1377 21.0977 22.0577 20.5047 22.0577C17.1211 22.0577 14.3631 24.8285 14.3631 28.2285C14.3631 30.5666 15.5928 32.6185 17.3207 33.3541Z" fill="#FF004F"/>
          <path d="M32.3782 14.8066C34.8096 16.4937 37.7762 17.4889 40.9722 17.4889V12.4906C38.9522 12.0626 37.1394 11.0674 35.7092 9.68701C33.6892 8.27765 32.259 6.27765 31.841 3.94122H27.1182V29.5766C27.1013 32.9597 24.3518 35.7135 20.9851 35.7135C18.8802 35.7135 17.0168 34.6414 15.8871 33.0766C14.1592 32.341 12.9295 30.2891 12.9295 27.951C12.9295 24.551 15.6875 21.7802 19.0711 21.7802C19.6641 21.7802 20.2402 21.8602 20.7912 22.0114V17.0079C14.1423 17.1335 8.76562 22.5691 8.76562 29.2766C8.76562 32.6254 10.0802 35.6691 12.2362 37.8691C14.2555 39.2343 16.687 40.0339 19.3042 40.0339C26.0325 40.0339 31.4933 34.5464 31.4933 27.7787V14.2572L32.3782 14.8066Z" fill="#00F2EA"/>
        </svg>
        <p className="text-white text-center font-medium text-sm leading-tight">{title}</p>
        <p className="text-gray-400 text-xs mt-2">@academytn</p>
      </div>
    );
  }
  
  return (
    <div className="w-full h-full bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 flex flex-col items-center justify-center p-6">
      {/* Instagram Logo */}
      <svg viewBox="0 0 48 48" className="w-16 h-16 mb-4" fill="white">
        <path d="M24 4.32c6.41 0 7.17.03 9.7.14 2.34.11 3.61.5 4.46.83 1.12.44 1.92.96 2.76 1.8.84.84 1.37 1.64 1.8 2.76.33.85.73 2.12.83 4.46.12 2.53.14 3.29.14 9.7 0 6.4-.02 7.16-.14 9.68-.1 2.35-.5 3.62-.83 4.47-.43 1.12-.96 1.92-1.8 2.76-.84.84-1.64 1.37-2.76 1.8-.85.33-2.12.72-4.46.83-2.53.11-3.29.14-9.7.14-6.4 0-7.16-.03-9.68-.14-2.35-.11-3.62-.5-4.47-.83-1.12-.43-1.92-.96-2.76-1.8-.84-.84-1.37-1.64-1.8-2.76-.33-.85-.73-2.12-.83-4.47-.12-2.52-.14-3.28-.14-9.68 0-6.41.02-7.17.14-9.7.1-2.34.5-3.61.83-4.46.43-1.12.96-1.92 1.8-2.76.84-.84 1.64-1.37 2.76-1.8.85-.33 2.12-.72 4.47-.83 2.52-.11 3.28-.14 9.68-.14M24 0c-6.52 0-7.33.03-9.9.14-2.54.12-4.28.53-5.8 1.13-1.57.62-2.9 1.44-4.23 2.77C2.74 5.37 1.92 6.7 1.3 8.27c-.6 1.52-1 3.26-1.13 5.8C.03 16.67 0 17.48 0 24c0 6.52.03 7.33.14 9.9.12 2.54.53 4.28 1.13 5.8.62 1.57 1.44 2.9 2.77 4.23 1.33 1.33 2.66 2.15 4.23 2.77 1.52.6 3.26 1 5.8 1.13 2.57.11 3.38.14 9.9.14 6.52 0 7.33-.03 9.9-.14 2.54-.12 4.28-.53 5.8-1.13 1.57-.62 2.9-1.44 4.23-2.77 1.33-1.33 2.15-2.66 2.77-4.23.6-1.52 1-3.26 1.13-5.8.11-2.57.14-3.38.14-9.9 0-6.52-.03-7.33-.14-9.9-.12-2.54-.53-4.28-1.13-5.8-.62-1.57-1.44-2.9-2.77-4.23C42.63 2.74 41.3 1.92 39.73 1.3c-1.52-.6-3.26-1-5.8-1.13C31.33.03 30.52 0 24 0z"/>
        <path d="M24 11.68c-6.8 0-12.32 5.52-12.32 12.32 0 6.8 5.52 12.32 12.32 12.32 6.8 0 12.32-5.52 12.32-12.32 0-6.8-5.52-12.32-12.32-12.32zM24 32c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"/>
        <circle cx="36.8" cy="11.2" r="2.88"/>
      </svg>
      <p className="text-white text-center font-medium text-sm leading-tight">{title}</p>
      <p className="text-white/80 text-xs mt-2">@the_academytn</p>
    </div>
  );
};

// Default/fallback videos (used when database is empty) - no thumbnails, will use platform placeholders
const defaultVideos = [
  {
    id: "tt1",
    url: "https://www.tiktok.com/@academytn/video/7426665432193920298",
    title: "Training Highlights",
    category: "training",
    thumbnail: null,
    platform: "tiktok" as const,
    date: "2024-12-01"
  },
  {
    id: "tt2",
    url: "https://www.tiktok.com/@academytn/video/7426652015718460714",
    title: "Skills Development",
    category: "training",
    thumbnail: null,
    platform: "tiktok" as const,
    date: "2024-11-28"
  },
  {
    id: "tt3",
    url: "https://www.tiktok.com/@academytn/video/7426651330054538539",
    title: "Dribbling Drills",
    category: "training",
    thumbnail: null,
    platform: "tiktok" as const,
    date: "2024-11-25"
  },
  {
    id: "tt4",
    url: "https://www.tiktok.com/@academytn/video/7426650617190679851",
    title: "Shooting Practice",
    category: "training",
    thumbnail: null,
    platform: "tiktok" as const,
    date: "2024-11-20"
  },
  {
    id: "tt5",
    url: "https://www.tiktok.com/@academytn/video/7426649984685289771",
    title: "Team Training",
    category: "training",
    thumbnail: null,
    platform: "tiktok" as const,
    date: "2024-11-15"
  },
  {
    id: "tt6",
    url: "https://www.tiktok.com/@academytn/video/7426649426347912491",
    title: "Ball Handling",
    category: "training",
    thumbnail: null,
    platform: "tiktok" as const,
    date: "2024-11-10"
  },
  {
    id: "ig1",
    url: "https://www.instagram.com/reel/DDVpkOWRPTc/",
    title: "Training Session",
    category: "training",
    thumbnail: null,
    platform: "instagram" as const,
    date: "2024-12-02"
  },
  {
    id: "ig2",
    url: "https://www.instagram.com/reel/DDVpJcMRVgJ/",
    title: "Skills Work",
    category: "training",
    thumbnail: null,
    platform: "instagram" as const,
    date: "2024-11-30"
  },
  {
    id: "ig3",
    url: "https://www.instagram.com/reel/DDVo1qMR_Xv/",
    title: "Practice Highlights",
    category: "highlights",
    thumbnail: null,
    platform: "instagram" as const,
    date: "2024-11-27"
  },
  {
    id: "ig4",
    url: "https://www.instagram.com/p/DDVoqVqxWXC/",
    title: "Team Photo",
    category: "highlights",
    thumbnail: null,
    platform: "instagram" as const,
    date: "2024-11-22"
  },
  {
    id: "ig5",
    url: "https://www.instagram.com/p/DDVoZYJx3Vy/",
    title: "Camp Moments",
    category: "highlights",
    thumbnail: null,
    platform: "instagram" as const,
    date: "2024-11-18"
  },
  {
    id: "ig6",
    url: "https://www.instagram.com/p/DDVoH-Yx_Wk/",
    title: "Shooting Form",
    category: "training",
    thumbnail: null,
    platform: "instagram" as const,
    date: "2024-11-12"
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
  const [selectedVideo, setSelectedVideo] = useState<{ url: string; title: string; platform: "tiktok" | "instagram" } | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Fetch videos from database
  const { data: dbVideos } = trpc.videos.list.useQuery(undefined, {
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  // Track view mutation
  const trackViewMutation = trpc.videos.trackView.useMutation();

  // Use database videos if available, otherwise use defaults
  const allVideos = useMemo(() => {
    if (dbVideos && dbVideos.length > 0) {
      return dbVideos.map((v: any) => ({
        id: v.id.toString(),
        numericId: v.id,
        url: v.url,
        title: v.title,
        category: v.category,
        thumbnail: v.thumbnail || null,
        platform: v.platform as "tiktok" | "instagram",
        date: v.createdAt ? new Date(v.createdAt).toISOString().split('T')[0] : "2024-01-01",
        viewCount: v.viewCount || 0
      }));
    }
    return defaultVideos.map(v => ({ ...v, numericId: undefined, viewCount: 0 }));
  }, [dbVideos]);

  // Filter and sort videos
  const filteredVideos = useMemo(() => {
    let result = [...allVideos];
    
    // Filter by category
    if (selectedCategory !== "all") {
      result = result.filter(v => v.category === selectedCategory);
    }
    
    // Filter by search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(v => v.title.toLowerCase().includes(query));
    }
    
    // Sort
    switch (sortBy) {
      case "newest":
        result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        break;
      case "oldest":
        result.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        break;
      case "tiktok":
        result.sort((a, b) => {
          if (a.platform === "tiktok" && b.platform !== "tiktok") return -1;
          if (a.platform !== "tiktok" && b.platform === "tiktok") return 1;
          return 0;
        });
        break;
      case "instagram":
        result.sort((a, b) => {
          if (a.platform === "instagram" && b.platform !== "instagram") return -1;
          if (a.platform !== "instagram" && b.platform === "instagram") return 1;
          return 0;
        });
        break;
      case "az":
        result.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "za":
        result.sort((a, b) => b.title.localeCompare(a.title));
        break;
    }
    
    return result;
  }, [allVideos, selectedCategory, searchQuery, sortBy]);

  // Reset visible count when filters change
  useEffect(() => {
    setVisibleCount(VIDEOS_PER_PAGE);
  }, [selectedCategory, searchQuery, sortBy]);

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && visibleCount < filteredVideos.length && !isLoading) {
          setIsLoading(true);
          setTimeout(() => {
            setVisibleCount(prev => Math.min(prev + VIDEOS_PER_PAGE, filteredVideos.length));
            setIsLoading(false);
          }, 500);
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [visibleCount, filteredVideos.length, isLoading]);

  const visibleVideos = filteredVideos.slice(0, visibleCount);

  const handleVideoClick = useCallback((video: typeof allVideos[0]) => {
    // Track view if it's a database video
    if (video.numericId) {
      trackViewMutation.mutate({ id: video.numericId });
    }
    // Open inline embed modal
    setSelectedVideo({ url: video.url, title: video.title, platform: video.platform });
  }, [trackViewMutation]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />
      
      <VideoEmbedModal video={selectedVideo} onClose={() => setSelectedVideo(null)} />

      <main id="main-content" className="flex-1">
        <div className="container pt-6">
          <Breadcrumbs items={[{ label: "Videos" }]} />
        </div>

        {/* Hero Section */}
        <section className="bg-gradient-to-b from-primary/10 to-background py-16">
          <div className="container text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Video Library</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Watch training sessions, drills, and highlights from The Academy
            </p>
          </div>
        </section>

        {/* Search, Filter, and Sort */}
        <section className="py-8 border-b">
          <div className="container">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              {/* Search */}
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search videos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="flex gap-4 items-center">
                {/* Category Filter */}
                <div className="flex gap-2">
                  {categories.map((cat) => (
                    <Button
                      key={cat.value}
                      variant={selectedCategory === cat.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedCategory(cat.value)}
                    >
                      {cat.label}
                    </Button>
                  ))}
                </div>

                {/* Sort */}
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-40">
                    <SortAsc className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {sortOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Results count */}
            {searchQuery && (
              <div className="mt-4 text-sm text-muted-foreground">
                {filteredVideos.length} result{filteredVideos.length !== 1 ? 's' : ''} for "{searchQuery}"
                <Button
                  variant="link"
                  size="sm"
                  className="ml-2 p-0 h-auto"
                  onClick={() => setSearchQuery("")}
                >
                  Clear search
                </Button>
              </div>
            )}
          </div>
        </section>

        {/* Videos Grid */}
        <section className="py-12">
          <div className="container">
            {filteredVideos.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No videos found matching your criteria.</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {visibleVideos.map((video) => (
                    <div
                      key={video.id}
                      className="group cursor-pointer"
                      onClick={() => handleVideoClick(video)}
                    >
                      <div className="relative aspect-[9/16] rounded-xl overflow-hidden bg-muted">
                        {video.thumbnail ? (
                          <img
                            src={video.thumbnail}
                            alt={video.title}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <PlatformPlaceholder platform={video.platform} title={video.title} />
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <div className="bg-white rounded-full p-4">
                            <Play className="h-8 w-8 text-primary fill-primary" />
                          </div>
                        </div>
                        <div className="absolute top-3 left-3">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            video.platform === "tiktok" 
                              ? "bg-black text-white" 
                              : "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                          }`}>
                            {video.platform === "tiktok" ? "TikTok" : "Instagram"}
                          </span>
                        </div>
                        <div className="absolute bottom-3 right-3">
                          <Play className="h-5 w-5 text-white drop-shadow-lg fill-white" />
                        </div>
                        {video.viewCount > 0 && (
                          <div className="absolute bottom-3 left-3 flex items-center gap-1 bg-black/60 rounded px-2 py-1">
                            <Eye className="h-3 w-3 text-white" />
                            <span className="text-xs text-white">{video.viewCount}</span>
                          </div>
                        )}
                      </div>
                      <div className="mt-3">
                        <h3 className="font-semibold group-hover:text-primary transition-colors">
                          {video.title}
                        </h3>
                        <p className="text-sm text-muted-foreground capitalize">{video.category}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Infinite scroll trigger */}
                {visibleCount < filteredVideos.length && (
                  <div ref={loadMoreRef} className="flex justify-center py-8">
                    {isLoading ? (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>Loading more videos...</span>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        Showing {visibleCount} of {filteredVideos.length} videos
                      </span>
                    )}
                  </div>
                )}

                {visibleCount >= filteredVideos.length && filteredVideos.length > VIDEOS_PER_PAGE && (
                  <div className="text-center py-8">
                    <p className="text-sm text-muted-foreground">You've reached the end</p>
                  </div>
                )}
              </>
            )}
          </div>
        </section>

        {/* Social Follow CTA */}
        <section className="py-12 bg-muted/50">
          <div className="container text-center">
            <h2 className="text-2xl font-bold mb-4">Follow Us for More Content</h2>
            <p className="text-muted-foreground mb-6">
              Stay updated with the latest training videos and highlights
            </p>
            <div className="flex gap-4 justify-center">
              <Button asChild>
                <a href="https://www.tiktok.com/@academytn" target="_blank" rel="noopener noreferrer">
                  Follow on TikTok
                </a>
              </Button>
              <Button variant="outline" asChild>
                <a href="https://www.instagram.com/the_academytn" target="_blank" rel="noopener noreferrer">
                  Follow on Instagram
                </a>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
