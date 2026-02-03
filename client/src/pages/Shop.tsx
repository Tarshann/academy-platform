import { ShoppingBag, Shirt, Package, Bell } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Link } from "wouter";

const upcomingProducts = [
  {
    id: 1,
    name: "Academy Training Jersey",
    description: "Official Academy performance jersey",
    icon: Shirt,
    category: "Apparel"
  },
  {
    id: 2,
    name: "Academy Shorts",
    description: "Breathable athletic shorts with Academy logo",
    icon: Shirt,
    category: "Apparel"
  },
  {
    id: 3,
    name: "Academy Hoodie",
    description: "Premium cotton blend hoodie",
    icon: Shirt,
    category: "Apparel"
  },
  {
    id: 4,
    name: "Training Basketball",
    description: "Official Academy training ball",
    icon: Package,
    category: "Equipment"
  },
  {
    id: 5,
    name: "Academy Backpack",
    description: "Spacious gym bag with shoe compartment",
    icon: ShoppingBag,
    category: "Accessories"
  },
  {
    id: 6,
    name: "Water Bottle",
    description: "32oz insulated Academy water bottle",
    icon: Package,
    category: "Accessories"
  },
];

export default function Shop() {
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
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary font-medium text-sm mb-6">
              <Bell className="w-4 h-4" />
              Coming Soon
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Academy Shop
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Official Academy apparel and training gear launching soon. Represent The Academy with premium quality merchandise.
            </p>
          </div>
        </section>

        {/* Preview Products */}
        <section className="py-12">
          <div className="container">
            <h2 className="text-2xl font-bold text-center mb-8">
              What's Coming
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcomingProducts.map((product) => (
                <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="aspect-square bg-gradient-to-br from-primary/5 to-primary/10 flex items-center justify-center">
                    <product.icon className="w-24 h-24 text-primary/30" strokeWidth={1} />
                  </div>
                  <CardContent className="p-6">
                    <span className="text-xs font-medium text-primary uppercase tracking-wide">
                      {product.category}
                    </span>
                    <h3 className="font-semibold text-lg mt-1 mb-2">{product.name}</h3>
                    <p className="text-sm text-muted-foreground">{product.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Notify Section */}
        <section className="py-16 bg-primary/5">
          <div className="container">
            <div className="max-w-2xl mx-auto text-center">
              <ShoppingBag className="w-16 h-16 mx-auto text-primary mb-6" />
              <h2 className="text-2xl md:text-3xl font-bold mb-4">
                Be the First to Know
              </h2>
              <p className="text-muted-foreground mb-8">
                Register for Academy training programs to get exclusive early access and member discounts when the shop launches.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/signup">
                  <Button size="lg">
                    Register for Training
                  </Button>
                </Link>
                <Link href="/contact">
                  <Button size="lg" variant="outline">
                    Contact Us
                  </Button>
                </Link>
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
