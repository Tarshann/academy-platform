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

interface FormErrors {
  name?: string;
  email?: string;
  phone?: string;
  subject?: string;
  message?: string;
}

function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validatePhone(phone: string): boolean {
  if (!phone) return true; // Phone is optional
  const phoneRegex = /^[\d\s\-\+\(\)]+$/;
  return phoneRegex.test(phone) && phone.replace(/\D/g, "").length >= 10;
}

function validateGeneralForm(form: { name: string; email: string; phone: string; subject: string; message: string }): FormErrors {
  const errors: FormErrors = {};
  
  if (!form.name.trim()) {
    errors.name = "Name is required";
  } else if (form.name.trim().length < 2) {
    errors.name = "Name must be at least 2 characters";
  }
  
  if (!form.email.trim()) {
    errors.email = "Email is required";
  } else if (!validateEmail(form.email)) {
    errors.email = "Please enter a valid email address";
  }
  
  if (form.phone && !validatePhone(form.phone)) {
    errors.phone = "Please enter a valid phone number";
  }
  
  if (!form.subject.trim()) {
    errors.subject = "Subject is required";
  } else if (form.subject.trim().length < 3) {
    errors.subject = "Subject must be at least 3 characters";
  }
  
  if (!form.message.trim()) {
    errors.message = "Message is required";
  } else if (form.message.trim().length < 10) {
    errors.message = "Message must be at least 10 characters";
  } else if (form.message.trim().length > 2000) {
    errors.message = "Message must be less than 2000 characters";
  }
  
  return errors;
}

function validateVolunteerForm(form: { name: string; email: string; phone: string; message: string }): FormErrors {
  const errors: FormErrors = {};
  
  if (!form.name.trim()) {
    errors.name = "Name is required";
  } else if (form.name.trim().length < 2) {
    errors.name = "Name must be at least 2 characters";
  }
  
  if (!form.email.trim()) {
    errors.email = "Email is required";
  } else if (!validateEmail(form.email)) {
    errors.email = "Please enter a valid email address";
  }
  
  if (!form.phone.trim()) {
    errors.phone = "Phone is required";
  } else if (!validatePhone(form.phone)) {
    errors.phone = "Please enter a valid phone number";
  }
  
  if (!form.message.trim()) {
    errors.message = "Please tell us about your experience";
  } else if (form.message.trim().length < 20) {
    errors.message = "Please provide more details (at least 20 characters)";
  } else if (form.message.trim().length > 2000) {
    errors.message = "Message must be less than 2000 characters";
  }
  
  return errors;
}

