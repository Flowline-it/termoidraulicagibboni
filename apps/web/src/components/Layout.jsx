import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import DemoBanner from '@/demo/DemoBanner';
import {
  LayoutDashboard,
  CalendarClock,
  Phone,
  CalendarDays,
  Briefcase,
  Users,
  Flame,
  ClipboardList,
  FolderOpen,
  LogOut,
  Menu,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { RUOLI } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/scadenzario', label: 'Scadenzario', icon: CalendarClock },
  { to: '/chiamate', label: 'Chiamate', icon: Phone },
  { to: '/agenda', label: 'Agenda', icon: CalendarDays },
  { to: '/commesse', label: 'Commesse', icon: Briefcase },
  { to: '/clienti', label: 'Clienti', icon: Users },
  { to: '/impianti', label: 'Impianti', icon: Flame },
  { to: '/rapportini', label: 'Rapportini', icon: ClipboardList },
  { to: '/documenti', label: 'Documenti', icon: FolderOpen },
];

function Logo() {
  return (
    <div className="flex items-center gap-3 px-5 py-5">
      <span className="flex h-9 w-9 items-center justify-center bg-accent font-display text-xl font-bold text-accent-foreground">
        F
      </span>
      <div className="leading-tight">
        <p className="font-display text-lg font-bold tracking-wide text-white">FLOWLINE</p>
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/50">
          Termoidraulica Gibboni
        </p>
      </div>
    </div>
  );
}

function NavItems({ onNavigate }) {
  return (
    <nav className="flex flex-col gap-0.5 px-3">
      {NAV.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 border-l-2 px-3 py-2.5 text-sm transition-colors',
              isActive
                ? 'border-accent bg-white/10 font-semibold text-white'
                : 'border-transparent text-white/60 hover:bg-white/5 hover:text-white',
            )
          }
        >
          <Icon className="h-4 w-4 shrink-0" strokeWidth={1.8} />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}

function UserBlock() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const doLogout = () => {
    logout();
    navigate('/login');
  };
  return (
    <div className="mt-auto border-t border-white/10 px-5 py-4">
      <p className="truncate text-sm font-semibold text-white">{user?.name || user?.email}</p>
      <div className="mt-1.5 flex items-center justify-between gap-2">
        <span className="rounded-sm bg-accent px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-widest text-accent-foreground">
          {RUOLI[user?.role] || 'Utente'}
        </span>
        <button
          onClick={doLogout}
          title="Esci"
          className="flex h-8 w-8 items-center justify-center rounded-sm text-white/60 transition hover:bg-white/10 hover:text-white"
        >
          <LogOut className="h-4 w-4" strokeWidth={1.8} />
        </button>
      </div>
    </div>
  );
}

export function PageHeader({ caption, title, children }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-border pb-4">
      <div>
        <p className="mb-1 font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-accent">
          {caption}
        </p>
        <h1 className="font-display text-3xl font-bold leading-tight text-foreground md:text-4xl">
          {title}
        </h1>
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}

const Layout = () => {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-[100dvh] bg-background">
      <DemoBanner />
      {/* Sidebar desktop */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col bg-navy md:flex">
        <Logo />
        <NavItems />
        <UserBlock />
      </aside>

      {/* Barra mobile */}
      <header className="sticky top-0 z-30 flex items-center justify-between bg-navy px-4 py-2.5 md:hidden">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center bg-accent font-display text-base font-bold text-accent-foreground">
            F
          </span>
          <span className="font-display text-base font-bold tracking-wide text-white">FLOWLINE</span>
        </div>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button
              aria-label="Apri menu"
              className="flex h-10 w-10 items-center justify-center rounded-sm text-white hover:bg-white/10"
            >
              <Menu className="h-5 w-5" />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="flex w-64 flex-col border-0 bg-navy p-0 pt-2">
            <Logo />
            <NavItems onNavigate={() => setOpen(false)} />
            <UserBlock />
          </SheetContent>
        </Sheet>
      </header>

      <main className="px-4 py-6 md:ml-60 md:px-8 md:py-8">
        <div className="mx-auto w-full max-w-6xl">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
