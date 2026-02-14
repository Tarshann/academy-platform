import { motion } from "framer-motion";
import { CheckCircle, Package } from "lucide-react";
import { Link } from "wouter";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { CART_STORAGE_KEY, getClerkPublishableKey, getLoginUrl } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";

export default function ShopOrderSuccess() {
  const { isAuthenticated } = useAuth();
  const clerkPublishableKey = getClerkPublishableKey();
  const loginUrl = getLoginUrl();
  const ordersRedirectPath = "/orders";
  const signInRedirectUrl = loginUrl.startsWith("/sign-in")
    ? `/sign-in?redirect=${encodeURIComponent(ordersRedirectPath)}`
    : loginUrl;

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(CART_STORAGE_KEY);
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-neutral-50 to-neutral-100">
      <Navigation />
      <main id="main-content" className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="container max-w-2xl">
          <Breadcrumbs items={[
            { label: "Shop", href: "/shop" },
            { label: "Order Success" }
          ]} />
        </div>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl w-full"
      >
        <div className="bg-white rounded-2xl shadow-2xl p-12 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          >
            <CheckCircle className="w-24 h-24 text-green-500 mx-auto mb-6" />
          </motion.div>

          <h1 className="text-4xl font-black text-neutral-900 mb-4">
            Order Confirmed!
          </h1>

          <p className="text-xl text-neutral-600 mb-8">
            Thank you for your purchase! Your order has been successfully placed.
          </p>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 mb-8">
            <Package className="w-12 h-12 text-amber-600 mx-auto mb-3" />
            <p className="text-neutral-700">
              You'll receive a confirmation email with your order details and tracking information shortly.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/shop">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto"
              >
                Continue Shopping
              </Button>
            </Link>
            {isAuthenticated ? (
              <Link href={ordersRedirectPath}>
                <Button
                  size="lg"
                  className="w-full sm:w-auto bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-black font-bold"
                >
                  View My Orders
                </Button>
              </Link>
            ) : clerkPublishableKey ? (
              <Link href={signInRedirectUrl}>
                <Button
                  size="lg"
                  className="w-full sm:w-auto bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-black font-bold"
                >
                  Sign In to View Orders
                </Button>
              </Link>
            ) : (
              <a href={signInRedirectUrl}>
                <Button
                  size="lg"
                  disabled={loginUrl === "#"}
                  className="w-full sm:w-auto bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-black font-bold"
                >
                  Sign In to View Orders
                </Button>
              </a>
            )}
          </div>
        </div>
      </motion.div>
      </main>
      <Footer />
    </div>
  );
}
