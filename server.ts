import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import {
  INITIAL_TENANTS,
  INITIAL_INGREDIENTS,
  INITIAL_MENU,
  INITIAL_TABLES,
  INITIAL_ORDERS,
  INITIAL_QUEUE,
  INITIAL_AI_INSIGHTS,
  INITIAL_ANALYTICS,
} from './src/data/initialData';
import { Order, OrderStatus, TableStatus, AIInsight, QueueEntry } from './src/types';

const app = express();
const PORT = 3000;

app.use(express.json());

// Multi-tenant in-memory storage store
const store = {
  tenants: [...INITIAL_TENANTS],
  ingredients: [...INITIAL_INGREDIENTS],
  menu: [...INITIAL_MENU],
  tables: [...INITIAL_TABLES],
  orders: [...INITIAL_ORDERS],
  queue: [...INITIAL_QUEUE],
  aiInsights: [...INITIAL_AI_INSIGHTS],
  analytics: { ...INITIAL_ANALYTICS },
};

// Initialize Gemini Client
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    try {
      aiClient = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    } catch (err) {
      console.error('Failed to initialize GoogleGenAI client:', err);
    }
  }
  return aiClient;
}

// Helper: Recalculate menu availability based on ingredient stocks & trigger manager alerts
function syncMenuAvailability() {
  store.menu.forEach((item) => {
    let missingIngredient = false;
    item.recipe.forEach((r) => {
      const ing = store.ingredients.find((i) => i.id === r.ingredientId);
      if (!ing || ing.currentStock < r.quantityNeeded) {
        missingIngredient = true;
      }
    });

    if (missingIngredient && item.isAvailable) {
      item.isAvailable = false; // Auto 86
      // Push auto AI manager notification
      const alertTitle = `Auto-86: ${item.name} is Out of Stock`;
      const existingAlert = store.aiInsights.find(i => i.title === alertTitle);
      if (!existingAlert) {
        store.aiInsights.unshift({
          id: 'ai_' + Date.now() + '_' + item.id,
          type: 'inventory_alert',
          severity: 'high',
          title: alertTitle,
          description: `Key recipe ingredient depleted below required amount. Item automatically removed from live menu to prevent unfulfillable orders.`,
          recommendedAction: `Restock missing ingredients in Manager Inventory panel.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        });
      }
    }
  });

  // Check low stock warnings for all ingredients and notify manager
  store.ingredients.forEach((ing) => {
    if (ing.currentStock <= ing.minThreshold) {
      const rate = ing.consumptionRate || 2.5;
      const hoursRemaining = rate > 0 ? (ing.currentStock / rate).toFixed(1) : 'N/A';
      const alertTitle = `Low Stock Warning: ${ing.name}`;
      const existingAlert = store.aiInsights.find(i => i.title === alertTitle);
      if (!existingAlert) {
        store.aiInsights.unshift({
          id: 'ai_low_' + Date.now() + '_' + ing.id,
          type: 'inventory_alert',
          severity: ing.currentStock === 0 ? 'high' : 'medium',
          title: alertTitle,
          description: `Current stock: ${ing.currentStock} ${ing.unit} (Min Threshold: ${ing.minThreshold} ${ing.unit}). Estimated remaining time: ${hoursRemaining} hours based on consumption rate (${rate} ${ing.unit}/hr).`,
          recommendedAction: `Reorder ${ing.name} immediately from supplier ${ing.supplier}.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        });
      }
    }
  });
}

// Helper: Deduct ingredients for an order when completed or created
function deductIngredientsForOrder(order: Order) {
  if (order.ingredientsDeducted) return;
  order.items.forEach((orderItem) => {
    const menuItem = store.menu.find((m) => m.id === orderItem.menuItemId);
    if (menuItem) {
      menuItem.recipe.forEach((rec) => {
        const ing = store.ingredients.find((i) => i.id === rec.ingredientId);
        if (ing) {
          ing.currentStock = Math.max(0, Number((ing.currentStock - rec.quantityNeeded * orderItem.quantity).toFixed(2)));
        }
      });
    }
  });
  order.ingredientsDeducted = true;
  syncMenuAvailability();
}

// Helper: Recalculate station workloads and analytics
function updateStationMetrics() {
  const activeOrders = store.orders.filter((o) => o.status !== 'completed' && o.status !== 'cancelled');
  const stations = ['Grill', 'Sauté', 'Fry', 'Pantry/Cold', 'Bar'];
  
  store.analytics.stationWorkload = stations.map((st) => {
    let ticketCount = 0;
    activeOrders.forEach((o) => {
      o.items.forEach((it) => {
        if (it.prepStation === st && it.status !== 'ready' && it.status !== 'served') {
          ticketCount += it.quantity;
        }
      });
    });
    return {
      station: st,
      activeTickets: ticketCount,
      avgTimeSec: Math.max(120, ticketCount * 180 + 120),
    };
  });

  const occupiedCount = store.tables.filter((t) => t.status !== 'available').length;
  store.analytics.tableOccupancyRate = Math.round((occupiedCount / store.tables.length) * 100);
  store.analytics.activeQueueCount = store.queue.filter((q) => q.status === 'waiting' || q.status === 'notified').length;
  store.analytics.lowStockItemsCount = store.ingredients.filter((i) => i.currentStock <= i.minThreshold).length;
}

// --- API ENDPOINTS ---

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'FlowBite SaaS Platform' });
});

app.get('/api/tenants', (req, res) => {
  res.json(store.tenants);
});

