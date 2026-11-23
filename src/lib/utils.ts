import type { LifecycleStage, TaskPriority } from "./types";

export function uid(prefix = "id"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`;
}

export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function fullName(c: { firstName: string; lastName: string }): string {
  return `${c.firstName} ${c.lastName}`.trim();
}

export function initials(c: { firstName: string; lastName: string }): string {
  return `${c.firstName[0] ?? ""}${c.lastName[0] ?? ""}`.toUpperCase();
}

export function formatCurrency(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = iso.length === 10 ? new Date(`${iso}T00:00:00`) : new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.round(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.round(months / 12)}y ago`;
}

/** Local date as YYYY-MM-DD */
export function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function todayKey(): string {
  return toDateKey(new Date());
}

export type DueStatus = "overdue" | "today" | "upcoming";

export function dueStatus(dueDate: string): DueStatus {
  const t = todayKey();
  if (dueDate < t) return "overdue";
  if (dueDate === t) return "today";
  return "upcoming";
}

export const STAGE_STYLES: Record<
  LifecycleStage,
  { badge: string; dot: string; column: string; bar: string }
> = {
  Subscriber: {
    badge: "bg-sky-50 text-sky-700 ring-sky-600/20",
    dot: "bg-sky-500",
    column: "border-t-sky-500",
    bar: "bg-sky-500",
  },
  Engaged: {
    badge: "bg-indigo-50 text-indigo-700 ring-indigo-600/20",
    dot: "bg-indigo-500",
    column: "border-t-indigo-500",
    bar: "bg-indigo-500",
  },
  Hot: {
    badge: "bg-orange-50 text-orange-700 ring-orange-600/20",
    dot: "bg-orange-500",
    column: "border-t-orange-500",
    bar: "bg-orange-500",
  },
  "In Conversation": {
    badge: "bg-violet-50 text-violet-700 ring-violet-600/20",
    dot: "bg-violet-500",
    column: "border-t-violet-500",
    bar: "bg-violet-500",
  },
  Client: {
    badge: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    dot: "bg-emerald-500",
    column: "border-t-emerald-500",
    bar: "bg-emerald-500",
  },
  Dormant: {
    badge: "bg-slate-100 text-slate-600 ring-slate-500/20",
    dot: "bg-slate-400",
    column: "border-t-slate-400",
    bar: "bg-slate-400",
  },
  "Do Not Contact": {
    badge: "bg-rose-50 text-rose-700 ring-rose-600/20",
    dot: "bg-rose-500",
    column: "border-t-rose-500",
    bar: "bg-rose-500",
  },
};

export const PRIORITY_STYLES: Record<TaskPriority, string> = {
  Low: "bg-slate-100 text-slate-600 ring-slate-500/20",
  Medium: "bg-amber-50 text-amber-700 ring-amber-600/20",
  High: "bg-rose-50 text-rose-700 ring-rose-600/20",
};

const AVATAR_COLORS = [
  "bg-blue-100 text-blue-700",
  "bg-emerald-100 text-emerald-700",
  "bg-violet-100 text-violet-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
  "bg-cyan-100 text-cyan-700",
  "bg-fuchsia-100 text-fuchsia-700",
  "bg-lime-100 text-lime-700",
];

export function avatarColor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

export function downloadCSV(filename: string, rows: (string | number)[][]): void {
  const csv = rows
    .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
