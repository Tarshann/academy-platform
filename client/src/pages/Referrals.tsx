import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { trpc } from "@/lib/trpc";
import { Loader2, Gift, Copy, Send, Users, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useState } from "react";
import { SEO } from "@/components/SEO";

export default function Referrals() {
  const { user, isAuthenticated, loading } = useAuth({ redirectOnUnauthenticated: true });
  const [inviteEmail, setInviteEmail] = useState("");

  const { data: referralCode, isLoading: codeLoading } = trpc.referrals.getMyCode.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );
  const { data: myReferrals, isLoading: referralsLoading } = trpc.referrals.getMyReferrals.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );
  const { data: stats } = trpc.referrals.getStats.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  const inviteMutation = trpc.referrals.invite.useMutation({
    onSuccess: () => {
      toast.success("Invitation sent!");
      setInviteEmail("");
    },
    onError: (err) => toast.error(err.message),
  });

  const copyCode = () => {
    if (referralCode) {
      navigator.clipboard.writeText(referralCode);
      toast.success("Referral code copied!");
    }
  };

  if (loading || codeLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <SEO title="Referrals" description="Invite friends and earn rewards." />
      <Navigation />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Refer a Friend</h1>
          <p className="text-muted-foreground mt-1">
            Share The Academy with friends and earn 100 points for every successful referral!
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Users className="h-8 w-8 text-primary" />
                <div>
                  <div className="text-2xl font-bold">{stats?.totalReferrals ?? 0}</div>
                  <div className="text-sm text-muted-foreground">Total Invites</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Gift className="h-8 w-8 text-green-500" />
                <div>
                  <div className="text-2xl font-bold">{stats?.converted ?? 0}</div>
                  <div className="text-sm text-muted-foreground">Converted</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Trophy className="h-8 w-8 text-yellow-500" />
                <div>
                  <div className="text-2xl font-bold">{stats?.totalPoints ?? 0}</div>
                  <div className="text-sm text-muted-foreground">Points Earned</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Referral Code */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Your Referral Code</CardTitle>
            <CardDescription>Share this code with friends or send an invite directly</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 bg-muted rounded-lg p-4 text-center">
                <span className="text-2xl font-mono font-bold tracking-wider">{referralCode}</span>
              </div>
              <Button variant="outline" onClick={copyCode}>
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </Button>
            </div>

            <div className="flex gap-3">
              <input
                type="email"
                placeholder="friend@email.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
              <Button
                onClick={() => inviteMutation.mutate({ email: inviteEmail })}
                disabled={!inviteEmail || inviteMutation.isPending}
              >
                {inviteMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send Invite
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Referral History */}
        <Card>
          <CardHeader>
            <CardTitle>Your Referrals</CardTitle>
          </CardHeader>
          <CardContent>
            {referralsLoading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : !myReferrals || myReferrals.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No referrals yet. Start sharing your code!
              </p>
            ) : (
              <div className="space-y-3">
                {myReferrals.map((ref: any) => (
                  <div key={ref.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <div className="font-medium text-sm">{ref.referredEmail}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(ref.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        ref.status === "rewarded" ? "bg-green-100 text-green-700" :
                        ref.status === "signed_up" ? "bg-blue-100 text-blue-700" :
                        "bg-gray-100 text-gray-700"
                      }`}>
                        {ref.status}
                      </span>
                      {ref.pointsAwarded > 0 && (
                        <span className="text-xs font-medium text-yellow-600">+{ref.pointsAwarded} pts</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
      <Footer />
    </>
  );
}