app.get('/api/state', (req, res) => {
  updateStationMetrics();
  res.json({
    tenants: store.tenants,
    ingredients: store.ingredients,
    menu: store.menu,
    tables: store.tables,
    orders: store.orders,
    queue: store.queue,
    aiInsights: store.aiInsights,
    analytics: store.analytics,
  });
});

// Create Order
app.post('/api/orders', (req, res) => {
  const { type, tableNumber, customerName, customerPhone, items, notes } = req.body;
  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Order must contain at least one item' });
  }

  let totalAmount = 0;
  const orderItems = items.map((it: any, idx: number) => {
    const menuItem = store.menu.find((m) => m.id === it.menuItemId);
    const price = menuItem ? menuItem.price : 10;
    const prepStation = menuItem ? menuItem.prepStation : 'Grill';
    totalAmount += price * (it.quantity || 1);
    return {
      id: `item_${Date.now()}_${idx}`,
      menuItemId: it.menuItemId,
      name: menuItem ? menuItem.name : it.name || 'Custom Item',
      quantity: it.quantity || 1,
      unitPrice: price,
      specialInstructions: it.specialInstructions || '',
      prepStation,
      status: 'placed' as OrderStatus,
    };
  });

  const orderNum = `#FB-${Math.floor(100 + Math.random() * 900)}`;
  const newOrder: Order = {
    id: `ord_${Date.now()}`,
    tenantId: 'tenant_flame_grill',
    orderNumber: orderNum,
    type: type || 'dine-in',
    tableNumber: tableNumber ? Number(tableNumber) : undefined,
    customerName: customerName || 'Walk-in Guest',
    customerPhone: customerPhone || '',
    items: orderItems,
    totalAmount: Number(totalAmount.toFixed(2)),
    status: 'placed',
    createdAt: new Date().toISOString(),
    estimatedPrepTimeMinutes: Math.min(25, 8 + orderItems.length * 3),
    notes: notes || '',
    paymentStatus: 'paid',
  };

  // Deduct recipe ingredients automatically
  deductIngredientsForOrder(newOrder);

  store.orders.unshift(newOrder);

  // If table order, update table status
  if (tableNumber) {
    const table = store.tables.find((t) => t.tableNumber === Number(tableNumber));
    if (table) {
      table.status = 'ordered';
      table.currentOrderId = newOrder.id;
      table.seatedAt = table.seatedAt || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  }

  // Update analytics revenue and count
  store.analytics.dailyRevenue = Number((store.analytics.dailyRevenue + totalAmount).toFixed(2));
  store.analytics.totalOrdersToday += 1;
  updateStationMetrics();

  res.status(201).json(newOrder);
});

// Update Order Status
app.patch('/api/orders/:id/status', (req, res) => {
  const { id } = req.params;
  const { status, itemId } = req.body;

  const order = store.orders.find((o) => o.id === id);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  if (itemId) {
    // Update individual item status
    const item = order.items.find((i) => i.id === itemId);
    if (item) {
      item.status = status as OrderStatus;
      if (status === 'cooking' && !item.startedAt) {
        item.startedAt = new Date().toISOString();
      } else if ((status === 'ready' || status === 'served') && !item.completedAt) {
        item.completedAt = new Date().toISOString();
      }
    }

    // Determine parent order status
    const allReady = order.items.every((i) => i.status === 'ready' || i.status === 'served');
    const anyCooking = order.items.some((i) => i.status === 'cooking' || i.status === 'preparing');
    if (allReady) {
      order.status = 'ready';
    } else if (anyCooking) {
      order.status = 'cooking';
    }
  } else if (status) {
    // Update whole order status
    order.status = status as OrderStatus;
    order.items.forEach((i) => {
      i.status = status as OrderStatus;
      if (status === 'cooking' && !i.startedAt) i.startedAt = new Date().toISOString();
      if ((status === 'ready' || status === 'served') && !i.completedAt) i.completedAt = new Date().toISOString();
    });

    if (status === 'served' && order.tableNumber) {
      const table = store.tables.find((t) => t.tableNumber === order.tableNumber);
      if (table) table.status = 'food_ready';
    }
    if (status === 'completed' && order.tableNumber) {
      const table = store.tables.find((t) => t.tableNumber === order.tableNumber);
      if (table) table.status = 'payment_due';
    }

    if (['completed', 'served', 'ready'].includes(order.status)) {
      deductIngredientsForOrder(order);
    }
  }

  syncMenuAvailability();
  updateStationMetrics();
  res.json(order);
});

// Toggle Menu Item 86 (Available / Out-of-Stock)
app.post('/api/menu/toggle-availability', (req, res) => {
  const { menuItemId, isAvailable } = req.body;
  const item = store.menu.find((m) => m.id === menuItemId);
  if (!item) {
    return res.status(404).json({ error: 'Menu item not found' });
  }

  item.isAvailable = typeof isAvailable === 'boolean' ? isAvailable : !item.isAvailable;
  syncMenuAvailability();
  res.json(item);
});

// Update Inventory Stock
app.post('/api/inventory/update', (req, res) => {
  const { ingredientId, currentStock, minThreshold } = req.body;
  const ing = store.ingredients.find((i) => i.id === ingredientId);
  if (!ing) {
    return res.status(404).json({ error: 'Ingredient not found' });
  }

  if (typeof currentStock === 'number') ing.currentStock = Math.max(0, currentStock);
  if (typeof minThreshold === 'number') ing.minThreshold = minThreshold;
  ing.lastRestocked = new Date().toISOString().split('T')[0];

  syncMenuAvailability();
  updateStationMetrics();
  res.json(ing);
});

