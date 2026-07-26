import React from 'react';
import { UserRole, Tenant } from '../types';
import { UtensilsCrossed, ChefHat, Users, LayoutDashboard, Shield, Zap, Sparkles, RefreshCw, Layers, Database, LogIn, LogOut, UserCheck } from 'lucide-react';

interface HeaderProps {
  activeRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  selectedTenant: Tenant;
  tenants: Tenant[];
  onTenantChange: (tenant: Tenant) => void;
  onSimulateRush: () => void;
  onOpenRbacModal: () => void;
  onOpenSupabaseModal: () => void;
  onOpenAuthPage: () => void;
  authUser: any;
  onSignOut: () => void;
  isSimulating: boolean;
  unresolvedAlertsCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeRole,
  onRoleChange,
  selectedTenant,
  tenants,
  onTenantChange,
  onSimulateRush,
  onOpenRbacModal,
  onOpenSupabaseModal,
  onOpenAuthPage,
  authUser,
  onSignOut,
  isSimulating,
  unresolvedAlertsCount,
}) => {
  const roles: { role: UserRole; label: string; icon: React.ReactNode; badgeColor: string }[] = [
    { role: 'customer', label: 'Customer Portal', icon: <UtensilsCrossed className="w-4 h-4" />, badgeColor: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' },
    { role: 'kitchen', label: 'Kitchen KDS', icon: <ChefHat className="w-4 h-4" />, badgeColor: 'bg-amber-500/10 text-amber-600 border-amber-500/30' },
    { role: 'staff', label: 'Waitstaff & Floor', icon: <Users className="w-4 h-4" />, badgeColor: 'bg-blue-500/10 text-blue-600 border-blue-500/30' },
    { role: 'manager', label: 'Manager Command', icon: <LayoutDashboard className="w-4 h-4" />, badgeColor: 'bg-purple-500/10 text-purple-600 border-purple-500/30' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-900 text-slate-100 border-b border-slate-800 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Tenant Switcher */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-500 flex items-center justify-center shadow-lg shadow-orange-500/20 font-bold text-white text-lg">
                F
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-extrabold text-xl tracking-tight text-white">FlowBite</span>
                  <span className="text-[10px] font-semibold tracking-wider px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 uppercase">
                    SaaS Engine
                  </span>
                </div>
                <p className="text-xs text-slate-400 hidden sm:block">Intelligent Operations Platform</p>
              </div>
            </div>

            <div className="h-6 w-px bg-slate-800 hidden md:block" />

            {/* Tenant Selection dropdown */}
            <div className="hidden md:flex items-center space-x-2 bg-slate-800/80 hover:bg-slate-800 text-slate-300 text-xs px-3 py-1.5 rounded-lg border border-slate-700/60 transition-colors">
              <Layers className="w-3.5 h-3.5 text-orange-400" />
              <select
                value={selectedTenant.id}
                onChange={(e) => {
                  const found = tenants.find((t) => t.id === e.target.value);
                  if (found) onTenantChange(found);
                }}
                className="bg-transparent text-slate-200 font-medium focus:outline-none cursor-pointer"
              >
                {tenants.map((t) => (
                  <option key={t.id} value={t.id} className="bg-slate-900 text-slate-200">
                    {t.name} ({t.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Role Navigation Tabs */}
          <div className="hidden lg:flex items-center space-x-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800/80">
            {roles.map((r) => {
              const isActive = activeRole === r.role;
              return (
                <button
                  key={r.role}
                  onClick={() => onRoleChange(r.role)}
                  className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-slate-800 text-white shadow border border-slate-700'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                  }`}
                >
                  <span className={isActive ? 'text-orange-400' : 'text-slate-500'}>{r.icon}</span>
                  <span>{r.label}</span>
                </button>
              );
            })}
          </div>

          {/* Action Tools */}
          <div className="flex items-center space-x-2">
            {/* Clean Header Bar */}
          </div>
        </div>

        {/* Mobile Role Switcher Bar */}
        <div className="lg:hidden flex items-center justify-between py-2 border-t border-slate-800/80 text-xs overflow-x-auto space-x-1">
          {roles.map((r) => {
            const isActive = activeRole === r.role;
            return (
              <button
                key={r.role}
                onClick={() => onRoleChange(r.role)}
                className={`flex items-center space-x-1.5 px-3 py-1.2 rounded-md whitespace-nowrap transition-all ${
                  isActive ? 'bg-orange-500 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {r.icon}
                <span>{r.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
