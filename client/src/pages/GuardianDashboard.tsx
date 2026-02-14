import { useState } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Users } from "lucide-react";
import { Breadcrumbs } from "@/components/Breadcrumbs";

const relationshipLabels: Record<string, string> = {
  parent: "Parent",
  guardian: "Guardian",
};

const statusVariants: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  present: "default",
  late: "secondary",
  excused: "outline",
  absent: "destructive",
};

export default function GuardianDashboard() {
  const loginUrl = getLoginUrl();
  const redirectPath = "/guardian";
  const signInRedirectUrl = loginUrl.startsWith("/sign-in")
    ? `/sign-in?redirect=${encodeURIComponent(redirectPath)}`
    : loginUrl;
  const { user, isAuthenticated, loading, authConfigured } = useAuth({
    redirectOnUnauthenticated: true,
    redirectPath: signInRedirectUrl,
  });
  const [childEmail, setChildEmail] = useState("");
  const [relationshipType, setRelationshipType] = useState("parent");

  const { data: linksData, isLoading: linksLoading, refetch: refetchLinks } =
    trpc.guardian.getMyLinks.useQuery(undefined, {
      enabled: isAuthenticated,
    });
  const {
    data: attendanceData,
    isLoading: attendanceLoading,
    refetch: refetchAttendance,
  } = trpc.guardian.getAttendance.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const linkMutation = trpc.guardian.linkChildByEmail.useMutation({
    onSuccess: (data) => {
      if (data.alreadyLinked) {
        toast.info("This athlete is already linked to your account.");
      } else {
        toast.success("Athlete linked successfully.");
      }
      setChildEmail("");
      refetchLinks();
      refetchAttendance();
    },
    onError: (error) => {
      toast.error(error.message || "Unable to link athlete.");
    },
  });

  const handleLinkSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!childEmail.trim()) {
      toast.error("Please enter the athlete's email.");
      return;
    }
    linkMutation.mutate({
      email: childEmail.trim(),
      relationshipType,
    });
  };

  if (loading) {
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
              Please set VITE_CLERK_PUBLISHABLE_KEY or OAuth credentials to access guardian tools.
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
      <Navigation />
      <main id="main-content" className="flex-1 py-12">
        <div className="container">
          <Breadcrumbs items={[{ label: "Guardian Dashboard" }]} />
          <div className="mt-6 mb-8">
            <h1 className="text-4xl font-bold text-foreground">Guardian Dashboard</h1>
            <p className="text-muted-foreground mt-2">
              Stay connected with your athlete’s attendance and schedule updates.
            </p>
          </div>

          <Card className="bg-card border-border mb-10">
            <CardHeader>
              <CardTitle className="text-foreground">Link an Athlete</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLinkSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="child-email">Athlete email</Label>
                    <Input
                      id="child-email"
                      type="email"
                      value={childEmail}
                      onChange={(event) => setChildEmail(event.target.value)}
                      placeholder="athlete@email.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Relationship</Label>
                    <Select value={relationshipType} onValueChange={setRelationshipType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select relationship" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="parent">Parent</SelectItem>
                        <SelectItem value="guardian">Guardian</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button type="submit" disabled={linkMutation.isPending}>
                  {linkMutation.isPending ? "Linking..." : "Link Athlete"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {linksLoading || attendanceLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin text-primary" size={32} />
            </div>
          ) : attendanceData && attendanceData.length > 0 ? (
            <div className="space-y-6">
              {attendanceData.map((entry: any) => (
                <Card key={entry.child.id} className="bg-card border-border">
                  <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <CardTitle className="text-foreground flex items-center gap-2">
                        <Users className="h-5 w-5 text-primary" />
                        {entry.child.name || "Athlete"}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {entry.child.email || "No email on file"}
                      </p>
                    </div>
                    {linksData?.relations?.length > 0 && (
                      <Badge variant="secondary">
                        {relationshipLabels[
                          linksData.relations.find(
                            (relation: any) => relation.childId === entry.child.id
                          )?.relationshipType || "parent"
                        ] || "Parent"}
                      </Badge>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {entry.attendance.length > 0 ? (
                      entry.attendance.slice(0, 10).map((record: any) => (
                        <div
                          key={record.id}
                          className="flex flex-col gap-2 border-b border-border pb-3 last:border-b-0"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-foreground">
                                {record.schedule?.title || "Training Session"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {record.schedule?.startTime
                                  ? new Date(record.schedule.startTime).toLocaleDateString("en-US", {
                                      year: "numeric",
                                      month: "long",
                                      day: "numeric",
                                    })
                                  : new Date(record.markedAt).toLocaleDateString("en-US", {
                                      year: "numeric",
                                      month: "long",
                                      day: "numeric",
                                    })}
                              </p>
                            </div>
                            <Badge
                              variant={statusVariants[record.status] || "outline"}
                              className="capitalize"
                            >
                              {record.status}
                            </Badge>
                          </div>
                          {record.schedule?.location && (
                            <p className="text-xs text-muted-foreground">
                              Location: {record.schedule.location}
                            </p>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No attendance records available yet.
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="bg-card border-border text-center py-12">
              <CardContent className="space-y-3">
                <Users className="h-10 w-10 text-muted-foreground mx-auto" />
                <p className="text-muted-foreground">
                  No athletes linked yet. Add an athlete’s email to start tracking attendance.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