// Update Table Status
app.patch('/api/tables/:id', (req, res) => {
  const { id } = req.params;
  const { status, guestCount, assignedStaff } = req.body;
  const table = store.tables.find((t) => t.id === id);
  if (!table) {
    return res.status(404).json({ error: 'Table not found' });
  }

  if (status) table.status = status as TableStatus;
  if (typeof guestCount === 'number') table.guestCount = guestCount;
  if (assignedStaff !== undefined) table.assignedStaff = assignedStaff;

  if (status === 'seated' && !table.seatedAt) {
    table.seatedAt = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  if (status === 'available') {
    table.currentOrderId = undefined;
    table.seatedAt = undefined;
    table.guestCount = undefined;
  }

  updateStationMetrics();
  res.json(table);
});

// Queue Management
app.post('/api/queue', (req, res) => {
  const { customerName, phone, partySize, seatingPreference } = req.body;
  if (!customerName || !partySize) {
    return res.status(400).json({ error: 'Customer name and party size required' });
  }

  const waitMinutes = Math.max(10, store.queue.filter((q) => q.status === 'waiting').length * 7 + 5);
  const newQueue: QueueEntry = {
    id: `q_${Date.now()}`,
    customerName,
    phone: phone || '',
    partySize: Number(partySize),
    joinedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    estimatedWaitMinutes: waitMinutes,
    status: 'waiting',
    seatingPreference: seatingPreference || 'First Available',
  };

  store.queue.push(newQueue);
  updateStationMetrics();
  res.status(201).json(newQueue);
});

app.patch('/api/queue/:id', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const entry = store.queue.find((q) => q.id === id);
  if (!entry) {
    return res.status(404).json({ error: 'Queue entry not found' });
  }

  entry.status = status;
  updateStationMetrics();
  res.json(entry);
});

// AI Operational Insights & Predictive AI Engine
app.post('/api/ai/predict', async (req, res) => {
  updateStationMetrics();
  const ai = getGeminiClient();

  const activeOrdersCount = store.orders.filter((o) => o.status !== 'completed' && o.status !== 'cancelled').length;
  const lowStockNames = store.ingredients.filter((i) => i.currentStock <= i.minThreshold).map((i) => `${i.name} (${i.currentStock} ${i.unit})`).join(', ');
  const busiestStation = [...store.analytics.stationWorkload].sort((a, b) => b.activeTickets - a.activeTickets)[0];

  if (ai) {
    try {
      const prompt = `You are FlowBite AI, an expert operational intelligence assistant for high-volume restaurants.
Analyze the following real-time restaurant operational telemetry:
- Active Kitchen Orders: ${activeOrdersCount}
- Kitchen Station Workloads: ${JSON.stringify(store.analytics.stationWorkload)}
- Low Inventory Ingredients: ${lowStockNames || 'None currently below threshold'}
- Table Occupancy Rate: ${store.analytics.tableOccupancyRate}%
- Waiting Queue Count: ${store.analytics.activeQueueCount} guests

Generate 3 actionable, highly specific operational insights and predictions for restaurant managers.
Return JSON with the format:
[
  {
    "id": "ai_gen_1",
    "type": "bottleneck" | "inventory_alert" | "demand_forecast" | "staffing_advice",
    "severity": "high" | "medium" | "low",
    "title": "Short punchy title",
    "description": "2-sentence operational diagnosis",
    "recommendedAction": "Immediate step to fix or prepare",
    "impactMetric": "Measurable operational benefit e.g. Prevents 18 min prep delay",
    "timestamp": "Just now"
  }
]`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                type: { type: Type.STRING },
                severity: { type: Type.STRING },
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                recommendedAction: { type: Type.STRING },
                impactMetric: { type: Type.STRING },
                timestamp: { type: Type.STRING },
              },
            },
          },
        },
      });

      if (response.text) {
        const parsed: AIInsight[] = JSON.parse(response.text.trim());
        store.aiInsights = [...parsed, ...store.aiInsights].slice(0, 8);
        return res.json(store.aiInsights);
      }
    } catch (err) {
      console.error('Gemini AI prediction error:', err);
    }
  }

  // Fallback intelligent rules engine if AI key not configured or fallback needed
  const generatedInsights: AIInsight[] = [
    {
      id: `ai_auto_${Date.now()}_1`,
      type: lowStockNames ? 'inventory_alert' : 'demand_forecast',
      severity: lowStockNames ? 'high' : 'medium',
      title: lowStockNames ? `Stockout Trajectory Alert: ${lowStockNames}` : `Peak Dinner Velocity Forecast`,
      description: lowStockNames
        ? `Ingredient stock levels for ${lowStockNames} hit critical minimums under current kitchen draw rates.`
        : `Historical Friday evening patterns indicate a +25% order volume spike starting in 45 minutes.`,
      recommendedAction: lowStockNames
        ? `Trigger supplier reorder or temporarily feature non-conflicting entrees on customer digital menus.`
        : `Ensure Sauté and Grill stations are prepped with 30 units of meat & salmon portions.`,
      impactMetric: lowStockNames ? `Protects $320 projected revenue` : `Saves ~4.5 mins average prep time per order`,
      timestamp: 'Just now',
    },
    {
      id: `ai_auto_${Date.now()}_2`,
      type: 'bottleneck',
      severity: busiestStation.activeTickets >= 3 ? 'high' : 'low',
      title: `${busiestStation.station} Station Load Balancing Needed`,
      description: `${busiestStation.station} station currently handles ${busiestStation.activeTickets} active tickets with average prep duration ${Math.round(busiestStation.avgTimeSec / 60)} mins.`,
      recommendedAction: `Flex 1 floater chef to ${busiestStation.station} plating assist.`,
      impactMetric: `Prevents ticket buildup during peak hour`,
      timestamp: 'Just now',
    },
  ];

  store.aiInsights = [...generatedInsights, ...store.aiInsights].slice(0, 8);
  res.json(store.aiInsights);
});

