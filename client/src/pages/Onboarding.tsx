import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Loader2, ChevronRight, CheckCircle2, Trophy, Target, Calendar, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useState } from "react";
import { useLocation } from "wouter";

const SPORTS = [
  { value: "basketball", label: "Basketball" },
  { value: "football", label: "Football" },
  { value: "flag_football", label: "Flag Football" },
  { value: "soccer", label: "Soccer" },
  { value: "multi_sport", label: "Multi-Sport" },
  { value: "saq", label: "Speed, Agility & Quickness" },
];

const GOALS = [
  "Improve athletic performance",
  "Build confidence and discipline",
  "Prepare for school tryouts",
  "Stay active and healthy",
  "Develop sport-specific skills",
  "Join a competitive program",
];

const ROLES = [
  { value: "athlete", label: "I'm the athlete", icon: Trophy },
  { value: "parent", label: "I'm a parent", icon: User },
];

type Step = "role" | "sport" | "goals" | "complete";

export default function Onboarding() {
  const { user, isAuthenticated, loading } = useAuth({ redirectOnUnauthenticated: true });
  const [, setLocation] = useLocation();
  const [currentStep, setCurrentStep] = useState<Step>("role");
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [selectedSport, setSelectedSport] = useState<string>("");
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);

  const updateProfile = trpc.onboarding.updateProfile.useMutation();
  const completeStepMutation = trpc.onboarding.completeStep.useMutation();
  const completeMutation = trpc.onboarding.complete.useMutation({
    onSuccess: () => {
      toast.success("Welcome to The Academy!");
      setLocation("/member");
    },
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const steps: { key: Step; label: string; icon: any }[] = [
    { key: "role", label: "Who are you?", icon: User },
    { key: "sport", label: "Select sport", icon: Trophy },
    { key: "goals", label: "Set goals", icon: Target },
    { key: "complete", label: "All set!", icon: CheckCircle2 },
  ];

  const currentIndex = steps.findIndex(s => s.key === currentStep);

  const handleNext = async () => {
    if (currentStep === "role") {
      await updateProfile.mutateAsync({ extendedRole: selectedRole as "parent" | "athlete" });
      await completeStepMutation.mutateAsync({ step: "select_sport" });
      setCurrentStep("sport");
    } else if (currentStep === "sport") {
      await updateProfile.mutateAsync({ sport: selectedSport });
      await completeStepMutation.mutateAsync({ step: "set_goals" });
      setCurrentStep("goals");
    } else if (currentStep === "goals") {
      await updateProfile.mutateAsync({ goals: selectedGoals.join(", ") });
      setCurrentStep("complete");
    } else if (currentStep === "complete") {
      await completeMutation.mutateAsync();
    }
  };

  const canProceed = () => {
    if (currentStep === "role") return !!selectedRole;
    if (currentStep === "sport") return !!selectedSport;
    if (currentStep === "goals") return selectedGoals.length > 0;
    return true;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Progress bar */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {steps.map((step, i) => (
            <div key={step.key} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  i <= currentIndex
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {i < currentIndex ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
              </div>
              {i < steps.length - 1 && (
                <div className={`w-12 h-0.5 mx-1 ${i < currentIndex ? "bg-primary" : "bg-muted"}`} />
              )}
            </div>
          ))}
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">
              {currentStep === "role" && "Welcome to The Academy!"}
              {currentStep === "sport" && "What sport are you training for?"}
              {currentStep === "goals" && "What are your goals?"}
              {currentStep === "complete" && "You're all set!"}
            </CardTitle>
            <CardDescription>
              {currentStep === "role" && "Let's personalize your experience. Tell us about yourself."}
              {currentStep === "sport" && "We'll tailor your dashboard and recommendations."}
              {currentStep === "goals" && "Select all that apply — we'll help you get there."}
              {currentStep === "complete" && "Your personalized Academy experience is ready."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {currentStep === "role" && (
              <div className="grid gap-3">
                {ROLES.map((role) => (
                  <button
                    key={role.value}
                    onClick={() => setSelectedRole(role.value)}
                    className={`flex items-center gap-4 p-4 rounded-lg border-2 transition-all text-left ${
                      selectedRole === role.value
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <role.icon className={`h-6 w-6 ${selectedRole === role.value ? "text-primary" : "text-muted-foreground"}`} />
                    <span className="font-medium">{role.label}</span>
                  </button>
                ))}
              </div>
            )}

            {currentStep === "sport" && (
              <div className="grid grid-cols-2 gap-3">
                {SPORTS.map((sport) => (
                  <button
                    key={sport.value}
                    onClick={() => setSelectedSport(sport.value)}
                    className={`p-4 rounded-lg border-2 transition-all text-center ${
                      selectedSport === sport.value
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <span className="font-medium text-sm">{sport.label}</span>
                  </button>
                ))}
              </div>
            )}

            {currentStep === "goals" && (
              <div className="grid gap-2">
                {GOALS.map((goal) => (
                  <button
                    key={goal}
                    onClick={() => {
                      setSelectedGoals(prev =>
                        prev.includes(goal)
                          ? prev.filter(g => g !== goal)
                          : [...prev, goal]
                      );
                    }}
                    className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all text-left ${
                      selectedGoals.includes(goal)
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <CheckCircle2
                      className={`h-5 w-5 flex-shrink-0 ${
                        selectedGoals.includes(goal) ? "text-primary" : "text-muted-foreground"
                      }`}
                    />
                    <span className="text-sm">{goal}</span>
                  </button>
                ))}
              </div>
            )}

            {currentStep === "complete" && (
              <div className="text-center py-6">
                <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Your profile is set up. Head to your dashboard to explore programs, view your schedule, and connect with coaches.
                </p>
              </div>
            )}

            <div className="flex justify-between mt-6">
              {currentIndex > 0 && currentStep !== "complete" ? (
                <Button
                  variant="ghost"
                  onClick={() => setCurrentStep(steps[currentIndex - 1].key)}
                >
                  Back
                </Button>
              ) : (
                <div />
              )}
              <Button
                onClick={handleNext}
                disabled={!canProceed() || updateProfile.isPending || completeMutation.isPending}
              >
                {completeMutation.isPending || updateProfile.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                {currentStep === "complete" ? "Go to Dashboard" : "Continue"}
                {currentStep !== "complete" && <ChevronRight className="h-4 w-4 ml-1" />}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Skip option */}
        {currentStep !== "complete" && (
          <div className="text-center mt-4">
            <button
              onClick={() => completeMutation.mutate()}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Skip for now
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
