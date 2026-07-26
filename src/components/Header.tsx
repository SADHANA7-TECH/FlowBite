import React from 'react';
import { UserRole, Tenant } from '../types';
import {
UtensilsCrossed,
ChefHat,
Users,
LayoutDashboard,
Layers,
LogIn,
LogOut,
UserCheck,
} from 'lucide-react';

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
onOpenAuthPage,
authUser,
onSignOut,
}) => {
const roles: {
role: UserRole;
label: string;
icon: React.ReactNode;
badgeColor: string;
}[] = [
{
role: 'customer',
label: 'Customer Portal',
icon: <UtensilsCrossed className="w-4 h-4" />,
badgeColor:
'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
},
{
role: 'kitchen',
label: 'Kitchen KDS',
icon: <ChefHat className="w-4 h-4" />,
badgeColor:
'bg-amber-500/10 text-amber-600 border-amber-500/30',
},
{
role: 'staff',
label: 'Waitstaff & Floor',
icon: <Users className="w-4 h-4" />,
badgeColor:
'bg-blue-500/10 text-blue-600 border-blue-500/30',
},
{
role: 'manager',
label: 'Manager Command',
icon: <LayoutDashboard className="w-4 h-4" />,
badgeColor:
'bg-purple-500/10 text-purple-600 border-purple-500/30',
},
];

return ( <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-50"> <div className="max-w-7xl mx-auto px-4">

```
    {/* Main Header */}
    <div className="flex items-center justify-between h-16 gap-4">

      {/* Logo & Tenant Switcher */}
      <div className="flex items-center space-x-3 shrink-0">

        {/* Logo */}
        <div className="flex items-center space-x-2">
          <div className="w-9 h-9 rounded-xl bg-orange-500 flex items-center justify-center">
            <UtensilsCrossed className="w-5 h-5 text-white" />
          </div>

          <div className="hidden sm:block">
            <div className="font-extrabold text-lg leading-none">
              FlowBite
            </div>

            <div className="text-[10px] text-orange-400 font-semibold uppercase tracking-wider">
              SaaS Engine
            </div>
          </div>
        </div>

        <div className="hidden md:block h-6 w-px bg-slate-800" />

        {/* Tenant Selection */}
        <div className="hidden md:flex items-center space-x-2 bg-slate-800/80 hover:bg-slate-800 text-slate-300 text-xs px-3 py-1.5 rounded-lg border border-slate-700/60 transition-colors">
          <Layers className="w-3.5 h-3.5 text-orange-400" />

          <select
            value={selectedTenant.id}
            onChange={(e) => {
              const found = tenants.find(
                (t) => t.id === e.target.value
              );

              if (found) {
                onTenantChange(found);
              }
            }}
            className="bg-transparent text-slate-200 font-medium focus:outline-none cursor-pointer"
          >
            {tenants.map((t) => (
              <option
                key={t.id}
                value={t.id}
                className="bg-slate-900 text-slate-200"
              >
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
              <span
                className={
                  isActive
                    ? 'text-orange-400'
                    : 'text-slate-500'
                }
              >
                {r.icon}
              </span>

              <span>{r.label}</span>
            </button>
          );
        })}
      </div>

      {/* Action Tools */}
      <div className="flex items-center space-x-2">

        {/* Authentication */}
        {authUser ? (
          <>
            <div className="hidden md:flex items-center gap-2 text-xs text-slate-300">
              <UserCheck className="w-4 h-4 text-emerald-400" />

              <span className="max-w-[180px] truncate">
                {authUser.email}
              </span>
            </div>

            <button
              onClick={onSignOut}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 transition-colors text-xs font-semibold"
            >
              <LogOut className="w-4 h-4" />

              <span className="hidden sm:inline">
                Sign Out
              </span>
            </button>
          </>
        ) : (
          <button
            onClick={onOpenAuthPage}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition-colors text-xs font-semibold"
          >
            <LogIn className="w-4 h-4" />

            <span>Sign In</span>
          </button>
        )}
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
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md whitespace-nowrap transition-all ${
              isActive
                ? 'bg-orange-500 text-white font-semibold'
                : 'text-slate-400 hover:text-slate-200'
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
