import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch, Redirect } from "wouter";
import { lazy, Suspense } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { SEO } from "./components/SEO";
import { SkipToContent } from "./components/SkipToContent";

// Code splitting with lazy loading
const Home = lazy(() => import("./pages/Home"));
const Programs = lazy(() => import("./pages/Programs"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const FAQs = lazy(() => import("./pages/FAQs"));
const SignupRedirect = () => <Redirect to="/programs" />;
const SignInPage = lazy(() => import("./pages/SignIn").then(m => ({ default: m.default })));
const SignUpPage = lazy(() => import("./pages/SignUpPage").then(m => ({ default: m.default })));
const MemberDashboard = lazy(() => import("./pages/MemberDashboard"));
const PaymentSuccess = lazy(() => import("./pages/PaymentSuccess"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const CoachDashboard = lazy(() => import("./pages/CoachDashboard").then(m => ({ default: m.CoachDashboard })));
const Gallery = lazy(() => import("./pages/Gallery"));
const Chat = lazy(() => import("./pages/Chat"));
const Shop = lazy(() => import("./pages/Shop"));
const ShopOrderSuccess = lazy(() => import("./pages/ShopOrderSuccess"));
const Videos = lazy(() => import("./pages/Videos"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const Settings = lazy(() => import("./pages/Settings"));
const Schedule = lazy(() => import("./pages/Schedule"));
const PrivateSessionBooking = lazy(() => import("./pages/PrivateSessionBooking"));
const PerformanceLabPage = lazy(() => import("./pages/PerformanceLabPage"));
const PerformanceLabApplyPage = lazy(() => import("./pages/PerformanceLabApplyPage"));
const SkillsLabPage = lazy(() => import("./pages/SkillsLabPage"));
const SkillsLabRegisterPage = lazy(() => import("./pages/SkillsLabRegisterPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
  </div>
);

function Router() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        <Route path={"/"}>
          <SEO title="Youth Athletic Training in Gallatin, TN" description="The Academy offers elite youth multi-sport training in Gallatin, Tennessee. Basketball, flag football, and soccer development with SAQ, strength, and skill training for ages 8–14." />
          <Home />
        </Route>
        <Route path={"/programs"}>
          <SEO title="Programs" description="Youth athletic training programs in Gallatin, TN. Performance Lab ($280/mo, ages 8–14), Skills Lab ($10/session, all ages), and Private Training. SAQ, strength, and sport-specific development." />
          <Programs />
        </Route>
        <Route path={"/about"}>
          <SEO title="About Us" description="Meet Coach Mac and Coach O at The Academy in Gallatin, TN. Our coaching philosophy develops confident, skilled, and resilient young athletes through multi-sport training." />
          <About />
        </Route>
        <Route path={"/contact"}>
          <SEO title="Contact Us" description="Contact The Academy in Gallatin, TN. Questions about youth athletic training programs? Call (571) 292-0633 or email us." />
          <Contact />
        </Route>
        <Route path={"/faqs"}>
          <SEO title="FAQs" description="Frequently asked questions about The Academy's youth training programs in Gallatin, TN. Registration, pricing, schedules, and what to expect." />
          <FAQs />
        </Route>
        <Route path={"/signup"}>
          <SignupRedirect />
        </Route>
        <Route path={"/register"}>
          <SignupRedirect />
        </Route>
        <Route path={"/sign-in"}>
          <SEO title="Sign In" description="Sign in to your Academy account." />
          <SignInPage />
        </Route>
        <Route path={"/sign-up"}>
          <SEO title="Sign Up" description="Create your Academy account." />
          <SignUpPage />
        </Route>
        <Route path={"/member"}>
          <SEO title="Member Dashboard" description="Access your member dashboard with schedules, announcements, and more." />
          <MemberDashboard />
        </Route>
        <Route path={"/payment/success"}>
          <SEO title="Payment Successful" description="Your payment has been processed successfully." />
          <PaymentSuccess />
        </Route>
        <Route path={"/admin"}>
          <SEO title="Admin Dashboard" description="Admin dashboard for managing programs, schedules, and announcements." />
          <AdminDashboard />
        </Route>
        <Route path={"/coach-dashboard"}>
          <SEO title="Coach Dashboard" description="Manage private session booking requests." />
          <CoachDashboard />
        </Route>
        <Route path={"/schedule"}>
          <SEO title="Schedule" description="Weekly training schedule for The Academy in Gallatin, TN. Skills Lab Tue/Thu 6:00–6:50 PM. Performance Lab Tue/Thu 7:00–8:00 PM, Sun 11 AM–12 PM." />
          <Schedule />
        </Route>
        <Route path={"/private-session-booking"}>
          <SEO title="Book Private Session" description="Book a private training session with Coach Mac or Coach O." />
          <PrivateSessionBooking />
        </Route>
        <Route path={"/gallery"}>
          <SEO title="Gallery" description="Photos from The Academy's youth training sessions, events, and activities in Gallatin, TN." />
          <Gallery />
        </Route>
        <Route path={"/chat"}>
          <SEO title="Chat" description="Connect with The Academy community through real-time chat." />
          <Chat />
        </Route>
        <Route path={"/shop"}>
          <SEO title="Shop" description="Official Academy merchandise and equipment." />
          <Shop />
        </Route>
        <Route path={"/shop/order-success"}>
          <SEO title="Order Successful" description="Your order has been placed successfully." />
          <ShopOrderSuccess />
        </Route>
        <Route path={"/videos"}>
          <SEO title="Videos" description="Watch training videos and highlights from The Academy." />
          <Videos />
        </Route>
        <Route path={"/blog"}>
          <Blog />
        </Route>
        <Route path={"/blog/:slug"}>
          {(params) => <BlogPost params={params} />}
        </Route>
        <Route path={"/performance-lab"}>
          <SEO title="Performance Lab — Youth Athletic Training" description="Academy Performance Lab in Gallatin, TN. Year-round structured training for athletes ages 8–14. Three sessions per week, capped at 6–8 per group. $280/month." />
          <PerformanceLabPage />
        </Route>
        <Route path={"/performance-lab/apply"}>
          <SEO title="Apply — Performance Lab" description="Apply for the Academy Performance Lab in Gallatin, TN. Structured year-round multi-sport training for athletes ages 8–14." />
          <PerformanceLabApplyPage />
        </Route>
        <Route path={"/skills-lab"}>
          <SEO title="Skills Lab — Drop-In Youth Training" description="Academy Skills Lab in Gallatin, TN. Drop-in sessions for fundamentals, movement, and competitive games. All ages welcome. $10 per session, Tue/Thu 6:00–6:50 PM." />
          <SkillsLabPage />
        </Route>
        <Route path={"/skills-lab/register"}>
          <SEO title="Register — Skills Lab" description="Register for an Academy Skills Lab session in Gallatin, TN. Tuesday and Thursday 6:00–6:50 PM, $10 per session." />
          <SkillsLabRegisterPage />
        </Route>
        <Route path={"/settings"}>
          <SEO title="Settings" description="Manage your notification preferences and account settings." />
          <Settings />
        </Route>
        <Route path={"/404"}>
          <SEO title="Page Not Found" description="The page you're looking for doesn't exist." />
          <NotFound />
        </Route>
        <Route>
          <SEO title="Page Not Found" description="The page you're looking for doesn't exist." />
          <NotFound />
        </Route>
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <SkipToContent />
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
