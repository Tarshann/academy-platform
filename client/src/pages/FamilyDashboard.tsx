import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { trpc } from "@/lib/trpc";
import { Loader2, Users, TrendingUp, Calendar, CheckCircle, UserPlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useState } from "react";
import { SEO } from "@/components/SEO";

export default function FamilyDashboard() {
  const { user, isAuthenticated, loading } = useAuth({ redirectOnUnauthenticated: true });
  const { data: members, isLoading, refetch } = trpc.family.getMembers.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  const [selectedChild, setSelectedChild] = useState<number | null>(null);
  const [showAddMember, setShowAddMember] = useState(false);
  const [childIdInput, setChildIdInput] = useState("");

  const addMember = trpc.family.addMember.useMutation({
    onSuccess: () => {
      toast.success("Family member added");
      refetch();
      setShowAddMember(false);
      setChildIdInput("");
    },
    onError: (err) => toast.error(err.message),
  });

  const removeMember = trpc.family.removeMember.useMutation({
    onSuccess: () => {
      toast.success("Family member removed");
      refetch();
      setSelectedChild(null);
    },
  });

  const { data: childData, isLoading: childLoading } = trpc.family.getChildData.useQuery(
    { childId: selectedChild! },
    { enabled: !!selectedChild }
  );

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <SEO title="Family Dashboard" description="Manage your family members and view their progress." />
      <Navigation />
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Family Dashboard</h1>
            <p className="text-muted-foreground mt-1">Manage your children's Academy experience</p>
          </div>
          <Button onClick={() => setShowAddMember(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Add Child
          </Button>
        </div>

        {showAddMember && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Add Family Member</CardTitle>
              <CardDescription>Enter your child's member ID to link their account</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3">
                <input
                  type="number"
                  placeholder="Child's Member ID"
                  value={childIdInput}
                  onChange={(e) => setChildIdInput(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
                <Button
                  onClick={() => {
                    const id = parseInt(childIdInput);
                    if (id) addMember.mutate({ childId: id });
                  }}
                  disabled={!childIdInput || addMember.isPending}
                >
                  {addMember.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Link Account"}
                </Button>
                <Button variant="ghost" onClick={() => setShowAddMember(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {(!members || members.length === 0) && !showAddMember && (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No family members linked</h3>
              <p className="text-muted-foreground mb-4">Add your children to manage their accounts from here.</p>
              <Button onClick={() => setShowAddMember(true)}>
                <UserPlus className="h-4 w-4 mr-2" />
                Add Your First Child
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-8">
          {members?.map((child: any) => (
            <Card
              key={child.id}
              className={`cursor-pointer transition-all hover:shadow-md ${selectedChild === child.id ? "ring-2 ring-primary" : ""}`}
              onClick={() => setSelectedChild(child.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{child.name || "Unnamed Athlete"}</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm("Remove this family member?")) {
                        removeMember.mutate({ childId: child.id });
                      }
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <CardDescription>{child.email}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>

        {selectedChild && (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold">
              {members?.find((m: any) => m.id === selectedChild)?.name || "Athlete"}'s Progress
            </h2>

            {childLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : childData ? (
              <div className="grid gap-6 md:grid-cols-3">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Recent Metrics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {childData.metrics.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No metrics recorded yet.</p>
                    ) : (
                      <div className="space-y-2">
                        {childData.metrics.slice(0, 5).map((m: any) => (
                          <div key={m.id} className="flex justify-between text-sm">
                            <span>{m.metricName}</span>
                            <span className="font-medium">{m.value} {m.unit}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Attendance
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {childData.attendance.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No attendance records yet.</p>
                    ) : (
                      <div className="space-y-2">
                        <div className="text-2xl font-bold">
                          {childData.attendance.filter((a: any) => a.status === "present").length}
                          <span className="text-sm font-normal text-muted-foreground"> / {childData.attendance.length} sessions</span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {Math.round((childData.attendance.filter((a: any) => a.status === "present").length / childData.attendance.length) * 100)}% attendance rate
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Upcoming Sessions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {childData.schedules.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No upcoming sessions.</p>
                    ) : (
                      <div className="space-y-2">
                        {childData.schedules.slice(0, 3).map((s: any) => (
                          <div key={s.id} className="text-sm">
                            <div className="font-medium">{s.title}</div>
                            <div className="text-muted-foreground">
                              {new Date(s.startTime).toLocaleDateString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            ) : null}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