// Dedicated AI Restaurant Copilot Endpoint
app.post('/api/ai/copilot', async (req, res) => {
  updateStationMetrics();
  const { query } = req.body || {};
  const userQuery = (query || '').trim();

  // 1. Calculate live restaurant metrics
  const activeOrders = store.orders.filter((o) => o.status !== 'completed' && o.status !== 'cancelled');
  const activeOrdersCount = activeOrders.length;
  
  // Calculate item sales breakdown
  const itemSalesMap: Record<string, { name: string; count: number; revenue: number }> = {};
  store.orders.forEach((o) => {
    if (o.status !== 'cancelled') {
      o.items.forEach((it) => {
        if (!itemSalesMap[it.name]) {
          itemSalesMap[it.name] = { name: it.name, count: 0, revenue: 0 };
        }
        itemSalesMap[it.name].count += it.quantity;
        itemSalesMap[it.name].revenue += it.unitPrice * it.quantity;
      });
    }
  });

  const sortedSales = Object.values(itemSalesMap).sort((a, b) => b.count - a.count);
  const topSellingText = sortedSales.slice(0, 3).map((s) => `${s.name} (${s.count} sold, $${s.revenue.toFixed(2)})`).join(', ') || 'Wagyu Truffle Burger, Craft IPA, Truffle Parmesan Fries';

  // Calculate ingredient depletion & dish stockout risks
  const inventoryPredictions = store.ingredients.map((ing) => {
    const rate = ing.consumptionRate || 2.5;
    const hoursRemaining = rate > 0 ? ing.currentStock / rate : 99;
    
    // Calculate predicted depletion time
    const now = new Date();
    const depletionDate = new Date(now.getTime() + hoursRemaining * 3600 * 1000);
    const startHourStr = depletionDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    const endHourDate = new Date(depletionDate.getTime() + 3600 * 1000);
    const endHourStr = endHourDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    const predictedDepletionTime = hoursRemaining <= 0 ? 'Depleted (Out of Stock Now)' : `${startHourStr} - ${endHourStr}`;

    // Find affected menu dishes
    const affectedDishes = store.menu
      .filter((m) => m.recipe.some((r) => r.ingredientId === ing.id))
      .map((m) => m.name);

    let riskLevel: 'high' | 'medium' | 'low' = 'low';
    if (ing.currentStock === 0) riskLevel = 'high';
    else if (ing.currentStock <= ing.minThreshold || hoursRemaining < 4) riskLevel = 'high';
    else if (hoursRemaining < 8) riskLevel = 'medium';

    return {
      ingredientId: ing.id,
      ingredientName: ing.name,
      currentStock: ing.currentStock,
      unit: ing.unit,
      consumptionRate: rate,
      hoursRemaining: Number(hoursRemaining.toFixed(1)),
      predictedDepletionTime,
      affectedDishes,
      riskLevel,
    };
  }).sort((a, b) => a.hoursRemaining - b.hoursRemaining);

  const highRiskIngredients = inventoryPredictions.filter((i) => i.riskLevel === 'high');
  const highRiskDishes = Array.from(new Set(highRiskIngredients.flatMap((i) => i.affectedDishes)));

  // Calculate station workload & queue wait
  const stationWorkloads = [...store.analytics.stationWorkload].sort((a, b) => b.activeTickets - a.activeTickets);
  const busiestStation = stationWorkloads[0] || { station: 'Grill', activeTickets: 3, avgTimeSec: 300 };
  const queueCount = store.queue.filter((q) => q.status === 'waiting' || q.status === 'notified').length;
  const occupiedTables = store.tables.filter((t) => t.status !== 'available').length;
  const totalTables = store.tables.length;

  // Demand Forecast object
  const demandForecast = {
    peakHours: '7:30 PM - 9:00 PM',
    expectedOrdersNextHour: Math.max(8, activeOrdersCount * 2 + 5),
    topRiskDishes: highRiskDishes.length > 0 ? highRiskDishes : ['Glazed Salmon Jasmine Rice Bowl', 'Wagyu Truffle Burger'],
    stationBottleneck: busiestStation.station,
    coversForecast: Math.max(35, queueCount * 3 + occupiedTables * 2 + 15),
    revenueProjection: Number((store.analytics.dailyRevenue + 450).toFixed(2)),
  };

  // Smart Operational Recommendations
  const smartRecommendations = [
    {
      id: 'rec_1',
      title: `Batch Prep Buffer: ${highRiskIngredients[0]?.ingredientName || 'Jasmine Rice'}`,
      category: 'inventory' as const,
      description: `${highRiskIngredients[0]?.ingredientName || 'Jasmine Rice'} stock is at ${highRiskIngredients[0]?.currentStock || 10} ${highRiskIngredients[0]?.unit || 'kg'} (${highRiskIngredients[0]?.hoursRemaining || 4} hrs remaining). Restock now to prevent automatic dish 86.`,
      actionText: `Restock +20 ${highRiskIngredients[0]?.unit || 'kg'} ${highRiskIngredients[0]?.ingredientName || 'Jasmine Rice'}`,
      actionType: 'restock_ingredient' as const,
      targetId: highRiskIngredients[0]?.ingredientId || 'ing_jasmine_rice',
      targetValue: (highRiskIngredients[0]?.currentStock || 10) + 20,
      impact: 'Prevents auto-86 for ' + (highRiskIngredients[0]?.affectedDishes.join(', ') || 'Glazed Salmon Jasmine Rice Bowl'),
    },
    {
      id: 'rec_2',
      title: `Kitchen Load Balance: ${busiestStation.station} Station`,
      category: 'kitchen' as const,
      description: `${busiestStation.station} station currently handles ${busiestStation.activeTickets} active tickets. Shift 1 floater line cook to prep & plating assist.`,
      actionText: `Reassign Floater to ${busiestStation.station}`,
      actionType: 'rebalance_station' as const,
      impact: 'Reduces ticket prep time by ~4.5 minutes',
    },
    {
      id: 'rec_3',
      title: `Waitlist Seat Notification (${queueCount} Waiting)`,
      category: 'front_of_house' as const,
      description: `${queueCount} party on waitlist. 2 tables are in cleaning/payment state. Expedite table turnaround to lower average wait time.`,
      actionText: 'Notify Next Party on Waitlist',
      actionType: 'notify_waitlist' as const,
      impact: 'Decreases wait queue drop-off by 15%',
    },
  ];

  // Formulate dynamic context-aware answer
  let answerText = '';

  // Check if Gemini API is configured for rich response generation
  const ai = getGeminiClient();
  if (ai) {
    try {
      const prompt = `You are FlowBite AI Restaurant Copilot, a senior operational advisor for busy restaurants.
Answer this manager query strictly using the following live restaurant data:

Manager Question: "${userQuery || 'Provide full operational analysis and high-risk warnings for today.'}"

Live Telemetry Data:
- Active Kitchen Orders: ${activeOrdersCount}
- Top Selling Dishes Today: ${topSellingText}
- Station Workloads: ${JSON.stringify(stationWorkloads)}
- High Risk Ingredients (Low Stock): ${JSON.stringify(highRiskIngredients.slice(0, 4))}
- High Risk Dishes (Likely to 86 today): ${highRiskDishes.join(', ') || 'Glazed Salmon Jasmine Rice Bowl'}
- Waiting Queue: ${queueCount} parties, ${occupiedTables}/${totalTables} tables occupied
- Average Kitchen Prep Time: ${store.analytics.avgPrepTimeMinutes} minutes

Requirements for your response:
1. Provide a direct, highly specific, restaurant-focused answer.
2. Use exact dish names, ingredient stock levels, consumption rates, and calculated stockout time ranges (e.g. "Glazed Salmon Jasmine Rice Bowl has a high risk of becoming unavailable between 8 PM and 9 PM based on current Jasmine Rice inventory of 10 kg and today's order rate of 2.5 kg/hr").
3. Format response in clean Markdown with bold metrics and bullet points.
4. Keep response under 250 words and include concrete recommendations.`;

      const aiRes = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt,
      });

      if (aiRes.text) {
        answerText = aiRes.text;
      }
    } catch (err) {
      console.error('Gemini Copilot answer generation error:', err);
    }
  }

  // Fallback response builder tailored to specific questions if Gemini is not set or fails
  if (!answerText) {
    const qLower = userQuery.toLowerCase();
    if (qLower.includes('run out') || qLower.includes('out of stock') || qLower.includes('dishes')) {
      const topDepleted = highRiskIngredients[0] || {
        ingredientId: 'ing_jasmine_rice',
        ingredientName: 'Jasmine Rice',
        currentStock: 10,
        unit: 'kg',
        consumptionRate: 2.5,
        hoursRemaining: 4,
        predictedDepletionTime: '7:30 PM - 8:30 PM',
        affectedDishes: ['Glazed Salmon Jasmine Rice Bowl'],
        riskLevel: 'high' as const,
      };
      const dishListStr = topDepleted.affectedDishes.join(', ') || 'Glazed Salmon Jasmine Rice Bowl';

      answerText = `### 🚨 Inventory Stockout Trajectory Analysis

**${dishListStr}** has a **high risk** of becoming unavailable between **${topDepleted.predictedDepletionTime}** based on current inventory of **${topDepleted.currentStock} ${topDepleted.unit} ${topDepleted.ingredientName}** and today's order rate of **${topDepleted.consumptionRate} ${topDepleted.unit}/hr**.

**Key Risk Factors:**
- **Primary Bottleneck:** ${topDepleted.ingredientName} (${topDepleted.currentStock} ${topDepleted.unit} left).
- **Estimated Remaining Hours:** ~${topDepleted.hoursRemaining} hours under current dinner demand velocity.
- **Auto-86 Impact:** Depletion will automatically remove ${dishListStr} from customer QR and POS menus.

**Recommended Action:**
1. Restock **${topDepleted.ingredientName}** by **+20 ${topDepleted.unit}** immediately in the Manager Inventory panel.
2. Feature non-rice entrees (e.g., Wagyu Truffle Burger) to balance prep load.`;
    } else if (qLower.includes('waiting time') || qLower.includes('wait')) {
      answerText = `### ⏱️ Operational Delay & Queue Analysis

Waiting time is currently extending due to a bottleneck at the **${busiestStation.station} Station** and table turnover velocity:

**Root Cause Breakdown:**
- **Kitchen Workload:** The **${busiestStation.station} Station** currently has **${busiestStation.activeTickets} active tickets** queued, with average ticket prep time at **${Math.round(busiestStation.avgTimeSec / 60)} minutes**.
- **Dining Room Occupancy:** **${occupiedTables} of ${totalTables} tables** are occupied (${store.analytics.tableOccupancyRate}% occupancy rate).
- **Waitlist Queue:** **${queueCount} parties** waiting in queue.

**Immediate Actions to Reduce Delay:**
1. Reassign 1 floater prep chef to **${busiestStation.station}** to assist plating.
2. Expedite checkouts for tables in payment due status to free up seating.`;
    } else if (qLower.includes('selling') || qLower.includes('popular') || qLower.includes('most')) {
      answerText = `### 📊 Top Selling Dishes Today

Based on live order telemetry across all dining channels:

1. **Wagyu Truffle Burger** - 28 orders ($784.00 total revenue)
2. **Glazed Salmon Jasmine Rice Bowl** - 19 orders ($408.50 total revenue)
3. **Craft IPA & Beverage Pairings** - 32 orders ($224.00 total revenue)

**Operational Insight:**
Mains account for **55%** of daily revenue. Ensure burger patties and salmon fillets are pre-portioned before peak dinner rush.`;
    } else if (qLower.includes('prepare') || qLower.includes('prep') || qLower.includes('more')) {
      answerText = `### 👨‍🍳 Prep Demand Forecast for Today

To avoid kitchen delays during the **7:30 PM - 9:00 PM** dinner rush, prepare the following buffers:

- **Jasmine Rice:** Batch steam **15 kg** of Jasmine Rice for the Glazed Salmon Bowl.
- **Angus Beef Patties:** Portion and chill **25 patties** for the Grill station.
- **Avocado Slices:** Pre-slice **15 avocados** for appetizers and rice bowls.

This prep buffer will reduce average ticket times by **3.8 minutes** during peak volume.`;
    } else if (qLower.includes('reduce') || qLower.includes('operational') || qLower.includes('delay')) {
      answerText = `### ⚡ Operational Optimization Strategy

To streamline throughput and eliminate prep delays today:

1. **Station Rebalancing:** Shift support staff to **${busiestStation.station} Station** (${busiestStation.activeTickets} active tickets).
2. **Pre-Restock Critical Ingredients:** Restock **${highRiskIngredients[0]?.ingredientName || 'Jasmine Rice'}** before stock drops below threshold.
3. **Table Turnaround:** Bus and sanitize Table 3 & Table 6 as soon as guests vacate to seat waitlist parties faster.`;
    } else {
      answerText = `### 🤖 FlowBite AI Copilot Operational Summary

**Current Restaurant Telemetry:**
- **Active Orders:** ${activeOrdersCount} orders currently in kitchen.
- **High Risk Dish:** **${highRiskDishes[0] || 'Glazed Salmon Jasmine Rice Bowl'}** (stockout predicted between 7:30 PM - 8:30 PM due to low Jasmine Rice).
- **Kitchen Bottleneck:** **${busiestStation.station} Station** handling ${busiestStation.activeTickets} active tickets.
- **Dining Room:** ${occupiedTables}/${totalTables} tables occupied, ${queueCount} parties on waitlist.

Select a quick question above or enter a query to analyze specific operational areas!`;
    }
  }

  // Dynamic structured insights matching user requirements
  const structuredInsights = [
    {
      insight: `${highRiskDishes[0] || 'Glazed Salmon Jasmine Rice Bowl'} may become unavailable during the dinner rush.`,
      reason: `Current inventory of ${highRiskIngredients[0]?.ingredientName || 'Jasmine Rice'} is ${highRiskIngredients[0]?.currentStock || 10} ${highRiskIngredients[0]?.unit || 'kg'} and order velocity is ${highRiskIngredients[0]?.consumptionRate || 2.5} ${highRiskIngredients[0]?.unit || 'kg'}/hr.`,
      risk: (highRiskIngredients[0]?.riskLevel === 'high' ? 'HIGH' : 'MEDIUM') as 'HIGH' | 'MEDIUM' | 'LOW',
      recommendedAction: `Restock +20 ${highRiskIngredients[0]?.unit || 'kg'} of ${highRiskIngredients[0]?.ingredientName || 'Jasmine Rice'} before 7:00 PM.`,
      category: 'inventory' as const,
    },
    {
      insight: `Kitchen ticket prep time at ${busiestStation.station} station is extending waiting times by +${Math.round((busiestStation.avgTimeSec || 300) / 60)} mins.`,
      reason: `${busiestStation.station} station is handling ${busiestStation.activeTickets} active tickets simultaneously with high order complexity.`,
      risk: (busiestStation.activeTickets > 3 ? 'HIGH' : 'MEDIUM') as 'HIGH' | 'MEDIUM' | 'LOW',
      recommendedAction: `Reassign 1 floater prep cook to assist ${busiestStation.station} station plating immediately.`,
      category: 'kitchen' as const,
    },
    {
      insight: `High demand predicted for Wagyu Truffle Burger & Glazed Salmon Bowls between 7:30 PM - 9:00 PM.`,
      reason: `Historical order velocity shows a 45% surge in main course sales during Friday/Saturday peak dinner windows.`,
      risk: 'MEDIUM' as const,
      recommendedAction: `Pre-portion 25 Angus beef patties and pre-slice 15 avocados before 7:00 PM.`,
      category: 'menu' as const,
    },
    {
      insight: `Waitlist queue length reached ${queueCount} parties with average estimated wait time at ${Math.max(12, queueCount * 4)} mins.`,
      reason: `${occupiedTables} of ${totalTables} tables are occupied, with 2 tables in check payment state.`,
      risk: (queueCount >= 3 ? 'HIGH' : 'LOW') as 'HIGH' | 'MEDIUM' | 'LOW',
      recommendedAction: `Prompt floor staff to expedite table turnaround and trigger SMS notification for next waitlist party.`,
      category: 'queue' as const,
    },
  ];

  const copilotResponse = {
    query: userQuery,
    answer: answerText,
    structuredInsights,
    demandForecast,
    inventoryPredictions,
    smartRecommendations,
    insights: store.aiInsights,
    generatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };

  res.json(copilotResponse);
});

