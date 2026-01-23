import { motion } from "framer-motion";
import { Minus, Plus, ShoppingCart, Trash2, X } from "lucide-react";
import { Link } from "wouter";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface CartItem {
  productId: number;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
}

const CART_STORAGE_KEY = "academy-shop-cart";

export default function Shop() {
  const { user, isAuthenticated } = useAuth();
  // Load cart from localStorage on mount
  const [cart, setCart] = useState<CartItem[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [shippingAddress, setShippingAddress] = useState("");

  // Persist cart to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    }
  }, [cart]);

  const { data: products = [], isLoading } = trpc.shop.products.useQuery();
  const { data: campaigns = [] } = trpc.shop.campaigns.useQuery();
  const checkoutMutation = trpc.shop.createCheckout.useMutation({
    onSuccess: (data) => {
      if (data.url) {
        window.open(data.url, "_blank");
        toast.success("Redirecting to checkout...");
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
              price: typeof product.price === 'string' ? parseFloat(product.price) : product.price,
              quantity: 1,
              imageUrl: product.imageUrl,
            },
          ];
      // Persist to localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(newCart));
      }
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
      // Persist to localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(newCart));
      }
      return newCart;
    });
  };

  const removeFromCart = (productId: number) => {
    setCart((prev) => {
      const newCart = prev.filter((item) => item.productId !== productId);
      // Persist to localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(newCart));
      }
      return newCart;
    });
    toast.success("Item removed from cart");
  };

  const cartTotal = cart.reduce((sum, item) => {
    const price = typeof item.price === 'string' ? parseFloat(item.price) : (item.price / 100);
    return sum + price * item.quantity;
  }, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleCheckout = () => {
    if (!isAuthenticated) {
      toast.error("Please log in to checkout");
      window.location.href = getLoginUrl();
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

    checkoutMutation.mutate({
      items: cart.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      })),
      shippingAddress,
    });
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
      {campaigns.length > 0 && (
        <section className="py-12 bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border-y border-amber-500/20">
          <div className="container px-6">
            {campaigns.map((campaign) => (
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
            <div className="text-center text-neutral-600">Loading products...</div>
          ) : products.length === 0 ? (
            <div className="text-center py-20">
              <div className="max-w-md mx-auto">
                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-neutral-100 flex items-center justify-center">
                  <ShoppingCart className="w-12 h-12 text-neutral-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-neutral-900">No products available yet</h3>
                <p className="text-neutral-500 mb-6">
                  We're working on adding Academy merchandise. Check back soon for official gear and equipment!
                </p>
                <Link href="/programs">
                  <Button variant="outline">Explore Programs</Button>
                </Link>
              </div>
            </div>
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {products.map((product) => (
                <motion.div key={product.id} variants={itemVariants}>
                  <Card className="group overflow-hidden hover:shadow-2xl transition-all duration-300 hover:scale-105 border-neutral-200">
                    <div className="aspect-square bg-gradient-to-br from-neutral-100 to-neutral-200 relative overflow-hidden">
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingCart size={64} className="text-neutral-400" />
                        </div>
                      )}
                      {product.stock <= 5 && product.stock > 0 && (
                        <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                          Only {product.stock} left!
                        </div>
                      )}
                      {product.stock === 0 && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <span className="text-white text-2xl font-bold">Out of Stock</span>
                        </div>
                      )}
                    </div>
                    <CardContent className="p-6">
                      <h3 className="text-xl font-bold text-neutral-900 mb-2">{product.name}</h3>
                      <p className="text-neutral-600 mb-4 line-clamp-2">{product.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-black text-amber-600">
                          ${typeof product.price === 'string' ? parseFloat(product.price).toFixed(2) : (product.price / 100).toFixed(2)}
                        </span>
                        <Button
                          onClick={() => addToCart(product)}
                          disabled={product.stock === 0}
                          className="bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-black font-bold"
                        >
                          Add to Cart
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
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
                      <p className="text-amber-600 font-semibold">${typeof item.price === 'string' ? parseFloat(item.price).toFixed(2) : (item.price / 100).toFixed(2)}</p>
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
              </div>

              {/* Total */}
              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-xl font-bold">Total:</span>
                  <span className="text-3xl font-black text-amber-600">
                    ${(cartTotal / 100).toFixed(2)}
                  </span>
                </div>
                <Button
                  size="lg"
                  className="w-full bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-black font-bold text-lg"
                  onClick={handleCheckout}
                  disabled={checkoutMutation.isPending}
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
