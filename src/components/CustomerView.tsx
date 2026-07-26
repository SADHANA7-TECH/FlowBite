import React, { useState } from 'react';
import { MenuItem, Order, QueueEntry, DiningTable, Ingredient, OrderStatus } from '../types';
import { AiSuggestionsSection } from './AiSuggestionsSection';
import {
  ShoppingBag,
  Plus,
  Minus,
  CheckCircle2,
  Clock,
  Sparkles,
  AlertCircle,
  PhoneCall,
  Users,
  Search,
  ChevronRight,
  Info,
  Utensils,
  MapPin,
  Check,
  Filter,
  X,
  Flame,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';

interface CustomerViewProps {
  menu: MenuItem[];
  orders: Order[];
  ingredients?: Ingredient[];
  tables?: DiningTable[];
  queue?: QueueEntry[];
  onPlaceOrder: (data: {
    type: 'dine-in' | 'pickup' | 'qr-table';
    tableNumber?: number;
    customerName: string;
    customerPhone?: string;
    notes?: string;
    items: { menuItemId: string; quantity: number; specialInstructions?: string }[];
  }) => Promise<void>;
  onJoinQueue: (data: { customerName: string; phone: string; partySize: number; seatingPreference?: string }) => Promise<void>;
  myActiveOrderId?: string;
}

interface CartItem {
  quantity: number;
  notes: string;
}

export const CustomerView: React.FC<CustomerViewProps> = ({
  menu,
  orders,
  ingredients = [],
  tables = [],
  queue = [],
  onPlaceOrder,
  onJoinQueue,
  myActiveOrderId,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedDietary, setSelectedDietary] = useState<string>('All');
  const [orderType, setOrderType] = useState<'qr-table' | 'dine-in' | 'pickup'>('qr-table');
  const [tableNum, setTableNum] = useState<number>(1);
  const [customerName, setCustomerName] = useState<string>('Alex Johnson');
  const [customerPhone, setCustomerPhone] = useState<string>('+1 (555) 321-7654');
  const [orderNotes, setOrderNotes] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Cart state
  const [cart, setCart] = useState<Record<string, CartItem>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [orderPlacedSuccess, setOrderPlacedSuccess] = useState<Order | null>(null);

  // Queue State
  const [showQueueModal, setShowQueueModal] = useState<boolean>(false);
  const [queueName, setQueueName] = useState<string>('Alex Johnson');
  const [queuePhone, setQueuePhone] = useState<string>('+1 (555) 321-7654');
  const [queuePartySize, setQueuePartySize] = useState<number>(2);
  const [queuePref, setQueuePref] = useState<string>('Indoor');
  const [myQueueEntry, setMyQueueEntry] = useState<QueueEntry | null>(null);
  const [queueSubmittedMsg, setQueueSubmittedMsg] = useState<string>('');

  // Call Server Alert
  const [serverCalled, setServerCalled] = useState<boolean>(false);

  const categories = ['All', 'Mains', 'Appetizers', 'Sides', 'Desserts', 'Drinks'];
  const dietaryOptions = ['All', 'Chef Special', 'Vegetarian', 'Vegan', 'Gluten-Free'];

  // Calculate dynamic availability status for a menu item
  const getItemAvailability = (item: MenuItem): 'Available' | 'Limited Stock' | 'Temporarily Unavailable' => {
    if (!item.isAvailable) return 'Temporarily Unavailable';
    if (!ingredients || ingredients.length === 0) return 'Available';

    let isDepleted = false;
    let isLow = false;

    for (const recipeItem of item.recipe) {
      const ing = ingredients.find((i) => i.id === recipeItem.ingredientId);
      if (ing) {
        if (ing.currentStock <= 0) {
          isDepleted = true;
          break;
        }
        if (ing.currentStock <= ing.minThreshold) {
          isLow = true;
        }
      }
    }

    if (isDepleted) return 'Temporarily Unavailable';
    if (isLow) return 'Limited Stock';
    return 'Available';
  };

  const isItemOrderable = (item: MenuItem): boolean => {
    return getItemAvailability(item) !== 'Temporarily Unavailable';
  };

  const filteredMenu = menu.filter((item) => {
    const matchesCat = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesDietary =
      selectedDietary === 'All' ||
      (item.dietaryTags && item.dietaryTags.some((tag) => tag.toLowerCase().includes(selectedDietary.toLowerCase())));
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesDietary && matchesSearch;
  });

  const addToCart = (item: MenuItem) => {
    if (!isItemOrderable(item)) return;
    setCart((prev) => {
      const existing = prev[item.id] || { quantity: 0, notes: '' };
      return { ...prev, [item.id]: { ...existing, quantity: existing.quantity + 1 } };
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart((prev) => {
      const existing = prev[itemId];
      if (!existing) return prev;
      if (existing.quantity <= 1) {
        const copy = { ...prev };
        delete copy[itemId];
        return copy;
      }
      return { ...prev, [itemId]: { ...existing, quantity: existing.quantity - 1 } };
    });
  };

  const updateItemNotes = (itemId: string, notes: string) => {
    setCart((prev) => {
      const existing = prev[itemId];
      if (!existing) return prev;
      return { ...prev, [itemId]: { ...existing, notes } };
    });
  };

  const cartSubtotal = Object.entries(cart).reduce((sum, [id, data]: [string, CartItem]) => {
    const item = menu.find((m) => m.id === id);
    return sum + (item ? item.price * data.quantity : 0);
  }, 0);

  const cartTax = cartSubtotal * 0.08;
  const cartTotal = cartSubtotal + cartTax;

  const handleCheckout = async () => {
    const cartItems = Object.entries(cart).map(([menuItemId, data]: [string, CartItem]) => ({
      menuItemId,
      quantity: data.quantity,
      specialInstructions: data.notes,
    }));

    if (cartItems.length === 0) return;

    setIsSubmitting(true);
    try {
      await onPlaceOrder({
        type: orderType,
        tableNumber: orderType !== 'pickup' ? tableNum : undefined,
        customerName: customerName.trim() || 'Guest',
        customerPhone: customerPhone.trim(),
        notes: orderNotes,
        items: cartItems,
      });
      setCart({});
      setOrderNotes('');
      const latestOrder = orders[0];
      if (latestOrder) setOrderPlacedSuccess(latestOrder);
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJoinQueueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!queueName) return;
    try {
      await onJoinQueue({
        customerName: queueName,
        phone: queuePhone,
        partySize: queuePartySize,
        seatingPreference: queuePref,
      });

      const newEntry: QueueEntry = {
        id: `queue-${Date.now()}`,
        customerName: queueName,
        phone: queuePhone,
        partySize: queuePartySize,
        joinedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        estimatedWaitMinutes: Math.max(10, (queue.length + 1) * 7),
        status: 'waiting',
        seatingPreference: queuePref as any,
      };
      setMyQueueEntry(newEntry);

      setQueueSubmittedMsg(`Joined Table Waitlist! You are #${queue.length + 1} in line (~${newEntry.estimatedWaitMinutes} mins wait). SMS notification active!`);
      setTimeout(() => {
        setShowQueueModal(false);
        setQueueSubmittedMsg('');
      }, 3500);
    } catch (err) {
      alert((err as Error).message);
    }
  };

  // Find active tracked order
  const activeTrackedOrder = orderPlacedSuccess || orders.find((o) => o.id === myActiveOrderId) || orders[0];

  // Helper for tracking step status
  const getOrderStepState = (currentStatus: OrderStatus, step: 'received' | 'accepted' | 'preparing' | 'ready' | 'served') => {
    const statusHierarchy: Record<OrderStatus, number> = {
      placed: 1,
      accepted: 2,
      preparing: 3,
      cooking: 3,
      ready: 4,
      served: 5,
      completed: 5,
      cancelled: 0,
    };

    const stepHierarchy: Record<string, number> = {
      received: 1,
      accepted: 2,
      preparing: 3,
      ready: 4,
      served: 5,
    };

    const currentLevel = statusHierarchy[currentStatus] || 1;
    const stepLevel = stepHierarchy[step];

    if (currentLevel > stepLevel) return 'completed';
    if (currentLevel === stepLevel) return 'active';
    return 'pending';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Banner Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-zinc-900 rounded-3xl p-6 text-white shadow-xl border border-slate-800 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2 max-w-2xl relative z-10">
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center space-x-1 bg-orange-500/20 text-orange-400 border border-orange-500/30 text-[11px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
              <Sparkles className="w-3 h-3 text-orange-400" />
              <span>Realtime Digital Menu & Orders</span>
            </span>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
            Order Fresh & Track Live Kitchen Progress
          </h1>
          <p className="text-xs sm:text-sm text-slate-300">
            Real-time kitchen inventory sync. Out-of-stock items are automatically marked as unavailable.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 relative z-10">
          <button
            onClick={() => setShowQueueModal(true)}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-extrabold px-4 py-2.5 rounded-2xl transition-all shadow-md border border-blue-400/30"
          >
            <Users className="w-4 h-4" />
            <span>Join Table Waitlist</span>
          </button>

          <button
            onClick={() => {
              setServerCalled(true);
              setTimeout(() => setServerCalled(false), 4000);
            }}
            className={`flex items-center space-x-2 text-xs font-extrabold px-4 py-2.5 rounded-2xl transition-all border shadow-sm ${
              serverCalled
                ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-emerald-500/20'
                : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-500/40'
            }`}
          >
            <PhoneCall className="w-4 h-4 text-amber-400" />
            <span>{serverCalled ? 'Waiter Notified at Table!' : 'Call Waiter to Table'}</span>
          </button>
        </div>
      </div>

      {/* Live Waitlist Queue Widget (If customer joined waitlist) */}
      {(myQueueEntry || queue.length > 0) && (
        <div className="bg-blue-950/80 border border-blue-800 text-blue-100 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-lg shadow-sm">
              #{myQueueEntry ? 1 : queue.length}
            </div>
            <div>
              <p className="text-xs font-bold text-blue-300 uppercase tracking-wider">Live Waitlist Queue Position</p>
              <p className="text-sm font-extrabold text-white">
                {myQueueEntry ? `${myQueueEntry.customerName} (Party of ${myQueueEntry.partySize})` : `${queue.length} Parties Currently Waiting`}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4 text-xs">
            <div className="bg-blue-900/80 px-3 py-1.5 rounded-xl border border-blue-700/60 flex items-center space-x-1.5">
              <Clock className="w-3.5 h-3.5 text-blue-300" />
              <span>Est. Wait: <strong className="text-white">~{myQueueEntry ? myQueueEntry.estimatedWaitMinutes : queue.length * 8} Mins</strong></span>
            </div>
            <button
              onClick={() => setShowQueueModal(true)}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-3 py-1.5 rounded-xl transition-colors"
            >
              Queue Details
            </button>
          </div>
        </div>
      )}

      {/* Main Grid Layout: Left Menu (7 cols) vs Right Order Basket & Tracker (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Digital Menu & Filtering */}
        <div className="lg:col-span-7 space-y-6">
          {/* AI Food & Drink Sommelier Suggestions */}
          <AiSuggestionsSection
            menu={menu}
            cartItemIds={Object.keys(cart)}
            onAddToCart={addToCart}
          />

          {/* Controls Header: Search + Category + Dietary Pills */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3">
            {/* Search Bar */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search dishes, ingredients, drinks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 text-xs font-medium pl-10 pr-9 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Category Filter Pills */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                  Food Categories
                </span>
                <span className="text-[11px] text-slate-500 font-bold">{filteredMenu.length} items shown</span>
              </div>
              <div className="flex items-center space-x-2 overflow-x-auto pb-1 text-xs no-scrollbar">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3.5 py-1.8 rounded-xl font-bold whitespace-nowrap transition-all ${
                      selectedCategory === cat
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200/80'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Dietary Filter Pills */}
            <div className="pt-2 border-t border-slate-100 flex items-center space-x-2 overflow-x-auto text-[11px]">
              <span className="text-slate-400 font-bold shrink-0 flex items-center">
                <Filter className="w-3 h-3 mr-1" /> Tags:
              </span>
              {dietaryOptions.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSelectedDietary(tag)}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                    selectedDietary === tag
                      ? 'bg-orange-500 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Menu Items Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredMenu.map((item) => {
              const inCartQty = cart[item.id]?.quantity || 0;
              const availability = getItemAvailability(item);
              const orderable = availability !== 'Temporarily Unavailable';

              return (
                <div
                  key={item.id}
                  className={`bg-white rounded-2xl border transition-all overflow-hidden flex flex-col justify-between shadow-xs ${
                    orderable
                      ? 'border-slate-200 hover:shadow-md hover:border-slate-300'
                      : 'border-slate-200 opacity-75 bg-slate-50'
                  }`}
                >
                  <div>
                    {/* Food Image with Badges */}
                    <div className="relative h-44 bg-slate-100 overflow-hidden">
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className={`w-full h-full object-cover transition-transform duration-300 ${!orderable ? 'grayscale filter brightness-90' : 'hover:scale-105'}`}
                        referrerPolicy="no-referrer"
                      />

                      {/* Availability Status Badge */}
                      <div className="absolute top-2 right-2">
                        {availability === 'Available' && (
                          <span className="bg-emerald-600 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm flex items-center space-x-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Available</span>
                          </span>
                        )}
                        {availability === 'Limited Stock' && (
                          <span className="bg-amber-500 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm flex items-center space-x-1 animate-pulse">
                            <AlertCircle className="w-3 h-3" />
                            <span>Limited Stock</span>
                          </span>
                        )}
                        {availability === 'Temporarily Unavailable' && (
                          <span className="bg-rose-600 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-md flex items-center space-x-1">
                            <X className="w-3 h-3" />
                            <span>Temporarily Unavailable</span>
                          </span>
                        )}
                      </div>

                      {/* Popular / Chef Special Badge */}
                      {item.isPopular && orderable && (
                        <span className="absolute top-2 left-2 bg-slate-900/90 backdrop-blur-xs text-amber-400 text-[10px] font-extrabold px-2.5 py-1 rounded-lg border border-amber-500/30 shadow flex items-center space-x-1">
                          <Flame className="w-3 h-3 text-amber-400" />
                          <span>Chef Special</span>
                        </span>
                      )}

                      {/* Price Badge */}
                      <span className="absolute bottom-2 left-2 bg-slate-900/90 text-white text-xs font-black px-2.5 py-1 rounded-lg backdrop-blur-xs">
                        ${item.price.toFixed(2)}
                      </span>
                    </div>

                    {/* Info Body */}
                    <div className="p-4 space-y-2">
                      <h3 className="font-bold text-slate-900 text-sm leading-snug">{item.name}</h3>
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{item.description}</p>

                      {/* Prep Station & Time */}
                      <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400">
                        <span className="bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded">
                          {item.prepStation}
                        </span>
                        <span className="flex items-center text-slate-500 font-semibold">
                          <Clock className="w-3 h-3 mr-1 text-slate-400" /> ~{item.prepTimeMinutes} mins
                        </span>
                      </div>

                      {/* Dietary Tags */}
                      {item.dietaryTags && item.dietaryTags.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {item.dietaryTags.map((tag) => (
                            <span key={tag} className="text-[10px] bg-slate-100 text-slate-600 font-medium px-2 py-0.5 rounded-md">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Add to Order Button / Quantity Adjuster */}
                  <div className="p-4 pt-0">
                    {!orderable ? (
                      <button
                        disabled
                        className="w-full py-2.5 rounded-xl text-xs font-extrabold bg-slate-200 text-slate-400 cursor-not-allowed flex items-center justify-center space-x-1.5"
                        title="Item is out of stock in kitchen inventory"
                      >
                        <X className="w-3.5 h-3.5 text-rose-500" />
                        <span>Temporarily Unavailable (Sold Out)</span>
                      </button>
                    ) : inCartQty > 0 ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between bg-orange-50 border border-orange-200 rounded-xl p-1.5">
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="w-7 h-7 rounded-lg bg-white border border-orange-300 flex items-center justify-center text-orange-600 font-bold hover:bg-orange-100 transition-colors"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-xs font-black text-orange-900">{inCartQty} in Basket</span>
                          <button
                            onClick={() => addToCart(item)}
                            className="w-7 h-7 rounded-lg bg-orange-500 text-white flex items-center justify-center font-bold hover:bg-orange-600 shadow-xs transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <input
                          type="text"
                          placeholder="Note e.g. Extra sauce..."
                          value={cart[item.id]?.notes || ''}
                          onChange={(e) => updateItemNotes(item.id, e.target.value)}
                          className="w-full text-[11px] bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:border-orange-400"
                        />
                      </div>
                    ) : (
                      <button
                        onClick={() => addToCart(item)}
                        className="w-full py-2.5 rounded-xl text-xs font-extrabold bg-slate-900 hover:bg-slate-800 text-white shadow-xs transition-all flex items-center justify-center space-x-1.5"
                      >
                        <Plus className="w-3.5 h-3.5 text-orange-400" />
                        <span>Add to Order Basket</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Order Basket & Live Order Tracking Tracker */}
        <div className="lg:col-span-5 space-y-6">
          {/* Order Basket Form */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <ShoppingBag className="w-5 h-5 text-orange-500" />
                <h2 className="font-extrabold text-slate-900 text-base">Your Order Basket</h2>
              </div>
              <span className="text-xs font-extrabold bg-orange-50 text-orange-800 border border-orange-200 px-2.5 py-1 rounded-full">
                {Object.values(cart).reduce((sum: number, item: CartItem) => sum + item.quantity, 0)} Items
              </span>
            </div>

            {/* Order Type Selector */}
            <div className="grid grid-cols-3 gap-2 text-xs font-bold">
              <button
                type="button"
                onClick={() => setOrderType('qr-table')}
                className={`py-2 px-2 rounded-xl border text-center transition-all ${
                  orderType === 'qr-table'
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                QR Table
              </button>
              <button
                type="button"
                onClick={() => setOrderType('dine-in')}
                className={`py-2 px-2 rounded-xl border text-center transition-all ${
                  orderType === 'dine-in'
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                Dine-In
              </button>
              <button
                type="button"
                onClick={() => setOrderType('pickup')}
                className={`py-2 px-2 rounded-xl border text-center transition-all ${
                  orderType === 'pickup'
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                Pickup
              </button>
            </div>

            {/* Customer Name & Table Selection */}
            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Customer Name</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 font-semibold text-slate-900 focus:outline-none focus:border-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mobile Phone</label>
                  <input
                    type="text"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 font-semibold text-slate-900 focus:outline-none focus:border-slate-900"
                  />
                </div>
              </div>

              {/* Table Selection for Dine-In & QR Order */}
              {orderType !== 'pickup' && (
                <div className="space-y-2 pt-1 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <label className="font-extrabold text-slate-800 text-xs flex items-center">
                      <MapPin className="w-3.5 h-3.5 mr-1 text-orange-500" />
                      Select Dining Table (Table #{tableNum} Selected)
                    </label>
                    <span className="text-[10px] text-slate-400 font-bold">Interactive Floor Grid</span>
                  </div>

                  {/* Table Selector Grid */}
                  <div className="grid grid-cols-4 gap-2">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((tNum) => {
                      const matchedTable = tables.find((t) => t.tableNumber === tNum);
                      const isOccupied = matchedTable?.status === 'seated' || matchedTable?.status === 'ordered';
                      const isSelected = tableNum === tNum;

                      return (
                        <button
                          key={tNum}
                          type="button"
                          onClick={() => setTableNum(tNum)}
                          className={`p-2 rounded-xl border text-center transition-all flex flex-col items-center justify-center ${
                            isSelected
                              ? 'bg-orange-500 text-white border-orange-600 font-extrabold shadow-sm scale-102'
                              : isOccupied
                              ? 'bg-amber-50 border-amber-200 text-amber-900 hover:bg-amber-100'
                              : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          <span className="text-xs font-black">Table #{tNum}</span>
                          <span className={`text-[9px] ${isSelected ? 'text-orange-100' : 'text-slate-400'}`}>
                            {matchedTable ? `${matchedTable.capacity} seats` : '4 seats'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Cart Items List */}
            {Object.keys(cart).length === 0 ? (
              <div className="py-8 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                <ShoppingBag className="w-8 h-8 mx-auto text-slate-300" />
                <p className="text-xs font-bold text-slate-400 mt-2">Your basket is empty</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Select menu items above to build your order.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {Object.entries(cart).map(([itemId, data]: [string, CartItem]) => {
                  const item = menu.find((m) => m.id === itemId);
                  if (!item) return null;
                  return (
                    <div key={itemId} className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold text-slate-900">{item.name}</p>
                          <p className="text-slate-500 text-[11px]">${item.price.toFixed(2)} × {data.quantity}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="font-black text-slate-900">${(item.price * data.quantity).toFixed(2)}</span>
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => removeFromCart(itemId)}
                              className="w-5 h-5 rounded bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold flex items-center justify-center text-xs"
                            >
                              -
                            </button>
                            <button
                              onClick={() => addToCart(item)}
                              className="w-5 h-5 rounded bg-slate-900 hover:bg-slate-800 text-white font-bold flex items-center justify-center text-xs"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                      {data.notes && (
                        <p className="text-[10px] text-orange-700 bg-orange-50 px-2 py-0.5 rounded border border-orange-200">
                          Instructions: {data.notes}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Total Summary & Place Order Button */}
            {Object.keys(cart).length > 0 && (
              <div className="pt-3 border-t border-slate-100 space-y-3">
                <div>
                  <input
                    type="text"
                    placeholder="Overall order notes e.g. Allergy alerts, timing..."
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-slate-900"
                  />
                </div>

                <div className="space-y-1 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="font-bold text-slate-900">${cartSubtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>State Tax (8%)</span>
                    <span className="font-bold text-slate-900">${cartTax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-slate-200 font-extrabold text-slate-900 text-sm">
                    <span>Total Amount</span>
                    <span className="text-orange-600 text-base">${cartTotal.toFixed(2)}</span>
                  </div>
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={isSubmitting}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold py-3 rounded-2xl shadow-md transition-all flex items-center justify-center space-x-2 text-sm disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Clock className="w-4 h-4 animate-spin text-orange-400" />
                  ) : (
                    <>
                      <span>Transmit Order to Kitchen</span>
                      <ChevronRight className="w-4 h-4 text-orange-400" />
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Real-Time Kitchen Tracker with 5 Required Steps */}
          {activeTrackedOrder && (
            <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-extrabold text-orange-400 uppercase tracking-wider">
                      Live Kitchen Status Tracker
                    </span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  </div>
                  <h3 className="text-lg font-black text-white">{activeTrackedOrder.orderNumber}</h3>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400">Current Status</span>
                  <p className="text-xs font-black capitalize text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 rounded-lg">
                    {activeTrackedOrder.status}
                  </p>
                </div>
              </div>

              {/* Progress Stepper across 5 Required Steps */}
              <div className="space-y-3 py-1">
                {[
                  { id: 'received', label: 'Order Received' },
                  { id: 'accepted', label: 'Accepted by Kitchen' },
                  { id: 'preparing', label: 'Preparing & Cooking' },
                  { id: 'ready', label: 'Ready for Table' },
                  { id: 'served', label: 'Served / Picked Up' },
                ].map((stepObj, idx) => {
                  const state = getOrderStepState(activeTrackedOrder.status, stepObj.id as any);
                  const isDone = state === 'completed' || state === 'active';

                  return (
                    <div key={stepObj.id} className="flex items-center space-x-3 text-xs">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs transition-all shrink-0 ${
                          state === 'active'
                            ? 'bg-orange-500 text-white shadow-lg ring-4 ring-orange-500/20'
                            : state === 'completed'
                            ? 'bg-emerald-500 text-slate-950 font-black'
                            : 'bg-slate-800 text-slate-500 border border-slate-700'
                        }`}
                      >
                        {isDone ? <Check className="w-4 h-4 stroke-[3]" /> : idx + 1}
                      </div>
                      <div className="flex-1 flex items-center justify-between">
                        <span className={`font-extrabold ${isDone ? 'text-white' : 'text-slate-500'}`}>
                          {stepObj.label}
                        </span>
                        {state === 'active' && (
                          <span className="text-[10px] font-bold text-orange-400 bg-orange-500/10 border border-orange-500/30 px-2 py-0.5 rounded-full animate-pulse">
                            In Progress
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Estimated Prep Time Footer */}
              <div className="bg-slate-800/90 p-3 rounded-xl border border-slate-700 text-xs flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span className="text-slate-300">Est. Kitchen Prep:</span>
                </div>
                <span className="font-black text-amber-400 text-sm">
                  ~{activeTrackedOrder.estimatedPrepTimeMinutes} Mins
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Waitlist Modal */}
      {showQueueModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">Join Table Waitlist Queue</h3>
                <p className="text-xs text-slate-500">Live queue position & SMS notifications</p>
              </div>
              <button
                onClick={() => setShowQueueModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {queueSubmittedMsg ? (
              <div className="bg-emerald-50 text-emerald-800 p-4 rounded-2xl border border-emerald-200 text-xs space-y-2">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <p className="font-extrabold text-sm">{queueSubmittedMsg}</p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleJoinQueueSubmit} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Customer Name</label>
                  <input
                    type="text"
                    required
                    value={queueName}
                    onChange={(e) => setQueueName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold text-slate-900 focus:outline-none focus:border-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mobile Phone (SMS Alert)</label>
                  <input
                    type="text"
                    required
                    value={queuePhone}
                    onChange={(e) => setQueuePhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold text-slate-900 focus:outline-none focus:border-slate-900"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Party Size</label>
                    <select
                      value={queuePartySize}
                      onChange={(e) => setQueuePartySize(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 10, 12].map((n) => (
                        <option key={n} value={n}>
                          {n} Guests
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Seating Pref</label>
                    <select
                      value={queuePref}
                      onChange={(e) => setQueuePref(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800"
                    >
                      <option value="Indoor">Indoor Dining</option>
                      <option value="Patio">Patio</option>
                      <option value="First Available">First Available</option>
                    </select>
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-1 text-slate-600 text-[11px]">
                  <p className="font-bold text-slate-800">Current Queue Metrics:</p>
                  <p>• Parties Ahead: <strong className="text-slate-900">{queue.length}</strong></p>
                  <p>• Estimated Wait Time: <strong className="text-orange-600">~{Math.max(10, (queue.length + 1) * 7)} Mins</strong></p>
                </div>

                <button
                  type="submit"
                  className="w-full bg-slate-900 text-white font-extrabold py-3 rounded-2xl hover:bg-slate-800 transition-colors shadow-md text-xs"
                >
                  Confirm Table Waitlist Registration
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
