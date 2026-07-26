import React, { useState, useEffect, useCallback } from 'react';
import { UserRole, Tenant, Order, MenuItem, Ingredient, DiningTable, QueueEntry, AIInsight, AnalyticsSummary } from './types';
import {
  fetchAppState,
  createOrder,
  updateOrderStatus,
  toggleMenuItemAvailability,
  updateInventoryStock,
  updateTableStatus,
  addToQueue,
  updateQueueStatus,
  triggerAIPredictions,
  simulateOrderRush,
  AppState,
} from './lib/api';
import { Header } from './components/Header';
import { CustomerView } from './components/CustomerView';
import { KitchenView } from './components/KitchenView';
import { StaffView } from './components/StaffView';
import { ManagerView } from './components/ManagerView';
import { RbacModal } from './components/RbacModal';
import { SupabaseAuthModal } from './components/SupabaseAuthModal';
import { AuthPage } from './components/AuthPage';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import { Sparkles, Zap, CheckCircle2 } from 'lucide-react';

export default function App() {
  const [activeRole, setActiveRole] = useState<UserRole>('customer');
  const [appState, setAppState] = useState<AppState | null>(null);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [showRbacModal, setShowRbacModal] = useState<boolean>(false);
  const [showSupabaseModal, setShowSupabaseModal] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'dashboard' | 'auth'>('dashboard');
  const [authUser, setAuthUser] = useState<any>(null);
  const [myActiveOrderId, setMyActiveOrderId] = useState<string | undefined>(undefined);
  const [notificationMsg, setNotificationMsg] = useState<string>('');

  const loadState = useCallback(async () => {
    try {
      const data = await fetchAppState();
      setAppState(data);
      if (!selectedTenant && data.tenants.length > 0) {
        setSelectedTenant(data.tenants[0]);
      }
    } catch (err) {
      console.error('Error fetching state:', err);
    }
  }, [selectedTenant]);

  useEffect(() => {
    loadState();
    // Poll every 5 seconds for real-time live synchronization
    const interval = setInterval(loadState, 5000);

    // If Supabase is configured, subscribe to Supabase Realtime changes
    if (isSupabaseConfigured()) {
      const channel = supabase
        .channel('flowbite-realtime-sync')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
          setNotificationMsg('⚡ Realtime Alert: Live Order updated in Supabase PostgreSQL!');
          setTimeout(() => setNotificationMsg(''), 4000);
          loadState();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'menu_items' }, () => {
          loadState();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'ingredients' }, () => {
          loadState();
        })
        .subscribe();

      return () => {
        clearInterval(interval);
        supabase.removeChannel(channel);
      };
    }

    return () => clearInterval(interval);
  }, [loadState]);

  const handlePlaceOrder = async (data: any) => {
    const newOrder = await createOrder(data);
    setMyActiveOrderId(newOrder.id);
    setNotificationMsg(`Order ${newOrder.orderNumber} placed & sent to Kitchen KDS! Recipe ingredients auto-deducted.`);
    setTimeout(() => setNotificationMsg(''), 4000);
    await loadState();
  };

  const handleUpdateOrderStatus = async (orderId: string, status: string, itemId?: string) => {
    await updateOrderStatus(orderId, status, itemId);
    await loadState();
  };

  const handleToggleMenuItem = async (menuItemId: string, isAvailable?: boolean) => {
    await toggleMenuItemAvailability(menuItemId, isAvailable);
    await loadState();
  };

  const handleUpdateInventoryStock = async (ingredientId: string, currentStock: number, minThreshold?: number) => {
    await updateInventoryStock(ingredientId, currentStock, minThreshold);
    await loadState();
  };

  const handleUpdateTableStatus = async (tableId: string, status: string, guestCount?: number, assignedStaff?: string) => {
    await updateTableStatus(tableId, status, guestCount, assignedStaff);
    await loadState();
  };

  const handleAddToQueue = async (data: any) => {
    await addToQueue(data);
    await loadState();
  };

  const handleUpdateQueueStatus = async (queueId: string, status: string) => {
    await updateQueueStatus(queueId, status);
    await loadState();
  };

  const handleTriggerAIPredictions = async () => {
    await triggerAIPredictions();
    setNotificationMsg('Gemini AI completed real-time operational diagnosis & bottleneck forecast.');
    setTimeout(() => setNotificationMsg(''), 4000);
    await loadState();
  };

  const handleSimulateRush = async () => {
    setIsSimulating(true);
    try {
      const result = await simulateOrderRush();
      setNotificationMsg(`Simulated Rush Active: ${result.message}`);
      setTimeout(() => setNotificationMsg(''), 5000);
      await loadState();
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleAuthenticated = (role: UserRole, user: any) => {
    setActiveRole(role);
    setAuthUser(user);
    setViewMode('dashboard');
    setNotificationMsg(`Authenticated as ${user.email || 'Demo User'} (${role.toUpperCase()}). Redirected to dashboard.`);
    setTimeout(() => setNotificationMsg(''), 4000);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setAuthUser(null);
    setNotificationMsg('Logged out successfully.');
    setTimeout(() => setNotificationMsg(''), 3000);
  };

  if (!appState || !selectedTenant) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-orange-500 flex items-center justify-center font-extrabold text-2xl mx-auto animate-bounce">
            F
          </div>
          <p className="text-sm font-semibold text-slate-300">Loading FlowBite Operations Engine...</p>
        </div>
      </div>
    );
  }

  const unresolvedAlertsCount = appState.aiInsights.filter((i) => i.severity === 'high').length;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans flex flex-col">
      {/* Top Navigation & Controls */}
      <Header
        activeRole={activeRole}
        onRoleChange={setActiveRole}
        selectedTenant={selectedTenant}
        tenants={appState.tenants}
        onTenantChange={setSelectedTenant}
        onSimulateRush={handleSimulateRush}
        onOpenRbacModal={() => setShowRbacModal(true)}
        onOpenSupabaseModal={() => setShowSupabaseModal(true)}
        onOpenAuthPage={() => setViewMode(viewMode === 'auth' ? 'dashboard' : 'auth')}
        authUser={authUser}
        onSignOut={handleSignOut}
        isSimulating={isSimulating}
        unresolvedAlertsCount={unresolvedAlertsCount}
      />

      {/* Global Real-time Notification Banner */}
      {notificationMsg && (
        <div className="bg-slate-900 text-white py-2 px-4 text-xs font-bold flex items-center justify-center space-x-2 border-b border-orange-500/40 shadow-sm animate-fade-in">
          <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>{notificationMsg}</span>
        </div>
      )}

      {/* Role View Routing or Auth Page */}
      <main className="flex-1">
        {viewMode === 'auth' ? (
          <AuthPage
            activeRole={activeRole}
            onAuthenticated={handleAuthenticated}
          />
        ) : (
          <>
            {activeRole === 'customer' && (
              <CustomerView
                menu={appState.menu}
                orders={appState.orders}
                ingredients={appState.ingredients}
                tables={appState.tables}
                queue={appState.queue}
                onPlaceOrder={handlePlaceOrder}
                onJoinQueue={handleAddToQueue}
                myActiveOrderId={myActiveOrderId}
              />
            )}

            {activeRole === 'kitchen' && (
              <KitchenView
                orders={appState.orders}
                menu={appState.menu}
                ingredients={appState.ingredients}
                onUpdateOrderStatus={handleUpdateOrderStatus}
                onToggleMenuItem={handleToggleMenuItem}
              />
            )}

            {activeRole === 'staff' && (
              <StaffView
                tables={appState.tables}
                queue={appState.queue}
                orders={appState.orders}
                onUpdateTableStatus={handleUpdateTableStatus}
                onUpdateQueueStatus={handleUpdateQueueStatus}
                onAddToQueue={handleAddToQueue}
              />
            )}

            {activeRole === 'manager' && (
              <ManagerView
                analytics={appState.analytics}
                aiInsights={appState.aiInsights}
                menu={appState.menu}
                ingredients={appState.ingredients}
                orders={appState.orders}
                tables={appState.tables}
                queue={appState.queue}
                selectedTenant={selectedTenant}
                onTriggerAIPredictions={handleTriggerAIPredictions}
                onToggleMenuItem={handleToggleMenuItem}
                onUpdateInventoryStock={handleUpdateInventoryStock}
                onUpdateOrderStatus={handleUpdateOrderStatus}
                onUpdateTableStatus={handleUpdateTableStatus}
                onUpdateQueueStatus={handleUpdateQueueStatus}
              />
            )}
          </>
        )}
      </main>

      {/* RBAC & Architecture Modal */}
      {showRbacModal && <RbacModal onClose={() => setShowRbacModal(false)} />}

      {/* Supabase Auth & Database Control Modal */}
      {showSupabaseModal && (
        <SupabaseAuthModal
          onClose={() => setShowSupabaseModal(false)}
          activeRole={activeRole}
          onRoleChange={setActiveRole}
        />
      )}

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 text-[11px] py-4 border-t border-slate-800 mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="font-extrabold text-white">FlowBite</span>
            <span>•</span>
            <span>Intelligent Restaurant Operations Engine</span>
          </div>
          <p className="text-slate-500">Connecting Customers, Kitchen, Waitstaff & Managers with AI Analytics</p>
        </div>
      </footer>
    </div>
  );
}
