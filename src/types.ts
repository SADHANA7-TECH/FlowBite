export type UserRole = 'customer' | 'kitchen' | 'staff' | 'manager';

export interface Tenant {
  id: string;
  name: string;
  code: string;
  type: string;
  address: string;
  activeTablesCount: number;
  openHours: string;
}

export interface Ingredient {
  id: string;
  name: string;
  currentStock: number;
  unit: string;
  minThreshold: number;
  consumptionRate: number; // e.g., units consumed per hour (e.g. 2.5)
  costPerUnit: number;
  supplier: string;
  lastRestocked: string;
  category: 'Produce' | 'Protein' | 'Dairy' | 'Pantry' | 'Beverage';
  status?: 'optimal' | 'warning' | 'critical';
}

export interface MenuItemRecipeItem {
  ingredientId: string;
  quantityNeeded: number; // in ingredient units
}

export interface MenuItem {
  id: string;
  name: string;
  category: 'Appetizers' | 'Mains' | 'Desserts' | 'Drinks' | 'Sides';
  price: number;
  description: string;
  imageUrl: string;
  prepStation: 'Grill' | 'Sauté' | 'Fry' | 'Pantry/Cold' | 'Bar' | 'Bakery';
  prepTimeMinutes: number;
  recipe: MenuItemRecipeItem[];
  isAvailable: boolean; // "86" toggle
  isPopular?: boolean;
  dietaryTags?: string[];
}

export type OrderStatus = 'placed' | 'accepted' | 'preparing' | 'cooking' | 'ready' | 'served' | 'completed' | 'cancelled';

export interface OrderItem {
  id: string;
  menuItemId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  specialInstructions?: string;
  prepStation: 'Grill' | 'Sauté' | 'Fry' | 'Pantry/Cold' | 'Bar' | 'Bakery';
  status: OrderStatus;
  startedAt?: string;
  completedAt?: string;
}

export interface Order {
  id: string;
  tenantId: string;
  orderNumber: string;
  type: 'dine-in' | 'pickup' | 'qr-table';
  tableNumber?: number;
  customerName: string;
  customerPhone?: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  createdAt: string;
  estimatedPrepTimeMinutes: number;
  notes?: string;
  paymentStatus: 'paid' | 'pending';
  ingredientsDeducted?: boolean;
}

export type TableStatus = 'available' | 'seated' | 'ordered' | 'food_ready' | 'payment_due' | 'cleaning';

export interface DiningTable {
  id: string;
  tableNumber: number;
  capacity: number;
  zone: 'Main Dining' | 'Patio' | 'Bar Area' | 'Private Room';
  status: TableStatus;
  currentOrderId?: string;
  seatedAt?: string;
  assignedStaff?: string;
  guestCount?: number;
}

export interface QueueEntry {
  id: string;
  customerName: string;
  phone: string;
  partySize: number;
  joinedAt: string;
  estimatedWaitMinutes: number;
  status: 'waiting' | 'notified' | 'seated' | 'cancelled';
  seatingPreference?: 'Indoor' | 'Patio' | 'First Available';
}

export interface AIInsight {
  id: string;
  type: 'bottleneck' | 'inventory_alert' | 'demand_forecast' | 'staffing_advice';
  severity: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  recommendedAction: string;
  impactMetric?: string;
  timestamp: string;
}

export interface DemandForecastData {
  peakHours: string;
  expectedOrdersNextHour: number;
  topRiskDishes: string[];
  stationBottleneck: string;
  coversForecast: number;
  revenueProjection: number;
}

export interface InventoryPredictionData {
  ingredientId: string;
  ingredientName: string;
  currentStock: number;
  unit: string;
  consumptionRate: number;
  hoursRemaining: number;
  predictedDepletionTime: string;
  affectedDishes: string[];
  riskLevel: 'high' | 'medium' | 'low';
}

export interface SmartRecommendation {
  id: string;
  title: string;
  category: 'kitchen' | 'inventory' | 'front_of_house' | 'staffing';
  description: string;
  actionText: string;
  actionType: 'restock_ingredient' | 'toggle_menu_86' | 'rebalance_station' | 'notify_waitlist';
  targetId?: string;
  targetValue?: number;
  impact: string;
}

export interface StructuredCopilotInsight {
  insight: string;
  reason: string;
  risk: 'HIGH' | 'MEDIUM' | 'LOW';
  recommendedAction: string;
  category?: 'inventory' | 'kitchen' | 'queue' | 'menu';
}

export interface WhatIfResult {
  scenarioPrompt: string;
  queueImpact: string;
  waitTimeMinutes: number;
  kitchenWorkload: { station: string; expectedTickets: number; status: 'Normal' | 'Overloaded' | 'Critical' }[];
  inventoryImpact: { ingredientName: string; projectedDeficit: string; willRunOut: boolean }[];
  potentialUnavailableItems: string[];
  recommendedActions: string[];
}

export interface CopilotResponse {
  query: string;
  answer: string;
  structuredInsights: StructuredCopilotInsight[];
  demandForecast: DemandForecastData;
  inventoryPredictions: InventoryPredictionData[];
  smartRecommendations: SmartRecommendation[];
  insights: AIInsight[];
  generatedAt: string;
}

export interface AiSuggestionItem {
  id: string;
  name: string;
  price: number;
  category: string;
  reason: string;
  pairingNote?: string;
  isAvailable?: boolean;
}

export interface AiSuggestionsResponse {
  chefRecommendation: string;
  suggestedItems: AiSuggestionItem[];
}

export interface AnalyticsSummary {
  dailyRevenue: number;
  totalOrdersToday: number;
  avgPrepTimeMinutes: number;
  tableOccupancyRate: number;
  activeQueueCount: number;
  lowStockItemsCount: number;
  hourlyOrders: { hour: string; orderCount: number; revenue: number }[];
  stationWorkload: { station: string; activeTickets: number; avgTimeSec: number }[];
}

export interface StaffShift {
  id: string;
  staffName: string;
  role: 'Head Chef' | 'Line Cook' | 'Sous Chef' | 'Waitstaff' | 'Bartender' | 'Host' | 'Dishwasher';
  station: 'Grill' | 'Sauté' | 'Fry' | 'Pantry/Cold' | 'Bar' | 'Main Dining' | 'Patio' | 'Front Desk';
  date: string;
  startTime: string;
  endTime: string;
  status: 'scheduled' | 'confirmed' | 'active' | 'completed' | 'cancelled';
  notes?: string;
}

export interface RBACPermission {
  role: UserRole;
  canManageMenu: boolean;
  canManageInventory: boolean;
  canViewKDS: boolean;
  canUpdateKDS: boolean;
  canManageTables: boolean;
  canManageQueue: boolean;
  canViewAnalytics: boolean;
  canRunAIPredictor: boolean;
  canPlaceCustomerOrders: boolean;
}
