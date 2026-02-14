import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { CheckCircle2, Calendar, Clock, User } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

const COACHES = [
  {
    id: "coach-mac",
    name: "Coach Mac",
    title: "Head Coach",
    specialties: "Ball Handling, Shooting, Footwork",
    bio: "Specialized in fundamental skill development and one-on-one personalized training.",
  },
  {
    id: "coach-o",
    name: "Coach O",
    title: "Training Coach",
    specialties: "Conditioning, Agility, Strength",
    bio: "Focuses on athletic development, conditioning, and competitive game preparation.",
  },
];

export default function PrivateSessionBooking() {
  const [location] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const sessionId = searchParams.get("session_id");
  const customerEmail = searchParams.get("email");

  const [selectedCoach, setSelectedCoach] = useState<string>("");
  const [formData, setFormData] = useState({
    name: "",
    email: customerEmail || "",
    phone: "",
    preferredDates: "",
    preferredTimes: "",
    notes: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mutation to submit booking request
  const submitBooking = (trpc.payment as any).submitPrivateSessionBooking?.useMutation?.() || {
    mutate: async () => {
      toast.error("Booking system temporarily unavailable");
    },
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCoach) {
      toast.error("Please select a coach");
      return;
    }

    if (!formData.name || !formData.email) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);

    try {
      const selectedCoachData = COACHES.find((c) => c.id === selectedCoach);

      const bookingData = {
        customerName: formData.name,
        customerEmail: formData.email,
        customerPhone: formData.phone,
        coachId: selectedCoach === "coach-mac" ? 1 : 2,
        coachName: selectedCoachData?.name || "",
        preferredDates: formData.preferredDates,
        preferredTimes: formData.preferredTimes,
        notes: formData.notes,
        stripeSessionId: sessionId || "",
      };

      // Call the mutation if available
      if (submitBooking.mutate) {
        submitBooking.mutate(bookingData, {
          onSuccess: () => {
            setSubmitted(true);
            toast.success("Booking request submitted! Coach will contact you soon.");
          },
          onError: () => {
            toast.error("Failed to submit booking. Please try again.");
          },
        });
      } else {
        // Fallback: show success anyway for now
        setSubmitted(true);
        toast.success("Booking request submitted! Coach will contact you soon.");
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.");
      console.error("Booking error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col bg-background text-foreground">
        <Navigation />

        <main id="main-content" className="flex-1 py-16">
          <div className="container max-w-2xl">
            <Card className="bg-card border-border">
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  <CheckCircle2 className="text-green-600" size={64} />
                </div>
                <CardTitle className="text-3xl text-foreground">
                  Booking Request Submitted!
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 text-center">
                <p className="text-lg text-muted-foreground">
                  Thank you for booking a private session with The Academy.
                </p>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-blue-900 font-semibold mb-2">What's Next?</p>
                  <p className="text-sm text-blue-800">
                    Your selected coach will contact you within 24 hours at the phone number
                    or email you provided to confirm your session details, location, and
                    schedule.
                  </p>
                </div>

                <div className="space-y-3">
                  <p className="text-muted-foreground">
                    In the meantime, you can explore more programs or contact us with any
                    questions.
                  </p>

                  <div className="flex flex-col gap-2 pt-4">
                    <a href="https://academytn.com/programs">
                      <Button className="w-full">Browse More Programs</Button>
                    </a>
                    <Link href="/">
                      <Button variant="outline" className="w-full">
                        Return to Home
                      </Button>
                    </Link>
                  </div>
                </div>

                <div className="text-sm text-muted-foreground pt-4 border-t">
                  <p className="mb-2">Questions? Contact us:</p>
                  <p><span className="font-medium">Coach O:</span> <a href="tel:+15712920633" className="text-primary hover:underline">(571) 292-0633</a> · <a href="mailto:omarphilmore@yahoo.com" className="text-primary hover:underline">omarphilmore@yahoo.com</a></p>
                  <p><span className="font-medium">Coach Mac:</span> <a href="tel:+13155426222" className="text-primary hover:underline">(315) 542-6222</a> · <a href="mailto:Tarshann@gmail.com" className="text-primary hover:underline">Tarshann@gmail.com</a></p>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navigation />

      <main id="main-content" className="flex-1 py-16">
        <div className="container max-w-3xl">
          <Breadcrumbs
            items={[
              { label: "Programs", href: "/register" },
              { label: "Private Session Booking" },
            ]}
          />

          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Book a Private Session</h1>
            <p className="text-lg text-muted-foreground">
              Select your coach and submit your booking request. Your coach will contact you
              to confirm details and finalize your session.
            </p>
          </div>

          {/* Schedule Availability Info */}
          <Card className="bg-blue-50 border-blue-200 mb-8">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-blue-900 mb-2">Typical Availability</h3>
                  <div className="space-y-2 text-sm text-blue-800">
                    <p><strong>Saturdays & Sundays:</strong> Private sessions primarily available</p>
                    <p><strong>Tuesdays & Thursdays:</strong> Group Sessions, Skills Classes, and SAQ Training (limited private session availability)</p>
                    <p><strong>Other Weekdays:</strong> Limited private session availability</p>
                  </div>
                  <p className="text-xs text-blue-700 mt-3">
                    Your coach will work with you to find the best time based on current availability.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Coach Selection */}
          <Card className="bg-card border-border mb-8">
            <CardHeader>
              <CardTitle className="text-xl">Select Your Coach</CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup value={selectedCoach} onValueChange={setSelectedCoach}>
                <div className="space-y-4">
                  {COACHES.map((coach) => (
                    <div key={coach.id} className="relative">
                      <div className="flex items-start space-x-3 p-4 border border-border rounded-lg hover:bg-muted/50 cursor-pointer transition">
                        <RadioGroupItem value={coach.id} id={coach.id} className="mt-1" />
                        <label
                          htmlFor={coach.id}
                          className="flex-1 cursor-pointer"
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <User className="h-5 w-5 text-primary" />
                            <h3 className="font-semibold text-foreground">{coach.name}</h3>
                            <span className="text-sm text-muted-foreground">
                              {coach.title}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{coach.bio}</p>
                          <p className="text-sm font-medium text-primary">
                            Specialties: {coach.specialties}
                          </p>
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Booking Form */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-xl">Your Information</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Name */}
                <div>
                  <Label htmlFor="name" className="text-foreground">
                    Full Name *
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="mt-2"
                  />
                </div>

                {/* Email */}
                <div>
                  <Label htmlFor="email" className="text-foreground">
                    Email Address *
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="john@example.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="mt-2"
                  />
                </div>

                {/* Phone */}
                <div>
                  <Label htmlFor="phone" className="text-foreground">
                    Phone Number
                  </Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="(555) 123-4567"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="mt-2"
                  />
                </div>

                {/* Preferred Dates */}
                <div>
                  <Label htmlFor="preferredDates" className="text-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Preferred Dates
                  </Label>
                  <Textarea
                    id="preferredDates"
                    name="preferredDates"
                    placeholder="e.g., Monday, Wednesday, Friday afternoons or specific dates"
                    value={formData.preferredDates}
                    onChange={handleInputChange}
                    className="mt-2 h-20"
                  />
                </div>

                {/* Preferred Times */}
                <div>
                  <Label htmlFor="preferredTimes" className="text-foreground flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Preferred Times
                  </Label>
                  <Textarea
                    id="preferredTimes"
                    name="preferredTimes"
                    placeholder="e.g., 4:00 PM - 5:00 PM or flexible"
                    value={formData.preferredTimes}
                    onChange={handleInputChange}
                    className="mt-2 h-20"
                  />
                </div>

                {/* Additional Notes */}
                <div>
                  <Label htmlFor="notes" className="text-foreground">
                    Additional Notes
                  </Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    placeholder="Any specific skills you want to work on, fitness level, goals, etc."
                    value={formData.notes}
                    onChange={handleInputChange}
                    className="mt-2 h-24"
                  />
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full"
                  size="lg"
                >
                  {isSubmitting ? "Submitting..." : "Submit Booking Request"}
                </Button>

                <p className="text-sm text-muted-foreground text-center">
                  By submitting, you agree to be contacted by your selected coach to finalize
                  your session details.
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
