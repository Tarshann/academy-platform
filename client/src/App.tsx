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
const SignUpPage = lazy(() => import("./pages/SignUpPage").then(m => ({ default: m.default })));
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
