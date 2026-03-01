import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch, Redirect } from "wouter";
import { lazy, Suspense } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { SEO } from "./components/SEO";
import { SkipToContent } from "./components/SkipToContent";

// Code splitting with lazy loading
// Public pages live on academytn.com (academy-marketing). This app is the
// authenticated member portal at app.academytn.com.
const SignInPage = lazy(() => import("./pages/SignIn").then(m => ({ default: m.default })));
const SignUpPage = lazy(() => import("./pages/SignUpPage"));
const SignUp = lazy(() => import("./pages/SignUp"));
const MemberDashboard = lazy(() => import("./pages/MemberDashboard"));
const PaymentSuccess = lazy(() => import("./pages/PaymentSuccess"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const CoachDashboard = lazy(() => import("./pages/CoachDashboard").then(m => ({ default: m.CoachDashboard })));
const Chat = lazy(() => import("./pages/Chat"));
const Shop = lazy(() => import("./pages/Shop"));
const ShopOrderSuccess = lazy(() => import("./pages/ShopOrderSuccess"));
const Settings = lazy(() => import("./pages/Settings"));
const Schedule = lazy(() => import("./pages/Schedule"));
const PrivateSessionBooking = lazy(() => import("./pages/PrivateSessionBooking"));
const Programs = lazy(() => import("./pages/Programs"));
const SkillsLabPage = lazy(() => import("./pages/SkillsLabPage"));
const SkillsLabRegisterPage = lazy(() => import("./pages/SkillsLabRegisterPage"));
const PerformanceLabPage = lazy(() => import("./pages/PerformanceLabPage"));
const PerformanceLabApplyPage = lazy(() => import("./pages/PerformanceLabApplyPage"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const Videos = lazy(() => import("./pages/Videos"));
const Gallery = lazy(() => import("./pages/Gallery"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const FAQs = lazy(() => import("./pages/FAQs"));
const Home = lazy(() => import("./pages/Home"));
const Orders = lazy(() => import("./pages/Orders"));
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
        {/* Root redirects to member dashboard (auth wall handles unauthenticated users) */}
        <Route path={"/"}>
          <Redirect to="/member" />
        </Route>
        <Route path={"/sign-in/:rest*"}>
          <SEO title="Sign In" description="Sign in to your Academy account." />
          <SignInPage />
        </Route>
        <Route path={"/sign-in"}>
          <SEO title="Sign In" description="Sign in to your Academy account." />
          <SignInPage />
        </Route>
        <Route path={"/sign-up/:rest*"}>
          <SEO title="Sign Up" description="Create your Academy account." />
          <SignUpPage />
        </Route>
        <Route path={"/sign-up"}>
          <SEO title="Sign Up" description="Create your Academy account." />
          <SignUp />
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
          <SEO title="Schedule" description="Your training schedule." />
          <Schedule />
        </Route>
        <Route path={"/private-session-booking"}>
          <SEO title="Book Private Session" description="Book a private training session with Coach Mac or Coach O." />
          <PrivateSessionBooking />
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
        <Route path={"/settings"}>
          <SEO title="Settings" description="Manage your notification preferences and account settings." />
          <Settings />
        </Route>
        <Route path={"/programs"}>
          <SEO title="Programs" description="Explore Academy athletic development programs." />
          <Programs />
        </Route>
        <Route path={"/skills-lab/register"}>
          <SEO title="Skills Lab Registration" description="Register for an Academy Skills Lab drop-in session." />
          <SkillsLabRegisterPage />
        </Route>
        <Route path={"/skills-lab"}>
          <SEO title="Skills Lab" description="Academy Skills Lab — community drop-in sessions for fundamentals, movement, and positive competition." />
          <SkillsLabPage />
        </Route>
        <Route path={"/performance-lab/apply"}>
          <SEO title="Apply for Performance Lab" description="Apply for the Academy Performance Lab training program." />
          <PerformanceLabApplyPage />
        </Route>
        <Route path={"/performance-lab"}>
          <SEO title="Performance Lab" description="Academy Performance Lab — structured development for committed young athletes." />
          <PerformanceLabPage />
        </Route>
        <Route path={"/blog/:slug"}>
          {(params) => (
            <>
              <SEO title="Blog Post" description="Read the latest from The Academy." />
              <BlogPost params={params as { slug: string }} />
            </>
          )}
        </Route>
        <Route path={"/blog"}>
          <SEO title="Blog" description="News, training tips, and athlete spotlights from The Academy." />
          <Blog />
        </Route>
        <Route path={"/videos"}>
          <SEO title="Videos" description="Training videos and highlights from The Academy." />
          <Videos />
        </Route>
        <Route path={"/gallery"}>
          <SEO title="Gallery" description="Photos from The Academy training sessions and events." />
          <Gallery />
        </Route>
        <Route path={"/about"}>
          <SEO title="About" description="Learn about The Academy and our coaching team." />
          <About />
        </Route>
        <Route path={"/contact"}>
          <SEO title="Contact" description="Get in touch with The Academy." />
          <Contact />
        </Route>
        <Route path={"/faqs"}>
          <SEO title="FAQs" description="Frequently asked questions about The Academy programs." />
          <FAQs />
        </Route>
        <Route path={"/home"}>
          <SEO title="Home" description="Welcome to The Academy member portal." />
          <Home />
        </Route>
        <Route path={"/orders"}>
          <SEO title="Orders" description="View your purchase history and order details." />
          <Orders />
        </Route>
        {/* Catch Clerk UserProfile navigation — redirect to dashboard */}
        <Route path={"/user-profile/:rest*"}>
          <Redirect to="/member" />
        </Route>
        <Route path={"/user-profile"}>
          <Redirect to="/member" />
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
