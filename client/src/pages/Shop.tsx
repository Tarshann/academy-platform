import { ShoppingBag, Bell, AlertCircle, RefreshCw } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { trpc } from "@/lib/trpc";

function ProductCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <Skeleton className="aspect-square w-full" />
      <CardContent className="p-6 space-y-2">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-5 w-20 mt-2" />
      </CardContent>
    </Card>
  );
}

export default function Shop() {
  const { data: products, isLoading, isError, refetch } = trpc.shop.products.useQuery();

  const hasProducts = products && products.length > 0;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />

      <main id="main-content" className="flex-1">
        <div className="container pt-6">
          <Breadcrumbs items={[{ label: "Shop" }]} />
        </div>

        {/* Hero Section */}
        <section className="bg-gradient-to-b from-primary/10 to-background py-16">
          <div className="container text-center">
            {!hasProducts && !isLoading && (
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary font-medium text-sm mb-6">
                <Bell className="w-4 h-4" />
                Coming Soon
              </div>
            )}
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Academy Shop
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {hasProducts
                ? "Official Academy apparel and training gear. Represent The Academy with premium quality merchandise."
                : "Official Academy apparel and training gear launching soon. Represent The Academy with premium quality merchandise."}
            </p>
          </div>
        </section>

        {/* Products Section */}
        <section className="py-12">
          <div className="container">
            {isLoading && (
              <>
                <h2 className="text-2xl font-bold text-center mb-8">Shop Products</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  <ProductCardSkeleton />
                  <ProductCardSkeleton />
                  <ProductCardSkeleton />
                  <ProductCardSkeleton />
                  <ProductCardSkeleton />
                  <ProductCardSkeleton />
                </div>
              </>
            )}

            {isError && (
              <div className="text-center py-12">
                <AlertCircle className="w-12 h-12 mx-auto text-destructive mb-4" />
                <h3 className="text-lg font-semibold mb-2">Unable to load products</h3>
                <p className="text-muted-foreground mb-4">Something went wrong while fetching products.</p>
                <Button variant="outline" onClick={() => refetch()}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
              </div>
            )}

            {!isLoading && !isError && hasProducts && (
              <>
                <h2 className="text-2xl font-bold text-center mb-8">Shop Products</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {products.map((product) => (
                    <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                      {product.imageUrl ? (
                        <div className="aspect-square overflow-hidden">
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="aspect-square bg-gradient-to-br from-primary/5 to-primary/10 flex items-center justify-center">
                          <ShoppingBag className="w-24 h-24 text-primary/30" strokeWidth={1} />
                        </div>
                      )}
                      <CardContent className="p-6">
                        <span className="text-xs font-medium text-primary uppercase tracking-wide">
                          {product.category}
                        </span>
                        <h3 className="font-semibold text-lg mt-1 mb-2">{product.name}</h3>
                        {product.description && (
                          <p className="text-sm text-muted-foreground mb-2">{product.description}</p>
                        )}
                        <p className="text-lg font-bold">${product.price}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}

            {!isLoading && !isError && !hasProducts && (
              <>
                <h2 className="text-2xl font-bold text-center mb-8">What's Coming</h2>
                <div className="text-center py-8">
                  <ShoppingBag className="w-16 h-16 mx-auto text-muted-foreground/40 mb-4" />
                  <p className="text-muted-foreground">
                    No products available yet. Check back soon for official Academy merchandise!
                  </p>
                </div>
              </>
            )}
          </div>
        </section>

        {/* Notify Section */}
        <section className="py-16 bg-primary/5">
          <div className="container">
            <div className="max-w-2xl mx-auto text-center">
              <ShoppingBag className="w-16 h-16 mx-auto text-primary mb-6" />
              <h2 className="text-2xl md:text-3xl font-bold mb-4">
                {hasProducts ? "Member Discounts Available" : "Be the First to Know"}
              </h2>
              <p className="text-muted-foreground mb-8">
                Register for Academy training programs to get exclusive early access and member discounts.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a href="https://academytn.com/programs">
                  <Button size="lg">
                    View Programs
                  </Button>
                </a>
                <a href="https://academytn.com/contact">
                  <Button size="lg" variant="outline">
                    Contact Us
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16">
          <div className="container">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-2xl font-bold text-center mb-8">
                Frequently Asked Questions
              </h2>
              <div className="space-y-6">
                <div className="p-6 bg-muted/50 rounded-lg">
                  <h3 className="font-semibold mb-2">When will the shop launch?</h3>
                  <p className="text-muted-foreground">
                    We're working hard to bring you quality Academy merchandise. Sign up for training to be notified when the shop goes live.
                  </p>
                </div>
                <div className="p-6 bg-muted/50 rounded-lg">
                  <h3 className="font-semibold mb-2">Will there be member discounts?</h3>
                  <p className="text-muted-foreground">
                    Yes! Active Academy members will receive exclusive discounts on all merchandise.
                  </p>
                </div>
                <div className="p-6 bg-muted/50 rounded-lg">
                  <h3 className="font-semibold mb-2">What sizes will be available?</h3>
                  <p className="text-muted-foreground">
                    We'll offer youth and adult sizes to fit athletes of all ages. Detailed size guides will be available at launch.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
