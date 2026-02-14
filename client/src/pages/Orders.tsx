import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Package } from "lucide-react";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { formatUsd } from "@shared/money";

const statusLabels: Record<string, string> = {
  pending: "Pending",
  paid: "Paid",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const statusVariants: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  paid: "default",
  delivered: "default",
  processing: "secondary",
  shipped: "secondary",
  pending: "outline",
  cancelled: "destructive",
};

export default function Orders() {
  const loginUrl = getLoginUrl();
  const redirectPath = "/orders";
  const signInRedirectUrl = loginUrl.startsWith("/sign-in")
    ? `/sign-in?redirect=${encodeURIComponent(redirectPath)}`
    : loginUrl;
  const { user, isAuthenticated, loading, authConfigured } = useAuth({
    redirectOnUnauthenticated: true,
    redirectPath: signInRedirectUrl,
  });
  const { data: orders, isLoading } = trpc.shop.myOrders.useQuery(undefined, {
    enabled: isAuthenticated,
  });

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
              Please set VITE_CLERK_PUBLISHABLE_KEY or OAuth credentials to access your orders.
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
          <Breadcrumbs items={[{ label: "Orders" }]} />
          <div className="mt-6 mb-8">
            <h1 className="text-4xl font-bold text-foreground">Order History</h1>
            <p className="text-muted-foreground mt-2">
              Track your Academy Shop purchases and shipping status.
            </p>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin text-primary" size={32} />
            </div>
          ) : orders && orders.length > 0 ? (
            <div className="space-y-6">
              {orders.map((order: any) => {
                const statusLabel = statusLabels[order.status] || order.status;
                const statusVariant =
                  statusVariants[order.status] ?? statusVariants.pending;
                return (
                  <Card key={order.id} className="bg-card border-border">
                    <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <CardTitle className="text-foreground">
                          Order #{order.id}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          Placed{" "}
                          {new Date(order.createdAt).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                      <Badge variant={statusVariant}>{statusLabel}</Badge>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex flex-wrap gap-6 text-sm">
                        <div>
                          <p className="text-muted-foreground">Total</p>
                          <p className="text-lg font-semibold text-foreground">
                            {formatUsd(order.totalAmount)}
                          </p>
                        </div>
                        {order.shippingAddress && (
                          <div className="min-w-[200px]">
                            <p className="text-muted-foreground">Shipping Address</p>
                            <p className="text-foreground whitespace-pre-line">
                              {order.shippingAddress}
                            </p>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Package className="h-4 w-4" />
                        Your order status updates as soon as it is processed.
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="bg-card border-border text-center py-16">
              <CardContent className="space-y-4">
                <Package className="h-12 w-12 text-muted-foreground mx-auto" />
                <div>
                  <h2 className="text-xl font-semibold text-foreground">
                    No orders yet
                  </h2>
                  <p className="text-muted-foreground">
                    Browse the shop to grab official Academy gear.
                  </p>
                </div>
                <Button asChild>
                  <a href="/shop">Visit the Shop</a>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
