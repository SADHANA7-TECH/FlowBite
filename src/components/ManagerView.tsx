import React, { useState } from 'react';
import { AiCopilot } from './AiCopilot';
import {
  MenuItem,
  Ingredient,
  AIInsight,
  AnalyticsSummary,
  Tenant,
  Order,
  DiningTable,
  QueueEntry,
  OrderStatus,
  TableStatus,
  StaffShift,
} from '../types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  Sparkles,
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Clock,
  Users,
  AlertTriangle,
  RefreshCw,
  Plus,
  Power,
  Shield,
  Layers,
  CheckCircle,
  CheckCircle2,
  Utensils,
  Boxes,
  UserCheck,
  MapPin,
  Search,
  Filter,
  ArrowUpRight,
  X,
  Flame,
  ChevronRight,
  Activity,
  Calendar,
  Sliders,
  PhoneCall,
  Check,
  Award,
  BarChart3,
  BookOpen,
  Edit3,
  Trash2,
  UserPlus,
  CalendarCheck,
  Briefcase,
} from 'lucide-react';

interface ManagerViewProps {
  analytics: AnalyticsSummary;
  aiInsights: AIInsight[];
  menu: MenuItem[];
  ingredients: Ingredient[];
  orders?: Order[];
  tables?: DiningTable[];
  queue?: QueueEntry[];
  selectedTenant: Tenant;
  onTriggerAIPredictions: () => Promise<void>;
  onToggleMenuItem: (menuItemId: string, isAvailable?: boolean) => Promise<void>;
  onUpdateInventoryStock: (ingredientId: string, currentStock: number, minThreshold?: number) => Promise<void>;
  onUpdateOrderStatus?: (orderId: string, status: string, itemId?: string) => Promise<void>;
  onUpdateTableStatus?: (tableId: string, status: string, guestCount?: number, assignedStaff?: string) => Promise<void>;
  onUpdateQueueStatus?: (queueId: string, status: string) => Promise<void>;
}

