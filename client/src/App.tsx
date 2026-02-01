import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
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
const SignUp = lazy(() => import("./pages/SignUp"));
const RegisterRedirect = lazy(() => import("./pages/RegisterRedirect"));
const SignInPage = lazy(() => import("./pages/SignIn").then(m => ({ default: m.default })));
const SignUpPage = lazy(() => import("./pages/SignUpPage").then(m => ({ default: m.default })));
const MemberDashboard = lazy(() => import("./pages/MemberDashboard"));
const PaymentSuccess = lazy(() => import("./pages/PaymentSuccess"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const Gallery = lazy(() => import("./pages/Gallery"));
const Chat = lazy(() => import("./pages/Chat"));
const Shop = lazy(() => import("./pages/Shop"));
const ShopOrderSuccess = lazy(() => import("./pages/ShopOrderSuccess"));
const Videos = lazy(() => import("./pages/Videos"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const Settings = lazy(() => import("./pages/Settings"));
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
          <SEO title="Home" description="Elite youth multi-sport training for basketball, football, and soccer athletes." />
          <Home />
        </Route>
        <Route path={"/programs"}>
          <SEO title="Programs" description="Comprehensive athletic development programs for basketball, football, and soccer athletes. SAQ training, strength conditioning, and sport-specific skill development." />
          <Programs />
        </Route>
        <Route path={"/about"}>
          <SEO title="About Us" description="Learn about The Academy's coaching philosophy, values, and commitment to developing confident, skilled, and resilient young athletes." />
          <About />
        </Route>
        <Route path={"/contact"}>
          <SEO title="Contact Us" description="Have questions? Want to volunteer? Contact The Academy. We'd love to hear from you." />
          <Contact />
        </Route>
        <Route path={"/faqs"}>
          <SEO title="FAQs" description="Frequently asked questions about The Academy's programs, registration, and training approach." />
          <FAQs />
        </Route>
        <Route path={"/signup"}>
          <SEO title="Sign Up" description="Register for The Academy's multi-sport training programs." />
          <SignUp />
        </Route>
        <Route path={"/register"}>
          <RegisterRedirect />
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
        <Route path={"/gallery"}>
          <SEO title="Gallery" description="View photos from The Academy's training sessions, events, and activities." />
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