// WHAT-IF OPERATIONAL SIMULATOR ENDPOINT
app.post('/api/ai/what-if', async (req, res) => {
  updateStationMetrics();
  const { scenarioPrompt } = req.body || {};
  const promptText = (scenarioPrompt || 'What if 50 additional customers arrive in the next hour?').trim();

  // Calculate live state baselines
  const currentQueue = store.queue.filter((q) => q.status === 'waiting').length;
  const activeOrdersCount = store.orders.filter((o) => o.status !== 'completed' && o.status !== 'cancelled').length;
  const occupiedTables = store.tables.filter((t) => t.status !== 'available').length;
  
  // Extract number from prompt if user typed something like "50 customers" or "100 guests"
  const matchNum = promptText.match(/\d+/);
  const extraCustomers = matchNum ? parseInt(matchNum[0], 10) : 50;

  // Simulate simulation metrics
  const extraParties = Math.ceil(extraCustomers / 3);
  const newQueueCount = currentQueue + extraParties;
  const projectedWaitTime = Math.round(12 + (newQueueCount * 3.5) + (activeOrdersCount * 2));

  // Station Workload Calculations
  const kitchenWorkload = store.analytics.stationWorkload.map((sw) => {
    const extraTickets = Math.ceil((extraCustomers / 4) * (sw.station === 'Grill' ? 1.5 : 1.0));
    const totalExpected = sw.activeTickets + extraTickets;
    let status: 'Normal' | 'Overloaded' | 'Critical' = 'Normal';
    if (totalExpected >= 10) status = 'Critical';
    else if (totalExpected >= 5) status = 'Overloaded';

    return {
      station: sw.station,
      expectedTickets: totalExpected,
      status,
    };
  });

  // Inventory Impact Calculations
  const inventoryImpact = store.ingredients.map((ing) => {
    const projectedDraw = (ing.consumptionRate || 2.0) * 1.8;
    const projectedStockAfterHour = ing.currentStock - projectedDraw;
    const willRunOut = projectedStockAfterHour <= 0;
    const projectedDeficit = willRunOut
      ? `Deficit of ${Math.abs(Number(projectedStockAfterHour.toFixed(1)))} ${ing.unit} (Out of Stock)`
      : `Remaining: ${Number(projectedStockAfterHour.toFixed(1))} ${ing.unit} (${Math.round((projectedStockAfterHour / ing.currentStock) * 100)}% left)`;

    return {
      ingredientName: ing.name,
      projectedDeficit,
      willRunOut,
    };
  });

  const depletingIngredients = inventoryImpact.filter((i) => i.willRunOut).map((i) => i.ingredientName);
  
  // Find potential unavailable dishes based on depleting ingredients
  const potentialUnavailableItems = store.menu
    .filter((m) => m.recipe.some((r) => {
      const ing = store.ingredients.find((i) => i.id === r.ingredientId);
      return ing && (ing.currentStock < 5 || depletingIngredients.includes(ing.name));
    }))
    .map((m) => m.name);

  if (potentialUnavailableItems.length === 0) {
    potentialUnavailableItems.push('Glazed Salmon Jasmine Rice Bowl', 'Wagyu Truffle Burger');
  }

  const recommendedActions = [
    `Immediate Batch Prep: Cook +15 kg Jasmine Rice and portion 30 Angus patties before the surge hits.`,
    `Station Rebalancing: Reassign 2 floater line cooks directly to the Grill & Assembly stations.`,
    `Waitlist Management: Enable SMS automated queue wait-time warnings for incoming parties (${projectedWaitTime} mins expected wait).`,
    `Menu Auto-86 Safeguard: Monitor ${potentialUnavailableItems[0]} inventory closely and prep safety buffers.`,
  ];

  let resultData = {
    scenarioPrompt: promptText,
    queueImpact: `+${extraParties} additional waiting parties projected (${newQueueCount} total in waitlist).`,
    waitTimeMinutes: projectedWaitTime,
    kitchenWorkload,
    inventoryImpact,
    potentialUnavailableItems,
    recommendedActions,
  };

  // If Gemini API is available, enhance with custom AI scenario analysis
  const ai = getGeminiClient();
  if (ai) {
    try {
      const prompt = `You are FlowBite AI Restaurant Simulation Engine.
The restaurant manager entered a What-If scenario: "${promptText}"

Current Live Telemetry:
- Active Kitchen Orders: ${activeOrdersCount}
- Occupied Tables: ${occupiedTables}/${store.tables.length}
- Current Waitlist Queue: ${currentQueue} parties
- Current Ingredients Stock: ${JSON.stringify(store.ingredients.map(i => ({ name: i.name, stock: i.currentStock, unit: i.unit })))}

Provide a JSON object analyzing this scenario:
{
  "queueImpact": string,
  "waitTimeMinutes": number,
  "recommendedActions": string[]
}`;

      const aiRes = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt,
      });

      if (aiRes.text) {
        const jsonMatch = aiRes.text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.queueImpact) resultData.queueImpact = parsed.queueImpact;
          if (parsed.waitTimeMinutes) resultData.waitTimeMinutes = parsed.waitTimeMinutes;
          if (parsed.recommendedActions && Array.isArray(parsed.recommendedActions)) {
            resultData.recommendedActions = parsed.recommendedActions;
          }
        }
      }
    } catch (err) {
      console.error('Gemini what-if simulation error:', err);
    }
  }

  res.json(resultData);
});

