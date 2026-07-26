import React, { useState, useEffect } from 'react';
import { Order, MenuItem, Ingredient, OrderStatus } from '../types';
import {
  ChefHat,
  Clock,
  CheckCircle2,
  Flame,
  AlertTriangle,
  Power,
  ArrowRight,
  ArrowLeft,
  Check,
  BellRing,
  Utensils,
  Search,
  Filter,
} from 'lucide-react';

interface KitchenViewProps {
  orders: Order[];
  menu: MenuItem[];
  ingredients: Ingredient[];
  onUpdateOrderStatus: (orderId: string, status: string, itemId?: string) => Promise<void>;
  onToggleMenuItem: (menuItemId: string, isAvailable?: boolean) => Promise<void>;
}

// Live Time Elapsed Component
const TicketTimer: React.FC<{ createdAt: string }> = ({ createdAt }) => {
  const [elapsedSec, setElapsedSec] = useState<number>(0);

  useEffect(() => {
    const calculateSeconds = () => {
      const createdTime = new Date(createdAt).getTime();
      const now = Date.now();
      const diffSec = Math.max(0, Math.floor((now - createdTime) / 1000));
      setElapsedSec(diffSec);
    };

    calculateSeconds();
    const timer = setInterval(calculateSeconds, 1000);
    return () => clearInterval(timer);
  }, [createdAt]);

  const mins = Math.floor(elapsedSec / 60);
  const secs = elapsedSec % 60;
  const formattedTime = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  let badgeColor = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
  let labelText = 'On Target';

  if (mins >= 18) {
    badgeColor = 'bg-rose-500/30 text-rose-300 border-rose-500/50 font-black animate-pulse';
    labelText = 'OVERDUE';
  } else if (mins >= 10) {
    badgeColor = 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold';
    labelText = 'SLA Warning';
  }

  return (
    <div className={`px-2.5 py-1 rounded-xl border text-[11px] flex items-center space-x-1.5 font-mono font-bold ${badgeColor}`}>
      <Clock className="w-3.5 h-3.5" />
      <span>{formattedTime}</span>
      <span className="text-[9px] uppercase tracking-wider px-1 py-0.2 rounded bg-black/30 ml-1">
        {labelText}
      </span>
    </div>
  );
};

