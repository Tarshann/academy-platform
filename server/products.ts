/**
 * Stripe Product and Price Configuration
 * 
 * This file defines all Academy programs available for purchase through Stripe.
 * Products are organized by category: memberships, individual sessions, and special programs.
 */

export interface StripeProduct {
  id: string;
  name: string;
  description: string;
  priceInCents: number;
  currency: string;
  type: 'one_time' | 'recurring';
  interval?: 'month' | 'year';
  category: 'membership' | 'individual' | 'group' | 'camp' | 'league';
}

export const ACADEMY_PRODUCTS: Record<string, StripeProduct> = {
  // Memberships (Recurring)
  'academy-group-membership': {
    id: 'academy-group-membership',
    name: 'Academy Group Membership',
    description: 'Unlimited access to group sessions throughout the month. Perfect for dedicated players.',
    priceInCents: 15000, // $150.00
    currency: 'usd',
    type: 'recurring',
    interval: 'month',
    category: 'membership',
  },
  'complete-player-membership': {
    id: 'complete-player-membership',
    name: 'Complete Player Membership',
    description: 'Unlimited access to skills classes and open gyms. The most comprehensive option.',
    priceInCents: 10000, // $100.00
    currency: 'usd',
    type: 'recurring',
    interval: 'month',
    category: 'membership',
  },

  // Individual Sessions (One-time)
  'group-workout': {
    id: 'group-workout',
    name: 'Group Workout Session',
    description: 'Single session access to group workouts. Limited to 8 players.',
    priceInCents: 2500, // $25.00
    currency: 'usd',
    type: 'one_time',
    category: 'group',
  },
  'individual-training': {
    id: 'individual-training',
    name: 'Individual Training Session',
    description: 'One-on-one personalized basketball training focused on your unique strengths.',
    priceInCents: 6000, // $60.00
    currency: 'usd',
    type: 'one_time',
    category: 'individual',
  },
  'skills-class': {
    id: 'skills-class',
    name: 'Skills Class',
    description: 'Focused skill development covering ball handling, shooting, footwork, and defense.',
    priceInCents: 1500, // $15.00
    currency: 'usd',
    type: 'one_time',
    category: 'group',
  },

  // Special Programs
  'on-field-workouts': {
    id: 'on-field-workouts',
    name: 'On Field Workouts',
    description: 'Outdoor conditioning and agility training to complement basketball skills.',
    priceInCents: 3000, // $30.00
    currency: 'usd',
    type: 'one_time',
    category: 'group',
  },
  'summer-camp': {
    id: 'summer-camp',
    name: 'Academy Summer Camp (Per Day)',
    description: 'Intensive summer training with full-day sessions, skill work, and competition.',
    priceInCents: 2000,
    currency: 'usd',
    type: 'one_time',
    category: 'camp',
  },
  'summer-basketball-camp': {
    id: 'summer-basketball-camp',
    name: 'Summer Basketball Camp',
    description: 'Intensive multi-day basketball camp with skill development, competition, and team building. Includes $20 registration fee.',
    priceInCents: 18500,
    currency: 'usd',
    type: 'one_time',
    category: 'camp',
  },
  'team-academy': {
    id: 'team-academy',
    name: 'Team Academy Registration',
    description: 'Join our competitive travel teams. Includes uniforms, coaching, and tournament fees.',
    priceInCents: 30000, // $300.00
    currency: 'usd',
    type: 'one_time',
    category: 'league',
  },
};

/**
 * Get product by ID
 */
export function getProduct(productId: string): StripeProduct | undefined {
  return ACADEMY_PRODUCTS[productId];
}

/**
 * Get all products
 */
export function getAllProducts(): StripeProduct[] {
  return Object.values(ACADEMY_PRODUCTS);
}

/**
 * Get products by category
 */
export function getProductsByCategory(category: StripeProduct['category']): StripeProduct[] {
  return Object.values(ACADEMY_PRODUCTS).filter(p => p.category === category);
}
