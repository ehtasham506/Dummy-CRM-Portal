"use client";

import {
  CheckCircle2,
  CheckSquare,
  Info,
  KanbanSquare,
  LayoutDashboard,
  Menu,
  Plus,
  Search,
  Settings,
  Users,
  X,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { useCRM } from "@/lib/store";
import { cn, todayKey } from "@/lib/utils";
import { ContactFormModal } from "./ContactFormModal";
import { Button } from "./ui";

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/contacts", label: "Contacts", icon: Users },
  { href: "/pipeline", label: "Pipeline", icon: KanbanSquare },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/settings", label: "Settings", icon: Settings },
];

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2.5 px-2">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-sm font-bold text-white shadow-sm">
        DC
      </span>
      <span className="leading-tight">
        <span className="block text-sm font-semibold text-white">Dummy CRM</span>
        <span className="block text-xs text-slate-400">Demo Portal</span>
      </span>
    </Link>
  );
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { tasks, contacts, ready } = useCRM();
  const today = todayKey();
  const dueCount = tasks.filter((t) => !t.completed && t.dueDate <= today).length;

  return (
    <div className="flex h-full flex-col gap-6 bg-slate-900 px-3 py-5">
      <Logo />
      <nav className="flex flex-1 flex-col gap-1">
        <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Menu</p>
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          const badge =
            ready && href === "/tasks" && dueCount > 0
              ? dueCount
              : ready && href === "/contacts"
                ? contacts.length
                : null;
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active ? "bg-slate-800 text-white" : "text-slate-400 hover:bg-slate-800/60 hover:text-white",
              )}
            >
              <Icon className={cn("h-5 w-5", active ? "text-indigo-400" : "text-slate-500 group-hover:text-slate-300")} />
              <span className="flex-1">{label}</span>
              {badge !== null && (
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-xs",
                    href === "/tasks" ? "bg-rose-500/20 text-rose-300" : "bg-slate-700 text-slate-300",
                  )}
                >
                  {badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
      <div className="rounded-xl bg-slate-800/60 p-3">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-500/20 text-sm font-semibold text-indigo-300">
            AM
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-white">Alex Morgan</p>
            <p className="truncate text-xs text-slate-400">Sales Manager · Demo</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Toaster() {
  const { toasts, dismissToast } = useCRM();
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2">
      {toasts.map((t) => {
        const Icon = t.tone === "success" ? CheckCircle2 : t.tone === "error" ? XCircle : Info;
        return (
          <div
            key={t.id}
            className="toast-in pointer-events-auto flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-lg"
          >
            <Icon
              className={cn(
                "mt-0.5 h-5 w-5 shrink-0",
                t.tone === "success" ? "text-emerald-500" : t.tone === "error" ? "text-rose-500" : "text-indigo-500",
              )}
            />
            <p className="flex-1 text-sm text-slate-700">{t.message}</p>
            <button
              type="button"
              onClick={() => dismissToast(t.id)}
              className="text-slate-400 hover:text-slate-600"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [newOpen, setNewOpen] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => setMobileOpen(false), [pathname]);

  const onSearch = (e: FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    router.push(q ? `/contacts?q=${encodeURIComponent(q)}` : "/contacts");
    setQuery("");
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 lg:block">
        <SidebarContent />
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/60" onClick={() => setMobileOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[85%] shadow-xl">
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-5 z-10 rounded-md p-1 text-slate-400 hover:text-white"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
            <SidebarContent onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur sm:px-6">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="rounded-md p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <form onSubmit={onSearch} className="relative flex-1 max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search contacts…"
              className="w-full rounded-lg border-0 bg-slate-100 py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-500 focus:bg-white focus:ring-2 focus:ring-indigo-600"
            />
          </form>
          <div className="ml-auto flex items-center gap-2">
            <span className="hidden rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20 md:inline">
              Demo data · stored locally
            </span>
            <Button onClick={() => setNewOpen(true)}>
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">New contact</span>
            </Button>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>

      <ContactFormModal open={newOpen} onClose={() => setNewOpen(false)} />
      <Toaster />
    </div>
  );
}