export default function Contact() {
  const [generalForm, setGeneralForm] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });

  const [generalErrors, setGeneralErrors] = useState<FormErrors>({});
  const [generalSuccess, setGeneralSuccess] = useState(false);

  const [volunteerForm, setVolunteerForm] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "Volunteer Application",
    message: "",
  });

  const [volunteerErrors, setVolunteerErrors] = useState<FormErrors>({});
  const [volunteerSuccess, setVolunteerSuccess] = useState(false);

  const submitContact = trpc.contact.submit.useMutation({
    onSuccess: () => {
      toast.success("Message sent successfully! We'll get back to you soon.");
      setGeneralForm({ name: "", email: "", phone: "", subject: "", message: "" });
      setGeneralSuccess(true);
    },
    onError: (error) => {
      toast.error(`Failed to send message: ${error.message}`);
    },
  });

  const submitVolunteer = trpc.contact.submit.useMutation({
    onSuccess: () => {
      toast.success("Volunteer application submitted! We'll contact you soon.");
      setVolunteerForm({ name: "", email: "", phone: "", subject: "Volunteer Application", message: "" });
      setVolunteerSuccess(true);
    },
    onError: (error) => {
      toast.error(`Failed to submit application: ${error.message}`);
    },
  });

  const handleGeneralSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validateGeneralForm(generalForm);
    setGeneralErrors(errors);
    
    if (Object.keys(errors).length === 0) {
      submitContact.mutate({ ...generalForm, type: "general" });
    } else {
      toast.error("Please fix the errors in the form");
    }
  };

  const handleVolunteerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validateVolunteerForm(volunteerForm);
    setVolunteerErrors(errors);
    
    if (Object.keys(errors).length === 0) {
      submitVolunteer.mutate({ ...volunteerForm, type: "volunteer" });
    } else {
      toast.error("Please fix the errors in the form");
    }
  };

  const handleGeneralFieldChange = (field: keyof typeof generalForm, value: string) => {
    setGeneralForm({ ...generalForm, [field]: value });
    // Clear error when user starts typing
    if (generalErrors[field]) {
      setGeneralErrors({ ...generalErrors, [field]: undefined });
    }
    if (generalSuccess) {
      setGeneralSuccess(false);
    }
  };

  const handleVolunteerFieldChange = (field: keyof typeof volunteerForm, value: string) => {
    setVolunteerForm({ ...volunteerForm, [field]: value });
    // Clear error when user starts typing
    if (volunteerErrors[field]) {
      setVolunteerErrors({ ...volunteerErrors, [field]: undefined });
    }
    if (volunteerSuccess) {
      setVolunteerSuccess(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navigation />
      
      <main id="main-content" className="flex-1">
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
                      {generalSuccess && (
                        <div
                          className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
                          role="status"
                        >
                          Thanks for reaching out! Your message is on its way to our team.
                        </div>
                      )}
                      <form onSubmit={handleGeneralSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="general-name" className="text-foreground">Name *</Label>
                            <Input
                              id="general-name"
                              value={generalForm.name}
                              onChange={(e) => handleGeneralFieldChange("name", e.target.value)}
                              required
                              className={`bg-background border-border text-foreground ${generalErrors.name ? "border-destructive" : ""}`}
                              aria-invalid={!!generalErrors.name}
                              aria-describedby={generalErrors.name ? "general-name-error" : undefined}
                            />
                            {generalErrors.name && (
                              <p id="general-name-error" className="text-sm text-destructive" role="alert">
                                {generalErrors.name}
                              </p>
                            )}
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="general-email" className="text-foreground">Email *</Label>
                            <Input
                              id="general-email"
                              type="email"
                              value={generalForm.email}
                              onChange={(e) => handleGeneralFieldChange("email", e.target.value)}
                              required
                              className={`bg-background border-border text-foreground ${generalErrors.email ? "border-destructive" : ""}`}
                              aria-invalid={!!generalErrors.email}
                              aria-describedby={generalErrors.email ? "general-email-error" : undefined}
                            />
                            {generalErrors.email && (
                              <p id="general-email-error" className="text-sm text-destructive" role="alert">
                                {generalErrors.email}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="general-phone" className="text-foreground">Phone</Label>
                          <Input
                            id="general-phone"
                            type="tel"
                            value={generalForm.phone}
                            onChange={(e) => handleGeneralFieldChange("phone", e.target.value)}
                            className={`bg-background border-border text-foreground ${generalErrors.phone ? "border-destructive" : ""}`}
                            aria-invalid={!!generalErrors.phone}
                            aria-describedby={generalErrors.phone ? "general-phone-error" : undefined}
                          />
                          {generalErrors.phone && (
                            <p id="general-phone-error" className="text-sm text-destructive" role="alert">
                              {generalErrors.phone}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="general-subject" className="text-foreground">Subject *</Label>
                          <Input
                            id="general-subject"
                            value={generalForm.subject}
                            onChange={(e) => handleGeneralFieldChange("subject", e.target.value)}
                            required
                            className={`bg-background border-border text-foreground ${generalErrors.subject ? "border-destructive" : ""}`}
                            aria-invalid={!!generalErrors.subject}
                            aria-describedby={generalErrors.subject ? "general-subject-error" : undefined}
                          />
                          {generalErrors.subject && (
                            <p id="general-subject-error" className="text-sm text-destructive" role="alert">
                              {generalErrors.subject}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="general-message" className="text-foreground">Message *</Label>
                          <Textarea
                            id="general-message"
                            value={generalForm.message}
                            onChange={(e) => handleGeneralFieldChange("message", e.target.value)}
                            required
                            rows={6}
                            className={`bg-background border-border text-foreground ${generalErrors.message ? "border-destructive" : ""}`}
                            aria-invalid={!!generalErrors.message}
                            aria-describedby={generalErrors.message ? "general-message-error" : undefined}
                          />
                          {generalErrors.message && (
                            <p id="general-message-error" className="text-sm text-destructive" role="alert">
                              {generalErrors.message}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            {generalForm.message.length}/2000 characters
                          </p>
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
                      {volunteerSuccess && (
                        <div
                          className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
                          role="status"
                        >
                          Thanks for volunteering! We've received your application and will follow up soon.
                        </div>
                      )}
                      <form onSubmit={handleVolunteerSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="volunteer-name" className="text-foreground">Name *</Label>
                            <Input
                              id="volunteer-name"
                              value={volunteerForm.name}
                              onChange={(e) => handleVolunteerFieldChange("name", e.target.value)}
                              required
                              className={`bg-background border-border text-foreground ${volunteerErrors.name ? "border-destructive" : ""}`}
                              aria-invalid={!!volunteerErrors.name}
                              aria-describedby={volunteerErrors.name ? "volunteer-name-error" : undefined}
                            />
                            {volunteerErrors.name && (
                              <p id="volunteer-name-error" className="text-sm text-destructive" role="alert">
                                {volunteerErrors.name}
                              </p>
                            )}
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="volunteer-email" className="text-foreground">Email *</Label>
                            <Input
                              id="volunteer-email"
                              type="email"
                              value={volunteerForm.email}
                              onChange={(e) => handleVolunteerFieldChange("email", e.target.value)}
                              required
                              className={`bg-background border-border text-foreground ${volunteerErrors.email ? "border-destructive" : ""}`}
                              aria-invalid={!!volunteerErrors.email}
                              aria-describedby={volunteerErrors.email ? "volunteer-email-error" : undefined}
                            />
                            {volunteerErrors.email && (
                              <p id="volunteer-email-error" className="text-sm text-destructive" role="alert">
                                {volunteerErrors.email}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="volunteer-phone" className="text-foreground">Phone *</Label>
                          <Input
                            id="volunteer-phone"
                            type="tel"
                            value={volunteerForm.phone}
                            onChange={(e) => handleVolunteerFieldChange("phone", e.target.value)}
                            required
                            className={`bg-background border-border text-foreground ${volunteerErrors.phone ? "border-destructive" : ""}`}
                            aria-invalid={!!volunteerErrors.phone}
                            aria-describedby={volunteerErrors.phone ? "volunteer-phone-error" : undefined}
                          />
                          {volunteerErrors.phone && (
                            <p id="volunteer-phone-error" className="text-sm text-destructive" role="alert">
                              {volunteerErrors.phone}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="volunteer-message" className="text-foreground">
                            Tell us about your experience and why you'd like to volunteer *
                          </Label>
                          <Textarea
                            id="volunteer-message"
                            value={volunteerForm.message}
                            onChange={(e) => handleVolunteerFieldChange("message", e.target.value)}
                            required
                            rows={6}
                            placeholder="Please include your sports experience, coaching background (if any), and availability..."
                            className={`bg-background border-border text-foreground ${volunteerErrors.message ? "border-destructive" : ""}`}
                            aria-invalid={!!volunteerErrors.message}
                            aria-describedby={volunteerErrors.message ? "volunteer-message-error" : undefined}
                          />
                          {volunteerErrors.message && (
                            <p id="volunteer-message-error" className="text-sm text-destructive" role="alert">
                              {volunteerErrors.message}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            {volunteerForm.message.length}/2000 characters
                          </p>
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
