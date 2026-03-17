import { useAuth } from "@/_core/hooks/useAuth";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useEffect, useState, useMemo } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Calendar,
  Users,
  MessageSquare,
  UserPlus,
  Video,
  Image,
  ClipboardList,
  FileText,
  MapPin,
  Mail,
  CheckSquare,
  Menu,
  ChevronRight,
  LayoutDashboard,
  Trophy,
  Share2,
  BellRing,
  Activity,
  Star,
  Sparkles,
} from "lucide-react";
import { MembersManager } from "@/components/admin/managers/MembersManager";
import { CoachesManager } from "@/components/admin/managers/CoachesManager";
import { BlogManager } from "@/components/admin/managers/BlogManager";
import { AttendanceManager } from "@/components/admin/managers/AttendanceManager";
import { LocationsManager } from "@/components/admin/managers/LocationsManager";
import { SchedulesManager } from "@/components/admin/managers/SchedulesManager";
import { ProgramsManager } from "@/components/admin/managers/ProgramsManager";
import { AnnouncementsManager } from "@/components/admin/managers/AnnouncementsManager";
import { ContactsManager } from "@/components/admin/managers/ContactsManager";
import { VideosManager } from "@/components/admin/managers/VideosManager";
import { GalleryManager } from "@/components/admin/managers/GalleryManager";
import { SocialPostsManager } from "@/components/admin/managers/SocialPostsManager";
import { MerchDropsManager } from "@/components/admin/managers/MerchDropsManager";
import { MetricsManager } from "@/components/admin/managers/MetricsManager";
import { ShowcasesManager } from "@/components/admin/managers/ShowcasesManager";
import { ContentQueueManager } from "@/components/admin/managers/ContentQueueManager";

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    label: "Operations",
    items: [
      { id: "schedules", label: "Schedules", icon: Calendar },
      { id: "attendance", label: "Attendance", icon: CheckSquare },
      { id: "locations", label: "Locations", icon: MapPin },
    ],
  },
  {
    label: "People",
    items: [
      { id: "members", label: "Members", icon: ClipboardList },
      { id: "coaches", label: "Coaches", icon: UserPlus },
      { id: "contacts", label: "Contacts", icon: Mail },
    ],
  },
  {
    label: "Content",
    items: [
      { id: "announcements", label: "Announcements", icon: MessageSquare },
      { id: "blog", label: "Blog", icon: FileText },
      { id: "videos", label: "Videos", icon: Video },
      { id: "gallery", label: "Gallery", icon: Image },
      { id: "social", label: "Social", icon: Share2 },
      { id: "content-queue", label: "Content Queue", icon: Sparkles },
    ],
  },
  {
    label: "Programs & Athletes",
    items: [
      { id: "programs", label: "Programs", icon: Trophy },
      { id: "metrics", label: "Metrics", icon: Activity },
      { id: "showcases", label: "Showcases", icon: Star },
    ],
  },
  {
    label: "Engagement",
    items: [
      { id: "drops", label: "Merch Drops", icon: BellRing },
    ],
  },
];

const allItems = navGroups.flatMap((g) => g.items);

const panels: Record<string, React.ComponentType> = {
  schedules: SchedulesManager,
  members: MembersManager,
  programs: ProgramsManager,
  announcements: AnnouncementsManager,
  blog: BlogManager,
  attendance: AttendanceManager,
  coaches: CoachesManager,
  locations: LocationsManager,
  contacts: ContactsManager,
  videos: VideosManager,
  gallery: GalleryManager,
  social: SocialPostsManager,
  drops: MerchDropsManager,
  metrics: MetricsManager,
  showcases: ShowcasesManager,
  "content-queue": ContentQueueManager,
};

function SidebarNav({
  active,
  onSelect,
}: {
  active: string;
  onSelect: (id: string) => void;
}) {
  return (
    <ScrollArea className="h-full">
      <div className="py-4 space-y-6">
        {navGroups.map((group) => (
          <div key={group.label}>
            <p className="px-4 mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {group.label}
            </p>
            <div className="space-y-0.5 px-2">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = active === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onSelect(item.id)}
                    className={`w-full flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {item.label}
                  </button>
                );
              })}
            </div>
            <Separator className="mt-4" />
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}

export default function AdminDashboard() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [activeSection, setActiveSection] = useState("schedules");
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!loading && (!user || user.role !== "admin")) {
      setLocation("/");
    }
  }, [loading, user, setLocation]);

  const activeItem = useMemo(
    () => allItems.find((i) => i.id === activeSection),
    [activeSection]
  );

  const ActivePanel = panels[activeSection];

  if (!loading && (!user || user.role !== "admin")) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const handleSelect = (id: string) => {
    setActiveSection(id);
    setMobileOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navigation />

      <div className="flex-1 flex">
        {/* Desktop sidebar */}
        <aside className="hidden lg:flex w-60 shrink-0 border-r border-border bg-card">
          <SidebarNav active={activeSection} onSelect={handleSelect} />
        </aside>

        {/* Main content */}
        <main id="main-content" className="flex-1 min-w-0">
          {/* Top bar with mobile menu + breadcrumb */}
          <div className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex items-center gap-3 px-4 py-3 sm:px-6">
              {/* Mobile menu trigger */}
              <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="lg:hidden shrink-0"
                  >
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Open admin menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-64 p-0">
                  <div className="px-4 py-4 border-b border-border">
                    <div className="flex items-center gap-2">
                      <LayoutDashboard className="h-5 w-5 text-primary" />
                      <h2 className="font-semibold">Admin</h2>
                    </div>
                  </div>
                  <SidebarNav
                    active={activeSection}
                    onSelect={handleSelect}
                  />
                </SheetContent>
              </Sheet>

              {/* Breadcrumb */}
              <div className="flex items-center gap-2 text-sm min-w-0">
                <span className="text-muted-foreground hidden sm:inline">Admin</span>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground hidden sm:block shrink-0" />
                {activeItem && (
                  <div className="flex items-center gap-2 font-medium truncate">
                    <activeItem.icon className="h-4 w-4 shrink-0 text-primary" />
                    <span>{activeItem.label}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Content area */}
          <div className="p-4 sm:p-6">
            {ActivePanel && <ActivePanel />}
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
}
