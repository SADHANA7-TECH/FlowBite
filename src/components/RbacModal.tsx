import React from 'react';
import { Shield, Layers, Database, Key, Server, Users, ChefHat, LayoutDashboard, UtensilsCrossed } from 'lucide-react';

interface RbacModalProps {
  onClose: () => void;
}

export const RbacModal: React.FC<RbacModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-4xl w-full p-6 sm:p-8 text-white space-y-6 shadow-2xl my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-white">FlowBite SaaS Platform Architecture & RBAC</h2>
              <p className="text-xs text-slate-400">Scalability, Multi-Tenancy & Role-Based Access Control Specification</p>
            </div>
          </div>

          <button onClick={onClose} className="text-slate-400 hover:text-white font-bold text-lg">
            ✕
          </button>
        </div>

        {/* 1. Multi-Tenancy & Scalability Strategy */}
        <div className="space-y-3 bg-slate-950/80 p-4 rounded-2xl border border-slate-800 text-xs">
          <h3 className="text-sm font-extrabold text-orange-400 flex items-center space-x-2">
            <Layers className="w-4 h-4" />
            <span>1. Multi-Tenancy & Platform Scalability</span>
          </h3>
          <p className="text-slate-300 leading-relaxed">
            FlowBite uses a <strong>Discriminator Tenant ID Isolation</strong> model across database collections. Every query, index, and WebSocket channel is scoped to <code className="text-amber-300 bg-slate-900 px-1 py-0.5 rounded">tenantId</code>.
          </p>
          <ul className="list-disc pl-5 space-y-1 text-slate-400">
            <li><strong>Tenant Data Partitioning:</strong> Shared schema with strict tenant identifier guards at application and database security rule layers.</li>
            <li><strong>Horizontal Scale Out:</strong> Stateless Express backend containers behind Cloud Run load balancing with redis pub-sub for live KDS ticket dispatch.</li>
            <li><strong>Real-Time Synchronization:</strong> Low-latency status mutation pipeline syncing Customer Tracker, KDS Display, and Floor Plan instantly.</li>
          </ul>
        </div>

        {/* 2. Database Schema Overview */}
        <div className="space-y-3 bg-slate-950/80 p-4 rounded-2xl border border-slate-800 text-xs">
          <h3 className="text-sm font-extrabold text-blue-400 flex items-center space-x-2">
            <Database className="w-4 h-4" />
            <span>2. Normalized Domain Schema Entities</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-[11px]">
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <p className="font-bold text-slate-200">Tenants Collection</p>
              <p className="text-slate-400 text-[10px]">id, name, code, type, address, openHours</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <p className="font-bold text-slate-200">MenuItems & Recipes</p>
              <p className="text-slate-400 text-[10px]">id, name, price, prepStation, recipe: [{'{'}ingredientId, quantityNeeded{'}'}], isAvailable (86 flag)</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <p className="font-bold text-slate-200">Ingredients (Inventory)</p>
              <p className="text-slate-400 text-[10px]">id, name, currentStock, minThreshold, costPerUnit, supplier, category</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <p className="font-bold text-slate-200">Orders & Items</p>
              <p className="text-slate-400 text-[10px]">id, tenantId, orderNumber, type, tableNumber, items: [{'{'}status, prepStation{'}'}], totalAmount, status</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <p className="font-bold text-slate-200">DiningTables (Floor)</p>
              <p className="text-slate-400 text-[10px]">id, tableNumber, capacity, zone, status (available, seated, ordered, food_ready, payment_due)</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <p className="font-bold text-slate-200">QueueEntries (Waitlist)</p>
              <p className="text-slate-400 text-[10px]">id, customerName, phone, partySize, estimatedWaitMinutes, status (waiting, notified, seated)</p>
            </div>
          </div>
        </div>

        {/* 3. Role-Based Access Control (RBAC) Matrix */}
        <div className="space-y-3 bg-slate-950/80 p-4 rounded-2xl border border-slate-800 text-xs">
          <h3 className="text-sm font-extrabold text-purple-400 flex items-center space-x-2">
            <Key className="w-4 h-4" />
            <span>3. Role-Based Access Control (RBAC) Matrix</span>
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11px] border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900 text-slate-400 uppercase font-bold">
                  <th className="p-2">Role</th>
                  <th className="p-2">Customer Order</th>
                  <th className="p-2">KDS Ticket Update</th>
                  <th className="p-2">Floor & Queue</th>
                  <th className="p-2">86 Menu Toggle</th>
                  <th className="p-2">Inventory Restock</th>
                  <th className="p-2">Gemini AI Predictor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                <tr>
                  <td className="p-2 font-bold text-emerald-400 flex items-center space-x-1">
                    <UtensilsCrossed className="w-3.5 h-3.5" /> <span>Customer</span>
                  </td>
                  <td className="p-2 text-emerald-400 font-bold">✓ Full</td>
                  <td className="p-2 text-slate-600">✕ None</td>
                  <td className="p-2 text-slate-400">View Queue</td>
                  <td className="p-2 text-slate-600">✕ None</td>
                  <td className="p-2 text-slate-600">✕ None</td>
                  <td className="p-2 text-slate-600">✕ None</td>
                </tr>
                <tr>
                  <td className="p-2 font-bold text-amber-400 flex items-center space-x-1">
                    <ChefHat className="w-3.5 h-3.5" /> <span>Kitchen Staff</span>
                  </td>
                  <td className="p-2 text-slate-600">✕ Read Only</td>
                  <td className="p-2 text-emerald-400 font-bold">✓ Full KDS</td>
                  <td className="p-2 text-slate-600">✕ None</td>
                  <td className="p-2 text-emerald-400 font-bold">✓ Emergency 86</td>
                  <td className="p-2 text-slate-400">View Levels</td>
                  <td className="p-2 text-slate-600">✕ None</td>
                </tr>
                <tr>
                  <td className="p-2 font-bold text-blue-400 flex items-center space-x-1">
                    <Users className="w-3.5 h-3.5" /> <span>Waitstaff / Floor</span>
                  </td>
                  <td className="p-2 text-emerald-400 font-bold">✓ Place Table Order</td>
                  <td className="p-2 text-slate-400">View Ticket Status</td>
                  <td className="p-2 text-emerald-400 font-bold">✓ Full Floor & Queue</td>
                  <td className="p-2 text-slate-400">View Status</td>
                  <td className="p-2 text-slate-600">✕ None</td>
                  <td className="p-2 text-slate-600">✕ None</td>
                </tr>
                <tr>
                  <td className="p-2 font-bold text-purple-400 flex items-center space-x-1">
                    <LayoutDashboard className="w-3.5 h-3.5" /> <span>Manager / Admin</span>
                  </td>
                  <td className="p-2 text-emerald-400 font-bold">✓ Full Access</td>
                  <td className="p-2 text-emerald-400 font-bold">✓ Full Access</td>
                  <td className="p-2 text-emerald-400 font-bold">✓ Full Access</td>
                  <td className="p-2 text-emerald-400 font-bold">✓ Full Access</td>
                  <td className="p-2 text-emerald-400 font-bold">✓ Full Access</td>
                  <td className="p-2 text-emerald-400 font-bold">✓ Full AI Control</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="pt-2 text-right">
          <button
            onClick={onClose}
            className="bg-purple-600 hover:bg-purple-500 text-white font-extrabold px-6 py-2.5 rounded-xl text-xs transition-colors shadow-md"
          >
            Close Architecture Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
