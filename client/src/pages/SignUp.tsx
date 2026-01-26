import { Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";

export default function SignUp() {
  const { isAuthenticated } = useAuth();
  const createCheckout = trpc.payment.createCheckout.useMutation({
    onSuccess: (data) => {
      if (data.url) {
        toast.info("Redirecting to checkout...");
        window.open(data.url, '_blank');
      }
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create checkout session");
    },
  });

  const handlePurchase = (productId: string) => {
    if (!isAuthenticated) {
      toast.info("Please log in to purchase");
      window.location.href = getLoginUrl();
      return;
    }
    createCheckout.mutate({ productId });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navigation />
      
      <main className="flex-1">
        {/* Hero */}
        <section className="py-16 bg-gradient-to-br from-background via-card to-background">
          <div className="container">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">Registration</h1>
              <p className="text-lg text-muted-foreground">
                Choose the program that fits your goals. Registration is now open for all programs.
              </p>
            </div>
          </div>
        </section>

        {/* Memberships */}
        <section className="py-16">
          <div className="container">
            <h2 className="text-3xl font-bold text-center mb-4 text-foreground">Memberships</h2>
            <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
              Best value for committed players. Unlimited access to programs throughout the month.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              <Card className="bg-card border-2 border-primary relative">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground">POPULAR</Badge>
                </div>
                <CardHeader>
                  <CardTitle className="text-foreground text-2xl">Academy Group Membership</CardTitle>
                  <CardDescription className="text-muted-foreground">Unlimited group sessions</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-primary">$150</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    <li className="flex items-start gap-2">
                      <Check className="text-primary mt-0.5 flex-shrink-0" size={20} />
                      <span className="text-muted-foreground">Unlimited group workout sessions</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="text-primary mt-0.5 flex-shrink-0" size={20} />
                      <span className="text-muted-foreground">Small group sizes (max 8 players)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="text-primary mt-0.5 flex-shrink-0" size={20} />
                      <span className="text-muted-foreground">Competitive training environment</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="text-primary mt-0.5 flex-shrink-0" size={20} />
                      <span className="text-muted-foreground">Youth athletes of all levels</span>
                    </li>
                  </ul>
                  <Button 
                    className="w-full" 
                    size="lg"
                    onClick={() => handlePurchase('academy-group-membership')}
                    disabled={createCheckout.isPending}
                  >
                    {createCheckout.isPending ? 'Processing...' : 'Register Now'}
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-card border-2 border-primary relative">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground">BEST VALUE</Badge>
                </div>
                <CardHeader>
                  <CardTitle className="text-foreground text-2xl">Complete Player Membership</CardTitle>
                  <CardDescription className="text-muted-foreground">Unlimited skills classes + open gyms</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-primary">$100</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    <li className="flex items-start gap-2">
                      <Check className="text-primary mt-0.5 flex-shrink-0" size={20} />
                      <span className="text-muted-foreground">Unlimited skills classes</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="text-primary mt-0.5 flex-shrink-0" size={20} />
                      <span className="text-muted-foreground">Unlimited open gym access</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="text-primary mt-0.5 flex-shrink-0" size={20} />
                      <span className="text-muted-foreground">Shooting lab access included</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="text-primary mt-0.5 flex-shrink-0" size={20} />
                      <span className="text-muted-foreground">Youth athletes of all levels</span>
                    </li>
                  </ul>
                  <Button 
                    className="w-full" 
                    size="lg"
                    onClick={() => handlePurchase('complete-player-membership')}
                    disabled={createCheckout.isPending}
                  >
                    {createCheckout.isPending ? 'Processing...' : 'Register Now'}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Individual Sessions */}
        <section className="py-16 bg-card">
          <div className="container">
            <h2 className="text-3xl font-bold text-center mb-4 text-foreground">Individual Sessions</h2>
            <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
              Pay-as-you-go options. Perfect for flexible schedules or trying programs before committing.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="bg-background border-border">
                <CardHeader>
                  <CardTitle className="text-foreground">Group Workout</CardTitle>
                  <CardDescription className="text-muted-foreground">Limited to 8 players</CardDescription>
                  <div className="mt-4">
                    <span className="text-3xl font-bold text-primary">$25</span>
                    <span className="text-muted-foreground">/session</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-6">
                    Single session access to group workouts. Develop skills in a competitive environment.
                  </p>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => handlePurchase('group-workout')}
                    disabled={createCheckout.isPending}
                  >
                    {createCheckout.isPending ? 'Processing...' : 'Register'}
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-background border-border">
                <CardHeader>
                  <CardTitle className="text-foreground">Individual Training</CardTitle>
                  <CardDescription className="text-muted-foreground">One-on-one coaching</CardDescription>
                  <div className="mt-4">
                    <span className="text-3xl font-bold text-primary">$60</span>
                    <span className="text-muted-foreground">/session</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-6">
                    Personalized training focused on your unique strengths and development goals.
                  </p>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => handlePurchase('individual-training')}
                    disabled={createCheckout.isPending}
                  >
                    {createCheckout.isPending ? 'Processing...' : 'Register'}
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-background border-border">
                <CardHeader>
                  <CardTitle className="text-foreground">Skills Class</CardTitle>
                  <CardDescription className="text-muted-foreground">Fundamentals focus</CardDescription>
                  <div className="mt-4">
                    <span className="text-3xl font-bold text-primary">$15</span>
                    <span className="text-muted-foreground">/class</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-6">
                    Build a strong foundation with focused instruction on multi-sport fundamentals, footwork, and body control.
                  </p>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => handlePurchase('skills-class')}
                    disabled={createCheckout.isPending}
                  >
                    {createCheckout.isPending ? 'Processing...' : 'Register'}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Special Programs */}
        <section className="py-16">
          <div className="container">
            <h2 className="text-3xl font-bold text-center mb-4 text-foreground">Special Programs</h2>
            <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
              Seasonal camps and competitive team opportunities.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-foreground">On Field Workouts</CardTitle>
                  <CardDescription className="text-muted-foreground">Outdoor training</CardDescription>
                  <div className="mt-4">
                    <span className="text-3xl font-bold text-primary">$30</span>
                    <span className="text-muted-foreground">/session</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-6">
                    Outdoor conditioning and agility training to complement basketball skills.
                  </p>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => handlePurchase('on-field-workouts')}
                    disabled={createCheckout.isPending}
                  >
                    {createCheckout.isPending ? 'Processing...' : 'Register'}
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-foreground">Summer Camp</CardTitle>
                  <CardDescription className="text-muted-foreground">Seasonal program</CardDescription>
                  <div className="mt-4">
                    <span className="text-3xl font-bold text-primary">$20</span>
                    <span className="text-muted-foreground">/day</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-6">
                    Intensive summer training with full-day sessions, skill work, and competition.
                  </p>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => handlePurchase('summer-camp')}
                    disabled={createCheckout.isPending}
                  >
                    {createCheckout.isPending ? 'Processing...' : 'Register'}
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-foreground">Team Academy</CardTitle>
                  <CardDescription className="text-muted-foreground">Competitive travel team</CardDescription>
                  <div className="mt-4">
                    <span className="text-3xl font-bold text-primary">$300</span>
                    <span className="text-muted-foreground">/season</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-6">
                    Join our competitive teams. Includes uniforms, coaching, and tournament fees.
                  </p>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => handlePurchase('team-academy')}
                    disabled={createCheckout.isPending}
                  >
                    {createCheckout.isPending ? 'Processing...' : 'Register'}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 bg-primary/10">
          <div className="container">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl font-bold mb-4 text-foreground">Need Help Choosing?</h2>
              <p className="text-lg text-muted-foreground mb-8">
                Not sure which program is right for you? Contact us and we'll help you find the perfect fit.
              </p>
              <Link href="/contact">
                <Button size="lg" className="text-lg px-8">
                  Contact Us
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
