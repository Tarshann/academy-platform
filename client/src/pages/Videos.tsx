import { useState, useEffect, useRef, useMemo } from "react";
import { Play, ExternalLink, Search, SortAsc, Loader2, Eye } from "lucide-react";
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
    thumbnail: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663204873520/OXGVMbmpOnjLcxFC.jpeg",
    platform: "tiktok" as const,
    date: "2024-10-15"
  },
  {
    id: "ig1",
    url: "https://www.instagram.com/reel/DDVpkOWRPTc/",
    title: "Training Session",
    category: "training",
    thumbnail: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663204873520/byeDlUFApdDtuMZV.jpeg",
    platform: "instagram" as const,
    date: "2024-12-02"
  },
  {
    id: "ig2",
    url: "https://www.instagram.com/reel/DDVpJcMRVgJ/",
    title: "Skills Work",
    category: "training",
    thumbnail: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663204873520/nlIpkFwbWbxRGafH.jpeg",
    platform: "instagram" as const,
    date: "2024-11-30"
  },
  {
    id: "ig3",
    url: "https://www.instagram.com/reel/DDVo1qMR_Xv/",
    title: "Practice Highlights",
    category: "highlights",
    thumbnail: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663204873520/gztSZBHhURZbqUWj.jpeg",
    platform: "instagram" as const,
    date: "2024-11-27"
  },
  {
    id: "ig4",
    url: "https://www.instagram.com/p/DDVoqVqxWXC/",
    title: "Team Photo",
    category: "highlights",
    thumbnail: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663204873520/chBQYdtyOInJapIK.jpeg",
    platform: "instagram" as const,
    date: "2024-11-22"
  },
  {
    id: "ig5",
    url: "https://www.instagram.com/p/DDVoZYJx3Vy/",
    title: "Camp Moments",
    category: "highlights",
    thumbnail: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663204873520/WIGbipbOvWrdjWER.jpeg",
    platform: "instagram" as const,
    date: "2024-11-18"
  },
  {
    id: "ig6",
    url: "https://www.instagram.com/p/DDVoH-Yx_Wk/",
    title: "Shooting Form",
    category: "training",
    thumbnail: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663204873520/JPMGTbiynWZNnTCz.jpeg",
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
        thumbnail: v.thumbnail || "https://files.manuscdn.com/user_upload_by_module/session_file/310519663204873520/cneaVkHZVVMAdQwz.png",
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

  const handleVideoClick = (video: typeof allVideos[0]) => {
    // Track view if it's a database video
    if (video.numericId) {
      trackViewMutation.mutate({ id: video.numericId });
    }
    // Open video in new tab
    window.open(video.url, '_blank');
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />
      
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
                        <img
                          src={video.thumbnail}
                          alt={video.title}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
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
                          <ExternalLink className="h-5 w-5 text-white drop-shadow-lg" />
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