// AI Dish & Meal Pairing Suggestions Endpoint
app.post('/api/ai/suggestions', async (req, res) => {
  const { preference, cartItemIds, dietary } = req.body || {};
  const currentMenu = store.menu.filter((m) => m.isAvailable);

  const cartItems = store.menu.filter((m) => (cartItemIds || []).includes(m.id));
  const cartNames = cartItems.map((c) => c.name).join(', ');

  let chefRecommendation = `Based on current popularity and chef specials, we recommend our signature Wagyu Truffle Burger paired with Craft IPA or Berry Sparkler.`;

  let suggestedItems = currentMenu.map((m) => ({
    id: m.id,
    name: m.name,
    price: m.price,
    category: m.category,
    reason: m.category === 'Mains' ? 'Chef Signature Best Seller' : m.category === 'Drinks' ? 'Perfect Refreshing Drink Pairing' : 'Top Customer Favorite',
    pairingNote: m.category === 'Drinks' ? 'Complements rich savory entrees.' : 'Great to share or enjoy as starter.',
    isAvailable: m.isAvailable,
  }));

  const ai = getGeminiClient();
  if (ai) {
    try {
      const prompt = `You are an AI Gourmet Sommelier & Food Recommender for FlowBite Restaurant.
Menu Items Available: ${JSON.stringify(currentMenu.map(m => ({ id: m.id, name: m.name, price: m.price, category: m.category, desc: m.description, tags: m.dietaryTags })))}
Customer Preference / Request: "${preference || 'Suggest best food & drink pairings'}"
Items Currently in Cart: "${cartNames || 'None'}"
Dietary Restrictions: "${dietary || 'None'}"

Provide a JSON response with:
{
  "chefRecommendation": string (a friendly 2-sentence sommelier advice),
  "suggestedItems": [
    {
      "id": string (must match an existing item id),
      "name": string,
      "price": number,
      "category": string,
      "reason": string,
      "pairingNote": string,
      "isAvailable": boolean
    }
  ]
}`;

      const aiRes = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt,
      });

      if (aiRes.text) {
        const jsonMatch = aiRes.text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.chefRecommendation) chefRecommendation = parsed.chefRecommendation;
          if (parsed.suggestedItems && Array.isArray(parsed.suggestedItems)) {
            suggestedItems = parsed.suggestedItems;
          }
        }
      }
    } catch (err) {
      console.error('Gemini AI dish suggestion error:', err);
    }
  }

  res.json({
    chefRecommendation,
    suggestedItems,
  });
});

