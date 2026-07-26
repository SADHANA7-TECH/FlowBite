import { Tenant, Ingredient, MenuItem, Order, DiningTable, QueueEntry, AIInsight, AnalyticsSummary, CopilotResponse, WhatIfResult, AiSuggestionsResponse } from '../types';

export interface AppState {
  tenants: Tenant[];
  ingredients: Ingredient[];
  menu: MenuItem[];
  tables: DiningTable[];
  orders: Order[];
  queue: QueueEntry[];
  aiInsights: AIInsight[];
  analytics: AnalyticsSummary;
}

export async function fetchAppState(): Promise<AppState> {
  const res = await fetch('/api/state');
  if (!res.ok) throw new Error('Failed to fetch app state');
  return res.json();
}

export async function createOrder(data: {
  type: 'dine-in' | 'pickup' | 'qr-table';
  tableNumber?: number;
  customerName: string;
  customerPhone?: string;
  notes?: string;
  items: { menuItemId: string; quantity: number; specialInstructions?: string }[];
}): Promise<Order> {
  const res = await fetch('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to create order');
  }
  return res.json();
}

export async function updateOrderStatus(orderId: string, status: string, itemId?: string): Promise<Order> {
  const res = await fetch(`/api/orders/${orderId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, itemId }),
  });
  if (!res.ok) throw new Error('Failed to update order status');
  return res.json();
}

export async function toggleMenuItemAvailability(menuItemId: string, isAvailable?: boolean): Promise<MenuItem> {
  const res = await fetch('/api/menu/toggle-availability', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ menuItemId, isAvailable }),
  });
  if (!res.ok) throw new Error('Failed to toggle menu item availability');
  return res.json();
}

export async function updateInventoryStock(ingredientId: string, currentStock: number, minThreshold?: number): Promise<Ingredient> {
  const res = await fetch('/api/inventory/update', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ingredientId, currentStock, minThreshold }),
  });
  if (!res.ok) throw new Error('Failed to update inventory stock');
  return res.json();
}

export async function updateTableStatus(tableId: string, status: string, guestCount?: number, assignedStaff?: string): Promise<DiningTable> {
  const res = await fetch(`/api/tables/${tableId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, guestCount, assignedStaff }),
  });
  if (!res.ok) throw new Error('Failed to update table status');
  return res.json();
}

export async function addToQueue(data: {
  customerName: string;
  phone: string;
  partySize: number;
  seatingPreference?: string;
}): Promise<QueueEntry> {
  const res = await fetch('/api/queue', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to add to queue');
  return res.json();
}

export async function updateQueueStatus(id: string, status: string): Promise<QueueEntry> {
  const res = await fetch(`/api/queue/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error('Failed to update queue status');
  return res.json();
}

export async function triggerAIPredictions(): Promise<AIInsight[]> {
  const res = await fetch('/api/ai/predict', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error('Failed to run AI predictions');
  return res.json();
}

export async function simulateOrderRush(): Promise<{ message: string }> {
  const res = await fetch('/api/ai/simulate-rush', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error('Failed to simulate order rush');
  return res.json();
}

export async function queryCopilot(query?: string): Promise<CopilotResponse> {
  const res = await fetch('/api/ai/copilot', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: query || '' }),
  });
  if (!res.ok) throw new Error('Failed to fetch AI Copilot analysis');
  return res.json();
}

export async function simulateWhatIfScenario(scenarioPrompt: string): Promise<WhatIfResult> {
  const res = await fetch('/api/ai/what-if', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scenarioPrompt }),
  });
  if (!res.ok) throw new Error('Failed to run What-If simulation');
  return res.json();
}

export async function fetchAiSuggestions(data?: {
  preference?: string;
  cartItemIds?: string[];
  dietary?: string;
}): Promise<AiSuggestionsResponse> {
  const res = await fetch('/api/ai/suggestions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data || {}),
  });
  if (!res.ok) throw new Error('Failed to fetch AI suggestions');
  return res.json();
}
