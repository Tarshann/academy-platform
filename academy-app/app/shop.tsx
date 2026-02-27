import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as WebBrowser from 'expo-web-browser';
import { trpc } from '../lib/trpc';
import { trackEvent } from '../lib/analytics';

const ACADEMY_GOLD = '#CFB87C';
const NAVY = '#1a1a2e';

function formatPrice(price: string | number): string {
  const num = typeof price === 'string' ? parseFloat(price) : price;
  if (isNaN(num)) return '$0.00';
  return `$${num % 1 === 0 ? num.toFixed(0) : num.toFixed(2)}`;
}

function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    apparel: 'Apparel',
    accessories: 'Accessories',
    equipment: 'Equipment',
    drinkware: 'Drinkware',
    other: 'Other',
  };
  return labels[category] || category;
}

function ShopSkeleton() {
  return (
    <View style={styles.content}>
      {[1, 2, 3, 4].map((i) => (
        <View key={i} style={styles.productCard}>
          <View style={[styles.skeletonBlock, styles.productImageSkeleton]} />
          <View style={styles.productInfo}>
            <View style={[styles.skeletonBlock, { width: '70%', height: 16, marginBottom: 6 }]} />
            <View style={[styles.skeletonBlock, { width: '100%', height: 12, marginBottom: 4 }]} />
            <View style={[styles.skeletonBlock, { width: '40%', height: 12, marginBottom: 10 }]} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={[styles.skeletonBlock, { width: 50, height: 20 }]} />
              <View style={[styles.skeletonBlock, { width: 80, height: 36, borderRadius: 8 }]} />
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

export default function ShopScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState<number | null>(null);
  const tracked = useRef(false);

  const products = trpc.shop.products.useQuery({ limit: 50, offset: 0 });
  const createCheckout = trpc.shop.createCheckout.useMutation();

  useEffect(() => {
    if (!tracked.current) {
      trackEvent('shop_viewed');
      tracked.current = true;
    }
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await products.refetch();
    setRefreshing(false);
  };

  const onBuy = async (product: NonNullable<typeof products.data>[number]) => {
    if (checkoutLoading) return;

    trackEvent('shop_checkout_started', {
      product_id: product.id,
      product_name: product.name,
      price: product.price,
    });

    setCheckoutLoading(product.id);
    try {
      const result = await createCheckout.mutateAsync({
        items: [{ productId: product.id, quantity: 1 }],
        shippingAddress: '',
      });

      if (result.url) {
        const browserResult = await WebBrowser.openBrowserAsync(result.url, {
          dismissButtonStyle: 'cancel',
          presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
        });

        if (browserResult.type === 'cancel') {
          trackEvent('shop_checkout_cancelled', {
            product_id: product.id,
            product_name: product.name,
          });
        } else {
          trackEvent('shop_checkout_completed', {
            product_id: product.id,
            product_name: product.name,
          });
          products.refetch();
        }
      }
    } catch (error: any) {
      trackEvent('shop_checkout_failed', {
        product_id: product.id,
        product_name: product.name,
        error_type: error?.message || 'Unknown error',
      });
      Alert.alert(
        'Checkout Error',
        'Unable to start checkout. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setCheckoutLoading(null);
    }
  };

  if (products.isLoading) {
    return (
      <>
        <Stack.Screen
          options={{
            title: 'Shop',
            headerStyle: { backgroundColor: NAVY },
            headerTintColor: '#fff',
            headerBackTitle: 'Back',
          }}
        />
        <View style={styles.list}>
          <ShopSkeleton />
        </View>
      </>
    );
  }

  if (products.isError) {
    return (
      <>
        <Stack.Screen
          options={{
            title: 'Shop',
            headerStyle: { backgroundColor: NAVY },
            headerTintColor: '#fff',
            headerBackTitle: 'Back',
          }}
        />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#e74c3c" />
          <Text style={styles.errorTitle}>Could not load products</Text>
          <Text style={styles.errorSubtitle}>Check your connection and try again</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => products.refetch()}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </>
    );
  }

  // Filter to active products with stock
  const activeProducts = (products.data ?? []).filter(
    (p) => p.isActive && (p.stock === null || p.stock > 0)
  );

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Shop',
          headerStyle: { backgroundColor: NAVY },
          headerTintColor: '#fff',
          headerBackTitle: 'Back',
        }}
      />
      <FlatList
        style={styles.list}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        data={activeProducts}
        keyExtractor={(item) => String(item.id)}
        ListEmptyComponent={
          <View style={styles.emptyWrapper}>
            <Ionicons name="bag-outline" size={48} color="#ccc" />
            <Text style={styles.emptyTitle}>No products available</Text>
            <Text style={styles.emptySubtitle}>Check back soon for new merchandise</Text>
          </View>
        }
        renderItem={({ item }) => {
          const isLoadingThis = checkoutLoading === item.id;
          const outOfStock = item.stock !== null && item.stock <= 0;

          return (
            <TouchableOpacity
              style={styles.productCard}
              activeOpacity={0.8}
              onPress={() => {
                trackEvent('shop_product_viewed', {
                  product_id: item.id,
                  product_name: item.name,
                });
              }}
            >
              {item.imageUrl ? (
                <Image
                  source={{ uri: item.imageUrl }}
                  style={styles.productImage}
                  contentFit="cover"
                  transition={200}
                />
              ) : (
                <View style={[styles.productImage, styles.productImagePlaceholder]}>
                  <Ionicons name="image-outline" size={32} color="#ccc" />
                </View>
              )}

              <View style={styles.productInfo}>
                <View style={styles.productHeader}>
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryText}>
                      {getCategoryLabel(item.category)}
                    </Text>
                  </View>
                  {item.stock !== null && item.stock <= 5 && item.stock > 0 && (
                    <Text style={styles.lowStock}>Only {item.stock} left</Text>
                  )}
                </View>

                <Text style={styles.productName} numberOfLines={1}>
                  {item.name}
                </Text>
                {item.description && (
                  <Text style={styles.productDescription} numberOfLines={2}>
                    {item.description}
                  </Text>
                )}

                <View style={styles.priceRow}>
                  <Text style={styles.productPrice}>{formatPrice(item.price)}</Text>
                  <TouchableOpacity
                    style={[
                      styles.buyBtn,
                      (isLoadingThis || outOfStock) && styles.buyBtnDisabled,
                    ]}
                    onPress={() => onBuy(item)}
                    disabled={isLoadingThis || outOfStock}
                    activeOpacity={0.7}
                  >
                    {isLoadingThis ? (
                      <ActivityIndicator size="small" color={NAVY} />
                    ) : outOfStock ? (
                      <Text style={styles.buyBtnText}>Sold Out</Text>
                    ) : (
                      <>
                        <Text style={styles.buyBtnText}>Buy</Text>
                        <Ionicons name="arrow-forward" size={14} color={NAVY} />
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  // Skeleton
  skeletonBlock: {
    backgroundColor: '#e8e8e8',
    borderRadius: 6,
  },
  productImageSkeleton: {
    width: '100%',
    height: 160,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  // Error
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 32,
    gap: 8,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: NAVY,
    marginTop: 8,
  },
  errorSubtitle: {
    fontSize: 14,
    color: '#888',
    marginBottom: 8,
  },
  retryBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: ACADEMY_GOLD,
    minHeight: 44,
    justifyContent: 'center',
  },
  retryText: {
    fontSize: 15,
    fontWeight: '600',
    color: NAVY,
  },
  // Empty
  emptyWrapper: {
    padding: 60,
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: NAVY,
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#888',
  },
  // Product card
  productCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: 160,
  },
  productImagePlaceholder: {
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  productInfo: {
    padding: 16,
  },
  productHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  categoryBadge: {
    backgroundColor: NAVY,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  categoryText: {
    color: ACADEMY_GOLD,
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  lowStock: {
    fontSize: 11,
    color: '#e74c3c',
    fontWeight: '500',
  },
  productName: {
    fontSize: 17,
    fontWeight: '700',
    color: NAVY,
    marginBottom: 4,
  },
  productDescription: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
    marginBottom: 12,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  productPrice: {
    fontSize: 20,
    fontWeight: '700',
    color: NAVY,
  },
  buyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ACADEMY_GOLD,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 6,
    minHeight: 44,
    minWidth: 80,
    justifyContent: 'center',
  },
  buyBtnDisabled: {
    opacity: 0.5,
  },
  buyBtnText: {
    color: NAVY,
    fontSize: 14,
    fontWeight: '600',
  },
});
