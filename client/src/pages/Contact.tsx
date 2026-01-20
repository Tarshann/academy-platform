import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";


export default function Contact() {
  const [generalForm, setGeneralForm] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });

  const [volunteerForm, setVolunteerForm] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "Volunteer Application",
    message: "",
  });

  const submitContact = trpc.contact.submit.useMutation({
    onSuccess: () => {
      toast.success("Message sent successfully! We'll get back to you soon.");
      setGeneralForm({ name: "", email: "", phone: "", subject: "", message: "" });
    },
    onError: (error) => {
      toast.error(`Failed to send message: ${error.message}`);
    },
  });

  const submitVolunteer = trpc.contact.submit.useMutation({
    onSuccess: () => {
      toast.success("Volunteer application submitted! We'll contact you soon.");
      setVolunteerForm({ name: "", email: "", phone: "", subject: "Volunteer Application", message: "" });
    },
    onError: (error) => {
      toast.error(`Failed to submit application: ${error.message}`);
    },
  });

  const handleGeneralSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitContact.mutate({ ...generalForm, type: "general" });
  };

  const handleVolunteerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitVolunteer.mutate({ ...volunteerForm, type: "volunteer" });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navigation />
      
      <main className="flex-1">
        {/* Hero */}
        <section className="py-16 bg-gradient-to-br from-background via-card to-background">
          <div className="container">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">Contact Us</h1>
              <p className="text-lg text-muted-foreground">
                Have questions? Want to volunteer? We'd love to hear from you.
              </p>
            </div>
          </div>
        </section>

        {/* Contact Forms */}
        <section className="py-16">
          <div className="container">
            <div className="max-w-3xl mx-auto">
              <Tabs defaultValue="general" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="general">General Inquiry</TabsTrigger>
                  <TabsTrigger value="volunteer">Volunteer/Coach</TabsTrigger>
                </TabsList>

                <TabsContent value="general">
                  <Card className="bg-card border-border">
                    <CardHeader>
                      <CardTitle className="text-foreground">Send Us a Message</CardTitle>
                      <CardDescription className="text-muted-foreground">
                        Fill out the form below and we'll get back to you as soon as possible.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleGeneralSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="general-name" className="text-foreground">Name *</Label>
                            <Input
                              id="general-name"
                              value={generalForm.name}
                              onChange={(e) => setGeneralForm({ ...generalForm, name: e.target.value })}
                              required
                              className="bg-background border-border text-foreground"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="general-email" className="text-foreground">Email *</Label>
                            <Input
                              id="general-email"
                              type="email"
                              value={generalForm.email}
                              onChange={(e) => setGeneralForm({ ...generalForm, email: e.target.value })}
                              required
                              className="bg-background border-border text-foreground"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="general-phone" className="text-foreground">Phone</Label>
                          <Input
                            id="general-phone"
                            type="tel"
                            value={generalForm.phone}
                            onChange={(e) => setGeneralForm({ ...generalForm, phone: e.target.value })}
                            className="bg-background border-border text-foreground"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="general-subject" className="text-foreground">Subject *</Label>
                          <Input
                            id="general-subject"
                            value={generalForm.subject}
                            onChange={(e) => setGeneralForm({ ...generalForm, subject: e.target.value })}
                            required
                            className="bg-background border-border text-foreground"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="general-message" className="text-foreground">Message *</Label>
                          <Textarea
                            id="general-message"
                            value={generalForm.message}
                            onChange={(e) => setGeneralForm({ ...generalForm, message: e.target.value })}
                            required
                            rows={6}
                            className="bg-background border-border text-foreground"
                          />
                        </div>

                        <Button type="submit" disabled={submitContact.isPending} className="w-full">
                          {submitContact.isPending ? "Sending..." : "Send Message"}
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="volunteer">
                  <Card className="bg-card border-border">
                    <CardHeader>
                      <CardTitle className="text-foreground">Volunteer/Coach Application</CardTitle>
                      <CardDescription className="text-muted-foreground">
                        Interested in coaching or volunteering? Tell us about yourself and we'll be in touch.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleVolunteerSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="volunteer-name" className="text-foreground">Name *</Label>
                            <Input
                              id="volunteer-name"
                              value={volunteerForm.name}
                              onChange={(e) => setVolunteerForm({ ...volunteerForm, name: e.target.value })}
                              required
                              className="bg-background border-border text-foreground"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="volunteer-email" className="text-foreground">Email *</Label>
                            <Input
                              id="volunteer-email"
                              type="email"
                              value={volunteerForm.email}
                              onChange={(e) => setVolunteerForm({ ...volunteerForm, email: e.target.value })}
                              required
                              className="bg-background border-border text-foreground"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="volunteer-phone" className="text-foreground">Phone *</Label>
                          <Input
                            id="volunteer-phone"
                            type="tel"
                            value={volunteerForm.phone}
                            onChange={(e) => setVolunteerForm({ ...volunteerForm, phone: e.target.value })}
                            required
                            className="bg-background border-border text-foreground"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="volunteer-message" className="text-foreground">
                            Tell us about your experience and why you'd like to volunteer *
                          </Label>
                          <Textarea
                            id="volunteer-message"
                            value={volunteerForm.message}
                            onChange={(e) => setVolunteerForm({ ...volunteerForm, message: e.target.value })}
                            required
                            rows={6}
                            placeholder="Please include your basketball experience, coaching background (if any), and availability..."
                            className="bg-background border-border text-foreground"
                          />
                        </div>

                        <Button type="submit" disabled={submitVolunteer.isPending} className="w-full">
                          {submitVolunteer.isPending ? "Submitting..." : "Submit Application"}
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
