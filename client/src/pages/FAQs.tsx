import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function FAQs() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navigation />
      
      <main id="main-content" className="flex-1">
        {/* Hero */}
        <section className="py-16 bg-gradient-to-br from-background via-card to-background">
          <div className="container">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">Frequently Asked Questions</h1>
              <p className="text-lg text-muted-foreground">
                Find answers to common questions about The Academy's programs and policies.
              </p>
            </div>
          </div>
        </section>

        {/* FAQs */}
        <section className="py-16">
          <div className="container">
            <div className="max-w-3xl mx-auto">
              <Accordion type="single" collapsible className="w-full space-y-4">
                <AccordionItem value="item-1" className="bg-card border border-border rounded-lg px-6">
                  <AccordionTrigger className="text-foreground hover:text-primary">
                    What age groups do you serve?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    The Academy serves youth athletes ages 8-18. We offer programs tailored to different 
                    skill levels and age groups to ensure appropriate development for all participants.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-2" className="bg-card border border-border rounded-lg px-6">
                  <AccordionTrigger className="text-foreground hover:text-primary">
                    Do I need prior basketball experience to join?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    No prior experience is required! We welcome players of all skill levels, from beginners 
                    to advanced athletes. Our coaches will assess each player's abilities and provide 
                    appropriate instruction and challenges.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-3" className="bg-card border border-border rounded-lg px-6">
                  <AccordionTrigger className="text-foreground hover:text-primary">
                    What should my child bring to training sessions?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Players should bring athletic shoes (basketball shoes preferred), comfortable athletic 
                    clothing, a water bottle, and a positive attitude. We provide basketballs and other 
                    training equipment.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-4" className="bg-card border border-border rounded-lg px-6">
                  <AccordionTrigger className="text-foreground hover:text-primary">
                    How do I register for programs?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    You can register through our Sign Up page or contact us directly. We'll guide you 
                    through the registration process and help you choose the right program for your child's 
                    goals and schedule.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-5" className="bg-card border border-border rounded-lg px-6">
                  <AccordionTrigger className="text-foreground hover:text-primary">
                    What is your cancellation and refund policy?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    We understand that schedules change. Please contact us as soon as possible if you need 
                    to cancel or reschedule. Refund policies vary by program type. Individual sessions can 
                    typically be rescheduled with 24-hour notice. Contact us for specific details about 
                    your program.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-6" className="bg-card border border-border rounded-lg px-6">
                  <AccordionTrigger className="text-foreground hover:text-primary">
                    What makes The Academy different from other programs?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    The Academy focuses on holistic player development, not just basketball skills. We 
                    emphasize character building, accountability, and long-term growth. Our coaches provide 
                    individualized attention within a structured environment, and we maintain small group 
                    sizes to ensure quality instruction.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-7" className="bg-card border border-border rounded-lg px-6">
                  <AccordionTrigger className="text-foreground hover:text-primary">
                    Can parents watch training sessions?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Yes! We welcome parents to observe training sessions. We believe in transparency and 
                    want families to see the progress their children are making. However, we ask that 
                    parents remain in designated viewing areas to minimize distractions during training.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-8" className="bg-card border border-border rounded-lg px-6">
                  <AccordionTrigger className="text-foreground hover:text-primary">
                    What is the difference between memberships and individual sessions?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Memberships provide unlimited access to specific program types (group sessions, skills 
                    classes, or open gyms) for a monthly fee, offering the best value for committed players. 
                    Individual sessions are pay-as-you-go options perfect for those with limited availability 
                    or who want to try programs before committing to a membership.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-9" className="bg-card border border-border rounded-lg px-6">
                  <AccordionTrigger className="text-foreground hover:text-primary">
                    Do you offer team training or just individual development?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    We offer both! In addition to individual workouts, we have group sessions that develop 
                    teamwork skills, and we also offer Team Academy Registration for players interested in 
                    competitive travel teams representing The Academy in tournaments and leagues.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-10" className="bg-card border border-border rounded-lg px-6">
                  <AccordionTrigger className="text-foreground hover:text-primary">
                    How can I stay updated on schedules and announcements?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Once registered, members have access to our member portal where they can view schedules, 
                    announcements, and important updates. You can also follow us on social media (Instagram, 
                    Facebook, TikTok) and sign up for our email list to stay informed.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              <div className="mt-12 text-center">
                <p className="text-muted-foreground mb-4">Still have questions?</p>
                <a href="/contact">
                  <button className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-8">
                    Contact Us
                  </button>
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