export const KitchenView: React.FC<KitchenViewProps> = ({
  orders,
  menu,
  ingredients,
  onUpdateOrderStatus,
  onToggleMenuItem,
}) => {
  const [selectedStation, setSelectedStation] = useState<string>('All');
  const [showStockTogglePanel, setShowStockTogglePanel] = useState<boolean>(false);
  const [searchFilter, setSearchFilter] = useState<string>('');

  const stations = ['All', 'Grill', 'Sauté', 'Fry', 'Pantry/Cold', 'Bar'];

  // Filter active tickets
  const activeOrders = orders.filter((o) => o.status !== 'completed' && o.status !== 'cancelled');

  // Filter tickets by prep station or search query
  const filteredOrders = activeOrders.filter((order) => {
    const matchesStation =
      selectedStation === 'All' ||
      order.items.some((item) => item.prepStation === selectedStation);
    const matchesSearch =
      searchFilter === '' ||
      order.orderNumber.toLowerCase().includes(searchFilter.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchFilter.toLowerCase()) ||
      (order.tableNumber && String(order.tableNumber).includes(searchFilter));
    return matchesStation && matchesSearch;
  });

  // Categorize into 4 required Kanban columns
  const newOrders = filteredOrders.filter((o) => o.status === 'placed');
  const acceptedOrders = filteredOrders.filter((o) => o.status === 'accepted');
  const preparingOrders = filteredOrders.filter((o) => o.status === 'preparing' || o.status === 'cooking');
  const readyOrders = filteredOrders.filter((o) => o.status === 'ready' || o.status === 'served');

  const kanbanColumns = [
    {
      id: 'NEW',
      title: 'NEW ORDERS',
      count: newOrders.length,
      orders: newOrders,
      headerBg: 'bg-indigo-950/80 border-indigo-700/60 text-indigo-200',
      badgeBg: 'bg-indigo-500 text-white',
      nextStatus: 'accepted',
      nextActionLabel: 'Accept Ticket →',
      nextBtnBg: 'bg-indigo-600 hover:bg-indigo-500 text-white',
    },
    {
      id: 'ACCEPTED',
      title: 'ACCEPTED',
      count: acceptedOrders.length,
      orders: acceptedOrders,
      headerBg: 'bg-cyan-950/80 border-cyan-700/60 text-cyan-200',
      badgeBg: 'bg-cyan-500 text-slate-950 font-black',
      nextStatus: 'preparing',
      nextActionLabel: 'Start Prep →',
      nextBtnBg: 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-black',
    },
    {
      id: 'PREPARING',
      title: 'PREPARING / COOKING',
      count: preparingOrders.length,
      orders: preparingOrders,
      headerBg: 'bg-amber-950/80 border-amber-700/60 text-amber-200',
      badgeBg: 'bg-amber-500 text-slate-950 font-black',
      nextStatus: 'ready',
      nextActionLabel: 'Mark Ready ✓',
      nextBtnBg: 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black',
    },
    {
      id: 'READY',
      title: 'READY FOR TABLE',
      count: readyOrders.length,
      orders: readyOrders,
      headerBg: 'bg-emerald-950/80 border-emerald-700/60 text-emerald-200',
      badgeBg: 'bg-emerald-500 text-slate-950 font-black',
      nextStatus: 'completed',
      nextActionLabel: 'Serve & Complete ✓',
      nextBtnBg: 'bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/40',
    },
  ];

  return (
    <div className="max-w-[1600px] mx-auto px-4 py-6 space-y-6">
      {/* KDS Control Header */}
      <div className="bg-slate-900 text-white rounded-3xl p-5 border border-slate-800 shadow-xl flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center justify-center shrink-0">
            <ChefHat className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-black tracking-tight text-white">Kitchen Display Kanban (KDS)</h1>
              <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>{activeOrders.length} Active Tickets</span>
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Real-time multi-station order advancement. Status changes immediately sync with Customer Tracking & Manager Dashboards.
            </p>
          </div>
        </div>

        {/* Filters & Actions Bar */}
        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
          {/* Ticket Search */}
          <div className="relative flex-1 sm:w-48">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search #Order, Table..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full bg-slate-950 text-xs font-semibold text-white pl-8 pr-3 py-1.5 rounded-xl border border-slate-800 focus:outline-none focus:border-orange-500"
            />
          </div>

          {/* Station Filter Pills */}
          <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs overflow-x-auto">
            {stations.map((st) => (
              <button
                key={st}
                onClick={() => setSelectedStation(st)}
                className={`px-3 py-1 rounded-lg font-bold whitespace-nowrap transition-all ${
                  selectedStation === st
                    ? 'bg-orange-500 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Line 86 Stock Emergency Control Button */}
          <button
            onClick={() => setShowStockTogglePanel(!showStockTogglePanel)}
            className="flex items-center space-x-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-extrabold px-3.5 py-2 rounded-xl transition-all shadow-sm"
          >
            <Power className="w-3.5 h-3.5 text-rose-400" />
            <span>Emergency 86 Controls</span>
          </button>
        </div>
      </div>

      {/* Emergency Stock Control Drawer */}
      {showStockTogglePanel && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-3 text-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              <div>
                <h3 className="text-sm font-extrabold">Chef Line Emergency Item 86 Toggle</h3>
                <p className="text-xs text-slate-400">Sold out dishes will instantly grey out on the customer live order app</p>
              </div>
            </div>
            <button
              onClick={() => setShowStockTogglePanel(false)}
              className="text-xs text-slate-400 hover:text-slate-200 font-bold bg-slate-800 px-2.5 py-1 rounded-lg"
            >
              Close Drawer
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 text-xs">
            {menu.map((item) => (
              <button
                key={item.id}
                onClick={() => onToggleMenuItem(item.id, !item.isAvailable)}
                className={`p-3 rounded-2xl border text-left flex flex-col justify-between space-y-2 transition-all ${
                  item.isAvailable
                    ? 'bg-slate-800/80 border-slate-700 text-slate-200 hover:border-slate-500'
                    : 'bg-rose-950/60 border-rose-800 text-rose-300 font-bold ring-1 ring-rose-500/30'
                }`}
              >
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold">{item.prepStation}</span>
                  <p className="font-extrabold text-xs truncate leading-snug">{item.name}</p>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-md uppercase ${item.isAvailable ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-600 text-white'}`}>
                    {item.isAvailable ? 'In Stock' : "86'd SOLD OUT"}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Real-time 4-Column Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        {kanbanColumns.map((col) => (
          <div
            key={col.id}
            className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 flex flex-col space-y-4 shadow-xl min-h-[600px]"
          >
            {/* Column Header */}
            <div className={`p-3.5 rounded-2xl border flex items-center justify-between ${col.headerBg}`}>
              <div className="flex items-center space-x-2">
                <span className="font-black text-xs tracking-wider uppercase">{col.title}</span>
              </div>
              <span className={`w-6 h-6 rounded-full font-black text-xs flex items-center justify-center shadow-xs ${col.badgeBg}`}>
                {col.count}
              </span>
            </div>

            {/* Column Order List */}
            <div className="flex-1 space-y-4 overflow-y-auto pr-1">
              {col.orders.length === 0 ? (
                <div className="h-48 border-2 border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center text-slate-600 text-xs text-center p-4">
                  <CheckCircle2 className="w-8 h-8 mb-2 opacity-40" />
                  <span>No tickets in {col.title}</span>
                </div>
              ) : (
                col.orders.map((order) => {
                  const stationItems = selectedStation === 'All'
                    ? order.items
                    : order.items.filter((i) => i.prepStation === selectedStation);

                  return (
                    <div
                      key={order.id}
                      className="bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 space-y-3 shadow-md text-white transition-all"
                    >
                      {/* Ticket Header: Order ID + Table + Live Timer */}
                      <div className="space-y-2 border-b border-slate-800 pb-2.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="font-black text-base text-orange-400">{order.orderNumber}</span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 uppercase">
                              {order.type}
                            </span>
                          </div>
                          {order.tableNumber ? (
                            <span className="bg-orange-500/20 text-orange-300 border border-orange-500/30 text-xs font-black px-2.5 py-0.5 rounded-lg">
                              Table #{order.tableNumber}
                            </span>
                          ) : (
                            <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-black px-2.5 py-0.5 rounded-lg">
                              Pickup
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between text-xs text-slate-400">
                          <span className="font-semibold truncate max-w-[120px]">Guest: {order.customerName}</span>
                          <TicketTimer createdAt={order.createdAt} />
                        </div>

                        {order.notes && (
                          <div className="bg-amber-500/10 border border-amber-500/30 p-2 rounded-xl text-xs text-amber-300 font-semibold flex items-start space-x-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-400 mt-0.5" />
                            <span className="leading-snug">Note: {order.notes}</span>
                          </div>
                        )}
                      </div>

                      {/* Items List */}
                      <div className="space-y-2">
                        {stationItems.map((item) => (
                          <div
                            key={item.id}
                            className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-xl text-xs space-y-1"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <span className="w-5 h-5 rounded-lg bg-orange-500 text-slate-950 font-black flex items-center justify-center text-xs shrink-0">
                                  {item.quantity}×
                                </span>
                                <span className="font-bold text-slate-100">{item.name}</span>
                              </div>
                              <span className="text-[9px] font-extrabold uppercase bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">
                                {item.prepStation}
                              </span>
                            </div>

                            {item.specialInstructions && (
                              <p className="text-[10px] text-amber-300 font-semibold pl-7">
                                ↳ {item.specialInstructions}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Column Advance Action Button */}
                      <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
                        {order.status !== 'placed' && (
                          <button
                            onClick={() => {
                              const prevStatus = order.status === 'ready' ? 'preparing' : order.status === 'preparing' ? 'accepted' : 'placed';
                              onUpdateOrderStatus(order.id, prevStatus);
                            }}
                            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                            title="Revert to previous column"
                          >
                            <ArrowLeft className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <button
                          onClick={() => onUpdateOrderStatus(order.id, col.nextStatus)}
                          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-black transition-all shadow-md flex items-center justify-center space-x-1.5 ${col.nextBtnBg}`}
                        >
                          <span>{col.nextActionLabel}</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
