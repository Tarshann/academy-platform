import { motion } from "framer-motion";
import { CheckCircle, Package } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function ShopOrderSuccess() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-neutral-100 flex items-center justify-center px-6">
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
            <Link href="/member">
              <Button
                size="lg"
                className="w-full sm:w-auto bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-black font-bold"
              >
                View My Orders
              </Button>
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