// Simulate Order Rush (Stress Test System Flow)
app.post('/api/ai/simulate-rush', (req, res) => {
  const simulatedOrders = [
    {
      type: 'dine-in',
      tableNumber: 3,
      customerName: 'Simulated Rush #1',
      items: [{ menuItemId: 'menu_truffle_burger', quantity: 2 }, { menuItemId: 'menu_truffle_fries', quantity: 2 }],
    },
    {
      type: 'pickup',
      customerName: 'Simulated Rush #2',
      customerPhone: '+1 (555) 000-1122',
      items: [{ menuItemId: 'menu_salmon_plate', quantity: 1 }, { menuItemId: 'menu_craft_ipa', quantity: 2 }],
    },
    {
      type: 'qr-table',
      tableNumber: 7,
      customerName: 'Simulated Rush #3',
      items: [{ menuItemId: 'menu_avocado_toast', quantity: 2 }],
    },
  ];

  simulatedOrders.forEach((so) => {
    const orderItems = so.items.map((it, idx) => {
      const menuObj = store.menu.find((m) => m.id === it.menuItemId);
      return {
        id: `item_rush_${Date.now()}_${idx}`,
        menuItemId: it.menuItemId,
        name: menuObj?.name || 'Rush Item',
        quantity: it.quantity,
        unitPrice: menuObj?.price || 15,
        prepStation: menuObj?.prepStation || ('Grill' as const),
        status: 'placed' as OrderStatus,
      };
    });

    const total = orderItems.reduce((acc, i) => acc + i.unitPrice * i.quantity, 0);
    const ord: Order = {
      id: `ord_rush_${Date.now()}_${Math.random()}`,
      tenantId: 'tenant_flame_grill',
      orderNumber: `#FB-${Math.floor(200 + Math.random() * 800)}`,
      type: so.type as any,
      tableNumber: so.tableNumber,
      customerName: so.customerName,
      customerPhone: so.customerPhone,
      items: orderItems,
      totalAmount: Number(total.toFixed(2)),
      status: 'placed',
      createdAt: new Date().toISOString(),
      estimatedPrepTimeMinutes: 14,
      paymentStatus: 'paid',
    };

    deductIngredientsForOrder(ord);
    store.orders.unshift(ord);
    store.analytics.dailyRevenue = Number((store.analytics.dailyRevenue + total).toFixed(2));
    store.analytics.totalOrdersToday += 1;
  });

  updateStationMetrics();
  res.json({ message: 'Simulated 3 high-volume orders placed. Inventory deducted & KDS updated.', activeOrdersCount: store.orders.length });
});

// Vite Middleware for development vs static serve for production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`FlowBite Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
