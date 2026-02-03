import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Calendar, Users, MessageSquare, Settings, UserPlus, Video } from "lucide-react";
import { CoachesManager } from "@/components/admin/managers/CoachesManager";
import { BlogManager } from "@/components/admin/managers/BlogManager";
import { AttendanceManager } from "@/components/admin/managers/AttendanceManager";
import { LocationsManager } from "@/components/admin/managers/LocationsManager";
import { SchedulesManager } from "@/components/admin/managers/SchedulesManager";
import { ProgramsManager } from "@/components/admin/managers/ProgramsManager";
import { AnnouncementsManager } from "@/components/admin/managers/AnnouncementsManager";
import { ContactsManager } from "@/components/admin/managers/ContactsManager";
import { VideosManager } from "@/components/admin/managers/VideosManager";

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
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:grid-cols-8 lg:w-auto lg:inline-grid">
              <TabsTrigger value="schedules" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span className="hidden sm:inline">Schedules</span>
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
            </TabsList>

            <TabsContent value="schedules">
              <SchedulesManager />
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
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
}
