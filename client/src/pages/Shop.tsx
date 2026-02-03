import { motion } from "framer-motion";
import { Minus, Plus, ShoppingCart, Trash2, X } from "lucide-react";
import { Link } from "wouter";
import { useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useAuth } from "@/_core/hooks/useAuth";
import { CART_STORAGE_KEY, SHOP_SHIPPING_STORAGE_KEY, getLoginUrl } from "@/const";
import { useLocalStorageState } from "@/hooks/useLocalStorageState";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { formatUsd, normalizeAmount } from "@shared/money";
import { ShopProductCard } from "@/components/shop/ShopProductCard";
import { ShopProductCardSkeleton } from "@/components/skeletons/ShopProductCardSkeleton";
import { Breadcrumbs } from "@/components/Breadcrumbs";

interface CartItem {
  productId: number;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
}

export default function Shop() {
  const { isAuthenticated } = useAuth();
  const [cart, setCart] = useLocalStorageState<CartItem[]>(CART_STORAGE_KEY, []);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [shippingAddress, setShippingAddress] = useLocalStorageState(
    SHOP_SHIPPING_STORAGE_KEY,
    ""
  );

  const { data: products = [], isLoading } = trpc.shop.products.useQuery();
  const { data: campaigns = [] } = trpc.shop.campaigns.useQuery();
  const isVisibleEntry = (entry: { name?: string | null; description?: string | null }) =>
    !String(entry.name || "").toLowerCase().includes("test") &&
    !String(entry.description || "").toLowerCase().includes("test");
  const visibleProducts = useMemo(
    () => products.filter((product: any) => isVisibleEntry(product)),
    [products]
  );
  const visibleCampaigns = useMemo(
    () => campaigns.filter((campaign: any) => isVisibleEntry(campaign)),
    [campaigns]
  );
  const checkoutMutation = trpc.shop.createCheckout.useMutation({
    onSuccess: (data) => {
      if (data.url) {
        toast.success("Redirecting to checkout...");
        window.location.assign(data.url);
      }
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create checkout session");
    },
  });

  const addToCart = (product: any) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.productId === product.id);
      const newCart = existing
        ? prev.map((item) =>
            item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item
          )
        : [
            ...prev,
            {
              productId: product.id,
              name: product.name,
              price: normalizeAmount(product.price),
              quantity: 1,
              imageUrl: product.imageUrl,
            },
          ];
      return newCart;
    });
    toast.success(`${product.name} added to cart`);
  };

  const updateQuantity = (productId: number, delta: number) => {
    setCart((prev) => {
      const newCart = prev
        .map((item) =>
          item.productId === productId ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item
        )
        .filter((item) => item.quantity > 0);
      return newCart;
    });
  };

  const removeFromCart = (productId: number) => {
    setCart((prev) => {
      const newCart = prev.filter((item) => item.productId !== productId);
      return newCart;
    });
    toast.success("Item removed from cart");
  };

  const cartTotal = useMemo(
    () => cart.reduce((sum, item) => sum + normalizeAmount(item.price) * item.quantity, 0),
    [cart]
  );
  const cartCount = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);
  const checkoutFingerprint = useMemo(
    () =>
      JSON.stringify({
        cart: cart.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
        shippingAddress: shippingAddress.trim(),
      }),
    [cart, shippingAddress]
  );
  const checkoutKeyRef = useRef<{ fingerprint: string; key: string } | null>(null);
  const isCheckoutDisabled =
    checkoutMutation.isPending || cart.length === 0 || !shippingAddress.trim();

  const handleCheckout = () => {
    if (!isAuthenticated) {
      toast.error("Please log in to checkout");
      const loginUrl = getLoginUrl();
      if (loginUrl === "#") {
        toast.error("Authentication is not configured. Please set Clerk or OAuth credentials.");
        return;
      }
      window.location.href = loginUrl;
      return;
    }

    if (cart.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    if (!shippingAddress.trim()) {
      toast.error("Please enter a shipping address");
      return;
    }

    if (!checkoutKeyRef.current || checkoutKeyRef.current.fingerprint !== checkoutFingerprint) {
      checkoutKeyRef.current = {
        fingerprint: checkoutFingerprint,
        key: crypto.randomUUID(),
      };
    }

    checkoutMutation.mutate({
      items: cart.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      })),
      shippingAddress,
      idempotencyKey: checkoutKeyRef.current.key,
    });
  };

  const handleClearCart = () => {
    setCart([]);
    toast.success("Cart cleared");
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring" as const,
        stiffness: 100,
      },
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-neutral-100">
      <Navigation />
      <main id="main-content">
      <div className="container px-6 pt-6">
        <Breadcrumbs items={[{ label: "Shop" }]} />
      </div>
      {/* Header */}
      <section className="bg-gradient-to-br from-neutral-900 via-neutral-800 to-black py-20">
        <div className="container px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="text-5xl md:text-6xl font-black mb-6">
              <span className="bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-transparent">
                Academy Shop
              </span>
            </h1>
            <p className="text-xl text-neutral-300 max-w-2xl mx-auto">
              Represent The Academy with official gear and merchandise
            </p>
          </motion.div>

          {/* Cart Button */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex justify-center mt-8"
          >
            <Button
              size="lg"
              onClick={() => setIsCartOpen(true)}
              className="bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-black font-bold relative"
            >
              <ShoppingCart className="mr-2" size={20} />
              Cart
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold">
                  {cartCount}
                </span>
              )}
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Active Campaigns */}
      {visibleCampaigns.length > 0 && (
        <section className="py-12 bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border-y border-amber-500/20">
          <div className="container px-6">
            {visibleCampaigns.map((campaign: any) => (
              <motion.div
                key={campaign.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center"
              >
                <h2 className="text-3xl font-bold text-neutral-900 mb-2">{campaign.name}</h2>
                <p className="text-neutral-700">{campaign.description}</p>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Products Grid */}
      <section className="py-20">
        <div className="container px-6">
          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <ShopProductCardSkeleton />
              <ShopProductCardSkeleton />
              <ShopProductCardSkeleton />
            </div>
          ) : visibleProducts.length === 0 ? (
            <div className="text-center py-20">
              <div className="max-w-md mx-auto">
                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-neutral-100 flex items-center justify-center">
                  <ShoppingCart className="w-12 h-12 text-neutral-400" />
                </div>
                <p className="text-sm font-medium text-primary/80 uppercase tracking-wide mb-2">Coming Soon</p>
                <h3 className="text-xl font-semibold mb-2 text-neutral-900">Academy Merch</h3>
                <p className="text-neutral-500 mb-6">
                  Official Academy apparel and training gear launching soon. Sign up for training to be the first to know when merch drops.
                </p>
                <Link href="/signup">
                  <Button variant="outline">Register for Training</Button>
                </Link>
              </div>
            </div>
          ): (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {visibleProducts.map((product: any) => (
                <motion.div key={product.id} variants={itemVariants}>
                  <ShopProductCard product={product} onAddToCart={addToCart} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </section>

      {/* Cart Dialog */}
      <Dialog open={isCartOpen} onOpenChange={setIsCartOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center justify-between">
              <span>Shopping Cart</span>
              <Button variant="ghost" size="icon" onClick={() => setIsCartOpen(false)}>
                <X size={24} />
              </Button>
            </DialogTitle>
          </DialogHeader>

          {cart.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart size={64} className="mx-auto text-neutral-400 mb-4" />
              <p className="text-xl text-neutral-600">Your cart is empty</p>
              <Button
                variant="outline"
                className="mt-6"
                onClick={() => setIsCartOpen(false)}
              >
                Continue Shopping
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Cart Items */}
              <div className="space-y-4">
                {cart.map((item) => (
                  <div key={item.productId} className="flex gap-4 p-4 bg-neutral-50 rounded-lg">
                    <div className="w-20 h-20 bg-neutral-200 rounded flex-shrink-0">
                      {item.imageUrl ? (
                        <img 
                          src={item.imageUrl} 
                          alt={item.name || "Cart item"} 
                          loading="lazy"
                          className="w-full h-full object-cover rounded" 
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingCart size={32} className="text-neutral-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-neutral-900">{item.name}</h4>
                      <p className="text-amber-600 font-semibold">
                        {formatUsd(item.price)}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateQuantity(item.productId, -1)}
                        >
                          <Minus size={16} />
                        </Button>
                        <span className="font-semibold w-8 text-center">{item.quantity}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateQuantity(item.productId, 1)}
                        >
                          <Plus size={16} />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeFromCart(item.productId)}
                          className="ml-auto text-red-500 hover:text-red-700"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Shipping Address */}
              <div className="space-y-2">
                <Label htmlFor="shipping">Shipping Address</Label>
                <Textarea
                  id="shipping"
                  placeholder="Enter your full shipping address..."
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  rows={3}
                />
                <p className="text-sm text-neutral-500">
                  Shipping address is required for checkout.
                </p>
              </div>

              {/* Total */}
              <div className="border-t pt-4">
                <div className="flex justify-end mb-4">
                  <Button variant="outline" onClick={handleClearCart}>
                    Clear Cart
                  </Button>
                </div>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-xl font-bold">Total:</span>
                  <span className="text-3xl font-black text-amber-600">
                    {formatUsd(cartTotal)}
                  </span>
                </div>
                <Button
                  size="lg"
                  className="w-full bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-black font-bold text-lg"
                  onClick={handleCheckout}
                  disabled={isCheckoutDisabled}
                >
                  {checkoutMutation.isPending ? "Processing..." : "Proceed to Checkout"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      </main>
      <Footer />
    </div>
  );
}
