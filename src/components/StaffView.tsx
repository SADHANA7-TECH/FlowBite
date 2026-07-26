import React, { useState } from 'react';
import { DiningTable, QueueEntry, Order } from '../types';
import { Users, Utensils, CheckCircle2, Clock, MessageSquare, Phone, Plus, Sparkles, AlertCircle } from 'lucide-react';

interface StaffViewProps {
  tables: DiningTable[];
  queue: QueueEntry[];
  orders: Order[];
  onUpdateTableStatus: (tableId: string, status: string, guestCount?: number, assignedStaff?: string) => Promise<void>;
  onUpdateQueueStatus: (queueId: string, status: string) => Promise<void>;
  onAddToQueue: (data: { customerName: string; phone: string; partySize: number; seatingPreference?: string }) => Promise<void>;
}

export const StaffView: React.FC<StaffViewProps> = ({
  tables,
  queue,
  orders,
  onUpdateTableStatus,
  onUpdateQueueStatus,
  onAddToQueue,
}) => {
  const [activeTab, setActiveTab] = useState<'floor' | 'queue'>('floor');
  const [selectedZone, setSelectedZone] = useState<string>('All');
  const [selectedTableModal, setSelectedTableModal] = useState<DiningTable | null>(null);

  // New Waitlist Entry State
  const [showAddQueue, setShowAddQueue] = useState<boolean>(false);
  const [qName, setQName] = useState<string>('');
  const [qPhone, setQPhone] = useState<string>('');
  const [qParty, setQParty] = useState<number>(2);
  const [qPref, setQPref] = useState<string>('Indoor');

  const zones = ['All', 'Main Dining', 'Patio', 'Bar Area', 'Private Room'];

  const filteredTables = tables.filter((t) => selectedZone === 'All' || t.zone === selectedZone);

  const statusColors: { [k: string]: { bg: string; text: string; border: string; label: string } } = {
    available: { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-300', label: 'Available' },
    seated: { bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-300', label: 'Seated' },
    ordered: { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-300', label: 'Order Placed' },
    food_ready: { bg: 'bg-purple-50', text: 'text-purple-800', border: 'border-purple-300 font-extrabold animate-pulse', label: 'Food Ready to Serve!' },
    payment_due: { bg: 'bg-yellow-50', text: 'text-yellow-900', border: 'border-yellow-300', label: 'Payment Pending' },
    cleaning: { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-300', label: 'Needs Cleaning' },
  };

  const handleAddWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qName) return;
    try {
      await onAddToQueue({
        customerName: qName,
        phone: qPhone,
        partySize: qParty,
        seatingPreference: qPref,
      });
      setQName('');
      setQPhone('');
      setShowAddQueue(false);
    } catch (err) {
      alert((err as Error).message);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Header Bar */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center font-bold">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">Waitstaff & Floor Management</h1>
            <p className="text-xs text-slate-500">Live dining table states, serving alerts & waitlist queue dispatch</p>
          </div>
        </div>

        {/* Tab Switcher & Filters */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            <button
              onClick={() => setActiveTab('floor')}
              className={`px-3.5 py-1.8 rounded-lg font-semibold transition-all ${
                activeTab === 'floor' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Floor Plan
            </button>
            <button
              onClick={() => setActiveTab('queue')}
              className={`px-3.5 py-1.8 rounded-lg font-semibold transition-all flex items-center space-x-1.5 ${
                activeTab === 'queue' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Smart Waitlist Queue</span>
              <span className="bg-orange-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                {queue.filter((q) => q.status === 'waiting' || q.status === 'notified').length}
              </span>
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'floor' ? (
        <div className="space-y-4">
          {/* Zone Selector */}
          <div className="flex items-center space-x-2 overflow-x-auto text-xs pb-1">
            {zones.map((zone) => (
              <button
                key={zone}
                onClick={() => setSelectedZone(zone)}
                className={`px-3.5 py-1.5 rounded-xl font-semibold border transition-all ${
                  selectedZone === zone
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {zone}
              </button>
            ))}
          </div>

          {/* Tables Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4">
            {filteredTables.map((table) => {
              const st = statusColors[table.status] || statusColors.available;
              const relatedOrder = orders.find((o) => o.id === table.currentOrderId);

              return (
                <div
                  key={table.id}
                  onClick={() => setSelectedTableModal(table)}
                  className={`p-5 rounded-2xl border cursor-pointer transition-all hover:scale-[1.02] shadow-sm flex flex-col justify-between space-y-4 ${st.bg} ${st.border}`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{table.zone}</span>
                      <h3 className="text-xl font-black text-slate-900">Table #{table.tableNumber}</h3>
                      <p className="text-xs text-slate-600 mt-0.5">Cap: {table.capacity} Guests</p>
                    </div>

                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border ${st.border} ${st.text}`}>
                      {st.label}
                    </span>
                  </div>

                  {/* Table Status Context Info */}
                  <div className="text-xs space-y-1.5 pt-2 border-t border-slate-200/60">
                    {table.seatedAt && (
                      <p className="text-slate-600 flex items-center space-x-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>Seated at {table.seatedAt} ({table.guestCount || table.capacity} guests)</span>
                      </p>
                    )}
                    {relatedOrder && (
                      <p className="font-extrabold text-slate-900 flex items-center justify-between">
                        <span>Order {relatedOrder.orderNumber}:</span>
                        <span className="text-orange-600">${relatedOrder.totalAmount.toFixed(2)}</span>
                      </p>
                    )}
                    {table.assignedStaff && (
                      <p className="text-[11px] text-slate-500">Staff: {table.assignedStaff}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Queue & Waitlist Tab */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-slate-900">Smart Waitlist Queue Dispatch</h2>
            <button
              onClick={() => setShowAddQueue(true)}
              className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-xs flex items-center space-x-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Guest to Queue</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {queue.map((q) => (
              <div key={q.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-start justify-between border-b border-slate-100 pb-2.5">
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-sm">{q.customerName}</h3>
                    <p className="text-xs text-slate-500">{q.phone} • Party of {q.partySize}</p>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded capitalize ${
                      q.status === 'notified'
                        ? 'bg-amber-100 text-amber-800 border border-amber-300 animate-pulse'
                        : q.status === 'seated'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {q.status}
                  </span>
                </div>

                <div className="text-xs text-slate-600 space-y-1">
                  <p>Check-in Time: <span className="font-bold text-slate-800">{q.joinedAt}</span></p>
                  <p>Seating Preference: <span className="font-bold text-slate-800">{q.seatingPreference || 'Any'}</span></p>
                  <p>Estimated Wait: <span className="font-bold text-orange-600">~{q.estimatedWaitMinutes} mins</span></p>
                </div>

                <div className="pt-2 flex items-center space-x-2">
                  {q.status === 'waiting' && (
                    <button
                      onClick={() => onUpdateQueueStatus(q.id, 'notified')}
                      className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-1.5 rounded-lg text-xs transition-colors flex items-center justify-center space-x-1"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>SMS Ready Alert</span>
                    </button>
                  )}
                  {q.status !== 'seated' && (
                    <button
                      onClick={() => onUpdateQueueStatus(q.id, 'seated')}
                      className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-1.5 rounded-lg text-xs transition-colors flex items-center justify-center space-x-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Seat at Table</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Table Detail & Action Modal */}
      {selectedTableModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-base">
                Table #{selectedTableModal.tableNumber} Management ({selectedTableModal.zone})
              </h3>
              <button onClick={() => setSelectedTableModal(null)} className="text-slate-400 hover:text-slate-600 font-bold">
                ✕
              </button>
            </div>

            <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <p>Current Status: <span className="font-extrabold capitalize text-slate-900">{selectedTableModal.status}</span></p>
              <p>Table Capacity: <span className="font-bold text-slate-800">{selectedTableModal.capacity} Guests</span></p>
            </div>

            <div className="space-y-2">
              <p className="font-bold text-slate-700">Quick Status Transition:</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    onUpdateTableStatus(selectedTableModal.id, 'seated', selectedTableModal.capacity, 'Alex Rivera');
                    setSelectedTableModal(null);
                  }}
                  className="bg-blue-600 text-white font-bold py-2 rounded-xl hover:bg-blue-500"
                >
                  Seat Guests
                </button>
                <button
                  onClick={() => {
                    onUpdateTableStatus(selectedTableModal.id, 'food_ready');
                    setSelectedTableModal(null);
                  }}
                  className="bg-purple-600 text-white font-bold py-2 rounded-xl hover:bg-purple-500"
                >
                  Food Ready To Serve
                </button>
                <button
                  onClick={() => {
                    onUpdateTableStatus(selectedTableModal.id, 'payment_due');
                    setSelectedTableModal(null);
                  }}
                  className="bg-yellow-600 text-white font-bold py-2 rounded-xl hover:bg-yellow-500"
                >
                  Request Bill
                </button>
                <button
                  onClick={() => {
                    onUpdateTableStatus(selectedTableModal.id, 'available');
                    setSelectedTableModal(null);
                  }}
                  className="bg-emerald-600 text-white font-bold py-2 rounded-xl hover:bg-emerald-500"
                >
                  Mark Available & Clean
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Queue Modal */}
      {showAddQueue && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-base">Add Guest to Waitlist</h3>
              <button onClick={() => setShowAddQueue(false)} className="text-slate-400 font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleAddWaitlistSubmit} className="space-y-3">
              <div>
                <label className="block font-semibold mb-1">Guest Name</label>
                <input
                  type="text"
                  required
                  value={qName}
                  onChange={(e) => setQName(e.target.value)}
                  className="w-full bg-slate-50 border p-2 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Mobile Phone</label>
                <input
                  type="text"
                  required
                  value={qPhone}
                  onChange={(e) => setQPhone(e.target.value)}
                  className="w-full bg-slate-50 border p-2 rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold mb-1">Party Size</label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={qParty}
                    onChange={(e) => setQParty(Number(e.target.value))}
                    className="w-full bg-slate-50 border p-2 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Seating Pref</label>
                  <select
                    value={qPref}
                    onChange={(e) => setQPref(e.target.value)}
                    className="w-full bg-slate-50 border p-2 rounded-lg"
                  >
                    <option value="Indoor">Indoor</option>
                    <option value="Patio">Patio</option>
                    <option value="First Available">First Available</option>
                  </select>
                </div>
              </div>

              <button type="submit" className="w-full bg-slate-900 text-white font-bold py-2.5 rounded-xl">
                Add Waitlist Entry
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
