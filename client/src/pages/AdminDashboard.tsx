import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Calendar, Users, MessageSquare, Settings, UserPlus, Video, Image, ClipboardList, Share2, BellRing, Activity } from "lucide-react";
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

export default function AdminDashboard() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("schedules");

  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      setLocation('/');
    }
  }, [loading, user, setLocation]);

  if (!loading && (!user || user.role !== 'admin')) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navigation />

      <main id="main-content" className="flex-1 py-8">
        <div className="container">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2 text-foreground">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage schedules, programs, announcements, and more</p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/50 p-1 rounded-lg">
              <TabsTrigger value="schedules" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span className="hidden sm:inline">Schedules</span>
              </TabsTrigger>
              <TabsTrigger value="members" className="flex items-center gap-2">
                <ClipboardList className="h-4 w-4" />
                <span className="hidden sm:inline">Members</span>
              </TabsTrigger>
              <TabsTrigger value="programs" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Programs</span>
              </TabsTrigger>
              <TabsTrigger value="announcements" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                <span className="hidden sm:inline">Announcements</span>
              </TabsTrigger>
              <TabsTrigger value="blog" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                <span className="hidden sm:inline">Blog</span>
              </TabsTrigger>
              <TabsTrigger value="attendance" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Attendance</span>
              </TabsTrigger>
              <TabsTrigger value="coaches" className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                <span className="hidden sm:inline">Coaches</span>
              </TabsTrigger>
              <TabsTrigger value="locations" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Locations</span>
              </TabsTrigger>
              <TabsTrigger value="contacts" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Contacts</span>
              </TabsTrigger>
              <TabsTrigger value="videos" className="flex items-center gap-2">
                <Video className="h-4 w-4" />
                <span className="hidden sm:inline">Videos</span>
              </TabsTrigger>
              <TabsTrigger value="gallery" className="flex items-center gap-2">
                <Image className="h-4 w-4" />
                <span className="hidden sm:inline">Gallery</span>
              </TabsTrigger>
              <TabsTrigger value="social" className="flex items-center gap-2">
                <Share2 className="h-4 w-4" />
                <span className="hidden sm:inline">Social</span>
              </TabsTrigger>
              <TabsTrigger value="drops" className="flex items-center gap-2">
                <BellRing className="h-4 w-4" />
                <span className="hidden sm:inline">Drops</span>
              </TabsTrigger>
              <TabsTrigger value="metrics" className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                <span className="hidden sm:inline">Metrics</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="schedules">
              <SchedulesManager />
            </TabsContent>

            <TabsContent value="members">
              <MembersManager />
            </TabsContent>

            <TabsContent value="programs">
              <ProgramsManager />
            </TabsContent>

            <TabsContent value="announcements">
              <AnnouncementsManager />
            </TabsContent>

            <TabsContent value="blog">
              <BlogManager />
            </TabsContent>
            <TabsContent value="attendance">
              <AttendanceManager />
            </TabsContent>
            <TabsContent value="coaches">
              <CoachesManager />
            </TabsContent>
            <TabsContent value="locations">
              <LocationsManager />
            </TabsContent>
            <TabsContent value="contacts">
              <ContactsManager />
            </TabsContent>
            <TabsContent value="videos">
              <VideosManager />
            </TabsContent>
            <TabsContent value="gallery">
              <GalleryManager />
            </TabsContent>
            <TabsContent value="social">
              <SocialPostsManager />
            </TabsContent>
            <TabsContent value="drops">
              <MerchDropsManager />
            </TabsContent>
            <TabsContent value="metrics">
              <MetricsManager />
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
}