export const ManagerView: React.FC<ManagerViewProps> = ({
  analytics,
  aiInsights,
  menu,
  ingredients,
  orders = [],
  tables = [],
  queue = [],
  selectedTenant,
  onTriggerAIPredictions,
  onToggleMenuItem,
  onUpdateInventoryStock,
  onUpdateOrderStatus,
  onUpdateTableStatus,
  onUpdateQueueStatus,
}) => {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'orders' | 'tables' | 'menu' | 'inventory' | 'customers' | 'analytics' | 'ai' | 'shifts'
  >('overview');
  const [isAiRunning, setIsAiRunning] = useState<boolean>(false);

  // Staff Shift Schedule State
  const [shifts, setShifts] = useState<StaffShift[]>([
    {
      id: 'shift-1',
      staffName: 'Chef Marco Rossi',
      role: 'Head Chef',
      station: 'Grill',
      date: '2026-07-26',
      startTime: '08:00 AM',
      endTime: '04:00 PM',
      status: 'active',
      notes: 'Kitchen Lead - Dinner Prep & Grill Station',
    },
    {
      id: 'shift-2',
      staffName: 'Elena Rostova',
      role: 'Sous Chef',
      station: 'Sauté',
      date: '2026-07-26',
      startTime: '10:00 AM',
      endTime: '06:00 PM',
      status: 'active',
      notes: 'Sauce preparation & Sauté station',
    },
    {
      id: 'shift-3',
      staffName: 'David Chen',
      role: 'Line Cook',
      station: 'Fry',
      date: '2026-07-26',
      startTime: '11:00 AM',
      endTime: '08:00 PM',
      status: 'confirmed',
      notes: 'Appetizers & Fryer line',
    },
    {
      id: 'shift-4',
      staffName: 'Sophia Martinez',
      role: 'Waitstaff',
      station: 'Main Dining',
      date: '2026-07-26',
      startTime: '11:30 AM',
      endTime: '07:30 PM',
      status: 'active',
      notes: 'Floor Server Lead - Main Hall',
    },
    {
      id: 'shift-5',
      staffName: 'Liam O\'Connor',
      role: 'Bartender',
      station: 'Bar',
      date: '2026-07-26',
      startTime: '04:00 PM',
      endTime: '11:00 PM',
      status: 'scheduled',
      notes: 'Evening Cocktail & Beverage Service',
    },
    {
      id: 'shift-6',
      staffName: 'Aria Tanaka',
      role: 'Host',
      station: 'Front Desk',
      date: '2026-07-26',
      startTime: '05:00 PM',
      endTime: '10:00 PM',
      status: 'scheduled',
      notes: 'Waitlist & Table Seating Management',
    },
    {
      id: 'shift-7',
      staffName: 'Marcus Vance',
      role: 'Line Cook',
      station: 'Grill',
      date: '2026-07-27',
      startTime: '08:00 AM',
      endTime: '04:00 PM',
      status: 'scheduled',
      notes: 'Morning Prep & Lunch Grill',
    },
    {
      id: 'shift-8',
      staffName: 'Chloe Dubois',
      role: 'Waitstaff',
      station: 'Patio',
      date: '2026-07-27',
      startTime: '12:00 PM',
      endTime: '08:00 PM',
      status: 'scheduled',
      notes: 'Patio & Outdoor Seating Server',
    },
  ]);

  // Shift Filters & Modals
  const [shiftSearch, setShiftSearch] = useState<string>('');
  const [shiftRoleFilter, setShiftRoleFilter] = useState<string>('All');
  const [shiftDateFilter, setShiftDateFilter] = useState<string>('All');
  const [showShiftModal, setShowShiftModal] = useState<boolean>(false);
  const [editingShiftId, setEditingShiftId] = useState<string | null>(null);

  // Shift Form Fields
  const [shiftFormName, setShiftFormName] = useState<string>('');
  const [shiftFormRole, setShiftFormRole] = useState<StaffShift['role']>('Line Cook');
  const [shiftFormStation, setShiftFormStation] = useState<StaffShift['station']>('Grill');
  const [shiftFormDate, setShiftFormDate] = useState<string>('2026-07-26');
  const [shiftFormStartTime, setShiftFormStartTime] = useState<string>('09:00 AM');
  const [shiftFormEndTime, setShiftFormEndTime] = useState<string>('05:00 PM');
  const [shiftFormStatus, setShiftFormStatus] = useState<StaffShift['status']>('scheduled');
  const [shiftFormNotes, setShiftFormNotes] = useState<string>('');

  const handleOpenAddShiftModal = () => {
    setEditingShiftId(null);
    setShiftFormName('');
    setShiftFormRole('Line Cook');
    setShiftFormStation('Grill');
    setShiftFormDate('2026-07-26');
    setShiftFormStartTime('09:00 AM');
    setShiftFormEndTime('05:00 PM');
    setShiftFormStatus('scheduled');
    setShiftFormNotes('');
    setShowShiftModal(true);
  };

  const handleOpenEditShiftModal = (shift: StaffShift) => {
    setEditingShiftId(shift.id);
    setShiftFormName(shift.staffName);
    setShiftFormRole(shift.role);
    setShiftFormStation(shift.station);
    setShiftFormDate(shift.date);
    setShiftFormStartTime(shift.startTime);
    setShiftFormEndTime(shift.endTime);
    setShiftFormStatus(shift.status);
    setShiftFormNotes(shift.notes || '');
    setShowShiftModal(true);
  };

  const handleSaveShift = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shiftFormName.trim()) return;

    if (editingShiftId) {
      setShifts((prev) =>
        prev.map((s) =>
          s.id === editingShiftId
            ? {
                ...s,
                staffName: shiftFormName,
                role: shiftFormRole,
                station: shiftFormStation,
                date: shiftFormDate,
                startTime: shiftFormStartTime,
                endTime: shiftFormEndTime,
                status: shiftFormStatus,
                notes: shiftFormNotes,
              }
            : s
        )
      );
    } else {
      const newShift: StaffShift = {
        id: `shift-${Date.now()}`,
        staffName: shiftFormName,
        role: shiftFormRole,
        station: shiftFormStation,
        date: shiftFormDate,
        startTime: shiftFormStartTime,
        endTime: shiftFormEndTime,
        status: shiftFormStatus,
        notes: shiftFormNotes,
      };
      setShifts((prev) => [newShift, ...prev]);
    }
    setShowShiftModal(false);
  };

  const handleDeleteShift = (id: string) => {
    if (confirm('Are you sure you want to remove this staff shift schedule?')) {
      setShifts((prev) => prev.filter((s) => s.id !== id));
    }
  };

  const handleCycleShiftStatus = (shiftId: string) => {
    const statuses: StaffShift['status'][] = ['scheduled', 'confirmed', 'active', 'completed', 'cancelled'];
    setShifts((prev) =>
      prev.map((s) => {
        if (s.id === shiftId) {
          const currentIndex = statuses.indexOf(s.status);
          const nextStatus = statuses[(currentIndex + 1) % statuses.length];
          return { ...s, status: nextStatus };
        }
        return s;
      })
    );
  };

  // Filters & State for Sub-sections
  const [orderSearch, setOrderSearch] = useState<string>('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('All');

  const [tableZoneFilter, setTableZoneFilter] = useState<string>('All');

  const [menuSearch, setMenuSearch] = useState<string>('');
  const [menuCategoryFilter, setMenuCategoryFilter] = useState<string>('All');
  const [showAddMenuModal, setShowAddMenuModal] = useState<boolean>(false);

  const [editingStockId, setEditingStockId] = useState<string | null>(null);
  const [stockInputVal, setStockInputVal] = useState<number>(0);

  // Inventory Filters & Add Ingredient Modal
  const [inventorySearch, setInventorySearch] = useState<string>('');
  const [inventoryCategoryFilter, setInventoryCategoryFilter] = useState<string>('All');
  const [inventoryStatusFilter, setInventoryStatusFilter] = useState<string>('All');
  const [showAddIngredientModal, setShowAddIngredientModal] = useState<boolean>(false);

  // New Ingredient Form State
  const [newIngName, setNewIngName] = useState('');
  const [newIngStock, setNewIngStock] = useState('10');
  const [newIngUnit, setNewIngUnit] = useState('kg');
  const [newIngMin, setNewIngMin] = useState('12');
  const [newIngRate, setNewIngRate] = useState('2.5');
  const [newIngCategory, setNewIngCategory] = useState<'Pantry' | 'Protein' | 'Produce' | 'Dairy' | 'Beverage'>('Pantry');
  const [newIngSupplier, setNewIngSupplier] = useState('Golden Grain Distributors');

  // Helper: calculate estimated remaining hours for inventory
  const getEstimatedRemainingTime = (stock: number, rate: number) => {
    if (stock <= 0) return '0 hours (Depleted)';
    if (!rate || rate <= 0) return 'Indefinite';
    const hours = stock / rate;
    if (hours < 1) return `${Math.round(hours * 60)} mins`;
    return `${hours.toFixed(1)} hours`;
  };

  // Helper: calculate inventory item status
  const getIngredientStatus = (ing: Ingredient) => {
    if (ing.currentStock === 0) {
      return { label: 'Depleted', badge: 'bg-rose-100 text-rose-800 border-rose-200', type: 'critical' };
    }
    if (ing.currentStock <= ing.minThreshold) {
      return { label: 'Warning', badge: 'bg-amber-100 text-amber-800 border-amber-200', type: 'warning' };
    }
    return { label: 'Optimal', badge: 'bg-emerald-100 text-emerald-800 border-emerald-200', type: 'optimal' };
  };

  // New Menu Item Form
  const [newMenuName, setNewMenuName] = useState('');
  const [newMenuCategory, setNewMenuCategory] = useState<'Mains' | 'Appetizers' | 'Sides' | 'Desserts' | 'Drinks'>('Mains');
  const [newMenuPrice, setNewMenuPrice] = useState('16.99');
  const [newMenuStation, setNewMenuStation] = useState<'Grill' | 'Sauté' | 'Fry' | 'Pantry/Cold' | 'Bar'>('Grill');
  const [newMenuDesc, setNewMenuDesc] = useState('');

  // Key Metric Computations
  const totalOrdersToday = orders.length || analytics.totalOrdersToday;
  const activeOrdersCount = orders.filter((o) => o.status !== 'completed' && o.status !== 'cancelled').length;
  const completedOrdersCount = orders.filter((o) => o.status === 'completed' || o.status === 'served').length;

  const totalRevenue = orders
    .filter((o) => o.status !== 'cancelled')
    .reduce((sum, o) => sum + o.totalAmount, 0) || analytics.dailyRevenue;

  const activeTablesCount = tables.filter((t) => t.status !== 'available').length;
  const totalTablesCount = tables.length || 8;
  const waitingQueueCount = queue.filter((q) => q.status === 'waiting').length;

  const lowStockCount = ingredients.filter((i) => i.currentStock <= i.minThreshold).length;

  // Top Selling Dishes Calculation
  const dishSalesMap: Record<string, { name: string; count: number; revenue: number; category: string }> = {};
  orders.forEach((o) => {
    o.items.forEach((item) => {
      if (!dishSalesMap[item.name]) {
        const mItem = menu.find((m) => m.name === item.name);
        dishSalesMap[item.name] = {
          name: item.name,
          count: 0,
          revenue: 0,
          category: mItem ? mItem.category : 'Mains',
        };
      }
      dishSalesMap[item.name].count += item.quantity;
      dishSalesMap[item.name].revenue += item.quantity * item.unitPrice;
    });
  });

  const topSellingDishesList = Object.values(dishSalesMap)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const handleRunAi = async () => {
    setIsAiRunning(true);
    try {
      await onTriggerAIPredictions();
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setIsAiRunning(false);
    }
  };

  const handleSaveStock = async (ingId: string) => {
    await onUpdateInventoryStock(ingId, Number(stockInputVal));
    setEditingStockId(null);
  };

  // Status color helpers
  const getOrderStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'placed':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'accepted':
        return 'bg-cyan-100 text-cyan-800 border-cyan-200';
      case 'preparing':
      case 'cooking':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'ready':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'served':
      case 'completed':
        return 'bg-slate-100 text-slate-800 border-slate-200';
      case 'cancelled':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const getTableStatusBadge = (status: TableStatus) => {
    switch (status) {
      case 'available':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'seated':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'ordered':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'food_ready':
        return 'bg-emerald-400 text-slate-950 font-black';
      case 'payment_due':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'cleaning':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
      default:
        return 'bg-slate-800 text-slate-300';
    }
  };

  // Calculated Category Revenue & Units Data
  const categoryTotals: Record<string, number> = { Mains: 0, Appetizers: 0, Drinks: 0, Sides: 0, Desserts: 0 };
  const categoryItemCounts: Record<string, number> = { Mains: 0, Appetizers: 0, Drinks: 0, Sides: 0, Desserts: 0 };

  orders.forEach((o) => {
    if (o.status !== 'cancelled') {
      o.items.forEach((item) => {
        const mItem = menu.find((m) => m.name === item.name);
        const cat = mItem ? mItem.category : 'Mains';
        categoryTotals[cat] = (categoryTotals[cat] || 0) + item.quantity * item.unitPrice;
        categoryItemCounts[cat] = (categoryItemCounts[cat] || 0) + item.quantity;
      });
    }
  });

  const catColors: Record<string, string> = {
    Mains: '#f97316',
    Appetizers: '#3b82f6',
    Drinks: '#10b981',
    Sides: '#eab308',
    Desserts: '#8b5cf6',
  };

  const hasOrderData = Object.values(categoryTotals).some((v) => v > 0);

  const categoryRevenueData = Object.keys(categoryTotals)
    .map((cat) => ({
      name: cat,
      value: hasOrderData
        ? categoryTotals[cat]
        : Math.round(totalRevenue * (cat === 'Mains' ? 0.5 : cat === 'Appetizers' ? 0.25 : cat === 'Drinks' ? 0.15 : 0.1)),
      units: categoryItemCounts[cat] || Math.round((totalRevenue * 0.05) + 5),
      color: catColors[cat] || '#64748b',
    }))
    .filter((item) => item.value > 0);

  // 7-Day Revenue Trend Data
  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun (Today)'];
  const baseDayRevenues = [1180, 1420, 1290, 1640, 2280, 2850, Math.max(totalRevenue, 2100)];
  const dailyRevenueTrendData = daysOfWeek.map((day, idx) => {
    const rev = idx === 6 ? Math.max(totalRevenue, 2100) : baseDayRevenues[idx];
    const orderCount = Math.round(rev / 38);
    return {
      day,
      revenue: Math.round(rev),
      orders: orderCount,
      avgTicket: Math.round(rev / Math.max(1, orderCount)),
    };
  });

  // Hourly Peak Order Hours Data
  const hourlyOrderVolumeData = [
    { hour: '11 AM', orders: 12, revenue: 380, isPeak: false },
    { hour: '12 PM', orders: 28, revenue: 890, isPeak: true },
    { hour: '1 PM', orders: 34, revenue: 1120, isPeak: true },
    { hour: '2 PM', orders: 18, revenue: 540, isPeak: false },
    { hour: '3 PM', orders: 9, revenue: 260, isPeak: false },
    { hour: '4 PM', orders: 14, revenue: 420, isPeak: false },
    { hour: '5 PM', orders: 22, revenue: 710, isPeak: false },
    { hour: '6 PM', orders: 38, revenue: 1280, isPeak: true },
    { hour: '7 PM', orders: 42, revenue: 1450, isPeak: true },
    { hour: '8 PM', orders: 31, revenue: 990, isPeak: true },
    { hour: '9 PM', orders: 16, revenue: 480, isPeak: false },
    { hour: '10 PM', orders: 8, revenue: 240, isPeak: false },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* SaaS Command Center Header */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 border border-slate-800 shadow-xl space-y-5">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-extrabold px-3 py-0.5 rounded-full uppercase tracking-wider">
                {selectedTenant.code} Executive Suite
              </span>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">
              {selectedTenant.name} Manager Command Center
            </h1>
            <p className="text-xs text-slate-400">
              Enterprise POS & Operations Control • Real-time Supabase Data Sync & Gemini AI Engine
            </p>
          </div>

          {/* Top Quick Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleRunAi}
              disabled={isAiRunning}
              className="flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-extrabold px-4 py-2.5 rounded-2xl shadow-md transition-all border border-purple-400/30 disabled:opacity-50"
            >
              <Sparkles className={`w-4 h-4 text-amber-300 ${isAiRunning ? 'animate-spin' : ''}`} />
              <span>{isAiRunning ? 'Gemini Diagnosing...' : 'Run Gemini AI Diagnosis'}</span>
            </button>
          </div>
        </div>

        {/* 9 Section Navigation Tabs */}
        <div className="border-t border-slate-800 pt-4 flex items-center space-x-1 overflow-x-auto no-scrollbar text-xs font-bold">
          {[
            { id: 'overview', label: '1. Overview', icon: Activity },
            { id: 'orders', label: `2. Orders (${orders.length})`, icon: ShoppingBag },
            { id: 'tables', label: `3. Tables (${activeTablesCount}/${totalTablesCount})`, icon: MapPin },
            { id: 'menu', label: `4. Menu (${menu.length})`, icon: BookOpen },
            { id: 'inventory', label: `5. Inventory (${lowStockCount} Low)`, icon: Boxes },
            { id: 'customers', label: `6. Customers (${waitingQueueCount} Wait)`, icon: Users },
            { id: 'analytics', label: '7. Analytics', icon: BarChart3 },
            { id: 'ai', label: `8. AI Copilot (${aiInsights.length})`, icon: Sparkles },
            { id: 'shifts', label: `9. Shift Schedule (${shifts.length})`, icon: Calendar },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-4 py-2.5 rounded-2xl whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-purple-600 text-white shadow-md font-black scale-102'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-amber-300' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* TOP KEY METRICS CARDS BAR (Required 9 Metrics) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-3">
        {/* 1. Total Orders Today */}
        <div className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-xs space-y-1">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Total Orders</span>
          <p className="text-lg font-black text-slate-900">{totalOrdersToday}</p>
          <span className="text-[10px] text-slate-400">Today's total</span>
        </div>

        {/* 2. Revenue */}
        <div className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-xs space-y-1">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Revenue</span>
          <p className="text-lg font-black text-emerald-600">${totalRevenue.toFixed(2)}</p>
          <span className="text-[10px] text-emerald-600 font-bold flex items-center">
            <TrendingUp className="w-2.5 h-2.5 mr-0.5" /> +14.2%
          </span>
        </div>

        {/* 3. Active Orders */}
        <div className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-xs space-y-1">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Active Orders</span>
          <p className="text-lg font-black text-orange-600">{activeOrdersCount}</p>
          <span className="text-[10px] text-orange-600 font-bold">In Kitchen</span>
        </div>

        {/* 4. Completed Orders */}
        <div className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-xs space-y-1">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Completed</span>
          <p className="text-lg font-black text-blue-600">{completedOrdersCount}</p>
          <span className="text-[10px] text-slate-400">Served & Closed</span>
        </div>

        {/* 5. Active Tables */}
        <div className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-xs space-y-1">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Active Tables</span>
          <p className="text-lg font-black text-purple-600">{activeTablesCount}/{totalTablesCount}</p>
          <span className="text-[10px] text-slate-400">{analytics.tableOccupancyRate}% Occ.</span>
        </div>

        {/* 6. Queue Length */}
        <div className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-xs space-y-1">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Queue Length</span>
          <p className="text-lg font-black text-indigo-600">{waitingQueueCount}</p>
          <span className="text-[10px] text-slate-400">Waiting guests</span>
        </div>

        {/* 7. Low-Stock Items */}
        <div className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-xs space-y-1">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Low-Stock</span>
          <p className="text-lg font-black text-rose-600">{lowStockCount}</p>
          <span className="text-[10px] text-rose-600 font-semibold">Below min.</span>
        </div>

        {/* 8. Avg Prep Time */}
        <div className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-xs space-y-1">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Avg Prep Time</span>
          <p className="text-lg font-black text-amber-600">{analytics.avgPrepTimeMinutes}m</p>
          <span className="text-[10px] text-emerald-600 font-semibold">&lt; 12m Target</span>
        </div>

        {/* 9. Top Dish */}
        <div className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-xs space-y-1">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Top Seller</span>
          <p className="text-xs font-black text-slate-900 truncate">
            {topSellingDishesList[0]?.name || 'Truffle Burger'}
          </p>
          <span className="text-[10px] text-slate-400">
            {topSellingDishesList[0] ? `${topSellingDishesList[0].count} sold` : 'Best seller'}
          </span>
        </div>
      </div>

      {/* SECTION 1: OPERATIONS OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 1: Hourly Order Volume & Revenue */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">Hourly Sales & Revenue Throughput</h3>
                  <p className="text-xs text-slate-500">Real-time revenue progression over operating hours</p>
                </div>
                <span className="text-xs font-bold bg-purple-50 text-purple-700 px-2.5 py-1 rounded-lg">
                  Peak: 1:00 PM
                </span>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analytics.hourlyOrders}>
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="hour" stroke="#94a3b8" fontSize={11} />
                    <YAxis stroke="#94a3b8" fontSize={11} />
                    <Tooltip />
                    <Area type="monotone" dataKey="revenue" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorRev)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Kitchen Prep Station Workload */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">Kitchen Station Active Load</h3>
                  <p className="text-xs text-slate-500">Pending tickets across prep stations</p>
                </div>
                <span className="text-xs font-bold bg-orange-50 text-orange-700 px-2.5 py-1 rounded-lg">
                  Grill Heavy
                </span>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.stationWorkload}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="station" stroke="#94a3b8" fontSize={11} />
                    <YAxis stroke="#94a3b8" fontSize={11} />
                    <Tooltip />
                    <Bar dataKey="activeTickets" fill="#f97316" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Live Activity Stream & Operational Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-extrabold text-slate-900 text-sm flex items-center">
                  <Activity className="w-4 h-4 mr-2 text-purple-600" />
                  Live Operational Stream & Telemetry Log
                </h3>
                <span className="text-[11px] font-bold text-emerald-600 flex items-center">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1 animate-ping" /> Realtime
                </span>
              </div>

              <div className="space-y-2 text-xs">
                {orders.slice(0, 4).map((o) => (
                  <div key={o.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-900 text-white font-extrabold flex items-center justify-center text-xs">
                        #{o.orderNumber.slice(-3)}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{o.customerName} ({o.type})</p>
                        <p className="text-[11px] text-slate-500">{o.items.length} items • ${o.totalAmount.toFixed(2)}</p>
                      </div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${getOrderStatusBadge(o.status)}`}>
                      {o.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions Panel */}
            <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 shadow-md space-y-4">
              <h3 className="font-extrabold text-sm flex items-center text-amber-400">
                <Power className="w-4 h-4 mr-2" /> Executive Quick Actions
              </h3>
              <div className="space-y-2 text-xs">
                <button
                  onClick={() => setActiveTab('inventory')}
                  className="w-full text-left p-3 rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors border border-slate-700 font-bold flex items-center justify-between"
                >
                  <span>Restock Low Inventory ({lowStockCount})</span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>
                <button
                  onClick={() => setActiveTab('menu')}
                  className="w-full text-left p-3 rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors border border-slate-700 font-bold flex items-center justify-between"
                >
                  <span>Manage Menu Availability ("86")</span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>
                <button
                  onClick={() => setActiveTab('customers')}
                  className="w-full text-left p-3 rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors border border-slate-700 font-bold flex items-center justify-between"
                >
                  <span>Seat Waitlist Guests ({waitingQueueCount})</span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: ORDERS MANAGEMENT */}
      {activeTab === 'orders' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden p-5 space-y-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">Live Orders Directory & Real-Time Controls</h2>
              <p className="text-xs text-slate-500">Order changes here immediately sync to kitchen display & customer view</p>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              {/* Search */}
              <div className="relative flex-1 sm:w-48">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search Order #, Customer..."
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-2 focus:outline-none focus:border-slate-900"
                />
              </div>

              {/* Status Filter */}
              <select
                value={orderStatusFilter}
                onChange={(e) => setOrderStatusFilter(e.target.value)}
                className="text-xs font-extrabold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none"
              >
                <option value="All">All Statuses</option>
                <option value="placed">Placed</option>
                <option value="accepted">Accepted</option>
                <option value="preparing">Preparing</option>
                <option value="ready">Ready</option>
                <option value="served">Served</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 uppercase font-extrabold">
                  <th className="p-3">Order ID</th>
                  <th className="p-3">Type / Table</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Items Purchased</th>
                  <th className="p-3">Total Amount</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Update Order Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {orders
                  .filter((o) => {
                    const matchesSearch =
                      o.orderNumber.toLowerCase().includes(orderSearch.toLowerCase()) ||
                      o.customerName.toLowerCase().includes(orderSearch.toLowerCase());
                    const matchesStatus = orderStatusFilter === 'All' || o.status === orderStatusFilter;
                    return matchesSearch && matchesStatus;
                  })
                  .map((o) => (
                    <tr key={o.id} className="hover:bg-slate-50/80">
                      <td className="p-3 font-black text-slate-900">{o.orderNumber}</td>
                      <td className="p-3">
                        <span className="font-bold text-slate-800">
                          {o.type === 'pickup' ? 'Pickup' : `Table #${o.tableNumber}`}
                        </span>
                      </td>
                      <td className="p-3">
                        <p className="font-bold text-slate-900">{o.customerName}</p>
                        <p className="text-[10px] text-slate-400">{o.customerPhone || 'No phone'}</p>
                      </td>
                      <td className="p-3">
                        <p className="font-bold text-slate-800">
                          {o.items.map((i) => `${i.quantity}× ${i.name}`).join(', ')}
                        </p>
                      </td>
                      <td className="p-3 font-black text-emerald-600">${o.totalAmount.toFixed(2)}</td>
                      <td className="p-3">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${getOrderStatusBadge(o.status)}`}>
                          {o.status}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        {onUpdateOrderStatus && (
                          <select
                            value={o.status}
                            onChange={(e) => onUpdateOrderStatus(o.id, e.target.value)}
                            className="bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 font-bold px-2.5 py-1 rounded-lg text-xs"
                          >
                            <option value="placed">Mark Placed</option>
                            <option value="accepted">Mark Accepted</option>
                            <option value="preparing">Mark Preparing</option>
                            <option value="ready">Mark Ready</option>
                            <option value="served">Mark Served</option>
                            <option value="completed">Mark Completed</option>
                            <option value="cancelled">Cancel Order</option>
                          </select>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTION 3: TABLES & FLOOR PLAN */}
      {activeTab === 'tables' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">Dining Floor Plan & Table Live Matrix</h2>
              <p className="text-xs text-slate-500">Manage seating status, guest count, and table clearance</p>
            </div>
            <div className="flex items-center space-x-2 text-xs font-bold">
              {['All', 'Main Dining', 'Patio', 'Bar Area'].map((zone) => (
                <button
                  key={zone}
                  onClick={() => setTableZoneFilter(zone)}
                  className={`px-3 py-1.5 rounded-xl border transition-all ${
                    tableZoneFilter === zone
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {zone}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {tables
              .filter((t) => tableZoneFilter === 'All' || t.zone === tableZoneFilter)
              .map((table) => {
                const matchedOrder = orders.find((o) => o.id === table.currentOrderId || (o.tableNumber === table.tableNumber && o.status !== 'completed' && o.status !== 'cancelled'));

                return (
                  <div
                    key={table.id}
                    className={`rounded-2xl border p-4 space-y-3 transition-all ${
                      table.status === 'available'
                        ? 'bg-slate-50 border-slate-200'
                        : table.status === 'seated'
                        ? 'bg-blue-50/60 border-blue-200'
                        : 'bg-amber-50/60 border-amber-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-black text-slate-900 text-sm">Table #{table.tableNumber}</span>
                      <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-md ${getTableStatusBadge(table.status)}`}>
                        {table.status.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="space-y-1 text-xs text-slate-600">
                      <p>Zone: <strong className="text-slate-900">{table.zone}</strong></p>
                      <p>Capacity: <strong className="text-slate-900">{table.capacity} Seats</strong></p>
                      {table.guestCount && <p>Current Guests: <strong className="text-slate-900">{table.guestCount}</strong></p>}
                      {matchedOrder && (
                        <p className="text-emerald-700 font-extrabold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[11px]">
                          Active Order #{matchedOrder.orderNumber} (${matchedOrder.totalAmount.toFixed(2)})
                        </p>
                      )}
                    </div>

                    <div className="pt-2 border-t border-slate-200 flex items-center gap-2 text-xs font-bold">
                      {onUpdateTableStatus && (
                        <select
                          value={table.status}
                          onChange={(e) => onUpdateTableStatus(table.id, e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-xl p-2 font-bold text-slate-900 focus:outline-none"
                        >
                          <option value="available">Set Available</option>
                          <option value="seated">Set Seated</option>
                          <option value="ordered">Set Ordered</option>
                          <option value="food_ready">Set Food Ready</option>
                          <option value="payment_due">Set Payment Due</option>
                          <option value="cleaning">Set Cleaning</option>
                        </select>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* SECTION 4: MENU MANAGEMENT */}
      {activeTab === 'menu' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">Digital Menu Catalogue & "86" Sold-Out Toggles</h2>
              <p className="text-xs text-slate-500">Instantly toggle item availability across POS & Customer QR menus</p>
            </div>

            <div className="flex items-center space-x-3">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search dishes..."
                  value={menuSearch}
                  onChange={(e) => setMenuSearch(e.target.value)}
                  className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-2 focus:outline-none"
                />
              </div>

              <button
                onClick={() => setShowAddMenuModal(true)}
                className="flex items-center space-x-1.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs px-3.5 py-2 rounded-xl transition-all shadow-xs"
              >
                <Plus className="w-3.5 h-3.5 text-orange-400" />
                <span>Add Dish</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 uppercase font-extrabold">
                  <th className="p-3">Dish Image</th>
                  <th className="p-3">Item Name</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Prep Station</th>
                  <th className="p-3">Price</th>
                  <th className="p-3">Live Availability</th>
                  <th className="p-3 text-right">Toggle "86" Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {menu
                  .filter((m) => m.name.toLowerCase().includes(menuSearch.toLowerCase()))
                  .map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/80">
                      <td className="p-3">
                        <img src={item.imageUrl} alt={item.name} className="w-10 h-10 rounded-lg object-cover" />
                      </td>
                      <td className="p-3">
                        <p className="font-black text-slate-900">{item.name}</p>
                        <p className="text-[10px] text-slate-400 line-clamp-1">{item.description}</p>
                      </td>
                      <td className="p-3 text-slate-600 font-bold">{item.category}</td>
                      <td className="p-3 text-slate-600">{item.prepStation}</td>
                      <td className="p-3 font-black text-slate-900">${item.price.toFixed(2)}</td>
                      <td className="p-3">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${item.isAvailable ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                          {item.isAvailable ? 'In Stock' : "86'd SOLD OUT"}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => onToggleMenuItem(item.id, !item.isAvailable)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all ${
                            item.isAvailable
                              ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {item.isAvailable ? 'Mark 86 Out of Stock' : 'Mark In Stock'}
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTION 5: INVENTORY MANAGEMENT */}
      {activeTab === 'inventory' && (
        <div className="space-y-6">
          {/* Inventory Health Summary Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[11px] font-extrabold uppercase tracking-wider">Total Tracked</span>
                <Boxes className="w-4 h-4 text-slate-400" />
              </div>
              <p className="text-2xl font-black text-slate-900">{ingredients.length}</p>
              <span className="text-[10px] text-slate-400 font-medium">Raw ingredients in POS</span>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-emerald-600">
                <span className="text-[11px] font-extrabold uppercase tracking-wider">Optimal Stock</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
              <p className="text-2xl font-black text-emerald-600">
                {ingredients.filter((i) => i.currentStock > i.minThreshold).length}
              </p>
              <span className="text-[10px] text-emerald-600 font-bold">In safe operating levels</span>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-amber-600">
                <span className="text-[11px] font-extrabold uppercase tracking-wider">Low Stock Warnings</span>
                <AlertTriangle className="w-4 h-4 text-amber-500" />
              </div>
              <p className="text-2xl font-black text-amber-600">{lowStockCount}</p>
              <span className="text-[10px] text-amber-600 font-bold">Needs reorder soon</span>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-rose-600">
                <span className="text-[11px] font-extrabold uppercase tracking-wider">Out of Stock (Depleted)</span>
                <Flame className="w-4 h-4 text-rose-500" />
              </div>
              <p className="text-2xl font-black text-rose-600">
                {ingredients.filter((i) => i.currentStock === 0).length}
              </p>
              <span className="text-[10px] text-rose-600 font-bold">Triggered Menu Auto-86</span>
            </div>
          </div>

          {/* Active Inventory Alert Banner */}
          {lowStockCount > 0 && (
            <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-rose-500/10 border border-amber-300/60 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-start space-x-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 font-black flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                    Automated Real-Time Stock Warning ({lowStockCount} Low Ingredients)
                  </h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Items like{' '}
                    <strong className="text-slate-900">
                      {ingredients
                        .filter((i) => i.currentStock <= i.minThreshold)
                        .map((i) => `${i.name} (${i.currentStock} ${i.unit})`)
                        .join(', ')}
                    </strong>{' '}
                    are at or below minimum threshold levels. Depleted items automatically 86 linked menu dishes.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  // Quick restock all low items by +20
                  ingredients
                    .filter((i) => i.currentStock <= i.minThreshold)
                    .forEach((i) => onUpdateInventoryStock(i.id, i.currentStock + 20));
                }}
                className="bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-xs px-4 py-2 rounded-xl shadow-xs transition-all shrink-0"
              >
                Quick Restock Low Items (+20)
              </button>
            </div>
          )}

          {/* Inventory Table Container */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
            {/* Header & Controls */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-base font-extrabold text-slate-900">Recipe Inventory & Real-Time Consumption Engine</h2>
                <p className="text-xs text-slate-500">
                  Real-time stock deduction on order fulfillment • Automated 86 menu updates & supplier alerts
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                {/* Search */}
                <div className="relative flex-1 sm:w-44">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search ingredient..."
                    value={inventorySearch}
                    onChange={(e) => setInventorySearch(e.target.value)}
                    className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-2 focus:outline-none focus:border-slate-900"
                  />
                </div>

                {/* Category Filter */}
                <select
                  value={inventoryCategoryFilter}
                  onChange={(e) => setInventoryCategoryFilter(e.target.value)}
                  className="text-xs font-extrabold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none"
                >
                  <option value="All">All Categories</option>
                  <option value="Pantry">Pantry</option>
                  <option value="Protein">Protein</option>
                  <option value="Produce">Produce</option>
                  <option value="Dairy">Dairy</option>
                  <option value="Beverage">Beverage</option>
                </select>

                {/* Status Filter */}
                <select
                  value={inventoryStatusFilter}
                  onChange={(e) => setInventoryStatusFilter(e.target.value)}
                  className="text-xs font-extrabold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none"
                >
                  <option value="All">All Statuses</option>
                  <option value="Optimal">Optimal</option>
                  <option value="Warning">Warning / Low Stock</option>
                  <option value="Depleted">Depleted</option>
                </select>

                {/* Add Ingredient Button */}
                <button
                  onClick={() => setShowAddIngredientModal(true)}
                  className="flex items-center space-x-1.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs px-3.5 py-2 rounded-xl transition-all shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5 text-amber-400" />
                  <span>Add Ingredient</span>
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 uppercase font-extrabold">
                    <th className="p-3">Ingredient Name</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Current Stock</th>
                    <th className="p-3">Min Threshold</th>
                    <th className="p-3">Consumption Rate</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Est. Remaining Time</th>
                    <th className="p-3">Supplier</th>
                    <th className="p-3 text-right">Restock Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {ingredients
                    .filter((ing) => {
                      const matchesSearch = ing.name.toLowerCase().includes(inventorySearch.toLowerCase()) ||
                        ing.supplier.toLowerCase().includes(inventorySearch.toLowerCase());
                      const matchesCategory = inventoryCategoryFilter === 'All' || ing.category === inventoryCategoryFilter;
                      
                      const statusInfo = getIngredientStatus(ing);
                      const matchesStatus = inventoryStatusFilter === 'All' ||
                        (inventoryStatusFilter === 'Optimal' && statusInfo.type === 'optimal') ||
                        (inventoryStatusFilter === 'Warning' && statusInfo.type === 'warning') ||
                        (inventoryStatusFilter === 'Depleted' && statusInfo.type === 'critical');

                      return matchesSearch && matchesCategory && matchesStatus;
                    })
                    .map((ing) => {
                      const statusInfo = getIngredientStatus(ing);
                      const rate = ing.consumptionRate || 2.5;
                      const timeRemainingStr = getEstimatedRemainingTime(ing.currentStock, rate);

                      // Find dishes using this ingredient
                      const dependentDishes = menu.filter((m) =>
                        m.recipe.some((r) => r.ingredientId === ing.id)
                      );

                      return (
                        <tr key={ing.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-3">
                            <p className="font-extrabold text-slate-900">{ing.name}</p>
                            {dependentDishes.length > 0 && (
                              <p className="text-[10px] text-slate-400 truncate max-w-xs">
                                Used in: {dependentDishes.map((d) => d.name).join(', ')}
                              </p>
                            )}
                          </td>
                          <td className="p-3 text-slate-600 font-bold">{ing.category}</td>
                          <td className="p-3">
                            {editingStockId === ing.id ? (
                              <div className="flex items-center space-x-1">
                                <input
                                  type="number"
                                  value={stockInputVal}
                                  onChange={(e) => setStockInputVal(Number(e.target.value))}
                                  className="w-16 bg-slate-100 border p-1 rounded font-bold text-slate-900"
                                />
                                <button
                                  onClick={() => handleSaveStock(ing.id)}
                                  className="bg-emerald-600 text-white font-bold px-2 py-1 rounded text-[10px]"
                                >
                                  Save
                                </button>
                              </div>
                            ) : (
                              <div>
                                <span className="font-black text-slate-900 text-sm">
                                  {ing.currentStock} {ing.unit}
                                </span>
                                <div className="w-24 bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1">
                                  <div
                                    className={`h-full ${
                                      ing.currentStock <= ing.minThreshold
                                        ? 'bg-amber-500'
                                        : ing.currentStock === 0
                                        ? 'bg-rose-500'
                                        : 'bg-emerald-500'
                                    }`}
                                    style={{
                                      width: `${Math.min(100, (ing.currentStock / (ing.minThreshold * 2.5 || 50)) * 100)}%`,
                                    }}
                                  />
                                </div>
                              </div>
                            )}
                          </td>
                          <td className="p-3 text-slate-600 font-semibold">
                            {ing.minThreshold} {ing.unit}
                          </td>
                          <td className="p-3 font-bold text-indigo-700">
                            {rate} {ing.unit}/hr
                          </td>
                          <td className="p-3">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase border ${statusInfo.badge}`}>
                              {statusInfo.label}
                            </span>
                          </td>
                          <td className="p-3 font-extrabold text-slate-800">
                            <span className="flex items-center text-slate-700">
                              <Clock className="w-3 h-3 text-amber-500 mr-1" />
                              {timeRemainingStr}
                            </span>
                          </td>
                          <td className="p-3 text-slate-600">{ing.supplier}</td>
                          <td className="p-3 text-right space-x-1 whitespace-nowrap">
                            <button
                              onClick={() => onUpdateInventoryStock(ing.id, ing.currentStock + 10)}
                              className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-2 py-1 rounded-lg text-[11px]"
                            >
                              +10 {ing.unit}
                            </button>
                            <button
                              onClick={() => onUpdateInventoryStock(ing.id, ing.currentStock + 50)}
                              className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-2 py-1 rounded-lg text-[11px]"
                            >
                              +50 {ing.unit}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Add New Ingredient Modal */}
          {showAddIngredientModal && (
            <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl border border-slate-200">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="font-black text-slate-900 text-base">Create New Recipe Ingredient</h3>
                  <button
                    onClick={() => setShowAddIngredientModal(false)}
                    className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!newIngName.trim()) return;
                    await onUpdateInventoryStock(`ing_${Date.now()}`, Number(newIngStock), Number(newIngMin));
                    setShowAddIngredientModal(false);
                    setNewIngName('');
                  }}
                  className="space-y-3 text-xs"
                >
                  <div className="space-y-1">
                    <label className="font-extrabold text-slate-700">Ingredient Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Jasmine Rice"
                      value={newIngName}
                      onChange={(e) => setNewIngName(e.target.value)}
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900 focus:outline-none focus:border-slate-900"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-extrabold text-slate-700">Current Stock</label>
                      <input
                        type="number"
                        value={newIngStock}
                        onChange={(e) => setNewIngStock(e.target.value)}
                        required
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-extrabold text-slate-700">Unit (e.g. kg, pcs, ml)</label>
                      <input
                        type="text"
                        value={newIngUnit}
                        onChange={(e) => setNewIngUnit(e.target.value)}
                        required
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-extrabold text-slate-700">Minimum Threshold</label>
                      <input
                        type="number"
                        value={newIngMin}
                        onChange={(e) => setNewIngMin(e.target.value)}
                        required
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-extrabold text-slate-700">Consumption Rate (/hr)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={newIngRate}
                        onChange={(e) => setNewIngRate(e.target.value)}
                        required
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-extrabold text-slate-700">Category</label>
                      <select
                        value={newIngCategory}
                        onChange={(e) => setNewIngCategory(e.target.value as any)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900 focus:outline-none"
                      >
                        <option value="Pantry">Pantry</option>
                        <option value="Protein">Protein</option>
                        <option value="Produce">Produce</option>
                        <option value="Dairy">Dairy</option>
                        <option value="Beverage">Beverage</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="font-extrabold text-slate-700">Supplier</label>
                      <input
                        type="text"
                        value={newIngSupplier}
                        onChange={(e) => setNewIngSupplier(e.target.value)}
                        required
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-end space-x-2">
                    <button
                      type="button"
                      onClick={() => setShowAddIngredientModal(false)}
                      className="px-4 py-2 rounded-xl text-slate-600 font-bold hover:bg-slate-100"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black shadow-md"
                    >
                      Save Ingredient
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SECTION 6: CUSTOMERS & WAITLIST QUEUE */}
      {activeTab === 'customers' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">Table Waitlist Queue & Customer CRM</h2>
              <p className="text-xs text-slate-500">Real-time queue tracking & seating notifications</p>
            </div>
            <span className="text-xs font-bold bg-blue-50 text-blue-800 px-3 py-1 rounded-xl border border-blue-200">
              {waitingQueueCount} Parties Waiting
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 uppercase font-extrabold">
                  <th className="p-3">Customer Name</th>
                  <th className="p-3">Phone</th>
                  <th className="p-3">Party Size</th>
                  <th className="p-3">Preference</th>
                  <th className="p-3">Est. Wait</th>
                  <th className="p-3">Queue Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {queue.map((entry) => (
                  <tr key={entry.id} className="hover:bg-slate-50/80">
                    <td className="p-3 font-black text-slate-900">{entry.customerName}</td>
                    <td className="p-3 text-slate-600">{entry.phone}</td>
                    <td className="p-3 font-bold text-slate-900">{entry.partySize} Guests</td>
                    <td className="p-3 text-slate-600">{entry.seatingPreference || 'Indoor'}</td>
                    <td className="p-3 text-amber-600 font-extrabold">~{entry.estimatedWaitMinutes} Mins</td>
                    <td className="p-3">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                        entry.status === 'waiting'
                          ? 'bg-amber-100 text-amber-800'
                          : entry.status === 'notified'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {entry.status}
                      </span>
                    </td>
                    <td className="p-3 text-right space-x-2">
                      {onUpdateQueueStatus && (
                        <>
                          <button
                            onClick={() => onUpdateQueueStatus(entry.id, 'notified')}
                            className="bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold px-2.5 py-1 rounded-lg text-xs"
                          >
                            Send SMS Alert
                          </button>
                          <button
                            onClick={() => onUpdateQueueStatus(entry.id, 'seated')}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-2.5 py-1 rounded-lg text-xs"
                          >
                            Seat Table
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTION 7: ANALYTICS & VISUALIZATIONS */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {/* Executive Analytics Summary Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[10px] font-extrabold uppercase tracking-wider">7-Day Revenue Total</span>
                <DollarSign className="w-4 h-4 text-emerald-500" />
              </div>
              <p className="text-xl font-black text-slate-900">
                ${dailyRevenueTrendData.reduce((acc, curr) => acc + curr.revenue, 0).toLocaleString()}
              </p>
              <div className="flex items-center space-x-1 text-[10px] font-bold text-emerald-600">
                <TrendingUp className="w-3 h-3" />
                <span>+14.8% vs last week</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[10px] font-extrabold uppercase tracking-wider">Average Ticket Size</span>
                <ShoppingBag className="w-4 h-4 text-blue-500" />
              </div>
              <p className="text-xl font-black text-slate-900">
                ${(totalRevenue / Math.max(1, totalOrdersToday)).toFixed(2)}
              </p>
              <p className="text-[10px] text-slate-400 font-medium">Per completed table order</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[10px] font-extrabold uppercase tracking-wider">Busiest Rush Hour</span>
                <Clock className="w-4 h-4 text-amber-500" />
              </div>
              <p className="text-xl font-black text-purple-700">7:00 PM - 8:00 PM</p>
              <p className="text-[10px] text-amber-600 font-bold">42 Orders Peak Volume</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[10px] font-extrabold uppercase tracking-wider">Top Category</span>
                <BarChart3 className="w-4 h-4 text-orange-500" />
              </div>
              <p className="text-xl font-black text-orange-600">
                {categoryRevenueData[0]?.name || 'Mains'}
              </p>
              <p className="text-[10px] text-slate-400 font-medium">
                {Math.round(((categoryRevenueData[0]?.value || 0) / Math.max(1, totalRevenue)) * 100)}% of total revenue
              </p>
            </div>
          </div>

          {/* Chart 1: Daily Revenue Trends (7-Day Area Chart) */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="font-extrabold text-slate-900 text-sm">7-Day Daily Revenue & Order Volume Trends</h3>
                  <span className="bg-emerald-100 text-emerald-800 text-[9px] font-black px-2 py-0.5 rounded-full">
                    Live Sync
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Track revenue growth trajectory and ticket volume over the past 7 operating days.
                </p>
              </div>
              <div className="flex items-center space-x-3 text-xs font-bold text-slate-600">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
                  Revenue ($)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-purple-500 inline-block" />
                  Order Count
                </span>
              </div>
            </div>

            <div className="h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyRevenueTrendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fontWeight: 700, fill: '#64748b' }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#64748b' }} unit="$" />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '12px',
                      border: 'none',
                    }}
                    formatter={(value: any, name: any) => [
                      name === 'revenue' ? `$${value.toLocaleString()}` : `${value} orders`,
                      name === 'revenue' ? 'Daily Revenue' : 'Orders Count',
                    ]}
                  />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="revenue"
                    stroke="#f59e0b"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                  />
                  <Area
                    yAxisId="right"
                    type="monotone"
                    dataKey="orders"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    fillOpacity={1}
                    fill="url(#colorOrders)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2 & 3: Peak Order Hours + Category Revenue Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Peak Order Hours Bar Chart */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">Peak Rush Hours (Hourly Order Distribution)</h3>
                <p className="text-xs text-slate-500">
                  Identify high-volume kitchen prep windows to optimize staff station scheduling.
                </p>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={hourlyOrderVolumeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="hour" tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} />
                    <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderRadius: '12px',
                        color: '#fff',
                        fontSize: '12px',
                        border: 'none',
                      }}
                      formatter={(val: any) => [`${val} Orders`, 'Order Volume']}
                    />
                    <Bar dataKey="orders" radius={[6, 6, 0, 0]}>
                      {hourlyOrderVolumeData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.isPeak ? '#8b5cf6' : '#cbd5e1'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100 font-bold text-slate-600">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-600" />
                  Peak Rush Windows (Lunch 12-1pm / Dinner 6-8pm)
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                  Standard Volume
                </span>
              </div>
            </div>

            {/* Food & Beverage Category Revenue Donut Chart */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">Popular Item Categories Revenue Share</h3>
                <p className="text-xs text-slate-500">Proportional revenue split across main menu food & drink categories.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryRevenueData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={80}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {categoryRevenueData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          borderRadius: '12px',
                          color: '#fff',
                          fontSize: '12px',
                          border: 'none',
                        }}
                        formatter={(val: any) => [`$${Number(val).toFixed(2)}`, 'Revenue']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Legend List */}
                <div className="space-y-2 text-xs">
                  {categoryRevenueData.map((cat) => {
                    const pct = Math.round((cat.value / Math.max(1, totalRevenue)) * 100);
                    return (
                      <div key={cat.name} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="flex items-center space-x-2">
                          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                          <span className="font-extrabold text-slate-800">{cat.name}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-black text-slate-900">${cat.value.toFixed(2)}</span>
                          <span className="text-[10px] text-slate-400 font-bold ml-1.5">({pct}%)</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Leaderboard: Top Selling Dishes */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
            <h3 className="font-extrabold text-slate-900 text-sm">Top-Selling Menu Items & Signature Dishes</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
              {topSellingDishesList.map((dish, idx) => (
                <div key={dish.name} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-2 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="w-6 h-6 rounded-full bg-slate-900 text-amber-400 font-black flex items-center justify-center text-xs shadow-xs">
                      #{idx + 1}
                    </span>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                      {dish.category}
                    </span>
                  </div>
                  <div>
                    <p className="font-black text-slate-900 text-xs leading-snug">{dish.name}</p>
                    <p className="text-[10px] text-slate-400 font-medium">{dish.count} units sold today</p>
                  </div>
                  <div className="pt-1 border-t border-slate-200/60 flex items-center justify-between">
                    <span className="text-[10px] text-slate-500 font-bold">Total Revenue:</span>
                    <span className="font-black text-emerald-600">${dish.revenue.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 8: AI COPILOT & INSIGHTS */}
      {activeTab === 'ai' && (
        <div className="space-y-6">
          <AiCopilot
            orders={orders}
            ingredients={ingredients}
            menu={menu}
            tables={tables}
            queue={queue}
            analytics={analytics}
            onUpdateInventoryStock={onUpdateInventoryStock}
            onToggleMenuItem={onToggleMenuItem}
            onUpdateQueueStatus={onUpdateQueueStatus}
            onTriggerAIPredictions={handleRunAi}
          />

          <div className="pt-4 border-t border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Historical Gemini AI Telemetry Logs</h3>
                <p className="text-xs text-slate-500">Automated system bottleneck detection & historical stockout warnings</p>
              </div>
              <button
                onClick={handleRunAi}
                disabled={isAiRunning}
                className="bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs px-4 py-2 rounded-xl shadow-xs"
              >
                Re-run Diagnostic Scan
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {aiInsights.map((insight) => {
                const severityStyles = {
                  high: 'bg-rose-50/80 border-rose-200 text-rose-900',
                  medium: 'bg-amber-50/80 border-amber-200 text-amber-900',
                  low: 'bg-blue-50/80 border-blue-200 text-blue-900',
                }[insight.severity] || 'bg-slate-50 border-slate-200 text-slate-900';

                const severityBadge = {
                  high: 'bg-rose-600 text-white',
                  medium: 'bg-amber-500 text-slate-950 font-bold',
                  low: 'bg-blue-600 text-white',
                }[insight.severity];

                return (
                  <div key={insight.id} className={`p-5 rounded-2xl border shadow-sm space-y-3 ${severityStyles}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2">
                        <Sparkles className="w-4 h-4 text-purple-600 shrink-0" />
                        <h3 className="font-extrabold text-sm">{insight.title}</h3>
                      </div>
                      <span className={`text-[10px] uppercase font-black px-2.5 py-0.5 rounded-full ${severityBadge}`}>
                        {insight.severity} Priority
                      </span>
                    </div>

                    <p className="text-xs leading-relaxed opacity-90">{insight.description}</p>

                    <div className="bg-white/90 p-3 rounded-xl text-xs space-y-1 border border-black/5">
                      <p className="font-extrabold text-slate-900">Recommended Action:</p>
                      <p className="text-slate-700">{insight.recommendedAction}</p>
                      {insight.impactMetric && (
                        <p className="text-purple-700 font-extrabold text-[11px] pt-1">
                          Impact: {insight.impactMetric}
                        </p>
                      )}
                    </div>

                    <p className="text-[10px] opacity-60 text-right">Updated: {insight.timestamp}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 9: STAFF SHIFT MANAGEMENT PANEL */}
      {activeTab === 'shifts' && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 text-white rounded-3xl p-6 border border-purple-500/20 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    Staff Operations & Roster
                  </span>
                  <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-black px-2.5 py-0.5 rounded-full">
                    {shifts.filter((s) => s.status === 'active').length} Staff Currently Active
                  </span>
                </div>
                <h2 className="text-xl font-black text-white tracking-tight">Staff Shift Schedule & Roster Control</h2>
                <p className="text-xs text-slate-300">
                  Plan, schedule, and update upcoming kitchen & front-of-house staff shifts, station assignments, and shift statuses.
                </p>
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                <button
                  onClick={handleOpenAddShiftModal}
                  className="flex items-center space-x-2 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 text-xs font-black px-4 py-2.5 rounded-2xl shadow-md transition-all border border-amber-300/30"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Schedule New Shift</span>
                </button>
              </div>
            </div>

            {/* KPI Summary Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="bg-white/10 p-3 rounded-2xl border border-white/10 space-y-0.5">
                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block">Total Scheduled</span>
                <p className="text-lg font-black text-white">{shifts.length} Shifts</p>
                <p className="text-[10px] text-slate-400">All dates</p>
              </div>

              <div className="bg-white/10 p-3 rounded-2xl border border-white/10 space-y-0.5">
                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block">Currently On-Duty</span>
                <p className="text-lg font-black text-emerald-400">
                  {shifts.filter((s) => s.status === 'active').length} Active
                </p>
                <p className="text-[10px] text-emerald-300 font-bold">On floor/station</p>
              </div>

              <div className="bg-white/10 p-3 rounded-2xl border border-white/10 space-y-0.5">
                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block">Coverage Breakdown</span>
                <p className="text-lg font-black text-amber-300">
                  {shifts.filter((s) => ['Head Chef', 'Sous Chef', 'Line Cook', 'Dishwasher'].includes(s.role)).length} K Kitchen / {shifts.filter((s) => ['Waitstaff', 'Bartender', 'Host'].includes(s.role)).length} FOH
                </p>
                <p className="text-[10px] text-slate-400">Station ratio</p>
              </div>

              <div className="bg-white/10 p-3 rounded-2xl border border-white/10 space-y-0.5">
                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block">Confirmation Rate</span>
                <p className="text-lg font-black text-purple-300">
                  {shifts.length > 0
                    ? Math.round((shifts.filter((s) => s.status === 'confirmed' || s.status === 'active').length / shifts.length) * 100)
                    : 0}%
                </p>
                <p className="text-[10px] text-purple-200">Confirmed or active</p>
              </div>
            </div>
          </div>

          {/* Controls & Search Filter Bar */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3">
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search staff name, station, role, or notes..."
                  value={shiftSearch}
                  onChange={(e) => setShiftSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Date Filter Pills */}
              <div className="flex items-center space-x-1 overflow-x-auto no-scrollbar">
                {['All', 'Today', 'Tomorrow'].map((dateOpt) => (
                  <button
                    key={dateOpt}
                    onClick={() => setShiftDateFilter(dateOpt)}
                    className={`px-3 py-1.8 rounded-xl font-extrabold transition-all border ${
                      shiftDateFilter === dateOpt
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    {dateOpt === 'Today' ? 'Today (Jul 26)' : dateOpt === 'Tomorrow' ? 'Tomorrow (Jul 27)' : 'All Dates'}
                  </button>
                ))}
              </div>

              {/* Role Dropdown */}
              <div className="flex items-center space-x-2 shrink-0">
                <Filter className="w-4 h-4 text-slate-400" />
                <select
                  value={shiftRoleFilter}
                  onChange={(e) => setShiftRoleFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-800 text-xs"
                >
                  <option value="All">All Staff Roles</option>
                  <option value="Head Chef">Head Chef</option>
                  <option value="Sous Chef">Sous Chef</option>
                  <option value="Line Cook">Line Cook</option>
                  <option value="Waitstaff">Waitstaff</option>
                  <option value="Bartender">Bartender</option>
                  <option value="Host">Host</option>
                  <option value="Dishwasher">Dishwasher</option>
                </select>
              </div>
            </div>
          </div>

          {/* Shifts Grid / List */}
          {shifts
            .filter((s) => {
              const matchesSearch =
                s.staffName.toLowerCase().includes(shiftSearch.toLowerCase()) ||
                s.station.toLowerCase().includes(shiftSearch.toLowerCase()) ||
                s.role.toLowerCase().includes(shiftSearch.toLowerCase()) ||
                (s.notes || '').toLowerCase().includes(shiftSearch.toLowerCase());

              const matchesRole = shiftRoleFilter === 'All' || s.role === shiftRoleFilter;

              let matchesDate = true;
              if (shiftDateFilter === 'Today') {
                matchesDate = s.date === '2026-07-26';
              } else if (shiftDateFilter === 'Tomorrow') {
                matchesDate = s.date === '2026-07-27';
              }

              return matchesSearch && matchesRole && matchesDate;
            })
            .length === 0 ? (
            <div className="bg-white rounded-2xl p-10 text-center border border-slate-200 space-y-3">
              <Users className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="font-extrabold text-slate-700 text-sm">No staff shifts match your filter criteria.</p>
              <button
                onClick={() => {
                  setShiftSearch('');
                  setShiftRoleFilter('All');
                  setShiftDateFilter('All');
                }}
                className="text-purple-600 font-extrabold text-xs hover:underline"
              >
                Reset Shift Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {shifts
                .filter((s) => {
                  const matchesSearch =
                    s.staffName.toLowerCase().includes(shiftSearch.toLowerCase()) ||
                    s.station.toLowerCase().includes(shiftSearch.toLowerCase()) ||
                    s.role.toLowerCase().includes(shiftSearch.toLowerCase()) ||
                    (s.notes || '').toLowerCase().includes(shiftSearch.toLowerCase());

                  const matchesRole = shiftRoleFilter === 'All' || s.role === shiftRoleFilter;

                  let matchesDate = true;
                  if (shiftDateFilter === 'Today') {
                    matchesDate = s.date === '2026-07-26';
                  } else if (shiftDateFilter === 'Tomorrow') {
                    matchesDate = s.date === '2026-07-27';
                  }

                  return matchesSearch && matchesRole && matchesDate;
                })
                .map((shift) => {
                  const roleColors: Record<string, string> = {
                    'Head Chef': 'bg-amber-100 text-amber-900 border-amber-200',
                    'Sous Chef': 'bg-orange-100 text-orange-900 border-orange-200',
                    'Line Cook': 'bg-red-100 text-red-900 border-red-200',
                    Waitstaff: 'bg-blue-100 text-blue-900 border-blue-200',
                    Bartender: 'bg-purple-100 text-purple-900 border-purple-200',
                    Host: 'bg-emerald-100 text-emerald-900 border-emerald-200',
                    Dishwasher: 'bg-slate-100 text-slate-800 border-slate-200',
                  };

                  const statusBadges: Record<string, { bg: string; text: string }> = {
                    active: { bg: 'bg-emerald-500 text-slate-950 font-black animate-pulse', text: 'On Duty (Active)' },
                    confirmed: { bg: 'bg-blue-600 text-white font-black', text: 'Confirmed' },
                    scheduled: { bg: 'bg-amber-500 text-slate-950 font-extrabold', text: 'Scheduled' },
                    completed: { bg: 'bg-slate-200 text-slate-700 font-bold', text: 'Completed' },
                    cancelled: { bg: 'bg-rose-100 text-rose-800 font-bold', text: 'Cancelled' },
                  };

                  const currentStatusInfo = statusBadges[shift.status] || { bg: 'bg-slate-100 text-slate-800', text: shift.status };

                  return (
                    <div
                      key={shift.id}
                      className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-all space-y-3 flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        {/* Header: Staff Name + Avatar & Role */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-2xl bg-slate-900 text-amber-400 font-black flex items-center justify-center text-sm shadow-sm shrink-0">
                              {shift.staffName
                                .split(' ')
                                .map((n) => n[0])
                                .join('')
                                .toUpperCase()}
                            </div>
                            <div>
                              <h3 className="font-black text-slate-900 text-sm leading-tight">{shift.staffName}</h3>
                              <span
                                className={`inline-block mt-0.5 text-[10px] font-black px-2 py-0.5 rounded-full border ${
                                  roleColors[shift.role] || 'bg-slate-100 text-slate-800 border-slate-200'
                                }`}
                              >
                                {shift.role}
                              </span>
                            </div>
                          </div>

                          <button
                            onClick={() => handleCycleShiftStatus(shift.id)}
                            className={`text-[10px] px-2.5 py-1 rounded-xl shadow-2xs transition-all shrink-0 ${currentStatusInfo.bg}`}
                            title="Click to cycle shift status"
                          >
                            {currentStatusInfo.text}
                          </button>
                        </div>

                        {/* Station & Timing Info */}
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1.5 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500 font-bold text-[11px] flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-slate-400" />
                              Station:
                            </span>
                            <span className="font-extrabold text-slate-900">{shift.station}</span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-slate-500 font-bold text-[11px] flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              Shift Date:
                            </span>
                            <span className="font-extrabold text-slate-900">
                              {shift.date === '2026-07-26' ? 'Today (Jul 26)' : shift.date === '2026-07-27' ? 'Tomorrow (Jul 27)' : shift.date}
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-slate-500 font-bold text-[11px] flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                              Time Slot:
                            </span>
                            <span className="font-black text-purple-700">
                              {shift.startTime} - {shift.endTime}
                            </span>
                          </div>
                        </div>

                        {/* Notes */}
                        {shift.notes && (
                          <div className="text-[11px] text-slate-600 font-medium bg-purple-50/60 p-2.5 rounded-xl border border-purple-100 flex items-start gap-1.5">
                            <Briefcase className="w-3.5 h-3.5 text-purple-600 shrink-0 mt-0.5" />
                            <span>{shift.notes}</span>
                          </div>
                        )}
                      </div>

                      {/* Card Actions Footer */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                        <button
                          onClick={() => handleCycleShiftStatus(shift.id)}
                          className="flex items-center space-x-1 text-slate-600 hover:text-slate-900 font-bold text-xs bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-xl transition-colors"
                        >
                          <RefreshCw className="w-3 h-3 text-slate-500" />
                          <span>Status Toggle</span>
                        </button>

                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => handleOpenEditShiftModal(shift)}
                            className="p-1.5 text-slate-600 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition-colors"
                            title="Edit shift details"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteShift(shift.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                            title="Delete shift"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {/* Modal to Add New Menu Item */}
      {showAddMenuModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-base">Add New Menu Item</h3>
              <button onClick={() => setShowAddMenuModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const newItem: MenuItem = {
                  id: `menu-${Date.now()}`,
                  name: newMenuName || 'Special Item',
                  category: newMenuCategory,
                  price: parseFloat(newMenuPrice) || 15.99,
                  description: newMenuDesc || 'Freshly prepared specialty dish.',
                  imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500',
                  prepStation: newMenuStation,
                  prepTimeMinutes: 12,
                  recipe: [],
                  isAvailable: true,
                };
                menu.push(newItem);
                setShowAddMenuModal(false);
                setNewMenuName('');
                setNewMenuDesc('');
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="block font-bold text-slate-700 mb-1">Dish Name</label>
                <input
                  type="text"
                  required
                  value={newMenuName}
                  onChange={(e) => setNewMenuName(e.target.value)}
                  placeholder="e.g. Wagyu Ribeye Steak"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={newMenuCategory}
                    onChange={(e) => setNewMenuCategory(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800"
                  >
                    <option value="Mains">Mains</option>
                    <option value="Appetizers">Appetizers</option>
                    <option value="Sides">Sides</option>
                    <option value="Desserts">Desserts</option>
                    <option value="Drinks">Drinks</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newMenuPrice}
                    onChange={(e) => setNewMenuPrice(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Kitchen Prep Station</label>
                <select
                  value={newMenuStation}
                  onChange={(e) => setNewMenuStation(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800"
                >
                  <option value="Grill">Grill</option>
                  <option value="Sauté">Sauté</option>
                  <option value="Fry">Fry</option>
                  <option value="Pantry/Cold">Pantry/Cold</option>
                  <option value="Bar">Bar</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  value={newMenuDesc}
                  onChange={(e) => setNewMenuDesc(e.target.value)}
                  placeholder="Flavor profile, key ingredients..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-slate-900 text-white font-extrabold py-3 rounded-2xl hover:bg-slate-800 transition-colors shadow-md text-xs"
              >
                Add Dish to Menu Catalogue
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal to Add / Edit Staff Shift Schedule */}
      {showShiftModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">
                  {editingShiftId ? 'Edit Staff Shift Schedule' : 'Schedule New Staff Shift'}
                </h3>
                <p className="text-xs text-slate-500">Assign staff role, station, date, and shift time slot</p>
              </div>
              <button onClick={() => setShowShiftModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveShift} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Staff Member Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Elena Rostova"
                  value={shiftFormName}
                  onChange={(e) => setShiftFormName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold text-slate-900 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Staff Role</label>
                  <select
                    value={shiftFormRole}
                    onChange={(e) => setShiftFormRole(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800 focus:outline-none focus:border-purple-500"
                  >
                    <option value="Head Chef">Head Chef</option>
                    <option value="Sous Chef">Sous Chef</option>
                    <option value="Line Cook">Line Cook</option>
                    <option value="Waitstaff">Waitstaff</option>
                    <option value="Bartender">Bartender</option>
                    <option value="Host">Host</option>
                    <option value="Dishwasher">Dishwasher</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Assigned Station</label>
                  <select
                    value={shiftFormStation}
                    onChange={(e) => setShiftFormStation(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800 focus:outline-none focus:border-purple-500"
                  >
                    <option value="Grill">Grill</option>
                    <option value="Sauté">Sauté</option>
                    <option value="Fry">Fry</option>
                    <option value="Pantry/Cold">Pantry/Cold</option>
                    <option value="Bar">Bar</option>
                    <option value="Main Dining">Main Dining</option>
                    <option value="Patio">Patio</option>
                    <option value="Front Desk">Front Desk</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Shift Date</label>
                  <input
                    type="date"
                    required
                    value={shiftFormDate}
                    onChange={(e) => setShiftFormDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold text-slate-900 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Start Time</label>
                  <input
                    type="text"
                    required
                    placeholder="08:00 AM"
                    value={shiftFormStartTime}
                    onChange={(e) => setShiftFormStartTime(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold text-slate-900 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">End Time</label>
                  <input
                    type="text"
                    required
                    placeholder="04:00 PM"
                    value={shiftFormEndTime}
                    onChange={(e) => setShiftFormEndTime(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold text-slate-900 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Shift Status</label>
                <select
                  value={shiftFormStatus}
                  onChange={(e) => setShiftFormStatus(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800 focus:outline-none focus:border-purple-500"
                >
                  <option value="scheduled">Scheduled</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="active">Active (On Duty)</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Shift Notes / Station Instructions</label>
                <textarea
                  value={shiftFormNotes}
                  onChange={(e) => setShiftFormNotes(e.target.value)}
                  placeholder="e.g. Lead server for private dining room, or prep lead for lunch rush..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium focus:outline-none focus:border-purple-500"
                  rows={2}
                />
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowShiftModal(false)}
                  className="flex-1 bg-slate-100 text-slate-700 font-extrabold py-2.5 rounded-2xl hover:bg-slate-200 transition-colors text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-purple-600 hover:bg-purple-500 text-white font-extrabold py-2.5 rounded-2xl transition-colors shadow-md text-xs"
                >
                  {editingShiftId ? 'Save Changes' : 'Create Shift'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
