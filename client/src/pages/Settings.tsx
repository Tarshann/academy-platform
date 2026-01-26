import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
// Switch component - using checkbox as fallback
const Switch = ({ checked, onCheckedChange, id, ...props }: { checked: boolean; onCheckedChange: (checked: boolean) => void; id?: string; [key: string]: any }) => (
  <input
    type="checkbox"
    id={id}
    checked={checked}
    onChange={(e) => onCheckedChange(e.target.checked)}
    className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary"
    {...props}
  />
);
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { trpc } from "@/lib/trpc";
import { Loader2, Settings as SettingsIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { SEO } from "@/components/SEO";

export default function Settings() {
  const { user, isAuthenticated, loading, authConfigured } = useAuth({
    redirectOnUnauthenticated: true,
  });
  const { data: preferences, isLoading, refetch } = trpc.notifications.getPreferences.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );
  const updatePreferences = trpc.notifications.updatePreferences.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("Notification preferences updated");
    },
  });

  const [localPrefs, setLocalPrefs] = useState({
    sessionRegistrations: true,
    paymentConfirmations: true,
    announcements: true,
    attendanceUpdates: true,
    blogPosts: false,
    marketing: false,
  });

  useEffect(() => {
    if (preferences) {
      setLocalPrefs({
        sessionRegistrations: preferences.sessionRegistrations ?? true,
        paymentConfirmations: preferences.paymentConfirmations ?? true,
        announcements: preferences.announcements ?? true,
        attendanceUpdates: preferences.attendanceUpdates ?? true,
        blogPosts: preferences.blogPosts ?? false,
        marketing: preferences.marketing ?? false,
      });
    }
  }, [preferences]);

  const handleToggle = (key: keyof typeof localPrefs) => {
    const newPrefs = { ...localPrefs, [key]: !localPrefs[key] };
    setLocalPrefs(newPrefs);
    updatePreferences.mutate({ [key]: newPrefs[key] });
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    );
  }

  if (!authConfigured) {
    return (
      <div className="min-h-screen flex flex-col bg-background text-foreground">
        <Navigation />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md px-6">
            <h1 className="text-2xl font-bold mb-3">Authentication Not Configured</h1>
            <p className="text-muted-foreground">
              Please set VITE_CLERK_PUBLISHABLE_KEY or OAuth credentials to access settings.
            </p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Redirecting to sign in...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <SEO title="Settings" description="Manage your notification preferences and account settings." />
      <Navigation />
      
      <main id="main-content" className="flex-1 py-12">
        <div className="container max-w-4xl">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2 text-foreground">Settings</h1>
            <p className="text-muted-foreground">Manage your notification preferences</p>
          </div>

          <Card className="bg-card border-border">
            <CardHeader>
              <div className="flex items-center gap-2">
                <SettingsIcon className="text-primary" size={24} />
                <CardTitle className="text-foreground">Notification Preferences</CardTitle>
              </div>
              <CardDescription className="text-muted-foreground">
                Choose which email notifications you want to receive
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="sessionRegistrations" className="text-foreground">Session Registrations</Label>
                  <p className="text-sm text-muted-foreground">Receive emails when you register for training sessions</p>
                </div>
                <Switch
                  id="sessionRegistrations"
                  checked={localPrefs.sessionRegistrations}
                  onCheckedChange={() => handleToggle('sessionRegistrations')}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="paymentConfirmations" className="text-foreground">Payment Confirmations</Label>
                  <p className="text-sm text-muted-foreground">Receive emails when payments are processed</p>
                </div>
                <Switch
                  id="paymentConfirmations"
                  checked={localPrefs.paymentConfirmations}
                  onCheckedChange={() => handleToggle('paymentConfirmations')}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="announcements" className="text-foreground">Announcements</Label>
                  <p className="text-sm text-muted-foreground">Receive emails for important announcements</p>
                </div>
                <Switch
                  id="announcements"
                  checked={localPrefs.announcements}
                  onCheckedChange={() => handleToggle('announcements')}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="attendanceUpdates" className="text-foreground">Attendance Updates</Label>
                  <p className="text-sm text-muted-foreground">Receive emails when attendance is marked</p>
                </div>
                <Switch
                  id="attendanceUpdates"
                  checked={localPrefs.attendanceUpdates}
                  onCheckedChange={() => handleToggle('attendanceUpdates')}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="blogPosts" className="text-foreground">Blog Posts</Label>
                  <p className="text-sm text-muted-foreground">Receive emails when new blog posts are published</p>
                </div>
                <Switch
                  id="blogPosts"
                  checked={localPrefs.blogPosts}
                  onCheckedChange={() => handleToggle('blogPosts')}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="marketing" className="text-foreground">Marketing Emails</Label>
                  <p className="text-sm text-muted-foreground">Receive promotional emails and special offers</p>
                </div>
                <Switch
                  id="marketing"
                  checked={localPrefs.marketing}
                  onCheckedChange={() => handleToggle('marketing')}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
