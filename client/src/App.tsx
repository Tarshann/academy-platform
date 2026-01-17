import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Programs from "./pages/Programs";
import About from "./pages/About";
import Contact from "./pages/Contact";
import FAQs from "./pages/FAQs";
import SignUp from "./pages/SignUp";
import MemberDashboard from "./pages/MemberDashboard";
import PaymentSuccess from "./pages/PaymentSuccess";
import AdminDashboard from "./pages/AdminDashboard";
import Gallery from "./pages/Gallery";
import Chat from "./pages/Chat";
import Shop from "./pages/Shop";
import ShopOrderSuccess from "./pages/ShopOrderSuccess";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/programs"} component={Programs} />
      <Route path={"/about"} component={About} />
      <Route path={"/contact"} component={Contact} />
      <Route path={"/faqs"} component={FAQs} />
      <Route path={"/signup"} component={SignUp} />
      <Route path={"/member"} component={MemberDashboard} />
      <Route path={"/payment/success"} component={PaymentSuccess} />
      <Route path={"/admin"} component={AdminDashboard} />
      <Route path={"/gallery"} component={Gallery} />
      <Route path={"/chat"} component={Chat} />
      <Route path={"/shop"} component={Shop} />
      <Route path={"/shop/order-success"} component={ShopOrderSuccess} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
